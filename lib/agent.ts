const PROJECT_NUMBER = process.env.GCP_PROJECT_NUMBER!;
const LOCATION = process.env.GCP_LOCATION || "us-central1";
const ENGINE_ID = process.env.REASONING_ENGINE_ID!;

const SERVICE_URL = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_NUMBER}/locations/${LOCATION}/reasoningEngines/${ENGINE_ID}`;

const SCOPE = "https://www.googleapis.com/auth/cloud-platform";

// ---------------------------------------------------------------------------
// Auth
//
// Cloudflare Workers cannot run `google-auth-library`: it signs JWTs and calls
// the token endpoint via Node's `https.request`, which the Workers runtime does
// not implement (you get "[unenv] https.request is not implemented yet!"). So
// when a service-account key is supplied we mint the access token ourselves
// using WebCrypto + fetch, both of which are native on Workers.
//
// Locally (no key set) we fall back to Application Default Credentials via
// google-auth-library, dynamically imported so it never runs on the worker.
// ---------------------------------------------------------------------------

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function base64url(input: ArrayBuffer | string): string {
  let binary: string;
  if (typeof input === "string") {
    binary = input;
  } else {
    const bytes = new Uint8Array(input);
    binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = atob(body);
  const buf = new Uint8Array(der.length);
  for (let i = 0; i < der.length; i++) buf[i] = der.charCodeAt(i);
  return buf.buffer;
}

/** Mint an OAuth2 access token from a service-account key using WebCrypto. */
async function tokenFromServiceAccount(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) return cachedToken.token;

  const tokenUri = sa.token_uri || "https://oauth2.googleapis.com/token";
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPE,
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${claims}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );
  const assertion = `${signingInput}.${base64url(signature)}`;

  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`token exchange failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: now + data.expires_in };
  return data.access_token;
}

/** Local-only fallback: Application Default Credentials via google-auth-library. */
async function tokenFromADC(): Promise<string> {
  const { GoogleAuth } = await import("google-auth-library");
  const auth = new GoogleAuth({ scopes: [SCOPE] });
  const token = await auth.getAccessToken();
  if (!token) {
    throw new Error(
      "Could not obtain GCP access token. Run `gcloud auth application-default login` (local) or set GOOGLE_SERVICE_ACCOUNT_KEY (deployed)."
    );
  }
  return token;
}

async function bearer(): Promise<string> {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    let sa: ServiceAccount;
    try {
      sa = JSON.parse(raw);
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON.");
    }
    if (!sa.client_email || !sa.private_key) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is missing client_email or private_key.");
    }
    return tokenFromServiceAccount(sa);
  }
  return tokenFromADC();
}

export async function createSession(userId: string): Promise<string> {
  const res = await fetch(`${SERVICE_URL}:query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await bearer()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      class_method: "async_create_session",
      input: { user_id: userId },
    }),
  });
  if (!res.ok) {
    throw new Error(`createSession failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { output?: { id?: string } };
  const id = data.output?.id;
  if (!id) throw new Error("Agent Runtime returned no session id");
  return id;
}

/** Calls `:streamQuery` and returns the upstream ReadableStream of NDJSON lines. */
export async function streamQuery(opts: {
  userId: string;
  sessionId: string;
  message: string;
}): Promise<Response> {
  const res = await fetch(`${SERVICE_URL}:streamQuery?alt=sse`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await bearer()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      class_method: "async_stream_query",
      input: {
        user_id: opts.userId,
        session_id: opts.sessionId,
        message: opts.message,
      },
    }),
  });
  return res;
}

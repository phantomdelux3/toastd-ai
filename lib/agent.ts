import { GoogleAuth } from "google-auth-library";

const PROJECT_NUMBER = process.env.GCP_PROJECT_NUMBER!;
const LOCATION = process.env.GCP_LOCATION || "us-central1";
const ENGINE_ID = process.env.REASONING_ENGINE_ID!;

const SERVICE_URL = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_NUMBER}/locations/${LOCATION}/reasoningEngines/${ENGINE_ID}`;

let authClient: GoogleAuth | null = null;
function getAuth() {
  if (!authClient) {
    authClient = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
  }
  return authClient;
}

async function bearer(): Promise<string> {
  const token = await getAuth().getAccessToken();
  if (!token) throw new Error("Could not obtain GCP access token. Run `gcloud auth application-default login`.");
  return token;
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

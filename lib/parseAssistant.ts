import type { CuantoMerchant, CuantoPayload, CuantoProduct, QuestionPayload } from "./types";

/**
 * The agent is instructed to respond with EITHER:
 *  - a fenced ```json block containing { type: "question", title, options[] }
 *  - or plain markdown (greeting or product cards).
 *
 * Try to extract a question payload. Returns null if the text isn't a question.
 */
export function tryExtractQuestion(raw: string): QuestionPayload | null {
  if (!raw) return null;
  const text = raw.trim();

  // Match ```json ... ```  (also tolerate plain ``` ... ``` and bare JSON).
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : text;

  // Look for the first { ... } chunk inside the candidate
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  const jsonText = candidate.slice(start, end + 1);
  try {
    const obj = JSON.parse(jsonText);
    if (
      obj &&
      obj.type === "question" &&
      typeof obj.title === "string" &&
      Array.isArray(obj.options)
    ) {
      const options = obj.options
        .filter((o: any) => o && typeof o.label === "string")
        .map((o: any) => ({ label: o.label, hint: typeof o.hint === "string" ? o.hint : undefined }));
      if (options.length === 0) return null;
      return { type: "question", title: obj.title, options };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Returns true if the streaming text looks like it's building a question
 * payload (a fenced ```json block or a bare JSON object). Used to suppress
 * rendering the raw JSON mid-stream — we show a placeholder until the full
 * payload arrives and can be parsed into a QuestionCard.
 *
 * The agent only emits fenced code / bare JSON for question payloads; plain
 * answers are markdown, so this won't hide normal responses.
 */
export function looksLikeQuestionInProgress(raw: string): boolean {
  const t = raw.trimStart();
  if (!t) return false;
  return t.startsWith("```") || t.startsWith("{");
}

/**
 * Returns true if the raw text is *probably* a complete question payload
 * (used during streaming to decide if we should switch to QuestionCard).
 * Looser than tryExtractQuestion — checks for closing brace + bracket.
 */
export function looksLikeCompleteQuestion(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  // Has json fence-end or naked JSON with closing brace + at least one close-bracket
  const hasFenceEnd = /```/g.test(t.slice(3));
  const hasJsonClose = /}\s*$/.test(t.replace(/```\s*$/, "").trim());
  return hasFenceEnd || hasJsonClose;
}

// ---------------------------------------------------------------------------
// Cuanto recommendations
//
// When the agent recommends products it appends ONE fenced ```cuanto block of
// JSON at the end of its markdown. We split that off so it renders as its own
// "Cuanto picks" section instead of raw JSON inside the message.
// ---------------------------------------------------------------------------

const CUANTO_FENCE = "```cuanto";
/** Only tracked Cuanto redirect links are allowed (attribution + no hallucinated URLs). */
const CUANTO_LINK = /^https:\/\/(www\.)?getcuanto\.ai\/redirect\?/;

function safeHttpsUrl(u: unknown): string | undefined {
  return typeof u === "string" && /^https:\/\//.test(u) ? u : undefined;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function normalizeCuanto(obj: any): CuantoPayload | null {
  if (!obj || typeof obj !== "object") return null;
  const products: CuantoProduct[] = (Array.isArray(obj.products) ? obj.products : [])
    .filter((p: any) => p && typeof p.title === "string" && CUANTO_LINK.test(String(p.redirect_url)))
    .map((p: any) => ({
      title: p.title,
      brand: typeof p.brand === "string" ? p.brand : undefined,
      merchant: typeof p.merchant === "string" ? p.merchant : undefined,
      price: num(p.price),
      sale_price: num(p.sale_price),
      currency: typeof p.currency === "string" ? p.currency : undefined,
      image_url: safeHttpsUrl(p.image_url),
      redirect_url: p.redirect_url,
      reason: typeof p.reason === "string" ? p.reason : undefined,
    }));
  const merchants: CuantoMerchant[] = (Array.isArray(obj.merchants) ? obj.merchants : [])
    .filter((m: any) => m && typeof m.name === "string" && CUANTO_LINK.test(String(m.redirect_url)))
    .map((m: any) => ({
      name: m.name,
      website: typeof m.website === "string" ? m.website : undefined,
      logo_url: safeHttpsUrl(m.logo_url),
      redirect_url: m.redirect_url,
      reason: typeof m.reason === "string" ? m.reason : undefined,
    }));
  if (products.length === 0 && merchants.length === 0) return null;
  return { products, merchants };
}

/**
 * Splits assistant text into the markdown body and the Cuanto payload.
 *  - `pending` is true while the cuanto block is still streaming in.
 */
export function splitCuanto(raw: string): {
  text: string;
  cuanto: CuantoPayload | null;
  pending: boolean;
} {
  const idx = raw.indexOf(CUANTO_FENCE);
  if (idx < 0) {
    // Hide a partially-streamed fence opener at the tail (e.g. "```cua").
    const tail = raw.slice(-CUANTO_FENCE.length);
    for (let n = CUANTO_FENCE.length - 1; n >= 3; n--) {
      if (tail.endsWith(CUANTO_FENCE.slice(0, n))) {
        return { text: raw.slice(0, raw.length - n).trimEnd(), cuanto: null, pending: true };
      }
    }
    return { text: raw, cuanto: null, pending: false };
  }

  const text = raw.slice(0, idx).trimEnd();
  const after = raw.slice(idx + CUANTO_FENCE.length);
  const close = after.indexOf("```");
  if (close < 0) return { text, cuanto: null, pending: true };

  const body = after.slice(0, close);
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  let cuanto: CuantoPayload | null = null;
  if (start >= 0 && end > start) {
    try {
      cuanto = normalizeCuanto(JSON.parse(body.slice(start, end + 1)));
    } catch {
      cuanto = null;
    }
  }
  // Anything the model wrote after the block is kept in the markdown body.
  const trailing = after.slice(close + 3).trim();
  return { text: trailing ? `${text}\n\n${trailing}` : text, cuanto, pending: false };
}

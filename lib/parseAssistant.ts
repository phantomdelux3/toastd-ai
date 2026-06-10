import type { QuestionPayload } from "./types";

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

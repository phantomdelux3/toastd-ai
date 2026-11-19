import { NextRequest } from "next/server";
import { streamQuery } from "@/lib/agent";

export const runtime = "nodejs";

/**
 * Proxies a single user message to Agent Runtime and streams back NDJSON.
 *
 * Request body: { userId: string, sessionId: string, message: string }
 * Response: application/x-ndjson — one JSON object per line:
 *   { "k": "t", "v": "<text chunk>" }                 assistant text to append
 *   { "k": "cards", "key": "ui_…", "items": [...] }   structured product cards
 *
 * The agent's tools write display cards (images, prices, tracked links) to
 * session state under `ui_*` keys. Those state deltas ride along on the
 * Agent Runtime events but are never sent to the model, so the UI receives
 * exact structured data while the model only emits compact ids + reasons.
 */
export async function POST(req: NextRequest) {
  const { userId, sessionId, message } = await req.json();
  if (!userId || !sessionId || !message) {
    return new Response(JSON.stringify({ error: "userId, sessionId, message required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const upstream = await streamQuery({ userId, sessionId, message });
  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return new Response(JSON.stringify({ error: `Agent Runtime ${upstream.status}: ${text}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      const handleLine = (rawLine: string) => {
        // NDJSON / SSE: each line is one event (may be prefixed by 'data: ' for SSE)
        const line = rawLine.startsWith("data: ") ? rawLine.slice(6) : rawLine;
        const trimmed = line.trim();
        if (!trimmed) return;
        let event: any;
        try {
          event = JSON.parse(trimmed);
        } catch {
          return; // ignore non-JSON lines
        }
        const delta = event?.actions?.state_delta ?? event?.actions?.stateDelta;
        if (delta && typeof delta === "object") {
          for (const [key, items] of Object.entries(delta)) {
            if (key.startsWith("ui_") && Array.isArray(items)) emit({ k: "cards", key, items });
          }
        }
        const parts = event?.content?.parts;
        if (Array.isArray(parts)) {
          for (const p of parts) {
            // Skip hidden reasoning ("thought") parts.
            if (typeof p?.text === "string" && p.text.length > 0 && !p.thought) {
              emit({ k: "t", v: p.text });
            }
          }
        }
      };

      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const l of lines) handleLine(l);
        }
        if (buffer) handleLine(buffer);
      } catch (err) {
        controller.error(err);
        return;
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

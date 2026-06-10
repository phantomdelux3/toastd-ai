import { NextRequest } from "next/server";
import { streamQuery } from "@/lib/agent";

export const runtime = "nodejs";

/**
 * Proxies a single user message to Agent Runtime and streams back assembled
 * assistant text as plain text chunks.
 *
 * Request body: { userId: string, sessionId: string, message: string }
 * Response: text/plain stream — each chunk appends to the running assistant
 *           message. The frontend parses the final assembled string to detect
 *           whether the assistant returned a structured-question JSON block
 *           or plain markdown.
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
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          // NDJSON / SSE: split on newlines, each line is one event (may be prefixed by 'data: ' for SSE)
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const rawLine of lines) {
            const line = rawLine.startsWith("data: ") ? rawLine.slice(6) : rawLine;
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const event = JSON.parse(trimmed);
              // event.content.parts[].text → emit each chunk
              const parts = event?.content?.parts;
              if (Array.isArray(parts)) {
                for (const p of parts) {
                  if (typeof p?.text === "string" && p.text.length > 0) {
                    controller.enqueue(encoder.encode(p.text));
                  }
                }
              }
            } catch {
              // ignore non-JSON lines
            }
          }
        }
        // flush any remaining buffer
        const last = buffer.startsWith("data: ") ? buffer.slice(6) : buffer;
        const lastTrim = last.trim();
        if (lastTrim) {
          try {
            const event = JSON.parse(lastTrim);
            const parts = event?.content?.parts;
            if (Array.isArray(parts)) {
              for (const p of parts) {
                if (typeof p?.text === "string" && p.text.length > 0) {
                  controller.enqueue(encoder.encode(p.text));
                }
              }
            }
          } catch {}
        }
      } catch (err) {
        controller.error(err);
        return;
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

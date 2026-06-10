"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowUp, Loader2 } from "lucide-react";
import { QuestionCard } from "@/components/QuestionCard";
import { MarkdownMessage } from "@/components/MarkdownMessage";
import { tryExtractQuestion } from "@/lib/parseAssistant";
import type { ChatTurn } from "@/lib/types";

type Session = { sessionId: string; userId: string };

export function ChatView() {
  const search = useSearchParams();
  const router = useRouter();
  const initialQuestion = search.get("q") || "";

  const [session, setSession] = useState<Session | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sentInitial = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 1. Bootstrap session
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/session", { method: "POST" });
        if (!res.ok) throw new Error(`session ${res.status}: ${await res.text()}`);
        const data = await res.json();
        if (!cancelled) setSession({ sessionId: data.sessionId, userId: data.userId });
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to create session");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Send a message — streams assistant text back, finalizes to a turn
  const send = useCallback(
    async (message: string) => {
      if (!session || !message.trim() || pending) return;
      setError(null);
      const userTurn: ChatTurn = { id: crypto.randomUUID(), role: "user", text: message };
      // optimistic placeholder for the assistant
      const placeholderId = crypto.randomUUID();
      setTurns((t) => [
        ...t,
        userTurn,
        { id: placeholderId, role: "assistant", kind: "text", text: "" },
      ]);
      setPending(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.userId,
            sessionId: session.sessionId,
            message,
          }),
        });
        if (!res.ok || !res.body) {
          const t = await res.text().catch(() => "");
          throw new Error(`/api/chat ${res.status}: ${t}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assembled = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          assembled += decoder.decode(value, { stream: true });
          // live-update the placeholder text
          setTurns((t) =>
            t.map((tn) =>
              tn.id === placeholderId && tn.role === "assistant"
                ? { ...tn, kind: "text", text: assembled }
                : tn
            )
          );
        }
        // Finalize: parse for question payload
        const q = tryExtractQuestion(assembled);
        setTurns((t) =>
          t.map((tn) => {
            if (tn.id !== placeholderId || tn.role !== "assistant") return tn;
            if (q) return { id: tn.id, role: "assistant", kind: "question", question: q };
            return { id: tn.id, role: "assistant", kind: "text", text: assembled };
          })
        );
      } catch (e: any) {
        setError(e?.message || "Something went wrong");
        // remove placeholder
        setTurns((t) => t.filter((tn) => tn.id !== placeholderId));
      } finally {
        setPending(false);
      }
    },
    [session, pending]
  );

  // 3. Auto-send the homepage seed once session is ready
  useEffect(() => {
    if (session && initialQuestion && !sentInitial.current) {
      sentInitial.current = true;
      send(initialQuestion);
    }
  }, [session, initialQuestion, send]);

  // 4. Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, pending]);

  // 5. Find latest assistant question (only the LAST one stays interactive)
  const latestQuestionId = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i--) {
      const t = turns[i];
      if (t.role === "assistant" && t.kind === "question") return t.id;
    }
    return null;
  }, [turns]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 backdrop-blur bg-black/60 border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
          >
            <ArrowLeft className="size-4" /> Home
          </button>
          <div className="flex-1" />
          <div className="text-xs text-white/40">
            {session ? "Session active" : "Connecting…"}
          </div>
        </div>
      </header>

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 pb-40">
          {turns.length === 0 && !pending && !error && (
            <div className="text-white/40 text-sm">Starting conversation…</div>
          )}
          {turns.map((turn) => {
            if (turn.role === "user") {
              return (
                <div key={turn.id} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-white text-black px-4 py-2.5 text-[15px] leading-6">
                    {turn.text}
                  </div>
                </div>
              );
            }
            if (turn.kind === "question") {
              const interactive = turn.id === latestQuestionId && !pending;
              return (
                <div key={turn.id} className="flex">
                  <div className="max-w-[92%] w-full">
                    <QuestionCard
                      question={turn.question}
                      disabled={!interactive}
                      onAnswer={(answer) => send(answer)}
                    />
                  </div>
                </div>
              );
            }
            return (
              <div key={turn.id} className="flex">
                <div className="max-w-[92%] w-full rounded-2xl rounded-bl-md bg-white/[0.04] border border-white/5 px-4 py-3">
                  {turn.text ? <MarkdownMessage text={turn.text} /> : (
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <Loader2 className="size-4 animate-spin" /> Thinking…
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3 text-sm">
              {error}
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-black/70 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = input.trim();
              if (!v) return;
              setInput("");
              send(v);
            }}
            className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 focus-within:border-white/30 transition"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const v = input.trim();
                  if (!v) return;
                  setInput("");
                  send(v);
                }
              }}
              rows={1}
              placeholder={
                session ? "Type a message…" : "Connecting to agent…"
              }
              disabled={!session || pending}
              className="flex-1 resize-none bg-transparent outline-none px-3 py-2.5 text-base placeholder:text-white/40 max-h-40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!session || pending || !input.trim()}
              aria-label="Send"
              className="shrink-0 inline-flex size-10 items-center justify-center rounded-xl bg-white text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition"
            >
              {pending ? <Loader2 className="size-5 animate-spin" /> : <ArrowUp className="size-5" />}
            </button>
          </form>
          <p className="mt-1.5 text-[11px] text-white/40 text-center">
            Toastd recommends products via Vertex AI · responses may be inaccurate
          </p>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowUp, Loader2, Sparkles } from "lucide-react";
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
  const [inputFocused, setInputFocused] = useState(false);
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
          setTurns((t) =>
            t.map((tn) =>
              tn.id === placeholderId && tn.role === "assistant"
                ? { ...tn, kind: "text", text: assembled }
                : tn
            )
          );
        }
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
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-black/40 border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition rounded-lg px-2 py-1 -ml-2 hover:bg-white/5"
          >
            <ArrowLeft className="size-4" /> Home
          </button>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <span className="brand-mark inline-block size-5 rounded-md shadow-[0_2px_12px_-2px_rgba(244,63,94,0.6)]" />
              <span>toastd</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/45">
            <span
              className={`inline-block size-1.5 rounded-full ${
                session ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-pulse"
              }`}
            />
            {session ? "Live" : "Connecting"}
          </div>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5 pb-40">
          {turns.length === 0 && !pending && !error && (
            <div className="flex items-center gap-2 text-white/45 text-sm animate-fade-in">
              <Sparkles className="size-4 text-rose-300" />
              Starting conversation…
            </div>
          )}
          {turns.map((turn) => {
            if (turn.role === "user") {
              return (
                <div key={turn.id} className="flex justify-end animate-fade-in-up">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-white text-black px-4 py-2.5 text-[15px] leading-6 shadow-[0_8px_30px_-12px_rgba(255,255,255,0.25)]">
                    {turn.text}
                  </div>
                </div>
              );
            }
            if (turn.kind === "question") {
              const interactive = turn.id === latestQuestionId && !pending;
              return (
                <div key={turn.id} className="flex gap-3 animate-fade-in-up">
                  <AssistantAvatar />
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
              <div key={turn.id} className="flex gap-3 animate-fade-in-up">
                <AssistantAvatar />
                <div className="max-w-[92%] w-full rounded-2xl rounded-tl-md bg-white/[0.04] border border-white/[0.06] px-4 py-3 backdrop-blur-sm">
                  {turn.text ? (
                    <MarkdownMessage text={turn.text} />
                  ) : (
                    <div className="flex items-center gap-1 text-white/60 text-sm py-1">
                      <span className="thinking-dot" />
                      <span className="thinking-dot" />
                      <span className="thinking-dot" />
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

      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/[0.06] bg-black/60 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = input.trim();
              if (!v) return;
              setInput("");
              send(v);
            }}
            className={`flex items-end gap-2 rounded-2xl border bg-white/[0.04] p-2 transition-all duration-300 ${
              inputFocused
                ? "border-white/25 shadow-input-glow-focus"
                : "border-white/10"
            }`}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
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
              placeholder={session ? "Type a message…" : "Connecting to agent…"}
              disabled={!session || pending}
              className="flex-1 resize-none bg-transparent outline-none px-3 py-2.5 text-base placeholder:text-white/40 max-h-40 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!session || pending || !input.trim()}
              aria-label="Send"
              className="shrink-0 inline-flex size-10 items-center justify-center rounded-xl bg-white text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 active:scale-95 transition"
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

function AssistantAvatar() {
  return (
    <div className="hidden sm:flex shrink-0 size-8 mt-1 items-center justify-center rounded-xl brand-mark shadow-[0_4px_16px_-4px_rgba(244,63,94,0.5)]">
      <Sparkles className="size-4 text-white" />
    </div>
  );
}

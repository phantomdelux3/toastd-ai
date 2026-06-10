"use client";

import { useState } from "react";
import { ArrowUp, Check, PencilLine, X } from "lucide-react";
import type { QuestionPayload } from "@/lib/types";

export function QuestionCard({
  question,
  disabled = false,
  onAnswer,
  onDismiss,
}: {
  question: QuestionPayload;
  disabled?: boolean;
  onAnswer: (answer: string) => void;
  onDismiss?: () => void;
}) {
  const [custom, setCustom] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  function pick(label: string, idx: number) {
    if (disabled) return;
    setSelected(idx);
    onAnswer(label);
  }

  function submitCustom() {
    const v = custom.trim();
    if (!v || disabled) return;
    onAnswer(v);
  }

  return (
    <div
      role="group"
      className="flex w-full flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#141414]/90 backdrop-blur-xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.6)] sm:rounded-3xl animate-fade-in-up"
    >
      <div className="relative flex items-center gap-2 p-4 pb-2">
        <div className="size-1.5 rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-400" />
        <h3 className="flex-1 min-w-0 text-balance font-semibold leading-6 text-white sm:text-lg sm:leading-7">
          {question.title}
        </h3>
        {onDismiss && (
          <button
            type="button"
            aria-label="Close"
            onClick={onDismiss}
            className="flex size-5 items-center justify-center rounded transition-opacity hover:opacity-80 text-white/60"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <div role="radiogroup" className="flex flex-col px-1.5 pb-1.5 sm:px-2 sm:pb-2">
        {question.options.map((opt, idx) => (
          <div key={`${opt.label}-${idx}`}>
            <button
              type="button"
              role="radio"
              aria-checked={selected === idx}
              tabIndex={0}
              disabled={disabled}
              onClick={() => pick(opt.label, idx)}
              className={`group/row flex min-h-[55px] md:min-h-[70px] w-full items-center justify-between gap-3 px-3 py-2 text-left transition-all duration-200 sm:gap-4 sm:py-4 rounded-xl
                ${
                  selected === idx
                    ? "bg-gradient-to-r from-rose-500/15 via-fuchsia-500/10 to-orange-400/5 ring-1 ring-white/15"
                    : "hover:bg-white/[0.04] hover:translate-x-0.5"
                }
                disabled:cursor-default disabled:opacity-60`}
            >
              <span className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <span
                  aria-hidden="true"
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-all sm:size-8 ${
                    selected === idx
                      ? "brand-mark text-white"
                      : "bg-white/10 text-white/60 group-hover/row:bg-white/15 group-hover/row:text-white/85"
                  }`}
                >
                  {selected === idx ? (
                    <Check className="size-3.5 sm:size-4" />
                  ) : (
                    <span className="text-xs leading-4 tabular-nums sm:text-sm sm:leading-5">
                      {idx + 1}
                    </span>
                  )}
                </span>
                <span className="flex min-w-0 flex-col items-start">
                  <span className="text-sm font-medium leading-5 text-white">
                    {opt.label}
                  </span>
                  {opt.hint && (
                    <span className="text-xs leading-4 text-white/60">{opt.hint}</span>
                  )}
                </span>
              </span>
              <ArrowUp
                aria-hidden
                className={`size-4 rotate-45 shrink-0 transition-all ${
                  selected === idx
                    ? "text-white/80 translate-x-0"
                    : "text-white/0 group-hover/row:text-white/60 group-hover/row:translate-x-0 -translate-x-1"
                }`}
              />
            </button>
            {idx < question.options.length - 1 && (
              <div aria-hidden="true" className="px-3">
                <div className="h-px w-full bg-white/[0.06]" />
              </div>
            )}
          </div>
        ))}

        {/* "Something else" row */}
        <div aria-hidden="true" className="px-3">
          <div className="h-px w-full bg-white/[0.06]" />
        </div>
        <div className="flex items-center gap-3 px-3 py-2 sm:gap-4 sm:py-3 rounded-xl">
          <div
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/60"
          >
            <PencilLine className="size-4" />
          </div>
          <div className="flex min-w-0 flex-1 items-center">
            <textarea
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitCustom();
                }
              }}
              placeholder="Something else…"
              aria-label="Other answer"
              disabled={disabled}
              rows={1}
              className="min-w-0 w-full resize-none border-none bg-transparent text-sm font-medium leading-5 text-white outline-none placeholder:text-white/40"
            />
          </div>
          <button
            type="button"
            onClick={submitCustom}
            disabled={disabled || !custom.trim()}
            aria-label="Send custom answer"
            className="group/skip flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-black hover:bg-white/90 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

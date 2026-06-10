"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  Sparkles,
  Gift,
  Sparkle,
  Home,
  BookOpen,
  ShieldCheck,
  Zap,
  Store,
} from "lucide-react";

const SUGGESTIONS = [
  { label: "A birthday gift for my sister", icon: Gift },
  { label: "Skincare for combination skin", icon: Sparkle },
  { label: "Aesthetic home decor under ₹2000", icon: Home },
  { label: "A premium notebook for daily journaling", icon: BookOpen },
];

const TRUST = [
  { icon: Store, label: "10,000+ brands" },
  { icon: Zap, label: "Personalized in seconds" },
  { icon: ShieldCheck, label: "No sign-up needed" },
];

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  function start(seed: string) {
    if (!seed.trim()) return;
    setLoading(true);
    const params = new URLSearchParams({ q: seed });
    router.push(`/chat?${params.toString()}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4">
      <header className="w-full max-w-6xl py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
          <span className="brand-mark inline-block size-7 rounded-lg shadow-[0_4px_20px_-4px_rgba(244,63,94,0.6)]" />
          <span>toastd</span>
        </div>
        <nav className="text-sm text-white/60 hidden sm:flex gap-7">
          <a href="#" className="hover:text-white transition-colors">How it works</a>
          <a href="#" className="hover:text-white transition-colors">Brands</a>
          <a href="#" className="hover:text-white transition-colors">About</a>
        </nav>
      </header>

      <section className="w-full max-w-3xl mt-14 sm:mt-20 text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur px-3.5 py-1.5 text-xs text-white/75">
          <Sparkles className="size-3.5 text-rose-300" />
          AI Personal Shopping Assistant
        </div>
        <h1 className="mt-6 text-balance font-display text-5xl sm:text-7xl leading-[1.02] tracking-tight">
          Find the{" "}
          <em className="italic font-display bg-gradient-to-r from-rose-300 via-fuchsia-300 to-orange-200 bg-clip-text text-transparent">
            perfect
          </em>{" "}
          product
          <br className="hidden sm:block" /> without the endless scrolling.
        </h1>
        <p className="mt-5 text-white/60 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Tell us what you need. We&apos;ll ask a couple of quick questions, then surface the
          best matches across thousands of brands.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(q);
          }}
          className="mt-10 mx-auto max-w-2xl"
        >
          <div
            className={`flex items-end gap-2 rounded-2xl border bg-white/[0.04] backdrop-blur p-2 transition-all duration-300 ${
              focused
                ? "border-white/25 shadow-input-glow-focus"
                : "border-white/10 shadow-input-glow"
            }`}
          >
            <textarea
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  start(q);
                }
              }}
              rows={1}
              placeholder="What are you shopping for?"
              className="flex-1 resize-none bg-transparent outline-none px-3 py-3 text-base placeholder:text-white/40 max-h-40"
            />
            <button
              type="submit"
              disabled={loading || !q.trim()}
              aria-label="Send"
              className="shrink-0 inline-flex size-10 items-center justify-center rounded-xl bg-white text-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90 active:scale-95 transition"
            >
              <ArrowUp className="size-5" />
            </button>
          </div>
        </form>

        {/* Suggestion cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto">
          {SUGGESTIONS.map(({ label, icon: Icon }, i) => (
            <button
              key={label}
              onClick={() => start(label)}
              style={{ animationDelay: `${100 + i * 60}ms` }}
              className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 px-3.5 py-3 text-left text-sm text-white/80 hover:text-white transition-all animate-fade-in-up"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-rose-200 group-hover:bg-white/10 group-hover:text-rose-100 transition">
                <Icon className="size-4" />
              </span>
              <span className="flex-1 truncate">{label}</span>
              <ArrowUp className="size-3.5 rotate-45 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </button>
          ))}
        </div>

        {/* Trust row */}
        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs text-white/45">
          {TRUST.map(({ icon: Icon, label }) => (
            <div key={label} className="inline-flex items-center gap-1.5">
              <Icon className="size-3.5" />
              {label}
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto pt-20 pb-6 text-xs text-white/35 flex items-center gap-1.5">
        <span className="inline-block size-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
        Powered by Vertex AI Agent Runtime on Google Cloud
      </footer>
    </main>
  );
}

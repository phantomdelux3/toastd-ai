"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "A birthday gift for my sister",
  "Skincare for combination skin",
  "Aesthetic home decor under ₹2000",
  "A premium notebook for daily journaling",
];

export default function HomePage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  function start(seed: string) {
    if (!seed.trim()) return;
    setLoading(true);
    const params = new URLSearchParams({ q: seed });
    router.push(`/chat?${params.toString()}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4">
      <header className="w-full max-w-6xl py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="inline-block size-7 rounded-md bg-gradient-to-br from-rose-500 via-fuchsia-500 to-orange-400" />
          toastd
        </div>
        <nav className="text-sm text-white/60 hidden sm:flex gap-6">
          <a href="#" className="hover:text-white">How it works</a>
          <a href="#" className="hover:text-white">Brands</a>
          <a href="#" className="hover:text-white">About</a>
        </nav>
      </header>

      <section className="w-full max-w-3xl mt-16 sm:mt-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
          <Sparkles className="size-3.5" />
          AI Personal Shopping Assistant
        </div>
        <h1 className="mt-5 text-balance font-display text-4xl sm:text-6xl leading-[1.05] tracking-tight">
          Find the <em className="italic font-display text-white/85">perfect</em> product
          <br className="hidden sm:block" /> without the endless scrolling.
        </h1>
        <p className="mt-4 text-white/60 text-base sm:text-lg max-w-xl mx-auto">
          Tell us what you need. We&apos;ll ask a couple of quick questions, then surface the best matches across thousands of brands.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(q);
          }}
          className="mt-10 mx-auto max-w-2xl"
        >
          <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 focus-within:border-white/30 transition">
            <textarea
              value={q}
              onChange={(e) => setQ(e.target.value)}
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
              className="shrink-0 inline-flex size-10 items-center justify-center rounded-xl bg-white text-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90 transition"
            >
              <ArrowUp className="size-5" />
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => start(s)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <footer className="mt-24 mb-6 text-xs text-white/40">
        Powered by Vertex AI Agent Runtime on Google Cloud
      </footer>
    </main>
  );
}

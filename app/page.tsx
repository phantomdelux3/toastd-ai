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
  Loader2,
} from "lucide-react";
import { useNavProgress } from "@/components/NavProgress";

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
  const nav = useNavProgress();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingSeed, setPendingSeed] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  function start(seed: string) {
    if (!seed.trim() || loading) return;
    setLoading(true);
    setPendingSeed(seed);
    nav.start();
    const params = new URLSearchParams({ q: seed });
    router.push(`/chat?${params.toString()}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4">
      {/* Navigation loading veil — instant feedback while the chat opens */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-sm text-white/80 shadow-input-glow">
            <Loader2 className="size-4 animate-spin text-rose-300" />
            Opening your chat…
          </div>
        </div>
      )}

      <header className="w-full max-w-6xl py-6 flex items-center justify-between">
        <div className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/toastdlogo.png"
            alt="Toastd"
            className="h-7 w-auto select-none"
            draggable={false}
          />
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
              {loading ? <Loader2 className="size-5 animate-spin" /> : <ArrowUp className="size-5" />}
            </button>
          </div>
        </form>

        {/* Suggestion cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto">
          {SUGGESTIONS.map(({ label, icon: Icon }, i) => {
            const isPending = loading && pendingSeed === label;
            return (
              <button
                key={label}
                onClick={() => start(label)}
                disabled={loading}
                style={{ animationDelay: `${100 + i * 60}ms` }}
                className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 px-3.5 py-3 text-left text-sm text-white/80 hover:text-white transition-all animate-fade-in-up disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-rose-200 group-hover:bg-white/10 group-hover:text-rose-100 transition">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
                </span>
                <span className="flex-1 truncate">{label}</span>
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin text-rose-200" />
                ) : (
                  <ArrowUp className="size-3.5 rotate-45 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                )}
              </button>
            );
          })}
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

      {/* ===== Bottom story sections ===== */}
      <div className="relative z-10 w-full pb-12">
        {/* 03 — Story  |  04 — vs The Usual Way */}
        <section className="relative w-full max-w-5xl mx-auto text-white/60">
          <div className="pt-16 md:pt-28">
            <span className="block pt-3.5 text-[9px] md:text-xs tracking-[0.18em] uppercase text-rose-300/60">
              03 — Story
            </span>
            <div className="relative py-12 md:py-16">
              <div className="absolute left-0 top-12 bottom-12 w-px bg-gradient-to-b from-rose-400/40 to-transparent" />
              <div className="md:pl-12">
                <p className="mb-6 text-[10px] md:text-sm tracking-[0.18em] uppercase text-rose-300/80">
                  The honest truth
                </p>
                <h2 className="mb-9 font-display text-[32px] md:text-6xl leading-[1.1] tracking-tight text-white">
                  You have taste.<br />
                  You just can&apos;t find<br />
                  the thing <em className="italic text-rose-300">that proves it.</em>
                </h2>
                <div className="mb-8 flex flex-col gap-[3px] max-w-2xl">
                  <div className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 hover:bg-white/10 transition-colors">
                    <span className="min-w-[16px] text-[10px] md:text-xs font-bold text-white/40">01</span>
                    <span className="font-display text-xl md:text-2xl leading-tight text-white/60">
                      You&apos;ve seen 200 products today.
                    </span>
                  </div>
                  <div className="flex items-center gap-3.5 rounded-xl border border-rose-400/40 bg-rose-500/[0.07] px-4 py-3.5">
                    <span className="min-w-[16px] text-[10px] md:text-xs font-bold text-rose-300/80">02</span>
                    <span className="font-display text-xl md:text-2xl leading-tight text-white">
                      Liked 12. Saved 6.
                    </span>
                  </div>
                  <div className="flex items-center gap-3.5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3.5">
                    <span className="min-w-[16px] text-[10px] md:text-xs font-bold text-rose-300/80">03</span>
                    <span className="font-display text-xl md:text-2xl italic leading-tight text-rose-300">
                      Bought nothing.
                    </span>
                  </div>
                </div>
                <div className="rounded-r-xl border border-white/10 border-l-[3px] border-l-rose-400 bg-white/5 px-[18px] py-4 text-[13px] md:text-base leading-[1.7] text-white/60 max-w-2xl">
                  <strong className="font-medium text-white">Toastd</strong> is India&apos;s curated
                  marketplace of independent brands — with an AI that skips the scroll and tells you
                  exactly what to pick.
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="pt-12 md:pt-20">
            <span className="block pt-3.5 text-[9px] md:text-xs tracking-[0.18em] uppercase text-rose-300/60">
              04 — vs The Usual Way
            </span>
            <div className="relative py-11 md:py-16">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-rose-500/[0.03] to-transparent" />
              <div className="md:grid md:grid-cols-2 md:gap-12 md:items-center">
                <div className="mb-8 md:mb-0">
                  <h2 className="mb-1.5 font-display text-[28px] md:text-5xl leading-[1.1] tracking-tight text-white">
                    The problem was<br />
                    never finding things.<br />
                    <em className="italic text-rose-300">It was trusting them.</em>
                  </h2>
                  <p className="mb-7 text-[12px] md:text-lg leading-[1.5] text-white/60">
                    Every other platform gives you options. We give you answers.
                  </p>
                </div>
                <div className="grid gap-2">
                  {[
                    { bad: ["😩", "50 options. None feel right."], good: ["✦", "One Pick. Feels obvious in hindsight."] },
                    { bad: ["🕳️", "Saved it. Never bought it."], good: ["⚡", "Decided. Done."] },
                    { bad: ["📦", "Looked great online. Wasn't."], good: ["🎯", "What you see is what you get."] },
                  ].map((row, i) => (
                    <div key={i} className="grid grid-cols-[1fr_24px_1fr] items-stretch gap-1.5">
                      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3.5 text-[12px] md:text-sm leading-[1.45]">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <span className="text-[14px]">{row.bad[0]}</span>
                          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">
                            The usual way
                          </span>
                        </div>
                        <div className="text-white/60">{row.bad[1]}</div>
                      </div>
                      <div className="flex items-center justify-center text-[9px] font-bold text-white/30">vs</div>
                      <div className="rounded-xl border border-rose-400/30 bg-rose-500/[0.08] px-3 py-3.5 text-[12px] md:text-sm leading-[1.45]">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <span className="text-[14px]">{row.good[0]}</span>
                          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em] text-rose-300">
                            Toastd
                          </span>
                        </div>
                        <div className="text-white">{row.good[1]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </section>

        {/* 05 — Brands */}
        <section className="md:py-20 py-12 max-w-5xl mx-auto w-full">
          <span className="block mb-1.5 text-[9px] md:text-xs tracking-[0.18em] uppercase text-rose-300/60">
            05 — Brands
          </span>
          <h2 className="mb-1.5 font-display text-[28px] md:text-5xl leading-[1.1] tracking-tight text-white">
            The brands your<br />
            feed never showed you.
          </h2>
          <p className="mb-[22px] text-[12px] md:text-lg leading-[1.5] text-white/60">
            Every one passed our &ldquo;would I actually buy this?&rdquo; test.
          </p>
          <div className="-mx-1 px-1 pb-1 flex gap-2 overflow-x-auto scrollbar-hide md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
            {[
              "Rare Rabbit",
              "Bombay Shaving Co.",
              "The Whole Truth",
              "Suta",
              "Juicy Chemistry",
              "Chumbak",
              "The Label Life",
            ].map((b) => (
              <div
                key={b}
                className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[12px] md:text-sm font-semibold text-white/75 hover:border-rose-400/30 hover:text-white transition-colors md:text-center md:py-4"
              >
                {b}
              </div>
            ))}
          </div>
          <div className="mt-4 md:mt-8 flex items-center gap-2.5 text-[12px] md:text-sm text-white/45">
            <span className="font-display text-[32px] md:text-4xl leading-none text-rose-300">100+</span>
            <span>
              brands. Zero filler.<br />
              Growing every week.
            </span>
          </div>
          <div className="mt-11 md:mt-20 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </section>

        {/* 06 — Coming Soon */}
        <section className="pt-11 pb-11 md:pt-20 md:pb-20 max-w-5xl mx-auto w-full">
          <span className="block mb-1.5 text-[9px] md:text-xs tracking-[0.18em] uppercase text-rose-300/40">
            06 — Coming Soon
          </span>
          <h2 className="mb-1.5 font-display text-[28px] md:text-5xl leading-[1.1] tracking-tight text-white">
            We&apos;re just<br />
            getting started.
          </h2>
          <p className="mb-6 text-[12px] md:text-lg text-white/35">Only the best of each. Never everything.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-6 mb-5 md:mb-10">
            {[
              { emoji: "👟", title: "Sneakers", tag: "Footwear", glow: "#fb7185" },
              { emoji: "💪", title: "Protein Foods", tag: "Performance", glow: "#fb923c" },
              { emoji: "💍", title: "Jewellery", tag: "Gifting", glow: "#d946ef" },
              { emoji: "🌿", title: "Clean Beauty", tag: "Wellness", glow: "#f43f5e" },
            ].map((c) => (
              <div
                key={c.title}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 min-h-[110px] md:min-h-[160px] hover:scale-[1.02] transition-transform"
              >
                <span className="block mb-2.5 text-[28px] md:text-4xl">{c.emoji}</span>
                <p className="relative z-10 text-[13px] md:text-base font-semibold text-white">{c.title}</p>
                <p className="relative z-10 mt-0.5 text-[10px] md:text-xs uppercase tracking-[0.06em] text-white/35">
                  {c.tag}
                </p>
                <span className="absolute top-3 right-3 rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-[3px] text-[9px] md:text-[10px] uppercase tracking-[0.1em] text-rose-300">
                  Soon
                </span>
                <div
                  className="absolute -bottom-5 -right-5 h-20 w-20 rounded-full opacity-40 blur-md pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${c.glow}, transparent 70%)` }}
                />
              </div>
            ))}
            <div className="col-span-2 md:col-span-4 relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 min-h-[80px] md:min-h-[120px] flex md:flex-row md:items-center hover:scale-[1.01] transition-transform">
              <div className="flex-1">
                <span className="block mb-2.5 md:mb-0 md:mr-4 text-[28px] md:text-4xl float-left">📓</span>
                <div>
                  <p className="relative z-10 text-[13px] md:text-base font-semibold text-white">
                    Premium Stationery
                  </p>
                  <p className="relative z-10 mt-0.5 text-[10px] md:text-xs uppercase tracking-[0.06em] text-white/35">
                    Lifestyle
                  </p>
                </div>
              </div>
              <span className="absolute top-3 right-3 rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-[3px] text-[9px] md:text-[10px] uppercase tracking-[0.1em] text-rose-300">
                Soon
              </span>
              <div
                className="absolute -bottom-5 -right-5 h-20 w-20 rounded-full opacity-40 blur-md pointer-events-none"
                style={{ background: "radial-gradient(circle, #fb923c, transparent 70%)" }}
              />
            </div>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center gap-2 max-w-md mx-auto"
          >
            <input
              placeholder="your@email.com"
              type="email"
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-[12px] md:text-sm text-white placeholder:text-white/40 placeholder:italic focus:outline-none focus:border-rose-400/50 transition-colors"
            />
            <button
              type="submit"
              className="brand-mark whitespace-nowrap rounded-xl px-[18px] py-3 text-[12px] md:text-sm font-bold text-white hover:opacity-90 transition-opacity"
            >
              Notify me
            </button>
          </form>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-5xl pb-4 md:pb-10">
          <div className="brand-mark relative overflow-hidden px-6 md:px-12 py-11 md:py-24 text-center rounded-2xl md:rounded-3xl">
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(circle, rgb(0,0,0) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            <h2 className="relative mb-2.5 md:mb-6 font-display text-[36px] md:text-7xl leading-none tracking-tight text-[#0a0a0a]">
              Stop scrolling.<br />
              <em className="italic text-black/45">Start buying.</em>
            </h2>
            <p className="relative mb-7 md:mb-12 text-[13px] md:text-xl leading-[1.6] text-black/60 max-w-2xl mx-auto">
              Describe what you want. Get told exactly what to buy.
            </p>
            <button
              onClick={() => start("Help me find the perfect product")}
              className="relative inline-block w-full md:w-auto rounded-2xl bg-[#0a0a0a] py-4 md:py-5 px-8 md:px-10 text-[14px] md:text-lg font-bold tracking-wide text-rose-300 hover:bg-[#1a1a1a] transition-colors"
            >
              Get your Pick →
            </button>
          </div>
        </section>
      </div>

      <footer className="pt-8 pb-6 text-xs text-white/35 flex items-center gap-1.5">
        <span className="inline-block size-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
        Powered by Vertex AI Agent Runtime on Google Cloud
      </footer>
    </main>
  );
}

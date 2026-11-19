"use client";

import { ExternalLink, ShoppingBag, Store, Tag } from "lucide-react";
import type { CardCache, MerchantCardData, PicksPayload, ProductCardData } from "@/lib/types";
import { resolveMerchants, resolveSection } from "@/lib/picks";

type Tone = "toastd" | "cuanto";

const TONE = {
  toastd: {
    ring: "border-rose-300/15",
    wash: "from-rose-500/[0.06]",
    hover: "hover:border-rose-300/30",
    accent: "text-rose-200",
    chip: "from-rose-400/25 to-fuchsia-500/25 border-rose-300/20",
    icon: ShoppingBag,
    title: "Toastd picks",
    badge: "Our catalogue",
    cta: "View product",
  },
  cuanto: {
    ring: "border-amber-300/15",
    wash: "from-amber-500/[0.06]",
    hover: "hover:border-amber-300/30",
    accent: "text-amber-200",
    chip: "from-amber-400/25 to-orange-500/25 border-amber-300/20",
    icon: Tag,
    title: "Cuanto recommendations",
    badge: "Partner picks",
    cta: "View deal",
  },
} as const;

function formatPrice(value: number, currency?: string | null) {
  const cur = currency || "USD";
  try {
    return new Intl.NumberFormat(cur === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${cur} ${value}`;
  }
}

function Price({ card, tone }: { card: ProductCardData; tone: Tone }) {
  if (card.price == null && card.sale_price == null) return null;
  const sale = card.sale_price != null && card.price != null && card.sale_price < card.price;
  const pct = sale ? Math.round((1 - card.sale_price! / card.price!) * 100) : 0;
  return (
    <p className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
      <span className={`font-semibold ${TONE[tone].accent}`}>
        {formatPrice((sale ? card.sale_price : card.price ?? card.sale_price)!, card.currency)}
      </span>
      {sale && (
        <>
          <span className="text-xs text-white/40 line-through">{formatPrice(card.price!, card.currency)}</span>
          <span className="text-[10px] font-semibold text-emerald-300">-{pct}%</span>
        </>
      )}
    </p>
  );
}

function Thumb({ card, className }: { card: ProductCardData; className: string }) {
  return (
    <div className={`flex items-center justify-center overflow-hidden bg-white/[0.04] ${className}`}>
      {card.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.image_url}
          alt={card.title}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <ShoppingBag className="size-7 text-white/20" />
      )}
    </div>
  );
}

function ProductCard({ card, why, tone }: { card: ProductCardData; why?: string; tone: Tone }) {
  const t = TONE[tone];
  const by = card.brand || card.merchant || card.store;
  return (
    <a
      href={card.url}
      target="_blank"
      rel={tone === "cuanto" ? "noopener noreferrer sponsored" : "noopener noreferrer"}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition ${t.hover} hover:bg-white/[0.06]`}
    >
      <Thumb card={card} className="aspect-square w-full" />
      <div className="flex flex-1 flex-col gap-1 p-3">
        {by && <p className="truncate text-[11px] uppercase tracking-wide text-white/45">{by}</p>}
        <p className="line-clamp-2 text-sm font-medium leading-5 text-white">{card.title}</p>
        <Price card={card} tone={tone} />
        {card.variants && card.variants.length > 0 && (
          <p className="line-clamp-1 text-[11px] text-white/45">{card.variants.join(" · ")}</p>
        )}
        {why && <p className="line-clamp-3 text-xs leading-5 text-white/65">{why}</p>}
        {card.available === false && <p className="text-[11px] text-red-300/80">Out of stock</p>}
        <span className={`mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium ${t.accent}`}>
          {t.cta} <ExternalLink className="size-3" />
        </span>
      </div>
    </a>
  );
}

function MiniCard({ card, tone }: { card: ProductCardData; tone: Tone }) {
  return (
    <a
      href={card.url}
      target="_blank"
      rel={tone === "cuanto" ? "noopener noreferrer sponsored" : "noopener noreferrer"}
      className={`group flex w-36 shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] transition ${TONE[tone].hover}`}
    >
      <Thumb card={card} className="h-28 w-full" />
      <div className="flex flex-col gap-0.5 p-2">
        <p className="line-clamp-2 text-xs leading-4 text-white/90">{card.title}</p>
        <Price card={card} tone={tone} />
      </div>
    </a>
  );
}

function MerchantRow({ card, why }: { card: MerchantCardData; why?: string }) {
  return (
    <a
      href={card.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 transition hover:border-amber-300/30 hover:bg-white/[0.06]"
    >
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
        {card.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.logo_url} alt={card.name} loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <Store className="size-5 text-black/50" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{card.name}</p>
        <p className="truncate text-xs text-white/55">{why || card.sector || card.website}</p>
      </div>
      <ExternalLink className="size-4 shrink-0 text-white/40 group-hover:text-amber-200" />
    </a>
  );
}

function Section({
  tone,
  main,
  more,
  merchants = [],
}: {
  tone: Tone;
  main: { card: ProductCardData; why?: string }[];
  more: ProductCardData[];
  merchants?: { card: MerchantCardData; why?: string }[];
}) {
  if (main.length === 0 && more.length === 0 && merchants.length === 0) return null;
  const t = TONE[tone];
  const Icon = t.icon;
  const count = main.length + more.length;
  return (
    <section
      aria-label={t.title}
      className={`w-full overflow-hidden rounded-2xl border ${t.ring} bg-gradient-to-b ${t.wash} to-transparent animate-fade-in-up`}
    >
      <div className="flex items-center gap-2 px-4 pb-3 pt-4">
        <span className={`inline-flex size-6 items-center justify-center rounded-lg border bg-gradient-to-br ${t.chip}`}>
          <Icon className={`size-3.5 ${t.accent}`} />
        </span>
        <h3 className="flex-1 text-sm font-semibold tracking-wide text-white">
          {t.title}
          {count > 0 && <span className="ml-1.5 font-normal text-white/40">{count}</span>}
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-white/40">{t.badge}</span>
      </div>

      {main.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 px-3 pb-3 sm:grid-cols-3">
          {main.map((m) => (
            <ProductCard key={m.card.id} card={m.card} why={m.why} tone={tone} />
          ))}
        </div>
      )}

      {more.length > 0 && (
        <div className="pb-3">
          <p className="px-4 pb-2 text-[11px] uppercase tracking-wider text-white/40">More like this</p>
          <div className="flex snap-x gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:thin]">
            {more.map((c) => (
              <MiniCard key={c.id} card={c} tone={tone} />
            ))}
          </div>
        </div>
      )}

      {merchants.length > 0 && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          <p className="px-1 text-[11px] uppercase tracking-wider text-white/40">Stores to explore</p>
          {merchants.map((m) => (
            <MerchantRow key={m.card.id} card={m.card} why={m.why} />
          ))}
        </div>
      )}

      {tone === "cuanto" && (
        <p className="border-t border-white/[0.06] px-4 py-2 text-[10px] text-white/35">
          Partner links via Cuanto · prices and availability set by the merchant
        </p>
      )}
    </section>
  );
}

/** Renders a picks payload as structured Toastd + Cuanto sections. */
export function Recommendations({ picks, cache }: { picks: PicksPayload; cache: CardCache }) {
  const toastd = resolveSection(cache.toastd, picks.toastd, picks.toastd_more);
  const cuanto = resolveSection(cache.cuanto, picks.cuanto, picks.cuanto_more);
  const merchants = resolveMerchants(cache.merchants, picks.merchants);
  const nothing =
    toastd.main.length + toastd.more.length + cuanto.main.length + cuanto.more.length + merchants.length === 0;

  return (
    <div className="flex w-full flex-col gap-3">
      {(picks.intro || nothing) && (
        <div className="w-full rounded-2xl rounded-tl-md border border-white/[0.06] bg-white/[0.04] px-4 py-3 text-[15px] leading-7 text-white/90 backdrop-blur-sm">
          {picks.intro || "I couldn't find a strong match this time — tell me a bit more and I'll search again."}
        </div>
      )}
      <Section tone="toastd" main={toastd.main} more={toastd.more} />
      <Section tone="cuanto" main={cuanto.main} more={cuanto.more} merchants={merchants} />
      {picks.outro && !nothing && <p className="px-1 text-sm text-white/60">{picks.outro}</p>}
    </div>
  );
}

export function RecommendationsLoading() {
  return (
    <div className="flex w-full flex-col gap-3 animate-fade-in">
      {(["toastd", "cuanto"] as Tone[]).map((tone) => (
        <div key={tone} className={`rounded-2xl border ${TONE[tone].ring} bg-white/[0.02] p-3`}>
          <p className="px-1 pb-3 text-sm font-semibold text-white/70">{TONE[tone].title}</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`h-52 animate-pulse rounded-2xl bg-white/[0.04] ${i === 2 ? "hidden sm:block" : ""}`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

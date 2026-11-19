import type {
  CardCache,
  MerchantCardData,
  Pick,
  PicksPayload,
  ProductCardData,
} from "./types";

// ---------------------------------------------------------------------------
// Picks block
//
// For recommendations the agent emits ONE fenced ```picks block of compact
// JSON (ids + short reasons). Product details come from the structured cards
// the tools streamed (see app/api/chat/route.ts), so the model never re-types
// URLs, prices or images — that saves tokens and rules out hallucinated links.
// ---------------------------------------------------------------------------

const FENCE = "```picks";

function asPicks(v: unknown): Pick[] {
  if (!Array.isArray(v)) return [];
  const out: Pick[] = [];
  for (const p of v as any[]) {
    if (typeof p === "string") out.push({ id: p });
    else if (p && typeof p.id === "string")
      out.push({ id: p.id, why: typeof p.why === "string" ? p.why : undefined });
  }
  return out;
}

function asIds(v: unknown): string[] {
  return asPicks(v).map((p) => p.id);
}

/**
 * Splits assistant text into any surrounding prose and the picks payload.
 * `pending` is true while the picks block is still streaming in.
 */
export function extractPicks(raw: string): {
  prose: string;
  picks: PicksPayload | null;
  pending: boolean;
} {
  const idx = raw.indexOf(FENCE);
  if (idx < 0) return { prose: raw, picks: null, pending: false };

  const before = raw.slice(0, idx).trim();
  const after = raw.slice(idx + FENCE.length);
  const close = after.indexOf("```");
  if (close < 0) return { prose: before, picks: null, pending: true };

  const body = after.slice(0, close);
  const trailing = after.slice(close + 3).trim();
  const prose = [before, trailing].filter(Boolean).join("\n\n");
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) return { prose, picks: null, pending: false };
  try {
    const o = JSON.parse(body.slice(start, end + 1));
    return {
      prose,
      pending: false,
      picks: {
        intro: typeof o.intro === "string" ? o.intro : undefined,
        outro: typeof o.outro === "string" ? o.outro : undefined,
        toastd: asPicks(o.toastd),
        toastd_more: asIds(o.toastd_more),
        cuanto: asPicks(o.cuanto),
        cuanto_more: asIds(o.cuanto_more),
        cuanto_explore: asIds(o.cuanto_explore),
        merchants: asPicks(o.merchants),
      },
    };
  } catch {
    return { prose, picks: null, pending: false };
  }
}

// ---------------------------------------------------------------------------
// Card cache — fed by `{k:"cards"}` stream lines
// ---------------------------------------------------------------------------

const CUANTO_LINK = /^https:\/\/(www\.)?getcuanto\.ai\/redirect\?/;
const HTTPS = /^https:\/\//;

export const emptyCache = (): CardCache => ({ toastd: {}, cuanto: {}, merchants: {} });

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function img(v: unknown): string | null {
  const s = str(v);
  return s && HTTPS.test(s) ? s : null;
}

function toProduct(raw: any, linkOk: (u: string) => boolean): ProductCardData | null {
  if (!raw || typeof raw.id !== "string" || !str(raw.title)) return null;
  const url = str(raw.url);
  if (!url || !linkOk(url)) return null;
  return {
    id: raw.id,
    title: raw.title,
    brand: str(raw.brand),
    store: str(raw.store),
    merchant: str(raw.merchant),
    merchant_logo: img(raw.merchant_logo),
    price: num(raw.price),
    sale_price: num(raw.sale_price),
    currency: str(raw.currency),
    image_url: img(raw.image_url),
    url,
    variants: Array.isArray(raw.variants)
      ? raw.variants.filter((x: unknown): x is string => typeof x === "string")
      : [],
    available: raw.available !== false,
    category: str(raw.category),
    match: raw.match === "category" ? "category" : "query",
  };
}

function toMerchant(raw: any): MerchantCardData | null {
  if (!raw || typeof raw.id !== "string" || !str(raw.name)) return null;
  const url = str(raw.url);
  if (!url || !CUANTO_LINK.test(url)) return null;
  return {
    id: raw.id,
    name: raw.name,
    website: str(raw.website),
    logo_url: img(raw.logo_url),
    sector: str(raw.sector),
    category: str(raw.category),
    url,
  };
}

/** Merges one `ui_*` state delta into the cache (returns a new object). */
export function mergeCards(cache: CardCache, key: string, items: unknown[]): CardCache {
  const next: CardCache = {
    toastd: { ...cache.toastd },
    cuanto: { ...cache.cuanto },
    merchants: { ...cache.merchants },
  };
  for (const it of items) {
    if (key === "ui_toastd_products") {
      const c = toProduct(it, (u) => HTTPS.test(u));
      if (c) next.toastd[c.id] = c;
    } else if (key === "ui_cuanto_products") {
      // Only tracked Cuanto redirect links (attribution + no arbitrary URLs).
      const c = toProduct(it, (u) => CUANTO_LINK.test(u));
      if (c) next.cuanto[c.id] = c;
    } else if (key === "ui_cuanto_merchants") {
      const m = toMerchant(it);
      if (m) next.merchants[m.id] = m;
    }
  }
  return next;
}

// ---------------------------------------------------------------------------
// Resolve picks → cards
// ---------------------------------------------------------------------------

export type ResolvedSection = {
  main: { card: ProductCardData; why?: string }[];
  more: ProductCardData[];
};

const MAX_MORE = 6;

function take(
  cards: Record<string, ProductCardData>,
  ids: string[],
  used: Set<string>
): ProductCardData[] {
  const out: ProductCardData[] = [];
  for (const id of ids) {
    if (cards[id] && !used.has(id)) {
      used.add(id);
      out.push(cards[id]);
    }
  }
  return out;
}

/**
 * Joins pick ids with cached cards (unknown ids are dropped). Only ids the
 * model explicitly chose are shown, so every product on screen was vetted by
 * the model for relevance and suitability.
 */
export function resolveSection(
  cards: Record<string, ProductCardData>,
  picks: Pick[],
  moreIds: string[]
): ResolvedSection {
  const used = new Set<string>();
  const main: ResolvedSection["main"] = [];
  for (const p of picks) {
    if (cards[p.id] && !used.has(p.id)) {
      used.add(p.id);
      main.push({ card: cards[p.id], why: p.why });
    }
  }
  return { main, more: take(cards, moreIds, used).slice(0, MAX_MORE) };
}

export function resolveMerchants(
  merchants: Record<string, MerchantCardData>,
  picks: Pick[]
): { card: MerchantCardData; why?: string }[] {
  const seen = new Set<string>();
  const out: { card: MerchantCardData; why?: string }[] = [];
  for (const p of picks) {
    if (merchants[p.id] && !seen.has(p.id)) {
      seen.add(p.id);
      out.push({ card: merchants[p.id], why: p.why });
    }
  }
  return out;
}

export type ResolvedCuanto = ResolvedSection & {
  merchants: { card: MerchantCardData; why?: string }[];
  /**
   * Set when nothing matched the requested product type and we are showing
   * same-category products / stores instead: the category to explore.
   */
  exploreCategory: string | null;
};

/** Cuanto section: exact matches, or a same-category "explore" fallback. */
export function resolveCuanto(cache: CardCache, picks: PicksPayload): ResolvedCuanto {
  const exact = resolveSection(cache.cuanto, picks.cuanto, picks.cuanto_more);
  const merchants = resolveMerchants(cache.merchants, picks.merchants);
  // Picks that are themselves category-browse items do not count as matches.
  const hasExact = [...exact.main.map((m) => m.card), ...exact.more].some(
    (c) => c.match !== "category"
  );
  if (hasExact) return { ...exact, merchants, exploreCategory: null };

  const used = new Set([...exact.main.map((m) => m.card.id), ...exact.more.map((c) => c.id)]);
  const explore = [
    ...exact.main.map((m) => m.card),
    ...exact.more,
    ...take(cache.cuanto, picks.cuanto_explore, used),
  ];
  if (explore.length === 0 && merchants.length === 0) {
    return { main: [], more: [], merchants: [], exploreCategory: null };
  }
  const exploreCategory =
    explore.find((c) => c.category)?.category ??
    merchants.find((m) => m.card.category)?.card.category ??
    "this category";
  return {
    main: explore.slice(0, 6).map((card) => ({ card })),
    more: explore.slice(6, 6 + MAX_MORE),
    merchants,
    exploreCategory,
  };
}

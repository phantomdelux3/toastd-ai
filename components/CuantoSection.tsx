"use client";

import { ExternalLink, Store, Tag } from "lucide-react";
import type { CuantoMerchant, CuantoPayload, CuantoProduct } from "@/lib/types";

function formatPrice(value: number, currency?: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency ?? ""} ${value}`.trim();
  }
}

function Header() {
  return (
    <div className="flex items-center gap-2 px-4 pt-4 pb-3">
      <span className="inline-flex size-6 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/25 to-orange-500/25 border border-amber-300/20">
        <Tag className="size-3.5 text-amber-200" />
      </span>
      <h3 className="flex-1 text-sm font-semibold tracking-wide text-white">Cuanto recommendations</h3>
      <span className="text-[10px] uppercase tracking-wider text-white/40">Partner picks</span>
    </div>
  );
}

function ProductCard({ p }: { p: CuantoProduct }) {
  const onSale = p.sale_price != null && p.price != null && p.sale_price < p.price;
  return (
    <a
      href={p.redirect_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition hover:border-amber-300/30 hover:bg-white/[0.06]"
    >
      <div className="aspect-square w-full bg-white/[0.04] flex items-center justify-center overflow-hidden">
        {p.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.image_url}
            alt={p.title}
            loading="lazy"
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <Tag className="size-8 text-white/20" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[11px] uppercase tracking-wide text-white/45 truncate">{p.brand || p.merchant}</p>
        <p className="text-sm font-medium leading-5 text-white line-clamp-2">{p.title}</p>
        {p.price != null && (
          <p className="text-sm">
            {onSale ? (
              <>
                <span className="mr-1.5 text-white/40 line-through">{formatPrice(p.price, p.currency)}</span>
                <span className="font-semibold text-amber-200">{formatPrice(p.sale_price!, p.currency)}</span>
              </>
            ) : (
              <span className="font-semibold text-amber-200">{formatPrice(p.price, p.currency)}</span>
            )}
          </p>
        )}
        {p.reason && <p className="text-xs leading-5 text-white/60 line-clamp-3">{p.reason}</p>}
        <span className="mt-auto pt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-200/90 group-hover:text-amber-100">
          View deal <ExternalLink className="size-3" />
        </span>
      </div>
    </a>
  );
}

function MerchantRow({ m }: { m: CuantoMerchant }) {
  return (
    <a
      href={m.redirect_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 transition hover:border-amber-300/30 hover:bg-white/[0.06]"
    >
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
        {m.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.logo_url} alt={m.name} loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <Store className="size-5 text-black/50" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{m.name}</p>
        <p className="truncate text-xs text-white/55">{m.reason || m.website}</p>
      </div>
      <ExternalLink className="size-4 shrink-0 text-white/40 group-hover:text-amber-200" />
    </a>
  );
}

export function CuantoSection({ data }: { data: CuantoPayload }) {
  return (
    <section
      aria-label="Cuanto recommendations"
      className="w-full overflow-hidden rounded-2xl border border-amber-300/15 bg-gradient-to-b from-amber-500/[0.06] to-transparent animate-fade-in-up"
    >
      <Header />
      {data.products.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 px-3 pb-3 sm:grid-cols-3">
          {data.products.map((p) => (
            <ProductCard key={p.redirect_url} p={p} />
          ))}
        </div>
      )}
      {data.merchants.length > 0 && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          {data.merchants.map((m) => (
            <MerchantRow key={m.redirect_url} m={m} />
          ))}
        </div>
      )}
      <p className="border-t border-white/[0.06] px-4 py-2 text-[10px] text-white/35">
        Partner links via Cuanto · prices and availability set by the merchant
      </p>
    </section>
  );
}

export function CuantoSectionLoading() {
  return (
    <section className="w-full rounded-2xl border border-amber-300/15 bg-amber-500/[0.04] animate-fade-in">
      <Header />
      <div className="flex items-center gap-1 px-4 pb-4 text-white/60 text-sm">
        <span className="thinking-dot" />
        <span className="thinking-dot" />
        <span className="thinking-dot" />
      </div>
    </section>
  );
}

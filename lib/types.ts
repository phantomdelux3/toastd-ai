export type QuestionOption = { label: string; hint?: string };

export type QuestionPayload = {
  type: "question";
  title: string;
  options: QuestionOption[];
};

export type Role = "user" | "assistant";

export type ChatTurn =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; kind: "text"; text: string }
  | { id: string; role: "assistant"; kind: "question"; question: QuestionPayload };

/** Display card written by an agent tool to session state (`ui_*` keys). */
export type ProductCardData = {
  id: string;
  title: string;
  brand?: string | null;
  store?: string | null;
  merchant?: string | null;
  merchant_logo?: string | null;
  price?: number | null;
  sale_price?: number | null;
  currency?: string | null;
  image_url?: string | null;
  url: string;
  variants?: string[];
  available?: boolean;
  category?: string | null;
  /** The search query that produced this card (used for "more like this"). */
  query?: string;
};

export type MerchantCardData = {
  id: string;
  name: string;
  website?: string | null;
  logo_url?: string | null;
  sector?: string | null;
  url: string;
};

/** Every card seen in this chat session, keyed by id. */
export type CardCache = {
  toastd: Record<string, ProductCardData>;
  cuanto: Record<string, ProductCardData>;
  merchants: Record<string, MerchantCardData>;
};

export type Pick = { id: string; why?: string };

/** Compact recommendation block emitted by the agent (ids + reasons only). */
export type PicksPayload = {
  intro?: string;
  outro?: string;
  toastd: Pick[];
  toastd_more: string[];
  cuanto: Pick[];
  cuanto_more: string[];
  merchants: Pick[];
};

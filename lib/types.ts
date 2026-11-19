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

export type CuantoProduct = {
  title: string;
  brand?: string;
  merchant?: string;
  price?: number | null;
  sale_price?: number | null;
  currency?: string;
  image_url?: string;
  redirect_url: string;
  reason?: string;
};

export type CuantoMerchant = {
  name: string;
  website?: string;
  logo_url?: string;
  redirect_url: string;
  reason?: string;
};

export type CuantoPayload = {
  products: CuantoProduct[];
  merchants: CuantoMerchant[];
};

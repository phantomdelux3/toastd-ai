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

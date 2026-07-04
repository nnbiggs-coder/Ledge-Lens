export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
}

export const SUGGESTED_PROMPTS = [
  "What's our active pipeline premium?",
  "Which files have open contradictions?",
  "Summarize Harborview Manufacturing",
  "What's the lowest readiness score?",
  "Show quoted submissions",
] as const;

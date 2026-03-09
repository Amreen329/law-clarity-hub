export interface DocumentAnalysis {
  summary: string;
  keyHighlights: string[];
  importantClauses: { title: string; explanation: string; isHighlighted?: boolean }[];
  citizenImpact: string;
  faq: { question: string; answer: string }[];
  simplifiedSummary: string;
  confidenceScore?: number;
  documentType?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type Language = "en" | "hi" | "te";

export const languageLabels: Record<Language, string> = {
  en: "English",
  hi: "हिन्दी",
  te: "తెలుగు",
};

export const languagePrompts: Record<Language, string> = {
  en: "Respond in English.",
  hi: "Respond in Hindi (हिन्दी).",
  te: "Respond in Telugu (తెలుగు).",
};

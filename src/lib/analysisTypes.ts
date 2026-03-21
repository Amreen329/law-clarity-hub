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

export type Language = "en" | "hi" | "te" | "ta" | "kn" | "ml" | "bn" | "mr" | "gu" | "pa" | "ur";

export const languageLabels: Record<Language, string> = {
  en: "English",
  hi: "हिन्दी",
  te: "తెలుగు",
  ta: "தமிழ்",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  bn: "বাংলা",
  mr: "मराठी",
  gu: "ગુજરાતી",
  pa: "ਪੰਜਾਬੀ",
  ur: "اردو",
};

export const languagePrompts: Record<Language, string> = {
  en: "Respond in English.",
  hi: "Respond in Hindi (हिन्दी).",
  te: "Respond in Telugu (తెలుగు).",
  ta: "Respond in Tamil (தமிழ்).",
  kn: "Respond in Kannada (ಕನ್ನಡ).",
  ml: "Respond in Malayalam (മലയാളം).",
  bn: "Respond in Bengali (বাংলা).",
  mr: "Respond in Marathi (मराठी).",
  gu: "Respond in Gujarati (ગુજરાતી).",
  pa: "Respond in Punjabi (ਪੰਜਾਬੀ).",
  ur: "Respond in Urdu (اردو).",
};

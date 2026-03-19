import { Globe } from "lucide-react";
import type { Language } from "@/lib/analysisTypes";
import { languageLabels } from "@/lib/analysisTypes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LanguagePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const langDescriptions: Record<Language, string> = {
  en: "English — Full detailed analysis in English",
  hi: "हिन्दी — पूरा विश्लेषण हिन्दी में",
  te: "తెలుగు — పూర్తి విశ్లేషణ తెలుగులో",
};

const LanguagePopup = ({ open, onOpenChange, currentLanguage, onLanguageChange }: LanguagePopupProps) => {
  const handleSelect = (lang: Language) => {
    onLanguageChange(lang);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 mb-3">
            <Globe className="h-6 w-6 text-accent" />
          </div>
          <DialogTitle className="text-center">Choose Your Language</DialogTitle>
          <DialogDescription className="text-center">
            The entire analysis will be translated to your selected language.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {(["en", "hi", "te"] as Language[]).map((lang) => (
            <Button
              key={lang}
              variant={currentLanguage === lang ? "default" : "outline"}
              className={`w-full justify-start gap-3 text-left h-auto py-3 ${
                currentLanguage === lang ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleSelect(lang)}
            >
              <span className="text-lg">{lang === "en" ? "🇬🇧" : lang === "hi" ? "🇮🇳" : "🇮🇳"}</span>
              <div>
                <div className="font-semibold">{languageLabels[lang]}</div>
                <div className="text-xs opacity-70">{langDescriptions[lang]}</div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LanguagePopup;

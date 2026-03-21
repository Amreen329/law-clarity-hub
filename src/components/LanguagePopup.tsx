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
import { ScrollArea } from "@/components/ui/scroll-area";

interface LanguagePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const langFlags: Record<Language, string> = {
  en: "🇬🇧", hi: "🇮🇳", te: "🇮🇳", ta: "🇮🇳", kn: "🇮🇳",
  ml: "🇮🇳", bn: "🇮🇳", mr: "🇮🇳", gu: "🇮🇳", pa: "🇮🇳", ur: "🇮🇳",
};

const langDescriptions: Record<Language, string> = {
  en: "Full detailed analysis in English",
  hi: "पूरा विश्लेषण हिन्दी में",
  te: "పూర్తి విశ్లేషణ తెలుగులో",
  ta: "முழு பகுப்பாய்வு தமிழில்",
  kn: "ಸಂಪೂರ್ಣ ವಿಶ್ಲೇಷಣೆ ಕನ್ನಡದಲ್ಲಿ",
  ml: "മലയാളത്തിൽ പൂർണ്ണ വിശകലനം",
  bn: "বাংলায় সম্পূর্ণ বিশ্লেষণ",
  mr: "मराठीत संपूर्ण विश्लेषण",
  gu: "ગુજરાતીમાં સંપૂર્ણ વિશ્લેષણ",
  pa: "ਪੰਜਾਬੀ ਵਿੱਚ ਪੂਰਾ ਵਿਸ਼ਲੇਸ਼ਣ",
  ur: "اردو میں مکمل تجزیہ",
};

const allLanguages: Language[] = ["en", "hi", "te", "ta", "kn", "ml", "bn", "mr", "gu", "pa", "ur"];

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
        <ScrollArea className="max-h-[350px] pr-2">
          <div className="space-y-2 mt-2">
            {allLanguages.map((lang) => (
              <Button
                key={lang}
                variant={currentLanguage === lang ? "default" : "outline"}
                className={`w-full justify-start gap-3 text-left h-auto py-3 ${
                  currentLanguage === lang ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleSelect(lang)}
              >
                <span className="text-lg">{langFlags[lang]}</span>
                <div>
                  <div className="font-semibold">{languageLabels[lang]}</div>
                  <div className="text-xs opacity-70">{langDescriptions[lang]}</div>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default LanguagePopup;

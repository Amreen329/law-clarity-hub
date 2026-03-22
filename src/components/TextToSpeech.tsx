import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { Language } from "@/lib/analysisTypes";

// Map our language codes to BCP 47 lang tags for speech synthesis
const langToBcp47: Record<string, string> = {
  en: "en", hi: "hi", te: "te", ta: "ta", kn: "kn",
  ml: "ml", bn: "bn", mr: "mr", gu: "gu", pa: "pa", ur: "ur",
};

interface TextToSpeechProps {
  text: string;
  title?: string;
  language?: Language;
}

const TextToSpeech = ({ text, title, language = "en" }: TextToSpeechProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const available = speechSynthesis.getVoices();
      setVoices(available);

      // Auto-select a voice matching the current language
      const bcp = langToBcp47[language] || "en";
      const match = available.find((v) => v.lang.startsWith(bcp));
      if (match) {
        setSelectedVoice(match.name);
      } else if (available.length > 0 && !selectedVoice) {
        // Fallback to first English voice
        const en = available.find((v) => v.lang.startsWith("en"));
        setSelectedVoice(en?.name || available[0].name);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      speechSynthesis.cancel();
    };
  }, [language]);

  const stripMarkdown = (md: string) =>
    md
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/[`~]/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ");

  const handlePlay = () => {
    if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    speechSynthesis.cancel();
    const cleanText = stripMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;

    // Set the language on the utterance itself
    const bcp = langToBcp47[language] || "en";
    utterance.lang = bcp;

    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  // Filter voices to show relevant ones for the selected language first
  const bcp = langToBcp47[language] || "en";
  const relevantVoices = [
    ...voices.filter((v) => v.lang.startsWith(bcp)),
    ...voices.filter((v) => !v.lang.startsWith(bcp)),
  ].slice(0, 15);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-1.5">
        <Volume2 className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold text-foreground">
          {title || "Listen to Summary"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {isPlaying ? (
          <Button size="sm" variant="outline" onClick={handlePause} className="gap-1.5">
            <Pause className="h-3.5 w-3.5" /> Pause
          </Button>
        ) : (
          <Button size="sm" onClick={handlePlay} className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
            <Play className="h-3.5 w-3.5" /> {isPaused ? "Resume" : "Play"}
          </Button>
        )}
        {(isPlaying || isPaused) && (
          <Button size="sm" variant="ghost" onClick={handleStop}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Speed</span>
        <Slider
          value={[rate]}
          onValueChange={(v) => setRate(v[0])}
          min={0.5}
          max={2}
          step={0.25}
          className="w-20"
        />
        <span className="text-xs font-medium text-foreground">{rate}x</span>
      </div>
    </div>
  );
};

export default TextToSpeech;

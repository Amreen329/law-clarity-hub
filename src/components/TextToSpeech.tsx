import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TextToSpeechProps {
  text: string;
  title?: string;
}

const TextToSpeech = ({ text, title }: TextToSpeechProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const available = speechSynthesis.getVoices();
      // Prefer English voices
      const english = available.filter((v) => v.lang.startsWith("en"));
      const hindi = available.filter((v) => v.lang.startsWith("hi"));
      const telugu = available.filter((v) => v.lang.startsWith("te"));
      setVoices([...english, ...hindi, ...telugu, ...available.filter(
        (v) => !v.lang.startsWith("en") && !v.lang.startsWith("hi") && !v.lang.startsWith("te")
      )]);
      if (english.length > 0 && !selectedVoice) {
        setSelectedVoice(english[0].name);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      speechSynthesis.cancel();
    };
  }, []);

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

      {voices.length > 0 && (
        <Select value={selectedVoice} onValueChange={setSelectedVoice}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Voice" />
          </SelectTrigger>
          <SelectContent>
            {voices.slice(0, 15).map((v) => (
              <SelectItem key={v.name} value={v.name} className="text-xs">
                {v.name.length > 20 ? v.name.slice(0, 20) + "…" : v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default TextToSpeech;

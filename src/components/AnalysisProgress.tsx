import { motion } from "framer-motion";

interface AnalysisProgressProps {
  progress: number;
  stage: string;
}

const stages = [
  "Extracting text from document...",
  "Splitting into chunks...",
  "Analyzing content...",
  "Generating summary...",
  "Identifying key clauses...",
  "Assessing citizen impact...",
  "Finalizing analysis...",
];

const AnalysisProgress = ({ progress, stage }: AnalysisProgressProps) => {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <div className="mx-auto h-16 w-16 animate-pulse-soft rounded-full bg-civic-amber/20 p-3">
        <div className="h-full w-full rounded-full bg-civic-amber/40 p-2">
          <div className="h-full w-full rounded-full bg-civic-amber" />
        </div>
      </div>

      <p className="mt-6 font-display text-lg font-semibold text-foreground">
        Analyzing Your Document
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{stage}</p>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-gradient-hero"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
    </div>
  );
};

export { stages };
export default AnalysisProgress;

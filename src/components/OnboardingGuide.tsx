import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, Globe, MessageSquare, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const ONBOARDING_KEY = "legisai_onboarding_completed";

const steps = [
  {
    icon: Sparkles,
    title: "Welcome to LegisAI! 🎉",
    description:
      "Your AI-powered platform to understand government laws, bills, and policies in plain language. Let us show you around!",
    color: "bg-primary",
  },
  {
    icon: Upload,
    title: "Upload a Bill or Document",
    description:
      "Upload any government bill, act, or policy document (PDF, TXT, or DOCX). You can also browse our pre-loaded Bill Directory.",
    color: "bg-secondary",
  },
  {
    icon: FileText,
    title: "Get a Detailed Summary",
    description:
      "Our AI analyzes the document and provides a comprehensive summary, key highlights, important clauses, and citizen impact — all in easy language.",
    color: "bg-accent",
  },
  {
    icon: Globe,
    title: "Translate to Your Language",
    description:
      "Switch between English, Hindi, and Telugu anytime. The entire analysis gets translated to your preferred language!",
    color: "bg-secondary",
  },
  {
    icon: MessageSquare,
    title: "Ask Questions & Listen",
    description:
      "Chat with the AI about the document, and use the audio player to listen to the summary hands-free. You're all set!",
    color: "bg-accent",
  },
];

interface OnboardingGuideProps {
  forceShow?: boolean;
  onDismiss?: () => void;
}

const OnboardingGuide = ({ forceShow, onDismiss }: OnboardingGuideProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (forceShow) {
      setShow(true);
      setCurrentStep(0);
      return;
    }
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) setShow(true);
  }, [forceShow]);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
    onDismiss?.();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleClose();
    }
  };

  if (!show) return null;

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-card"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 25 }}
          key={currentStep}
        >
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center text-center">
            <motion.div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl ${step.color} text-primary-foreground`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
            >
              <Icon className="h-8 w-8" />
            </motion.div>

            <h2 className="mt-5 font-display text-xl font-bold text-foreground">
              {step.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>

            {/* Progress dots */}
            <div className="mt-6 flex gap-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all ${
                    i === currentStep ? "w-8 bg-primary" : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={() => setCurrentStep((s) => s - 1)}>
                  Back
                </Button>
              )}
              <Button size="sm" onClick={handleNext} className="gap-1.5">
                {currentStep < steps.length - 1 ? (
                  <>
                    Next <ArrowRight className="h-3.5 w-3.5" />
                  </>
                ) : (
                  "Get Started!"
                )}
              </Button>
            </div>

            <button
              onClick={handleClose}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground"
            >
              Skip tour
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingGuide;

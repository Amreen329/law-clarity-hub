import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import DocumentUpload from "@/components/DocumentUpload";
import AnalysisProgress from "@/components/AnalysisProgress";
import AnalysisResults from "@/components/AnalysisResults";
import ChatInterface from "@/components/ChatInterface";
import CompareView from "@/components/CompareView";
import TextToSpeech from "@/components/TextToSpeech";
import LanguagePopup from "@/components/LanguagePopup";
import OnboardingGuide from "@/components/OnboardingGuide";
import { extractTextFromFile } from "@/lib/documentParser";
import { analyzeDocument } from "@/lib/aiService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { DocumentAnalysis, Language } from "@/lib/analysisTypes";
import { languageLabels } from "@/lib/analysisTypes";
import { FileText, Clock, MessageSquare, ArrowLeftRight, Trash2, Globe, Volume2, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface AnalyzedDoc {
  id?: string;
  name: string;
  date: string;
  analysis: DocumentAnalysis;
  text: string;
}

const Dashboard = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [currentAnalysis, setCurrentAnalysis] = useState<DocumentAnalysis | null>(null);
  const [currentDocName, setCurrentDocName] = useState("");
  const [currentDocText, setCurrentDocText] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [history, setHistory] = useState<AnalyzedDoc[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showLanguagePopup, setShowLanguagePopup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Load history from DB on mount
  useEffect(() => {
    if (!user) return;
    const loadHistory = async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        setHistory(
          data.map((d: any) => ({
            id: d.id,
            name: d.document_name,
            date: new Date(d.created_at).toLocaleDateString(),
            analysis: d.analysis as DocumentAnalysis,
            text: d.document_text,
          }))
        );
      }
    };
    loadHistory();
  }, [user]);

  // Handle bill from directory navigation
  useEffect(() => {
    const state = location.state as { bill?: { title: string; full_text: string } } | null;
    if (state?.bill) {
      setCurrentDocText(state.bill.full_text);
      setCurrentDocName(state.bill.title);
      runAnalysis(state.bill.full_text, state.bill.title, language);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const saveToDb = async (name: string, text: string, analysis: DocumentAnalysis, lang: Language) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("analyses")
      .select("id")
      .eq("user_id", user.id)
      .eq("document_name", name)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("analyses")
        .update({ analysis: analysis as any, document_text: text, language: lang })
        .eq("id", existing.id);
    } else {
      await supabase.from("analyses").insert({
        user_id: user.id,
        document_name: name,
        document_text: text,
        analysis: analysis as any,
        language: lang,
      });
    }
  };

  const runAnalysis = async (text: string, fileName: string, lang: Language) => {
    setIsAnalyzing(true);
    setProgress(0);
    setStage("Sending document to AI for analysis...");
    setCurrentAnalysis(null);
    setShowCompare(false);

    try {
      setProgress(25);
      const { analysis } = await analyzeDocument(text, fileName, (s, p) => {
        setStage(s);
        setProgress(p);
      }, lang);

      setProgress(100);
      setStage("Analysis complete!");
      setCurrentAnalysis(analysis);
      setCurrentDocName(fileName);

      await saveToDb(fileName, text, analysis, lang);

      if (user) {
        const { data } = await supabase
          .from("analyses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (data) {
          setHistory(
            data.map((d: any) => ({
              id: d.id,
              name: d.document_name,
              date: new Date(d.created_at).toLocaleDateString(),
              analysis: d.analysis as DocumentAnalysis,
              text: d.document_text,
            }))
          );
        }
      }

      toast.success("Document analyzed successfully!");
    } catch (err: any) {
      console.error("Error processing file:", err);
      toast.error(err?.message || "Failed to analyze document. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setIsAnalyzing(true);
    setProgress(0);
    setStage("Extracting text from document...");
    setCurrentAnalysis(null);

    try {
      setProgress(10);
      const text = await extractTextFromFile(file);
      setCurrentDocText(text);

      if (!text.trim()) {
        throw new Error("Could not extract any text from this document. Please try a different file.");
      }

      await runAnalysis(text, file.name, language);
    } catch (err: any) {
      console.error("Error processing file:", err);
      toast.error(err?.message || "Failed to analyze document. Please try again.");
      setIsAnalyzing(false);
    }
  };

  const handleLanguageChange = async (lang: Language) => {
    setLanguage(lang);
    if (currentDocText && currentDocName) {
      await runAnalysis(currentDocText, currentDocName, lang);
    }
  };

  const loadFromHistory = (doc: AnalyzedDoc) => {
    setCurrentAnalysis(doc.analysis);
    setCurrentDocName(doc.name);
    setCurrentDocText(doc.text);
    setShowCompare(false);
  };

  const deleteFromHistory = async (doc: AnalyzedDoc) => {
    if (!doc.id) return;
    await supabase.from("analyses").delete().eq("id", doc.id);
    setHistory((prev) => prev.filter((d) => d.id !== doc.id));
    if (currentDocName === doc.name) {
      setCurrentAnalysis(null);
      setCurrentDocName("");
      setCurrentDocText("");
    }
    toast.success("Analysis deleted");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <OnboardingGuide forceShow={showOnboarding} onDismiss={() => setShowOnboarding(false)} />

      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Language Selector - Highlighted */}
            <div className="rounded-xl border-2 border-accent/30 bg-accent/5 p-4 shadow-soft">
              <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                <Globe className="h-4 w-4 text-accent" /> Preferred Language
              </h3>
              <div className="mt-3">
                <button
                  onClick={() => setShowLanguagePopup(true)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <span>{languageLabels[language]}</span>
                  <Globe className="h-4 w-4 text-accent" />
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Tap to choose from 11 languages
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                <FileText className="h-4 w-4 text-secondary" /> Upload Document
              </h3>
              <div className="mt-4">
                <DocumentUpload onFileSelect={handleFileSelect} isAnalyzing={isAnalyzing} />
              </div>
            </div>

            {history.length >= 2 && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowCompare(!showCompare)}
              >
                <ArrowLeftRight className="h-4 w-4" />
                {showCompare ? "Back to Analysis" : "Compare Documents"}
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full gap-2 text-muted-foreground"
              onClick={() => setShowOnboarding(true)}
            >
              <BookOpen className="h-4 w-4" /> Show Guide Again
            </Button>

            {history.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-accent" /> History
                </h3>
                <div className="mt-3 space-y-2">
                  {history.map((doc, i) => (
                    <div
                      key={doc.id || i}
                      className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-muted"
                    >
                      <button
                        onClick={() => loadFromHistory(doc)}
                        className="flex-1 text-left"
                      >
                        <p className="truncate text-xs font-medium text-foreground">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.date}</p>
                      </button>
                      {doc.id && (
                        <button
                          onClick={() => deleteFromHistory(doc)}
                          className="ml-2 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className="min-w-0">
            {showCompare ? (
              <CompareView
                documents={history.map((d) => ({ name: d.name, analysis: d.analysis }))}
                onClose={() => setShowCompare(false)}
              />
            ) : isAnalyzing ? (
              <AnalysisProgress progress={progress} stage={stage} />
            ) : currentAnalysis ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <AnalysisResults
                  analysis={currentAnalysis}
                  documentName={currentDocName}
                  language={language}
                  onLanguageChange={handleLanguageChange}
                />

                {/* Text-to-Speech */}
                <TextToSpeech
                  text={currentAnalysis.summary}
                  title="🔊 Listen to Summary"
                />

                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  <h3 className="font-display text-lg font-semibold text-foreground">Ask Questions</h3>
                </div>
                <ChatInterface documentName={currentDocName} documentText={currentDocText} language={language} />
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  No Document Analyzed Yet
                </h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Upload a government bill from the sidebar or browse the{" "}
                  <a href="/bills" className="text-primary underline">Bill Directory</a>{" "}
                  to get started.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      <LanguagePopup
        open={showLanguagePopup}
        onOpenChange={setShowLanguagePopup}
        currentLanguage={language}
        onLanguageChange={handleLanguageChange}
      />
    </div>
  );
};

export default Dashboard;

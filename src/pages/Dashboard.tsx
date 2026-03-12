import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import DocumentUpload from "@/components/DocumentUpload";
import AnalysisProgress from "@/components/AnalysisProgress";
import AnalysisResults from "@/components/AnalysisResults";
import ChatInterface from "@/components/ChatInterface";
import CompareView from "@/components/CompareView";
import { extractTextFromFile } from "@/lib/documentParser";
import { analyzeDocument } from "@/lib/aiService";
import type { DocumentAnalysis, Language } from "@/lib/analysisTypes";
import { FileText, Clock, MessageSquare, ArrowLeftRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface AnalyzedDoc {
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

      setHistory((prev) => {
        const filtered = prev.filter((d) => d.name !== fileName);
        return [{ name: fileName, date: new Date().toLocaleDateString(), analysis, text }, ...filtered];
      });

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-6">
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

            {history.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-accent" /> History
                </h3>
                <div className="mt-3 space-y-2">
                  {history.map((doc, i) => (
                    <button
                      key={i}
                      onClick={() => loadFromHistory(doc)}
                      className="w-full rounded-lg p-2.5 text-left transition-colors hover:bg-muted"
                    >
                      <p className="truncate text-xs font-medium text-foreground">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.date}</p>
                    </button>
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

                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  <h3 className="font-display text-lg font-semibold text-foreground">Ask Questions</h3>
                </div>
                <ChatInterface documentName={currentDocName} documentText={currentDocText} />
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
                  Upload a legal document from the sidebar to get started. Our AI will break it down into simple, understandable language.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import DocumentUpload from "@/components/DocumentUpload";
import AnalysisProgress from "@/components/AnalysisProgress";
import AnalysisResults from "@/components/AnalysisResults";
import ChatInterface from "@/components/ChatInterface";
import { stages } from "@/components/AnalysisProgress";
import { extractTextFromFile } from "@/lib/documentParser";
import { generateMockAnalysis } from "@/lib/mockAnalysis";
import type { DocumentAnalysis, Language } from "@/lib/analysisTypes";
import { FileText, Clock, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

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

  const simulateProgress = useCallback(() => {
    let p = 0;
    let stageIdx = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p > 100) p = 100;
      stageIdx = Math.min(Math.floor((p / 100) * stages.length), stages.length - 1);
      setProgress(p);
      setStage(stages[stageIdx]);
      if (p >= 100) clearInterval(interval);
    }, 600);
    return interval;
  }, []);

  const handleFileSelect = async (file: File) => {
    setIsAnalyzing(true);
    setProgress(0);
    setStage(stages[0]);
    setCurrentAnalysis(null);

    const interval = simulateProgress();

    try {
      const text = await extractTextFromFile(file);
      setCurrentDocText(text);

      // Wait for progress to finish
      await new Promise((resolve) => setTimeout(resolve, 4500));
      clearInterval(interval);
      setProgress(100);

      const analysis = generateMockAnalysis(file.name);
      setCurrentAnalysis(analysis);
      setCurrentDocName(file.name);

      setHistory((prev) => [
        { name: file.name, date: new Date().toLocaleDateString(), analysis, text },
        ...prev,
      ]);
    } catch (err) {
      console.error("Error processing file:", err);
      clearInterval(interval);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadFromHistory = (doc: AnalyzedDoc) => {
    setCurrentAnalysis(doc.analysis);
    setCurrentDocName(doc.name);
    setCurrentDocText(doc.text);
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
                <FileText className="h-4 w-4 text-civic-amber" /> Upload Document
              </h3>
              <div className="mt-4">
                <DocumentUpload onFileSelect={handleFileSelect} isAnalyzing={isAnalyzing} />
              </div>
            </div>

            {history.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
                <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                  <Clock className="h-4 w-4 text-civic-teal" /> History
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
            {isAnalyzing ? (
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
                  onLanguageChange={setLanguage}
                />

                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-civic-teal" />
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
                  Upload a legal document from the sidebar to get started. We'll break it down into simple, understandable language.
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

import { useState } from "react";
import {
  FileText, Lightbulb, Scale, Users, HelpCircle, Sparkles,
  Copy, Check, Download, Search, Shield, Star, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DocumentAnalysis, Language } from "@/lib/analysisTypes";
import { languageLabels } from "@/lib/analysisTypes";
import { exportAnalysisPdf } from "@/lib/pdfExport";
import ReactMarkdown from "react-markdown";

interface AnalysisResultsProps {
  analysis: DocumentAnalysis;
  documentName: string;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const ConfidenceBadge = ({ score }: { score?: number }) => {
  if (!score) return null;
  const color = score >= 80 ? "text-accent" : score >= 50 ? "text-secondary" : "text-destructive";
  const bg = score >= 80 ? "bg-accent/10" : score >= 50 ? "bg-secondary/10" : "bg-destructive/10";
  const icon = score >= 80 ? Shield : score >= 50 ? Star : AlertTriangle;
  const Icon = icon;
  const label = score >= 80 ? "High Confidence" : score >= 50 ? "Medium Confidence" : "Low Confidence";

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${bg} ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {label} ({score}%)
    </div>
  );
};

const AnalysisResults = ({ analysis, documentName, language, onLanguageChange }: AnalysisResultsProps) => {
  const [simplified, setSimplified] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = () => {
    const content = `# Analysis: ${documentName}
${analysis.documentType ? `**Type:** ${analysis.documentType}\n` : ""}
${analysis.confidenceScore ? `**Confidence:** ${analysis.confidenceScore}%\n` : ""}

## Summary
${analysis.summary}

## Simple Explanation
${analysis.simplifiedSummary}

## Key Highlights
${analysis.keyHighlights.map((h) => `- ${h}`).join("\n")}

## Important Clauses
${analysis.importantClauses.map((c) => `### ${c.title}${c.isHighlighted ? " ⭐" : ""}\n${c.explanation}`).join("\n\n")}

## Citizen Impact
${analysis.citizenImpact}

## FAQ
${analysis.faq.map((f) => `**Q: ${f.question}**\nA: ${f.answer}`).join("\n\n")}`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentName}-analysis.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => handleCopy(text, id)}
      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title="Copy"
    >
      {copied === id ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">{documentName}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {analysis.documentType || "Document"} — Analysis complete
            </p>
            <ConfidenceBadge score={analysis.confidenceScore} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Toggle */}
          <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
            {(["en", "hi", "te"] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  language === lang
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {languageLabels[lang]}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant={simplified ? "default" : "outline"}
            onClick={() => setSimplified(!simplified)}
            className={simplified ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {simplified ? "ELI15 Mode" : "Explain Like I'm 15"}
          </Button>

          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search within this analysis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto bg-muted/50">
          <TabsTrigger value="summary" className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" />Summary</TabsTrigger>
          <TabsTrigger value="highlights" className="gap-1.5 text-xs"><Lightbulb className="h-3.5 w-3.5" />Key Points</TabsTrigger>
          <TabsTrigger value="clauses" className="gap-1.5 text-xs"><Scale className="h-3.5 w-3.5" />Clauses</TabsTrigger>
          <TabsTrigger value="impact" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" />Citizen Impact</TabsTrigger>
          <TabsTrigger value="faq" className="gap-1.5 text-xs"><HelpCircle className="h-3.5 w-3.5" />FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-start justify-between">
              <h3 className="font-display text-lg font-semibold text-foreground">
                {simplified ? "🧒 Explain Like I'm 15" : "Document Summary"}
              </h3>
              <CopyButton text={simplified ? analysis.simplifiedSummary : analysis.summary} id="summary" />
            </div>
            <div className="mt-3 text-sm leading-relaxed text-muted-foreground prose prose-sm max-w-none">
              <ReactMarkdown>{simplified ? analysis.simplifiedSummary : analysis.summary}</ReactMarkdown>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="highlights" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <h3 className="font-display text-lg font-semibold text-foreground">Key Highlights</h3>
            <ul className="mt-4 space-y-3">
              {analysis.keyHighlights
                .filter((h) => !searchQuery || h.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((h, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-xs font-bold text-secondary">
                      {i + 1}
                    </span>
                    <span className="text-sm text-muted-foreground">{h}</span>
                  </li>
                ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="clauses" className="mt-4">
          <div className="space-y-4">
            {analysis.importantClauses
              .filter(
                (c) =>
                  !searchQuery ||
                  c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.explanation.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((c, i) => (
                <div
                  key={i}
                  className={`rounded-xl border bg-card p-5 shadow-soft ${
                    c.isHighlighted
                      ? "border-secondary/40 ring-1 ring-secondary/20"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {c.isHighlighted && (
                        <Star className="h-4 w-4 text-secondary fill-secondary" />
                      )}
                      <h4 className="font-display text-sm font-semibold text-foreground">{c.title}</h4>
                    </div>
                    <CopyButton text={`${c.title}\n${c.explanation}`} id={`clause-${i}`} />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.explanation}</p>
                </div>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="impact" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-start justify-between">
              <h3 className="font-display text-lg font-semibold text-foreground">
                What This Law Means For You
              </h3>
              <CopyButton text={analysis.citizenImpact} id="impact" />
            </div>
            <div className="mt-3 text-sm leading-relaxed text-muted-foreground prose prose-sm max-w-none">
              <ReactMarkdown>{analysis.citizenImpact}</ReactMarkdown>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="faq" className="mt-4">
          <div className="space-y-4">
            {analysis.faq
              .filter(
                (f) =>
                  !searchQuery ||
                  f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  f.answer.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((f, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-soft">
                  <h4 className="font-display text-sm font-semibold text-foreground">{f.question}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.answer}</p>
                </div>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisResults;

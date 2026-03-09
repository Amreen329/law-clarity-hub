import { useState } from "react";
import { FileText, Lightbulb, Scale, Users, HelpCircle, Sparkles, Copy, Check, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DocumentAnalysis, Language } from "@/lib/analysisTypes";
import { languageLabels } from "@/lib/analysisTypes";
import ReactMarkdown from "react-markdown";

interface AnalysisResultsProps {
  analysis: DocumentAnalysis;
  documentName: string;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

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
    const content = `
# Analysis: ${documentName}

## Summary
${analysis.summary}

## Key Highlights
${analysis.keyHighlights.map((h) => `- ${h}`).join("\n")}

## Important Clauses
${analysis.importantClauses.map((c) => `### ${c.title}\n${c.explanation}`).join("\n\n")}

## Citizen Impact
${analysis.citizenImpact}

## FAQ
${analysis.faq.map((f) => `**Q: ${f.question}**\nA: ${f.answer}`).join("\n\n")}
    `.trim();

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
      {copied === id ? <Check className="h-3.5 w-3.5 text-civic-teal" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">{documentName}</h2>
          <p className="text-sm text-muted-foreground">Analysis complete</p>
        </div>
        <div className="flex items-center gap-2">
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

          {/* Simplify Toggle */}
          <Button
            size="sm"
            variant={simplified ? "default" : "outline"}
            onClick={() => setSimplified(!simplified)}
            className={simplified ? "bg-civic-teal text-accent-foreground hover:bg-civic-teal-light" : ""}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {simplified ? "Simple Mode" : "Simplify"}
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
          <TabsTrigger value="highlights" className="gap-1.5 text-xs"><Lightbulb className="h-3.5 w-3.5" />Highlights</TabsTrigger>
          <TabsTrigger value="clauses" className="gap-1.5 text-xs"><Scale className="h-3.5 w-3.5" />Clauses</TabsTrigger>
          <TabsTrigger value="impact" className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" />Impact</TabsTrigger>
          <TabsTrigger value="faq" className="gap-1.5 text-xs"><HelpCircle className="h-3.5 w-3.5" />FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-start justify-between">
              <h3 className="font-display text-lg font-semibold text-foreground">
                {simplified ? "Simple Explanation" : "Document Summary"}
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
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-civic-amber/15 text-xs font-bold text-civic-amber">
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
                <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex items-start justify-between">
                    <h4 className="font-display text-sm font-semibold text-foreground">{c.title}</h4>
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

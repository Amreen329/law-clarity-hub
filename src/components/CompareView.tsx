import { useState } from "react";
import type { DocumentAnalysis } from "@/lib/analysisTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ArrowLeftRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

interface CompareDoc {
  name: string;
  analysis: DocumentAnalysis;
}

interface CompareViewProps {
  documents: CompareDoc[];
  onClose: () => void;
}

const CompareView = ({ documents, onClose }: CompareViewProps) => {
  const [docA, setDocA] = useState(0);
  const [docB, setDocB] = useState(Math.min(1, documents.length - 1));
  const [tab, setTab] = useState("summary");

  const a = documents[docA];
  const b = documents[docB];

  if (documents.length < 2) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <ArrowLeftRight className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 font-display text-lg font-semibold text-foreground">Need at least 2 documents</h3>
        <p className="mt-1 text-sm text-muted-foreground">Analyze more documents to use comparison.</p>
        <Button variant="outline" className="mt-4" onClick={onClose}>Go Back</Button>
      </div>
    );
  }

  const Section = ({ title, contentA, contentB }: { title: string; contentA: string; contentB: string }) => (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">{a.name}</h4>
        <div className="prose prose-sm max-w-none text-sm text-foreground">
          <ReactMarkdown>{contentA}</ReactMarkdown>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">{b.name}</h4>
        <div className="prose prose-sm max-w-none text-sm text-foreground">
          <ReactMarkdown>{contentB}</ReactMarkdown>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-accent" />
          Compare Documents
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={docA}
          onChange={(e) => setDocA(Number(e.target.value))}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          {documents.map((d, i) => (
            <option key={i} value={i}>{d.name}</option>
          ))}
        </select>
        <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
        <select
          value={docB}
          onChange={(e) => setDocB(Number(e.target.value))}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          {documents.map((d, i) => (
            <option key={i} value={i}>{d.name}</option>
          ))}
        </select>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="summary" className="text-xs">Summary</TabsTrigger>
          <TabsTrigger value="highlights" className="text-xs">Key Points</TabsTrigger>
          <TabsTrigger value="impact" className="text-xs">Citizen Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <Section title="Summary" contentA={a.analysis.summary} contentB={b.analysis.summary} />
        </TabsContent>

        <TabsContent value="highlights" className="mt-4">
          <Section
            title="Key Highlights"
            contentA={a.analysis.keyHighlights.map((h, i) => `${i + 1}. ${h}`).join("\n")}
            contentB={b.analysis.keyHighlights.map((h, i) => `${i + 1}. ${h}`).join("\n")}
          />
        </TabsContent>

        <TabsContent value="impact" className="mt-4">
          <Section title="Citizen Impact" contentA={a.analysis.citizenImpact} contentB={b.analysis.citizenImpact} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompareView;

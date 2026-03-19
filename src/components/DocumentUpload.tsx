import { useCallback, useState } from "react";
import { Upload, FileText, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DocumentUploadProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".docx"];

// Keywords that indicate a government/legal document
const LEGAL_KEYWORDS = [
  "bill", "act", "amendment", "legislation", "parliament", "government",
  "ordinance", "notification", "gazette", "statute", "section", "clause",
  "regulation", "policy", "ministry", "enact", "repeal", "constitutional",
  "whereas", "hereby", "herein", "provisions", "legislature", "assembly",
  "lok sabha", "rajya sabha", "gazette of india", "central government",
  "state government", "union territory", "preamble", "schedule",
  "chapter", "part", "article", "rule", "order", "decree", "tribunal",
  "commission", "authority", "board", "council", "committee",
];

function isLikelyGovernmentDocument(fileName: string, text?: string): boolean {
  const name = fileName.toLowerCase();
  // Check filename
  if (LEGAL_KEYWORDS.some((kw) => name.includes(kw))) return true;
  // If we have text content, check that too
  if (text) {
    const lower = text.toLowerCase().slice(0, 5000); // Check first 5000 chars
    const matchCount = LEGAL_KEYWORDS.filter((kw) => lower.includes(kw)).length;
    if (matchCount >= 3) return true;
  }
  return false;
}

const DocumentUpload = ({ onFileSelect, isAnalyzing }: DocumentUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const validateAndSetFile = (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.includes(ext)) {
      setShowRejectDialog(true);
      return;
    }
    // Quick filename check
    if (!isLikelyGovernmentDocument(file.name)) {
      // For text files, we can read a snippet
      if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          if (!isLikelyGovernmentDocument(file.name, text)) {
            setShowRejectDialog(true);
          } else {
            setSelectedFile(file);
          }
        };
        reader.readAsText(file.slice(0, 10000));
        return;
      }
      // For PDF/DOCX, accept with filename check only (AI will validate content)
      setSelectedFile(file);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          dragActive
            ? "border-secondary bg-secondary/5"
            : "border-border bg-muted/30 hover:border-secondary/50 hover:bg-muted/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.txt,.docx"
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium text-foreground">
          Drop your document here or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Only government bills, acts & policies (PDF, TXT, DOCX)
        </p>
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/15">
              <FileText className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </Button>
            <button
              onClick={() => setSelectedFile(null)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mb-3">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <DialogTitle className="text-center">Document Not Accepted</DialogTitle>
            <DialogDescription className="text-center">
              LegisAI only accepts official <strong>government bills, acts, and policies</strong> that
              have been introduced or approved by state or central legislatures.
              <br /><br />
              Personal documents, contracts, academic papers, and other non-legislative files
              are not supported.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowRejectDialog(false)}>
              Got it, I'll upload a valid bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentUpload;

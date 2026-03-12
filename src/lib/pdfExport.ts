import jsPDF from "jspdf";
import type { DocumentAnalysis } from "./analysisTypes";

export function exportAnalysisPdf(analysis: DocumentAnalysis, documentName: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const addText = (text: string, size: number, bold = false) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += size * 0.45;
    }
    y += 2;
  };

  const addSection = (title: string, content: string) => {
    y += 4;
    addText(title, 14, true);
    y += 1;
    // Strip markdown formatting for PDF
    const clean = content
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/#{1,3}\s/g, "")
      .replace(/\n{2,}/g, "\n");
    addText(clean, 10);
  };

  // Title
  addText(documentName, 18, true);
  if (analysis.documentType) {
    addText(`Type: ${analysis.documentType}`, 10);
  }
  if (analysis.confidenceScore) {
    addText(`Confidence: ${analysis.confidenceScore}%`, 10);
  }
  y += 4;

  // Summary
  addSection("Summary", analysis.summary);

  // Simple Explanation
  addSection("Simple Explanation", analysis.simplifiedSummary);

  // Key Highlights
  y += 4;
  addText("Key Highlights", 14, true);
  y += 1;
  analysis.keyHighlights.forEach((h, i) => {
    addText(`${i + 1}. ${h}`, 10);
  });

  // Important Clauses
  y += 4;
  addText("Important Clauses", 14, true);
  y += 1;
  analysis.importantClauses.forEach((c) => {
    addText(c.title, 11, true);
    addText(c.explanation, 10);
    y += 2;
  });

  // Citizen Impact
  addSection("Citizen Impact", analysis.citizenImpact);

  // FAQ
  y += 4;
  addText("Frequently Asked Questions", 14, true);
  y += 1;
  analysis.faq.forEach((f) => {
    addText(`Q: ${f.question}`, 10, true);
    addText(`A: ${f.answer}`, 10);
    y += 2;
  });

  doc.save(`${documentName}-analysis.pdf`);
}

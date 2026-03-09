export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt") {
    return await file.text();
  }

  if (ext === "pdf") {
    return await extractPdfText(file);
  }

  if (ext === "docx") {
    return await extractDocxText(file);
  }

  throw new Error(`Unsupported file type: .${ext}`);
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const texts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(" ");
    texts.push(pageText);
  }

  return texts.join("\n\n");
}

async function extractDocxText(file: File): Promise<string> {
  // Simple DOCX text extraction using the XML inside the zip
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  // DOCX files are ZIP archives containing XML
  // We'll do a simple extraction of text content
  const text = new TextDecoder().decode(uint8);

  // Try to extract readable text between XML tags
  const matches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
  if (matches) {
    return matches
      .map((m) => m.replace(/<[^>]+>/g, ""))
      .join(" ");
  }

  // Fallback: just return as text
  return await file.text();
}

export function chunkText(text: string, chunkSize = 3000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }

  return chunks;
}

import { supabase } from "@/integrations/supabase/client";
import type { DocumentAnalysis } from "./analysisTypes";

export async function analyzeDocument(
  text: string,
  documentName: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<{ analysis: DocumentAnalysis; chunksProcessed: number }> {
  onProgress?.("Sending document to AI for analysis...", 30);

  const { data, error } = await supabase.functions.invoke("analyze-document", {
    body: { text, documentName },
  });

  if (error) {
    throw new Error(error.message || "Failed to analyze document");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  onProgress?.("Analysis complete!", 100);
  return data;
}

export type StreamChatParams = {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  documentText: string;
  documentName: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
};

export async function streamChat({
  messages,
  documentText,
  documentName,
  onDelta,
  onDone,
  onError,
}: StreamChatParams) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, documentText, documentName }),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => null);
    onError(errData?.error || `Request failed with status ${resp.status}`);
    return;
  }

  if (!resp.body) {
    onError("No response stream");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore partial */ }
    }
  }

  onDone();
}

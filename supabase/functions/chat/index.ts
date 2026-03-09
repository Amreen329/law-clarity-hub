import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { messages, documentText, documentName } = await req.json();

    // Simple RAG: find relevant chunks based on the user's last message
    const userQuestion = messages[messages.length - 1]?.content || "";
    const chunks = chunkText(documentText, 3000, 200);
    const relevantChunks = findRelevantChunks(chunks, userQuestion, 5);
    const context = relevantChunks.join("\n\n---\n\n");

    const systemPrompt = `You are an AI legal assistant helping citizens understand the document "${documentName}". 

Your role is to:
- Answer questions using ONLY the document content provided below
- Use clear, simple language that anyone can understand
- Avoid legal jargon - explain terms when you must use them
- If the answer isn't in the document, say so honestly
- Use markdown formatting for clarity (bold, bullet points, etc.)
- Be concise but thorough

RELEVANT DOCUMENT SECTIONS:
${context}

If the user's question cannot be answered from the provided sections, say: "I couldn't find specific information about that in this document. Try rephrasing your question, or ask about a different aspect of the law."`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function chunkText(text: string, chunkSize = 3000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }
  return chunks;
}

function findRelevantChunks(chunks: string[], query: string, topK: number): string[] {
  // Simple keyword-based relevance scoring (lightweight RAG)
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  
  const scored = chunks.map((chunk, index) => {
    const lowerChunk = chunk.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      const matches = lowerChunk.split(term).length - 1;
      score += matches;
    }
    // Boost earlier chunks slightly (often contain key definitions)
    score += Math.max(0, (chunks.length - index) / chunks.length) * 0.5;
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map(s => s.chunk);
}

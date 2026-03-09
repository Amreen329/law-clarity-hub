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

    const { text, documentName } = await req.json();
    if (!text) throw new Error("No document text provided");

    // Chunk the text for processing
    const chunks = chunkText(text, 4000, 200);
    const totalChunks = chunks.length;
    const isLargeDoc = totalChunks > 25;

    // For large docs, create micro-summaries first then combine
    let compressedText: string;
    if (isLargeDoc) {
      // Process in batches of 10 chunks
      const batchSize = 10;
      const microSummaries: string[] = [];
      
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize).join("\n\n---\n\n");
        const summary = await callAI(LOVABLE_API_KEY, [
          {
            role: "system",
            content: "You are a legal document analyst. Summarize the following document sections into a dense, information-preserving summary. Keep all key facts, numbers, dates, and legal provisions. Be concise but thorough.",
          },
          {
            role: "user",
            content: `Summarize these document sections:\n\n${batch}`,
          },
        ]);
        microSummaries.push(summary);
      }
      compressedText = microSummaries.join("\n\n");
    } else {
      compressedText = chunks.join("\n\n---\n\n");
    }

    // Truncate if still too long (keep ~30k chars for the final prompt)
    if (compressedText.length > 30000) {
      compressedText = compressedText.slice(0, 30000) + "\n\n[Document truncated for processing]";
    }

    // Generate the full analysis using tool calling for structured output
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert legal analyst who makes laws accessible to ordinary citizens. Analyze the provided legislative document and extract structured information. Use clear, simple language that anyone can understand. Avoid legal jargon.`,
          },
          {
            role: "user",
            content: `Analyze this legislative document titled "${documentName}":\n\n${compressedText}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_analysis",
              description: "Provide a structured analysis of the legislative document",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "A comprehensive 3-5 paragraph summary of the document explaining what it does, why it matters, and its main provisions. Use markdown formatting.",
                  },
                  simplifiedSummary: {
                    type: "string",
                    description: "An 'Explain Like I'm 15' version - use analogies, everyday language, and short sentences. Make it fun and relatable. 2-3 paragraphs.",
                  },
                  keyHighlights: {
                    type: "array",
                    items: { type: "string" },
                    description: "6-10 key highlights or major provisions, each as a clear one-sentence bullet point",
                  },
                  importantClauses: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "The clause/section title or number" },
                        explanation: { type: "string", description: "Plain-language explanation of what this clause means and why it matters" },
                        isHighlighted: { type: "boolean", description: "Whether this is a particularly important clause" },
                      },
                      required: ["title", "explanation", "isHighlighted"],
                    },
                    description: "4-8 important clauses with explanations",
                  },
                  citizenImpact: {
                    type: "string",
                    description: "A detailed markdown explanation of how this law affects ordinary citizens. Use bullet points with bold headers. Cover areas like rights, obligations, benefits, and timelines.",
                  },
                  faq: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        answer: { type: "string" },
                      },
                      required: ["question", "answer"],
                    },
                    description: "5-8 frequently asked questions a citizen might have, with clear answers",
                  },
                  confidenceScore: {
                    type: "number",
                    description: "A confidence score from 0 to 100 indicating how reliable the analysis is based on the document quality and completeness. 80+ means high confidence.",
                  },
                  documentType: {
                    type: "string",
                    description: "The type of document (e.g., 'Parliamentary Bill', 'Executive Order', 'Policy Document', 'Regulation', 'Act')",
                  },
                },
                required: ["summary", "simplifiedSummary", "keyHighlights", "importantClauses", "citizenImpact", "faq", "confidenceScore", "documentType"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage credits exhausted. Please add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No analysis generated");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ analysis, chunksProcessed: totalChunks }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function chunkText(text: string, chunkSize = 4000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }
  return chunks;
}

async function callAI(apiKey: string, messages: Array<{ role: string; content: string }>): Promise<string> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI call failed [${resp.status}]: ${t}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

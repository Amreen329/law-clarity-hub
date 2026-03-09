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

    // Text is already truncated client-side, just use it directly
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert legal analyst who makes laws accessible to ordinary citizens. Analyze the provided legislative document and extract structured information. Use clear, simple language that anyone can understand. Avoid legal jargon.`,
          },
          {
            role: "user",
            content: `Analyze this legislative document titled "${documentName}":\n\n${text}`,
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
                        title: { type: "string" },
                        explanation: { type: "string" },
                        isHighlighted: { type: "boolean" },
                      },
                      required: ["title", "explanation", "isHighlighted"],
                    },
                    description: "4-8 important clauses with explanations",
                  },
                  citizenImpact: {
                    type: "string",
                    description: "A detailed markdown explanation of how this law affects ordinary citizens. Use bullet points with bold headers.",
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
                    description: "A confidence score from 0 to 100 indicating how reliable the analysis is.",
                  },
                  documentType: {
                    type: "string",
                    description: "The type of document (e.g., 'Parliamentary Bill', 'Act', 'Policy Document')",
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

    return new Response(JSON.stringify({ analysis, chunksProcessed: 1 }), {
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

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

    const { text, documentName, language } = await req.json();
    if (!text) throw new Error("No document text provided");

    const langInstructions: Record<string, string> = {
      en: "Respond entirely in English.",
      hi: "Respond entirely in Hindi (हिन्दी). All text including titles, explanations, questions, and answers must be in Hindi.",
      te: "Respond entirely in Telugu (తెలుగు). All text including titles, explanations, questions, and answers must be in Telugu.",
    };
    const langPrompt = langInstructions[language] || langInstructions.en;

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
            content: `You are an expert legal analyst who makes laws accessible to ordinary citizens. Analyze the provided legislative document and extract structured, detailed information.

CRITICAL INSTRUCTIONS:
- Write in clear, simple language that anyone can understand. Avoid legal jargon entirely.
- For the summary: Write 4-6 detailed paragraphs covering the full scope of the document — its purpose, background, major provisions, implementation mechanism, and significance. Do NOT use bullet points in the summary.
- For the simplified summary: Write 2-3 paragraphs using everyday analogies, relatable examples, and conversational tone as if explaining to a 15-year-old.
- For citizen impact: Write detailed paragraphs organized by topic (e.g., "How it affects your privacy", "What changes for businesses") with concrete real-world examples.
- For FAQ answers: Give thorough 3-5 sentence answers, not one-liners.
- For key highlights: Provide 8-12 detailed one-sentence highlights.
- For important clauses: Provide 6-10 clauses with detailed 3-4 sentence explanations each.
${langPrompt}`,
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
                    description: "A comprehensive 4-6 paragraph detailed summary covering the document's purpose, historical context, major provisions, implementation mechanism, enforcement, and overall significance. Use markdown formatting with headers. Do NOT use bullet points — write flowing paragraphs.",
                  },
                  simplifiedSummary: {
                    type: "string",
                    description: "An 'Explain Like I'm 15' version - use analogies, everyday language, and short sentences. Make it fun and relatable. 2-3 paragraphs.",
                  },
                  keyHighlights: {
                    type: "array",
                    items: { type: "string" },
                    description: "8-12 key highlights or major provisions, each as a detailed one-sentence explanation",
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

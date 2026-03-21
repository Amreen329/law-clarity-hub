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

IMPORTANT: This platform ONLY accepts official government bills, acts, policies, and legislation. If the document does NOT appear to be a government/legislative document, set the documentType to "NOT_LEGISLATIVE" and provide minimal analysis.

CRITICAL INSTRUCTIONS FOR SUMMARIES:
- The "summary" must be 2-3 DETAILED PARAGRAPHS (each 4-6 sentences long) covering: the document's purpose & background, its major provisions and how they work, and its significance & implementation. Write flowing prose — NO bullet points, NO numbered lists in the summary. Each paragraph should be rich, informative, and substantive.
- The "simplifiedSummary" must be 2-3 paragraphs using everyday analogies, relatable examples, and conversational tone as if explaining to a 15-year-old.
- The "citizenImpact" must be 2-3 detailed paragraphs organized by topic with bold headers, real-world examples, and scenarios.
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
                    description: "A comprehensive 2-3 paragraph detailed summary. Each paragraph should be 4-6 sentences. Cover the document's purpose, historical context, major provisions, implementation mechanism, enforcement, and overall significance. Use markdown formatting. Do NOT use bullet points or numbered lists — write flowing, rich paragraphs.",
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
                    description: "6-10 important clauses with detailed 3-4 sentence explanations each",
                  },
                  citizenImpact: {
                    type: "string",
                    description: "A detailed markdown explanation of how this law affects ordinary citizens organized by topic area. Write 3-5 paragraphs with bold headers for each area of impact. Include specific real-world examples and scenarios.",
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
                    description: "6-10 frequently asked questions a citizen might have, with detailed 3-5 sentence answers",
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
    
    // Try tool_calls first, then fall back to parsing content directly
    let analysis;
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      analysis = JSON.parse(toolCall.function.arguments);
    } else {
      // Some models return the result in content instead of tool_calls
      const content = result.choices?.[0]?.message?.content;
      if (content) {
        try {
          // Try to extract JSON from the content
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          }
        } catch { /* fall through */ }
      }
      if (!analysis) {
        console.error("Unexpected AI response structure:", JSON.stringify(result).slice(0, 500));
        throw new Error("No analysis generated — unexpected response format");
      }
    }

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

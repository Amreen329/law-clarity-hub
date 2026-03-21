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

    const { messages, documentText, documentName, language } = await req.json();

    const langMap: Record<string, string> = {
      en: "English", hi: "Hindi", te: "Telugu", ta: "Tamil", kn: "Kannada",
      ml: "Malayalam", bn: "Bengali", mr: "Marathi", gu: "Gujarati", pa: "Punjabi", ur: "Urdu",
    };
    const langName = langMap[language] || "English";

    const systemPrompt = `You are an AI legal assistant helping citizens understand the document "${documentName}". 
Respond entirely in ${langName}.

Your role is to:
- Answer questions using ONLY the document content provided below
- Use clear, simple language that anyone can understand
- Avoid legal jargon - explain terms when you must use them
- If the answer isn't in the document, say so honestly
- Use markdown formatting for clarity
- Be concise but thorough
- ALWAYS respond in ${langName}

DOCUMENT CONTENT:
${documentText}

If the user's question cannot be answered from the document, say so in ${langName}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-4),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: response.status === 429 ? "Rate limit exceeded." : response.status === 402 ? "AI credits exhausted." : "AI gateway error" }), {
        status: response.status >= 400 && response.status < 500 ? response.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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

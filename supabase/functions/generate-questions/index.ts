import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, questionCount, questionTypes } = await req.json();

    if (!text || text.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Please provide enough text content (at least 50 characters) to generate questions." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const count = questionCount || 5;
    const types = questionTypes || ["mcq"];

    let typeInstructions = "";
    if (types.includes("mcq")) {
      typeInstructions += `
- MCQ (Multiple Choice Questions): Provide exactly 4 options labeled A, B, C, D. Each option must be a complete sentence or phrase - never truncate with "..." or ellipsis. The correct_answer should be the full text of the correct option.`;
    }
    if (types.includes("vsa")) {
      typeInstructions += `
- VSA (Very Short Answer): Questions that require a brief answer of 1-3 sentences. Set options to null. The correct_answer should be a concise but complete answer.`;
    }
    if (types.includes("lsa")) {
      typeInstructions += `
- LSA (Long/Short Answer): Questions requiring detailed explanations of 3-6 sentences. Set options to null. The correct_answer should be a thorough explanation.`;
    }

    const systemPrompt = `You are an expert educational assessment creator. Generate exactly ${count} practice test questions based ONLY on the provided text content. 

Question types to generate: ${types.join(", ")}
${typeInstructions}

CRITICAL RULES:
1. ALL questions MUST be directly based on the provided text content. Do NOT create questions about topics not covered in the text.
2. Distribute question types as evenly as possible among the requested types.
3. For MCQ options, write COMPLETE sentences/phrases. NEVER truncate with "..." or ellipsis.
4. Questions should test understanding at various cognitive levels (recall, comprehension, application, analysis).
5. Make questions clear and unambiguous.

You MUST respond with a valid JSON array using this exact structure:
[
  {
    "question_type": "mcq" | "vsa" | "lsa",
    "question": "The full question text",
    "options": ["Option A full text", "Option B full text", "Option C full text", "Option D full text"] | null,
    "correct_answer": "The complete correct answer text"
  }
]

Respond ONLY with the JSON array. No markdown, no code blocks, no explanation.`;

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
          { role: "user", content: `Generate ${count} questions from this text:\n\n${text.substring(0, 15000)}` },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate questions. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    // Clean and parse the JSON response
    let cleanedContent = content.trim();
    // Remove markdown code blocks if present
    if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let questions;
    try {
      questions = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", cleanedContent);
      throw new Error("Failed to parse generated questions");
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid questions format received");
    }

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-questions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

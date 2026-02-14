import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { topic, questionCount, questionTypes } = await req.json();

    if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Please provide a valid topic (at least 2 characters)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (topic.length > 200) {
      return new Response(
        JSON.stringify({ error: "Topic must be under 200 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const count = Math.min(Math.max(Number(questionCount) || 5, 1), 50);
    const validTypes = ["mcq", "vsa", "lsa"];
    const types = Array.isArray(questionTypes)
      ? questionTypes.filter((t: string) => validTypes.includes(t))
      : ["mcq"];
    if (types.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one valid question type required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let typeInstructions = "";
    if (types.includes("mcq")) {
      typeInstructions += `\n- MCQ (Multiple Choice Questions): Provide exactly 4 options. The correct_answer should be the full text of the correct option.`;
    }
    if (types.includes("vsa")) {
      typeInstructions += `\n- VSA (Very Short Answer): Questions requiring 1-3 sentence answers. Set options to null.`;
    }
    if (types.includes("lsa")) {
      typeInstructions += `\n- LSA (Long/Short Answer): Questions requiring 3-6 sentence answers. Set options to null.`;
    }

    // Step 1: Research the topic using AI
    const researchPrompt = `You are a subject matter expert. Provide a comprehensive, factual overview of the following topic that can be used to generate educational assessment questions. Cover key concepts, definitions, principles, important facts, and relationships. Be thorough and accurate.

Topic: ${topic.trim()}

Provide a detailed overview in 2000-3000 words.`;

    const researchResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "user", content: researchPrompt },
        ],
        temperature: 0.5,
      }),
    });

    if (!researchResponse.ok) {
      if (researchResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (researchResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to research topic");
    }

    const researchData = await researchResponse.json();
    const researchContent = researchData.choices?.[0]?.message?.content;
    if (!researchContent) {
      throw new Error("No research content generated");
    }

    // Step 2: Generate questions from the researched content
    const systemPrompt = `You are an expert educational assessment creator. Generate exactly ${count} practice test questions based on the provided research content about "${topic.trim()}".

Question types to generate: ${types.join(", ")}
${typeInstructions}

CRITICAL RULES:
1. ALL questions MUST be based on the provided research content.
2. Distribute question types evenly among requested types.
3. For MCQ options, write COMPLETE sentences/phrases.
4. Questions should test various cognitive levels.
5. Make questions clear and unambiguous.

Respond ONLY with a valid JSON array:
[
  {
    "question_type": "mcq" | "vsa" | "lsa",
    "question": "The full question text",
    "options": ["Option A", "Option B", "Option C", "Option D"] | null,
    "correct_answer": "The complete correct answer"
  }
]

No markdown, no code blocks, no explanation.`;

    const questionsResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate ${count} questions from this research:\n\n${researchContent.substring(0, 15000)}` },
        ],
        temperature: 0.7,
      }),
    });

    if (!questionsResponse.ok) {
      if (questionsResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (questionsResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to generate questions");
    }

    const qData = await questionsResponse.json();
    const content = qData.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content returned from AI");

    let cleanedContent = content.trim();
    if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let questions;
    try {
      questions = JSON.parse(cleanedContent);
    } catch {
      console.error("Failed to parse:", cleanedContent);
      throw new Error("Failed to parse generated questions");
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid questions format");
    }

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-from-topic error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY secret is not set in Supabase. Run: supabase secrets set OPENROUTER_API_KEY=<your-key>");
    }

    const { imageData, issueType } = await req.json();

    if (!imageData || typeof imageData !== "string") {
      return new Response(
        JSON.stringify({ is_relevant: false, reason: "Image data is missing or invalid." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!issueType || typeof issueType !== "string") {
      return new Response(
        JSON.stringify({ is_relevant: false, reason: "Issue type is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageUri = imageData.startsWith("data:") ? imageData : `data:image/jpeg;base64,${imageData}`;

    const prompt = `You are an AI assistant for "Nagar Rakshak", a civic issue reporting app.
Analyze the provided image for a complaint about "${issueType}".
Determine if the image is genuinely relevant.
If relevant, provide a concise 2-line description of the problem's severity and genuineness.
Respond ONLY in JSON:
1. For irrelevant images: {"is_relevant": false, "reason": "Image does not appear to be related."}
2. For relevant images: {"is_relevant": true, "description": "YOUR_DESCRIPTION_HERE"}`;

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://nagarrakshak.netlify.app/",
        "X-Title": "Nagar Rakshak",
      },
      body: JSON.stringify({
        model: "google/gemma-3-27b-it",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUri } },
            ],
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("OpenRouter API Error:", errorText);
      throw new Error(`OpenRouter API failed with status ${aiResponse.status}: ${errorText}`);
    }

    const result = await aiResponse.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    if (!result.choices || result.choices.length === 0) {
      throw new Error("AI response was empty or blocked. Please upload a clear image.");
    }

    const aiText = result.choices[0]?.message?.content ?? "";
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Invalid AI Response:", aiText);
      throw new Error("AI response did not contain valid JSON. Make sure the image is clear.");
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Edge function error:", message);
    return new Response(
      JSON.stringify({ is_relevant: false, reason: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

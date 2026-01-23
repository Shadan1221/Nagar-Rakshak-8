import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OpenRouter API KEY from environment
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

if (!OPENROUTER_API_KEY) {
  console.error("OPENROUTER_API_KEY is not set in environment variables.");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageData, issueType } = await req.json();

    // Input validation
    if (!imageData || typeof imageData !== "string") {
      return new Response(
        JSON.stringify({
          is_relevant: false,
          reason: "Image data is missing or invalid.",
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!issueType || typeof issueType !== "string") {
      return new Response(
        JSON.stringify({
          is_relevant: false,
          reason: "Issue type is required.",
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Remove data:image/... prefix if present
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');

    // Prompt for OpenRouter Qwen
    const prompt = `
You are an AI assistant for "Nagar Rakshak", a civic issue reporting app.
Analyze the provided image for a complaint about "${issueType}".
Determine if the image is genuinely relevant.
If relevant, provide a concise 2-line description of the problem's severity and genuineness.

Respond ONLY in JSON:
1. For irrelevant images:
{"is_relevant": false, "reason": "Image does not appear to be related."}

2. For relevant images:
{"is_relevant": true, "description": "YOUR_DESCRIPTION_HERE"}
`;

    // Use OpenRouter API with Qwen vision model
    const endpoint = "https://openrouter.ai/api/v1/chat/completions";

    console.log('Calling OpenRouter API with Qwen vision model...');
    console.log('Image data length:', base64Data.length);
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY || ""}`,
        "HTTP-Referer": "https://nagar-rakshak.app",
        "X-Title": "Nagar Rakshak",
      },
      body: JSON.stringify({
        model: "qwen/qwen-2.5-vl-7b-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`,
                },
              },
            ],
          },
        ],
      }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      console.error('Error body:', errorText);
      return new Response(
        JSON.stringify({
          is_relevant: false,
          reason: `API Error: ${response.statusText}. Please try again.`,
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data));
    const aiText = data?.choices?.[0]?.message?.content || "";
    console.log('AI Text extracted:', aiText);

    if (!aiText) {
      console.error('AI response was empty');
      return new Response(
        JSON.stringify({
          is_relevant: false,
          reason: "AI response was empty. Please upload a clear image.",
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Robust JSON extraction
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      // fallback: treat response as relevant description
      return new Response(
        JSON.stringify({
          is_relevant: true,
          description: aiText.trim(),
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    try {
      const parsedResponse = JSON.parse(jsonMatch[0]);
      return new Response(
        JSON.stringify(parsedResponse),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } catch {
      return new Response(
        JSON.stringify({
          is_relevant: true,
          description: aiText.trim(),
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error("Error in analyze-complaint-image:", error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return new Response(
      JSON.stringify({
        is_relevant: false,
        reason: "An internal server error occurred.",
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

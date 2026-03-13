import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config(); // Load .env file

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Allow large images

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error("OPENROUTER_API_KEY is not set in your environment variables.");
  process.exit(1);
}

app.post("/analyze-image", async (req, res) => {
  try {
    const { imageData, issueType } = req.body;

    // Input validation
    if (!imageData || typeof imageData !== "string") {
      return res.status(400).json({ is_relevant: false, reason: "Image data is missing or invalid." });
    }
    if (!issueType || typeof issueType !== "string") {
      return res.status(400).json({ is_relevant: false, reason: "Issue type is required." });
    }

    // OpenRouter (OpenAI Compatible) API Endpoint
    const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

    const prompt = `
You are an AI assistant for "Nagar Rakshak", a civic issue reporting app.
Analyze the provided image for a complaint about "${issueType}".
Determine if the image is genuinely relevant.
If relevant, provide a concise 2-line description of the problem's severity and genuineness.
Respond ONLY in JSON:
1. For irrelevant images: {"is_relevant": false, "reason": "Image does not appear to be related."}
2. For relevant images: {"is_relevant": true, "description": "YOUR_DESCRIPTION_HERE"}
`;

    // Ensure imageData is a proper Data URI for OpenRouter/OpenAI
    // If it comes as just base64 without prefix, we might need to add it, 
    // but the previous code stripped it, implying it came with it. 
    // We will assume `imageData` is the full Data URI (e.g. data:image/jpeg;base64,...) 
    // or we construct it if needed. 
    // Assuming the frontend sends a full data URI string.
    const imageUri = imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;

    const requestBody = {
      model: "google/gemma-3-27b-it",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageUri
              }
            }
          ]
        }
      ]
    };

    const aiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://nagarrakshak.netlify.app/", // Optional: For OpenRouter rankings
        "X-Title": "Nagar Rakshak" // Optional: For OpenRouter rankings
      },
      body: JSON.stringify(requestBody),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("OpenRouter API Error:", errorText);
      throw new Error(`AI API request failed with status: ${aiResponse.status}`);
    }

    const result = (await aiResponse.json()) as {
      choices?: Array<{
        message?: { content?: string };
      }>;
    };

    if (!result.choices || result.choices.length === 0) {
      throw new Error("AI response was empty or blocked. Please upload a clear image.");
    }

    const aiText = result.choices[0]?.message?.content || "";

    // Clean up potential markdown code blocks (```json ... ```)
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Invalid AI Response:", aiText);
      throw new Error(
        "AI response did not contain a valid JSON object. Make sure the image is clear."
      );
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);

    return res.json(parsedResponse);
  } catch (error: any) {
    console.error("Error in /analyze-image:", error.message);
    return res.status(500).json({ is_relevant: false, reason: `An error occurred: ${error.message}` });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

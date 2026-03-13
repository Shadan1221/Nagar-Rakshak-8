"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_fetch_1 = __importDefault(require("node-fetch"));
dotenv_1.default.config({ path: require('path').resolve(__dirname, '.env') }); // Load .env file
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" })); // Allow large images
// ... existing imports ...
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is not set in your environment variables.");
    process.exit(1);
}
app.post("/analyze-image", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { imageData, issueType } = req.body;
        // Input validation
        if (!imageData || typeof imageData !== "string") {
            return res.status(400).json({ is_relevant: false, reason: "Image data is missing or invalid." });
        }
        if (!issueType || typeof issueType !== "string") {
            return res.status(400).json({ is_relevant: false, reason: "Issue type is required." });
        }
        
        // Ensure Data URI
        const imageUri = imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;
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
        const requestBody = {
            model: "google/gemma-3-27b-it",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: imageUri } }
                    ]
                }
            ]
        };

        const aiResponse = yield (0, node_fetch_1.default)(apiUrl, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://nagarrakshak.netlify.app/",
                "X-Title": "Nagar Rakshak"
            },
            body: JSON.stringify(requestBody),
        });

        if (!aiResponse.ok) {
            const errorText = yield aiResponse.text();
            console.error("OpenRouter API Error:", errorText);
            throw new Error(`AI API request failed with status: ${aiResponse.status}`);
        }

        const result = (yield aiResponse.json());
        if (!result.choices || result.choices.length === 0) {
            throw new Error("AI response was empty or blocked. Please upload a clear image.");
        }

        const aiText = ((_b = (_a = result.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || "";
        
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
             console.error("Invalid AI Response:", aiText);
            throw new Error("AI response did not contain a valid JSON object. Make sure the image is clear.");
        }
        const parsedResponse = JSON.parse(jsonMatch[0]);
        return res.json(parsedResponse);
    }
    catch (error) {
        console.error("Error in /analyze-image:", error.message);
        return res.status(500).json({ is_relevant: false, reason: `An error occurred: ${error.message}` });
    }
}));
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

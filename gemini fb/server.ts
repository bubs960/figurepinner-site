import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize GoogleGenAI SDK safely
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Warning: GEMINI_API_KEY is not defined in the environment.");
    // We will throw an error when used, but let the server start up cleanly
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// UI/UX & AdSense Critique Endpoint using Gemini API
app.post("/api/gemini/critique", async (req, res) => {
  try {
    const { category, text } = req.body;
    if (!category || !text) {
      return res.status(400).json({ error: "Category and text/code are required." });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured on the server. Please add your API key in the Settings > Secrets panel.",
      });
    }

    const systemInstruction = `
      You are an elite, senior UI/UX Designer and AdSense Monetization expert specializing in collectors' directories, blogs, and niche tool applications (like figurepinner.com).
      Your goal is to provide deep, practical feedback, high-conversion ad locations, responsive layout code, and loading-speed solutions.
      
      For the audit category "${category}", examine this code or context:
      "${text}"

      Formulate a detailed, professional evaluation in JSON. Each action item MUST contain a practical, high-quality, copyable code snippet (like Tailwind classes, responsive HTML wrappers, or image optimization setups) which directly implements the fix. Use human-friendly, technical advice. Do not make up facts.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Perform a conversion and design audit for the category "${category}" with the following user input: \n\n${text}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "Overall high-level, human-friendly summary of the design and performance assessment.",
            },
            score: {
              type: Type.INTEGER,
              description: "A professional design/monetization grade score out of 100 representing how well optimized this is currently.",
            },
            action_items: {
              type: Type.ARRAY,
              description: "A list of 3-4 specific, actionable items to resolve UI/UX issues or speed bottlenecks.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "A concise and catchy action item title." },
                  description: { type: Type.STRING, description: "Detailed description of how to resolve the issue." },
                  code_snippet: { type: Type.STRING, description: "Exact ready-to-copy HTML, CSS/Tailwind, or JS code snippet that implements the solution." },
                },
                required: ["title", "description", "code_snippet"],
              },
            },
            adsense_earnings_potential: {
              type: Type.STRING,
              description: "Estimated lift in AdSense RPM or monetization rate (e.g. '+30% to +45% CTR lift by transitioning to adaptive in-feed bento blocks').",
            },
          },
          required: ["summary", "score", "action_items", "adsense_earnings_potential"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No text response returned from Gemini API");
    }

    const jsonResponse = JSON.parse(resultText.trim());
    return res.json(jsonResponse);
  } catch (error: any) {
    console.error("Error in critique API:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred while generating the visual audit.",
    });
  }
});

// Setup Vite Dev Server / Prod Static files
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

initServer().catch((err) => {
  console.error("Vite/Express initialization failed:", err);
});

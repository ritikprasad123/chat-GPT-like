import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parsing
app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
} else {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in the environment variables!");
}

// REST route for model status & diagnostics
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!apiKey,
    timestamp: new Date().toISOString(),
  });
});

// Stream route for chat completions (SSE pattern)
app.post("/api/chat", async (req, res) => {
  if (!ai) {
    return res.status(500).json({
      error: "Gemini API key is missing. Please configure GEMINI_API_KEY in Settings > Secrets."
    });
  }

  const { messages, model, systemInstruction, temperature } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  // Set headers for SSE (Server-Sent Events) streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    // Adapt conversation messages format for standard Gemini SDK contents mapping:
    // User role maps to 'user'. Assistant role maps to 'model'. System instructions are handled separately.
    const contents: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Skip system instructions in message history since it's passed via config
        continue;
      }

      const role = msg.role === 'user' ? 'user' : 'model';
      const parts: any[] = [];

      // Add simple text content if present
      if (msg.content) {
        parts.push({ text: msg.content });
      }

      // Add attachment parts (Base64 inlineData) if present
      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const attachment of msg.attachments) {
          const matches = attachment.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            parts.push({
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            });
          }
        }
      }

      // Only push if there's actual content (text or file attachment)
      if (parts.length > 0) {
        contents.push({
          role: role,
          parts: parts
        });
      }
    }

    // Prepare parameters matching GenerateContentParameters
    const selectedModel = model || "gemini-3.5-flash";
    const config: any = {};

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    if (typeof temperature === 'number') {
      config.temperature = temperature;
    }

    // Call generateContentStream
    const responseStream = await ai.models.generateContentStream({
      model: selectedModel,
      contents: contents,
      config: config,
    });

    for await (const chunk of responseStream) {
      const text = chunk.text || "";
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    // Finalize stream
    res.write("data: [DONE]\n\n");
    res.end();

  } catch (error: any) {
    console.error("Gemini stream generation failed:", error);
    const errorMessage = error?.message || String(error);
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
});

// Configure Vite integration as middleware or static asset serving
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting development server with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production assets...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Chat app running at http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to setup Vite server app:", err);
  process.exit(1);
});

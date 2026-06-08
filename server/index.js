import "dotenv/config";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = [
  "You are a friendly, knowledgeable trip-planning assistant.",
  "Help the user plan trips: destinations, budgets, packing, local food,",
  "transport, and timing.",
  "",
  "Before planning, check whether you know the basics:",
  "(1) rough dates or season, (2) trip length, (3) who's traveling,",
  "and (4) budget. If one or more of these is missing, ask ONE short",
  "clarifying question to fill the most important gap before you plan.",
  "Do not ask more than one question at a time, and do not start planning",
  "in the same reply.",
  "",
  "Once you have enough to be useful, keep replies concise and skimmable:",
  "short paragraphs and tight bullet points rather than long prose.",
  "Do NOT produce a day-by-day itinerary unless the user explicitly asks",
  "for one. Use markdown for light structure when it aids readability.",
].join("\n");

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages must be a non-empty array." });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res
        .status(500)
        .json({ error: "Server is missing ANTHROPIC_API_KEY. Add it to server/.env." });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    });

    stream.on("text", (textDelta) => {
      res.write(textDelta);
    });

    await stream.finalMessage();
    res.end();
  } catch (err) {
    console.error("Error calling Anthropic:", err);
    if (res.headersSent) {
      res.end();
    } else {
      res.status(500).json({ error: "Failed to get a response from Claude." });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Trip planner server listening on http://localhost:${PORT}`);
});

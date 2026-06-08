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

const MODEL = "claude-sonnet-4-5-20250929";

const TOOLS = [
  {
    name: "get_current_time",
    description:
      "Get the current date and time from the server. Use this whenever the " +
      "user asks about the current date, time, day of the week, or anything " +
      "that depends on knowing 'now'. Do not guess the date.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

function runTool(name, _input) {
  switch (name) {
    case "get_current_time": {
      const now = new Date();
      return {
        iso: now.toISOString(),
        local: now.toString(),
      };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

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

    // Conversation we send to Claude. We append assistant tool_use turns and
    // user tool_result turns as the tool-use loop progresses.
    const convo = messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    // Run the tool-use loop until Claude returns a normal final answer.
    // The maxTurns cap is a safety net against an unexpected loop.
    let finalText = "";
    const maxTurns = 8;

    for (let turn = 0; turn < maxTurns; turn++) {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: convo,
      });

      if (response.stop_reason === "tool_use") {
        // Record the assistant turn (which includes the tool_use blocks)
        // verbatim so the follow-up tool_result blocks line up with it.
        convo.push({ role: "assistant", content: response.content });

        const toolResults = response.content
          .filter((block) => block.type === "tool_use")
          .map((block) => ({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(runTool(block.name, block.input)),
          }));

        convo.push({ role: "user", content: toolResults });
        continue;
      }

      // Normal final answer: collect the text blocks and stop looping.
      finalText = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");
      break;
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.send(finalText);
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

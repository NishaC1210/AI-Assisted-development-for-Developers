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

const MODEL = "claude-opus-4-8";

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
  {
    name: "convert_currency",
    description:
      "Convert an amount of money from one currency to another using live " +
      "exchange rates from the Frankfurter API. Use this whenever the user " +
      "asks to convert money or about exchange rates. Do not guess rates, " +
      "since you do not know today's exchange rates.",
    input_schema: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "The amount of money to convert, e.g. 100.",
        },
        from: {
          type: "string",
          description: "The source currency as a 3-letter ISO code, e.g. 'USD'.",
        },
        to: {
          type: "string",
          description: "The target currency as a 3-letter ISO code, e.g. 'EUR'.",
        },
      },
      required: ["amount", "from", "to"],
    },
  },
  {
    name: "geocode_place",
    description:
      "Look up the geographic coordinates (latitude and longitude) of a city " +
      "or place by name, using the Open-Meteo geocoding API. Use this first " +
      "when the user asks about a place by name and you need its coordinates " +
      "(for example, before getting its weather).",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The city or place name to look up, e.g. 'Paris' or 'Kyoto'.",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "get_weather",
    description:
      "Get the current conditions and a short daily forecast for a location " +
      "given its latitude and longitude, using the Open-Meteo forecast API. " +
      "If you only have a place name, call geocode_place first to get the " +
      "coordinates, then pass them here.",
    input_schema: {
      type: "object",
      properties: {
        latitude: {
          type: "number",
          description: "Latitude of the location, e.g. 48.8566.",
        },
        longitude: {
          type: "number",
          description: "Longitude of the location, e.g. 2.3522.",
        },
      },
      required: ["latitude", "longitude"],
    },
  },
  {
    name: "get_destination_guide",
    description:
      "Get a short travel overview for a place (city, region, or country) by " +
      "name, using the free, keyless Wikivoyage API (falling back to the " +
      "Wikipedia summary API). Returns a couple of short paragraphs on what " +
      "the place is known for and what's worth seeing. Use this when the user " +
      "wants to know what a destination is like or what to do there. Summarize " +
      "the returned text in your own words rather than pasting it verbatim.",
    input_schema: {
      type: "object",
      properties: {
        place: {
          type: "string",
          description:
            "The destination name to look up, e.g. 'Kyoto', 'Tuscany', or 'Peru'.",
        },
      },
      required: ["place"],
    },
  },
  {
    name: "get_travel_advisory",
    description:
      "Get the current UK government (FCDO) foreign travel advice for a " +
      "country, using the free, keyless GOV.UK Content API. Returns the alert " +
      "status and a short summary of the advice. Use this when the user asks " +
      "whether a country is safe to visit or about travel advisories/warnings. " +
      "Make clear in your reply that this is UK government (FCDO) advice. If no " +
      "advisory page exists for the country, report that none was found.",
    input_schema: {
      type: "object",
      properties: {
        country: {
          type: "string",
          description:
            "The country name, e.g. 'Portugal' or 'South Korea'. It will be " +
            "lowercased and hyphenated to match the GOV.UK URL.",
        },
      },
      required: ["country"],
    },
  },
];

// Minimal WMO weather code descriptions so the model can phrase conditions
// without guessing what a numeric code means.
const WEATHER_CODES = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function describeWeatherCode(code) {
  return WEATHER_CODES[code] ?? `Unknown (code ${code})`;
}

// Fetch with a hard timeout so a hung external API can't stall the whole
// conversation, plus one quick retry on a timeout/network failure. Throws a
// descriptive Error if every attempt fails; callers turn that into a clear
// error result so the assistant can report the problem and keep going.
async function fetchWithTimeout(url, { timeoutMs = 6000, retries = 1 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
    }
  }
  const timedOut = lastErr?.name === "AbortError";
  throw new Error(timedOut ? "request timed out" : "request failed");
}

async function convertCurrency({ amount, from, to }) {
  const base = String(from || "").toUpperCase();
  const target = String(to || "").toUpperCase();
  const url =
    `https://api.frankfurter.app/latest?amount=${encodeURIComponent(amount)}` +
    `&from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`;

  let apiRes;
  try {
    apiRes = await fetchWithTimeout(url);
  } catch {
    return { error: "Currency API did not respond in time. Please try again." };
  }
  if (!apiRes.ok) {
    return { error: `Currency API request failed (HTTP ${apiRes.status}).` };
  }

  const data = await apiRes.json();
  const converted = data?.rates?.[target];
  if (typeof converted !== "number") {
    return { error: `Could not convert ${base} to ${target}.` };
  }

  return {
    amount,
    from: base,
    to: target,
    converted,
    rate: amount ? converted / amount : null,
    date: data.date,
  };
}

async function geocodePlace({ name }) {
  const query = String(name || "").trim();
  if (!query) {
    return { error: "A place name is required." };
  }

  const url =
    "https://geocoding-api.open-meteo.com/v1/search" +
    `?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;

  let apiRes;
  try {
    apiRes = await fetchWithTimeout(url);
  } catch {
    return { error: "Geocoding API did not respond in time. Please try again." };
  }
  if (!apiRes.ok) {
    return { error: `Geocoding API request failed (HTTP ${apiRes.status}).` };
  }

  const data = await apiRes.json();
  const place = data?.results?.[0];
  if (!place) {
    return { error: `No coordinates found for "${query}".` };
  }

  return {
    name: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    country: place.country,
    admin1: place.admin1,
    timezone: place.timezone,
  };
}

async function getWeather({ latitude, longitude }) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return { error: "Both latitude and longitude (as numbers) are required." };
  }

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${encodeURIComponent(latitude)}` +
    `&longitude=${encodeURIComponent(longitude)}` +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
    "&timezone=auto&forecast_days=3";

  let apiRes;
  try {
    apiRes = await fetchWithTimeout(url);
  } catch {
    return { error: "Weather API did not respond in time. Please try again." };
  }
  if (!apiRes.ok) {
    return { error: `Weather API request failed (HTTP ${apiRes.status}).` };
  }

  const data = await apiRes.json();
  const current = data.current || {};
  const daily = data.daily || {};

  const forecast = (daily.time || []).map((date, i) => ({
    date,
    conditions: describeWeatherCode(daily.weather_code?.[i]),
    high: daily.temperature_2m_max?.[i],
    low: daily.temperature_2m_min?.[i],
    precipitationChance: daily.precipitation_probability_max?.[i],
  }));

  return {
    latitude,
    longitude,
    units: {
      temperature: data.current_units?.temperature_2m ?? "°C",
      windSpeed: data.current_units?.wind_speed_10m ?? "km/h",
    },
    current: {
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      conditions: describeWeatherCode(current.weather_code),
    },
    forecast,
  };
}

// Trim a long extract down to the first couple of paragraphs (and a hard
// character cap) so the returned text stays short and easy to summarize.
function shortenOverview(text, { maxParagraphs = 2, maxChars = 900 } = {}) {
  const cleaned = String(text || "").trim();
  if (!cleaned) return "";
  let overview = cleaned
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, maxParagraphs)
    .join("\n\n");
  if (overview.length > maxChars) {
    overview = overview.slice(0, maxChars).replace(/\s+\S*$/, "") + "…";
  }
  return overview;
}

async function getDestinationGuide({ place }) {
  const query = String(place || "").trim();
  if (!query) {
    return { error: "A place name is required." };
  }

  // First choice: Wikivoyage, which is travel-focused. Its MediaWiki API
  // returns the lead section as plain text when we ask for the intro extract.
  try {
    const voyageUrl =
      "https://en.wikivoyage.org/w/api.php" +
      "?action=query&prop=extracts&exintro=1&explaintext=1" +
      "&redirects=1&format=json&origin=*" +
      `&titles=${encodeURIComponent(query)}`;
    const voyageRes = await fetchWithTimeout(voyageUrl);
    if (voyageRes.ok) {
      const data = await voyageRes.json();
      const pages = data?.query?.pages || {};
      const page = Object.values(pages)[0];
      const overview = shortenOverview(page?.extract);
      if (page && page.missing === undefined && overview) {
        return {
          place: page.title || query,
          overview,
          source: "Wikivoyage",
        };
      }
    }
  } catch {
    // Fall through to the Wikipedia fallback below.
  }

  // Fallback: the Wikipedia REST summary API, which is simpler and almost
  // always has something for a named place.
  try {
    const wikiUrl =
      "https://en.wikipedia.org/api/rest_v1/page/summary/" +
      encodeURIComponent(query.replace(/\s+/g, "_"));
    const wikiRes = await fetchWithTimeout(wikiUrl);
    if (wikiRes.ok) {
      const data = await wikiRes.json();
      const overview = shortenOverview(data?.extract);
      if (overview) {
        return {
          place: data.title || query,
          overview,
          source: "Wikipedia",
        };
      }
    }
  } catch {
    // Handled by the generic error return below.
  }

  return { error: `No travel overview found for "${query}".` };
}

// FCDO alert codes are machine-readable; turn them into a plain-English phrase.
function describeAlertStatus(code) {
  const map = {
    avoid_all_travel: "FCDO advises against all travel to the whole country",
    avoid_all_but_essential_travel:
      "FCDO advises against all but essential travel to the whole country",
    avoid_all_travel_to_parts:
      "FCDO advises against all travel to parts of the country",
    avoid_all_but_essential_travel_to_parts:
      "FCDO advises against all but essential travel to parts of the country",
  };
  return map[code] || code.replace(/_/g, " ");
}

async function getTravelAdvisory({ country }) {
  const raw = String(country || "").trim();
  if (!raw) {
    return { error: "A country name is required." };
  }

  // GOV.UK uses lowercased, hyphenated slugs, e.g. "South Korea" -> "south-korea".
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const url = `https://www.gov.uk/api/content/foreign-travel-advice/${slug}`;

  let apiRes;
  try {
    apiRes = await fetchWithTimeout(url);
  } catch {
    return { error: "GOV.UK travel advice API did not respond in time. Please try again." };
  }

  if (apiRes.status === 404) {
    return {
      source: "UK FCDO (GOV.UK)",
      found: false,
      message: `No UK FCDO travel advisory page found for "${raw}".`,
    };
  }
  if (!apiRes.ok) {
    return { error: `GOV.UK API request failed (HTTP ${apiRes.status}).` };
  }

  const data = await apiRes.json();
  const details = data?.details || {};
  const alertCodes = Array.isArray(details.alert_status) ? details.alert_status : [];

  // The "Warnings and insurance" part holds the headline advice; strip the
  // HTML and keep a short excerpt so we don't return the whole (large) page.
  const warningsPart = (details.parts || []).find((p) => /warnings/i.test(p.title));
  let summary = "";
  if (warningsPart?.body) {
    summary = warningsPart.body
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 600);
    if (warningsPart.body.length > summary.length) summary += "…";
  }

  return {
    source: "UK FCDO (GOV.UK)",
    found: true,
    country: data.title || raw,
    alertStatus:
      alertCodes.length > 0
        ? alertCodes.map(describeAlertStatus)
        : ["No specific FCDO travel warning against travel to this country."],
    summary: summary || data.description || "",
    lastUpdated: data.public_updated_at || details.updated_at || null,
    url: data.base_path ? `https://www.gov.uk${data.base_path}` : url,
  };
}

async function runTool(name, input) {
  switch (name) {
    case "get_current_time": {
      const now = new Date();
      return {
        iso: now.toISOString(),
        local: now.toString(),
      };
    }
    case "convert_currency":
      return convertCurrency(input || {});
    case "geocode_place":
      return geocodePlace(input || {});
    case "get_weather":
      return getWeather(input || {});
    case "get_destination_guide":
      return getDestinationGuide(input || {});
    case "get_travel_advisory":
      return getTravelAdvisory(input || {});
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

    // We stream newline-delimited JSON events so the client can show what's
    // happening as the loop runs (e.g. which tool is being called) before the
    // final answer arrives. Each line is one JSON object with a "type".
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }
    const sendEvent = (event) => res.write(JSON.stringify(event) + "\n");

    // Conversation we send to Claude. We append assistant tool_use turns and
    // user tool_result turns as the tool-use loop progresses.
    const convo = messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    // Run the tool-use loop until Claude returns a normal final answer.
    // The maxTurns cap is a safety net against an unexpected loop.
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

        const toolUseBlocks = response.content.filter(
          (block) => block.type === "tool_use"
        );

        // Announce every tool call up front so the client shows a chip for
        // each one as it starts, then run them all at the same time and wait
        // for the whole batch together. Promise.all preserves order, so the
        // tool_result blocks still line up with their tool_use blocks.
        const toolResults = await Promise.all(
          toolUseBlocks.map(async (block) => {
            sendEvent({ type: "tool_use", name: block.name, input: block.input });
            const result = await runTool(block.name, block.input);
            return {
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(result),
            };
          })
        );

        convo.push({ role: "user", content: toolResults });
        continue;
      }

      // Normal final answer: collect the text blocks and finish.
      const finalText = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");
      sendEvent({ type: "text", text: finalText });
      break;
    }

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

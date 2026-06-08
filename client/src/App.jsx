import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

// Build a short, human-readable summary of a tool's input for the chip.
function formatToolInput(input) {
  if (!input || typeof input !== "object") return "";
  const entries = Object.entries(input).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );
  if (entries.length === 0) return "";

  // Currency conversion reads best as "100 USD → EUR".
  if ("amount" in input && "from" in input && "to" in input) {
    return `${input.amount} ${input.from} → ${input.to}`;
  }

  return entries.map(([k, v]) => `${k}: ${v}`).join(", ");
}

const WELCOME = {
  role: "assistant",
  content:
    "Hi! I'm your trip-planning assistant. Tell me where you'd like to go, " +
    "your dates or trip length, who's traveling, and a rough budget, and I'll " +
    "help you put together a plan.",
};

export default function App() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError("");
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Request failed.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: "", tools: [] }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      const handleEvent = (event) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (event.type === "tool_use") {
            updated[updated.length - 1] = {
              ...last,
              tools: [...(last.tools || []), { name: event.name, input: event.input }],
            };
          } else if (event.type === "text") {
            updated[updated.length - 1] = { ...last, content: event.text };
          }
          return updated;
        });
      };

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          // The server sends newline-delimited JSON; process complete lines and
          // keep any trailing partial line in the buffer for the next read.
          let newlineIndex;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);
            if (line) handleEvent(JSON.parse(line));
          }
        }
      }
      const leftover = buffer.trim();
      if (leftover) handleEvent(JSON.parse(leftover));
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Trip Planner Assistant</h1>
        <p>Plan your next adventure with a little help from Claude.</p>
      </header>

      <main className="chat" ref={scrollRef} aria-live="polite" aria-label="Conversation">
        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          const isPending = m.role === "assistant" && !m.content && loading && isLast;
          return (
            <div key={i} className={`message message-${m.role}`}>
              <div className="message-role" aria-hidden="true">
                {m.role === "user" ? "You" : "Assistant"}
              </div>
              {m.tools && m.tools.length > 0 && (
                <ul className="tool-uses" aria-label="Tools used">
                  {m.tools.map((tool, t) => {
                    const summary = formatToolInput(tool.input);
                    return (
                      <li key={t} className="tool-use">
                        <span className="tool-use-icon" aria-hidden="true">⚙</span>
                        <span>
                          Used tool: <code>{tool.name}</code>
                          {summary && <span className="tool-use-args">{summary}</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {isPending ? (
                <div className="message-content typing">Thinking…</div>
              ) : (
                m.content && (
                  <div className="message-content">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )
              )}
            </div>
          );
        })}
        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="message message-assistant">
            <div className="message-role" aria-hidden="true">Assistant</div>
            <div className="message-content typing">Thinking…</div>
          </div>
        )}
      </main>

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <form className="composer" onSubmit={sendMessage}>
        <label htmlFor="composer-input" className="sr-only">
          Type your message
        </label>
        <input
          id="composer-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Plan a 5-day trip to Japan in spring"
          aria-label="Type your message"
          autoComplete="off"
        />
        <button type="submit" disabled={loading || !input.trim()} aria-label="Send message">
          Send
        </button>
      </form>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const SUGGESTED_QUERIES = [
  "How do I replace the mechanical seal on a pump?",
  "What are the OISD-118 inspection requirements for pressure vessels?",
  "Show me the safety precautions for confined space entry",
  "What equipment is most likely to fail this week?",
  "What are common causes of heat exchanger fouling?",
  "How do I do root cause analysis for bearing failure?",
  "What is the isolation procedure for Valve V-201?",
  "Explain Factory Act requirements for rotating equipment",
];

export default function ChatCopilot() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am IndustrialBrain — your AI knowledge copilot.\n\nI have access to equipment manuals, maintenance records, safety procedures, incident reports, and regulatory standards.\n\nAsk me anything about maintenance, compliance, failure patterns, or equipment history.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [equipmentTag, setEquipmentTag] = useState("");
  const [sources, setSources] = useState([]);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text = input.trim()) => {
    if (!text || isStreaming) return;
    setError(null);
    setSources([]);
    const userMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);
    try {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      const response = await fetch(`${BASE_URL}/api/query/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, equipment_tag: equipmentTag || null }),
        signal: abortRef.current.signal,
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) throw new Error(data.error);
            if (data.token) {
              fullText += data.token;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: fullText, streaming: !data.done };
                return updated;
              });
            }
            if (data.done) {
              if (data.sources?.length) setSources(data.sources);
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: fullText, streaming: false };
                return updated;
              });
            }
          } catch (parseErr) {
            if (parseErr.message.includes("error")) throw parseErr;
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message);
      setMessages((prev) => prev.filter((m) => !(m.streaming && m.content === "")));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{ role: "assistant", content: "Chat cleared. What would you like to know?" }]);
    setSources([]);
    setError(null);
  };

  const S = {
    wrap: { display: "flex", flexDirection: "column", height: "100vh", background: "#0f1117", color: "#e5e7eb" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #1f2937" },
    avatar: { width: 36, height: 36, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 13 },
    messages: { flex: 1, overflowY: "auto", padding: "20px 16px" },
    userBubble: { maxWidth: "72%", padding: "12px 16px", borderRadius: "18px 18px 4px 18px", background: "#2563eb", fontSize: 14, lineHeight: 1.6, color: "#fff", whiteSpace: "pre-wrap" },
    aiBubble: { maxWidth: "72%", padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "#1f2937", fontSize: 14, lineHeight: 1.6, color: "#e5e7eb" },
    input: { padding: "12px 16px", background: "#1f2937", border: "1px solid #374151", borderRadius: 16, color: "#e5e7eb", fontSize: 14, resize: "none", outline: "none", flex: 1, minHeight: 48, maxHeight: 160, fontFamily: "inherit", lineHeight: 1.5 },
    sendBtn: (active) => ({ width: 46, height: 46, borderRadius: 14, background: active ? "#2563eb" : "#374151", border: "none", cursor: active ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }),
    stopBtn: { width: 46, height: 46, borderRadius: 14, background: "#dc2626", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  };

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={S.avatar}>IB</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>IndustrialBrain Copilot</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>AI Knowledge Assistant — Plant Operations</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="text"
            placeholder="Equipment tag (P-201)"
            value={equipmentTag}
            onChange={(e) => setEquipmentTag(e.target.value.toUpperCase())}
            style={{ padding: "6px 12px", background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#e5e7eb", fontSize: 13, width: 180, outline: "none" }}
          />
          <button
            onClick={clearChat}
            style={{ padding: "6px 14px", background: "transparent", border: "1px solid #374151", borderRadius: 8, color: "#9ca3af", cursor: "pointer", fontSize: 13 }}
          >
            Clear
          </button>
        </div>
      </div>

      <div style={S.messages}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 20, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && <div style={{ ...S.avatar, marginTop: 4 }}>IB</div>}
            <div style={msg.role === "user" ? S.userBubble : S.aiBubble}>
              {msg.role === "assistant" ? (
                <div>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {msg.streaming && <span style={{ display: "inline-block", width: 8, height: 16, background: "#60a5fa", marginLeft: 2, animation: "pulse 1s infinite" }} />}
                </div>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === "user" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#374151", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: "bold", flexShrink: 0, marginTop: 4 }}>
                You
              </div>
            )}
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.content === "" && (
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <div style={S.avatar}>IB</div>
            <div style={{ background: "#1f2937", borderRadius: "18px 18px 18px 4px", padding: "14px 18px", display: "flex", gap: 4, alignItems: "center" }}>
              {[0, 150, 300].map((delay, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#6b7280", animation: `bounce 1s ${delay}ms infinite` }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ display: "inline-block", background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", color: "#fca5a5", padding: "10px 16px", borderRadius: 10, fontSize: 13 }}>
              {error}
              <button onClick={() => setError(null)} style={{ marginLeft: 10, color: "#f87171", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Dismiss
              </button>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {sources.length > 0 && (
        <div style={{ padding: "10px 20px", borderTop: "1px solid #1f2937", background: "#111827" }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>Sources used:</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {sources.map((src, i) => (
              <div key={i} style={{ fontSize: 12, background: "#1f2937", border: "1px solid #374151", borderRadius: 8, padding: "4px 10px", color: "#d1d5db" }} title={src.preview}>
                📄 {src.filename} <span style={{ color: "#6b7280" }}>({Math.round(src.relevance * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {messages.length <= 1 && (
        <div style={{ padding: "12px 20px", borderTop: "1px solid #1f2937" }}>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Try asking:</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {SUGGESTED_QUERIES.slice(0, 4).map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                style={{ textAlign: "left", padding: "10px 14px", background: "#1f2937", border: "1px solid #374151", borderRadius: 12, color: "#d1d5db", fontSize: 13, cursor: "pointer", lineHeight: 1.4 }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "14px 20px", borderTop: "1px solid #1f2937", background: "#111827" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", maxWidth: 900, margin: "0 auto" }}>
          <textarea
            ref={null}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Ask anything about your plant, equipment, procedures, or compliance..."
            rows={1}
            style={S.input}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
            }}
          />
          {isStreaming ? (
            <button
              onClick={() => {
                if (abortRef.current) abortRef.current.abort();
                setIsStreaming(false);
              }}
              style={S.stopBtn}
            >
              <div style={{ width: 14, height: 14, background: "#fff", borderRadius: 2 }} />
            </button>
          ) : (
            <button onClick={() => sendMessage()} disabled={!input.trim()} style={S.sendBtn(!!input.trim())}>
              <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: "#4b5563", marginTop: 8 }}>
          Enter to send · Shift+Enter for new line · Stop button cancels response
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0} }
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-thumb{background:#374151;border-radius:3px}
      `}</style>
    </div>
  );
}

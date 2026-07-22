import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import PageShell from "../components/shared/PageShell";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Send, Trash2, StopCircle, Layers, Search, Zap, AlertTriangle, ShieldCheck } from "lucide-react";
import { useToastStore } from "../store/toastStore";
import { getEquipmentList } from "../services/api";

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
  const location = useLocation();
  const pushToast = useToastStore((s) => s.push);

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
  const [equipmentList, setEquipmentList] = useState([]);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  // Load equipment list for dropdown
  useEffect(() => {
    getEquipmentList()
      .then((data) => setEquipmentList(data.equipment || []))
      .catch((err) => console.error("Failed to load equipment list:", err));
  }, []);

  // Handle location state redirect from Document Intelligence
  useEffect(() => {
    if (location.state?.initialPrompt) {
      sendMessage(location.state.initialPrompt);
    }
  }, [location.state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text = input.trim()) => {
    if (!text || isStreaming) return;
    setError(null);
    setSources([]);
    const userMessage = { role: "user", content: text };
    const updatedMessages = [...messages.filter(m => !m.streaming), userMessage];
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
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) throw new Error(data.error);
            if (data.token) {
              fullText += data.token;
              setMessages((prev) => {
                const updated = [...prev];
                if (updated[updated.length - 1]?.streaming) {
                  updated[updated.length - 1] = { role: "assistant", content: fullText, streaming: !data.done };
                }
                return updated;
              });
            }
            if (data.done) {
              if (data.sources?.length) setSources(data.sources);
              setMessages((prev) => {
                const updated = [...prev];
                if (updated[updated.length - 1]?.streaming) {
                  updated[updated.length - 1] = { role: "assistant", content: fullText, streaming: false };
                }
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
    pushToast({ type: "info", title: "Chat Cleared", message: "Conversation history has been reset.", duration: 2000 });
  };

  const selectedEquipmentDetails = equipmentList.find(e => e.tag_id === equipmentTag);

  return (
    <PageShell topbarPlaceholder="Ask Copilot about plant safety or maintenance procedures...">
      <div className="flex flex-col md:flex-row h-full overflow-hidden bg-primary-app">
        
        {/* Left Side: Context Scoping Sidebar */}
        <div className="w-full md:w-80 shrink-0 border-b md:border-b-0 md:border-r p-5 flex flex-col gap-5 bg-secondary-app border-primary-app overflow-y-auto">
          <div>
            <h3 className="text-sm font-semibold font-sora text-primary-app flex items-center gap-2">
              <Layers size={14} className="text-[var(--accent-primary)]" /> Context Scoping
            </h3>
            <p className="text-[11px] text-tertiary-app mt-1 leading-relaxed">
              Tag an asset to automatically scope the AI reasoning engine to its Neo4j relationships and sensor data.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="ib-label">Scope Equipment Tag</label>
            <select
              value={equipmentTag}
              onChange={(e) => setEquipmentTag(e.target.value)}
              className="ib-input w-full bg-surface-secondary border-primary-app text-primary-app"
            >
              <option value="">-- Search General Knowledge --</option>
              {equipmentList.map((eq) => (
                <option key={eq.tag_id} value={eq.tag_id}>
                  {eq.tag_id} - {eq.name}
                </option>
              ))}
            </select>
          </div>

          {/* Scoped Context Preview */}
          <AnimatePresence>
            {equipmentTag && selectedEquipmentDetails && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="p-4 rounded-xl border border-primary-app bg-surface-primary flex flex-col gap-3"
              >
                <div className="flex items-center justify-between border-b pb-2 border-primary-app">
                  <span className="text-[11px] font-bold font-mono text-primary-app">{selectedEquipmentDetails.tag_id}</span>
                  <span className={`ib-badge ${
                    selectedEquipmentDetails.criticality === "Critical" ? "ib-badge-critical" :
                    selectedEquipmentDetails.criticality === "High" ? "ib-badge-warning" : "ib-badge-info"
                  } scale-90`}>
                    {selectedEquipmentDetails.criticality}
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px] text-secondary-app">
                  <p><strong className="text-tertiary-app font-normal">Name:</strong> {selectedEquipmentDetails.name}</p>
                  <p><strong className="text-tertiary-app font-normal">Type:</strong> {selectedEquipmentDetails.equipment_type}</p>
                  <p><strong className="text-tertiary-app font-normal">Location:</strong> {selectedEquipmentDetails.location}</p>
                </div>
                <div className="p-2 rounded bg-blue-500/5 border border-blue-500/15 flex items-start gap-1.5 text-[10px] text-secondary-app mt-1">
                  <Zap size={11} className="text-blue-500 mt-0.5 shrink-0" />
                  <span>Neo4j Graph Topology & past incidents merged into prompt context.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-primary-app">
          
          {/* Chat Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between border-primary-app bg-secondary-app">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-sm"
                style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}>
                <Bot size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold font-sora text-primary-app">IndustrialBrain Copilot</h2>
                <p className="text-[10px] text-tertiary-app mt-0.5">Dual-RAG Specialist Agent Routing</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="ib-btn ib-btn-ghost py-1.5 px-3 text-[11px] font-bold flex items-center gap-1.5"
            >
              <Trash2 size={12} /> Reset Chat
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3.5 max-w-[85%] md:max-w-[75%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                  msg.role === "user" ? "bg-slate-600" : "bg-blue-600"
                }`}>
                  {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed border ${
                  msg.role === "user"
                    ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/20 text-primary-app"
                    : "bg-surface-primary border-primary-app text-primary-app shadow-sm"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-primary-app">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {msg.streaming && (
                        <span className="inline-block w-1.5 h-4 bg-blue-500 ml-1.5 animate-pulse" />
                      )}
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
              </div>
            ))}

            {isStreaming && messages[messages.length - 1]?.content === "" && (
              <div className="flex gap-3.5 mr-auto">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-600 text-white">
                  <Bot size={14} />
                </div>
                <div className="p-4 rounded-2xl bg-surface-primary border border-primary-app flex gap-1.5 items-center">
                  {[0, 150, 300].map((delay, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/5 text-xs text-red-500 font-medium">
                  <AlertTriangle size={13} />
                  <span>{error}</span>
                  <button onClick={() => setError(null)} className="underline hover:text-red-600 ml-1">
                    Dismiss
                  </button>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Sources panel */}
          {sources.length > 0 && (
            <div className="px-6 py-2.5 border-t border-primary-app bg-secondary-app">
              <span className="text-[10px] text-tertiary-app uppercase font-bold tracking-wider">Citations Verified:</span>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {sources.map((src, i) => (
                  <div key={i} className="text-xs px-2.5 py-1 rounded-md border border-primary-app bg-surface-primary text-secondary-app font-medium" title={src.preview}>
                    📄 {src.filename} <span className="text-tertiary-app font-normal">({Math.round(src.relevance * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested prompts grid */}
          {messages.length <= 1 && (
            <div className="px-6 py-4 border-t border-primary-app bg-secondary-app">
              <span className="text-[10px] text-tertiary-app uppercase font-bold tracking-wider">Suggested Queries:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {SUGGESTED_QUERIES.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="p-3 text-left rounded-xl border transition-all text-xs font-medium text-secondary-app border-primary-app bg-surface-primary hover:border-[var(--accent-primary)] hover:bg-surface-secondary"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-primary-app bg-secondary-app">
            <div className="max-w-4xl mx-auto flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                placeholder="Ask Copilot about troubleshooting guidelines, inspection manuals, safety forms..."
                rows={1}
                className="ib-input flex-1 min-h-[44px] max-h-[140px] resize-none overflow-y-auto font-sans leading-normal"
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
                }}
              />
              {isStreaming ? (
                <button
                  onClick={() => {
                    if (abortRef.current) abortRef.current.abort();
                    setIsStreaming(false);
                  }}
                  className="ib-btn flex-none w-11 h-11 justify-center rounded-xl bg-red-500 text-white hover:bg-red-600 shrink-0 p-0"
                >
                  <StopCircle size={18} />
                </button>
              ) : (
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim()}
                  className={`ib-btn flex-none w-11 h-11 justify-center rounded-xl shrink-0 p-0 ${
                    input.trim() ? "ib-btn-primary" : "bg-slate-300 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Send size={15} />
                </button>
              )}
            </div>
            <div className="text-[10px] text-center text-tertiary-app mt-2">
              Enter to send · Shift+Enter for new line · AI generated answers should be validated.
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
}

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Bot, User, Zap, Share2, FileText, Clock } from "lucide-react";
import PageShell from "../components/shared/PageShell";

const HISTORY = [
  "Turbine efficiency report...",
  "P&ID mapping for Sector 7",
  "Compliance audit log...",
];

const SUGGESTED = [
  "What is the vibration threshold for Stage 3 Compressor?",
  "Show maintenance history for PUMP-A1",
  "Generate compliance gap report for ISO 13849",
  "Predict failure timeline for MOTOR-E1",
];

const INITIAL_MESSAGES = [
  {
    id: 1, role: "user",
    text: "What is the current vibration threshold for the Stage 3 Compressor in the North Wing, and are we approaching a critical state?",
    time: "14:03 PM",
  },
  {
    id: 2, role: "ai",
    text: "Based on real-time telemetry from the North Wing sensor array (NW-S3-C), the vibration threshold is set at ",
    highlight: "4.2 mm/s RMS",
    text2: ".\n\nCurrent readings show a steady increase over the past 6 hours, reaching 3.8 mm/s. While not yet critical, the trend indicates potential threshold breach within 18–24 hours.",
    time: "14:03 PM",
    actions: ["Explain schematic", "Draft summary"],
    confidence: 94,
  },
];

const CONTEXT = {
  name: "Comp-NW-S3",
  sub: "Stage 3 Compressor Unit",
  metrics: [
    { label: "Operating Temp", value: "184°C", max: "220°C", pct: 84, color: "#FBBF24" },
    { label: "Throughput", value: "9,420 m³/h", pct: 72, color: "#34D399" },
  ],
};

function Message({ msg }) {
  const isAI = msg.role === "ai";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isAI ? "" : "flex-row-reverse"}`}
    >
      <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${isAI ? "bg-[#1E3A5F]" : "bg-[#7C5CFC]/20"}`}>
        {isAI ? <Bot size={15} className="text-[#4F9DFF]" /> : <User size={15} className="text-[#7C5CFC]" />}
      </div>
      <div className={`max-w-[80%] ${isAI ? "" : "items-end flex flex-col"}`}>
        <div className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
          isAI ? "bg-[#16263D] border border-[#1E3A5F] text-[#8BA3C7]" : "text-white"
        }`}
          style={!isAI ? { background: "linear-gradient(135deg, #7C5CFC, #4F9DFF)" } : {}}>
          {isAI ? (
            <>
              {msg.text}
              {msg.highlight && <span className="text-[#34D399] font-semibold">{msg.highlight}</span>}
              {msg.text2 && <span className="whitespace-pre-line">{msg.text2}</span>}
              {msg.actions && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {msg.actions.map((a) => (
                    <button key={a} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#4F9DFF] border border-[#4F9DFF]/30 hover:bg-[#4F9DFF]/10 transition-all">
                      {a}
                    </button>
                  ))}
                  {msg.confidence && (
                    <span className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#34D399] border border-[#34D399]/30 bg-[#34D399]/8">
                      {msg.confidence}% confidence
                    </span>
                  )}
                </div>
              )}
            </>
          ) : msg.text}
        </div>
        <p className="text-[10px] text-[#4A6080] mt-1 px-1">{msg.time}</p>
      </div>
    </motion.div>
  );
}

export default function AICopilot() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), role: "user", text: input, time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setMessages((m) => [...m, {
        id: Date.now() + 1, role: "ai",
        text: "Analyzing plant telemetry and cross-referencing knowledge base... Based on current sensor data and historical patterns, ",
        highlight: "immediate attention is recommended",
        text2: ". I've flagged this for the maintenance team.",
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        actions: ["View Details", "Generate Report"],
        confidence: 87,
      }]);
      setLoading(false);
    }, 1800);
  };

  return (
    <PageShell topbarPlaceholder="Search knowledge base...">
      <div className="flex h-full" style={{ background: "#07111F" }}>

        {/* History sidebar */}
        <div className="w-48 shrink-0 border-r border-[#1E3A5F] p-3 space-y-1 hidden lg:block">
          <p className="ib-label mb-3">HISTORY</p>
          {HISTORY.map((h, i) => (
            <button key={i} className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] text-[#4A6080] hover:text-[#8BA3C7] hover:bg-[#1E3A5F]/60 transition-all">
              <Clock size={11} className="shrink-0" />
              <span className="truncate">{h}</span>
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Welcome */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#16263D] border border-[#1E3A5F] flex items-center justify-center">
                  <Bot size={28} className="text-[#4F9DFF]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white font-sora">Precision AI Copilot</p>
                  <p className="text-[13px] text-[#4A6080] mt-1 max-w-xs">Access the collective intelligence of your facility. Query documentation, analyze P&IDs, and predict maintenance cycles.</p>
                </div>
              </div>
            )}
            {messages.map((m) => <Message key={m.id} msg={m} />)}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#1E3A5F] flex items-center justify-center shrink-0">
                  <Bot size={15} className="text-[#4F9DFF]" />
                </div>
                <div className="ib-card px-4 py-3 flex gap-1.5 items-center">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[#4F9DFF]"
                      animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested prompts */}
          <div className="px-5 pb-2 flex gap-2 overflow-x-auto">
            {SUGGESTED.map((s, i) => (
              <button key={i} onClick={() => setInput(s)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[11px] text-[#8BA3C7] border border-[#1E3A5F] hover:border-[#4F9DFF]/40 hover:text-[#4F9DFF] transition-all whitespace-nowrap">
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#1E3A5F]">
            <div className="flex items-center gap-2 ib-card px-3 py-2" style={{ borderRadius: "0.875rem" }}>
              <button className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4A6080] hover:text-[#8BA3C7] hover:bg-[#1E3A5F] transition-all">
                <Mic size={14} />
              </button>
              <input
                className="flex-1 bg-transparent text-[13px] text-[#F0F6FF] placeholder-[#4A6080] outline-none font-jakarta"
                placeholder="Ask IndustrialBrain about your plant..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button
                onClick={send}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{ background: input.trim() ? "linear-gradient(135deg, #4F9DFF, #7C5CFC)" : "#1E3A5F" }}
              >
                <Send size={13} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-64 shrink-0 border-l border-[#1E3A5F] p-4 space-y-4 hidden xl:block overflow-y-auto">
          {/* Active Context */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={13} className="text-[#7C5CFC]" />
                <p className="ib-label">ACTIVE CONTEXT</p>
              </div>
              <span className="ib-badge ib-badge-healthy text-[9px]">LIVE</span>
            </div>
            <div className="ib-card p-0 overflow-hidden">
              <div className="h-24 bg-gradient-to-br from-[#0F1C2E] to-[#16263D] flex items-end p-3"
                style={{ background: "linear-gradient(135deg, #0a1520 0%, #1a2d47 100%)" }}>
                <div>
                  <p className="text-[13px] font-bold text-white font-sora">{CONTEXT.name}</p>
                  <p className="text-[10px] text-[#4A6080]">{CONTEXT.sub}</p>
                </div>
              </div>
              <div className="p-3 space-y-3">
                {CONTEXT.metrics.map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#4A6080]">{m.label}</span>
                      <span className="text-white font-semibold">{m.value}{m.max ? ` / ${m.max}` : ""}</span>
                    </div>
                    <div className="h-1 rounded-full bg-[#1E3A5F] overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: m.color, width: `${m.pct}%` }}
                        initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ duration: 1, delay: 0.3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Entity Relations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Share2 size={13} className="text-[#4F9DFF]" />
                <p className="ib-label">ENTITY RELATIONS</p>
              </div>
              <button className="text-[10px] text-[#4F9DFF] hover:underline">FULL GRAPH</button>
            </div>
            <div className="ib-card p-3 h-36 flex items-center justify-center relative overflow-hidden">
              {/* Mini graph visualization */}
              <svg width="100%" height="100%" viewBox="0 0 200 120">
                <line x1="100" y1="60" x2="50" y2="30" stroke="#4F9DFF" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="100" y1="60" x2="160" y2="40" stroke="#7C5CFC" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="100" y1="60" x2="140" y2="95" stroke="#34D399" strokeWidth="1" strokeOpacity="0.4" />
                <circle cx="100" cy="60" r="14" fill="#1E3A5F" stroke="#4F9DFF" strokeWidth="1.5" />
                <circle cx="50" cy="30" r="9" fill="#1E3A5F" stroke="#7C5CFC" strokeWidth="1" />
                <circle cx="160" cy="40" r="9" fill="#1E3A5F" stroke="#4F9DFF" strokeWidth="1" />
                <circle cx="140" cy="95" r="9" fill="#1E3A5F" stroke="#34D399" strokeWidth="1" />
                <text x="100" y="64" textAnchor="middle" fill="#4F9DFF" fontSize="8">⚙</text>
              </svg>
              <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-[#4A6080]">Click nodes to expand</p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

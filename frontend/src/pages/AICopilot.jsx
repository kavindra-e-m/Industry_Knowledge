import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Bot, User, Zap, Share2, Clock, Sparkles } from "lucide-react";
import PageShell from "../components/shared/PageShell";

const HISTORY = ["Turbine efficiency report...", "P&ID mapping for Sector 7", "Compliance audit log..."];

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
    { label: "Throughput",     value: "9,420 m³/h", pct: 72, color: "#34D399" },
  ],
};

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-xl bg-[#1E3A5F] flex items-center justify-center shrink-0">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Bot size={15} className="text-[#4F9DFF]" />
        </motion.div>
      </div>
      <div className="ib-card px-4 py-3 flex gap-1.5 items-center">
        <span className="text-[11px] text-[#4A6080] mr-1">Analyzing</span>
        {[0, 1, 2].map((i) => (
          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[#4F9DFF]"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18 }} />
        ))}
      </div>
    </div>
  );
}

function Message({ msg, isNew }) {
  const isAI = msg.role === "ai";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      className={`flex gap-3 ${isAI ? "" : "flex-row-reverse"}`}
    >
      <motion.div
        className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${isAI ? "bg-[#1E3A5F]" : "bg-[#7C5CFC]/20"}`}
        whileHover={{ scale: 1.1 }}
      >
        {isAI ? <Bot size={15} className="text-[#4F9DFF]" /> : <User size={15} className="text-[#7C5CFC]" />}
      </motion.div>
      <div className={`max-w-[80%] ${isAI ? "" : "items-end flex flex-col"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
            isAI ? "bg-[#16263D] border border-[#1E3A5F] text-[#8BA3C7]" : "text-white"
          }`}
          style={!isAI ? { background: "linear-gradient(135deg, #7C5CFC, #4F9DFF)" } : {}}
        >
          {isAI ? (
            <>
              {msg.text}
              {msg.highlight && <span className="text-[#34D399] font-semibold">{msg.highlight}</span>}
              {msg.text2 && <span className="whitespace-pre-line">{msg.text2}</span>}
              {msg.confidence && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-[#4A6080]">AI Confidence</span>
                    <span className="text-[#34D399] font-semibold">{msg.confidence}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-[#1E3A5F] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #34D399, #4F9DFF)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${msg.confidence}%` }}
                      transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}
              {msg.actions && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {msg.actions.map((a) => (
                    <motion.button
                      key={a}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#4F9DFF] border border-[#4F9DFF]/30 hover:bg-[#4F9DFF]/10 transition-all"
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    >
                      {a}
                    </motion.button>
                  ))}
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
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (location.state?.initialPrompt) {
      sendQuery(location.state.initialPrompt);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendQuery = (queryText) => {
    if (!queryText.trim()) return;
    const userMsg = { id: Date.now(), role: "user", text: queryText, time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) };
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

  const send = () => {
    sendQuery(input);
  };

  return (
    <PageShell topbarPlaceholder="Search knowledge base...">
      <div className="flex h-full" style={{ background: "transparent" }}>

        {/* History sidebar */}
        <div className="w-48 shrink-0 border-r border-[#1E3A5F] p-3 space-y-1 hidden lg:block">
          <p className="ib-label mb-3">HISTORY</p>
          {HISTORY.map((h, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] text-[#4A6080] hover:text-[#8BA3C7] hover:bg-[#1E3A5F]/60 transition-all"
              whileHover={{ x: 2 }}
            >
              <Clock size={11} className="shrink-0" />
              <span className="truncate">{h}</span>
            </motion.button>
          ))}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-[#16263D] border border-[#1E3A5F] flex items-center justify-center"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Bot size={28} className="text-[#4F9DFF]" />
                </motion.div>
                <div>
                  <p className="text-lg font-bold text-white font-sora">Precision AI Copilot</p>
                  <p className="text-[13px] text-[#4A6080] mt-1 max-w-xs">Access the collective intelligence of your facility.</p>
                </div>
              </div>
            )}
            {messages.map((m) => <Message key={m.id} msg={m} />)}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Suggested prompts */}
          <div className="px-5 pb-2 flex gap-2 overflow-x-auto">
            {SUGGESTED.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => sendQuery(s)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[11px] text-[#8BA3C7] border border-[#1E3A5F] hover:border-[#4F9DFF]/40 hover:text-[#4F9DFF] transition-all whitespace-nowrap"
                whileHover={{ scale: 1.03 }}
              >
                {s}
              </motion.button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#1E3A5F]">
            <div className="flex items-center gap-2 ib-card px-3 py-2" style={{ borderRadius: "0.875rem" }}>
              <motion.button
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4A6080] hover:text-[#8BA3C7] hover:bg-[#1E3A5F] transition-all"
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              >
                <Mic size={14} />
              </motion.button>
              <input
                className="flex-1 bg-transparent text-[13px] text-[#F0F6FF] placeholder-[#4A6080] outline-none font-jakarta"
                placeholder="Ask IndustrialBrain about your plant..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <motion.button
                onClick={send}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{ background: input.trim() ? "linear-gradient(135deg, #4F9DFF, #7C5CFC)" : "#1E3A5F" }}
                whileHover={input.trim() ? { scale: 1.1, boxShadow: "0 0 16px rgba(79,157,255,0.4)" } : {}}
                whileTap={{ scale: 0.9 }}
              >
                <Send size={13} className="text-white" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-64 shrink-0 border-l border-[#E2E8F0] p-4 space-y-4 hidden xl:block overflow-y-auto bg-white">
          {/* Active Context */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={13} className="text-[#2563EB]" />
                <p className="ib-label">ACTIVE CONTEXT</p>
              </div>
              <motion.span
                className="ib-badge ib-badge-healthy text-[9px]"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                LIVE
              </motion.span>
            </div>
            <div className="ib-card p-0 overflow-hidden">
              <div className="h-24 flex items-end p-3" style={{ background: "linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)" }}>
                <div>
                  <p className="text-[13px] font-bold text-[#0F172A] font-sora">{CONTEXT.name}</p>
                  <p className="text-[10px] text-[#475569]">{CONTEXT.sub}</p>
                </div>
              </div>
              <div className="p-3 space-y-3">
                {CONTEXT.metrics.map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#475569]">{m.label}</span>
                      <span className="text-[#0F172A] font-semibold">{m.value}{m.max ? ` / ${m.max}` : ""}</span>
                    </div>
                    <div className="h-1 rounded-full bg-[#E2E8F0] overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: m.color }}
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
                <Share2 size={13} className="text-[#2563EB]" />
                <p className="ib-label">ENTITY RELATIONS</p>
              </div>
              <button onClick={() => navigate("/knowledge-graph")} className="text-[10px] text-[#2563EB] font-bold hover:underline">FULL GRAPH</button>
            </div>
            <div
              onClick={() => navigate("/knowledge-graph")}
              className="ib-card p-3 h-36 flex items-center justify-center relative overflow-hidden cursor-pointer hover:border-[#2563EB]"
            >
              <svg width="100%" height="100%" viewBox="0 0 200 120">
                {[[100,60,50,30,"#2563EB"],[100,60,160,40,"#7C3AED"],[100,60,140,95,"#10B981"]].map(([x1,y1,x2,y2,c],i) => (
                  <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="1"
                    initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.5 }}
                    transition={{ duration: 0.8, delay: i * 0.2 }} />
                ))}
                {[[100,60,14,"#2563EB",true],[50,30,9,"#7C3AED",false],[160,40,9,"#2563EB",false],[140,95,9,"#10B981",false]].map(([cx,cy,r,c,pulse],i) => (
                  <motion.circle key={i} cx={cx} cy={cy} r={r} fill="#F8FAFC" stroke={c} strokeWidth={pulse ? 1.5 : 1}
                    animate={pulse ? { r: [r, r+2, r] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ filter: `drop-shadow(0 0 4px ${c}80)` }}
                  />
                ))}
                <text x="100" y="64" textAnchor="middle" fill="#2563EB" fontSize="8">⚙</text>
              </svg>
              <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-[#64748B]">Click nodes to view full graph</p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

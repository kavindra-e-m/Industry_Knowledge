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
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--surface-secondary)" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Bot size={15} style={{ color: "var(--accent-primary)" }} />
        </motion.div>
      </div>
      <div className="ib-card px-4 py-3 flex gap-1.5 items-center">
        <span className="text-[11px] mr-1" style={{ color: "var(--text-tertiary)" }}>Analyzing</span>
        {[0, 1, 2].map((i) => (
          <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-primary)" }}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18 }} />
        ))}
      </div>
    </div>
  );
}

function Message({ msg, sendQuery }) {
  const isAI = msg.role === "ai";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      className={`flex gap-3 ${isAI ? "" : "flex-row-reverse"}`}
    >
      <motion.div
        className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center"
        style={{ background: isAI ? "var(--surface-secondary)" : "rgba(124, 92, 252, 0.15)" }}
        whileHover={{ scale: 1.1 }}
      >
        {isAI ? <Bot size={15} style={{ color: "var(--accent-primary)" }} /> : <User size={15} style={{ color: "var(--accent-secondary)" }} />}
      </motion.div>
      <div className={`max-w-[80%] ${isAI ? "" : "items-end flex flex-col"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed transition-colors duration-250 ${
            isAI ? "border" : ""
          }`}
          style={!isAI 
            ? { background: "linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))", color: "#FFFFFF" } 
            : { background: "var(--surface-secondary)", borderColor: "var(--border-primary)", color: "var(--text-secondary)" }
          }
        >
          {isAI ? (
            <>
              {msg.text}
              {msg.highlight && <span className="font-semibold" style={{ color: "var(--success)" }}>{msg.highlight}</span>}
              {msg.text2 && <span className="whitespace-pre-line">{msg.text2}</span>}
              {msg.confidence && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span style={{ color: "var(--text-tertiary)" }}>AI Confidence</span>
                    <span className="font-semibold" style={{ color: "var(--success)" }}>{msg.confidence}%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-tertiary)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, var(--success), var(--accent-primary))" }}
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
                      onClick={() => sendQuery(a)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border hover:bg-[var(--surface-tertiary)] transition-all bg-transparent"
                      style={{ color: "var(--accent-primary)", borderColor: "var(--border-primary)" }}
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
        <p className="text-[10px] mt-1 px-1" style={{ color: "var(--text-tertiary)" }}>{msg.time}</p>
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
        <div className="w-48 shrink-0 border-r p-3 space-y-1 hidden lg:block transition-colors duration-250" style={{ borderColor: "var(--border-primary)" }}>
          <p className="ib-label mb-3">HISTORY</p>
          {HISTORY.map((h, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] hover:bg-[var(--surface-tertiary)] transition-all bg-transparent border-0 cursor-pointer"
              style={{ color: "var(--text-tertiary)" }}
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
                  className="w-16 h-16 rounded-2xl flex items-center justify-center border"
                  style={{ background: "var(--surface-secondary)", borderColor: "var(--border-primary)" }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Bot size={28} style={{ color: "var(--accent-primary)" }} />
                </motion.div>
                <div>
                  <p className="text-lg font-bold font-sora" style={{ color: "var(--text-primary)" }}>Precision AI Copilot</p>
                  <p className="text-[13px] mt-1 max-w-xs" style={{ color: "var(--text-tertiary)" }}>Access the collective intelligence of your facility.</p>
                </div>
              </div>
            )}
            {messages.map((m) => <Message key={m.id} msg={m} sendQuery={sendQuery} />)}
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
                className="shrink-0 px-3 py-1.5 rounded-full text-[11px] border hover:opacity-80 transition-all whitespace-nowrap bg-transparent cursor-pointer"
                style={{ color: "var(--text-secondary)", borderColor: "var(--border-primary)" }}
                whileHover={{ scale: 1.03 }}
              >
                {s}
              </motion.button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t transition-colors duration-250" style={{ borderColor: "var(--border-primary)" }}>
            <div className="flex items-center gap-2 ib-card px-3 py-2" style={{ borderRadius: "0.875rem" }}>
              <motion.button
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--surface-tertiary)] transition-all bg-transparent border-0 cursor-pointer"
                style={{ color: "var(--text-tertiary)" }}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              >
                <Mic size={14} />
              </motion.button>
              <input
                className="flex-1 bg-transparent text-[13px] placeholder-[#4A6080] outline-none font-jakarta"
                style={{ color: "var(--text-primary)" }}
                placeholder="Ask IndustrialBrain about your plant..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <motion.button
                onClick={send}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all border-0 cursor-pointer text-white"
                style={{ background: input.trim() ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" : "var(--surface-tertiary)", color: "#FFFFFF !important" }}
                whileHover={input.trim() ? { scale: 1.1, boxShadow: "0 0 16px rgba(79,157,255,0.4)" } : {}}
                whileTap={{ scale: 0.9 }}
              >
                <Send size={13} style={{ color: "#FFFFFF" }} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-64 shrink-0 border-l p-4 space-y-4 hidden xl:block overflow-y-auto transition-colors duration-250" style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}>
          {/* Active Context */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={13} style={{ color: "var(--accent-primary)" }} />
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
              <div className="h-24 flex items-end p-3" style={{ background: "var(--surface-secondary)" }}>
                <div>
                  <p className="text-[13px] font-bold font-sora" style={{ color: "var(--text-primary)" }}>{CONTEXT.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{CONTEXT.sub}</p>
                </div>
              </div>
              <div className="p-3 space-y-3">
                {CONTEXT.metrics.map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span style={{ color: "var(--text-tertiary)" }}>{m.label}</span>
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{m.value}{m.max ? ` / ${m.max}` : ""}</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-secondary)" }}>
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
                <Share2 size={13} style={{ color: "var(--accent-primary)" }} />
                <p className="ib-label">ENTITY RELATIONS</p>
              </div>
              <button onClick={() => navigate("/knowledge-graph")} className="text-[10px] font-bold hover:underline bg-transparent border-0 cursor-pointer" style={{ color: "var(--accent-primary)" }}>FULL GRAPH</button>
            </div>
            <div
              onClick={() => navigate("/knowledge-graph")}
              className="ib-card p-3 h-36 flex items-center justify-center relative overflow-hidden cursor-pointer hover:border-[var(--accent-primary)]"
            >
              <svg width="100%" height="100%" viewBox="0 0 200 120">
                {[[100,60,50,30,"var(--accent-primary)"],[100,60,160,40,"var(--accent-secondary)"],[100,60,140,95,"var(--success)"]].map(([x1,y1,x2,y2,c],i) => (
                  <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth="1"
                    initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.5 }}
                    transition={{ duration: 0.8, delay: i * 0.2 }} />
                ))}
                {[[100,60,14,"var(--accent-primary)",true],[50,30,9,"var(--accent-secondary)",false],[160,40,9,"var(--accent-primary)",false],[140,95,9,"var(--success)",false]].map(([cx,cy,r,c,pulse],i) => (
                  <motion.circle key={i} cx={cx} cy={cy} r={r} fill="var(--surface-primary)" stroke={c} strokeWidth={pulse ? 1.5 : 1}
                    animate={pulse ? { r: [r, r+2, r] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ filter: `drop-shadow(0 0 4px ${c}80)` }}
                  />
                ))}
                <text x="100" y="64" textAnchor="middle" fill="var(--accent-primary)" fontSize="8">⚙</text>
              </svg>
              <p className="absolute bottom-2 left-0 right-0 text-center text-[10px]" style={{ color: "var(--text-tertiary)" }}>Click nodes to view full graph</p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Activity, Bot, Send, Terminal, CheckSquare, Bell, Zap } from "lucide-react";
import { useUiStore } from "../../store/uiStore";
import { useAlertStore } from "../../store/alertStore";
import { useToastStore } from "../../store/toastStore";
import { createWebSocketStream } from "../../services/api";

export default function SlidingDrawer() {
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);
  const { drawerOpen, drawerTab, setDrawerOpen, setDrawerTab } = useUiStore();
  const { alerts, loading, pushAlert } = useAlertStore();

  const [simLogs, setSimLogs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "ai", text: "How can I help you optimize the plant today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const logsEndRef = useRef(null);
  const chatEndRef = useRef(null);

  // Subscribe to WebSocket stream for the Telemetry tab
  useEffect(() => {
    let ws;
    try {
      ws = createWebSocketStream(
        (data) => {
          if (data.type === "stream_event") {
            const newLog = {
              time: new Date().toLocaleTimeString(),
              tag: data.equipment_tag || "SYS-001",
              type: data.event_type || "TELEMETRY",
              anomaly: data.payload?.is_anomaly || false,
              payload: data.payload,
            };
            setSimLogs((prev) => [newLog, ...prev].slice(0, 30));
          }
        },
        () => {
          console.warn("WebSocket disconnected/reconnecting inside sliding drawer.");
        }
      );
    } catch (err) {
      console.error("Error creating WebSocket connection in SlidingDrawer:", err);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Periodic fallback simulation logs when WebSocket is quiet or offline
  useEffect(() => {
    const interval = setInterval(() => {
      if (simLogs.length < 5 || Math.random() > 0.4) {
        const metrics = ["Temp", "Press", "Flow", "Vib", "Volt"];
        const metric = metrics[Math.floor(Math.random() * metrics.length)];
        const tags = ["P-101", "V-104", "E-301", "T-402", "G-7"];
        const tag = tags[Math.floor(Math.random() * tags.length)];
        const isAnomaly = Math.random() > 0.85;

        const newLog = {
          time: new Date().toLocaleTimeString(),
          tag: tag,
          type: `${metric.toUpperCase()}_LOG`,
          anomaly: isAnomaly,
          payload: {
            value: parseFloat((Math.random() * 100).toFixed(2)),
            status: isAnomaly ? "CRITICAL_SPIKE" : "NOMINAL",
          }
        };

        setSimLogs((prev) => [newLog, ...prev].slice(0, 30));

        if (isAnomaly) {
          pushAlert({
            equipment_id: tag.toLowerCase(),
            tag: tag,
            predicted_component: `${metric} Sensor Block`,
            rul_days: Math.floor(Math.random() * 5) + 1,
            failure_probability: Math.round(75 + Math.random() * 20),
            suggested_work_order: `Calibration check required for ${tag} ${metric} sensor. Thermal readings show erratic spikes.`,
            severity: "critical"
          });
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [simLogs, pushAlert]);

  // Scroll logic
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = { id: Date.now(), sender: "user", text: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: `Analyzing system state for your query. The current plant configuration is nominal, but we are tracking ${
            alerts.filter((a) => a.severity === "critical").length
          } critical alerts.`
        }
      ]);
    }, 1500);
  };

  const criticalAlerts = alerts.filter((a) => a.severity === "critical");

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          {/* Backdrop Blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 cursor-pointer pointer-events-auto"
          />

          {/* Drawer container */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed top-0 right-0 h-screen w-96 max-w-full z-50 flex flex-col pointer-events-auto shadow-2xl border-l transition-colors duration-250"
            style={{
              background: "var(--glass-bg)",
              borderColor: "var(--border-primary)",
              backdropFilter: "blur(20px)",
              color: "var(--text-primary)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-4 border-b shrink-0 transition-colors duration-250"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-pulse" />
                <h3 className="text-sm font-bold font-sora tracking-wide" style={{ color: "var(--text-primary)" }}>
                  OPERATIONS CONSOLE
                </h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--surface-tertiary)]"
                style={{ color: "var(--text-tertiary)" }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Tabs */}
            <div
              className="flex p-2 gap-1 border-b shrink-0 transition-colors duration-250"
              style={{
                background: "var(--surface-secondary)",
                borderColor: "var(--border-primary)",
              }}
            >
              {[
                { id: "alerts", label: "Alerts", count: criticalAlerts.length, icon: Bell },
                { id: "telemetry", label: "Telemetry", icon: Terminal },
                { id: "copilot", label: "AI Assist", icon: Bot },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = drawerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDrawerTab(tab.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative"
                    style={{
                      color: isActive ? "var(--accent-primary)" : "var(--text-tertiary)",
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeDrawerTab"
                        className="absolute inset-0 border rounded-lg shadow-sm"
                        style={{
                          background: "var(--surface-primary)",
                          borderColor: "var(--border-primary)",
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon size={12} className="relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="relative z-10 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence mode="wait">
                {drawerTab === "alerts" && (
                  <motion.div
                    key="alerts-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-3"
                  >
                    {criticalAlerts.length === 0 ? (
                      <div className="text-center py-12" style={{ color: "var(--text-tertiary)" }}>
                        <CheckSquare size={36} className="mx-auto text-emerald-500 opacity-60 mb-3" />
                        <p className="text-xs font-semibold">All Systems Normal</p>
                        <p className="text-[10px] opacity-70 mt-1">No active critical anomalies detected.</p>
                      </div>
                    ) : (
                      criticalAlerts.map((a) => (
                        <div
                          key={a.equipment_id}
                          className="p-3.5 rounded-xl border flex flex-col gap-2 relative overflow-hidden transition-all"
                          style={{
                            background: "rgba(239, 68, 68, 0.08)",
                            borderColor: "rgba(239, 68, 68, 0.25)",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="ib-badge ib-badge-critical text-[9px]">
                              {a.tag}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-red-500">
                              RUL: {a.rul_days}d
                            </span>
                          </div>
                          <div>
                            <h4 className="text-[12px] font-bold font-sora" style={{ color: "var(--text-primary)" }}>
                              {a.predicted_component}
                            </h4>
                            <p className="text-[11px] leading-relaxed mt-1" style={{ color: "var(--text-secondary)" }}>
                              {a.suggested_work_order}
                            </p>
                          </div>
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => {
                                push({
                                  type: "success",
                                  title: "Work Order Dispatched",
                                  message: `AI-optimized inspection dispatched to field crew for ${a.tag}.`,
                                  duration: 3000,
                                });
                                setDrawerOpen(false);
                              }}
                              className="ib-btn ib-btn-primary text-[10px] px-3 py-1.5 rounded-lg flex-1 text-center justify-center font-bold"
                            >
                              DISPATCH WORK ORDER
                            </button>
                            <button
                              onClick={() =>
                                push({
                                  type: "info",
                                  title: "Alert Acknowledged",
                                  message: `Critical anomaly ticket for ${a.tag} flagged as acknowledged.`,
                                  duration: 2500,
                                })
                              }
                              className="ib-btn ib-btn-ghost text-[10px] px-3 py-1.5 rounded-lg"
                            >
                              ACK
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}

                {drawerTab === "telemetry" && (
                  <motion.div
                    key="telemetry-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-2 font-mono text-[11px]"
                  >
                    <div
                      className="flex items-center justify-between mb-3 border-b pb-2"
                      style={{ borderColor: "var(--border-primary)", color: "var(--text-tertiary)" }}
                    >
                      <span>LIVE TELEMETRY STREAM</span>
                      <span className="flex items-center gap-1 text-emerald-500 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        listening
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[calc(100vh-170px)] overflow-y-auto pr-1">
                      {simLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg border transition-all"
                          style={{
                            background: log.anomaly ? "rgba(239, 68, 68, 0.08)" : "var(--surface-secondary)",
                            borderColor: log.anomaly ? "rgba(239, 68, 68, 0.3)" : "var(--border-primary)",
                            color: log.anomaly ? "var(--error)" : "var(--text-secondary)",
                          }}
                        >
                          <div className="flex items-center justify-between font-bold text-[9px] mb-1">
                            <span>[{log.time}] {log.tag}</span>
                            <span
                              className="px-1 rounded"
                              style={{
                                background: log.anomaly ? "rgba(239, 68, 68, 0.2)" : "var(--surface-tertiary)",
                                color: log.anomaly ? "var(--error)" : "var(--text-primary)",
                              }}
                            >
                              {log.type}
                            </span>
                          </div>
                          <pre className="text-[10px] whitespace-pre-wrap leading-tight truncate">
                            {JSON.stringify(log.payload)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {drawerTab === "copilot" && (
                  <motion.div
                    key="copilot-tab"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col h-[calc(100vh-150px)]"
                  >
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {chatMessages.map((msg) => {
                        const isAI = msg.sender === "ai";
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-2 ${isAI ? "" : "flex-row-reverse"}`}
                          >
                            <div
                              className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold shadow-sm"
                              style={{
                                background: isAI ? "var(--accent-primary)" : "var(--accent-secondary)",
                                color: "#FFFFFF",
                              }}
                            >
                              {isAI ? <Bot size={11} /> : "U"}
                            </div>
                            <div
                              className="rounded-xl px-3 py-2 text-[11px] leading-relaxed max-w-[80%] border"
                              style={{
                                background: isAI ? "var(--surface-secondary)" : "var(--accent-primary)",
                                borderColor: isAI ? "var(--border-primary)" : "var(--accent-primary)",
                                color: isAI ? "var(--text-primary)" : "#FFFFFF",
                              }}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })}
                      {isTyping && (
                        <div className="flex gap-2">
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] text-white"
                            style={{ background: "var(--accent-primary)" }}
                          >
                            <Bot size={11} />
                          </div>
                          <div
                            className="px-3 py-2 rounded-xl flex gap-1 items-center border"
                            style={{
                              background: "var(--surface-secondary)",
                              borderColor: "var(--border-primary)",
                            }}
                          >
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: "var(--accent-primary)" }}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div
                      className="border-t pt-3 mt-auto flex gap-1.5 font-jakarta"
                      style={{ borderColor: "var(--border-primary)" }}
                    >
                      <input
                        type="text"
                        className="flex-1 ib-input py-2 text-xs"
                        placeholder="Type message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                      />
                      <button
                        onClick={handleSendChat}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 hover:opacity-90 active:scale-95 transition-all shadow-sm"
                        style={{ background: "var(--accent-primary)" }}
                      >
                        <Send size={12} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

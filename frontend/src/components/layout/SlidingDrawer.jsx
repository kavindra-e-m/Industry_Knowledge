import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Activity, Bot, Send, Terminal, CheckSquare, Bell, Zap } from "lucide-react";
import { useUiStore } from "../../store/uiStore";
import { useAlertStore } from "../../store/alertStore";
import { createWebSocketStream } from "../../services/api";

export default function SlidingDrawer() {
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

        // Proactively insert random alerts into global alert store if anomaly is simulated
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
            className="fixed inset-0 bg-[#060B14]/60 backdrop-blur-sm z-40 cursor-pointer pointer-events-auto"
          />

          {/* Drawer container */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed top-0 right-0 h-screen w-96 max-w-full z-50 flex flex-col pointer-events-auto shadow-2xl border-l border-[#1E3A5F]"
            style={{
              background: "linear-gradient(180deg, rgba(15, 28, 46, 0.95) 0%, rgba(7, 17, 31, 0.98) 100%)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1E3A5F] shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7C5CFC] animate-pulse" />
                <h3 className="text-sm font-bold text-white font-sora tracking-wide">
                  OPERATIONS CONSOLE
                </h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4A6080] hover:text-[#8BA3C7] hover:bg-[#1E3A5F] transition-all"
              >
                <X size={15} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex p-2 gap-1 bg-[#0F1C2E]/60 border-b border-[#1E3A5F] shrink-0">
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
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                      isActive ? "text-white" : "text-[#4A6080] hover:text-[#8BA3C7]"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeDrawerTab"
                        className="absolute inset-0 bg-[#1E3A5F]/60 border border-[#4F9DFF]/30 rounded-lg"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon size={12} className="relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="relative z-10 px-1.5 py-0.5 rounded-full bg-[#FF5C5C] text-white text-[9px] font-bold">
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
                      <div className="text-center py-12 text-[#4A6080]">
                        <CheckSquare size={36} className="mx-auto text-[#34D399] opacity-40 mb-3" />
                        <p className="text-xs font-semibold">All Systems Normal</p>
                        <p className="text-[10px] opacity-70 mt-1">No active critical anomalies detected.</p>
                      </div>
                    ) : (
                      criticalAlerts.map((a) => (
                        <div
                          key={a.equipment_id}
                          className="p-3.5 rounded-xl border border-[#FF5C5C]/30 bg-[#FF5C5C]/5 hover:border-[#FF5C5C]/50 hover:bg-[#FF5C5C]/10 transition-all flex flex-col gap-2 relative overflow-hidden"
                          style={{
                            boxShadow: "0 4px 12px rgba(255, 92, 92, 0.05)"
                          }}
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#FF5C5C]/10 to-transparent pointer-events-none rounded-bl-full" />
                          <div className="flex items-center justify-between">
                            <span className="ib-badge ib-badge-critical text-[9px]">
                              {a.tag}
                            </span>
                            <span className="text-[10px] text-[#FF5C5C] font-mono font-bold">
                              RUL: {a.rul_days}d
                            </span>
                          </div>
                          <div>
                            <h4 className="text-[12px] font-bold text-white font-sora">
                              {a.predicted_component}
                            </h4>
                            <p className="text-[11px] text-[#8BA3C7] leading-relaxed mt-1">
                              {a.suggested_work_order}
                            </p>
                          </div>
                          <div className="flex gap-2 mt-1">
                            <button className="ib-btn ib-btn-critical text-[10px] px-3 py-1.5 rounded-lg flex-1 text-center justify-center font-bold">
                              DISPATCH WORK ORDER
                            </button>
                            <button className="ib-btn ib-btn-ghost text-[10px] px-3 py-1.5 rounded-lg border-[#1E3A5F] hover:border-[#2a4a6b]">
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
                    <div className="flex items-center justify-between mb-3 border-b border-[#1E3A5F] pb-2 text-[#4A6080]">
                      <span>LIVE TELEMETRY STREAM</span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                        listening
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[calc(100vh-170px)] overflow-y-auto pr-1">
                      {simLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border transition-all ${
                            log.anomaly
                              ? "bg-[#FF5C5C]/8 border-[#FF5C5C]/30 text-[#FF5C5C]"
                              : "bg-[#0F1C2E]/40 border-[#1E3A5F]/40 text-[#8BA3C7]"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-[9px] mb-1">
                            <span>[{log.time}] {log.tag}</span>
                            <span
                              className={`px-1 rounded ${
                                log.anomaly ? "bg-[#FF5C5C]/20 text-[#FF5C5C]" : "bg-[#4A6080]/20 text-[#8BA3C7]"
                              }`}
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
                              className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold ${
                                isAI ? "bg-[#1E3A5F] text-[#4F9DFF]" : "bg-[#7C5CFC]/20 text-[#7C5CFC]"
                              }`}
                            >
                              {isAI ? <Bot size={11} /> : "U"}
                            </div>
                            <div
                              className={`rounded-xl px-3 py-2 text-[11px] leading-relaxed max-w-[80%] ${
                                isAI ? "bg-[#16263D] border border-[#1E3A5F] text-[#8BA3C7]" : "text-white bg-gradient-to-r from-[#7C5CFC] to-[#4F9DFF]"
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })}
                      {isTyping && (
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#1E3A5F] text-[#4F9DFF] flex items-center justify-center text-[10px]">
                            <Bot size={11} />
                          </div>
                          <div className="bg-[#16263D] border border-[#1E3A5F] px-3 py-2 rounded-xl flex gap-1 items-center">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-[#4F9DFF]"
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
                    <div className="border-t border-[#1E3A5F] pt-3 mt-auto flex gap-1.5">
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
                        className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#4F9DFF] to-[#7C5CFC] flex items-center justify-center text-white shrink-0 hover:opacity-90 active:scale-95 transition-all"
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

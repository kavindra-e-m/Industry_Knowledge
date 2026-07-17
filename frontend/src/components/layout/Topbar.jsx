import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Radio, BarChart2, X } from "lucide-react";
import { useAlertStore } from "../../store/alertStore";

const SUGGESTIONS = [
  "Turbine-04 thermal deviation",
  "PUMP-A1 mechanical seal status",
  "Compliance gap ISO 13849",
  "Failure prediction MOTOR-E1",
];

export default function Topbar({ placeholder = "Query plant data..." }) {
  const [time, setTime] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [heartbeat, setHeartbeat] = useState(false);
  const inputRef = useRef(null);
  const alerts = useAlertStore((s) => s.alerts);
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Heartbeat pulse every 5s
  useEffect(() => {
    const t = setInterval(() => {
      setHeartbeat(true);
      setTimeout(() => setHeartbeat(false), 600);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const fmt = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const filtered = query ? SUGGESTIONS.filter((s) => s.toLowerCase().includes(query.toLowerCase())) : SUGGESTIONS;

  return (
    <header
      className="h-12 shrink-0 flex items-center gap-3 px-4 border-b border-[#1E3A5F] relative z-20"
      style={{ background: "rgba(10,20,34,0.96)", backdropFilter: "blur(16px)" }}
    >
      {/* Search */}
      <div className="relative">
        <motion.div
          animate={{ width: searchOpen ? 280 : 180 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="relative"
        >
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6080] z-10" />
          <input
            ref={inputRef}
            className="ib-input w-full pl-8 pr-8 py-1.5 text-xs"
            placeholder={placeholder}
            value={query}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4A6080] hover:text-[#8BA3C7]">
              <X size={11} />
            </button>
          )}
        </motion.div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-1.5 left-0 w-72 ib-glass rounded-xl overflow-hidden z-50"
              style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}
            >
              <p className="ib-label px-3 pt-2.5 pb-1">RECENT SEARCHES</p>
              {filtered.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onMouseDown={() => setQuery(s)}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-[12px] text-[#8BA3C7] hover:text-white hover:bg-[#1E3A5F]/60 transition-colors"
                >
                  <Search size={10} className="text-[#4A6080] shrink-0" />
                  {s}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* AI Active badge */}
        <motion.div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border cursor-default ai-active-badge"
          style={{ borderColor: "rgba(52,211,153,0.4)", background: "rgba(52,211,153,0.07)" }}
          animate={heartbeat ? { scale: [1, 1.06, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-[#34D399]"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-[11px] font-semibold text-[#34D399] font-jakarta">AI ACTIVE</span>
        </motion.div>

        {/* Icons */}
        {[BarChart2, Radio].map((Icon, i) => (
          <motion.button
            key={i}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4A6080] hover:text-[#8BA3C7] hover:bg-[#1E3A5F] transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Icon size={14} />
          </motion.button>
        ))}

        {/* Notifications */}
        <div className="relative">
          <motion.button
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4A6080] hover:text-[#8BA3C7] hover:bg-[#1E3A5F] transition-all relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setNotifOpen((o) => !o)}
          >
            <Bell size={14} />
            <AnimatePresence>
              {criticalCount > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#FF5C5C] text-white text-[8px] font-bold flex items-center justify-center"
                >
                  {criticalCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="absolute right-0 top-full mt-2 w-72 ib-glass rounded-xl overflow-hidden z-50"
                style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}
              >
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1E3A5F]">
                  <p className="text-[12px] font-semibold text-white font-sora">Notifications</p>
                  {criticalCount > 0 && <span className="ib-badge ib-badge-critical">{criticalCount} critical</span>}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {alerts.slice(0, 5).map((a, i) => (
                    <motion.div
                      key={a.equipment_id + i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2.5 px-3 py-2.5 border-b border-[#1E3A5F]/50 hover:bg-[#1E3A5F]/40 transition-colors cursor-pointer"
                    >
                      <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${a.severity === "critical" ? "bg-[#FF5C5C]" : "bg-[#FBBF24]"}`} />
                      <div>
                        <p className="text-[11px] font-semibold text-white">{a.tag}</p>
                        <p className="text-[10px] text-[#4A6080] mt-0.5">{a.predicted_component} · {a.rul_days}d RUL</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Time */}
        <span className="text-[11px] font-mono text-[#4A6080] tabular-nums">{fmt}</span>

        {/* Avatar */}
        <motion.div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white cursor-pointer"
          style={{ background: "linear-gradient(135deg, #4F9DFF, #7C5CFC)" }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          A
        </motion.div>
      </div>
    </header>
  );
}

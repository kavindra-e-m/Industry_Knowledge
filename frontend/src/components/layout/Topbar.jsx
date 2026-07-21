import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Radio, Calendar, Settings, X, Moon, Sun } from "lucide-react";
import { useAlertStore } from "../../store/alertStore";
import { useUiStore } from "../../store/uiStore";
import { useThemeStore } from "../../store/themeStore";

const SUGGESTIONS = [
  "Turbine-04 thermal deviation",
  "PUMP-A1 mechanical seal status",
  "Compliance gap ISO 13849",
  "Failure prediction MOTOR-E1",
];

export default function Topbar({ placeholder = "Query plant data..." }) {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [heartbeat, setHeartbeat] = useState(false);
  const inputRef = useRef(null);

  const alerts = useAlertStore((s) => s.alerts);
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const openTab = useUiStore((s) => s.openTab);

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

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
      className="h-16 shrink-0 flex items-center justify-between px-6 gap-4 border-b relative z-20 transition-colors duration-300"
      style={{
        background: "var(--glass-bg)",
        borderColor: "var(--border-primary)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <motion.div
          animate={{ width: searchOpen ? "100%" : "auto" }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="relative"
        >
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" style={{ color: "var(--text-tertiary)" }} />
          <input
            ref={inputRef}
            className="ib-input w-full pl-9 pr-8 py-2 text-xs font-jakarta rounded-xl"
            placeholder={placeholder}
            value={query}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity" style={{ color: "var(--text-tertiary)" }}>
              <X size={13} />
            </button>
          ) : (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono pointer-events-none" style={{ color: "var(--text-tertiary)" }}>
              ⌘K
            </span>
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
              className="absolute top-full mt-2 left-0 w-72 ib-glass rounded-xl overflow-hidden z-50 shadow-xl border"
              style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}
            >
              <p className="ib-label px-3 pt-2.5 pb-1">RECENT SEARCHES</p>
              {filtered.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onMouseDown={() => setQuery(s)}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[var(--surface-tertiary)] transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Search size={11} className="shrink-0" style={{ color: "var(--accent-primary)" }} />
                  {s}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Header Actions Order:
          [ AI ACTIVE ] [ Calendar ] [ Signal ] [ Theme Toggle ] [ Notification ] [ Settings ] [ Profile ]
      */}
      <div className="flex items-center gap-3">
        {/* 1. AI ACTIVE badge */}
        <motion.div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-default ai-active-badge"
          style={{ borderColor: "rgba(37, 99, 235, 0.25)", background: "rgba(37, 99, 235, 0.08)" }}
          animate={heartbeat ? { scale: [1, 1.06, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--accent-primary)" }}
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-[10px] font-bold font-mono" style={{ color: "var(--accent-primary)" }}>AI ACTIVE</span>
        </motion.div>

        {/* 2. Calendar */}
        <motion.button
          onClick={() => navigate("/maintenance")}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--surface-tertiary)]"
          style={{ color: "var(--text-secondary)" }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          title="Maintenance Calendar"
          aria-label="Maintenance Calendar"
        >
          <Calendar size={16} />
        </motion.button>

        {/* 3. Signal */}
        <motion.button
          onClick={() => openTab("telemetry")}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--surface-tertiary)]"
          style={{ color: "var(--text-secondary)" }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          title="Telemetry Signal"
          aria-label="Telemetry Signal"
        >
          <Radio size={16} />
        </motion.button>

        {/* 4. Theme Toggle (Immediately BEFORE Notification Icon) */}
        <motion.button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Toggle Light Mode" : "Toggle Dark Mode"}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className={`w-10 h-10 p-2.5 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 ${
            theme === "dark"
              ? "bg-[var(--surface-primary)] border border-[var(--border-primary)] hover:shadow-[0_0_12px_rgba(37,99,235,0.35)] hover:border-[#2563EB]/50"
              : "bg-white shadow-md border border-slate-200 hover:bg-blue-50 hover:border-blue-300"
          }`}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === "dark" ? (
              <motion.div
                key="sun"
                initial={{ rotate: -180, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 180, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex items-center justify-center"
              >
                <Sun size={18} className="text-[#F8FAFC]" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 180, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: -180, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex items-center justify-center"
              >
                <Moon size={18} className="text-[#334155]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* 5. Notification Icon */}
        <motion.button
          onClick={() => openTab("alerts")}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all relative hover:bg-[var(--surface-tertiary)]"
          style={{ color: "var(--text-secondary)" }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          title="Active Alerts & Notifications"
          aria-label="Active Alerts & Notifications"
        >
          <Bell size={16} />
          <AnimatePresence>
            {criticalCount > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[8px] font-bold flex items-center justify-center shadow-sm"
              >
                {criticalCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* 6. Settings Icon */}
        <motion.button
          onClick={() => navigate("/settings")}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--surface-tertiary)]"
          style={{ color: "var(--text-secondary)" }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={16} />
        </motion.button>

        {/* 7. Profile Avatar */}
        <motion.button
          onClick={() => navigate("/settings")}
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm font-sora cursor-pointer"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          title="User Profile"
          aria-label="User Profile"
        >
          A
        </motion.button>
      </div>
    </header>
  );
}

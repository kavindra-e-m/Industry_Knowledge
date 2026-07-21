import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, GitBranch, Package, FileSearch, Activity, Bot, AlertTriangle, X } from "lucide-react";

const COMMANDS = [
  { id: "ask-ai", label: "Ask AI Copilot", icon: Bot, category: "AI", shortcut: "⌘A" },
  { id: "generate-rca", label: "Generate RCA Report", icon: GitBranch, category: "Analysis", shortcut: "⌘R" },
  { id: "generate-audit", label: "Generate Audit Package", icon: Package, category: "Compliance", shortcut: "⌘U" },
  { id: "search-docs", label: "Search Documents", icon: FileSearch, category: "Documents", shortcut: "⌘D" },
  { id: "predict-failure", label: "Predict Equipment Failure", icon: Activity, category: "Maintenance", shortcut: "⌘P" },
  { id: "critical-alerts", label: "View Critical Alerts", icon: AlertTriangle, category: "Alerts", shortcut: "⌘!" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setSearch("");
        setSelected(0);
      }
      if (open) {
        if (e.key === "Escape") setOpen(false);
        if (e.key === "ArrowDown") setSelected((s) => (s + 1) % filtered.length);
        if (e.key === "ArrowUp") setSelected((s) => (s - 1 + filtered.length) % filtered.length);
        if (e.key === "Enter") handleSelect(filtered[selected]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, search, selected]);

  const filtered = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (cmd) => {
    console.log("Command selected:", cmd.id);
    setOpen(false);
  };

  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-[10000]"
          >
            <div
              className="rounded-2xl overflow-hidden shadow-2xl border transition-colors duration-250"
              style={{
                background: "var(--glass-bg)",
                borderColor: "var(--border-primary)",
                backdropFilter: "blur(20px)",
                color: "var(--text-primary)",
              }}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-primary-app">
                <Search size={18} style={{ color: "var(--accent-primary)" }} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search commands, equipment, documents..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelected(0);
                  }}
                  className="flex-1 bg-transparent placeholder-[#4A6080] outline-none text-base font-jakarta"
                  style={{ color: "var(--text-primary)" }}
                />
                <button
                  onClick={() => setOpen(false)}
                  style={{ color: "var(--text-tertiary)" }}
                  className="hover:opacity-80 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <p style={{ color: "var(--text-tertiary)" }} className="text-sm">No commands found</p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([category, commands]) => (
                    <div key={category}>
                      <div className="px-5 py-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                        {category}
                      </div>
                      {commands.map((cmd, idx) => {
                        const isSelected = filtered.indexOf(cmd) === selected;
                        return (
                          <motion.button
                            key={cmd.id}
                            onClick={() => handleSelect(cmd)}
                            className="w-full flex items-center gap-3 px-5 py-3 transition-colors"
                            style={{
                              background: isSelected ? "var(--surface-tertiary)" : "transparent",
                            }}
                            whileHover={{ x: 4 }}
                          >
                            <cmd.icon size={16} style={{ color: "var(--accent-primary)" }} />
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{cmd.label}</p>
                            </div>
                            <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>{cmd.shortcut}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-primary-app flex items-center justify-between text-xs" style={{ color: "var(--text-tertiary)" }}>
                <div className="flex gap-3">
                  <span>↑↓ Navigate</span>
                  <span>↵ Select</span>
                  <span>Esc Close</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

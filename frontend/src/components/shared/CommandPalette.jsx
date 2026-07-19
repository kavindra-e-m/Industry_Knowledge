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
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(15, 28, 46, 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(79, 157, 255, 0.2)",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(79, 157, 255, 0.1)",
              }}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1E3A5F]">
                <Search size={18} className="text-[#4F9DFF]" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search commands, equipment, documents..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelected(0);
                  }}
                  className="flex-1 bg-transparent text-white placeholder-[#4A6080] outline-none text-base font-jakarta"
                />
                <button
                  onClick={() => setOpen(false)}
                  className="text-[#4A6080] hover:text-[#8BA3C7] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <p className="text-[#4A6080] text-sm">No commands found</p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([category, commands]) => (
                    <div key={category}>
                      <div className="px-5 py-2 text-xs font-bold text-[#4A6080] uppercase tracking-wider">
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
                              background: isSelected ? "rgba(79, 157, 255, 0.15)" : "transparent",
                            }}
                            whileHover={{ x: 4 }}
                          >
                            <cmd.icon size={16} className="text-[#4F9DFF]" />
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-white">{cmd.label}</p>
                            </div>
                            <span className="text-xs text-[#4A6080] font-mono">{cmd.shortcut}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-[#1E3A5F] flex items-center justify-between text-xs text-[#4A6080]">
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

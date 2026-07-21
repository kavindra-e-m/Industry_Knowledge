import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Zap, GitBranch, Package, FileSearch, Activity } from "lucide-react";
import { useToastStore } from "../../store/toastStore";

const ACTIONS = [
  { label: "Ask AI", icon: Bot, color: "#7C3AED" },
  { label: "Generate RCA", icon: GitBranch, color: "#DC2626" },
  { label: "Generate Audit", icon: Package, color: "#2563EB" },
  { label: "Search Documents", icon: FileSearch, color: "#059669" },
  { label: "Predict Failure", icon: Activity, color: "#D97706" },
];

export default function FloatingAIAssistant() {
  const [open, setOpen] = useState(false);
  const push = useToastStore((s) => s.push);

  const handleAction = (label) => {
    push({ type: "ai", title: "AI Assistant", message: `${label} initiated...`, duration: 3000 });
    setOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9990] flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="flex flex-col gap-1.5 mb-1"
          >
            {ACTIONS.map(({ label, icon: Icon, color }, i) => (
              <motion.button
                key={label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleAction(label)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold whitespace-nowrap border ib-glass shadow-md"
                style={{
                  color: "var(--text-primary)",
                  borderColor: `${color}40`,
                }}
                whileHover={{ x: -3 }}
              >
                <Icon size={13} style={{ color }} />
                <span>{label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="w-12 h-12 rounded-2xl flex items-center justify-center relative border border-transparent shadow-lg"
        style={{
          background: open
            ? "var(--surface-tertiary)"
            : "linear-gradient(135deg, #2563EB, #7C3AED)",
        }}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}><X size={18} style={{ color: "var(--text-primary)" }} /></motion.div>
            : <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}><Bot size={18} className="text-white" /></motion.div>
          }
        </AnimatePresence>
        {/* Pulse ring */}
        {!open && (
          <motion.span
            className="absolute inset-0 rounded-2xl"
            style={{ border: "2px solid rgba(37, 99, 235, 0.4)" }}
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </motion.button>
    </div>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Zap, GitBranch, Package, FileSearch, Activity } from "lucide-react";
import { useToastStore } from "../../store/toastStore";

const ACTIONS = [
  { label: "Ask AI", icon: Bot, color: "#7C5CFC" },
  { label: "Generate RCA", icon: GitBranch, color: "#FF5C5C" },
  { label: "Generate Audit", icon: Package, color: "#4F9DFF" },
  { label: "Search Documents", icon: FileSearch, color: "#34D399" },
  { label: "Predict Failure", icon: Activity, color: "#FBBF24" },
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
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold text-white whitespace-nowrap"
                style={{
                  background: "rgba(15,28,46,0.95)",
                  backdropFilter: "blur(16px)",
                  border: `1px solid ${color}35`,
                  boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${color}20`,
                }}
                whileHover={{ x: -3, boxShadow: `0 6px 24px rgba(0,0,0,0.5), 0 0 12px ${color}30` }}
              >
                <Icon size={13} style={{ color }} />
                {label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
        style={{
          background: open
            ? "linear-gradient(135deg, #1E3A5F, #16263D)"
            : "linear-gradient(135deg, #7C5CFC, #4F9DFF)",
          boxShadow: open
            ? "0 4px 20px rgba(0,0,0,0.4)"
            : "0 4px 24px rgba(124,92,252,0.45), 0 0 0 1px rgba(124,92,252,0.3)",
        }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.93 }}
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}><X size={18} className="text-white" /></motion.div>
            : <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}><Bot size={18} className="text-white" /></motion.div>
          }
        </AnimatePresence>
        {/* Pulse ring */}
        {!open && (
          <motion.span
            className="absolute inset-0 rounded-2xl"
            style={{ border: "2px solid rgba(124,92,252,0.5)" }}
            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </motion.button>
    </div>
  );
}

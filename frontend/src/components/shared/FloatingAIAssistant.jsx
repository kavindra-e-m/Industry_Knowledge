import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Zap, GitBranch, Package, FileSearch, Activity, Sparkles } from "lucide-react";
import { useToastStore } from "../../store/toastStore";

const ACTIONS = [
  { label: "Ask AI", icon: Bot, color: "#7C5CFC", desc: "Chat with AI Copilot" },
  { label: "Generate RCA", icon: GitBranch, color: "#FF5C5C", desc: "Root cause analysis" },
  { label: "Generate Audit", icon: Package, color: "#4F9DFF", desc: "Compliance audit" },
  { label: "Search Documents", icon: FileSearch, color: "#34D399", desc: "Find documents" },
  { label: "Predict Failure", icon: Activity, color: "#FBBF24", desc: "Equipment forecast" },
];

export default function FloatingAIAssistant() {
  const [open, setOpen] = useState(false);
  const push = useToastStore((s) => s.push);

  const handleAction = (label) => {
    push({ type: "ai", title: "AI Assistant", message: `${label} initiated...`, duration: 3000 });
    setOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9990] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="flex flex-col gap-2 mb-2"
          >
            {ACTIONS.map(({ label, icon: Icon, color, desc }, i) => (
              <motion.button
                key={label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleAction(label)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-semibold text-white whitespace-nowrap group"
                style={{
                  background: "rgba(15, 28, 46, 0.9)",
                  backdropFilter: "blur(16px)",
                  border: `1px solid ${color}35`,
                  boxShadow: `0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px ${color}20`,
                }}
                whileHover={{
                  x: -4,
                  boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 16px ${color}40`,
                }}
              >
                <Icon size={14} style={{ color }} className="group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="font-semibold">{label}</p>
                  <p className="text-[10px] text-[#4A6080]">{desc}</p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 rounded-2xl flex items-center justify-center relative group"
        style={{
          background: open
            ? "linear-gradient(135deg, #1E3A5F, #16263D)"
            : "linear-gradient(135deg, #7C5CFC, #4F9DFF)",
          boxShadow: open
            ? "0 4px 20px rgba(0, 0, 0, 0.4)"
            : "0 8px 32px rgba(124, 92, 252, 0.5), 0 0 0 1px rgba(124, 92, 252, 0.3)",
        }}
        animate={{
          scale: open ? 1 : [1, 1.05, 1],
          boxShadow: open
            ? "0 4px 20px rgba(0, 0, 0, 0.4)"
            : [
                "0 8px 32px rgba(124, 92, 252, 0.5), 0 0 0 1px rgba(124, 92, 252, 0.3)",
                "0 12px 40px rgba(124, 92, 252, 0.6), 0 0 0 1px rgba(124, 92, 252, 0.4)",
                "0 8px 32px rgba(124, 92, 252, 0.5), 0 0 0 1px rgba(124, 92, 252, 0.3)",
              ],
        }}
        transition={{
          duration: open ? 0.2 : 3,
          repeat: open ? 0 : Infinity,
          ease: "easeInOut",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.93 }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <X size={20} className="text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="relative"
            >
              <Bot size={20} className="text-white" />
              <motion.div
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#34D399]"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring */}
        {!open && (
          <motion.span
            className="absolute inset-0 rounded-2xl"
            style={{ border: "2px solid rgba(124, 92, 252, 0.5)" }}
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
          />
        )}

        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: "radial-gradient(circle, rgba(124, 92, 252, 0.2) 0%, transparent 70%)",
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.button>

      {/* Status indicator */}
      <motion.div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold"
        style={{
          background: "rgba(52, 211, 153, 0.1)",
          border: "1px solid rgba(52, 211, 153, 0.3)",
          backdropFilter: "blur(8px)",
        }}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-[#34D399]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-[#34D399]">AI ACTIVE</span>
      </motion.div>
    </div>
  );
}

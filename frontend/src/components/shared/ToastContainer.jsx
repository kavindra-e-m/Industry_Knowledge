import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Info, X, Zap } from "lucide-react";
import { useToastStore } from "../../store/toastStore";

const ICONS = {
  success: <CheckCircle size={14} className="text-[#34D399]" />,
  error: <AlertTriangle size={14} className="text-[#FF5C5C]" />,
  warning: <AlertTriangle size={14} className="text-[#FBBF24]" />,
  info: <Info size={14} className="text-[#4F9DFF]" />,
  ai: <Zap size={14} className="text-[#7C5CFC]" />,
};

const COLORS = {
  success: { border: "rgba(52,211,153,0.3)", bg: "rgba(52,211,153,0.06)" },
  error:   { border: "rgba(255,92,92,0.3)",  bg: "rgba(255,92,92,0.06)" },
  warning: { border: "rgba(251,191,36,0.3)", bg: "rgba(251,191,36,0.06)" },
  info:    { border: "rgba(79,157,255,0.3)", bg: "rgba(79,157,255,0.06)" },
  ai:      { border: "rgba(124,92,252,0.3)", bg: "rgba(124,92,252,0.06)" },
};

export default function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const c = COLORS[t.type] ?? COLORS.info;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl min-w-[260px] max-w-[340px]"
              style={{
                background: `rgba(15,28,46,0.92)`,
                backdropFilter: "blur(16px)",
                border: `1px solid ${c.border}`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${c.border}`,
              }}
            >
              <div className="mt-0.5 shrink-0">{ICONS[t.type] ?? ICONS.info}</div>
              <div className="flex-1 min-w-0">
                {t.title && <p className="text-[12px] font-semibold text-white font-sora">{t.title}</p>}
                {t.message && <p className="text-[11px] text-[#8BA3C7] mt-0.5 leading-relaxed">{t.message}</p>}
              </div>
              <button onClick={() => remove(t.id)} className="text-[#4A6080] hover:text-[#8BA3C7] transition-colors shrink-0 mt-0.5">
                <X size={12} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

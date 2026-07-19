import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Info, X, Zap } from "lucide-react";
import { useToastStore } from "../../store/toastStore";

const ICONS = {
  success: <CheckCircle size={14} className="text-[#059669]" />,
  error: <AlertTriangle size={14} className="text-[#DC2626]" />,
  warning: <AlertTriangle size={14} className="text-[#D97706]" />,
  info: <Info size={14} className="text-[#2563EB]" />,
  ai: <Zap size={14} className="text-[#7C3AED]" />,
};

const COLORS = {
  success: { border: "rgba(5,150,105,0.2)", bg: "rgba(5,150,105,0.04)" },
  error:   { border: "rgba(220,38,38,0.2)",  bg: "rgba(220,38,38,0.04)" },
  warning: { border: "rgba(217,119,6,0.2)",  bg: "rgba(217,119,6,0.04)" },
  info:    { border: "rgba(37,99,235,0.2)",  bg: "rgba(37,99,235,0.04)" },
  ai:      { border: "rgba(124,58,237,0.2)", bg: "rgba(124,58,237,0.04)" },
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
              className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl min-w-[260px] max-w-[340px] border shadow-lg"
              style={{
                background: `rgba(255, 255, 255, 0.95)`,
                backdropFilter: "blur(16px)",
                borderColor: c.border,
              }}
            >
              <div className="mt-0.5 shrink-0">{ICONS[t.type] ?? ICONS.info}</div>
              <div className="flex-1 min-w-0">
                {t.title && <p className="text-[12px] font-bold text-[#0F172A] font-sora">{t.title}</p>}
                {t.message && <p className="text-[11px] text-[#475569] mt-0.5 leading-relaxed">{t.message}</p>}
              </div>
              <button onClick={() => remove(t.id)} className="text-[#64748B] hover:text-[#0F172A] transition-colors shrink-0 mt-0.5">
                <X size={12} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

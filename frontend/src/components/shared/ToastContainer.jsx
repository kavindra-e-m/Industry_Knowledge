import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToastStore } from "../../store/toastStore";

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  ai: Info,
};

const COLORS = {
  success: { bg: "rgba(52, 211, 153, 0.1)", border: "rgba(52, 211, 153, 0.3)", icon: "#34D399" },
  error: { bg: "rgba(255, 92, 92, 0.1)", border: "rgba(255, 92, 92, 0.3)", icon: "#FF5C5C" },
  warning: { bg: "rgba(251, 191, 36, 0.1)", border: "rgba(251, 191, 36, 0.3)", icon: "#FBBF24" },
  info: { bg: "rgba(79, 157, 255, 0.1)", border: "rgba(79, 157, 255, 0.3)", icon: "#4F9DFF" },
  ai: { bg: "rgba(124, 92, 252, 0.1)", border: "rgba(124, 92, 252, 0.3)", icon: "#7C5CFC" },
};

function Toast({ toast, onRemove }) {
  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => onRemove(toast.id), toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);

  const Icon = ICONS[toast.type] || Info;
  const color = COLORS[toast.type] || COLORS.info;

  return (
    <motion.div
      initial={{ opacity: 0, x: 400, y: 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 400, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex items-start gap-3 p-4 rounded-xl"
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
      }}
    >
      <Icon size={18} style={{ color: color.icon, flexShrink: 0, marginTop: 2 }} />
      <div className="flex-1 min-w-0">
        {toast.title && <p className="text-sm font-semibold text-white">{toast.title}</p>}
        {toast.message && <p className="text-xs text-[#8BA3C7] mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-[#4A6080] hover:text-[#8BA3C7] transition-colors flex-shrink-0"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  return (
    <div className="fixed bottom-6 right-6 z-[9980] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onRemove={remove} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

import { useState } from "react";

export default function AlertBanner({ message, severity = "critical", onDismiss }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const colors = {
    critical: "bg-critical/10 border-critical/40 text-critical",
    warning: "bg-warning/10 border-warning/40 text-warning",
    info: "bg-info/10 border-info/40 text-info",
  };

  return (
    <div className={`flex items-center justify-between px-4 py-2.5 border-b text-sm font-medium animate-fade-in ${colors[severity]}`}>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {message}
      </div>
      <button
        onClick={() => { setVisible(false); onDismiss?.(); }}
        className="text-current opacity-60 hover:opacity-100 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}

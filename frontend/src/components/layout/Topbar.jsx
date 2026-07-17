import { useState, useEffect } from "react";
import { Search, Bell, Radio, BarChart2, Wifi } from "lucide-react";
import { useAlertStore } from "../../store/alertStore";
import { useUiStore } from "../../store/uiStore";

export default function Topbar({ placeholder = "Query plant data..." }) {
  const [time, setTime] = useState(new Date());
  const alerts = useAlertStore((s) => s.alerts);
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const openTab = useUiStore((s) => s.openTab);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <header className="h-12 shrink-0 flex items-center gap-3 px-4 border-b border-[#1E3A5F] z-20 relative"
      style={{ background: "rgba(15,28,46,0.9)", backdropFilter: "blur(16px)" }}>

      {/* Search */}
      <div className="flex-1 max-w-xs relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6080]" />
        <input
          className="ib-input w-full pl-8 pr-3 py-1.5 text-xs"
          placeholder={placeholder}
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* AI Active badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#34D399]/40 bg-[#34D399]/8 cursor-default">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
          <span className="text-[11px] font-semibold text-[#34D399] font-jakarta">AI ACTIVE</span>
        </div>

        {/* Icons */}
        <button className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4A6080] hover:text-[#8BA3C7] hover:bg-[#1E3A5F] active:scale-90 transition-all">
          <BarChart2 size={14} />
        </button>
        <button
          onClick={() => openTab("telemetry")}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4A6080] hover:text-[#8BA3C7] hover:bg-[#1E3A5F] active:scale-90 transition-all"
          title="Telemetry Stream"
        >
          <Radio size={14} />
        </button>

        {/* Notifications */}
        <button
          onClick={() => openTab("alerts")}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#4A6080] hover:text-[#8BA3C7] hover:bg-[#1E3A5F] active:scale-90 transition-all relative"
          title="Active Alerts"
        >
          <Bell size={14} />
          {criticalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#FF5C5C] text-white text-[8px] font-bold flex items-center justify-center animate-bounce">
              {criticalCount}
            </span>
          )}
        </button>

        {/* Time */}
        <span className="text-[11px] font-mono text-[#4A6080] tabular-nums">{fmt}</span>

        {/* Avatar */}
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white cursor-pointer"
          style={{ background: "linear-gradient(135deg, #4F9DFF, #7C5CFC)" }}>
          A
        </div>
      </div>
    </header>
  );
}

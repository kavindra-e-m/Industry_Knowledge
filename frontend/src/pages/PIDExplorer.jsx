import { useState } from "react";
import { motion } from "framer-motion";
import { Hand, ZoomIn, ChevronRight, AlertTriangle, CheckCircle, Clock, Bot, History } from "lucide-react";
import PageShell from "../components/shared/PageShell";

const BREADCRUMB = ["Production Plant B", "Unit 400", "PID-402-B: Fractionator"];

const SEQUENCE = [
  { step: 1, title: "Close HV-104 Feed", desc: "Manual gate valve at Level 4 Bridge.", status: "VERIFIED", color: "#34D399" },
  { step: 2, title: "Isolate PV-402 Loop", desc: "Remote signal to be sent from Control Room.", status: "PENDING", color: "#FBBF24", action: true },
  { step: 3, title: "LOTO Procedure", desc: "Apply physical lockouts to LV-002.", status: null, color: "#4A6080" },
];

const STATS = [
  { label: "TOTAL ASSETS", value: "128", icon: "👥" },
  { label: "HEALTH STATUS", value: "Optimal", icon: "✓", color: "#34D399" },
  { label: "REVISION", value: "v2.4.1", icon: "📋" },
  { label: "SIMULATIONS", value: "3 Active", icon: "⚡", color: "#4F9DFF" },
];

export default function PIDExplorer() {
  const [activeTool, setActiveTool] = useState("hand");

  return (
    <PageShell topbarPlaceholder="Search instrumentation, assets, or flow paths...">
      <div className="flex h-full" style={{ background: "#07111F" }}>

        {/* Canvas area */}
        <div className="flex-1 flex flex-col min-w-0 relative">

          {/* Breadcrumb toolbar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1E3A5F] bg-[#0F1C2E]">
            <button className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeTool === "hand" ? "bg-[#4F9DFF]/20 text-[#4F9DFF]" : "text-[#4A6080] hover:bg-[#1E3A5F]"}`}
              onClick={() => setActiveTool("hand")}>
              <Hand size={14} />
            </button>
            <button className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeTool === "zoom" ? "bg-[#4F9DFF]/20 text-[#4F9DFF]" : "text-[#4A6080] hover:bg-[#1E3A5F]"}`}
              onClick={() => setActiveTool("zoom")}>
              <ZoomIn size={14} />
            </button>
            <div className="w-px h-5 bg-[#1E3A5F] mx-1" />
            <div className="flex items-center gap-1 text-[11px] text-[#4A6080]">
              {BREADCRUMB.map((b, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight size={10} />}
                  <span className={i === BREADCRUMB.length - 1 ? "text-[#F0F6FF]" : "hover:text-[#8BA3C7] cursor-pointer"}>{b}</span>
                </span>
              ))}
            </div>
          </div>

          {/* P&ID Canvas */}
          <div className="flex-1 relative overflow-hidden" style={{ background: "#0a1520" }}>
            <svg className="w-full h-full" viewBox="0 0 600 380">
              {/* Grid */}
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1E3A5F" strokeWidth="0.5" strokeOpacity="0.4" />
                </pattern>
              </defs>
              <rect width="600" height="380" fill="url(#grid)" />

              {/* Pipes */}
              <line x1="100" y1="190" x2="280" y2="190" stroke="#4F9DFF" strokeWidth="2" strokeOpacity="0.6" />
              <line x1="280" y1="100" x2="280" y2="280" stroke="#4F9DFF" strokeWidth="2" strokeOpacity="0.6" />
              <line x1="280" y1="190" x2="460" y2="190" stroke="#34D399" strokeWidth="2" strokeOpacity="0.6" />
              <line x1="460" y1="130" x2="460" y2="250" stroke="#34D399" strokeWidth="2" strokeOpacity="0.4" />

              {/* Vessel */}
              <rect x="240" y="80" width="80" height="220" rx="8" fill="#16263D" stroke="#4F9DFF" strokeWidth="1.5" />
              <text x="280" y="195" textAnchor="middle" fontSize="10" fill="#4F9DFF">PV-402</text>

              {/* Valves */}
              <circle cx="160" cy="190" r="10" fill="#16263D" stroke="#FBBF24" strokeWidth="1.5" />
              <text x="160" y="194" textAnchor="middle" fontSize="7" fill="#FBBF24">HV</text>
              <text x="160" y="210" textAnchor="middle" fontSize="7" fill="#4A6080">HV-104</text>

              <circle cx="400" cy="190" r="10" fill="#16263D" stroke="#FF5C5C" strokeWidth="1.5" />
              <text x="400" y="194" textAnchor="middle" fontSize="7" fill="#FF5C5C">LV</text>
              <text x="400" y="210" textAnchor="middle" fontSize="7" fill="#4A6080">LV-002</text>

              {/* Instruments */}
              <rect x="440" y="120" width="40" height="24" rx="4" fill="#16263D" stroke="#34D399" strokeWidth="1" />
              <text x="460" y="136" textAnchor="middle" fontSize="8" fill="#34D399">FT-401</text>
            </svg>

            {/* Impact Analysis overlay */}
            <motion.div
              className="absolute bottom-4 left-4 ib-glass p-4 max-w-xs"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={13} className="text-[#FBBF24]" />
                <p className="text-[12px] font-bold text-white">Impact Analysis Active</p>
              </div>
              <p className="text-[11px] text-[#8BA3C7] mb-3">Closing Valve V-102 will impact Flow Loop 400A and trigger low-pressure alarms in Downstream Unit 402B.</p>
              <div className="flex items-center justify-between">
                <span className="ib-label">CRITICALITY</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-[#1E3A5F] overflow-hidden">
                    <div className="h-full w-4/5 rounded-full bg-[#FF5C5C]" />
                  </div>
                  <span className="text-[10px] font-bold text-[#FF5C5C]">HIGH</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom stats bar */}
          <div className="flex items-center gap-0 border-t border-[#1E3A5F] bg-[#0F1C2E]">
            {STATS.map((s, i) => (
              <div key={i} className={`flex-1 flex items-center gap-2.5 px-4 py-3 ${i < STATS.length - 1 ? "border-r border-[#1E3A5F]" : ""}`}>
                <span className="text-base">{s.icon}</span>
                <div>
                  <p className="ib-label">{s.label}</p>
                  <p className="text-[13px] font-bold font-sora" style={{ color: s.color || "#F0F6FF" }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Isolation Planner */}
        <div className="w-72 shrink-0 border-l border-[#1E3A5F] flex flex-col overflow-hidden" style={{ background: "#0F1C2E" }}>
          <div className="p-4 border-b border-[#1E3A5F]">
            <p className="text-sm font-semibold text-white font-sora">Isolation Planner</p>
            <p className="text-[11px] text-[#4A6080] mt-0.5">Maintenance Schedule: MT-402-23</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="ib-label">ACTIVE SEQUENCE</p>
            {SEQUENCE.map((s) => (
              <div key={s.step} className="ib-card p-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{ background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}40` }}>
                    {s.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[12px] font-semibold text-white">{s.title}</p>
                      {s.status && (
                        <span className="text-[9px] font-bold" style={{ color: s.color }}>{s.status}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#4A6080]">{s.desc}</p>
                    {s.action && (
                      <button className="mt-2 w-full py-1.5 rounded-lg text-[10px] font-bold text-[#07111F] transition-all"
                        style={{ background: "#4F9DFF" }}>
                        EXECUTE SIGNAL
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Asset Intel */}
            <div className="mt-2">
              <p className="ib-label mb-3">Asset Intel</p>
              <div className="ib-card p-0 overflow-hidden">
                <div className="h-28 bg-gradient-to-br from-[#0a1520] to-[#1a2d47] flex items-center justify-center text-4xl">
                  ⚙
                </div>
                <div className="p-3">
                  <p className="text-[12px] font-bold text-white">PV-402 (Pressure Control)</p>
                  <div className="flex items-start gap-2 mt-2 p-2 rounded-lg bg-[#0F1C2E]">
                    <Bot size={11} className="text-[#7C5CFC] shrink-0 mt-0.5" />
                    <p className="text-[10px] text-[#8BA3C7] leading-relaxed">
                      I've detected a recurring pressure oscillation in the bypass line. Would you like to simulate a relief valve test?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 border-t border-[#1E3A5F]">
            <button className="w-full ib-btn ib-btn-ghost justify-center text-xs py-2.5">
              <History size={13} /> View Isolation History
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

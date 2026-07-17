import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Tag, X, ChevronRight, Bot, AlertTriangle, ShieldCheck, FileText } from "lucide-react";
import PageShell from "../components/shared/PageShell";

const NODES = [
  { id: "turbine", x: 310, y: 200, label: "Turbine-X9", sub: "ROOT EQUIPMENT", color: "#4F9DFF", r: 28, icon: "⚙" },
  { id: "sop", x: 160, y: 100, label: "SOP-2024-B", sub: "DOCUMENTATION", color: "#7C5CFC", r: 20, icon: "📄" },
  { id: "iso", x: 200, y: 330, label: "ISO-9001", sub: "REGULATION", color: "#34D399", r: 20, icon: "✓" },
  { id: "incident", x: 460, y: 130, label: "INC-2024-089", sub: "INCIDENT", color: "#FF5C5C", r: 18, icon: "⚠" },
  { id: "sensor", x: 480, y: 290, label: "NW-S3-C", sub: "SENSOR", color: "#38BDF8", r: 16, icon: "◎" },
];

const EDGES = [
  { from: "turbine", to: "sop" }, { from: "turbine", to: "iso" },
  { from: "turbine", to: "incident" }, { from: "turbine", to: "sensor" },
];

const LEGEND = [
  { color: "#4F9DFF", label: "Equipment" },
  { color: "#7C5CFC", label: "Documents" },
  { color: "#FF5C5C", label: "Incidents" },
  { color: "#34D399", label: "Regulations" },
];

const RELATIONS = [
  { icon: FileText, color: "#7C5CFC", label: "Standard Operating Proc.", sub: "Associated Document" },
  { icon: AlertTriangle, color: "#FF5C5C", label: "Thermal Anomaly Detected", sub: "Linked Incident" },
  { icon: ShieldCheck, color: "#34D399", label: "Environment Safety Regs", sub: "Compliance Rule" },
];

const getNode = (id) => NODES.find((n) => n.id === id);

export default function KnowledgeGraph() {
  const [selected, setSelected] = useState("turbine");
  const sel = NODES.find((n) => n.id === selected);

  return (
    <PageShell topbarPlaceholder="Search industrial assets, documents, or tags...">
      <div className="flex h-full" style={{ background: "#07111F" }}>

        {/* Graph canvas */}
        <div className="flex-1 relative overflow-hidden">
          {/* Toolbar */}
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <button className="ib-btn ib-btn-ghost text-xs gap-1.5"><Filter size={12} /> Filters</button>
            <button className="ib-btn ib-btn-ghost text-xs gap-1.5"><Tag size={12} /> Entities</button>
          </div>

          {/* SVG Graph */}
          <svg className="w-full h-full" viewBox="0 0 640 440">
            <defs>
              {NODES.map((n) => (
                <radialGradient key={n.id} id={`glow-${n.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={n.color} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={n.color} stopOpacity="0" />
                </radialGradient>
              ))}
            </defs>

            {/* Edges */}
            {EDGES.map((e, i) => {
              const a = getNode(e.from), b = getNode(e.to);
              return (
                <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={b.color} strokeWidth="1" strokeOpacity="0.35"
                  strokeDasharray={selected === e.from || selected === e.to ? "none" : "4 4"} />
              );
            })}

            {/* Nodes */}
            {NODES.map((n) => (
              <g key={n.id} className="cursor-pointer" onClick={() => setSelected(n.id)}>
                {/* Glow halo */}
                <circle cx={n.x} cy={n.y} r={n.r + 16} fill={`url(#glow-${n.id})`} />
                {/* Ring */}
                {selected === n.id && (
                  <circle cx={n.x} cy={n.y} r={n.r + 6} fill="none" stroke={n.color} strokeWidth="1" strokeOpacity="0.5" strokeDasharray="4 4" />
                )}
                {/* Body */}
                <circle cx={n.x} cy={n.y} r={n.r} fill="#16263D" stroke={n.color} strokeWidth={selected === n.id ? 2 : 1} />
                {/* Icon */}
                <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={n.r * 0.7} fill={n.color}>{n.icon}</text>
                {/* Label */}
                <text x={n.x} y={n.y + n.r + 14} textAnchor="middle" fontSize="10" fill="#F0F6FF" fontFamily="Plus Jakarta Sans">{n.label}</text>
                <text x={n.x} y={n.y + n.r + 25} textAnchor="middle" fontSize="8" fill={n.color} fontFamily="Plus Jakarta Sans">{n.sub}</text>
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 ib-glass px-4 py-3">
            <p className="ib-label mb-2">GRAPH LEGEND</p>
            <div className="space-y-1.5">
              {LEGEND.map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  <span className="text-[11px] text-[#8BA3C7]">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        {sel && (
          <motion.div
            key={sel.id}
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            className="w-72 shrink-0 border-l border-[#1E3A5F] p-5 space-y-5 overflow-y-auto"
            style={{ background: "#0F1C2E" }}
          >
            <div className="flex items-center justify-between">
              <p className="ib-label">EQUIPMENT</p>
              <button onClick={() => setSelected(null)} className="text-[#4A6080] hover:text-[#8BA3C7]"><X size={14} /></button>
            </div>

            <div>
              <p className="text-xl font-bold text-white font-sora">{sel.label}</p>
              <p className="text-[11px] text-[#4A6080] mt-0.5">Asset ID: IB-7742-XQ</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="ib-card p-3">
                <p className="ib-label mb-1">HEALTH INDEX</p>
                <p className="text-xl font-bold text-[#34D399] font-sora">94%</p>
              </div>
              <div className="ib-card p-3">
                <p className="ib-label mb-1">LAST MAINTENANCE</p>
                <p className="text-xl font-bold text-white font-sora">12d ago</p>
              </div>
            </div>

            <div>
              <p className="ib-label mb-3">SEMANTIC RELATIONSHIPS</p>
              <div className="space-y-2">
                {RELATIONS.map((r, i) => (
                  <button key={i} className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#1E3A5F] hover:border-[#2a4a6b] hover:bg-[#16263D] transition-all text-left">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${r.color}18` }}>
                      <r.icon size={14} style={{ color: r.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-white truncate">{r.label}</p>
                      <p className="text-[10px] text-[#4A6080]">{r.sub}</p>
                    </div>
                    <ChevronRight size={13} className="text-[#4A6080] shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="ib-card p-3" style={{ borderColor: "rgba(124,92,252,0.3)", background: "rgba(124,92,252,0.06)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Bot size={12} className="text-[#7C5CFC]" />
                <p className="text-[10px] font-bold text-[#7C5CFC] uppercase tracking-wider">AI Synthesis</p>
              </div>
              <p className="text-[12px] text-[#8BA3C7] leading-relaxed">
                Cross-referencing historical maintenance logs with current vibration data suggests a potential shaft misalignment. Probability: 87%. Immediate inspection recommended.
              </p>
            </div>

            <button className="w-full ib-btn ib-btn-ghost justify-center py-2.5">
              <Bot size={13} /> Ask AI Copilot
            </button>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
}

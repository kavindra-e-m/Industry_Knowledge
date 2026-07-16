import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Camera, Edit, Download, CheckCircle, FileText, Bot, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/shared/PageShell";
import StatRing from "../components/shared/StatRing";

const SENSORS = [
  { label: "CORE TEMP", value: "842°C", delta: "+1.2%", color: "#FBBF24", status: "nominal" },
  { label: "ROTATION", value: "12,400 RPM", delta: "NOMINAL", color: "#34D399", status: "nominal" },
  { label: "INLET PRESSURE", value: "45.2 BAR", delta: "-0.4%", color: "#4F9DFF", status: "nominal" },
  { label: "VIBRATION", value: "LOW LVL", delta: "0.02mm", color: "#7C5CFC", status: "nominal" },
];

const AI_INSIGHTS = [
  {
    title: "Lubrication Cycle Optimization",
    confidence: "HIGH CONFIDENCE",
    confColor: "#34D399",
    desc: "AI analysis of thermal signatures suggests increasing the lubrication interval for Bearing Housing A-12. This will likely extend the component life by 12% and reduce thermal peaks by 15°C.",
  },
];

const DOCS = [
  { name: "P&ID-GT-402X-2024.pdf", sub: "TECHNICAL SCHEMATIC · 12MB", icon: "📄", color: "#4F9DFF" },
  { name: "ISO-9001 Safety Audit", sub: "CERTIFIED PASS · 2024-03", icon: "✓", color: "#34D399" },
  { name: "Maintenance History v2.4", sub: "LAST UPDATE: OCT 13", icon: "📋", color: "#7C5CFC" },
];

export default function EquipmentDetails() {
  const [tab, setTab] = useState("insights");
  const navigate = useNavigate();

  return (
    <PageShell topbarPlaceholder="Search parameters, telemetry, or doc...">
      <div className="p-6 space-y-5" style={{ background: "#07111F", minHeight: "100%" }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[11px] text-[#4A6080] hover:text-[#8BA3C7] transition-colors">
            <ChevronLeft size={13} /> Asset Fleet / Turbine Group B /
          </button>
          <span className="text-[11px] text-[#4F9DFF] font-semibold">GT-402X Details</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Left: Asset image + sensors */}
          <div className="xl:col-span-2 space-y-4">

            {/* Asset image */}
            <motion.div className="ib-card p-0 overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="relative h-56 bg-gradient-to-br from-[#0a1520] to-[#1a2d47] flex items-center justify-center">
                <div className="text-8xl opacity-30">⚙</div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#07111F] via-transparent to-transparent" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button className="w-8 h-8 rounded-lg bg-[#16263D]/80 backdrop-blur flex items-center justify-center text-[#4A6080] hover:text-[#8BA3C7] transition-all">
                    <Camera size={13} />
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-[#16263D]/80 backdrop-blur flex items-center justify-center text-[#4A6080] hover:text-[#8BA3C7] transition-all">
                    <Edit size={13} />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="ib-badge ib-badge-critical text-[9px] mb-2 inline-block">CRITICAL ASSET</span>
                  <p className="text-lg font-bold text-white font-sora">General Tech GT-402X</p>
                  <p className="text-[11px] text-[#4A6080]">High-Pressure Gas Combustion Turbine · Sector 7G</p>
                  <p className="text-[10px] text-[#4A6080] mt-0.5 font-mono">SN: 4920-IB-772</p>
                </div>
              </div>
            </motion.div>

            {/* Sensor KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SENSORS.map((s, i) => (
                <motion.div
                  key={s.label}
                  className="ib-card p-3"
                  style={{ borderColor: `${s.color}25` }}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="ib-label">{s.label}</p>
                    <span className="text-[10px] font-semibold" style={{ color: s.color }}>{s.delta}</span>
                  </div>
                  <p className="text-[15px] font-bold text-white font-sora">{s.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Tabs */}
            <motion.div className="ib-card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="flex gap-1 mb-4 border-b border-[#1E3A5F] pb-3">
                {["insights", "maintenance"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                      tab === t ? "bg-[#4F9DFF]/15 text-[#4F9DFF]" : "text-[#4A6080] hover:text-[#8BA3C7]"
                    }`}
                  >
                    {t === "insights" ? <><Bot size={12} /> AI INSIGHTS</> : <><Calendar size={12} /> MAINTENANCE LOG</>}
                  </button>
                ))}
              </div>

              {tab === "insights" && AI_INSIGHTS.map((ins, i) => (
                <div key={i} className="p-4 rounded-xl border border-[#1E3A5F]">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#7C5CFC]/15 flex items-center justify-center">
                        <Bot size={13} className="text-[#7C5CFC]" />
                      </div>
                      <p className="text-[13px] font-bold text-white">{ins.title}</p>
                    </div>
                    <span className="ib-badge text-[9px]" style={{ background: `${ins.confColor}18`, color: ins.confColor, border: `1px solid ${ins.confColor}30` }}>
                      {ins.confidence}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#8BA3C7] leading-relaxed mb-3">{ins.desc}</p>
                  <div className="flex gap-2">
                    <button className="ib-btn ib-btn-primary text-xs py-1.5">Schedule Action</button>
                    <button className="ib-btn ib-btn-ghost text-xs py-1.5">Ignore</button>
                  </div>
                </div>
              ))}

              {tab === "maintenance" && (
                <div className="text-center py-8 text-[#4A6080] text-[12px]">
                  Maintenance log entries will appear here.
                </div>
              )}
            </motion.div>
          </div>

          {/* Right: Vitality + Docs */}
          <div className="space-y-4">

            {/* System Vitality */}
            <motion.div className="ib-card p-5 flex flex-col items-center gap-3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
              <p className="ib-label self-start">SYSTEM VITALITY</p>
              <StatRing value={92} size={130} stroke={10} color="#34D399" />
              <p className="text-sm font-bold text-[#34D399] font-sora">HEALTHY</p>
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="ib-card p-3 text-center">
                  <p className="ib-label mb-1">MTBF</p>
                  <p className="text-lg font-bold text-white font-sora">1,240</p>
                  <p className="text-[10px] text-[#4A6080]">hrs</p>
                </div>
                <div className="ib-card p-3 text-center">
                  <p className="ib-label mb-1">EFFICIENCY</p>
                  <p className="text-lg font-bold text-[#34D399] font-sora">98.2%</p>
                </div>
              </div>
            </motion.div>

            {/* Compliance & Docs */}
            <motion.div className="ib-card p-4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-white font-sora">Compliance & Docs</p>
                <button className="text-[11px] text-[#4F9DFF] hover:underline">View All</button>
              </div>
              <div className="space-y-2">
                {DOCS.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-[#1E3A5F] hover:border-[#2a4a6b] transition-all">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base" style={{ background: `${d.color}18` }}>
                      {d.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-white truncate">{d.name}</p>
                      <p className="text-[9px] text-[#4A6080]">{d.sub}</p>
                    </div>
                    <Download size={12} className="text-[#4A6080] hover:text-[#8BA3C7] cursor-pointer shrink-0" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

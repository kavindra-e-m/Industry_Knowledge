import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Camera, Edit, Download, CheckCircle, FileText, Bot, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/shared/PageShell";
import StatRing from "../components/shared/StatRing";

const SENSORS = [
  { label: "CORE TEMP", value: "842°C", delta: "+1.2%", color: "var(--warning)", status: "nominal" },
  { label: "ROTATION", value: "12,400 RPM", delta: "NOMINAL", color: "var(--success)", status: "nominal" },
  { label: "INLET PRESSURE", value: "45.2 BAR", delta: "-0.4%", color: "var(--accent-primary)", status: "nominal" },
  { label: "VIBRATION", value: "LOW LVL", delta: "0.02mm", color: "var(--accent-secondary)", status: "nominal" },
];

const AI_INSIGHTS = [
  {
    title: "Lubrication Cycle Optimization",
    confidence: "HIGH CONFIDENCE",
    confColor: "var(--success)",
    desc: "AI analysis of thermal signatures suggests increasing the lubrication interval for Bearing Housing A-12. This will likely extend the component life by 12% and reduce thermal peaks by 15°C.",
  },
];

const DOCS = [
  { name: "P&ID-GT-402X-2024.pdf", sub: "TECHNICAL SCHEMATIC · 12MB", icon: "📄", color: "var(--accent-primary)" },
  { name: "ISO-9001 Safety Audit", sub: "CERTIFIED PASS · 2024-03", icon: "✓", color: "var(--success)" },
  { name: "Maintenance History v2.4", sub: "LAST UPDATE: OCT 13", icon: "📋", color: "var(--accent-secondary)" },
];

export default function EquipmentDetails() {
  const [tab, setTab] = useState("insights");
  const navigate = useNavigate();

  return (
    <PageShell topbarPlaceholder="Search parameters, telemetry, or doc...">
      <div className="p-6 space-y-5 min-h-full" style={{ background: "transparent" }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[11px] hover:opacity-80 transition-colors" style={{ color: "var(--text-tertiary)" }}>
            <ChevronLeft size={13} /> Asset Fleet / Turbine Group B /
          </button>
          <span className="text-[11px] font-semibold" style={{ color: "var(--accent-primary)" }}>GT-402X Details</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Left: Asset image + sensors */}
          <div className="xl:col-span-2 space-y-4">

            {/* Asset image */}
            <motion.div className="ib-card p-0 overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="relative h-56 flex items-center justify-center transition-colors duration-250" style={{ background: "var(--surface-secondary)" }}>
                <div className="text-8xl opacity-15">⚙</div>
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-primary)] via-transparent to-transparent" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--surface-tertiary)]" style={{ background: "var(--surface-primary)", color: "var(--text-tertiary)" }}>
                    <Camera size={13} />
                  </button>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--surface-tertiary)]" style={{ background: "var(--surface-primary)", color: "var(--text-tertiary)" }}>
                    <Edit size={13} />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="ib-badge ib-badge-critical text-[9px] mb-2 inline-block">CRITICAL ASSET</span>
                  <p className="text-lg font-bold font-sora" style={{ color: "var(--text-primary)" }}>General Tech GT-402X</p>
                  <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>High-Pressure Gas Combustion Turbine · Sector 7G</p>
                  <p className="text-[10px] mt-0.5 font-mono" style={{ color: "var(--text-tertiary)" }}>SN: 4920-IB-772</p>
                </div>
              </div>
            </motion.div>

            {/* Sensor KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SENSORS.map((s, i) => (
                <motion.div
                  key={s.label}
                  className="ib-card p-3 animate-fade-in"
                  style={{ borderColor: `${s.color}25` }}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="ib-label">{s.label}</p>
                    <span className="text-[10px] font-semibold" style={{ color: s.color }}>{s.delta}</span>
                  </div>
                  <p className="text-[15px] font-bold font-sora" style={{ color: "var(--text-primary)" }}>{s.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Tabs */}
            <motion.div className="ib-card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="flex gap-1 mb-4 border-b pb-3" style={{ borderColor: "var(--border-primary)" }}>
                {["insights", "maintenance"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                      tab === t ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]" : "hover:bg-[var(--surface-tertiary)]"
                    }`}
                    style={{ color: tab === t ? "var(--accent-primary)" : "var(--text-tertiary)" }}
                  >
                    {t === "insights" ? <><Bot size={12} /> AI INSIGHTS</> : <><Calendar size={12} /> MAINTENANCE LOG</>}
                  </button>
                ))}
              </div>

              {tab === "insights" && AI_INSIGHTS.map((ins, i) => (
                <div key={i} className="p-4 rounded-xl border" style={{ borderColor: "var(--border-primary)" }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center">
                        <Bot size={13} style={{ color: "var(--accent-secondary)" }} />
                      </div>
                      <p className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>{ins.title}</p>
                    </div>
                    <span className="ib-badge text-[9px]" style={{ background: `${ins.confColor}18`, color: ins.confColor, border: `1px solid ${ins.confColor}30` }}>
                      {ins.confidence}
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>{ins.desc}</p>
                  <div className="flex gap-2">
                    <button className="ib-btn ib-btn-primary text-xs py-1.5">Schedule Action</button>
                    <button className="ib-btn ib-btn-ghost text-xs py-1.5">Ignore</button>
                  </div>
                </div>
              ))}

              {tab === "maintenance" && (
                <div className="text-center py-8 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
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
              <StatRing value={92} size={130} stroke={10} color="var(--success)" />
              <p className="text-sm font-bold font-sora" style={{ color: "var(--success)" }}>HEALTHY</p>
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="ib-card p-3 text-center">
                  <p className="ib-label mb-1">MTBF</p>
                  <p className="text-lg font-bold font-sora" style={{ color: "var(--text-primary)" }}>1,240</p>
                  <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>hrs</p>
                </div>
                <div className="ib-card p-3 text-center">
                  <p className="ib-label mb-1">EFFICIENCY</p>
                  <p className="text-lg font-bold font-sora" style={{ color: "var(--success)" }}>98.2%</p>
                </div>
              </div>
            </motion.div>

            {/* Compliance & Docs */}
            <motion.div className="ib-card p-4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Compliance & Docs</p>
                <button className="text-[11px] hover:underline" style={{ color: "var(--accent-primary)" }}>View All</button>
              </div>
              <div className="space-y-2">
                {DOCS.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border transition-all" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base" style={{ background: `${d.color}18` }}>
                      {d.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{d.name}</p>
                      <p className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>{d.sub}</p>
                    </div>
                    <Download size={12} style={{ color: "var(--text-tertiary)" }} className="hover:opacity-80 cursor-pointer shrink-0" />
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

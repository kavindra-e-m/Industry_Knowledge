import { motion } from "framer-motion";
import { ShieldCheck, Download, AlertTriangle, Clock, FileText, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import PageShell from "../components/shared/PageShell";
import StatRing from "../components/shared/StatRing";
import { useCompliance } from "../hooks/useCompliance";

const REG_DATA = [
  { month: "JAN", v: 78 }, { month: "FEB", v: 82 }, { month: "MAR", v: 71 },
  { month: "APR", v: 85 }, { month: "MAY", v: 80 }, { month: "JUN", v: 94 },
];

const RISK_ZONES = [
  { name: "Sector A1", risk: "low" }, { name: "Sector A2", risk: "low" },
  { name: "Turbine Hall", risk: "med" }, { name: "Core Lab", risk: "high" },
  { name: "Sector B1", risk: "low" }, { name: "Sector B2", risk: "low" },
  { name: "Sector B3", risk: "low" }, { name: "Waste Area", risk: "med" },
  { name: "Storage Z", risk: "low" }, { name: "Exhaust A", risk: "high" },
  { name: "Cooling", risk: "low" }, { name: "Admin", risk: "low" },
];

const RISK_STYLE = {
  low:  { bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.3)", text: "var(--success)" },
  med:  { bg: "rgba(124, 58, 237, 0.12)", border: "rgba(124, 58, 237, 0.3)", text: "var(--accent-secondary)" },
  high: { bg: "rgba(239, 68, 68, 0.12)",  border: "rgba(239, 68, 68, 0.3)",  text: "var(--error)" },
};

const ACTIONS = [
  { icon: AlertTriangle, color: "var(--error)", title: "Pressure Vessel Cert", sub: "Expired 12 days ago · Boiler 04" },
  { icon: Clock, color: "var(--warning)", title: "Emissions Audit", sub: "Due in 3 days · National Grid" },
  { icon: FileText, color: "var(--accent-primary)", title: "Health & Safety Plan", sub: "Review required · Facility 09" },
];

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ib-glass px-3 py-2 text-xs shadow-md">
      <p className="font-bold" style={{ color: "var(--text-primary)" }}>{payload[0].value}%</p>
    </div>
  );
};

export default function ComplianceIntelligence() {
  const { records, averageScore, loading } = useCompliance();

  return (
    <PageShell topbarPlaceholder="Query regulatory framework...">
      <div className="p-6 space-y-5 min-h-full" style={{ background: "transparent" }}>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] mb-1" style={{ color: "var(--text-tertiary)" }}>
              <span>Industrial Intelligence</span><ChevronRight size={10} />
              <span style={{ color: "var(--accent-primary)" }}>Compliance Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold font-sora">
              <span style={{ color: "var(--text-primary)" }}>Compliance </span>
              <span style={{ color: "var(--accent-primary)" }}>Intelligence</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <button className="ib-btn ib-btn-ghost text-xs"><Download size={12} /> Export Report</button>
            <button className="ib-btn ib-btn-primary text-xs"><ShieldCheck size={12} /> Audit Mode</button>
          </div>
        </div>

        {/* Top row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Score */}
          <motion.div className="ib-card p-6 flex flex-col items-center gap-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <StatRing value={averageScore} size={140} stroke={10} color="var(--success)" loading={loading} />
            <p className="ib-label">OVERALL SCORE</p>
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-xl font-bold font-sora" style={{ color: "var(--success)" }}>98.2%</p>
                <p className="ib-label mt-0.5">SAFETY</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold font-sora" style={{ color: "var(--accent-primary)" }}>89.4%</p>
                <p className="ib-label mt-0.5">EMISSION</p>
              </div>
            </div>
          </motion.div>

          {/* Regulation Coverage */}
          <motion.div className="ib-card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold font-sora animate-fade-in" style={{ color: "var(--text-primary)" }}>Regulation Coverage</p>
              <div className="flex gap-2">
                {["ISO 27001", "OSHA", "GDPR"].map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded border" style={{ color: "var(--text-secondary)", borderColor: "var(--border-primary)" }}>{t}</span>
                ))}
              </div>
            </div>
            <p className="text-[11px] mb-3" style={{ color: "var(--text-tertiary)" }}>Gap analysis against global standards</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={REG_DATA} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "var(--text-tertiary)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--text-tertiary)", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-tertiary)" }} />
                <Bar dataKey="v" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {REG_DATA.map((_, i) => (
                    <Cell key={i} fill={i === REG_DATA.length - 1 ? "var(--success)" : "var(--border-secondary)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Risk Topology */}
          <motion.div className="ib-card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Plant Risk Topology</p>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--text-secondary)" }}>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "var(--success)" }} /> LOW</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "var(--accent-secondary)" }} /> MED</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "var(--error)" }} /> HIGH</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {RISK_ZONES.map((z) => {
                const s = RISK_STYLE[z.risk];
                return (
                  <button key={z.name} className="py-2 px-1 rounded-lg text-[11px] font-semibold text-center transition-all hover:opacity-85 shadow-sm"
                    style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
                    {z.name}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Action Items */}
          <motion.div className="ib-card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Action Items</p>
              <span className="ib-badge ib-badge-critical">4 CRITICAL</span>
            </div>
            <div className="space-y-2">
              {ACTIONS.map((a, i) => (
                <button key={i} className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
                  style={{
                    borderColor: "var(--border-primary)",
                    background: "var(--surface-secondary)",
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${a.color}15` }}>
                    <a.icon size={15} style={{ color: a.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>{a.title}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{a.sub}</p>
                  </div>
                  <ChevronRight size={13} style={{ color: "var(--text-tertiary)" }} className="shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </PageShell>
  );
}

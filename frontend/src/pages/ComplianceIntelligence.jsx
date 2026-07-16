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
  low:  { bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)", text: "#34D399" },
  med:  { bg: "rgba(124,92,252,0.12)", border: "rgba(124,92,252,0.3)", text: "#7C5CFC" },
  high: { bg: "rgba(255,92,92,0.12)",  border: "rgba(255,92,92,0.3)",  text: "#FF5C5C" },
};

const ACTIONS = [
  { icon: AlertTriangle, color: "#FF5C5C", title: "Pressure Vessel Cert", sub: "Expired 12 days ago · Boiler 04" },
  { icon: Clock, color: "#FBBF24", title: "Emissions Audit", sub: "Due in 3 days · National Grid" },
  { icon: FileText, color: "#4F9DFF", title: "Health & Safety Plan", sub: "Review required · Facility 09" },
];

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ib-glass px-3 py-2 text-xs">
      <p className="text-white font-bold">{payload[0].value}%</p>
    </div>
  );
};

export default function ComplianceIntelligence() {
  const { records, averageScore, loading } = useCompliance();

  return (
    <PageShell topbarPlaceholder="Query regulatory framework...">
      <div className="p-6 space-y-5" style={{ background: "#07111F", minHeight: "100%" }}>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#4A6080] mb-1">
              <span>Industrial Intelligence</span><ChevronRight size={10} />
              <span className="text-[#4F9DFF]">Compliance Dashboard</span>
            </div>
            <h1 className="text-2xl font-bold font-sora">
              <span className="text-white">Compliance </span>
              <span className="text-[#4F9DFF]">Intelligence</span>
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
            <StatRing value={averageScore} size={140} stroke={10} color="#34D399" loading={loading} />
            <p className="ib-label">OVERALL SCORE</p>
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-xl font-bold text-[#34D399] font-sora">98.2%</p>
                <p className="ib-label mt-0.5">SAFETY</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-[#4F9DFF] font-sora">89.4%</p>
                <p className="ib-label mt-0.5">EMISSION</p>
              </div>
            </div>
          </motion.div>

          {/* Regulation Coverage */}
          <motion.div className="ib-card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-white font-sora">Regulation Coverage</p>
              <div className="flex gap-2">
                {["ISO 27001", "OSHA", "GDPR"].map((t) => (
                  <span key={t} className="text-[10px] text-[#4A6080] border border-[#1E3A5F] px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-[#4A6080] mb-3">Gap analysis against global standards</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={REG_DATA} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#4A6080", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4A6080", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="v" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {REG_DATA.map((_, i) => (
                    <Cell key={i} fill={i === REG_DATA.length - 1 ? "#34D399" : "#1E3A5F"} />
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
              <p className="text-sm font-semibold text-white font-sora">Plant Risk Topology</p>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#34D399]" /> LOW</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#7C5CFC]" /> MED</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#FF5C5C]" /> HIGH</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {RISK_ZONES.map((z) => {
                const s = RISK_STYLE[z.risk];
                return (
                  <button key={z.name} className="py-2 px-1 rounded-lg text-[11px] font-semibold text-center transition-all hover:opacity-80"
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
              <p className="text-sm font-semibold text-white font-sora">Action Items</p>
              <span className="ib-badge ib-badge-critical">4 CRITICAL</span>
            </div>
            <div className="space-y-2">
              {ACTIONS.map((a, i) => (
                <button key={i} className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#1E3A5F] hover:border-[#2a4a6b] transition-all text-left">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${a.color}18` }}>
                    <a.icon size={15} style={{ color: a.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white">{a.title}</p>
                    <p className="text-[10px] text-[#4A6080]">{a.sub}</p>
                  </div>
                  <ChevronRight size={13} className="text-[#4A6080] shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </PageShell>
  );
}

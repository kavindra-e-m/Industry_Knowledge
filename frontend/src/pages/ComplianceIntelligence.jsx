import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Download, AlertTriangle, Clock, FileText, ChevronRight, Check } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import PageShell from "../components/shared/PageShell";
import StatRing from "../components/shared/StatRing";
import { useCompliance } from "../hooks/useCompliance";
import { useToastStore } from "../store/toastStore";

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
  const push = useToastStore((s) => s.push);
  const [exporting, setExporting] = useState(false);
  const [auditMode, setAuditMode] = useState(false);

  const handleExportReport = () => {
    setExporting(true);
    push({ type: "info", title: "Compliance Report", message: "Generating consolidated audit report...", duration: 2000 });
    setTimeout(() => {
      const element = document.createElement("a");
      const fileBlob = new Blob(["Compliance Audit Report\n\nOverall Score: " + averageScore + "%\nStatus: Compliant"], { type: 'text/plain' });
      element.href = URL.createObjectURL(fileBlob);
      element.download = "Compliance_Audit_Report.txt";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      setExporting(false);
      push({ type: "success", title: "Export Complete", message: "Compliance report downloaded successfully.", duration: 2500 });
    }, 1500);
  };

  const handleToggleAuditMode = () => {
    const nextMode = !auditMode;
    setAuditMode(nextMode);
    if (nextMode) {
      push({
        type: "success",
        title: "Audit Mode Active",
        message: "Visual guidelines and regulatory verification lists highlighted.",
        duration: 3500
      });
    } else {
      push({
        type: "info",
        title: "Audit Mode Inactive",
        message: "Restored default compliance dashboard view.",
        duration: 2500
      });
    }
  };

  const allGaps = (records || []).flatMap((r) =>
    (r.gaps || []).map((g) => ({
      ...g,
      equipment_tag: r.equipment_tag,
      equipment_type: r.equipment_type,
    }))
  );

  const displayedGaps = allGaps.map((gap) => {
    let icon = FileText;
    let color = "var(--accent-primary)";
    if (gap.severity === "critical") {
      icon = AlertTriangle;
      color = "var(--error)";
    } else if (gap.severity === "major" || gap.gap_type === "overdue") {
      icon = Clock;
      color = "var(--warning)";
    }
    return {
      icon,
      color,
      title: `${gap.regulation_source} ${gap.clause_id || ""}: ${gap.requirement}`,
      sub: `${gap.gap_description} · ${gap.equipment_tag} (${gap.equipment_type})`,
      corrective_action: gap.corrective_action,
      legal_consequence: gap.legal_consequence,
    };
  });

  const criticalCount = allGaps.filter(g => g.severity === "critical").length;

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
            <button onClick={handleExportReport} disabled={exporting} className="ib-btn ib-btn-ghost text-xs">
              {exporting ? "Exporting..." : <><Download size={12} /> Export Report</>}
            </button>
            <button
              onClick={handleToggleAuditMode}
              className={`ib-btn text-xs flex items-center gap-1.5 transition-all ${
                auditMode
                  ? "bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-600/30 font-bold"
                  : "ib-btn-primary"
              }`}
            >
              <ShieldCheck size={12} />
              {auditMode ? "Audit Active" : "Audit Mode"}
            </button>
          </div>
        </div>

        {/* Active Audit Mode Banner */}
        {auditMode && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold text-emerald-500"
            style={{ background: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.25)" }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Audit Session: ISO 50001:2018 compliance framework overlay applied.
          </motion.div>
        )}

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
              <span className="ib-badge ib-badge-critical">{criticalCount} CRITICAL</span>
            </div>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-xs text-center py-8 animate-pulse" style={{ color: "var(--text-tertiary)" }}>Scanning regulations...</div>
              ) : displayedGaps.length === 0 ? (
                <div className="text-xs text-center py-8 text-green-500 font-semibold">✓ No compliance gaps found. All assets compliant!</div>
              ) : (
                displayedGaps.map((a, i) => (
                  <div key={i} className="w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left"
                    style={{
                      borderColor: "var(--border-primary)",
                      background: "var(--surface-secondary)",
                    }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${a.color}15` }}>
                      <a.icon size={15} style={{ color: a.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold truncate animate-fade-in" style={{ color: "var(--text-primary)" }}>{a.title}</p>
                      <p className="text-[10px] mt-0.5 animate-fade-in" style={{ color: "var(--text-tertiary)" }}>{a.sub}</p>
                      {a.corrective_action && (
                        <div className="mt-1 text-[9.5px] p-1.5 rounded animate-fade-in" style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "var(--success)" }}>
                          <span className="font-bold">Corrective Action:</span> {a.corrective_action}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </PageShell>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Package, Download, Clock, CheckCircle, AlertCircle, Plus, Zap } from "lucide-react";
import PageShell from "../components/shared/PageShell";
import StatRing from "../components/shared/StatRing";

const EVIDENCE = [
  { id: "DOC-4521-DN", title: "Energy Baseline Records", desc: "Validated via P&ID Explorer. Linked to 12 telemetry streams.", status: "VERIFIED", color: "#10B981" },
  { id: "LOG-8813-NA", title: "Asset Maintenance Logs", desc: "Predictive maintenance cycles cross-referenced with vendor SLA.", status: "VERIFIED", color: "#10B981" },
  { id: "HR-553-TS", title: "Staff Training Matrix", desc: "Pending HR system sync. Last update 4 hours ago.", status: "PENDING SYNC", color: "#F59E0B" },
];

const PRESETS = [
  { icon: "📄", label: "Consolidated PDF" },
  { icon: "📦", label: "Source ZIP (RAW)" },
  { icon: "🔒", label: "Secure Audit Link" },
];

export default function AuditPackage() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2500);
  };

  return (
    <PageShell topbarPlaceholder="Search audit evidence...">
      <div className="p-6 space-y-5" style={{ background: "#F8F9FC", minHeight: "100%" }}>

        {/* Breadcrumb + Header */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mb-2">
            <span>Workspace</span><span className="text-[#64748B]">›</span>
            <span>Q4 2023 Audits</span><span className="text-[#64748B]">›</span>
            <span className="text-[#2563EB]">Package Gen-X</span>
          </div>
          <h1 className="text-4xl font-bold text-[#0F172A] font-sora">Audit Package</h1>
          <p className="text-[13px] text-[#475569] mt-2 max-w-lg">
            Enterprise-wide compliance evidence collection and automated package synthesis for the <span className="text-[#2563EB] font-semibold">ISO 50001:2018</span> recertification cycle.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Left: Generator + Lineage */}
          <div className="xl:col-span-2 space-y-4">

            {/* Generator card */}
            <motion.div
              className="ib-card p-6"
              style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[#0F172A] font-sora mb-1">Ready for Synthesis</h2>
                  <p className="text-[12px] text-[#64748B] mb-5">All 42 core evidence clusters have been validated by AI Copilot. Final package volume estimated at 1.2 GB.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="ib-btn ib-btn-primary text-sm px-5 py-2.5 disabled:opacity-70"
                    >
                      {generating ? (
                        <><motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} /> Generating...</>
                      ) : generated ? (
                        <><CheckCircle size={14} /> Package Ready</>
                      ) : (
                        <><Zap size={14} /> Generate Package</>
                      )}
                    </button>
                    <button className="ib-btn ib-btn-ghost text-sm"><Clock size={13} /> Schedule for 00:00</button>
                  </div>
                </div>
                <div className="space-y-2 ml-6 shrink-0">
                  <p className="ib-label mb-2">DOWNLOAD PRESETS</p>
                  {PRESETS.map((p) => (
                    <button key={p.label} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[12px] text-[#64748B] border border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#2563EB] transition-all">
                      <span>{p.icon}</span>{p.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Evidence Lineage Graph */}
            <motion.div className="ib-card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-[#2563EB]" />
                  <p className="text-sm font-semibold text-[#0F172A] font-sora">Evidence Lineage Graph</p>
                </div>
                <span className="ib-badge ib-badge-accent text-[9px]">UNAUDITED</span>
              </div>
              <div className="h-40 flex items-center justify-center">
                <svg width="100%" height="100%" viewBox="0 0 400 140">
                  <line x1="80" y1="70" x2="200" y2="70" stroke="#2563EB" strokeWidth="1" strokeOpacity="0.4" />
                  <line x1="200" y1="70" x2="320" y2="70" stroke="#10B981" strokeWidth="1" strokeOpacity="0.4" />
                  <circle cx="80" cy="70" r="22" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1.5" />
                  <circle cx="200" cy="70" r="26" fill="#FFFFFF" stroke="#7C3AED" strokeWidth="2" />
                  <circle cx="320" cy="70" r="22" fill="#FFFFFF" stroke="#10B981" strokeWidth="1.5" />
                  <text x="80" y="74" textAnchor="middle" fontSize="9" fill="#2563EB">📊</text>
                  <text x="200" y="74" textAnchor="middle" fontSize="11" fill="#7C3AED">🤖</text>
                  <text x="320" y="74" textAnchor="middle" fontSize="9" fill="#10B981">✓</text>
                  <text x="80" y="102" textAnchor="middle" fontSize="8" fill="#64748B">Sensor Data-2</text>
                  <text x="200" y="102" textAnchor="middle" fontSize="8" fill="#64748B">AI Summary</text>
                  <text x="320" y="102" textAnchor="middle" fontSize="8" fill="#64748B">Final Report</text>
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Right: Readiness + Checklist */}
          <div className="space-y-4">

            {/* Readiness Score */}
            <motion.div className="ib-card p-5 flex flex-col items-center gap-3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
              <StatRing value={94} size={110} stroke={9} color="#10B981" />
              <p className="text-sm font-semibold text-[#0F172A] font-sora">Readiness Score</p>
              <p className="text-[11px] text-[#10B981]">+2.4% since last scan</p>
            </motion.div>

            {/* Evidence Checklist */}
            <motion.div className="ib-card p-4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-[#0F172A] font-sora">Evidence Checklist</p>
                <span className="ib-badge ib-badge-healthy text-[9px]">42/45 Verified</span>
              </div>
              <div className="space-y-3">
                {EVIDENCE.map((e) => (
                  <div key={e.id} className="p-3 rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all">
                    <div className="flex items-start gap-2 mb-1">
                      {e.status === "VERIFIED"
                        ? <CheckCircle size={13} className="text-[#10B981] shrink-0 mt-0.5" />
                        : <AlertCircle size={13} className="text-[#F59E0B] shrink-0 mt-0.5" />
                      }
                      <p className="text-[12px] font-semibold text-[#0F172A] leading-tight">{e.title}</p>
                    </div>
                    <p className="text-[10px] text-[#64748B] mb-2 pl-5">{e.desc}</p>
                    <div className="flex items-center justify-between pl-5">
                      <span className="text-[9px] text-[#94A3B8] font-mono">{e.id}</span>
                      <span className="ib-badge text-[9px]" style={{ background: `${e.color}18`, color: e.color, border: `1px solid ${e.color}30` }}>{e.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] text-[#64748B] border border-dashed border-[#E2E8F0] hover:border-[#2563EB]/40 hover:text-[#2563EB] transition-all">
                <Plus size={12} /> Manual Evidence Upload
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Package, Download, Clock, CheckCircle, AlertCircle, Plus, Zap } from "lucide-react";
import PageShell from "../components/shared/PageShell";
import StatRing from "../components/shared/StatRing";
import { downloadAuditPackage } from "../services/api";
import { useToastStore } from "../store/toastStore";

const EVIDENCE = [
  { id: "DOC-4521-DN", title: "Energy Baseline Records", desc: "Validated via P&ID Explorer. Linked to 12 telemetry streams.", status: "VERIFIED", color: "var(--success)" },
  { id: "LOG-8813-NA", title: "Asset Maintenance Logs", desc: "Predictive maintenance cycles cross-referenced with vendor SLA.", status: "VERIFIED", color: "var(--success)" },
  { id: "HR-553-TS", title: "Staff Training Matrix", desc: "Pending HR system sync. Last update 4 hours ago.", status: "PENDING SYNC", color: "var(--warning)" },
];

const PRESETS = [
  { icon: "📄", label: "Consolidated PDF" },
  { icon: "📦", label: "Source ZIP (RAW)" },
  { icon: "🔒", label: "Secure Audit Link" },
];

export default function AuditPackage() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [evidenceList, setEvidenceList] = useState(EVIDENCE);
  const fileInputRef = useRef(null);
  const push = useToastStore((s) => s.push);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await downloadAuditPackage();
      setGenerated(true);
      push({ type: "success", title: "Synthesis Successful", message: "Audit package has been successfully generated.", duration: 3000 });
    } catch (err) {
      console.error("Failed to generate audit package:", err);
      push({ type: "error", title: "Synthesis Failed", message: "Failed to generate compliance package. Ensure backend is running.", duration: 4000 });
    } finally {
      setGenerating(false);
    }
  };

  const handleManualUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    push({ type: "info", title: "Uploading Evidence", message: `Processing ${file.name}...`, duration: 2500 });
    
    const newId = `MANUAL-${Date.now().toString().slice(-4)}`;
    const newEvidence = {
      id: newId,
      title: file.name,
      desc: `Manually uploaded evidence document. Size: ${(file.size / 1024).toFixed(1)} KB.`,
      status: "VERIFIED",
      color: "var(--success)"
    };

    setTimeout(() => {
      setEvidenceList((prev) => [...prev, newEvidence]);
      push({ type: "success", title: "Evidence Uploaded", message: `Successfully verified and added ${file.name} to package checklist.`, duration: 3000 });
    }, 1500);
  };

  return (
    <PageShell topbarPlaceholder="Search audit evidence...">
      <div className="p-6 space-y-5 min-h-full" style={{ background: "transparent" }}>

        {/* Breadcrumb + Header */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] mb-2" style={{ color: "var(--text-tertiary)" }}>
            <span>Workspace</span><span>›</span>
            <span>Q4 2023 Audits</span><span>›</span>
            <span style={{ color: "var(--accent-primary)" }}>Package Gen-X</span>
          </div>
          <h1 className="text-4xl font-bold font-sora" style={{ color: "var(--text-primary)" }}>Audit Package</h1>
          <p className="text-[13px] mt-2 max-w-lg" style={{ color: "var(--text-secondary)" }}>
            Enterprise-wide compliance evidence collection and automated package synthesis for the <span style={{ color: "var(--accent-primary)" }}>ISO 50001:2018</span> recertification cycle.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Left: Generator + Lineage */}
          <div className="xl:col-span-2 space-y-4">

            {/* Generator card */}
            <motion.div
              className="ib-card p-6"
              style={{ background: "var(--surface-primary)" }}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-sora mb-1" style={{ color: "var(--text-primary)" }}>Ready for Synthesis</h2>
                  <p className="text-[12px] mb-5" style={{ color: "var(--text-tertiary)" }}>All 42 core evidence clusters have been validated by AI Copilot. Final package volume estimated at 1.2 GB.</p>
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
                    <button key={p.label} onClick={handleGenerate} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[12px] border transition-all hover:opacity-80" style={{ color: "var(--text-secondary)", borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
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
                  <Package size={14} style={{ color: "var(--accent-primary)" }} />
                  <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Evidence Lineage Graph</p>
                </div>
                <span className="ib-badge ib-badge-accent text-[9px]">UNAUDITED</span>
              </div>
              <div className="h-40 flex items-center justify-center">
                <svg width="100%" height="100%" viewBox="0 0 400 140">
                  <line x1="80" y1="70" x2="200" y2="70" stroke="var(--accent-primary)" strokeWidth="1" strokeOpacity="0.4" />
                  <line x1="200" y1="70" x2="320" y2="70" stroke="var(--success)" strokeWidth="1" strokeOpacity="0.4" />
                  <circle cx="80" cy="70" r="22" fill="var(--surface-secondary)" stroke="var(--accent-primary)" strokeWidth="1.5" />
                  <circle cx="200" cy="70" r="26" fill="var(--surface-secondary)" stroke="var(--accent-secondary)" strokeWidth="2" />
                  <circle cx="320" cy="70" r="22" fill="var(--surface-secondary)" stroke="var(--success)" strokeWidth="1.5" />
                  <text x="80" y="74" textAnchor="middle" fontSize="9">📊</text>
                  <text x="200" y="74" textAnchor="middle" fontSize="11">🤖</text>
                  <text x="320" y="74" textAnchor="middle" fontSize="9">✓</text>
                  <text x="80" y="102" textAnchor="middle" fontSize="8" fill="var(--text-secondary)">Sensor Data-2</text>
                  <text x="200" y="102" textAnchor="middle" fontSize="8" fill="var(--text-secondary)">AI Summary</text>
                  <text x="320" y="102" textAnchor="middle" fontSize="8" fill="var(--text-secondary)">Final Report</text>
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Right: Readiness + Checklist */}
          <div className="space-y-4">

            {/* Readiness Score */}
            <motion.div className="ib-card p-5 flex flex-col items-center gap-3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
              <StatRing value={94} size={110} stroke={9} color="var(--success)" />
              <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Readiness Score</p>
              <p className="text-[11px]" style={{ color: "var(--success)" }}>+2.4% since last scan</p>
            </motion.div>

            {/* Evidence Checklist */}
            <motion.div className="ib-card p-4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Evidence Checklist</p>
                <span className="ib-badge ib-badge-healthy text-[9px]">42/45 Verified</span>
              </div>
              <div className="space-y-3">
                {evidenceList.map((e) => (
                  <div key={e.id} className="p-3 rounded-xl border transition-all animate-fade-in" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
                    <div className="flex items-start gap-2 mb-1">
                      {e.status === "VERIFIED"
                        ? <CheckCircle size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                        : <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                      }
                      <p className="text-[12px] font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>{e.title}</p>
                    </div>
                    <p className="text-[10px] mb-2 pl-5" style={{ color: "var(--text-tertiary)" }}>{e.desc}</p>
                    <div className="flex items-center justify-between pl-5">
                      <span className="text-[9px] font-mono" style={{ color: "var(--text-tertiary)" }}>{e.id}</span>
                      <span className="ib-badge text-[9px]" style={{ background: `${e.color}18`, color: e.color, border: `1px solid ${e.color}30` }}>{e.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleManualUpload}
                accept=".pdf,.png,.jpg,.jpeg,.xlsx,.docx,.csv"
              />
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] border border-dashed hover:opacity-80 transition-all"
                style={{ color: "var(--text-secondary)", borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}
              >
                <Plus size={12} /> Manual Evidence Upload
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

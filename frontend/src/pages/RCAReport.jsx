import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Download, Award, ChevronRight, Clock, Share2, ShieldCheck, X } from "lucide-react";
import PageShell from "../components/shared/PageShell";
import { useToastStore } from "../store/toastStore";

const CHAIN = [
  { step: "01", type: "INITIAL DEVIATION", title: "Vibration Spike", desc: "Subtle 3.2mm/s vibration detected in inboard bearing at 02:14:05.", color: "var(--accent-primary)" },
  { step: "02", type: "COMPOUNDING", title: "Seal Degradation", desc: "Vibration caused mechanical seal micro-fractures, leading to lubricant leakage.", color: "var(--warning)" },
  { step: "03", type: "CRITICAL FAILURE", title: "Bearing Seizure", desc: "Loss of lubrication led to friction-induced thermal expansion and shaft seizure.", color: "var(--error)" },
];

const EVENTS = [
  { time: "02:14 AM", title: "First Vibration Alert", desc: "Sensor VIB-402 triggered High Warning threshold.", color: "var(--accent-primary)" },
  { time: "02:31 AM", title: "Seal Pressure Drop", desc: "Seal chamber pressure fell below 2.1 bar minimum.", color: "var(--warning)" },
  { time: "03:08 AM", title: "Temperature Spike", desc: "Bearing housing reached 142°C — critical threshold exceeded.", color: "var(--error)" },
  { time: "03:22 AM", title: "Full Seizure", desc: "Motor tripped on overcurrent. Emergency shutdown initiated.", color: "var(--error)" },
];

const SIMILAR = [
  { id: "#RCA-2023-012", title: "Shaft Alignment Error – Block 2", match: "92%", status: "RESOLVED", color: "var(--success)" },
  { id: "#RCA-2022-044", title: "Bearing Fatigue – Pump A3", match: "78%", status: "RESOLVED", color: "var(--success)" },
];

export default function RCAReport() {
  const push = useToastStore((s) => s.push);
  const [exporting, setExporting] = useState(false);
  const [isCertified, setIsCertified] = useState(false);
  const [showCertifyModal, setShowCertifyModal] = useState(false);

  const handleExportPDF = () => {
    setExporting(true);
    push({ type: "info", title: "PDF Export Initiated", message: "Compiling telemetry traces and logic chain...", duration: 2500 });
    
    setTimeout(() => {
      const element = document.createElement("a");
      const fileBlob = new Blob(["RCA-2024-0892 ROOT CAUSE ANALYSIS REPORT\n\nResult: Seal Misalignment.\nConfidence: 98.4%"], { type: 'text/plain' });
      element.href = URL.createObjectURL(fileBlob);
      element.download = "RCA-2024-0892_Root_Cause_Analysis.pdf";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      setExporting(false);
      push({ type: "success", title: "PDF Export Complete", message: "Report successfully saved to downloads.", duration: 3000 });
    }, 2000);
  };

  const handleCertifyReport = () => {
    setIsCertified(true);
    setShowCertifyModal(false);
    push({ type: "success", title: "Report Certified", message: "RCA-2024-0892 has been stamped as verified in the plant ledger.", duration: 3500 });
  };

  return (
    <PageShell topbarPlaceholder="Search analysis reports, P&IDs, or telemetry logs...">
      <div className="p-6 space-y-5 min-h-full" style={{ background: "transparent" }}>

        {/* Breadcrumb + Header */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] mb-2" style={{ color: "var(--text-tertiary)" }}>
            <span>Reports</span><ChevronRight size={10} /><span style={{ color: "var(--accent-primary)" }}>Root Cause Analysis</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-lg font-bold font-sora flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  RCA-2024-0892: Centrifugal Pump Thermal Runaway
                  {isCertified && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--success)" }}>
                      <ShieldCheck size={11} /> CERTIFIED
                    </span>
                  )}
                </h1>
                <Share2 size={14} style={{ color: "var(--text-tertiary)" }} className="cursor-pointer hover:opacity-80" />
              </div>
              <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>Investigation into the failure of Unit P-102A at South Refinery Block 4. Last updated: 2 hours ago by AI Copilot.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={handleExportPDF} disabled={exporting} className="ib-btn ib-btn-ghost text-xs">
                {exporting ? "Exporting..." : <><Download size={12} /> Export PDF</>}
              </button>
              <button onClick={() => setShowCertifyModal(true)} disabled={isCertified} className="ib-btn ib-btn-primary text-xs">
                <Award size={12} /> {isCertified ? "Certified" : "Certify Report"}
              </button>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Left: Failure Chain + Events */}
          <div className="xl:col-span-2 space-y-4">

            {/* Logic Failure Chain */}
            <motion.div className="ib-card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GitBranch size={14} style={{ color: "var(--accent-primary)" }} />
                  <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Logic Failure Chain</p>
                </div>
              </div>
              <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
                {CHAIN.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 shrink-0">
                    <div className="ib-card p-4 w-48" style={{ borderColor: `${c.color}30`, background: `${c.color}06` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold" style={{ color: c.color }}>{c.step}</span>
                        <span className="ib-label" style={{ color: c.color }}>{c.type}</span>
                      </div>
                      <p className="text-[13px] font-bold font-sora mb-1" style={{ color: "var(--text-primary)" }}>{c.title}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{c.desc}</p>
                    </div>
                    {i < CHAIN.length - 1 && (
                      <ChevronRight size={16} style={{ color: "var(--border-primary)" }} className="shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Sequence of Events */}
            <motion.div className="ib-card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={14} style={{ color: "var(--accent-primary)" }} />
                <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Sequence of Events</p>
              </div>
              <div className="space-y-4 relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: "var(--border-primary)" }} />
                {EVENTS.map((e, i) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 z-10" style={{ background: e.color, boxShadow: `0 0 8px ${e.color}60` }} />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-bold font-mono" style={{ color: "var(--text-primary)" }}>{e.time}</span>
                        <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>{e.title}</span>
                      </div>
                      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{e.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Similar Incidents */}
            <motion.div className="ib-card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <p className="text-sm font-semibold font-sora mb-4" style={{ color: "var(--text-primary)" }}>Similar Incidents</p>
              <div className="space-y-2">
                {SIMILAR.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border transition-all" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-mono" style={{ color: "var(--text-tertiary)" }}>{s.id}</span>
                        <span className="ib-badge ib-badge-healthy text-[9px]">{s.status}</span>
                      </div>
                      <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>{s.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Identical failure profile</p>
                      <p className="text-[13px] font-bold" style={{ color: "var(--success)" }}>{s.match}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: AI Analysis */}
          <div className="space-y-4">
            <motion.div className="ib-card p-5" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="ib-badge ib-badge-accent text-[9px]">AI ANALYSIS VERIFIED</span>
              </div>
              <p className="text-4xl font-bold font-sora mt-3" style={{ color: "var(--text-primary)" }}>98.4%</p>
              <p className="text-[11px] mb-4" style={{ color: "var(--text-tertiary)" }}>CONFIDENCE SCORE</p>

              <p className="text-[13px] font-bold font-sora mb-2" style={{ color: "var(--text-primary)" }}>Root Cause: Seal Misalignment</p>
              <p className="text-[12px] leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                The primary driver was determined to be a <span className="font-semibold" style={{ color: "var(--text-primary)" }}>0.4mm radial misalignment</span> introduced during the maintenance window on Oct 12. This caused cyclic fatigue in the mechanical seal components.
              </p>

              <div className="space-y-3 border-t pt-4" style={{ borderColor: "var(--border-primary)" }}>
                <div className="flex justify-between text-[12px]">
                  <span style={{ color: "var(--text-tertiary)" }}>Evidence Points</span>
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>24 Sensor Traces</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span style={{ color: "var(--text-tertiary)" }}>Anomaly Match</span>
                  <span className="font-semibold text-amber-500">High (9.2/10)</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Certify Modal */}
      <AnimatePresence>
        {showCertifyModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCertifyModal(false)}
            />
            <motion.div
              className="ib-card p-6 w-full max-w-sm relative z-10 overflow-hidden shadow-2xl"
              style={{ background: "var(--surface-primary)", borderColor: "var(--border-primary)" }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold font-sora" style={{ color: "var(--text-primary)" }}>Certify RCA Report</h3>
                <button onClick={() => setShowCertifyModal(false)} className="p-1 rounded-lg hover:bg-[var(--surface-secondary)]" style={{ color: "var(--text-secondary)" }}>
                  <X size={15} />
                </button>
              </div>
              <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                By certifying this Root Cause Analysis, you stamp it as reviewed, verified, and ready to be locked in the compliance logbook. This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCertifyModal(false)} className="ib-btn ib-btn-ghost text-xs">Cancel</button>
                <button onClick={handleCertifyReport} className="ib-btn ib-btn-primary text-xs flex items-center gap-1">
                  <ShieldCheck size={12} /> Confirm Certification
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

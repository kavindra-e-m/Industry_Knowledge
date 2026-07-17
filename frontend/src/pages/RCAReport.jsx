import { motion } from "framer-motion";
import { GitBranch, Download, Award, ChevronRight, Clock, Share2 } from "lucide-react";
import PageShell from "../components/shared/PageShell";

const CHAIN = [
  { step: "01", type: "INITIAL DEVIATION", title: "Vibration Spike", desc: "Subtle 3.2mm/s vibration detected in inboard bearing at 02:14:05.", color: "#4F9DFF" },
  { step: "02", type: "COMPOUNDING", title: "Seal Degradation", desc: "Vibration caused mechanical seal micro-fractures, leading to lubricant leakage.", color: "#FBBF24" },
  { step: "03", type: "CRITICAL FAILURE", title: "Bearing Seizure", desc: "Loss of lubrication led to friction-induced thermal expansion and shaft seizure.", color: "#FF5C5C" },
];

const EVENTS = [
  { time: "02:14 AM", title: "First Vibration Alert", desc: "Sensor VIB-402 triggered High Warning threshold.", color: "#4F9DFF" },
  { time: "02:31 AM", title: "Seal Pressure Drop", desc: "Seal chamber pressure fell below 2.1 bar minimum.", color: "#FBBF24" },
  { time: "03:08 AM", title: "Temperature Spike", desc: "Bearing housing reached 142°C — critical threshold exceeded.", color: "#FF5C5C" },
  { time: "03:22 AM", title: "Full Seizure", desc: "Motor tripped on overcurrent. Emergency shutdown initiated.", color: "#FF5C5C" },
];

const SIMILAR = [
  { id: "#RCA-2023-012", title: "Shaft Alignment Error – Block 2", match: "92%", status: "RESOLVED", color: "#34D399" },
  { id: "#RCA-2022-044", title: "Bearing Fatigue – Pump A3", match: "78%", status: "RESOLVED", color: "#34D399" },
];

export default function RCAReport() {
  return (
    <PageShell topbarPlaceholder="Search analysis reports, P&IDs, or telemetry logs...">
      <div className="p-6 space-y-5" style={{ background: "#07111F", minHeight: "100%" }}>

        {/* Breadcrumb + Header */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#4A6080] mb-2">
            <span>Reports</span><ChevronRight size={10} /><span className="text-[#4F9DFF]">Root Cause Analysis</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-white font-sora">RCA-2024-0892: Centrifugal Pump Thermal Runaway</h1>
                <Share2 size={14} className="text-[#4A6080] cursor-pointer hover:text-[#8BA3C7]" />
              </div>
              <p className="text-[12px] text-[#4A6080]">Investigation into the failure of Unit P-102A at South Refinery Block 4. Last updated: 2 hours ago by AI Copilot.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="ib-btn ib-btn-ghost text-xs"><Download size={12} /> Export PDF</button>
              <button className="ib-btn ib-btn-primary text-xs"><Award size={12} /> Certify Report</button>
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
                  <GitBranch size={14} className="text-[#4F9DFF]" />
                  <p className="text-sm font-semibold text-white font-sora">Logic Failure Chain</p>
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
                      <p className="text-[13px] font-bold text-white font-sora mb-1">{c.title}</p>
                      <p className="text-[11px] text-[#4A6080] leading-relaxed">{c.desc}</p>
                    </div>
                    {i < CHAIN.length - 1 && (
                      <ChevronRight size={16} className="text-[#1E3A5F] shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Sequence of Events */}
            <motion.div className="ib-card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={14} className="text-[#4F9DFF]" />
                <p className="text-sm font-semibold text-white font-sora">Sequence of Events</p>
              </div>
              <div className="space-y-4 relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#1E3A5F]" />
                {EVENTS.map((e, i) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 z-10" style={{ background: e.color, boxShadow: `0 0 8px ${e.color}60` }} />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-bold text-white font-mono">{e.time}</span>
                        <span className="text-[12px] font-semibold text-white">{e.title}</span>
                      </div>
                      <p className="text-[11px] text-[#4A6080]">{e.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Similar Incidents */}
            <motion.div className="ib-card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <p className="text-sm font-semibold text-white font-sora mb-4">Similar Incidents</p>
              <div className="space-y-2">
                {SIMILAR.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#1E3A5F] hover:border-[#2a4a6b] transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-mono text-[#4A6080]">{s.id}</span>
                        <span className="ib-badge ib-badge-healthy text-[9px]">{s.status}</span>
                      </div>
                      <p className="text-[12px] font-semibold text-white">{s.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-[#4A6080]">Identical failure profile</p>
                      <p className="text-[13px] font-bold text-[#34D399]">{s.match}</p>
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
              <p className="text-4xl font-bold text-white font-sora mt-3">98.4%</p>
              <p className="text-[11px] text-[#4A6080] mb-4">CONFIDENCE SCORE</p>

              <p className="text-[13px] font-bold text-white font-sora mb-2">Root Cause: Seal Misalignment</p>
              <p className="text-[12px] text-[#8BA3C7] leading-relaxed mb-4">
                The primary driver was determined to be a <span className="text-white font-semibold">0.4mm radial misalignment</span> introduced during the maintenance window on Oct 12. This caused cyclic fatigue in the mechanical seal components.
              </p>

              <div className="space-y-3 border-t border-[#1E3A5F] pt-4">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#4A6080]">Evidence Points</span>
                  <span className="text-white font-semibold">24 Sensor Traces</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#4A6080]">Anomaly Match</span>
                  <span className="font-semibold text-[#FBBF24]">High (9.2/10)</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

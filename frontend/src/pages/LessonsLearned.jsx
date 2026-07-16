import { motion } from "framer-motion";
import { BookOpen, Download, Calendar, AlertTriangle, TrendingUp, Zap, ExternalLink } from "lucide-react";
import PageShell from "../components/shared/PageShell";

const INCIDENTS = [
  {
    date: "OCT 14, 2023 · 04:22 AM", title: "Turbine Seal Failure – Plant Delta",
    desc: "Loss of hydraulic pressure led to a catastrophic seal failure in turbine assembly B-4. RCA indicates a recurring thermal fatigue pattern overlooked in manual inspections.",
    tags: ["#ThermalFatigue", "#Turbine04", "#SealIntegrity"],
    color: "#FF5C5C",
  },
  {
    date: "AUG 29, 2023 · 11:15 AM", title: "Substation 9 Grid Oscillation",
    desc: "Harmonic resonance detected in local grid distribution. Corrected via reactive power injection. Lessons learned: update control algorithms for solar-load fluctuation compensation.",
    tags: ["#GridStability", "#Harmonics"],
    color: "#FBBF24",
  },
  {
    date: "JULY 12, 2023 · 09:00 PM", title: "Annual Safety Optimization Protocol",
    desc: "Comprehensive review of LOTO procedures across the refinery. AI-assisted update of 400+ safety documents completed with 99.8% accuracy.",
    tags: ["#Compliance", "#Optimization"],
    color: "#34D399",
  },
];

const PATTERNS = [
  { label: "Recurrent Bearing Friction", match: 92, color: "#FF5C5C", sub: "Similar to the 2021 Houston facility outage" },
  { label: "Sensor Signal Drift", match: 64, color: "#FBBF24", sub: "" },
];

const AI_WARNINGS = [
  { tag: "PREVENTIVE ACTION", color: "#34D399", text: "Analysis of 'Lessons Learned #402' suggests early shut-down of Line 4 to avoid pump cavitation." },
  { tag: "PATTERN MATCH", color: "#FBBF24", text: "Bearing friction pattern matches 3 prior incidents. Inspection recommended within 48h." },
];

export default function LessonsLearned() {
  return (
    <PageShell topbarPlaceholder="Search knowledge base...">
      <div className="p-6 space-y-5" style={{ background: "#07111F", minHeight: "100%" }}>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white font-sora">Lessons Learned</h1>
            <p className="text-[13px] text-[#4A6080] mt-2 max-w-lg">
              Transforming historical operational data into actionable industrial intelligence. Predictive insights derived from decades of telemetry and <span className="text-[#4F9DFF]">human reporting</span>.
            </p>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="ib-btn ib-btn-primary text-xs"><Download size={12} /> Export Audit Package</button>
            <button className="ib-btn ib-btn-ghost text-xs"><Calendar size={12} /> Time Range</button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Left: Incident Timeline */}
          <div className="xl:col-span-2">
            <div className="ib-card p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-[#4F9DFF]" />
                  <p className="text-sm font-semibold text-white font-sora">Historical Incidents</p>
                </div>
                <div className="flex gap-2">
                  <span className="ib-badge ib-badge-critical">4 Critical</span>
                  <span className="ib-badge ib-badge-healthy">12 Resolved</span>
                </div>
              </div>

              <div className="space-y-4 relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#1E3A5F]" />
                {INCIDENTS.map((inc, i) => (
                  <motion.div
                    key={i}
                    className="flex gap-4 relative"
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full shrink-0 mt-1 z-10" style={{ background: inc.color, boxShadow: `0 0 8px ${inc.color}60` }} />
                    <div className="flex-1 p-4 rounded-xl border border-[#1E3A5F] hover:border-[#2a4a6b] transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-[10px] text-[#4A6080] mb-1">{inc.date}</p>
                          <p className="text-[14px] font-bold text-white font-sora">{inc.title}</p>
                        </div>
                        <ExternalLink size={13} className="text-[#4A6080] hover:text-[#8BA3C7] cursor-pointer shrink-0 mt-1" />
                      </div>
                      <p className="text-[12px] text-[#8BA3C7] leading-relaxed mb-3">{inc.desc}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {inc.tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#4A6080] border border-[#1E3A5F] hover:text-[#8BA3C7] cursor-pointer transition-colors">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Pattern Detection + Knowledge Cliff + AI Feed */}
          <div className="space-y-4">

            {/* Pattern Detection */}
            <motion.div className="ib-card p-4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} className="text-[#7C5CFC]" />
                <p className="text-sm font-semibold text-white font-sora">Pattern Detection</p>
              </div>
              <div className="space-y-4">
                {PATTERNS.map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[12px] mb-1.5">
                      <span className="text-white font-semibold">{p.label}</span>
                      <span className="font-bold" style={{ color: p.color }}>{p.match}% Match</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1E3A5F] overflow-hidden mb-1">
                      <motion.div className="h-full rounded-full" style={{ background: p.color }}
                        initial={{ width: 0 }} animate={{ width: `${p.match}%` }} transition={{ duration: 1, delay: i * 0.2 }} />
                    </div>
                    {p.sub && <p className="text-[10px] text-[#4A6080]">{p.sub}</p>}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Knowledge Cliff */}
            <motion.div
              className="ib-card p-4"
              style={{ borderColor: "rgba(255,92,92,0.3)", background: "rgba(255,92,92,0.04)" }}
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-[#FF5C5C]" />
                <p className="text-sm font-semibold text-white font-sora">Knowledge Cliff</p>
              </div>
              <p className="text-[11px] text-[#FF5C5C] font-semibold mb-2">Critical Alert:</p>
              <p className="text-[12px] text-[#8BA3C7] leading-relaxed mb-3">
                Senior Maintenance Engineer (D. Marcus) is retiring in 45 days. Only 30% of his troubleshooting procedures for the legacy Siemens PLC-7 unit have been captured by AI.
              </p>
              <div className="mb-3">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-[#4A6080]">Knowledge Capture Status</span>
                  <span className="text-[#FF5C5C] font-bold">30%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#1E3A5F] overflow-hidden">
                  <motion.div className="h-full rounded-full bg-[#FF5C5C]"
                    initial={{ width: 0 }} animate={{ width: "30%" }} transition={{ duration: 1 }} />
                </div>
              </div>
              <button className="w-full py-2 rounded-xl text-[11px] font-semibold text-[#FF5C5C] border border-[#FF5C5C]/30 hover:bg-[#FF5C5C]/8 transition-all">
                Initiate Interview Protocol
              </button>
            </motion.div>

            {/* AI Warning Feed */}
            <motion.div className="ib-card p-4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-[#7C5CFC]" />
                  <p className="text-sm font-semibold text-white font-sora">AI Warning Feed</p>
                </div>
                <span className="ib-badge ib-badge-healthy text-[9px]">REAL-TIME</span>
              </div>
              <div className="space-y-3">
                {AI_WARNINGS.map((w, i) => (
                  <div key={i} className="p-3 rounded-xl border border-[#1E3A5F]">
                    <span className="ib-badge text-[9px] mb-2 inline-block" style={{ background: `${w.color}18`, color: w.color, border: `1px solid ${w.color}30` }}>
                      {w.tag}
                    </span>
                    <p className="text-[11px] text-[#8BA3C7] leading-relaxed">{w.text}</p>
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

import { motion } from "framer-motion";
import { BookOpen, Download, Calendar, AlertTriangle, TrendingUp, Zap, ExternalLink } from "lucide-react";
import PageShell from "../components/shared/PageShell";

const INCIDENTS = [
  {
    date: "OCT 14, 2023 · 04:22 AM", title: "Turbine Seal Failure – Plant Delta",
    desc: "Loss of hydraulic pressure led to a catastrophic seal failure in turbine assembly B-4. RCA indicates a recurring thermal fatigue pattern overlooked in manual inspections.",
    tags: ["#ThermalFatigue", "#Turbine04", "#SealIntegrity"],
    color: "var(--error)",
  },
  {
    date: "AUG 29, 2023 · 11:15 AM", title: "Substation 9 Grid Oscillation",
    desc: "Harmonic resonance detected in local grid distribution. Corrected via reactive power injection. Lessons learned: update control algorithms for solar-load fluctuation compensation.",
    tags: ["#GridStability", "#Harmonics"],
    color: "var(--warning)",
  },
  {
    date: "JULY 12, 2023 · 09:00 PM", title: "Annual Safety Optimization Protocol",
    desc: "Comprehensive review of LOTO procedures across the refinery. AI-assisted update of 400+ safety documents completed with 99.8% accuracy.",
    tags: ["#Compliance", "#Optimization"],
    color: "var(--success)",
  },
];

const PATTERNS = [
  { label: "Recurrent Bearing Friction", match: 92, color: "var(--error)", sub: "Similar to the 2021 Houston facility outage" },
  { label: "Sensor Signal Drift", match: 64, color: "var(--warning)", sub: "" },
];

const AI_WARNINGS = [
  { tag: "PREVENTIVE ACTION", color: "var(--success)", text: "Analysis of 'Lessons Learned #402' suggests early shut-down of Line 4 to avoid pump cavitation." },
  { tag: "PATTERN MATCH", color: "var(--warning)", text: "Bearing friction pattern matches 3 prior incidents. Inspection recommended within 48h." },
];

export default function LessonsLearned() {
  return (
    <PageShell topbarPlaceholder="Search knowledge base...">
      <div className="p-6 space-y-5 min-h-full" style={{ background: "transparent" }}>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold font-sora" style={{ color: "var(--text-primary)" }}>Lessons Learned</h1>
            <p className="text-[13px] mt-2 max-w-lg" style={{ color: "var(--text-secondary)" }}>
              Transforming historical operational data into actionable industrial intelligence. Predictive insights derived from decades of telemetry and <span style={{ color: "var(--accent-primary)" }}>human reporting</span>.
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
                  <BookOpen size={14} style={{ color: "var(--accent-primary)" }} />
                  <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Historical Incidents</p>
                </div>
                <div className="flex gap-2">
                  <span className="ib-badge ib-badge-critical">4 Critical</span>
                  <span className="ib-badge ib-badge-healthy">12 Resolved</span>
                </div>
              </div>

              <div className="space-y-4 relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: "var(--border-primary)" }} />
                {INCIDENTS.map((inc, i) => (
                  <motion.div
                    key={i}
                    className="flex gap-4 relative"
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full shrink-0 mt-1 z-10" style={{ background: inc.color, boxShadow: `0 0 8px ${inc.color}60` }} />
                    <div className="flex-1 p-4 rounded-xl border transition-all" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-[10px] mb-1" style={{ color: "var(--text-tertiary)" }}>{inc.date}</p>
                          <p className="text-[14px] font-bold font-sora" style={{ color: "var(--text-primary)" }}>{inc.title}</p>
                        </div>
                        <ExternalLink size={13} style={{ color: "var(--text-tertiary)" }} className="hover:opacity-85 cursor-pointer shrink-0 mt-1" />
                      </div>
                      <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>{inc.desc}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {inc.tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors cursor-pointer"
                            style={{ color: "var(--text-tertiary)", borderColor: "var(--border-primary)" }}>
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
                <TrendingUp size={14} style={{ color: "var(--accent-secondary)" }} />
                <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Pattern Detection</p>
              </div>
              <div className="space-y-4">
                {PATTERNS.map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[12px] mb-1.5">
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{p.label}</span>
                      <span className="font-bold" style={{ color: p.color }}>{p.match}% Match</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "var(--surface-secondary)" }}>
                      <motion.div className="h-full rounded-full" style={{ background: p.color }}
                         initial={{ width: 0 }} animate={{ width: `${p.match}%` }} transition={{ duration: 1, delay: i * 0.2 }} />
                    </div>
                    {p.sub && <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{p.sub}</p>}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Knowledge Cliff */}
            <motion.div
              className="ib-card p-4 animate-glow"
              style={{ borderColor: "rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.04)" }}
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-red-500" />
                <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Knowledge Cliff</p>
              </div>
              <p className="text-[11px] font-semibold mb-2 text-red-500">Critical Alert:</p>
              <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
                Senior Maintenance Engineer (D. Marcus) is retiring in 45 days. Only 30% of his troubleshooting procedures for the legacy Siemens PLC-7 unit have been captured by AI.
              </p>
              <div className="mb-3">
                <div className="flex justify-between text-[11px] mb-1">
                  <span style={{ color: "var(--text-tertiary)" }}>Knowledge Capture Status</span>
                  <span className="font-bold text-red-500">30%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-secondary)" }}>
                  <motion.div className="h-full rounded-full bg-red-500"
                    initial={{ width: 0 }} animate={{ width: "30%" }} transition={{ duration: 1 }} />
                </div>
              </div>
              <button className="w-full py-2 rounded-xl text-[11px] font-semibold text-red-500 border border-red-500/30 hover:bg-red-500/8 transition-all">
                Initiate Interview Protocol
              </button>
            </motion.div>

            {/* AI Warning Feed */}
            <motion.div className="ib-card p-4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap size={14} style={{ color: "var(--accent-secondary)" }} />
                  <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>AI Warning Feed</p>
                </div>
                <span className="ib-badge ib-badge-healthy text-[9px]">REAL-TIME</span>
              </div>
              <div className="space-y-3">
                {AI_WARNINGS.map((w, i) => (
                  <div key={i} className="p-3 rounded-xl border" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
                    <span className="ib-badge text-[9px] mb-2 inline-block" style={{ background: `${w.color}18`, color: w.color, border: `1px solid ${w.color}30` }}>
                      {w.tag}
                    </span>
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{w.text}</p>
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

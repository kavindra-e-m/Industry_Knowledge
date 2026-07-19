import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, Plus, Filter, CheckSquare, ExternalLink, TrendingUp } from "lucide-react";
import PageShell from "../components/shared/PageShell";
import StatRing from "../components/shared/StatRing";
import { useAlerts } from "../hooks/useAlerts";
import { useToastStore } from "../store/toastStore";
import { useUiStore } from "../store/uiStore";

const EQUIPMENT_CARDS = [
  { name: "Generator Unit G-7",  status: "Operational",         statusColor: "#34D399", rul: "1,248h", failProb: "4.2%",  health: 92, healthColor: "#34D399", img: "⚡" },
  { name: "Coolant Pump P-12",   status: "Maintenance Imminent", statusColor: "#FBBF24", rul: "142h",   failProb: "18.5%", health: 74, healthColor: "#FBBF24", img: "💧" },
];

const WORK_ORDERS = [
  { id: "WO-9921", title: "Calibration Fix", tag: "PREDICTED", color: "#7C5CFC", desc: "Sensor calibration drift detected in Pressure Valve V-4." },
  { id: "WO-9844", title: "Lubricant",       tag: "ROUTINE",   color: "#4F9DFF", desc: "Scheduled lubrication cycle for Conveyor Belt C-12." },
];

const HEALTH_RINGS = [
  { label: "EFFICIENCY",  sublabel: "Main Array",       value: 88, color: "#34D399" },
  { label: "COMPLIANCE",  sublabel: "Environmental",    value: 96, color: "#4F9DFF" },
  { label: "RELIABILITY", sublabel: "Secondary Aux",    value: 64, color: "#FBBF24" },
];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const fadeUp  = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } } };

export default function PredictiveMaintenance() {
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);
  const openTab = useUiStore((s) => s.openTab);
  const { alerts, loading } = useAlerts();
  const critical = alerts.filter((a) => a.severity === "critical");

  return (
    <PageShell topbarPlaceholder="Search industrial assets...">
      <div className="p-6 space-y-5" style={{ background: "transparent", minHeight: "100%" }}>

        {/* Header */}
        <motion.div
          className="flex items-start justify-between"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        >
          <div>
            <h1 className="text-4xl font-bold text-white font-sora leading-tight">Predictive<br />Maintenance</h1>
            <p className="text-[13px] text-[#4A6080] mt-2">Real-time asset telemetry & machine learning failure forecasts.</p>
          </div>
          <div className="flex gap-2 mt-2">
            <motion.button className="ib-btn ib-btn-ghost text-xs" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Filter size={12} /> Filter Site
            </motion.button>
            <motion.button className="ib-btn ib-btn-primary text-xs" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Plus size={12} /> New Observation
            </motion.button>
          </div>
        </motion.div>

        {/* Main grid */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          variants={stagger} initial="hidden" animate="show"
        >
          {/* Critical Alerts */}
          <motion.div
            variants={fadeUp}
            className="ib-card p-4 critical-pulse"
            style={{ borderColor: "rgba(255,92,92,0.35)", background: "linear-gradient(135deg, rgba(255,92,92,0.07) 0%, rgba(22,38,61,0.85) 100%)" }}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}>
                  <AlertTriangle size={14} className="text-[#FF5C5C]" />
                </motion.div>
                <p className="text-sm font-semibold text-white font-sora">Critical Alerts</p>
              </div>
              <motion.span
                className="ib-badge ib-badge-critical"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                {critical.length} ACTIVE
              </motion.span>
            </div>

            <div className="space-y-3">
              {(loading
                ? [{ equipment_id: "x", tag: "Loading...", predicted_component: "", rul_days: 0, failure_probability: 0, suggested_work_order: "", severity: "critical" }]
                : critical.slice(0, 2)
              ).map((a, i) => (
                <motion.div
                  key={a.equipment_id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className={`p-3 rounded-xl border ${i === 0 ? "border-[#FF5C5C]/30 bg-[#FF5C5C]/5" : "border-[#1E3A5F]"}`}
                >
                  {loading ? (
                    <div className="space-y-2">
                      <div className="ib-skeleton h-3 w-32 rounded" />
                      <div className="ib-skeleton h-3 w-48 rounded" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[12px] font-bold text-white">{a.tag}: {a.predicted_component}</p>
                        <span className="text-[10px] text-[#FF5C5C]">{a.rul_days}d</span>
                      </div>
                      <p className="text-[11px] text-[#8BA3C7] mb-3 leading-relaxed">{a.suggested_work_order.slice(0, 70)}...</p>
                      {i === 0 && (
                        <div className="flex gap-2">
                          <motion.button onClick={() => push({ type: "success", title: "Work Order Dispatched", message: `AI-optimized inspection order dispatched for ${a.tag}.`, duration: 3000 })} className="ib-btn ib-btn-critical text-[10px] px-3 py-1.5" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>DISPATCH</motion.button>
                          <motion.button onClick={() => navigate(`/equipment/${a.equipment_id || "pump-a1"}`)} className="ib-btn ib-btn-ghost text-[10px] px-3 py-1.5" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>DETAILS</motion.button>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              ))}
            </div>
            <button onClick={() => openTab("alerts")} className="w-full mt-3 text-[11px] text-[#2563EB] font-bold hover:underline text-center">View all alerts →</button>
          </motion.div>

          {/* Equipment Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {EQUIPMENT_CARDS.map((eq, i) => (
              <motion.div
                key={eq.name}
                variants={fadeUp}
                className="ib-card p-4"
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <motion.div
                    className="w-16 h-16 rounded-xl bg-[#1E3A5F] flex items-center justify-center text-3xl shrink-0"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {eq.img}
                  </motion.div>
                  <div>
                    <p className="text-[13px] font-bold text-white font-sora">{eq.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <motion.span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: eq.statusColor }}
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className="text-[11px]" style={{ color: eq.statusColor }}>Status: {eq.status}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="ib-card p-2.5">
                    <p className="ib-label mb-1">REMAINING USEFUL LIFE</p>
                    <p className="text-lg font-bold text-white font-sora">{eq.rul}</p>
                  </div>
                  <div className="ib-card p-2.5">
                    <p className="ib-label mb-1">FAILURE PROB.</p>
                    <p className="text-lg font-bold font-sora" style={{ color: parseFloat(eq.failProb) > 10 ? "#FBBF24" : "#34D399" }}>{eq.failProb}</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-[#4A6080]">System Health</span>
                    <span className="font-semibold" style={{ color: eq.healthColor }}>{eq.health}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1E3A5F] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: eq.healthColor, boxShadow: `0 0 8px ${eq.healthColor}60` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${eq.health}%` }}
                      transition={{ duration: 1.2, delay: 0.3 + i * 0.1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div
            className="ib-card p-4"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            whileHover={{ y: -2, transition: { duration: 0.18 } }}
          >
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={14} className="text-[#4F9DFF]" />
              <p className="text-sm font-semibold text-white font-sora">Health Trends</p>
            </div>
            <div className="flex justify-around">
              {HEALTH_RINGS.map((r) => (
                <div key={r.label} className="flex flex-col items-center gap-2">
                  <StatRing value={r.value} size={90} stroke={7} color={r.color} />
                  <p className="ib-label">{r.label}</p>
                  <p className="text-[10px] text-[#4A6080]">{r.sublabel}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="ib-card p-4"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            whileHover={{ y: -2, transition: { duration: 0.18 } }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare size={14} className="text-[#34D399]" />
                <p className="text-sm font-semibold text-white font-sora">AI Work Orders</p>
              </div>
              <span className="text-[10px] text-[#4A6080]">Last sync: 12m ago</span>
            </div>
            <div className="space-y-3">
              {WORK_ORDERS.map((wo, i) => (
                <motion.div
                  key={wo.id}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-start gap-3 p-3 rounded-xl border border-[#1E3A5F] hover:border-[#2a4a6b] transition-all cursor-pointer"
                  whileHover={{ x: 2 }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${wo.color}18` }}>
                    <CheckSquare size={13} style={{ color: wo.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[12px] font-semibold text-white">{wo.id}: {wo.title}</p>
                      <span className="ib-badge text-[9px]" style={{ background: `${wo.color}18`, color: wo.color, border: `1px solid ${wo.color}30` }}>{wo.tag}</span>
                    </div>
                    <p className="text-[11px] text-[#4A6080]">{wo.desc}</p>
                  </div>
                  <ExternalLink size={12} className="text-[#4A6080] shrink-0 mt-0.5" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </PageShell>
  );
}

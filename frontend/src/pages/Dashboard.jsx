import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Zap, Calendar, TrendingUp, Activity } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";
import PageShell from "../components/shared/PageShell";
import StatRing from "../components/shared/StatRing";
import { useAlerts } from "../hooks/useAlerts";
import { useCompliance } from "../hooks/useCompliance";
import { useCountUp } from "../hooks/useCountUp";

const BASE_TREND = [
  { t: "00:00", v: 18 }, { t: "04:00", v: 22 }, { t: "08:00", v: 35 },
  { t: "12:00", v: 28 }, { t: "16:00", v: 55 }, { t: "18:00", v: 82 },
  { t: "20:00", v: 64 }, { t: "22:00", v: 71 }, { t: "24:00", v: 58 },
];

const AI_INSIGHTS = [
  { tag: "OPTIMIZATION", time: "2m ago", color: "#2563EB", text: "Reduce Turbine-04 load by 12% to prevent thermal runaway. Reroute excess energy to Storage Block B." },
  { tag: "MAINTENANCE",  time: "15m ago", color: "#D97706", text: "Hydraulic Seal #42 reaching fatigue limit. Schedule replacement within 48 operational hours." },
  { tag: "INVENTORY",    time: "1h ago",  color: "#DC2626", text: "Critical spare part 'GE-Filter-X' out of stock. Automatic procurement request initiated." },
];

const TIMELINE = [
  { label: "Filter Replacement", sub: "Section A-12 · Done by Tech-04", status: "COMPLETED",    color: "#10B981" },
  { label: "Calibration Check",  sub: "Sensor Array 09 · AI Assisted",  status: "IN PROGRESS",  color: "#2563EB" },
  { label: "Lubrication Cycle",  sub: "Conveyor Link 04 · System Auto",  status: "SCHEDULED 2H", color: "#64748B" },
];

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ib-glass px-3 py-2 text-xs shadow-md">
      <p style={{ color: "var(--text-secondary)" }}>Predicted Peak Risk</p>
      <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{payload[0].value}%</p>
    </div>
  );
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp  = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } };

function KpiTile({ label, value, unit = "", color = "var(--accent-primary)", icon: Icon, loading }) {
  const count = useCountUp(loading ? 0 : value);
  return (
    <motion.div
      variants={fadeUp}
      className="ib-card p-4 flex flex-col gap-2"
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
    >
      <div className="flex items-center justify-between">
        <p className="ib-label">{label}</p>
        {Icon && <Icon size={14} style={{ color }} />}
      </div>
      {loading
        ? <div className="ib-skeleton h-8 w-20 rounded" />
        : <p className="text-3xl font-bold font-sora" style={{ color }}>{count}{unit}</p>
      }
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { alerts, loading: aLoading } = useAlerts();
  const { averageScore, nonCompliantCount, loading: cLoading } = useCompliance();
  const [trendRange, setTrendRange] = useState("24h");
  const [trendData, setTrendData] = useState(BASE_TREND);
  const [alertShake, setAlertShake] = useState(false);
  const prevCritical = useRef(0);

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const avgRUL = alerts.length ? Math.round(alerts.reduce((s, a) => s + a.rul_days, 0) / alerts.length) : 0;

  // Animate chart data live
  useEffect(() => {
    const t = setInterval(() => {
      setTrendData((d) => d.map((p) => ({ ...p, v: Math.max(5, Math.min(95, p.v + (Math.random() - 0.5) * 8)) })));
    }, 5000);
    return () => clearInterval(t);
  }, []);

  // Shake alert banner when new critical arrives
  useEffect(() => {
    if (criticalCount > prevCritical.current) {
      setAlertShake(true);
      setTimeout(() => setAlertShake(false), 500);
    }
    prevCritical.current = criticalCount;
  }, [criticalCount]);

  return (
    <PageShell topbarPlaceholder="Query plant data...">
      <div className="p-5 space-y-4 min-h-full" style={{ background: "transparent" }}>

        {/* Critical Alert Banner */}
        <AnimatePresence>
          {criticalCount > 0 && (
            <motion.div
              key="alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`ib-card p-4 flex items-center justify-between critical-pulse ${alertShake ? "animate-shake" : ""}`}
              style={{ borderColor: "rgba(239, 68, 68, 0.4)", background: "rgba(239, 68, 68, 0.08)" }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(239, 68, 68, 0.15)" }}
                  animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <AlertTriangle size={18} className="text-red-500" />
                </motion.div>
                <div>
                  <p className="text-sm font-semibold font-sora text-red-600 dark:text-red-400">Critical System Alert</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Turbine-04: Abnormal Thermal Deviation Detected</p>
                </div>
              </div>
              <motion.button
                className="ib-btn ib-btn-primary text-xs px-4 py-2 bg-red-600 border-red-600"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                Deploy Countermeasures
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main 2-col grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Left (2/3) */}
          <div className="xl:col-span-2 space-y-4">

            {/* Health Rings */}
            <motion.div
              className="grid grid-cols-3 gap-4"
              variants={stagger} initial="hidden" animate="show"
            >
              {[
                { label: "Overall Health Index",    sublabel: "MAIN PLANT",    value: 92, color: "#10B981" },
                { label: "Efficiency Optimization", sublabel: "PROCESS LOAD",  value: 74, color: "#2563EB" },
                { label: "Risk Mitigation",         sublabel: "SAFETY MARGIN", value: 98, color: "#7C3AED" },
              ].map((ring) => (
                <motion.div
                  key={ring.sublabel}
                  variants={fadeUp}
                  className="ib-card p-5 flex flex-col items-center gap-3"
                  whileHover={{ y: -3, transition: { duration: 0.18 } }}
                >
                  <p className="ib-label self-start">{ring.sublabel}</p>
                  <StatRing value={ring.value} size={110} stroke={9} color={ring.color} loading={aLoading} />
                  <p className="text-[11px] text-center font-jakarta" style={{ color: "var(--text-secondary)" }}>{ring.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Failure Prediction Trend */}
            <motion.div
              className="ib-card p-4"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              whileHover={{ y: -2, transition: { duration: 0.18 } }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} style={{ color: "var(--accent-primary)" }} />
                  <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Failure Prediction Trends</p>
                </div>
                <div className="flex gap-1">
                  {["24h", "7d", "30d"].map((r) => (
                    <motion.button
                      key={r}
                      onClick={() => setTrendRange(r)}
                      whileTap={{ scale: 0.93 }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        trendRange === r
                          ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30"
                          : "hover:bg-[var(--surface-tertiary)]"
                      }`}
                      style={{ color: trendRange === r ? "var(--accent-primary)" : "var(--text-tertiary)" }}
                    >
                      {r}
                    </motion.button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="var(--accent-primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: "var(--text-tertiary)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--text-tertiary)", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--accent-primary)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Area
                    type="monotone" dataKey="v"
                    stroke="var(--accent-primary)" strokeWidth={2}
                    fill="url(#trendGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: "var(--accent-primary)", stroke: "var(--bg-primary)", strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* KPI tiles */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
              variants={stagger} initial="hidden" animate="show"
            >
              <KpiTile label="Critical Alerts"  value={criticalCount}    color="#EF4444" icon={AlertTriangle} loading={aLoading} />
              <KpiTile label="Avg RUL"          value={avgRUL} unit=" d" color="#2563EB" icon={Activity}      loading={aLoading} />
              <KpiTile label="Compliance Score" value={averageScore} unit="%" color="#10B981" icon={Zap}      loading={cLoading} />
              <KpiTile label="Non-Compliant"    value={nonCompliantCount} color="#F59E0B" icon={AlertTriangle} loading={cLoading} />
            </motion.div>
          </div>

          {/* Right (1/3) */}
          <div className="space-y-4">

            {/* AI Insights */}
            <motion.div
              className="ib-card p-4"
              initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}
              whileHover={{ y: -2, transition: { duration: 0.18 } }}
            >
              <div className="flex items-center gap-2 mb-4">
                <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
                  <Zap size={14} style={{ color: "var(--accent-secondary)" }} />
                </motion.div>
                <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>AI Insights</p>
              </div>
              <div className="space-y-3">
                {AI_INSIGHTS.map((ins, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    className="p-3 rounded-xl border transition-all cursor-pointer"
                    style={{
                      borderColor: "var(--border-primary)",
                      background: "var(--surface-secondary)",
                    }}
                    whileHover={{ x: 2, borderColor: ins.color }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="ib-badge" style={{ background: `${ins.color}15`, color: ins.color, border: `1px solid ${ins.color}35` }}>
                        {ins.tag}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{ins.time}</span>
                    </div>
                    <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{ins.text}</p>
                  </motion.div>
                ))}
              </div>
              <motion.button
                onClick={() => navigate("/copilot")}
                className="w-full mt-3 py-2.5 rounded-xl text-[12px] font-semibold border transition-all font-jakarta"
                style={{
                  color: "var(--accent-primary)",
                  borderColor: "var(--border-primary)",
                  background: "var(--surface-secondary)",
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                Open Copilot Console
              </motion.button>
            </motion.div>

            {/* Maintenance Timeline */}
            <motion.div
              className="ib-card p-4"
              initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }}
              whileHover={{ y: -2, transition: { duration: 0.18 } }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={14} style={{ color: "var(--accent-primary)" }} />
                <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Maintenance Timeline</p>
              </div>
              <div className="space-y-3">
                {TIMELINE.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.07 }}
                    className="flex items-start gap-3"
                  >
                    <motion.div
                      className="mt-1 w-2 h-2 rounded-full shrink-0"
                      style={{ background: item.color, boxShadow: `0 0 8px ${item.color}90` }}
                      animate={item.status === "IN PROGRESS" ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-semibold font-jakarta truncate" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                        <span className="text-[10px] font-bold shrink-0" style={{ color: item.color }}>{item.status}</span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{item.sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

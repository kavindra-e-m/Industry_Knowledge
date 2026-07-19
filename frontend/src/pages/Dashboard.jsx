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
  { tag: "OPTIMIZATION", time: "2m ago", color: "#4F9DFF", text: "Reduce Turbine-04 load by 12% to prevent thermal runaway. Reroute excess energy to Storage Block B." },
  { tag: "MAINTENANCE",  time: "15m ago", color: "#FBBF24", text: "Hydraulic Seal #42 reaching fatigue limit. Schedule replacement within 48 operational hours." },
  { tag: "INVENTORY",    time: "1h ago",  color: "#FF5C5C", text: "Critical spare part 'GE-Filter-X' out of stock. Automatic procurement request initiated." },
];

const TIMELINE = [
  { label: "Filter Replacement", sub: "Section A-12 · Done by Tech-04", status: "COMPLETED",    color: "#34D399" },
  { label: "Calibration Check",  sub: "Sensor Array 09 · AI Assisted",  status: "IN PROGRESS",  color: "#4F9DFF" },
  { label: "Lubrication Cycle",  sub: "Conveyor Link 04 · System Auto",  status: "SCHEDULED 2H", color: "#4A6080" },
];

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ib-glass px-3 py-2 text-xs">
      <p className="text-[#8BA3C7]">Predicted Peak Risk</p>
      <p className="text-white font-bold text-sm">{payload[0].value}%</p>
    </div>
  );
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp  = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } };

function KpiTile({ label, value, unit = "", color = "#4F9DFF", icon: Icon, loading }) {
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
              style={{ borderColor: "rgba(255,92,92,0.45)", background: "rgba(255,92,92,0.06)" }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,92,92,0.15)" }}
                  animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <AlertTriangle size={18} className="text-[#FF5C5C]" />
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-white font-sora">Critical System Alert</p>
                  <p className="text-xs text-[#8BA3C7]">Turbine-04: Abnormal Thermal Deviation Detected</p>
                </div>
              </div>
              <motion.button
                className="ib-btn ib-btn-critical text-xs px-4 py-2"
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
                { label: "Overall Health Index",    sublabel: "MAIN PLANT",    value: 92, color: "#34D399" },
                { label: "Efficiency Optimization", sublabel: "PROCESS LOAD",  value: 74, color: "#4F9DFF" },
                { label: "Risk Mitigation",         sublabel: "SAFETY MARGIN", value: 98, color: "#7C5CFC" },
              ].map((ring) => (
                <motion.div
                  key={ring.sublabel}
                  variants={fadeUp}
                  className="ib-card p-5 flex flex-col items-center gap-3"
                  whileHover={{ y: -3, transition: { duration: 0.18 } }}
                >
                  <p className="ib-label self-start">{ring.sublabel}</p>
                  <StatRing value={ring.value} size={110} stroke={9} color={ring.color} loading={aLoading} />
                  <p className="text-[11px] text-[#8BA3C7] text-center font-jakarta">{ring.label}</p>
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
                  <TrendingUp size={14} className="text-[#4F9DFF]" />
                  <p className="text-sm font-semibold text-white font-sora">Failure Prediction Trends</p>
                </div>
                <div className="flex gap-1">
                  {["24h", "7d", "30d"].map((r) => (
                    <motion.button
                      key={r}
                      onClick={() => setTrendRange(r)}
                      whileTap={{ scale: 0.93 }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        trendRange === r
                          ? "bg-[#4F9DFF]/20 text-[#4F9DFF] border border-[#4F9DFF]/30"
                          : "text-[#4A6080] hover:text-[#8BA3C7]"
                      }`}
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
                      <stop offset="0%"   stopColor="#4F9DFF" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#4F9DFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
                  <XAxis dataKey="t" tick={{ fill: "#4A6080", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#4A6080", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#4F9DFF", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Area
                    type="monotone" dataKey="v"
                    stroke="#4F9DFF" strokeWidth={2}
                    fill="url(#trendGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#4F9DFF", stroke: "#07111F", strokeWidth: 2 }}
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
              <KpiTile label="Critical Alerts"  value={criticalCount}    color="#FF5C5C" icon={AlertTriangle} loading={aLoading} />
              <KpiTile label="Avg RUL"          value={avgRUL} unit=" d" color="#4F9DFF" icon={Activity}      loading={aLoading} />
              <KpiTile label="Compliance Score" value={averageScore} unit="%" color="#34D399" icon={Zap}      loading={cLoading} />
              <KpiTile label="Non-Compliant"    value={nonCompliantCount} color="#FBBF24" icon={AlertTriangle} loading={cLoading} />
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
                  <Zap size={14} className="text-[#7C5CFC]" />
                </motion.div>
                <p className="text-sm font-semibold text-white font-sora">AI Insights</p>
              </div>
              <div className="space-y-3">
                {AI_INSIGHTS.map((ins, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    className="p-3 rounded-xl border border-[#1E3A5F] hover:border-[#2a4a6b] transition-all cursor-pointer"
                    whileHover={{ x: 2, borderColor: ins.color + "40" }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="ib-badge" style={{ background: `${ins.color}18`, color: ins.color, border: `1px solid ${ins.color}35` }}>
                        {ins.tag}
                      </span>
                      <span className="text-[10px] text-[#4A6080]">{ins.time}</span>
                    </div>
                    <p className="text-[12px] text-[#8BA3C7] leading-relaxed">{ins.text}</p>
                  </motion.div>
                ))}
              </div>
              <motion.button
                onClick={() => navigate("/copilot")}
                className="w-full mt-3 py-2.5 rounded-xl text-[12px] font-semibold text-[#2563EB] border border-[#2563EB]/20 hover:bg-[#2563EB]/8 transition-all font-jakarta"
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
                <Calendar size={14} className="text-[#4F9DFF]" />
                <p className="text-sm font-semibold text-white font-sora">Maintenance Timeline</p>
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
                        <p className="text-[12px] font-semibold text-white font-jakarta truncate">{item.label}</p>
                        <span className="text-[10px] font-bold shrink-0" style={{ color: item.color }}>{item.status}</span>
                      </div>
                      <p className="text-[11px] text-[#4A6080] mt-0.5">{item.sub}</p>
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

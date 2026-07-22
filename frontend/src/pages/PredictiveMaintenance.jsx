import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Plus, Filter, CheckSquare, ExternalLink, TrendingUp, X, Check } from "lucide-react";
import PageShell from "../components/shared/PageShell";
import StatRing from "../components/shared/StatRing";
import { useAlerts } from "../hooks/useAlerts";
import { useToastStore } from "../store/toastStore";
import { useUiStore } from "../store/uiStore";

const EQUIPMENT_CARDS = [
  { name: "Generator Unit G-7",  status: "Operational",         statusColor: "var(--success)", rul: "1,248h", failProb: "4.2%",  health: 92, healthColor: "var(--success)", img: "⚡", site: "Jamnagar Refinery" },
  { name: "Coolant Pump P-12",   status: "Maintenance Imminent", statusColor: "var(--warning)", rul: "142h",   failProb: "18.5%", health: 74, healthColor: "var(--warning)", img: "💧", site: "Mumbai Offshore" },
];

const WORK_ORDERS = [
  { id: "WO-9921", title: "Calibration Fix", tag: "PREDICTED", color: "var(--accent-secondary)", desc: "Sensor calibration drift detected in Pressure Valve V-4." },
  { id: "WO-9844", title: "Lubricant",       tag: "ROUTINE",   color: "var(--accent-primary)", desc: "Scheduled lubrication cycle for Conveyor Belt C-12." },
];

const HEALTH_RINGS = [
  { label: "EFFICIENCY",  sublabel: "Main Array",       value: 88, color: "var(--success)" },
  { label: "COMPLIANCE",  sublabel: "Environmental",    value: 96, color: "var(--accent-primary)" },
  { label: "RELIABILITY", sublabel: "Secondary Aux",    value: 64, color: "var(--warning)" },
];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const fadeUp  = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } } };

export default function PredictiveMaintenance() {
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);
  const openTab = useUiStore((s) => s.openTab);
  const { alerts, loading } = useAlerts();
  const critical = alerts.filter((a) => a.severity === "critical");

  const [equipment, setEquipment] = useState(EQUIPMENT_CARDS);
  const [siteFilter, setSiteFilter] = useState("All");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [showNewObservation, setShowNewObservation] = useState(false);

  // New observation states
  const [obsName, setObsName] = useState("");
  const [obsStatus, setObsStatus] = useState("Operational");
  const [obsRul, setObsRul] = useState("500h");
  const [obsFailProb, setObsFailProb] = useState("5.0%");
  const [obsHealth, setObsHealth] = useState(90);
  const [obsSite, setObsSite] = useState("Jamnagar Refinery");
  const [obsImg, setObsImg] = useState("⚙️");

  const filteredEquipment = equipment.filter(
    (eq) => siteFilter === "All" || eq.site === siteFilter
  );

  const handleAddObservation = (e) => {
    e.preventDefault();
    if (!obsName.trim()) {
      push({ type: "error", title: "Missing Field", message: "Please specify equipment name.", duration: 2500 });
      return;
    }
    
    const isImminent = obsStatus === "Maintenance Imminent";
    const newCard = {
      name: obsName,
      status: obsStatus,
      statusColor: isImminent ? "var(--warning)" : "var(--success)",
      rul: obsRul,
      failProb: obsFailProb,
      health: Number(obsHealth),
      healthColor: isImminent ? "var(--warning)" : "var(--success)",
      img: obsImg,
      site: obsSite
    };

    setEquipment((prev) => [...prev, newCard]);
    push({
      type: "success",
      title: "Observation Registered",
      message: `Successfully logged new health state for ${obsName} at ${obsSite}.`,
      duration: 3500
    });
    
    // Reset
    setObsName("");
    setObsStatus("Operational");
    setObsRul("500h");
    setObsFailProb("5.0%");
    setObsHealth(90);
    setShowNewObservation(false);
  };

  return (
    <PageShell topbarPlaceholder="Search industrial assets...">
      <div className="p-6 space-y-5 min-h-full" style={{ background: "transparent" }}>

        {/* Header */}
        <motion.div
          className="flex items-start justify-between"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        >
          <div>
            <h1 className="text-4xl font-bold font-sora leading-tight" style={{ color: "var(--text-primary)" }}>Predictive<br />Maintenance</h1>
            <p className="text-[13px] mt-2" style={{ color: "var(--text-tertiary)" }}>Real-time asset telemetry & machine learning failure forecasts.</p>
          </div>
          <div className="flex gap-2 mt-2 relative">
            <div className="relative">
              <motion.button onClick={() => setFilterMenuOpen(!filterMenuOpen)} className="ib-btn ib-btn-ghost text-xs" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Filter size={12} /> {siteFilter === "All" ? "Filter Site" : siteFilter}
              </motion.button>
              {filterMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 rounded-xl border p-1 shadow-lg z-20" style={{ background: "var(--surface-primary)", borderColor: "var(--border-primary)" }}>
                  {["All", "Jamnagar Refinery", "Mumbai Offshore"].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSiteFilter(s); setFilterMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-[var(--surface-secondary)] text-primary-app font-medium flex items-center justify-between"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {s}
                      {siteFilter === s && <Check size={12} className="text-[var(--accent-primary)]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <motion.button onClick={() => setShowNewObservation(true)} className="ib-btn ib-btn-primary text-xs" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
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
            style={{ borderColor: "rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.05)" }}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}>
                  <AlertTriangle size={14} className="text-red-500" />
                </motion.div>
                <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Critical Alerts</p>
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
                  className="p-3 rounded-xl border transition-all"
                  style={{
                    borderColor: i === 0 ? "rgba(239, 68, 68, 0.3)" : "var(--border-primary)",
                    background: i === 0 ? "rgba(239, 68, 68, 0.05)" : "var(--surface-secondary)",
                  }}
                >
                  {loading ? (
                    <div className="space-y-2">
                      <div className="ib-skeleton h-3 w-32 rounded" />
                      <div className="ib-skeleton h-3 w-48 rounded" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[12px] font-bold" style={{ color: "var(--text-primary)" }}>{a.tag}: {a.predicted_component}</p>
                        <span className="text-[10px] text-red-500">{a.rul_days}d</span>
                      </div>
                      <p className="text-[11px] mb-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>{a.suggested_work_order.slice(0, 70)}...</p>
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
            <button onClick={() => openTab("alerts")} className="w-full mt-3 text-[11px] font-bold hover:underline text-center" style={{ color: "var(--accent-primary)" }}>View all alerts →</button>
          </motion.div>

          {/* Equipment Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEquipment.map((eq, i) => (
              <motion.div
                key={eq.name}
                variants={fadeUp}
                className="ib-card p-4"
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <motion.div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0 transition-colors"
                    style={{ background: "var(--surface-secondary)" }}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {eq.img}
                  </motion.div>
                  <div>
                    <p className="text-[13px] font-bold font-sora" style={{ color: "var(--text-primary)" }}>{eq.name}</p>
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
                    <p className="text-lg font-bold font-sora" style={{ color: "var(--text-primary)" }}>{eq.rul}</p>
                  </div>
                  <div className="ib-card p-2.5">
                    <p className="ib-label mb-1">FAILURE PROB.</p>
                    <p className="text-lg font-bold font-sora" style={{ color: eq.statusColor }}>{eq.failProb}</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span style={{ color: "var(--text-tertiary)" }}>System Health</span>
                    <span className="font-semibold" style={{ color: eq.healthColor }}>{eq.health}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-secondary)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: eq.healthColor }}
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
              <TrendingUp size={14} style={{ color: "var(--accent-primary)" }} />
              <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Health Trends</p>
            </div>
            <div className="flex justify-around">
              {HEALTH_RINGS.map((r) => (
                <div key={r.label} className="flex flex-col items-center gap-2">
                  <StatRing value={r.value} size={90} stroke={7} color={r.color} />
                  <p className="ib-label">{r.label}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{r.sublabel}</p>
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
                <CheckSquare size={14} style={{ color: "var(--success)" }} />
                <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>AI Work Orders</p>
              </div>
              <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Last sync: 12m ago</span>
            </div>
            <div className="space-y-3">
              {WORK_ORDERS.map((wo, i) => (
                <motion.div
                  key={wo.id}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer"
                  style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}
                  whileHover={{ x: 2 }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${wo.color}18` }}>
                    <CheckSquare size={13} style={{ color: wo.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>{wo.id}: {wo.title}</p>
                      <span className="ib-badge text-[9px]" style={{ background: `${wo.color}18`, color: wo.color, border: `1px solid ${wo.color}30` }}>{wo.tag}</span>
                    </div>
                    <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{wo.desc}</p>
                  </div>
                  <ExternalLink size={12} style={{ color: "var(--text-tertiary)" }} className="shrink-0 mt-0.5" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* New Observation Modal */}
      <AnimatePresence>
        {showNewObservation && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewObservation(false)}
            />
            {/* Content */}
            <motion.div
              className="ib-card p-6 w-full max-w-md relative z-10 overflow-hidden shadow-2xl"
              style={{ background: "var(--surface-primary)", borderColor: "var(--border-primary)" }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold font-sora" style={{ color: "var(--text-primary)" }}>New Asset Observation</h3>
                <button onClick={() => setShowNewObservation(false)} className="p-1.5 rounded-lg hover:bg-[var(--surface-secondary)]" style={{ color: "var(--text-secondary)" }}>
                  <X size={16} />
                </button>
              </div>
              
              <form onSubmit={handleAddObservation} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="ib-label text-[10px]">Equipment Name / Tag</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Recirculating Pump P-202"
                    value={obsName}
                    onChange={(e) => setObsName(e.target.value)}
                    className="ib-input bg-surface-secondary text-primary-app border-primary-app"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="ib-label text-[10px]">Site Location</label>
                    <select
                      value={obsSite}
                      onChange={(e) => setObsSite(e.target.value)}
                      className="ib-input bg-surface-secondary text-primary-app border-primary-app"
                    >
                      <option value="Jamnagar Refinery">Jamnagar Refinery</option>
                      <option value="Mumbai Offshore">Mumbai Offshore</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="ib-label text-[10px]">Status</label>
                    <select
                      value={obsStatus}
                      onChange={(e) => setObsStatus(e.target.value)}
                      className="ib-input bg-surface-secondary text-primary-app border-primary-app"
                    >
                      <option value="Operational">Operational</option>
                      <option value="Maintenance Imminent">Maintenance Imminent</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="ib-label text-[10px]">Icon</label>
                    <select
                      value={obsImg}
                      onChange={(e) => setObsImg(e.target.value)}
                      className="ib-input bg-surface-secondary text-primary-app border-primary-app text-center"
                    >
                      <option value="⚙️">⚙️ Gear</option>
                      <option value="⚡">⚡ Generator</option>
                      <option value="💧">💧 Pump</option>
                      <option value="🔥">🔥 Boiler</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="ib-label text-[10px]">RUL</label>
                    <input
                      type="text"
                      placeholder="e.g. 250h"
                      value={obsRul}
                      onChange={(e) => setObsRul(e.target.value)}
                      className="ib-input bg-surface-secondary text-primary-app border-primary-app"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="ib-label text-[10px]">Fail Prob.</label>
                    <input
                      type="text"
                      placeholder="e.g. 10%"
                      value={obsFailProb}
                      onChange={(e) => setObsFailProb(e.target.value)}
                      className="ib-input bg-surface-secondary text-primary-app border-primary-app"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <label className="ib-label text-[10px]">Health Score ({obsHealth}%)</label>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={obsHealth}
                    onChange={(e) => setObsHealth(e.target.value)}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600 bg-[var(--surface-tertiary)]"
                  />
                </div>
                
                <div className="flex gap-2 pt-2 justify-end">
                  <button type="button" onClick={() => setShowNewObservation(false)} className="ib-btn ib-btn-ghost text-xs">Cancel</button>
                  <button type="submit" className="ib-btn ib-btn-primary text-xs">Save Observation</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

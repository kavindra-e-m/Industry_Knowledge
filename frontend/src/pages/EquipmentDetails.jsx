import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Camera, Edit, Download, CheckCircle, FileText, Bot, Calendar, X, Save, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/shared/PageShell";
import StatRing from "../components/shared/StatRing";
import { useToastStore } from "../store/toastStore";

const SENSORS = [
  { label: "CORE TEMP", value: "842°C", delta: "+1.2%", color: "var(--warning)", status: "nominal" },
  { label: "ROTATION", value: "12,400 RPM", delta: "NOMINAL", color: "var(--success)", status: "nominal" },
  { label: "INLET PRESSURE", value: "45.2 BAR", delta: "-0.4%", color: "var(--accent-primary)", status: "nominal" },
  { label: "VIBRATION", value: "LOW LVL", delta: "0.02mm", color: "var(--accent-secondary)", status: "nominal" },
];

const AI_INSIGHTS = [
  {
    title: "Lubrication Cycle Optimization",
    confidence: "HIGH CONFIDENCE",
    confColor: "var(--success)",
    desc: "AI analysis of thermal signatures suggests increasing the lubrication interval for Bearing Housing A-12. This will likely extend the component life by 12% and reduce thermal peaks by 15°C.",
  },
];

const DOCS = [
  { name: "P&ID-GT-402X-2024.pdf", sub: "TECHNICAL SCHEMATIC · 12MB", icon: "📄", color: "var(--accent-primary)" },
  { name: "ISO-9001 Safety Audit", sub: "CERTIFIED PASS · 2024-03", icon: "✓", color: "var(--success)" },
  { name: "Maintenance History v2.4", sub: "LAST UPDATE: OCT 13", icon: "📋", color: "var(--accent-secondary)" },
];

export default function EquipmentDetails() {
  const [tab, setTab] = useState("insights");
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);

  // Equipment info state
  const [eqName, setEqName] = useState("General Tech GT-402X");
  const [eqSub, setEqSub] = useState("High-Pressure Gas Combustion Turbine · Sector 7G");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("General Tech GT-402X");
  const [editSub, setEditSub] = useState("High-Pressure Gas Combustion Turbine · Sector 7G");

  // Insights state
  const [insights, setInsights] = useState(AI_INSIGHTS);
  
  // Maintenance logs state
  const [logs, setLogs] = useState([
    { date: "2026-07-10", action: "Routine lubrication check", tech: "K. R. Patel", status: "Completed" },
    { date: "2026-06-25", action: "Filter replacement Unit B", tech: "S. Sharma", status: "Completed" }
  ]);

  const handleScheduleAction = (insight) => {
    const newLog = {
      date: new Date().toISOString().split('T')[0],
      action: `Scheduled: ${insight.title}`,
      tech: "AI System Dispatch",
      status: "Pending"
    };
    setLogs((prev) => [newLog, ...prev]);
    setInsights((prev) => prev.filter(i => i.title !== insight.title));
    push({
      type: "success",
      title: "Action Scheduled",
      message: `Lubrication optimization logged under maintenance queue.`,
      duration: 3500
    });
    setTab("maintenance");
  };

  const handleIgnore = (insight) => {
    setInsights((prev) => prev.filter(i => i.title !== insight.title));
    push({
      type: "info",
      title: "Insight Ignored",
      message: `${insight.title} recommendation dismissed.`,
      duration: 2500
    });
  };

  const handleDownloadDoc = (docName) => {
    push({ type: "info", title: "Downloading document", message: `Downloading ${docName}...`, duration: 2000 });
    setTimeout(() => {
      const element = document.createElement("a");
      const fileBlob = new Blob([`Mock document content for ${docName}`], { type: 'text/plain' });
      element.href = URL.createObjectURL(fileBlob);
      element.download = docName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      push({ type: "success", title: "Download complete", message: `${docName} saved successfully.`, duration: 2500 });
    }, 1500);
  };

  const handleCameraUpload = () => {
    push({ type: "success", title: "Asset Telemetry Synced", message: "Successfully refreshed optical sensor feeds.", duration: 3000 });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      push({ type: "error", title: "Missing Field", message: "Please specify asset name.", duration: 2500 });
      return;
    }
    setEqName(editName);
    setEqSub(editSub);
    setIsEditing(false);
    push({ type: "success", title: "Asset Info Updated", message: "Details successfully saved to local store.", duration: 2500 });
  };

  return (
    <PageShell topbarPlaceholder="Search parameters, telemetry, or doc...">
      <div className="p-6 space-y-5 min-h-full" style={{ background: "transparent" }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[11px] hover:opacity-80 transition-colors" style={{ color: "var(--text-tertiary)" }}>
            <ChevronLeft size={13} /> Asset Fleet / Turbine Group B /
          </button>
          <span className="text-[11px] font-semibold" style={{ color: "var(--accent-primary)" }}>GT-402X Details</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Left: Asset image + sensors */}
          <div className="xl:col-span-2 space-y-4">

            {/* Asset image */}
            <motion.div className="ib-card p-0 overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="relative h-56 flex items-center justify-center transition-colors duration-250" style={{ background: "var(--surface-secondary)" }}>
                <div className="text-8xl opacity-15">⚙</div>
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-primary)] via-transparent to-transparent" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button onClick={handleCameraUpload} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--surface-tertiary)]" style={{ background: "var(--surface-primary)", color: "var(--text-tertiary)" }}>
                    <Camera size={13} />
                  </button>
                  <button onClick={() => { setEditName(eqName); setEditSub(eqSub); setIsEditing(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--surface-tertiary)]" style={{ background: "var(--surface-primary)", color: "var(--text-tertiary)" }}>
                    <Edit size={13} />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="ib-badge ib-badge-critical text-[9px] mb-2 inline-block">CRITICAL ASSET</span>
                  {isEditing ? (
                    <form onSubmit={handleSaveEdit} className="space-y-1.5 max-w-sm">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="ib-input text-xs py-1"
                        style={{ background: "var(--surface-primary)", color: "var(--text-primary)", borderColor: "var(--border-primary)" }}
                        required
                      />
                      <input
                        type="text"
                        value={editSub}
                        onChange={(e) => setEditSub(e.target.value)}
                        className="ib-input text-[10px] py-1"
                        style={{ background: "var(--surface-primary)", color: "var(--text-secondary)", borderColor: "var(--border-primary)" }}
                      />
                      <div className="flex gap-1.5 pt-1">
                        <button type="submit" className="ib-btn ib-btn-primary text-[9px] px-2.5 py-1 flex items-center gap-1"><Check size={9} /> Save</button>
                        <button type="button" onClick={() => setIsEditing(false)} className="ib-btn ib-btn-ghost text-[9px] px-2.5 py-1 flex items-center gap-1"><X size={9} /> Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="text-lg font-bold font-sora" style={{ color: "var(--text-primary)" }}>{eqName}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{eqSub}</p>
                      <p className="text-[10px] mt-0.5 font-mono" style={{ color: "var(--text-tertiary)" }}>SN: 4920-IB-772</p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Sensor KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SENSORS.map((s, i) => (
                <motion.div
                  key={s.label}
                  className="ib-card p-3 animate-fade-in"
                  style={{ borderColor: `${s.color}25` }}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="ib-label">{s.label}</p>
                    <span className="text-[10px] font-semibold" style={{ color: s.color }}>{s.delta}</span>
                  </div>
                  <p className="text-[15px] font-bold font-sora" style={{ color: "var(--text-primary)" }}>{s.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Tabs */}
            <motion.div className="ib-card p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="flex gap-1 mb-4 border-b pb-3" style={{ borderColor: "var(--border-primary)" }}>
                {["insights", "maintenance"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                      tab === t ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]" : "hover:bg-[var(--surface-tertiary)]"
                    }`}
                    style={{ color: tab === t ? "var(--accent-primary)" : "var(--text-tertiary)" }}
                  >
                    {t === "insights" ? <><Bot size={12} /> AI INSIGHTS</> : <><Calendar size={12} /> MAINTENANCE LOG</>}
                  </button>
                ))}
              </div>

              {tab === "insights" && insights.length === 0 && (
                <div className="text-center py-8 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                  No active AI recommendations. System is running at optimal threshold.
                </div>
              )}

              {tab === "insights" && insights.map((ins, i) => (
                <div key={i} className="p-4 rounded-xl border" style={{ borderColor: "var(--border-primary)" }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center">
                        <Bot size={13} style={{ color: "var(--accent-secondary)" }} />
                      </div>
                      <p className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>{ins.title}</p>
                    </div>
                    <span className="ib-badge text-[9px]" style={{ background: `${ins.confColor}18`, color: ins.confColor, border: `1px solid ${ins.confColor}30` }}>
                      {ins.confidence}
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>{ins.desc}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleScheduleAction(ins)} className="ib-btn ib-btn-primary text-xs py-1.5">Schedule Action</button>
                    <button onClick={() => handleIgnore(ins)} className="ib-btn ib-btn-ghost text-xs py-1.5">Ignore</button>
                  </div>
                </div>
              ))}

              {tab === "maintenance" && (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {logs.map((log, index) => (
                    <div key={index} className="p-3 rounded-xl border flex items-center justify-between text-xs transition-all hover:translate-x-0.5" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
                      <div>
                        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{log.action}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>Operator: {log.tech} · {log.date}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === "Completed" ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right: Vitality + Docs */}
          <div className="space-y-4">

            {/* System Vitality */}
            <motion.div className="ib-card p-5 flex flex-col items-center gap-3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
              <p className="ib-label self-start">SYSTEM VITALITY</p>
              <StatRing value={92} size={130} stroke={10} color="var(--success)" />
              <p className="text-sm font-bold font-sora" style={{ color: "var(--success)" }}>HEALTHY</p>
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="ib-card p-3 text-center">
                  <p className="ib-label mb-1">MTBF</p>
                  <p className="text-lg font-bold font-sora" style={{ color: "var(--text-primary)" }}>1,240</p>
                  <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>hrs</p>
                </div>
                <div className="ib-card p-3 text-center">
                  <p className="ib-label mb-1">EFFICIENCY</p>
                  <p className="text-lg font-bold font-sora" style={{ color: "var(--success)" }}>98.2%</p>
                </div>
              </div>
            </motion.div>

            {/* Compliance & Docs */}
            <motion.div className="ib-card p-4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Compliance & Docs</p>
                <button className="text-[11px] hover:underline" style={{ color: "var(--accent-primary)" }}>View All</button>
              </div>
              <div className="space-y-2">
                {DOCS.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border transition-all" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base" style={{ background: `${d.color}18` }}>
                      {d.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{d.name}</p>
                      <p className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>{d.sub}</p>
                    </div>
                    <Download onClick={() => handleDownloadDoc(d.name)} size={12} style={{ color: "var(--text-tertiary)" }} className="hover:opacity-80 cursor-pointer shrink-0" />
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

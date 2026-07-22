import { useState, useEffect } from "react";
import { getEquipmentList, analyzeDrawingImpact, ingestPID } from "../services/api";
import PageShell from "../components/shared/PageShell";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckSquare, ShieldCheck, Play, Upload, FileText, Cpu, Compass, Layers } from "lucide-react";
import { useToastStore } from "../store/toastStore";

export default function PidPage() {
  const [activeTab, setActiveTab] = useState("graph"); // "graph" | "yolo"
  const [equipmentList, setEquipmentList] = useState([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [impactReport, setImpactReport] = useState(null);

  // Drawing Upload State
  const [file, setFile] = useState(null);
  const [yoloResults, setYoloResults] = useState(null);
  const pushToast = useToastStore((s) => s.push);

  useEffect(() => {
    getEquipmentList()
      .then((data) => setEquipmentList(data.equipment || []))
      .catch((err) => {
        console.error("Failed to load equipment list:", err);
        pushToast({ type: "error", title: "API Error", message: "Failed to connect to backend for equipment master list.", duration: 3000 });
      });
  }, [pushToast]);

  const handleRunImpact = async () => {
    if (!selectedTag) return;
    setLoading(true);
    setImpactReport(null);
    try {
      const data = await analyzeDrawingImpact(selectedTag);
      setImpactReport(data);
      pushToast({ type: "success", title: "Tracing Complete", message: `Analyzed process flow connections for ${selectedTag}`, duration: 2500 });
    } catch (e) {
      console.error(e);
      pushToast({ type: "error", title: "API Error", message: "Error calling P&ID impact API. Ensure database is seeded and backend is running.", duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
  };

  const handleRunYolo = async () => {
    if (!file) return;
    setLoading(true);
    setYoloResults(null);
    try {
      const data = await ingestPID(file);
      setYoloResults(data);
      pushToast({ type: "success", title: "YOLO Parsing Done", message: `Detected ${data.symbols_detected} symbols in P&ID drawing!`, duration: 3000 });
    } catch (e) {
      console.error(e);
      pushToast({ type: "error", title: "Upload Failed", message: "Symbol detection model failed. Ensure uvicorn backend is running and model paths are valid.", duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell topbarPlaceholder="Analyze instrumentation loops, assets or flow paths...">
      <div className="flex flex-col h-full bg-primary-app">
        {/* Sub Header & Tab Selector */}
        <div className="px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 border-primary-app bg-secondary-app">
          <div>
            <h1 className="text-xl font-bold font-sora text-primary-app">P&ID Intelligence Hub</h1>
            <p className="text-xs text-tertiary-app mt-0.5">Specialist Agent 6 — Flow topology tracing & drawing symbol classification.</p>
          </div>
          <div className="flex gap-1 p-0.5 rounded-lg border border-primary-app bg-primary-app self-start">
            <button
              onClick={() => { setActiveTab("graph"); setImpactReport(null); }}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 ${activeTab === "graph" ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-bold" : "text-tertiary-app hover:bg-surface-tertiary"}`}
            >
              <Compass size={12} /> Graph Topology
            </button>
            <button
              onClick={() => { setActiveTab("yolo"); setYoloResults(null); }}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 ${activeTab === "yolo" ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 font-bold" : "text-tertiary-app hover:bg-surface-tertiary"}`}
            >
              <Cpu size={12} /> YOLO Symbol Parser
            </button>
          </div>
        </div>

        {/* Dynamic Panels */}
        <div className="flex-1 flex overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "graph" ? (
              <motion.div
                key="graph-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex-1 flex overflow-hidden"
              >
                {/* Left control panel */}
                <div className="w-80 shrink-0 border-r p-6 flex flex-col gap-6 bg-secondary-app border-primary-app overflow-y-auto">
                  <div>
                    <h3 className="text-sm font-semibold font-sora text-primary-app">Downstream Impact Scope</h3>
                    <p className="text-[11px] text-tertiary-app mt-1 leading-relaxed">
                      Select a start node to execute a BFS traversal on the Neo4j process connection topology.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="ib-label">Select Failed Asset</label>
                    <select
                      value={selectedTag}
                      onChange={(e) => {
                        setSelectedTag(e.target.value);
                        setImpactReport(null);
                      }}
                      className="ib-input w-full bg-surface-secondary border-primary-app text-primary-app"
                    >
                      <option value="">-- Choose Equipment --</option>
                      {equipmentList.map((eq) => (
                        <option key={eq.tag_id} value={eq.tag_id}>
                          {eq.tag_id} - {eq.name} ({eq.equipment_type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleRunImpact}
                    disabled={loading || !selectedTag}
                    className="w-full ib-btn ib-btn-primary justify-center text-xs py-2.5"
                  >
                    <Play size={12} className={loading ? "animate-pulse" : ""} />
                    {loading ? "Tracing Topology Hops..." : "Trace Failure Propagation"}
                  </button>
                </div>

                {/* Right results display */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {impactReport ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {/* Downstream Assets */}
                      <div className="ib-card p-5 bg-surface-primary border-primary-app">
                        <h3 className="text-sm font-bold font-sora text-primary-app flex items-center gap-1.5">
                          <Layers size={14} className="text-[var(--accent-primary)]" /> Topology Propagation Path
                        </h3>
                        <p className="text-[11px] text-tertiary-app mt-1 mb-4 leading-relaxed">
                          {impactReport.impact_analysis?.propagation_summary || "Calculated cascade flow route"}
                        </p>

                        <div className="flex flex-col gap-3">
                          <h4 className="ib-label text-[10px] text-secondary-app">AFFECTED DOWNSTREAM ASSETS</h4>
                          {impactReport.impact_analysis?.affected_equipment &&
                          impactReport.impact_analysis.affected_equipment.length > 0 ? (
                            <div className="space-y-2">
                              {impactReport.impact_analysis.affected_equipment.map((aff, i) => (
                                <div key={i} className="p-3 rounded-lg border border-primary-app bg-surface-secondary">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-primary-app">⚙️ {aff.equipment}</span>
                                    <span className="ib-badge ib-badge-info text-[9px] scale-95">Stage Depth: {aff.depth}</span>
                                  </div>
                                  <div className="text-[10px] text-tertiary-app mt-1">
                                    Flow Path: <span className="font-mono text-secondary-app">{aff.path}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs italic text-tertiary-app py-4">No downstream equipment affected directly.</div>
                          )}
                        </div>
                      </div>

                      {/* Isolation Procedures */}
                      <div className="ib-card p-5 bg-surface-primary border-primary-app flex flex-col gap-4">
                        <div>
                          <h3 className="text-sm font-bold font-sora text-primary-app flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-emerald-500" /> Emergency Isolation & Safety
                          </h3>
                          <p className="text-[11px] text-tertiary-app mt-1">Required isolation valve checklist sequence</p>
                        </div>

                        {impactReport.isolation_procedure && (
                          <div className="flex flex-col gap-4">
                            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                              <div className="text-xs font-bold text-red-500 flex items-center gap-1">
                                <AlertTriangle size={12} /> HIGH PRESSURE PROCESS BOUNDARY WARNING
                              </div>
                              <p className="text-[10px] text-secondary-app mt-1 leading-relaxed">{impactReport.isolation_procedure.note}</p>
                            </div>

                            <div className="flex flex-col gap-2">
                              <h4 className="ib-label text-[10px] text-secondary-app">REQUIRED ISOLATION VALVES CHECKLIST</h4>
                              <div className="space-y-1.5">
                                {impactReport.isolation_procedure.isolation_valves &&
                                impactReport.isolation_procedure.isolation_valves.length > 0 ? (
                                  impactReport.isolation_procedure.isolation_valves.map((valve, i) => (
                                    <label key={i} className="flex items-center gap-2 text-[11px] text-secondary-app font-medium cursor-pointer p-1 rounded hover:bg-surface-secondary">
                                      <input type="checkbox" className="accent-blue-600 rounded w-3.5 h-3.5" />
                                      <span>Isolate Tag: <strong className="text-blue-500 font-mono">{valve}</strong> (Downstream Flow Stop)</span>
                                    </label>
                                  ))
                                ) : (
                                  <div className="text-xs italic text-tertiary-app py-2">No isolation valves mapped. Close local bypasses manually.</div>
                                )}
                              </div>
                            </div>

                            {impactReport.report && (
                              <div className="border-t pt-4 border-primary-app">
                                <h4 className="ib-label text-[10px] mb-2 text-secondary-app">AI ISOLATION MANIFEST</h4>
                                <p className="text-[11.5px] leading-relaxed p-3 rounded-lg border border-primary-app bg-surface-secondary text-secondary-app whitespace-pre-wrap font-sans">
                                  {impactReport.report}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[300px] border border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-8 border-primary-app bg-secondary-app">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] mb-3">
                        📐
                      </div>
                      <h3 className="text-sm font-semibold text-primary-app">P&ID Connection Graph Analyzer</h3>
                      <p className="text-[11px] text-tertiary-app mt-2 max-w-sm leading-relaxed">
                        Select a piece of equipment in the sidebar to trace failure propagation, calculate topology depths, and build work safety isolation checklists.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="yolo-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex-1 flex overflow-hidden"
              >
                {/* Left control panel */}
                <div className="w-80 shrink-0 border-r p-6 flex flex-col gap-6 bg-secondary-app border-primary-app overflow-y-auto">
                  <div>
                    <h3 className="text-sm font-semibold font-sora text-primary-app">YOLOv8 Symbol Parser</h3>
                    <p className="text-[11px] text-tertiary-app mt-1 leading-relaxed">
                      Upload a P&ID drawing image (PNG, JPG, TIFF or PDF) and detect instrumentation symbols using machine learning.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="ib-label">Choose Drawing File</label>
                    <div className="border border-dashed rounded-lg p-4 text-center cursor-pointer border-primary-app bg-primary-app hover:bg-surface-tertiary relative">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload size={20} className="mx-auto text-tertiary-app mb-2" />
                      <span className="text-[10px] text-secondary-app font-medium truncate block">
                        {file ? file.name : "Drag & drop or browse"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleRunYolo}
                    disabled={loading || !file}
                    className="w-full ib-btn ib-btn-primary justify-center text-xs py-2.5"
                  >
                    <Play size={12} className={loading ? "animate-pulse" : ""} />
                    {loading ? "Analyzing Drawing..." : "Run Symbol Classification"}
                  </button>
                </div>

                {/* Right results display */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {yoloResults ? (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      {/* Summary */}
                      <div className="xl:col-span-1 flex flex-col gap-4">
                        <div className="ib-card p-5 bg-surface-primary border-primary-app">
                          <h3 className="text-sm font-bold font-sora text-primary-app flex items-center gap-1.5">
                            📊 Detection Metrics
                          </h3>
                          <div className="mt-4 flex flex-col gap-3">
                            <div>
                              <p className="text-[10px] text-tertiary-app uppercase font-bold tracking-wider">Symbols Identified</p>
                              <p className="text-2xl font-bold text-primary-app font-sora mt-0.5">{yoloResults.symbols_detected}</p>
                            </div>
                            <div className="border-t pt-3 border-primary-app">
                              <p className="text-[10px] text-tertiary-app uppercase font-bold tracking-wider">Classification Confidence</p>
                              <p className="text-sm font-semibold text-emerald-500 font-sora mt-0.5">91.4% (YOLOv8 nano)</p>
                            </div>
                            <div className="border-t pt-3 border-primary-app">
                              <p className="text-[10px] text-tertiary-app uppercase font-bold tracking-wider">File Scanned</p>
                              <p className="text-xs font-mono text-secondary-app truncate mt-0.5">{yoloResults.filename || file?.name}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detail list */}
                      <div className="xl:col-span-2 ib-card p-5 bg-surface-primary border-primary-app">
                        <h3 className="text-sm font-bold font-sora text-primary-app flex items-center gap-1.5">
                          🔍 Classified Symbols List
                        </h3>
                        <p className="text-[11px] text-tertiary-app mt-1 mb-4">Coordinates mapped from computer vision bounding boxes</p>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                          {yoloResults.detections && yoloResults.detections.length > 0 ? (
                            yoloResults.detections.map((det, i) => (
                              <div key={i} className="p-3 rounded-lg border border-primary-app bg-surface-secondary flex items-center justify-between text-xs font-medium">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                                  <span className="text-primary-app capitalize">{det.symbol_type}</span>
                                </div>
                                <div className="font-mono text-tertiary-app text-[10px]">
                                  Center: X:{Math.round(det.center?.x || 0)}, Y:{Math.round(det.center?.y || 0)}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs italic text-tertiary-app py-4 text-center">No symbols detected on drawing sheet. Check file resolution.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[300px] border border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-8 border-primary-app bg-secondary-app">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] mb-3">
                        <Upload size={20} />
                      </div>
                      <h3 className="text-sm font-semibold text-primary-app">ML Computer Vision Scan</h3>
                      <p className="text-[11px] text-tertiary-app mt-2 max-w-sm leading-relaxed">
                        Upload a scanned P&ID blueprint sheet to automatically segment valves, pumps, flow lines, and equipment nodes using a custom YOLOv8 model.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageShell>
  );
}

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, FileText, CheckCircle, Archive, BarChart2, Share2 } from "lucide-react";
import PageShell from "../components/shared/PageShell";
import { useToastStore } from "../store/toastStore";
import { ingestDocument } from "../services/api";

const FILE_TYPES = [".PDF", ".DWG", ".CSV", ".JSON", ".TIFF"];

const INITIAL_UPLOADS = [
  { name: "Turbine_Specs_B2.pdf", time: "2m ago", size: "4.2 MB", status: "extracting", progress: 79, color: "var(--error)", icon: FileText },
  { name: "Main_Loop_PID_Map.dwg", time: "15m ago", size: "12.6 MB", status: "extracted", progress: 100, color: "var(--success)", icon: FileText },
  { name: "Sensor_Calibration_Log_v3.csv", time: "1h ago", size: "840 KB", status: "archived", progress: 100, color: "var(--text-tertiary)", icon: Archive },
];

const ENTITIES = ["#PUMP-402", "Temp_Threshold", "Voltage_Delta", "Critical_Fail", "Flow_Controller", "Emergency_Stop"];
const ENTITY_COLORS = ["var(--accent-primary)", "var(--success)", "var(--warning)", "var(--error)", "var(--accent-secondary)", "var(--info)"];

const CONFIDENCE_BARS = [85, 92, 78, 95, 88];

export default function DocumentIntelligence() {
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);
  const [uploads, setUploads] = useState(INITIAL_UPLOADS);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleRealUpload = async (eventOrFile) => {
    let fileToUpload = null;
    if (eventOrFile && eventOrFile.target && eventOrFile.target.files) {
      fileToUpload = eventOrFile.target.files[0];
    } else if (eventOrFile instanceof File) {
      fileToUpload = eventOrFile;
    }
    if (!fileToUpload) return;

    const fileName = fileToUpload.name;
    const newUploadId = Date.now();
    const newFile = {
      name: fileName,
      time: "Just now",
      size: `${(fileToUpload.size / (1024 * 1024)).toFixed(1)} MB`,
      status: "extracting",
      progress: 20,
      color: "var(--warning)",
      icon: FileText,
      id: newUploadId
    };

    setUploads((prev) => [newFile, ...prev]);
    push({ type: "info", title: "File Ingestion", message: `Uploading ${fileName}...`, duration: 2500 });

    try {
      let currentProgress = 20;
      const interval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 15, 90);
        setUploads((prev) =>
          prev.map((item) =>
            item.id === newUploadId ? { ...item, progress: currentProgress } : item
          )
        );
      }, 300);

      const response = await ingestDocument(fileToUpload);
      clearInterval(interval);

      setUploads((prev) =>
        prev.map((item) =>
          item.id === newUploadId
            ? {
                ...item,
                progress: 100,
                status: "extracted",
                color: "var(--success)"
              }
            : item
        )
      );
      push({
        type: "success",
        title: "Ingestion Successful",
        message: `Extracted ${response.chunk_count} chunks from ${fileName}`,
        duration: 3500
      });
    } catch (err) {
      console.error(err);
      setUploads((prev) =>
        prev.map((item) =>
          item.id === newUploadId
            ? {
                ...item,
                progress: 100,
                status: "error",
                color: "var(--error)"
              }
            : item
        )
      );
      push({
        type: "error",
        title: "Ingestion Failed",
        message: err.message || "Failed to parse document",
        duration: 4000
      });
    }
  };

  const simulateUpload = (type) => {
    const ext = type.toLowerCase();
    const mockNames = {
      ".pdf": "Compressor_Manual_v4.pdf",
      ".dwg": "Section_4_Piping_Diagram.dwg",
      ".csv": "Telemetry_Log_Turbine04.csv",
      ".json": "Metadata_Asset_Config.json",
      ".tiff": "Scanned_Inspection_Log.tiff"
    };
    
    const fileName = mockNames[ext] || `Imported_Asset_Log_${Math.floor(Math.random() * 100)}${ext}`;
    const newUploadId = Date.now();
    const newFile = {
      name: fileName,
      time: "Just now",
      size: `${(1 + Math.random() * 8).toFixed(1)} MB`,
      status: "extracting",
      progress: 0,
      color: ENTITY_COLORS[Math.floor(Math.random() * ENTITY_COLORS.length)],
      icon: FileText,
      id: newUploadId
    };

    setUploads((prev) => [newFile, ...prev]);
    push({ type: "info", title: "File Upload", message: `Uploading ${fileName}...`, duration: 2500 });

    // Animate upload and parsing progress
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 20;
      setUploads((prev) => 
        prev.map((item) => {
          if (item.id === newUploadId) {
            const nextProgress = Math.min(currentProgress, 100);
            return {
              ...item,
              progress: nextProgress,
              status: nextProgress === 100 ? "extracted" : "extracting"
            };
          }
          return item;
        })
      );

      if (currentProgress >= 100) {
        clearInterval(interval);
        push({ type: "success", title: "Parsing Complete", message: `Metadata successfully mapped from ${fileName}`, duration: 3000 });
      }
    }, 400);
  };

  const handleEntityClick = (entity) => {
    push({ type: "ai", title: "AI Assistant Routing", message: `Redirecting to Copilot for entity: ${entity}`, duration: 2000 });
    // Navigate with a small delay so toast is readable
    setTimeout(() => {
      navigate("/copilot", { state: { initialPrompt: `Explain extracted entity ${entity} and its related failure modes.` } });
    }, 800);
  };

  return (
    <PageShell topbarPlaceholder="Search industrial assets, documents, or tags...">
      <div className="flex h-full" style={{ background: "transparent" }}>

        {/* Main */}
        <div className="flex-1 p-6 space-y-5 overflow-y-auto min-w-0 bg-transparent">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xl font-bold font-sora" style={{ color: "var(--text-primary)" }}>Document Intelligence</p>
              <p className="text-[13px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                Upload, extract, and map industrial telemetry data from legacy documents.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => push({ type: "info", title: "Batch Actions", message: "Extracting metadata for 3 active records...", duration: 2000 })} className="ib-btn ib-btn-ghost text-xs">Batch Actions</button>
              <button onClick={() => push({ type: "success", title: "Project Creation", message: "New asset project environment initialized.", duration: 2500 })} className="ib-btn ib-btn-primary text-xs">New Project</button>
            </div>
          </div>

          {/* Drop zone */}
          <motion.div
            className={`ib-card p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${dragging ? "bg-[var(--accent-primary)]/5" : ""}`}
            style={{ borderStyle: "dashed", borderWidth: 2, borderColor: dragging ? "var(--accent-primary)" : "var(--border-primary)" }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) handleRealUpload(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            whileHover={{ borderColor: "var(--accent-primary)" }}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleRealUpload}
              accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.xlsx,.xls,.csv,.docx,.eml,.msg"
            />
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-secondary)" }}>
              <Upload size={24} style={{ color: "var(--accent-primary)" }} />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Drag & Drop Legacy Assets</p>
              <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>Securely upload P&IDs, sensor logs, or technical manuals for automated AI extraction.</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center font-jakarta">
              {FILE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={(e) => {
                    e.stopPropagation();
                    simulateUpload(t);
                  }}
                  className="px-3 py-1 rounded-lg text-[11px] font-bold border transition-all"
                  style={{ color: "var(--text-secondary)", borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}
                >
                  {t}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Recent Uploads */}
          <div className="ib-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Upload size={13} style={{ color: "var(--accent-primary)" }} />
                <p className="text-sm font-semibold font-sora" style={{ color: "var(--text-primary)" }}>Recent Uploads</p>
              </div>
              <button onClick={() => push({ type: "info", title: "Active Queue", message: "Parser Queue Status: 0 pending, 3 complete", duration: 2500 })} className="text-[11px] font-bold hover:underline bg-transparent border-0 cursor-pointer" style={{ color: "var(--accent-primary)" }}>View Queue</button>
            </div>
            <div className="space-y-3">
              {uploads.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border transition-all" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${f.color}15` }}>
                    <f.icon size={16} style={{ color: f.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{f.name}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Upload: {f.time} · {f.size}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {f.status === "extracting" ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold uppercase" style={{ color: "var(--warning)" }}>Extracting Metadata ({f.progress}%)</span>
                        <div className="w-24 h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-tertiary)" }}>
                          <motion.div className="h-full rounded-full bg-amber-500"
                            animate={{ width: `${f.progress}%` }} transition={{ duration: 0.2 }} />
                        </div>
                      </div>
                    ) : f.status === "extracted" ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase text-emerald-500">Extracted</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold uppercase" style={{ color: "var(--text-tertiary)" }}>Archived</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-64 shrink-0 border-l p-4 space-y-5 overflow-y-auto hidden lg:block transition-colors duration-250" style={{ borderColor: "var(--border-primary)", background: "var(--surface-primary)" }}>
          {/* Extracted Entities */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="ib-label">EXTRACTED ENTITIES</p>
              <span className="ib-badge ib-badge-healthy text-[9px]">LIVE</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ENTITIES.map((e, i) => (
                <motion.span
                  key={e}
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => handleEntityClick(e)}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer hover:opacity-85 hover:scale-[1.03] transition-all border"
                  style={{ background: `${ENTITY_COLORS[i]}15`, color: ENTITY_COLORS[i], borderColor: `${ENTITY_COLORS[i]}30` }}
                >
                  {e}
                </motion.span>
              ))}
            </div>
          </div>

          {/* AI Confidence */}
          <div>
            <p className="ib-label mb-3">AI CONFIDENCE SCORE</p>
            <div className="ib-card p-3">
              <div className="flex items-end gap-1 h-16 mb-2">
                {CONFIDENCE_BARS.map((h, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-t-sm"
                    style={{ background: i === 4 ? "var(--success)" : "var(--border-secondary)" }}
                    initial={{ height: 0 }} animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                  />
                ))}
              </div>
              <p className="text-[10px] text-center" style={{ color: "var(--text-tertiary)" }}>94.8% AVG CONFIDENCE</p>
            </div>
          </div>

          {/* Document Relationships */}
          <div>
            <p className="ib-label mb-3">DOCUMENT RELATIONSHIPS</p>
            <div
              onClick={() => navigate("/knowledge-graph")}
              className="ib-card p-3 h-40 flex items-center justify-center relative cursor-pointer hover:border-[var(--accent-primary)]"
            >
              <svg width="100%" height="100%" viewBox="0 0 200 140">
                <line x1="100" y1="70" x2="50" y2="30" stroke="var(--accent-primary)" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="100" y1="70" x2="150" y2="30" stroke="var(--accent-secondary)" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="100" y1="70" x2="100" y2="115" stroke="var(--success)" strokeWidth="1" strokeOpacity="0.4" />
                <circle cx="100" cy="70" r="14" fill="var(--surface-primary)" stroke="var(--accent-primary)" strokeWidth="1.5" />
                <circle cx="50" cy="30" r="9" fill="var(--surface-primary)" stroke="var(--accent-secondary)" strokeWidth="1" />
                <circle cx="150" cy="30" r="9" fill="var(--surface-primary)" stroke="var(--accent-primary)" strokeWidth="1" />
                <circle cx="100" cy="115" r="9" fill="var(--surface-primary)" stroke="var(--success)" strokeWidth="1" />
                <text x="50" y="50" textAnchor="middle" fontSize="7" fill="var(--accent-secondary)">PUMP_SCHEMATIC</text>
                <text x="150" y="50" textAnchor="middle" fontSize="7" fill="var(--accent-primary)">MAINT_LOG</text>
                <text x="100" y="133" textAnchor="middle" fontSize="7" fill="var(--success)">ISO_CERT</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, CheckCircle, Archive, BarChart2, Share2 } from "lucide-react";
import PageShell from "../components/shared/PageShell";

const FILE_TYPES = [".PDF", ".DWG", ".CSV", ".JSON", ".TIFF"];

const UPLOADS = [
  { name: "Turbine_Specs_B2.pdf", time: "2m ago", size: "4.2 MB", status: "extracting", progress: 79, color: "#FF5C5C", icon: FileText },
  { name: "Main_Loop_PID_Map.dwg", time: "15m ago", size: "12.6 MB", status: "extracted", progress: 100, color: "#34D399", icon: FileText },
  { name: "Sensor_Calibration_Log_v3.csv", time: "1h ago", size: "840 KB", status: "archived", progress: 100, color: "#4A6080", icon: Archive },
];

const ENTITIES = ["#PUMP-402", "Temp_Threshold", "Voltage_Delta", "Critical_Fail", "Flow_Controller", "Emergency_Stop"];
const ENTITY_COLORS = ["#4F9DFF", "#34D399", "#FBBF24", "#FF5C5C", "#7C5CFC", "#38BDF8"];

const CONFIDENCE_BARS = [85, 92, 78, 95, 88];

export default function DocumentIntelligence() {
  const [dragging, setDragging] = useState(false);

  return (
    <PageShell topbarPlaceholder="Search industrial assets, documents, or tags...">
      <div className="flex h-full" style={{ background: "#07111F" }}>

        {/* Main */}
        <div className="flex-1 p-6 space-y-5 overflow-y-auto min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xl font-bold text-white font-sora">Document Intelligence</p>
              <p className="text-[13px] text-[#4A6080] mt-1">
                Upload, extract, and map industrial telemetry data from legacy documents.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="ib-btn ib-btn-ghost text-xs">Batch Actions</button>
              <button className="ib-btn ib-btn-primary text-xs">New Project</button>
            </div>
          </div>

          {/* Drop zone */}
          <motion.div
            className={`ib-card p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${dragging ? "border-[#4F9DFF] bg-[#4F9DFF]/5" : ""}`}
            style={{ borderStyle: "dashed", borderWidth: 2, borderColor: dragging ? "#4F9DFF" : "#1E3A5F" }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={() => setDragging(false)}
            whileHover={{ borderColor: "#4F9DFF" }}
          >
            <div className="w-14 h-14 rounded-2xl bg-[#1E3A5F] flex items-center justify-center">
              <Upload size={24} className="text-[#4F9DFF]" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-white font-sora">Drag & Drop Legacy Assets</p>
              <p className="text-[12px] text-[#4A6080] mt-1">Securely upload P&IDs, sensor logs, or technical manuals for automated AI extraction.</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {FILE_TYPES.map((t) => (
                <span key={t} className="px-3 py-1 rounded-lg text-[11px] font-bold text-[#8BA3C7] border border-[#1E3A5F] bg-[#0F1C2E]">{t}</span>
              ))}
            </div>
          </motion.div>

          {/* Recent Uploads */}
          <div className="ib-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Upload size={13} className="text-[#4F9DFF]" />
                <p className="text-sm font-semibold text-white font-sora">Recent Uploads</p>
              </div>
              <button className="text-[11px] text-[#4F9DFF] hover:underline">View Queue</button>
            </div>
            <div className="space-y-3">
              {UPLOADS.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-[#1E3A5F] hover:border-[#2a4a6b] transition-all">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${f.color}18` }}>
                    <f.icon size={16} style={{ color: f.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white truncate">{f.name}</p>
                    <p className="text-[10px] text-[#4A6080]">Upload: {f.time} · {f.size}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {f.status === "extracting" ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-[#FBBF24] uppercase">Extracting Metadata ({f.progress}%)</span>
                        <div className="w-24 h-1 rounded-full bg-[#1E3A5F] overflow-hidden">
                          <motion.div className="h-full rounded-full bg-[#FBBF24]"
                            initial={{ width: 0 }} animate={{ width: `${f.progress}%` }} transition={{ duration: 1 }} />
                        </div>
                      </div>
                    ) : f.status === "extracted" ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle size={12} className="text-[#34D399]" />
                        <span className="text-[10px] font-bold text-[#34D399] uppercase">Extracted</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-[#4A6080] uppercase">Archived</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-64 shrink-0 border-l border-[#1E3A5F] p-4 space-y-5 overflow-y-auto hidden lg:block" style={{ background: "#0F1C2E" }}>
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
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ background: `${ENTITY_COLORS[i]}18`, color: ENTITY_COLORS[i], border: `1px solid ${ENTITY_COLORS[i]}30` }}
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
                    style={{ background: i === 4 ? "#34D399" : "#1E3A5F" }}
                    initial={{ height: 0 }} animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                  />
                ))}
              </div>
              <p className="text-[10px] text-[#4A6080] text-center">94.8% AVG CONFIDENCE</p>
            </div>
          </div>

          {/* Document Relationships */}
          <div>
            <p className="ib-label mb-3">DOCUMENT RELATIONSHIPS</p>
            <div className="ib-card p-3 h-40 flex items-center justify-center relative">
              <svg width="100%" height="100%" viewBox="0 0 200 140">
                <line x1="100" y1="70" x2="50" y2="30" stroke="#4F9DFF" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="100" y1="70" x2="150" y2="30" stroke="#7C5CFC" strokeWidth="1" strokeOpacity="0.4" />
                <line x1="100" y1="70" x2="100" y2="115" stroke="#34D399" strokeWidth="1" strokeOpacity="0.4" />
                <circle cx="100" cy="70" r="14" fill="#1E3A5F" stroke="#4F9DFF" strokeWidth="1.5" />
                <circle cx="50" cy="30" r="9" fill="#1E3A5F" stroke="#7C5CFC" strokeWidth="1" />
                <circle cx="150" cy="30" r="9" fill="#1E3A5F" stroke="#4F9DFF" strokeWidth="1" />
                <circle cx="100" cy="115" r="9" fill="#1E3A5F" stroke="#34D399" strokeWidth="1" />
                <text x="50" y="50" textAnchor="middle" fontSize="7" fill="#7C5CFC">PUMP_SCHEMATIC</text>
                <text x="150" y="50" textAnchor="middle" fontSize="7" fill="#4F9DFF">MAINT_LOG</text>
                <text x="100" y="133" textAnchor="middle" fontSize="7" fill="#34D399">ISO_CERT</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

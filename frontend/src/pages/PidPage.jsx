import { useState, useEffect } from "react";
import { getEquipmentList, analyzeDrawingImpact } from "../services/api";

export default function PidPage() {
  const [equipmentList, setEquipmentList] = useState([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [impactReport, setImpactReport] = useState(null);

  useEffect(() => {
    getEquipmentList()
      .then((data) => setEquipmentList(data.equipment || []))
      .catch((err) => console.error("Failed to load equipment list:", err));
  }, []);

  const handleRunImpact = async () => {
    if (!selectedTag) return;
    setLoading(true);
    try {
      const data = await analyzeDrawingImpact(selectedTag);
      setImpactReport(data);
    } catch (e) {
      alert("Error calling P&ID impact API. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.sidebar}>
        <h3 style={styles.sidebarTitle}>Downstream Impact Scope</h3>
        <p style={styles.sidebarSubtitle}>
          Select a starting node to run a BFS traversal on the Neo4j process connection graph.
        </p>

        <div style={styles.formGroup}>
          <label style={styles.label}>Select Failed Equipment</label>
          <select
            value={selectedTag}
            onChange={(e) => {
              setSelectedTag(e.target.value);
              setImpactReport(null);
            }}
            style={styles.select}
          >
            <option value="">-- Choose Equipment --</option>
            {equipmentList.map((eq) => (
              <option key={eq.tag_id} value={eq.tag_id}>
                {eq.tag_id} - {eq.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleRunImpact}
          disabled={loading || !selectedTag}
          style={styles.runBtn}
        >
          {loading ? "Tracing Topology Hops..." : "Trace Failure Propagation"}
        </button>
      </div>

      <div style={styles.mainContent}>
        {impactReport ? (
          <div style={styles.grid} className="animate-slide-in">
            <div style={styles.leftCol}>
              <div style={styles.glassCard}>
                <h3 style={styles.cardTitle}>Topology Propagation: {selectedTag}</h3>
                <p style={styles.cardSubtitle}>
                  {impactReport.impact_analysis?.propagation_summary || "Failure propagation path"}
                </p>

                <div style={{ marginTop: 20 }}>
                  <h4 style={styles.sectionHeading}>AFFECTED DOWNSTREAM ASSETS</h4>
                  <div style={styles.pathList}>
                    {impactReport.impact_analysis?.affected_equipment && 
                    impactReport.impact_analysis.affected_equipment.length > 0 ? (
                      impactReport.impact_analysis.affected_equipment.map((aff, i) => (
                        <div key={i} style={styles.pathNode}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={styles.nodeTag}>⚙️ {aff.equipment}</span>
                            <span style={styles.depthBadge}>Stage Depth: {aff.depth}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                            Flow Path: <span style={{ color: "#94a3b8" }}>{aff.path}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={styles.noImpact}>No downstream equipment affected directly.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.rightCol}>
              <div style={styles.glassCard}>
                <h3 style={styles.cardTitle}>Emergency Isolation & Safety Procedure</h3>
                <p style={styles.cardSubtitle}>Required isolation valve tags list sequence</p>

                {impactReport.isolation_procedure && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
                    <div style={styles.warningBlock}>
                      <div style={{ fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>⚠️ HIGH PRESSURE PROCESS BOUNDARY WARNING</div>
                      <div style={{ fontSize: 12, color: "#fca5a5" }}>{impactReport.isolation_procedure.note}</div>
                    </div>

                    <div>
                      <h4 style={styles.sectionHeading}>REQUIRED ISOLATION VALVES CHECKLIST</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                        {impactReport.isolation_procedure.isolation_valves && 
                        impactReport.isolation_procedure.isolation_valves.length > 0 ? (
                          impactReport.isolation_procedure.isolation_valves.map((valve, i) => (
                            <label key={i} style={styles.checkboxLabel}>
                              <input type="checkbox" style={styles.checkbox} />
                              <span>Isolate Tag: <strong style={{ color: "#818cf8" }}>{valve}</strong> (Downstream Flow Stop)</span>
                            </label>
                          ))
                        ) : (
                          <div style={styles.noValves}>No specific isolation valves mapped for this flow connection. Close line manual bypasses.</div>
                        )}
                      </div>
                    </div>

                    {impactReport.report && (
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                        <h4 style={styles.sectionHeading}>AI ISOLATION MANIFEST</h4>
                        <div style={styles.reportText}>{impactReport.report}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📐</div>
            <h3>P&ID Connection Graph Analyzer</h3>
            <p style={{ color: "#64748b", fontSize: 13, marginTop: 6, maxWidth: 440 }}>
              Select a piece of equipment to calculate failure propagation, trace process feed lines, and build work safety isolation checklists.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "calc(100vh - 70px)",
    display: "flex",
    backgroundColor: "#07080c",
  },
  sidebar: {
    width: 300,
    background: "#0c0d12",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  sidebarTitle: {
    fontSize: 16,
    color: "#fff",
    fontWeight: 600,
  },
  sidebarSubtitle: {
    fontSize: 11,
    color: "#64748b",
    lineHeight: "18px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 600,
  },
  select: {
    backgroundColor: "#12131c",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    padding: 10,
    color: "#fff",
    fontSize: 13,
    outline: "none",
  },
  runBtn: {
    backgroundColor: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
  },
  mainContent: {
    flex: 1,
    padding: 32,
    overflowY: "auto",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    height: "100%",
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
  },
  rightCol: {
    display: "flex",
    flexDirection: "column",
  },
  glassCard: {
    background: "rgba(18, 19, 28, 0.6)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 24,
    height: "100%",
  },
  cardTitle: {
    fontSize: 16,
    color: "#fff",
    fontWeight: 600,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    marginBottom: 20,
    lineHeight: "18px",
  },
  sectionHeading: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 700,
    letterSpacing: "0.5px",
    marginBottom: 12,
  },
  pathList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  pathNode: {
    backgroundColor: "#0d0e14",
    border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: 8,
    padding: 12,
  },
  nodeTag: {
    fontSize: 13,
    fontWeight: 600,
    color: "#f1f5f9",
  },
  depthBadge: {
    fontSize: 10,
    color: "#6366f1",
    backgroundColor: "rgba(99,102,241,0.08)",
    padding: "2px 6px",
    borderRadius: 4,
  },
  warningBlock: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    borderRadius: 8,
    padding: 12,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    color: "#cbd5e1",
    cursor: "pointer",
    padding: "6px 0",
  },
  checkbox: {
    accentColor: "#6366f1",
    width: 16,
    height: 16,
  },
  reportText: {
    fontSize: 12,
    color: "#cbd5e1",
    lineHeight: "20px",
    whiteSpace: "pre-line",
    backgroundColor: "#0d0e14",
    padding: 14,
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.04)",
  },
  noImpact: {
    color: "#64748b",
    fontSize: 12,
    fontStyle: "italic",
  },
  noValves: {
    color: "#64748b",
    fontSize: 12,
    fontStyle: "italic",
  },
  emptyState: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    border: "1px dashed rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 40,
  },
};

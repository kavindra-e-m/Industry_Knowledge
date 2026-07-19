import { useState, useEffect } from "react";
import { getEquipmentList, predictFailure } from "../services/api";

export default function AssetHealthPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  // Interactive sensor readings for prediction testing
  const [sensorInput, setSensorInput] = useState({
    air_temp: 298.5,
    proc_temp: 308.8,
    speed: 1500,
    torque: 40,
    wear: 10,
    days_since_pm: 30,
    overdue_days: 0,
    emergency_count: 0,
    corrective_ratio: 0.1,
  });

  const [inferenceResult, setInferenceResult] = useState(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await getEquipmentList();
      setAssets(data.equipment || []);
      if (data.equipment && data.equipment.length > 0) {
        handleSelectAsset(data.equipment[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
    setInferenceResult(null);
    // Populate default sensor values based on type
    const isHeavy = ["T-101", "C-101", "R-101", "F-101"].includes(asset.tag_id);
    setSensorInput({
      air_temp: 298.2,
      proc_temp: isHeavy ? 320.5 : 308.4,
      speed: isHeavy ? 1200 : 1550,
      torque: isHeavy ? 55.4 : 35.2,
      wear: Math.floor(Math.random() * 80) + 10,
      days_since_pm: asset.tag_id === "P-101" ? 195 : 35, // mock one overdue PM
      overdue_days: asset.tag_id === "P-101" ? 15 : 0,
      emergency_count: asset.tag_id === "P-101" ? 2 : 0,
      corrective_ratio: asset.tag_id === "P-101" ? 0.6 : 0.1,
    });
  };

  const handlePredict = async () => {
    if (!selectedAsset) return;
    setLoading(true);
    try {
      const res = await predictFailure({
        equipment_tag: selectedAsset.tag_id,
        air_temperature_k: parseFloat(sensorInput.air_temp),
        process_temperature_k: parseFloat(sensorInput.proc_temp),
        rotational_speed_rpm: parseFloat(sensorInput.speed),
        torque_nm: parseFloat(sensorInput.torque),
        tool_wear_min: parseFloat(sensorInput.wear),
        days_since_maintenance: parseInt(sensorInput.days_since_pm),
        overdue_days: parseInt(sensorInput.overdue_days),
        emergency_count_6m: parseInt(sensorInput.emergency_count),
        corrective_ratio: parseFloat(sensorInput.corrective_ratio),
      });
      setInferenceResult(res);
    } catch (e) {
      alert("Error calling prediction API. Ensure models are trained.");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (prob) => {
    if (prob > 0.8) return "#ef4444"; // critical
    if (prob > 0.5) return "#f59e0b"; // warning
    return "#10b981"; // healthy
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.leftCol}>
        <div style={styles.panelHeader}>
          <h2 style={styles.title}>Asset Registry Directory</h2>
          <p style={styles.subtitle}>Unified plant equipment directory from Postgres/Neo4j seeds</p>
        </div>

        <div style={styles.list}>
          {assets.map((asset) => {
            const isSelected = selectedAsset?.tag_id === asset.tag_id;
            return (
              <div
                key={asset.tag_id}
                onClick={() => handleSelectAsset(asset)}
                style={{
                  ...styles.card,
                  borderColor: isSelected ? "#6366f1" : "rgba(255,255,255,0.05)",
                  backgroundColor: isSelected ? "rgba(99, 102, 241, 0.08)" : "#12131c",
                }}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.tag}>{asset.tag_id}</span>
                  <span style={{ ...styles.criticalityBadge, color: asset.criticality === "Critical" ? "#ef4444" : "#94a3b8" }}>
                    {asset.criticality}
                  </span>
                </div>
                <h4 style={styles.cardName}>{asset.name}</h4>
                <div style={styles.cardMeta}>
                  <span>Type: {asset.equipment_type}</span>
                  <span>Loc: {asset.location}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.rightCol}>
        {selectedAsset ? (
          <div style={styles.detailsPanel} className="animate-slide-in">
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 6 }}>
              {selectedAsset.tag_id} - {selectedAsset.name}
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
              Asset Type: {selectedAsset.equipment_type} | Location: {selectedAsset.location}
            </p>

            <div style={styles.grid}>
              <div style={styles.glassSection}>
                <h3 style={styles.sectionTitle}>1. Sensor & Historian inputs</h3>
                <div style={styles.inputsGrid}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Air Temp (K)</label>
                    <input
                      type="number"
                      value={sensorInput.air_temp}
                      onChange={(e) => setSensorInput({ ...sensorInput, air_temp: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Process Temp (K)</label>
                    <input
                      type="number"
                      value={sensorInput.proc_temp}
                      onChange={(e) => setSensorInput({ ...sensorInput, proc_temp: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Rotational Speed (RPM)</label>
                    <input
                      type="number"
                      value={sensorInput.speed}
                      onChange={(e) => setSensorInput({ ...sensorInput, speed: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Torque (Nm)</label>
                    <input
                      type="number"
                      value={sensorInput.torque}
                      onChange={(e) => setSensorInput({ ...sensorInput, torque: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Tool Wear (min)</label>
                    <input
                      type="number"
                      value={sensorInput.wear}
                      onChange={(e) => setSensorInput({ ...sensorInput, wear: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Days Since PM</label>
                    <input
                      type="number"
                      value={sensorInput.days_since_pm}
                      onChange={(e) => setSensorInput({ ...sensorInput, days_since_pm: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <button onClick={handlePredict} disabled={loading} style={styles.predictBtn}>
                  {loading ? "Running ML Inference..." : "Evaluate Failure Risk (Random Forest)"}
                </button>
              </div>

              <div style={styles.glassSection}>
                <h3 style={styles.sectionTitle}>2. ML Predictive Inference Results</h3>
                
                {inferenceResult ? (
                  <div className="animate-slide-in" style={styles.resultBox}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>Failure Probability</div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: getRiskColor(inferenceResult.prediction?.failure_probability || 0.1) }}>
                          {((inferenceResult.prediction?.failure_probability || 0.1) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div
                        style={{
                          backgroundColor: getRiskColor(inferenceResult.prediction?.failure_probability || 0.1) + "1A",
                          border: `1px solid ${getRiskColor(inferenceResult.prediction?.failure_probability || 0.1)}`,
                          color: getRiskColor(inferenceResult.prediction?.failure_probability || 0.1),
                          padding: "6px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {inferenceResult.prediction?.risk_level} Risk
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>ESTIMATED TIME TO FAILURE</div>
                      <div style={{ fontSize: 14, color: "#fff", fontWeight: 500 }}>
                        ⏳ ~{inferenceResult.prediction?.predicted_days_to_failure} days
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>RECOMMENDED ACTIONS</div>
                      <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: "20px" }}>
                        {inferenceResult.prediction?.recommended_action}
                      </div>
                    </div>

                    {inferenceResult.rca && inferenceResult.rca.most_probable_root_cause && (
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16, marginTop: 16 }}>
                        <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 6 }}>RCA HISTORICAL LESSONSURFACE</div>
                        <div style={{ fontSize: 13, color: "#fef08a", fontStyle: "italic", marginBottom: 6 }}>
                          "{inferenceResult.rca.most_probable_root_cause}"
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>
                          Confidence: {(inferenceResult.rca.confidence * 100).toFixed(0)}% based on {inferenceResult.rca.similar_historical_cases} historical events.
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={styles.emptyState}>
                    <span>Click 'Evaluate Failure Risk' to feed historian metrics into the Random Forest classification layer.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <span>Select an asset from the registry to assess health, run ML diagnostics, and view incident histories.</span>
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
  leftCol: {
    width: 320,
    borderRight: "1px solid rgba(255, 255, 255, 0.05)",
    display: "flex",
    flexDirection: "column",
    background: "#0c0d12",
  },
  panelHeader: {
    padding: 24,
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  },
  title: {
    fontSize: 16,
    color: "#fff",
    fontWeight: 600,
  },
  subtitle: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  card: {
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    cursor: "pointer",
    transition: "transform 0.15s, border-color 0.15s",
    "&:hover": {
      transform: "translateY(-2px)",
      borderColor: "rgba(255,255,255,0.1)",
    },
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tag: {
    fontSize: 11,
    color: "#818cf8",
    fontWeight: 700,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    padding: "3px 6px",
    borderRadius: 4,
  },
  criticalityBadge: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
  },
  cardName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#f1f5f9",
    marginBottom: 8,
  },
  cardMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
    color: "#64748b",
  },
  rightCol: {
    flex: 1,
    padding: 32,
    overflowY: "auto",
  },
  detailsPanel: {
    height: "100%",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
  },
  glassSection: {
    background: "rgba(18, 19, 28, 0.6)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#fff",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    paddingBottom: 10,
  },
  inputsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 500,
  },
  input: {
    backgroundColor: "#0d0e14",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    padding: 10,
    color: "#fff",
    fontSize: 13,
    outline: "none",
  },
  predictBtn: {
    backgroundColor: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: 12,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 10,
  },
  emptyState: {
    height: 300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
    padding: 40,
    border: "1px dashed rgba(255,255,255,0.05)",
    borderRadius: 16,
  },
  resultBox: {
    backgroundColor: "#0d0e14",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 20,
  },
};

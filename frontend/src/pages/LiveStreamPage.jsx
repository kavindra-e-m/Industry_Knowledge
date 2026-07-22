import { useEffect, useState, useRef } from "react";
import { createWebSocketStream } from "../services/api";

export default function LiveStreamPage() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("connecting");
  const [activeAlerts, setActiveAlerts] = useState([]);
  const wsRef = useRef(null);

  // Default sensor metrics displayed in live tickers
  const [metrics, setMetrics] = useState({
    temperature: 60.5,
    pressure: 1.52,
    current: 5.12,
    voltage: 220.4,
  });

  useEffect(() => {
    // Generate periodic micro-changes to normal metrics to simulate live stream
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        temperature: parseFloat((prev.temperature + (Math.random() - 0.5) * 0.4).toFixed(2)),
        pressure: parseFloat((prev.pressure + (Math.random() - 0.5) * 0.05).toFixed(3)),
        current: parseFloat((prev.current + (Math.random() - 0.5) * 0.1).toFixed(2)),
        voltage: parseFloat((prev.voltage + (Math.random() - 0.5) * 0.6).toFixed(1)),
      }));
    }, 1000);

    // Initialize WebSocket connection
    try {
      const ws = createWebSocketStream(
        (data) => {
          setStatus("connected");
          if (data.type === "stream_event") {
            setMessages((prev) => [data, ...prev].slice(0, 30));
            // Trigger alerts for anomalies
            if (data.payload?.is_anomaly) {
              const newAlert = {
                id: Date.now(),
                tag: data.equipment_tag || "P-101",
                desc: data.payload.recommendation || "Sensor threshold violation",
                time: new Date().toLocaleTimeString(),
              };
              setActiveAlerts((prev) => [newAlert, ...prev].slice(0, 5));
            }
          }
        },
        () => {
          setStatus("error");
        }
      );
      wsRef.current = ws;
      
      ws.onopen = () => setStatus("connected");
      ws.onclose = () => setStatus("disconnected");
    } catch (e) {
      setStatus("error");
    }

    return () => {
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.onopen = () => wsRef.current?.close();
        } else if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      }
      clearInterval(interval);
    };
  }, []);

  const triggerMockAnomaly = async () => {
    // Fire a POST to the ingest stream-event endpoint to trigger anomaly broadcast
    try {
      const payload = {
        event_type: "sensor_snapshot",
        equipment_tag: "P-101",
        payload: {
          is_anomaly: true,
          anomaly_score: 0.85,
          triggered_sensors: ["Pressure", "Current"],
          recommendation: "CRITICAL anomaly detected. Pressure spikes over 4.5 bar! Verify bypass valve.",
        },
      };
      await fetch("http://localhost:8000/api/ingest/stream-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      alert("Failed to trigger mock stream event. Verify FastAPI backend is running.");
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.leftCol}>
        <div style={styles.glassSection}>
          <h3 style={styles.sectionTitle}>Real-time Sensor Tickers</h3>
          <p style={styles.sectionSubtitle}>Injected micro-fluctuations simulating process state.</p>
          
          <div style={styles.tickerGrid}>
            <div style={styles.tickerCard}>
              <div style={styles.tickerName}>🌡️ Process Temperature</div>
              <div style={styles.tickerValue}>{metrics.temperature} °C</div>
            </div>
            <div style={styles.tickerCard}>
              <div style={styles.tickerName}>💨 Discharge Pressure</div>
              <div style={styles.tickerValue}>{metrics.pressure} bar</div>
            </div>
            <div style={styles.tickerCard}>
              <div style={styles.tickerName}>⚡ Phase Current</div>
              <div style={styles.tickerValue}>{metrics.current} A</div>
            </div>
            <div style={styles.tickerCard}>
              <div style={styles.tickerName}>🔌 Line Voltage</div>
              <div style={styles.tickerValue}>{metrics.voltage} V</div>
            </div>
          </div>

          <div style={styles.statusRow}>
            <span>Stream Status:</span>
            <span style={{ 
              color: status === "connected" ? "#10b981" : "#ef4444", 
              fontWeight: 700,
              textTransform: "uppercase",
              fontSize: 12
            }}>
              ● {status}
            </span>
          </div>

          <button onClick={triggerMockAnomaly} style={styles.mockBtn}>
            Inject Mock Sensor Anomaly (Broadcast Alert)
          </button>
        </div>

        {activeAlerts.length > 0 && (
          <div style={styles.alertsPanel} className="animate-slide-in">
            <h3 style={{ fontSize: 14, color: "#f87171", fontWeight: 700, marginBottom: 12 }}>
              🚨 ACTIVE ANOMALY ALERTS (BROADCAST)
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeAlerts.map((alert) => (
                <div key={alert.id} style={styles.alertCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#ef4444", fontWeight: 700 }}>
                    <span>EQUIPMENT: {alert.tag}</span>
                    <span>{alert.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#fff", marginTop: 4, lineHeight: "16px" }}>{alert.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={styles.rightCol}>
        <div style={styles.glassSection} style={{ ...styles.glassSection, height: "100%", overflow: "hidden" }}>
          <h3 style={styles.sectionTitle}>WebSocket Event Logs</h3>
          <p style={styles.sectionSubtitle}>Direct JSON payloads broadcasted on /api/stream/ws stream.</p>

          <div style={styles.logList}>
            {messages.length > 0 ? (
              messages.map((msg, i) => (
                <div key={i} style={styles.logRow} className="animate-slide-in">
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
                    <span>Event Type: <strong>{msg.event_type || msg.type}</strong></span>
                    <span>Tag: {msg.equipment_tag || "N/A"}</span>
                  </div>
                  <pre style={styles.code}>{JSON.stringify(msg.payload || msg, null, 2)}</pre>
                </div>
              ))
            ) : (
              <div style={styles.emptyState}>No event frames received yet. Connect stream and trigger a mock anomaly to view.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "calc(100vh - 70px)",
    display: "flex",
    backgroundColor: "#07080c",
    padding: 32,
    gap: 24,
  },
  leftCol: {
    width: 400,
    display: "flex",
    flexDirection: "column",
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
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#fff",
    fontWeight: 600,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: "#64748b",
  },
  tickerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  tickerCard: {
    backgroundColor: "#0d0e14",
    border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 14,
  },
  tickerName: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  tickerValue: {
    fontSize: 18,
    fontWeight: 700,
    color: "#fff",
    marginTop: 6,
  },
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    color: "#94a3b8",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    paddingTop: 14,
  },
  mockBtn: {
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  alertsPanel: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    border: "1px solid rgba(239, 68, 68, 0.15)",
    borderRadius: 16,
    padding: 20,
  },
  alertCard: {
    backgroundColor: "#0d0e14",
    border: "1px solid rgba(239,68,68,0.15)",
    borderRadius: 8,
    padding: 10,
  },
  rightCol: {
    flex: 1,
  },
  logList: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    maxHeight: "calc(100vh - 180px)",
  },
  logRow: {
    backgroundColor: "#0d0e14",
    border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 14,
  },
  code: {
    fontFamily: "monospace",
    fontSize: 11,
    color: "#a7f3d0",
    marginTop: 6,
    whiteSpace: "pre-wrap",
  },
  emptyState: {
    textAlign: "center",
    padding: 60,
    color: "#64748b",
    fontSize: 13,
  },
};

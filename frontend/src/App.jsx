// PS08 Web Dashboard - Member 3
// Landing shell: swap in real pages (ChatPage, ComplianceReport,
// EquipmentTracker, KnowledgeGraphView) from ./pages as they're built.
import { useState, useEffect } from "react";
import { askQuestion } from "./services/api";
import LiveEvents from "./LiveEvents";

export default function App() {
  const [status, setStatus] = useState("checking backend...");

  useEffect(() => {
    fetch("/health")
      .then((r) => r.json())
      .then((d) => setStatus(d.status))
      .catch(() => setStatus("backend not reachable yet"));
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>PS08 — Industrial Knowledge Intelligence</h1>
      <p>Backend status: {status}</p>
      <LiveEvents />
    </div>
  );
}

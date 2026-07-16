import { useEffect } from "react";
import { useAlertStore } from "../store/alertStore";

const SIMULATED_UPDATES = [
  { equipment_id: "EQ-1042", tag: "PUMP-A1", failure_probability: 0.91, predicted_component: "Mechanical Seal", rul_days: 3, severity: "critical", suggested_work_order: "Seal replacement URGENT — probability increased." },
  { equipment_id: "EQ-2031", tag: "COMP-B3", failure_probability: 0.68, predicted_component: "Bearing Assembly", rul_days: 10, severity: "warning", suggested_work_order: "Bearing inspection within 24 hours." },
  { equipment_id: "EQ-5008", tag: "MOTOR-E1", failure_probability: 0.95, predicted_component: "Rotor Winding", rul_days: 1, severity: "critical", suggested_work_order: "CRITICAL: Shutdown motor immediately." },
];

export function useAlerts() {
  const { alerts, loading, error, lastUpdated, load, pushAlert } = useAlertStore();

  useEffect(() => {
    load();
  }, []);

  // Mock WebSocket: push updated alert every 8 seconds
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      pushAlert({ ...SIMULATED_UPDATES[idx % SIMULATED_UPDATES.length], _live: true });
      idx++;
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return { alerts, loading, error, lastUpdated };
}

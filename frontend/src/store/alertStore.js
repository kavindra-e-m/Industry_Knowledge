import { create } from "zustand";
import { fetchAlerts } from "../api/maintenanceApi";

export const useAlertStore = create((set, get) => ({
  alerts: [],
  loading: false,
  error: null,
  lastUpdated: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchAlerts();
      const alertsArray = Array.isArray(data) ? data : (data?.alerts || data?.overdue_equipment || []);
      set({ alerts: alertsArray, loading: false, lastUpdated: new Date() });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  pushAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...(Array.isArray(state.alerts) ? state.alerts : []).filter((a) => a.equipment_id !== alert.equipment_id)],
      lastUpdated: new Date(),
    })),

  criticalCount: () => {
    const list = Array.isArray(get().alerts) ? get().alerts : [];
    return list.filter((a) => a.severity === "critical" || a.criticality === "High").length;
  },
}));

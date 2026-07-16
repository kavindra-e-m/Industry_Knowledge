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
      set({ alerts: data, loading: false, lastUpdated: new Date() });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  pushAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts.filter((a) => a.equipment_id !== alert.equipment_id)],
      lastUpdated: new Date(),
    })),

  criticalCount: () => get().alerts.filter((a) => a.severity === "critical").length,
}));

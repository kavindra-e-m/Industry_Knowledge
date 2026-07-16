import { create } from "zustand";
import { fetchComplianceReport } from "../api/complianceApi";

export const useComplianceStore = create((set, get) => ({
  records: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchComplianceReport();
      set({ records: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  averageScore: () => {
    const { records } = get();
    if (!records.length) return 0;
    return Math.round(records.reduce((sum, r) => sum + r.overall_score, 0) / records.length);
  },

  nonCompliantCount: () =>
    get().records.filter((r) => r.status === "non-compliant" || r.status === "expired").length,
}));

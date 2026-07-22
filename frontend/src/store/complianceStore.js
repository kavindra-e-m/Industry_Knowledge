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
      const recordsArray = Array.isArray(data) ? data : (data?.results || data?.records || []);
      set({ records: recordsArray, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  averageScore: () => {
    const { records } = get();
    const list = Array.isArray(records) ? records : [];
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, r) => sum + (r.overall_score || 0), 0) / list.length);
  },

  nonCompliantCount: () => {
    const { records } = get();
    const list = Array.isArray(records) ? records : [];
    return list.filter((r) => r.status === "non-compliant" || r.status === "expired" || (r.overall_score && r.overall_score < 70)).length;
  },
}));

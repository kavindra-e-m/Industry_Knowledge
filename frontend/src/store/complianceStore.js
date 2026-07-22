import { create } from "zustand";
import { fetchComplianceReport } from "../api/complianceApi";

export const useComplianceStore = create((set, get) => ({
  records: [],
  summary: {},
  criticalEquipment: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchComplianceReport();
      set({
        records: data.results || [],
        summary: data.summary || {},
        criticalEquipment: data.critical_equipment || [],
        loading: false
      });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  averageScore: () => {
    const { summary } = get();
    return summary?.average_compliance_score || 0;
  },

  nonCompliantCount: () => {
    const { summary } = get();
    return summary?.non_compliant || 0;
  },
}));

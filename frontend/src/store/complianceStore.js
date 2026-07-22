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
      const recordsArray = Array.isArray(data) ? data : (data?.results || data?.records || []);
      const summaryObj = (!Array.isArray(data) && data?.summary) ? data.summary : {};
      const criticalEq = (!Array.isArray(data) && data?.critical_equipment) ? data.critical_equipment : [];
      
      set({
        records: recordsArray,
        summary: summaryObj,
        criticalEquipment: criticalEq,
        loading: false
      });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  averageScore: () => {
    const { summary, records } = get();
    if (summary && summary.average_compliance_score !== undefined) {
      return summary.average_compliance_score;
    }
    const list = Array.isArray(records) ? records : [];
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, r) => sum + (r.overall_score || r.compliance_score || 0), 0) / list.length);
  },

  nonCompliantCount: () => {
    const { summary, records } = get();
    if (summary && summary.non_compliant !== undefined) {
      return summary.non_compliant;
    }
    const list = Array.isArray(records) ? records : [];
    return list.filter((r) => r.status === "non-compliant" || r.status === "expired" || r.overall_status === "non_compliant" || (r.overall_score && r.overall_score < 70) || (r.compliance_score && r.compliance_score < 70)).length;
  },
}));

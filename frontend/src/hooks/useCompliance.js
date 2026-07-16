import { useEffect } from "react";
import { useComplianceStore } from "../store/complianceStore";

export function useCompliance() {
  const { records, loading, error, load, averageScore, nonCompliantCount } = useComplianceStore();

  useEffect(() => {
    if (!records.length) load();
  }, []);

  return { records, loading, error, averageScore: averageScore(), nonCompliantCount: nonCompliantCount() };
}

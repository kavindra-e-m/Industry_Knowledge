import { getComplianceReport, checkEquipmentCompliance, downloadAuditPackage } from "../services/api";

export { getComplianceReport, checkEquipmentCompliance, downloadAuditPackage };
export const runAuditScan = () => getComplianceReport();
export const handleExportAuditPackage = () => downloadAuditPackage();
export const fetchComplianceReport = () => getComplianceReport();

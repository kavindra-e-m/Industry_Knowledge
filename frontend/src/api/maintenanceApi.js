import { getMaintenanceAlerts, predictFailure, getRCAReport, createWorkOrder, getWorkOrders } from "../services/api";

export { getMaintenanceAlerts, predictFailure, getRCAReport, createWorkOrder, getWorkOrders };
export const runFailurePrediction = (tagId) => predictFailure(tagId);
export const submitWorkOrder = (data) => createWorkOrder(data);
export const fetchAlerts = () => getMaintenanceAlerts();

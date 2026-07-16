import maintenanceMock from "../mocks/maintenance.json";

// TODO: Replace mock with axios request to /api/maintenance/alerts

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export async function fetchAlerts() {
  await delay(600);
  return maintenanceMock;
}

export async function fetchAlertById(equipmentId) {
  await delay(300);
  const alert = maintenanceMock.find((a) => a.equipment_id === equipmentId);
  if (!alert) throw new Error(`Alert not found: ${equipmentId}`);
  return alert;
}

export async function submitWorkOrder(equipmentId, notes) {
  await delay(800);
  return { success: true, work_order_id: `WO-${Date.now()}`, equipment_id: equipmentId, notes };
}

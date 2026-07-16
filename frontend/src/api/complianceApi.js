import complianceMock from "../mocks/compliance.json";

// TODO: Replace mock with axios request to /api/compliance/report

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export async function fetchComplianceReport() {
  await delay(700);
  return complianceMock;
}

export async function fetchComplianceById(equipmentId) {
  await delay(300);
  const record = complianceMock.find((c) => c.equipment_id === equipmentId);
  if (!record) throw new Error(`Compliance record not found: ${equipmentId}`);
  return record;
}

export async function exportAuditPackage(equipmentIds) {
  await delay(1200);
  return {
    success: true,
    export_id: `AUD-${Date.now()}`,
    equipment_ids: equipmentIds,
    generated_at: new Date().toISOString(),
    download_url: "#",
  };
}

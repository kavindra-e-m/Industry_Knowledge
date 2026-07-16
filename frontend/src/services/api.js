// Thin fetch wrapper around the backend - keep this the ONLY place
// that knows the API shape, per docs/api-contracts.md.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function askQuestion(question, equipmentId = null) {
  const res = await fetch(`${BASE_URL}/api/query/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, equipment_id: equipmentId }),
  });
  return res.json();
}

export async function getEquipmentHistory(equipmentId) {
  const res = await fetch(`${BASE_URL}/api/graph/equipment/${equipmentId}`);
  return res.json();
}

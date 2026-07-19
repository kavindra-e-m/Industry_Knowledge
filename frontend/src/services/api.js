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

export function createWebSocketStream(onMessage, onError) {
  let wsUrl;
  if (BASE_URL.startsWith("http")) {
    wsUrl = BASE_URL.replace(/^http/, "ws") + "/api/stream/ws";
  } else {
    const loc = window.location;
    const proto = loc.protocol === "https:" ? "wss:" : "ws:";
    wsUrl = `${proto}//${loc.host}/api/stream/ws`;
  }

  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error("Error parsing WebSocket message:", e);
    }
  };

  ws.onerror = (err) => {
    if (onError) onError(err);
  };

  return ws;
}

/**
 * IndustrialBrain API Client
 * Centralized API calls mapping to the FastAPI endpoints.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const WS_URL = BASE_URL.replace(/^http/, "ws");

// Auth token storage
let token = localStorage.getItem("token") || "";

export const setAuthToken = (newToken) => {
  token = newToken;
  if (newToken) {
    localStorage.setItem("token", newToken);
  } else {
    localStorage.removeItem("token");
  }
};

const getHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

// -------------------------------------------------------------
// Authentication
// -------------------------------------------------------------
export async function login(username, password) {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  if (!res.ok) throw new Error("Invalid login credentials");
  const data = await res.json();
  setAuthToken(data.access_token);
  return data;
}

export async function getCurrentUser() {
  if (!token) return { authenticated: false };
  const res = await fetch(`${BASE_URL}/api/auth/me`, { headers: getHeaders() });
  return res.json();
}

// -------------------------------------------------------------
// RAG & Copilot Q&A
// -------------------------------------------------------------
export async function askQuestion(question, equipmentId = null, sensorFeatures = {}) {
  const res = await fetch(`${BASE_URL}/api/query/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      question,
      equipment_id: equipmentId,
      metadata: { sensor_features: sensorFeatures }
    }),
  });
  if (!res.ok) throw new Error("Query execution failed");
  return res.json();
}

// -------------------------------------------------------------
// Equipment & Graph
// -------------------------------------------------------------
export async function getEquipmentList() {
  const res = await fetch(`${BASE_URL}/api/graph/equipment`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch equipment directory");
  return res.json();
}

export async function getEquipmentDetails(equipmentId) {
  const res = await fetch(`${BASE_URL}/api/graph/equipment/${equipmentId}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch tag ${equipmentId} details`);
  return res.json();
}

export async function searchEquipment(query) {
  const res = await fetch(`${BASE_URL}/api/graph/search/${encodeURIComponent(query)}`, { headers: getHeaders() });
  return res.json();
}

// -------------------------------------------------------------
// Predictive Maintenance & RCA
// -------------------------------------------------------------
export async function predictFailure(payload) {
  const res = await fetch(`${BASE_URL}/api/maintenance/predict`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failure prediction calculation failed");
  return res.json();
}

export async function getOverduePM() {
  const res = await fetch(`${BASE_URL}/api/maintenance/overdue`, { headers: getHeaders() });
  return res.json();
}

export async function runRCA(equipmentTag, failureMode) {
  const res = await fetch(`${BASE_URL}/api/maintenance/rca`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ equipment_tag: equipmentTag, failure_mode: failureMode }),
  });
  return res.json();
}

// -------------------------------------------------------------
// Compliance
// -------------------------------------------------------------
export async function getPlantCompliance() {
  const res = await fetch(`${BASE_URL}/api/compliance/plant`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch compliance audit rollup");
  return res.json();
}

export async function checkCompliance(equipmentTag) {
  const res = await fetch(`${BASE_URL}/api/compliance/check`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ equipment_tag: equipmentTag }),
  });
  return res.json();
}

// -------------------------------------------------------------
// Lessons Learned
// -------------------------------------------------------------
export async function getLessonsLearnedWarnings(equipmentTag, failureMode = "") {
  const res = await fetch(`${BASE_URL}/api/lessons/warnings`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ equipment_tag: equipmentTag, failure_mode: failureMode }),
  });
  return res.json();
}

export async function getSystemWidePatterns() {
  const res = await fetch(`${BASE_URL}/api/lessons/patterns`, { headers: getHeaders() });
  return res.json();
}

// -------------------------------------------------------------
// P&ID Analysis
// -------------------------------------------------------------
export async function analyzeDrawingImpact(equipmentTag, failureMode = "") {
  const res = await fetch(`${BASE_URL}/api/pid/impact`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ equipment_tag: equipmentTag, failure_mode: failureMode }),
  });
  if (!res.ok) throw new Error(`P&ID analysis failed for ${equipmentTag}`);
  return res.json();
}

// -------------------------------------------------------------
// WebSocket Live Alert Stream
// -------------------------------------------------------------
export function createWebSocketStream(onMessage, onError) {
  const ws = new WebSocket(`${WS_URL}/api/stream/ws`);
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error("Failed to parse live event data:", e);
    }
  };

  ws.onerror = (err) => {
    if (onError) onError(err);
  };

  return ws;
}

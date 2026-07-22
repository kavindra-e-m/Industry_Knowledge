const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function fetchWithFallback(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: options.isFormData ? {} : { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(err.detail || `HTTP ${response.status}`);
    }
    if (options.responseType === "blob") return await response.blob();
    return await response.json();
  } catch (err) {
    console.error(`[IndustrialBrain API] ${endpoint} failed:`, err.message);
    throw err;
  }
}

export const ingestDocument = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return fetchWithFallback("/api/ingest", { method: "POST", body: fd, isFormData: true });
};

export const ingestPID = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return fetchWithFallback("/api/pid/analyse", { method: "POST", body: fd, isFormData: true });
};

export const queryKnowledgeBase = (question, equipmentTag = null) =>
  fetchWithFallback("/api/query", {
    method: "POST",
    body: JSON.stringify({ question, equipment_tag: equipmentTag }),
  });

export const getMaintenanceAlerts = () => fetchWithFallback("/api/maintenance/alerts");
export const predictFailure = (tagId) => fetchWithFallback(`/api/maintenance/predict/${tagId}`);
export const getRCAReport = (tagId, failureMode = "general_failure") =>
  fetchWithFallback(`/api/maintenance/rca/${tagId}?failure_mode=${failureMode}`);
export const createWorkOrder = (data) =>
  fetchWithFallback("/api/maintenance/work-orders", { method: "POST", body: JSON.stringify(data) });
export const getWorkOrders = () => fetchWithFallback("/api/maintenance/work-orders");

export const getComplianceReport = () => fetchWithFallback("/api/compliance/report");
export const checkEquipmentCompliance = (tagId) => fetchWithFallback(`/api/compliance/check/${tagId}`);
export const exportAuditPackage = () =>
  fetchWithFallback("/api/compliance/audit-package", { method: "POST", body: JSON.stringify({}), responseType: "blob" });

export const downloadAuditPackage = async () => {
  const blob = await exportAuditPackage();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit_package_${new Date().toISOString().split("T")[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const getLessonsWarnings = () => fetchWithFallback("/api/lessons/warnings");
export const getLessonsPatterns = () => fetchWithFallback("/api/lessons/patterns");
export const getEquipmentWarnings = (tagId) => fetchWithFallback(`/api/lessons/warnings/${tagId}`);

export const getEquipmentGraph = (tagId) => fetchWithFallback(`/api/graph/equipment/${tagId}`);
export const getGraphConnections = (tagId) => fetchWithFallback(`/api/graph/connections/${tagId}`);
export const getGraphOverview = () => fetchWithFallback("/api/graph/overview");

export const getPIDImpact = (tagId) => fetchWithFallback(`/api/pid/impact/${tagId}`);
export const getPIDIsolation = (tagId) => fetchWithFallback(`/api/pid/isolation/${tagId}`);

export const getSystemStatus = () => fetchWithFallback("/api/system/status");

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
      if (onMessage) onMessage(data);
    } catch (e) {
      if (onMessage) onMessage(event.data);
    }
  };
  ws.onerror = (err) => {
    if (ws.readyState === WebSocket.OPEN && onError) onError(err);
  };
  return ws;
}

export async function login(username, password) {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);
  return fetchWithFallback("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });
}

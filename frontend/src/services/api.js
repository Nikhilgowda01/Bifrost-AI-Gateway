const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error("Cannot reach the replay backend. Confirm FastAPI is running on port 8000.");
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body.detail || body.error || `Request failed with HTTP ${response.status}.`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return body;
}

export const api = {
  health: () => request("/api/health"),
  analytics: () => request("/api/analytics"),
  requests: () => request("/api/requests"),
  request: (id) => request(`/api/requests/${encodeURIComponent(id)}`),
  execute: (payload) => request("/api/requests/execute", { method: "POST", body: JSON.stringify(payload) }),
  replay: (id, payload = {}) => request(`/api/requests/${encodeURIComponent(id)}/replay`, {
    method: "POST",
    body: JSON.stringify(payload),
  }),
  compare: (id) => request(`/api/requests/${encodeURIComponent(id)}/compare`),
  remove: (id) => request(`/api/requests/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export function formatLatency(value) {
  return value == null ? "—" : `${Number(value).toFixed(value < 100 ? 1 : 0)} ms`;
}

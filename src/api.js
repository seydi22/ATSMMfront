const TOKEN_KEY = "ats_portal_token";

// En production VM (nginx ou SERVE_FRONTEND) : URL relative → même origine.
// Surcharge possible via VITE_API_URL (ex. backend séparé).
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const url = `${API_BASE}/api${path}`;
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Erreur ${res.status}`);
  }
  return data;
}

export const api = {
  login: (username, password) =>
    request("/auth/login", { method: "POST", body: { username, password } }),
  me: () => request("/auth/me"),
  listJournees: () => request("/journees"),
  getJournee: (id) => request(`/journees/${id}`),
  uploadExcel: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return request("/journees/upload", { method: "POST", body: fd });
  },
  envoyerDemandeOv: (id) =>
    request(`/journees/${id}/envoyer-demande-ov`, { method: "POST" }),
  uploadOv: (id, file) => {
    const fd = new FormData();
    fd.append("ov", file);
    return request(`/journees/${id}/upload-ov`, { method: "POST", body: fd });
  },
  getSettings: () => request("/settings"),
  saveSettings: (body) => request("/settings", { method: "PUT", body }),
  deleteJournee: (id) => request(`/journees/${id}`, { method: "DELETE" }),
};

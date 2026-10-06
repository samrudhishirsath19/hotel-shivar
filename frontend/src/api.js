// Base URL of the Spring Boot backend. Override with VITE_API_URL in a .env file if needed.
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const TOKEN_KEY = "hs_admin_token";

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function saveToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage blocked */ }
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
}

// fetch wrapper: adds the login token and turns non-2xx answers into thrown Errors
// (err.message is the text from the backend, err.status the HTTP status; status 0 = server not reachable).
export async function apiFetch(path, options = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    const err = new Error("Cannot reach the server. Please check that the backend is running.");
    err.status = 0;
    throw err;
  }

  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    let msg = "Request failed (" + res.status + ")";
    if (data && data.errors && typeof data.errors === "object") msg = Object.values(data.errors).join(". ");
    else if (data && data.message) msg = data.message;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Upload one file (multipart). Answers like apiFetch; used for room photos.
export async function apiUpload(path, file) {
  const token = getToken();
  const body = new FormData();
  body.append("file", file);
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      body,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    const err = new Error("Cannot reach the server. Please check that the backend is running.");
    err.status = 0;
    throw err;
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error((data && data.message) || "Upload failed (" + res.status + ")");
    err.status = res.status;
    throw err;
  }
  return data;
}

// Images uploaded to the backend are stored as "/uploads/..." - they live on the backend server.
export const imgUrl = (url) => (url && url.startsWith("/uploads/") ? API_BASE + url : url);

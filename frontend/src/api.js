// Address of the Spring Boot backend.
//  - development (npm run dev): "" = same address as the page; Vite forwards /api and /uploads to the
//    backend (see vite.config.js), so the browser makes no cross-origin calls.
//  - production build: VITE_API_URL from a .env file, or http://localhost:8080.
export const API_BASE = import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL || "http://localhost:8080";

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

const UNREACHABLE = "Cannot reach the server. Please check that the backend is running.";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// One request. Returns the Response, or null when the backend could not be reached
// (no answer at all, or the dev proxy answering 5xx without a body because the backend is down / restarting).
async function send(url, init) {
  try {
    const res = await fetch(url, init);
    if (res.status >= 500 && !(res.headers.get("content-type") || "").includes("json")) return null;
    return res;
  } catch {
    return null;
  }
}

// fetch wrapper: adds the login token and turns non-2xx answers into thrown Errors
// (err.message is the text from the backend, err.status the HTTP status; status 0 = server not reachable).
export async function apiFetch(path, options = {}) {
  const token = getToken();
  const init = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  };
  let res = await send(`${API_BASE}${path}`, init);
  // The backend restarts for a few seconds after code changes (Spring DevTools): try reads and the
  // login once more before giving up. Other changes are not repeated, so nothing is done twice.
  const method = (options.method || "GET").toUpperCase();
  if (!res && (method === "GET" || path === "/api/auth/login")) {
    await wait(2000);
    res = await send(`${API_BASE}${path}`, init);
  }
  if (!res) {
    const err = new Error(UNREACHABLE);
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

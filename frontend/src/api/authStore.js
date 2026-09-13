import { API_BASE_URL, API_KEY } from "./config";

const STORAGE_KEY = "ivy_homes_auth";
const REFRESH_SKEW_MS = 60_000;

let state = load();
let refreshTimer = null;
let refreshInFlight = null;
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persist(next) {
  state = next;
  if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  else localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((fn) => fn(state));
}

export function getAuthState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function scheduleRefresh(next) {
  if (refreshTimer) clearTimeout(refreshTimer);
  const delay = Math.max(next.expiresAt - Date.now() - REFRESH_SKEW_MS, 5_000);
  refreshTimer = setTimeout(() => {
    refreshAccessToken().catch(() => logout());
  }, delay);
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || `Login failed (${res.status})`);

  const next = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    user: data.user,
  };
  persist(next);
  scheduleRefresh(next);
  return next;
}

export async function refreshAccessToken() {
  if (!state?.refreshToken) throw new Error("No refresh token available");
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
      body: JSON.stringify({ refresh_token: state.refreshToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || `Refresh failed (${res.status})`);

    const next = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      user: state.user,
    };
    persist(next);
    scheduleRefresh(next);
    return next;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export function logout() {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = null;
  persist(null);
}

if (state) {
  if (state.expiresAt - Date.now() < REFRESH_SKEW_MS) {
    refreshAccessToken().catch(() => logout());
  } else {
    scheduleRefresh(state);
  }
}

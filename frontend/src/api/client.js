import { API_BASE_URL, API_KEY } from "./config";
import { getAuthState, refreshAccessToken, logout } from "./authStore";

async function rawFetch(path, options, token) {
  const headers = { "X-API-Key": API_KEY, ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}

export async function apiFetch(path, options = {}) {
  const auth = getAuthState();
  let res = await rawFetch(path, options, auth?.accessToken);

  if (res.status === 401 && auth?.refreshToken) {
    try {
      const refreshed = await refreshAccessToken();
      res = await rawFetch(path, options, refreshed.accessToken);
    } catch {
      logout();
    }
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return body;
}

export async function fetchAllPages(path, { limit = 200, params = {} } = {}) {
  const results = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const search = new URLSearchParams({ ...params, limit, offset });
    const page = await apiFetch(`${path}?${search.toString()}`);
    results.push(...page.results);
    hasMore = page.has_more;
    offset += page.limit;
  }

  return results;
}

/**
 * API client and WebSocket helper functions.
 * Uses fetch with JSON helpers and includes auth token automatically.
 */

import ReconnectingWebSocket from "reconnecting-websocket";
import { useAuthStore } from "../state/authStore";

/** INTERNAL: get current token without hook */
function getToken() {
  try {
    const { token } = useAuthStore.getState();
    return token || null;
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export async function apiRequest(path, { method = "GET", body, headers = {}, apiBase } = {}) {
  /**
   * Make an authenticated JSON request to backend.
   * - path: string, relative path (e.g., "/auth/login")
   * - method: HTTP method
   * - body: object to JSON.stringify
   * - headers: extra headers
   * - apiBase: base URL
   */
  const url = `${apiBase || (process.env.REACT_APP_API_BASE || "/api")}${path}`;
  const token = getToken();
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  };
  const res = await fetch(url, opts);
  let data;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// PUBLIC_INTERFACE
export function createWS(path, { wsBase, params = {} } = {}) {
  /**
   * Create a reconnecting WebSocket with auth token query param.
   * Returns { socket, url }
   */
  const token = getToken();
  const fallback = process.env.REACT_APP_API_BASE || "/api";
  const base = wsBase || process.env.REACT_APP_WS_BASE || (fallback.startsWith("http") ? fallback.replace(/^http/, "ws") : "/ws");
  const query = new URLSearchParams({ ...(token ? { token } : {}), ...params });
  const url = `${base}${path}?${query.toString()}`;
  const socket = new ReconnectingWebSocket(url, [], { maxRetries: Infinity });
  return { socket, url };
}

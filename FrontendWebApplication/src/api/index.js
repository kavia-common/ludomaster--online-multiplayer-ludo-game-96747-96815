/**
 * High-level API wrappers mapping to backend endpoints.
 */
// AUTH
// PUBLIC_INTERFACE
export const AuthAPI = {
  /** Login with email or mobile and password. */
  login: async (payload, apiBase) => {
    const res = await fetch(`${apiBase || process.env.REACT_APP_API_BASE || "/api"}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Login failed");
    return res.json();
  },
  /** Register a new account */
  register: async (payload, apiBase) => {
    const res = await fetch(`${apiBase || process.env.REACT_APP_API_BASE || "/api"}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Register failed");
    return res.json();
  },
  /** Get current profile using token */
  me: async (apiBase) => {
    const res = await fetch(`${apiBase || process.env.REACT_APP_API_BASE || "/api"}/auth/me`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to load profile");
    return res.json();
  },
};

// PROFILE
// PUBLIC_INTERFACE
export const ProfileAPI = {
  get: async (apiBase) => {
    const res = await fetch(`${apiBase || process.env.REACT_APP_API_BASE || "/api"}/profile`, { headers: authHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to load profile");
    return res.json();
  },
  update: async (payload, apiBase) => {
    const res = await fetch(`${apiBase || process.env.REACT_APP_API_BASE || "/api"}/profile`, {
      method: "PUT",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to update profile");
    return res.json();
  },
  setAvatar: async (base64, apiBase) => {
    const res = await fetch(`${apiBase || process.env.REACT_APP_API_BASE || "/api"}/profile/avatar`, {
      method: "PUT",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 }),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to set avatar");
    return res.json();
  },
};

// ROOMS
// PUBLIC_INTERFACE
export const RoomsAPI = {
  list: async (apiBase) => {
    const res = await fetch(`${apiBase || process.env.REACT_APP_API_BASE || "/api"}/rooms`, { headers: authHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to list rooms");
    return res.json();
  },
  create: async (payload, apiBase) => {
    const res = await fetch(`${apiBase || process.env.REACT_APP_API_BASE || "/api"}/rooms`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to create room");
    return res.json();
  },
  join: async (roomId, payload, apiBase) => {
    const res = await fetch(`${apiBase || process.env.REACT_APP_API_BASE || "/api"}/rooms/${roomId}/join`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to join room");
    return res.json();
  },
  leave: async (roomId, apiBase) => {
    const res = await fetch(`${apiBase || process.env.REACT_APP_API_BASE || "/api"}/rooms/${roomId}/leave`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to leave room");
    return res.json();
  },
  detail: async (roomId, apiBase) => {
    const res = await fetch(`${apiBase || process.env.REACT_APP_API_BASE || "/api"}/rooms/${roomId}`, { headers: authHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch room");
    return res.json();
  },
};

/** GAME **/
export const GameAPI = {
  roll: async (roomId, apiBase) => {
    const res = await fetch(`${apiBase || process.env.REACT_APP_API_BASE || "/api"}/game/${roomId}/roll`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to roll");
    return res.json();
  },
  move: async (roomId, payload, apiBase) => {
    const res = await fetch(`${apiBase || process.env.REACT_APP_API_BASE || "/api"}/game/${roomId}/move`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to move");
    return res.json();
  },
  startSolo: async (apiBase) => {
    const res = await fetch(`${apiBase || process.env.REACT_APP_API_BASE || "/api"}/game/solo`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to start solo");
    return res.json();
  },
};

/** STATS **/
export const StatsAPI = {
  leaderboard: async (apiBase) => {
    const res = await fetch(`${apiBase || process.env.REACT_APP_API_BASE || "/api"}/stats/leaderboard`, { headers: authHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to load leaderboard");
    return res.json();
  },
  history: async (apiBase) => {
    const res = await fetch(`${apiBase || process.env.REACT_APP_API_BASE || "/api"}/stats/history`, { headers: authHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to load history");
    return res.json();
  },
};

// Helpers
function authHeaders() {
  try {
    const token = JSON.parse(localStorage.getItem("ludomaster_auth") || "{}").state?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/**
 * High-level API wrappers mapping to backend endpoints.
 */
import { apiRequest } from "./client";

// AUTH
// PUBLIC_INTERFACE
export const AuthAPI = {
  /** Login with email or mobile and password. */
  login: (payload, apiBase) => apiRequest("/auth/login", { method: "POST", body: payload, apiBase }),
  /** Register a new account */
  register: (payload, apiBase) => apiRequest("/auth/register", { method: "POST", body: payload, apiBase }),
  /** Get current profile using token */
  me: (apiBase) => apiRequest("/auth/me", { apiBase }),
};

// PROFILE
// PUBLIC_INTERFACE
export const ProfileAPI = {
  get: (apiBase) => apiRequest("/profile", { apiBase }),
  update: (payload, apiBase) => apiRequest("/profile", { method: "PUT", body: payload, apiBase }),
  /** Upload avatar via base64 content to keep FE simple in this template */
  setAvatar: (base64, apiBase) => apiRequest("/profile/avatar", { method: "PUT", body: { image: base64 }, apiBase }),
};

// ROOMS
// PUBLIC_INTERFACE
export const RoomsAPI = {
  list: (apiBase) => apiRequest("/rooms", { apiBase }),
  create: (payload, apiBase) => apiRequest("/rooms", { method: "POST", body: payload, apiBase }),
  join: (roomId, payload, apiBase) => apiRequest(`/rooms/${roomId}/join`, { method: "POST", body: payload, apiBase }),
  leave: (roomId, apiBase) => apiRequest(`/rooms/${roomId}/leave`, { method: "POST", apiBase }),
  detail: (roomId, apiBase) => apiRequest(`/rooms/${roomId}`, { apiBase }),
};

// GAME
// PUBLIC_INTERFACE
export const GameAPI = {
  /** Request a dice roll (if backend allows via REST) */
  roll: (roomId, apiBase) => apiRequest(`/game/${roomId}/roll`, { method: "POST", apiBase }),
  /** Make a move for a piece */
  move: (roomId, payload, apiBase) => apiRequest(`/game/${roomId}/move`, { method: "POST", body: payload, apiBase }),
  /** For solo vs AI, create a local session on backend */
  startSolo: (apiBase) => apiRequest("/game/solo", { method: "POST", apiBase }),
};

// STATS
// PUBLIC_INTERFACE
export const StatsAPI = {
  leaderboard: (apiBase) => apiRequest("/stats/leaderboard", { apiBase }),
  history: (apiBase) => apiRequest("/stats/history", { apiBase }),
};

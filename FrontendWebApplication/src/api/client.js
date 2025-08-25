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
  const base = wsBase || process.env.REACT_APP_WS_BASE || (process.env.REACT_APP_API_BASE || "/api").replace(/^http/, "ws");
  const query = new URLSearchParams({ ...(token ? { token } : {}), ...params });
  const url = `${base}${path}?${query.toString()}`;
  const socket = new ReconnectingWebSocket(url, [], { maxRetries: Infinity });
  return { socket, url };
}
```

Explanation: Add auth, rooms, game, stats API surface.
````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/api/index.js"
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
```

Explanation: Add Zustand stores for auth, rooms, game, and UI to hold state cleanly.
````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/state/authStore.js"
import { create } from "zustand";
import jwtDecode from "jwt-decode";
import { AuthAPI } from "../api";
import { persist } from "zustand/middleware";

// PUBLIC_INTERFACE
export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      // PUBLIC_INTERFACE
      async login(credentials, apiBase) {
        const data = await AuthAPI.login(credentials, apiBase);
        const token = data?.token;
        const user = data?.user || (token ? safeDecode(token) : null);
        set({ token, user });
        return { token, user };
      },
      // PUBLIC_INTERFACE
      async register(payload, apiBase) {
        const data = await AuthAPI.register(payload, apiBase);
        const token = data?.token;
        const user = data?.user || (token ? safeDecode(token) : null);
        set({ token, user });
        return { token, user };
      },
      // PUBLIC_INTERFACE
      async refreshMe(apiBase) {
        const me = await AuthAPI.me(apiBase);
        set({ user: me });
        return me;
      },
      // PUBLIC_INTERFACE
      logout() {
        set({ token: null, user: null });
      },
      // PUBLIC_INTERFACE
      restore() {
        const { token, user } = get();
        if (token && !user) {
          try {
            const u = safeDecode(token);
            set({ user: u });
          } catch {
            set({ token: null, user: null });
          }
        }
      },
    }),
    { name: "ludomaster_auth" }
  )
);

function safeDecode(token) {
  try {
    const decoded = jwtDecode(token);
    return {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      displayName: decoded.name || decoded.displayName || decoded.email,
      avatarUrl: decoded.avatarUrl || null,
    };
  } catch {
    return null;
  }
}
```

````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/state/roomsStore.js"
import { create } from "zustand";
import { RoomsAPI } from "../api";

// PUBLIC_INTERFACE
export const useRoomsStore = create((set, get) => ({
  rooms: [],
  loading: false,
  error: null,
  // PUBLIC_INTERFACE
  async fetchRooms(apiBase) {
    set({ loading: true, error: null });
    try {
      const data = await RoomsAPI.list(apiBase);
      set({ rooms: data || [], loading: false });
    } catch (e) {
      set({ error: e.message || "Failed to load rooms", loading: false });
    }
  },
  // PUBLIC_INTERFACE
  async createRoom(payload, apiBase) {
    const room = await RoomsAPI.create(payload, apiBase);
    set({ rooms: [room, ...get().rooms] });
    return room;
  },
}));
```

````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/state/gameStore.js"
import { create } from "zustand";

// Lightweight Ludo state for board rendering and local AI (very basic).
// PUBLIC_INTERFACE
export const useGameStore = create((set, get) => ({
  roomId: null,
  mode: "solo", // "solo" | "multiplayer"
  turn: 0, // player index 0..3
  dice: null,
  players: [
    { id: "red", color: "#ff4d4f", pieces: [0,0,0,0], home: 0 },
    { id: "green", color: "#34d399", pieces: [0,0,0,0], home: 0 },
    { id: "yellow", color: "#fbbf24", pieces: [0,0,0,0], home: 0 },
    { id: "blue", color: "#60a5fa", pieces: [0,0,0,0], home: 0 },
  ],
  log: [],
  // PUBLIC_INTERFACE
  reset(mode = "solo") {
    set({
      roomId: null,
      mode,
      turn: 0,
      dice: null,
      players: [
        { id: "red", color: "#ff4d4f", pieces: [0,0,0,0], home: 0 },
        { id: "green", color: "#34d399", pieces: [0,0,0,0], home: 0 },
        { id: "yellow", color: "#fbbf24", pieces: [0,0,0,0], home: 0 },
        { id: "blue", color: "#60a5fa", pieces: [0,0,0,0], home: 0 },
      ],
      log: [],
    });
  },
  // PUBLIC_INTERFACE
  setRoom(roomId, mode) { set({ roomId, mode }); },
  // PUBLIC_INTERFACE
  setDice(val) { set({ dice: val }); },
  // PUBLIC_INTERFACE
  appendLog(msg) { set({ log: [...get().log, msg] }); },
  // PUBLIC_INTERFACE
  nextTurn() { set({ turn: (get().turn + 1) % 4 }); },
  // PUBLIC_INTERFACE - simplistic move rules for demo rendering
  movePiece(playerIndex, pieceIndex, steps) {
    const players = [...get().players];
    const cur = { ...players[playerIndex] };
    const newVal = Math.min(57, cur.pieces[pieceIndex] + steps); // typical 57 steps to home in Ludo
    cur.pieces = cur.pieces.map((v, i) => (i === pieceIndex ? newVal : v));
    players[playerIndex] = cur;
    set({ players });
  },
}));
```

Explanation: Add common components: Toast system, FormField, AvatarPicker, ChatPanel, Board rendering, Dice, and utility hooks.
````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/components/Toast.jsx"
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastCtx = createContext(null);

// PUBLIC_INTERFACE
export function ToastViewport() {
  const { toasts, remove } = useToasts();
  return (
    <div aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div key={t.id} className="toast" role="status">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <strong>{t.title}</strong>
              {t.message ? <div className="muted">{t.message}</div> : null}
            </div>
            <button className="btn" onClick={() => remove(t.id)} aria-label="Close notification">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((title, message = "") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  const value = useMemo(() => ({ toasts, add, remove }), [toasts, add, remove]);
  return <ToastCtx.Provider value={value}>{children}</ToastCtx.Provider>;
}

// PUBLIC_INTERFACE
export function useToasts() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    // In case provider isn't wrapped (e.g., tests), provide a no-op.
    return { toasts: [], add: () => {}, remove: () => {}, announce: (msg) => console.log("[toast]", msg) };
  }
  return { ...ctx, announce: (msg) => ctx.add("Announcement", msg) };
}
```

````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/components/FormField.jsx"
import React from "react";

// PUBLIC_INTERFACE
export default function FormField({ id, label, help, error, children, required }) {
  return (
    <div className="card" role="group" aria-labelledby={`${id}-label`}>
      <label id={`${id}-label`} htmlFor={id} style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
        {label} {required ? <span aria-hidden="true" title="Required">*</span> : null}
      </label>
      {children}
      {help && <div id={`${id}-help`} className="muted" style={{ marginTop: 6 }}>{help}</div>}
      {error && <div role="alert" style={{ color: "#ff9aa2", marginTop: 6 }}>{error}</div>}
    </div>
  );
}
```

````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/components/AvatarPicker.jsx"
import React, { useRef } from "react";

// PUBLIC_INTERFACE
export default function AvatarPicker({ value, onChange }) {
  const fileRef = useRef(null);
  const pick = () => fileRef.current?.click();

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result);
    };
    reader.readAsDataURL(f);
  };

  return (
    <div className="row">
      <div className="card" style={{ width: 96, height: 96, display: "grid", placeItems: "center" }}>
        {value ? <img src={value} alt="Selected avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} /> : "No avatar"}
      </div>
      <div className="row">
        <button className="btn" onClick={pick}>Choose Avatar</button>
        <input type="file" accept="image/*" ref={fileRef} onChange={onFile} className="sr-only" aria-hidden />
        {value && <button className="btn danger" onClick={() => onChange("")}>Remove</button>}
      </div>
    </div>
  );
}
```

````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/components/ChatPanel.jsx"
import React, { useEffect, useRef, useState } from "react";

// PUBLIC_INTERFACE
export default function ChatPanel({ socket, onSend }) {
  const [text, setText] = useState("");
  const [log, setLog] = useState([]);
  const endRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    const handler = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "chat") {
          setLog((l) => [...l, msg]);
        } else if (msg.type === "system") {
          setLog((l) => [...l, { ...msg, system: true }]);
        }
      } catch {
        // ignore
      }
    };
    socket.addEventListener("message", handler);
    return () => socket.removeEventListener("message", handler);
  }, [socket]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const send = () => {
    const content = text.trim();
    if (!content) return;
    onSend?.(content);
    setText("");
  };

  return (
    <div className="chat-box" aria-label="In-game chat">
      <div className="chat-log card" role="log" aria-live="polite" aria-relevant="additions">
        {log.map((m, i) => (
          <div key={i} className="row">
            <span className="badge">{m.system ? "System" : m.from || "Player"}</span>
            <span>{m.content}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="chat-input-row">
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          aria-label="Chat message"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
        />
        <button className="btn primary" onClick={send} aria-label="Send chat message">Send</button>
      </div>
    </div>
  );
}
```

````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/components/LudoBoard.jsx"
import React from "react";
import { useGameStore } from "../state/gameStore";

// PUBLIC_INTERFACE
export default function LudoBoard() {
  const { players } = useGameStore();

  // Render a simplified 15x15 grid with pieces rendered in corners and on a conceptual path.
  const cells = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const idx = r * 15 + c;
      const isPath = r === 7 || c === 7; // conceptual cross path
      cells.push(<div key={idx} className={`cell ${isPath ? "path" : ""}`} aria-hidden="true" />);
    }
  }

  const renderPieces = () => {
    // Place pieces around corners for demo, based on their progress (0..57)
    return players.map((p, pi) =>
      p.pieces.map((progress, pj) => {
        // Map progress to a position along the cross for visualization
        const t = Math.min(progress, 57) / 57;
        const row = 7;
        const col = Math.round(1 + t * 13);
        const top = 8 + row * (100/15) + (pj%2 ? -2 : 2);
        const left = 8 + col * (100/15) + (Math.floor(pj/2) ? -2 : 2);
        return (
          <div
            key={`${pi}-${pj}`}
            className="piece"
            style={{
              position: "absolute",
              top: `calc(${top}% - 16px)`,
              left: `calc(${left}% - 16px)`,
              background: p.color,
            }}
            role="img"
            aria-label={`${p.id} piece ${pj+1} progress ${progress}`}
          />
        );
      })
    );
  };

  return (
    <div className="ludo-board" aria-label="Ludo board">
      <div className="ludo-grid">{cells}</div>
      {renderPieces()}
    </div>
  );
}
```

````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/components/Dice.jsx"
import React from "react";

// PUBLIC_INTERFACE
export default function Dice({ value, onRoll, disabled }) {
  return (
    <div role="group" aria-label="Dice">
      <div className="dice" aria-live="polite" aria-atomic="true" title="Dice value">
        {value ?? "–"}
      </div>
      <div className="space" />
      <button className="btn primary" onClick={onRoll} disabled={disabled} aria-disabled={disabled} aria-label="Roll dice">
        Roll
      </button>
    </div>
  );
}
```

Explanation: Add pages for Home, Auth (Login/Register), Profile, Rooms, RoomDetail, Leaderboard, History, and Game page integrating WebSockets and board.
````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/pages/Home.jsx"
import React from "react";
import { Link } from "react-router-dom";

// PUBLIC_INTERFACE
export default function Home() {
  return (
    <div className="grid cols-2">
      <div className="card">
        <h2>Play Ludo</h2>
        <p className="muted">Create or join rooms with friends, or play solo vs a smart AI.</p>
        <div className="row">
          <Link className="btn primary" to="/rooms/create">Create Room</Link>
          <Link className="btn" to="/rooms">Browse Rooms</Link>
          <Link className="btn" to="/game/solo">Solo vs AI</Link>
        </div>
      </div>
      <div className="card">
        <h2>Compete</h2>
        <p className="muted">Climb the leaderboard, view your match history, and improve your stats.</p>
        <div className="row">
          <Link className="btn" to="/leaderboard">Leaderboard</Link>
          <Link className="btn" to="/history">Match History</Link>
        </div>
      </div>
    </div>
  );
}
```

````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/pages/auth/Login.jsx"
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormField from "../../components/FormField";
import { useAuthStore } from "../../state/authStore";

// PUBLIC_INTERFACE
export default function Login({ apiBase, onSuccess }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(s => s.login);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login({ identifier, password }, apiBase);
      onSuccess?.();
      navigate("/");
    } catch (e) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="grid cols-1" onSubmit={submit} aria-labelledby="login-title">
      <h1 id="login-title">Login</h1>
      <FormField id="identifier" label="Email or Mobile" required error={!identifier && err ? "Please enter your email or mobile" : ""}>
        <input id="identifier" className="input" value={identifier} onChange={(e)=>setIdentifier(e.target.value)} placeholder="you@example.com or +123456789" />
      </FormField>
      <FormField id="password" label="Password" required error={!password && err ? "Password is required" : ""}>
        <input id="password" type="password" className="input" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" />
      </FormField>
      {err && <div role="alert" className="card" style={{ borderColor: "#4a1d1f", background: "#271314" }}>{err}</div>}
      <div className="row">
        <button className="btn primary" type="submit" disabled={loading} aria-busy={loading}>{loading ? "Signing in…" : "Login"}</button>
      </div>
    </form>
  );
}
```

````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/pages/auth/Register.jsx"
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormField from "../../components/FormField";
import { useAuthStore } from "../../state/authStore";

// PUBLIC_INTERFACE
export default function Register({ apiBase, onSuccess }) {
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const register = useAuthStore(s => s.register);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await register({ email, mobile, displayName, password }, apiBase);
      onSuccess?.();
      navigate("/profile");
    } catch (e) {
      setErr(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="grid cols-1" onSubmit={submit} aria-labelledby="register-title">
      <h1 id="register-title">Create an account</h1>
      <FormField id="displayName" label="Display Name" help="Shown to other players." required>
        <input id="displayName" className="input" value={displayName} onChange={(e)=>setDisplayName(e.target.value)} placeholder="PlayerOne" />
      </FormField>
      <FormField id="email" label="Email" required>
        <input id="email" className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" />
      </FormField>
      <FormField id="mobile" label="Mobile (optional)">
        <input id="mobile" className="input" value={mobile} onChange={(e)=>setMobile(e.target.value)} placeholder="+123456789" />
      </FormField>
      <FormField id="password" label="Password" required>
        <input id="password" className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" />
      </FormField>
      {err && <div role="alert" className="card" style={{ borderColor: "#4a1d1f", background: "#271314" }}>{err}</div>}
      <div className="row">
        <button className="btn primary" type="submit" disabled={loading} aria-busy={loading}>{loading ? "Creating…" : "Register"}</button>
      </div>
    </form>
  );
}
```

````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/pages/Profile.jsx"
import React, { useEffect, useState } from "react";
import AvatarPicker from "../components/AvatarPicker";
import FormField from "../components/FormField";
import { useAuthStore } from "../state/authStore";
import { ProfileAPI } from "../api";

// PUBLIC_INTERFACE
export default function Profile({ apiBase }) {
  const { user, refreshMe } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [avatar, setAvatar] = useState(user?.avatarUrl || "");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const p = await ProfileAPI.get(apiBase);
        setDisplayName(p.displayName || displayName);
        setAvatar(p.avatarUrl || avatar);
        setBio(p.bio || "");
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await ProfileAPI.update({ displayName, bio }, apiBase);
      if (avatar) await ProfileAPI.setAvatar(avatar, apiBase);
      await refreshMe(apiBase);
      setMsg("Profile updated.");
    } catch (e) {
      setMsg(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="grid cols-2" onSubmit={save} aria-labelledby="profile-title">
      <h1 id="profile-title" style={{ gridColumn: "1 / -1" }}>Your Profile</h1>
      <div className="card">
        <FormField id="displayName" label="Display Name" required>
          <input id="displayName" className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </FormField>
        <div className="space" />
        <FormField id="bio" label="Bio">
          <textarea id="bio" className="textarea" rows={5} value={bio} onChange={(e)=>setBio(e.target.value)} />
        </FormField>
      </div>
      <div className="card">
        <h3>Avatar</h3>
        <AvatarPicker value={avatar} onChange={setAvatar} />
      </div>
      <div style={{ gridColumn: "1 / -1" }} className="row">
        <button className="btn primary" type="submit" disabled={saving} aria-busy={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
        {msg && <div role="status" className="badge">{msg}</div>}
      </div>
    </form>
  );
}
```

````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/pages/Rooms.jsx"
import React, { useEffect, useState } from "react";
import FormField from "../components/FormField";
import { useRoomsStore } from "../state/roomsStore";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../state/authStore";

// PUBLIC_INTERFACE
export default function Rooms({ apiBase, mode }) {
  const { rooms, fetchRooms, createRoom, loading, error } = useRoomsStore();
  const { user } = useAuthStore();
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => { fetchRooms(apiBase); }, [apiBase, fetchRooms]);

  const create = async (e) => {
    e.preventDefault();
    const room = await createRoom({ name, isPrivate, password: isPrivate ? password : undefined }, apiBase);
    navigate(`/rooms/${room.id || room._id || room.roomId}`);
  };

  if (mode === "create") {
    return (
      <form className="grid cols-1" onSubmit={create}>
        <h1>Create Room</h1>
        <FormField id="name" label="Room Name" required>
          <input id="name" className="input" value={name} onChange={(e)=>setName(e.target.value)} />
        </FormField>
        <div className="row">
          <label className="row">
            <input type="checkbox" checked={isPrivate} onChange={(e)=>setIsPrivate(e.target.checked)} aria-label="Private room" />
            Private room
          </label>
          {isPrivate && (
            <input className="input" placeholder="Room password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          )}
        </div>
        {!user && <div role="alert" className="badge">You will need to login to manage the room.</div>}
        <div className="row">
          <button className="btn primary" type="submit">Create</button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <h1>Rooms</h1>
      {loading && <div role="status" className="badge">Loading rooms…</div>}
      {error && <div role="alert" className="badge" style={{ background: "#40252a", borderColor: "#5a3037" }}>{error}</div>}
      <div className="grid cols-3">
        {rooms.map(r => (
          <div className="card" key={r.id || r._id}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{r.name}</strong>
              {r.isPrivate ? <span className="badge">Private</span> : <span className="badge">Public</span>}
            </div>
            <div className="muted">{(r.players?.length || 0)} / {(r.capacity || 4)} players</div>
            <div className="space" />
            <div className="row">
              <button className="btn primary" onClick={() => navigate(`/rooms/${r.id || r._id}`)}>Join</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/pages/RoomDetail.jsx"
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RoomsAPI } from "../api";
import { createWS } from "../api/client";
import ChatPanel from "../components/ChatPanel";
import { useAuthStore } from "../state/authStore";

// PUBLIC_INTERFACE
export default function RoomDetail({ apiBase, wsBase }) {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [password, setPassword] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const load = async () => {
    try {
      const r = await RoomsAPI.detail(roomId, apiBase);
      setRoom(r);
    } catch (e) {
      setError(e.message || "Failed to load room");
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [roomId]);

  const join = async () => {
    setError(""); setJoining(true);
    try {
      await RoomsAPI.join(roomId, { password: password || undefined }, apiBase);
      setJoining(false);
      navigate(`/game/${roomId}`);
    } catch (e) {
      setError(e.message || "Join failed");
      setJoining(false);
    }
  };

  useEffect(() => {
    if (!roomId) return;
    const { socket: ws } = createWS(`/rooms/${roomId}`, { wsBase });
    setSocket(ws);
    return () => ws.close();
  }, [roomId, wsBase]);

  const sendChat = (content) => {
    socket?.send(JSON.stringify({ type: "chat", content }));
  };

  if (!room) return <div role="status" className="badge">Loading…</div>;

  return (
    <div className="grid cols-2">
      <div className="card">
        <h2>{room.name}</h2>
        <div className="row">
          <span className="badge">{room.isPrivate ? "Private" : "Public"}</span>
          <span className="badge">{(room.players?.length || 0)} / {(room.capacity || 4)} players</span>
        </div>
        <div className="space" />
        {room.isPrivate && (
          <div className="row">
            <input className="input" placeholder="Room password" value={password} onChange={(e)=>setPassword(e.target.value)} aria-label="Room password" />
          </div>
        )}
        <div className="row">
          <button className="btn primary" onClick={join} disabled={joining} aria-busy={joining}>
            {joining ? "Joining…" : "Join Room"}
          </button>
          {user?.id === room.ownerId && <button className="btn">Start Game</button>}
        </div>
        {error && <div role="alert" className="badge" style={{ background: "#40252a", borderColor: "#5a3037" }}>{error}</div>}
      </div>
      <div className="card">
        <h3>Room Chat</h3>
        <ChatPanel socket={socket} onSend={sendChat} />
      </div>
    </div>
  );
}
```

````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/pages/Leaderboard.jsx"
import React, { useEffect, useState } from "react";
import { StatsAPI } from "../api";

// PUBLIC_INTERFACE
export default function Leaderboard({ apiBase }) {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const data = await StatsAPI.leaderboard(apiBase);
        setRows(data || []);
      } catch (e) {
        setErr(e.message || "Failed to load leaderboard");
      }
    })();
  }, [apiBase]);
  return (
    <div>
      <h1>Leaderboard</h1>
      {err && <div role="alert" className="badge">{err}</div>}
      <div className="card">
        <table className="table" role="table" aria-label="Top players">
          <thead>
            <tr><th>#</th><th>Player</th><th>Wins</th><th>Games</th><th>Rating</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id || r._id}>
                <td>{i+1}</td>
                <td>{r.displayName || r.name || r.email}</td>
                <td>{r.wins ?? "-"}</td>
                <td>{r.games ?? "-"}</td>
                <td>{r.rating ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/pages/History.jsx"
import React, { useEffect, useState } from "react";
import { StatsAPI } from "../api";
import { format } from "date-fns";

// PUBLIC_INTERFACE
export default function History({ apiBase }) {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const data = await StatsAPI.history(apiBase);
        setRows(data || []);
      } catch (e) {
        setErr(e.message || "Failed to load history");
      }
    })();
  }, [apiBase]);
  return (
    <div>
      <h1>Match History</h1>
      {err && <div role="alert" className="badge">{err}</div>}
      <div className="card">
        <table className="table" role="table" aria-label="Match history">
          <thead>
            <tr><th>Date</th><th>Opponents</th><th>Result</th><th>Duration</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.date ? format(new Date(r.date), "PPpp") : "-"}</td>
                <td>{(r.players || []).join(", ")}</td>
                <td>{r.result || "-"}</td>
                <td>{r.duration || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

````write file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/pages/Game.jsx"
import React, { useEffect, useMemo, useRef, useState } from "react";
import LudoBoard from "../components/LudoBoard";
import Dice from "../components/Dice";
import ChatPanel from "../components/ChatPanel";
import { useGameStore } from "../state/gameStore";
import { createWS } from "../api/client";
import { useParams } from "react-router-dom";
import { GameAPI } from "../api";
import { useAuthStore } from "../state/authStore";

// PUBLIC_INTERFACE
export default function Game({ apiBase, wsBase, mode: routeMode }) {
  const { roomId: routeRoomId } = useParams();
  const { mode, setRoom, reset, setDice, movePiece, nextTurn, turn, players, appendLog } = useGameStore();
  const [socket, setSocket] = useState(null);
  const [aiThinking, setAiThinking] = useState(false);
  const { user } = useAuthStore();
  const effectiveMode = routeMode || (routeRoomId ? "multiplayer" : "solo");
  const roomId = routeRoomId || "solo";

  useEffect(() => {
    reset(effectiveMode);
    setRoom(roomId, effectiveMode);
    // eslint-disable-next-line
  }, [effectiveMode, roomId]);

  // Multiplayer WebSocket
  useEffect(() => {
    if (effectiveMode !== "multiplayer") return;
    const { socket: ws } = createWS(`/game/${roomId}`, { wsBase });
    setSocket(ws);
    const onMsg = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "dice") {
          setDice(msg.value);
          appendLog(`Dice: ${msg.value}`);
        }
        if (msg.type === "move") {
          movePiece(msg.playerIndex, msg.pieceIndex, msg.steps);
          appendLog(`Player ${msg.playerIndex+1} moved piece ${msg.pieceIndex+1} by ${msg.steps}`);
          nextTurn();
        }
        if (msg.type === "system") {
          appendLog(msg.content);
        }
      } catch {
        // ignore
      }
    };
    ws.addEventListener("message", onMsg);
    return () => ws.close();
  }, [effectiveMode, roomId, wsBase, setDice, movePiece, nextTurn, appendLog]);

  // Solo mode: simple AI that moves after player
  useEffect(() => {
    if (effectiveMode !== "solo") return;
    if (turn !== 1) return; // AI is player 2
    setAiThinking(true);
    const t = setTimeout(() => {
      const value = 1 + Math.floor(Math.random() * 6);
      setDice(value);
      // Move first movable piece
      movePiece(1, 0, value);
      appendLog(`AI rolled ${value} and moved.`);
      nextTurn();
      setAiThinking(false);
    }, 800);
    return () => clearTimeout(t);
  }, [effectiveMode, turn, setDice, movePiece, appendLog, nextTurn]);

  const roll = async () => {
    if (effectiveMode === "multiplayer") {
      socket?.send(JSON.stringify({ type: "roll" }));
    } else {
      const value = 1 + Math.floor(Math.random() * 6);
      setDice(value);
      appendLog(`You rolled ${value}`);
    }
  };

  const move = (pieceIndex) => {
    if (effectiveMode === "multiplayer") {
      socket?.send(JSON.stringify({ type: "move", pieceIndex }));
    } else {
      const steps = Math.max(1, Math.floor(Math.random() * 6));
      movePiece(0, pieceIndex, steps);
      appendLog(`You moved piece ${pieceIndex+1} by ${steps}`);
      nextTurn();
    }
  };

  const sendChat = (content) => socket?.send(JSON.stringify({ type: "chat", content }));

  return (
    <div className="grid cols-3">
      <div className="card" style={{ gridColumn: "span 2" }}>
        <h2>Game {effectiveMode === "solo" ? "(Solo vs AI)" : `(Room ${roomId})`}</h2>
        <div className="grid cols-2">
          <LudoBoard />
          <div>
            <Dice value={useGameStore.getState().dice} onRoll={roll} disabled={effectiveMode === "solo" ? turn !== 0 : false} />
            <div className="space" />
            <div role="group" aria-label="Your pieces">
              <div className="row">
                {[0,1,2,3].map(i => (
                  <button key={i} className="btn" onClick={() => move(i)} disabled={effectiveMode === "solo" ? (turn !== 0) : false} aria-label={`Move piece ${i+1}`}>
                    Move piece {i+1}
                  </button>
                ))}
              </div>
            </div>
            <div className="space" />
            <div className="card" role="log" aria-live="polite" aria-relevant="additions">
              <strong>Events</strong>
              <ul>
                {useGameStore.getState().log.slice(-10).map((l, i) => <li key={i} className="muted">{l}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <h3>Chat</h3>
        <ChatPanel socket={socket} onSend={sendChat} />
      </div>
    </div>
  );
}
```

Explanation: Wrap App with ToastProvider to enable notifications globally via index.js usage.
````edit file="ludomaster--online-multiplayer-ludo-game-96747-96815/FrontendWebApplication/src/index.css"
<<<<<<< SEARCH
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
=======
/* Reset and minimal overrides; actual styles live in App.css */
* { box-sizing: border-box; }
html, body, #root { height: 100%; }
body {
  margin: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
>>>>>>> REPLACE

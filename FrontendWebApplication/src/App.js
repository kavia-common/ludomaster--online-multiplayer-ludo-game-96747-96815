import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import "./App.css";
import { useAuthStore } from "./state/authStore";
import { ToastViewport, useToasts } from "./components/Toast";
import { LiveMessage } from "./lib/ariaLive";

import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Profile from "./pages/Profile";
import Rooms from "./pages/Rooms";
import RoomDetail from "./pages/RoomDetail";
import Game from "./pages/Game";
import Leaderboard from "./pages/Leaderboard";
import History from "./pages/History";

function Navbar() {
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar" aria-label="Main">
      <div className="container navbar-inner">
        <Link className="brand" to="/" aria-label="LudoMaster Home">
          <span className="logo" aria-hidden>🎲</span>
          <span>LudoMaster</span>
        </Link>
        <div className="nav-actions" role="menubar" aria-label="Primary">
          <Link className="btn" to="/rooms" role="menuitem">Rooms</Link>
          <Link className="btn" to="/leaderboard" role="menuitem">Leaderboard</Link>
          {user && <Link className="btn" to="/history" role="menuitem">History</Link>}
          <button className="btn" aria-expanded={menuOpen} aria-haspopup="true" onClick={() => setMenuOpen(!menuOpen)}>
            {user ? user.displayName || user.email : "Account"}
          </button>
          {menuOpen && (
            <div role="menu" className="card" style={{ position: 'absolute', right: 16, top: 56 }}>
              {!user && (
                <>
                  <Link role="menuitem" className="btn" to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
                  <Link role="menuitem" className="btn" to="/register" onClick={() => setMenuOpen(false)}>Register</Link>
                </>
              )}
              {user && (
                <>
                  <Link role="menuitem" className="btn" to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
                  <button role="menuitem" className="btn danger" onClick={() => { logout(); setMenuOpen(false); }}>Logout</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// PUBLIC_INTERFACE
export default function App() {
  /** Accessible live messages for screen readers */
  const [theme, setTheme] = useState("dark");
  const { user, restore } = useAuthStore();
  const { announce } = useToasts();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    restore();
  }, [restore]);

  const apiBase = useMemo(() => process.env.REACT_APP_API_BASE || "/api", []);
  const wsBase = useMemo(() => process.env.REACT_APP_WS_BASE || (apiBase.startsWith("http") ? apiBase.replace(/^http/, "ws") : "/ws"), [apiBase]);

  return (
    <BrowserRouter>
      <LiveMessage message={`Theme ${theme}`} aria-live="polite" />
      <div className="App">
        <Navbar />
        <div className="container">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="row" aria-label="Quick actions">
              <button
                className="btn"
                onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
                aria-pressed={theme === "dark"}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              >
                {theme === "dark" ? "☀ Light" : "🌙 Dark"}
              </button>
              <Link className="btn primary" to="/rooms/create">Create Room</Link>
              <Link className="btn" to="/game/solo">Solo vs AI</Link>
            </div>
            <div className="badge" aria-live="polite" aria-atomic="true">
              {user ? <>Signed in as <strong style={{marginLeft:6}}>{user.displayName || user.email}</strong></> : "Guest"}
            </div>
          </div>
          <div className="space" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login apiBase={apiBase} onSuccess={() => announce("Logged in")} />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register apiBase={apiBase} onSuccess={() => announce("Registered successfully")} />} />
            <Route path="/profile" element={user ? <Profile apiBase={apiBase} /> : <Navigate to="/login" />} />
            <Route path="/rooms" element={<Rooms apiBase={apiBase} />} />
            <Route path="/rooms/create" element={user ? <Rooms apiBase={apiBase} mode="create" /> : <Navigate to="/login" />} />
            <Route path="/rooms/:roomId" element={<RoomDetail apiBase={apiBase} wsBase={wsBase} />} />
            <Route path="/game/solo" element={<Game apiBase={apiBase} wsBase={wsBase} mode="solo" />} />
            <Route path="/game/:roomId" element={<Game apiBase={apiBase} wsBase={wsBase} mode="multiplayer" />} />
            <Route path="/leaderboard" element={<Leaderboard apiBase={apiBase} />} />
            <Route path="/history" element={user ? <History apiBase={apiBase} /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
      <ToastViewport />
    </BrowserRouter>
  );
}

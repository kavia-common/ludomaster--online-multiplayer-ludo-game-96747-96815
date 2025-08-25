import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RoomsAPI } from "../api";
import ChatPanel from "../components/ChatPanel";
import { useAuthStore } from "../state/authStore";

// PUBLIC_INTERFACE
export default function RoomDetail({ apiBase }) {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [password, setPassword] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
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
        <ChatPanel socket={null} onSend={()=>{}} />
      </div>
    </div>
  );
}

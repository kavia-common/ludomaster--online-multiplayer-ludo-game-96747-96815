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

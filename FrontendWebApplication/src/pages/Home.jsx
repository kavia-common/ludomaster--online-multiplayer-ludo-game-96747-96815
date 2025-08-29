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

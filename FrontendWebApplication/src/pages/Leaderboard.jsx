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
              <tr key={r.id || r._id || i}>
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

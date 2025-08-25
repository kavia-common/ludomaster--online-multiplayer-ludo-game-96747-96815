import React, { useEffect, useState } from "react";
import { format } from "date-fns";

// PUBLIC_INTERFACE
export default function History({ apiBase }) {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase || process.env.REACT_APP_API_BASE || "/api"}/stats/history`, { headers: authHeaders() });
        if (!res.ok) throw new Error((await res.json()).message || "Failed to load history");
        const data = await res.json();
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

function authHeaders() {
  try {
    const token = JSON.parse(localStorage.getItem("ludomaster_auth") || "{}").state?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

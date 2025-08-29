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

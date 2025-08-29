import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormField from "../../components/FormField";
import { useAuthStore } from "../../state/authStore";

// PUBLIC_INTERFACE
export default function Register({ apiBase, onSuccess }) {
  const [email, setEmail] = useState("");
  the
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

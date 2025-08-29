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

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

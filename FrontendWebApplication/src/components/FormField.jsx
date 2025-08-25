import React from "react";

// PUBLIC_INTERFACE
export default function FormField({ id, label, help, error, children, required }) {
  return (
    <div className="card" role="group" aria-labelledby={`${id}-label`}>
      <label id={`${id}-label`} htmlFor={id} style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
        {label} {required ? <span aria-hidden="true" title="Required">*</span> : null}
      </label>
      {children}
      {help && <div id={`${id}-help`} className="muted" style={{ marginTop: 6 }}>{help}</div>}
      {error && <div role="alert" style={{ color: "#ff9aa2", marginTop: 6 }}>{error}</div>}
    </div>
  );
}

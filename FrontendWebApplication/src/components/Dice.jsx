import React from "react";

// PUBLIC_INTERFACE
export default function Dice({ value, onRoll, disabled }) {
  return (
    <div role="group" aria-label="Dice">
      <div className="dice" aria-live="polite" aria-atomic="true" title="Dice value">
        {value ?? "–"}
      </div>
      <div className="space" />
      <button className="btn primary" onClick={onRoll} disabled={disabled} aria-disabled={disabled} aria-label="Roll dice">
        Roll
      </button>
    </div>
  );
}

import React from "react";
import { useGameStore } from "../state/gameStore";

// PUBLIC_INTERFACE
export default function LudoBoard() {
  const { players } = useGameStore();

  // Render a simplified 15x15 grid with pieces rendered in corners and on a conceptual path.
  const cells = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const idx = r * 15 + c;
      const isPath = r === 7 || c === 7; // conceptual cross path
      cells.push(<div key={idx} className={`cell ${isPath ? "path" : ""}`} aria-hidden="true" />);
    }
  }

  const renderPieces = () => {
    // Place pieces around corners for demo, based on their progress (0..57)
    return players.map((p, pi) =>
      p.pieces.map((progress, pj) => {
        // Map progress to a position along the cross for visualization
        const t = Math.min(progress, 57) / 57;
        const row = 7;
        const col = Math.round(1 + t * 13);
        const top = 8 + row * (100/15) + (pj%2 ? -2 : 2);
        const left = 8 + col * (100/15) + (Math.floor(pj/2) ? -2 : 2);
        return (
          <div
            key={`${pi}-${pj}`}
            className="piece"
            style={{
              position: "absolute",
              top: `calc(${top}% - 16px)`,
              left: `calc(${left}% - 16px)`,
              background: p.color,
            }}
            role="img"
            aria-label={`${p.id} piece ${pj+1} progress ${progress}`}
          />
        );
      })
    );
  };

  return (
    <div className="ludo-board" aria-label="Ludo board">
      <div className="ludo-grid">{cells}</div>
      {renderPieces()}
    </div>
  );
}

import { create } from "zustand";

// Lightweight Ludo state for board rendering and local AI (very basic).
// PUBLIC_INTERFACE
export const useGameStore = create((set, get) => ({
  roomId: null,
  mode: "solo", // "solo" | "multiplayer"
  turn: 0, // player index 0..3
  dice: null,
  players: [
    { id: "red", color: "#ff4d4f", pieces: [0,0,0,0], home: 0 },
    { id: "green", color: "#34d399", pieces: [0,0,0,0], home: 0 },
    { id: "yellow", color: "#fbbf24", pieces: [0,0,0,0], home: 0 },
    { id: "blue", color: "#60a5fa", pieces: [0,0,0,0], home: 0 },
  ],
  log: [],
  // PUBLIC_INTERFACE
  reset(mode = "solo") {
    set({
      roomId: null,
      mode,
      turn: 0,
      dice: null,
      players: [
        { id: "red", color: "#ff4d4f", pieces: [0,0,0,0], home: 0 },
        { id: "green", color: "#34d399", pieces: [0,0,0,0], home: 0 },
        { id: "yellow", color: "#fbbf24", pieces: [0,0,0,0], home: 0 },
        { id: "blue", color: "#60a5fa", pieces: [0,0,0,0], home: 0 },
      ],
      log: [],
    });
  },
  // PUBLIC_INTERFACE
  setRoom(roomId, mode) { set({ roomId, mode }); },
  // PUBLIC_INTERFACE
  setDice(val) { set({ dice: val }); },
  // PUBLIC_INTERFACE
  appendLog(msg) { set({ log: [...get().log, msg] }); },
  // PUBLIC_INTERFACE
  nextTurn() { set({ turn: (get().turn + 1) % 4 }); },
  // PUBLIC_INTERFACE - simplistic move rules for demo rendering
  movePiece(playerIndex, pieceIndex, steps) {
    const players = [...get().players];
    const cur = { ...players[playerIndex] };
    const newVal = Math.min(57, cur.pieces[pieceIndex] + steps); // typical 57 steps to home in Ludo
    cur.pieces = cur.pieces.map((v, i) => (i === pieceIndex ? newVal : v));
    players[playerIndex] = cur;
    set({ players });
  },
}));

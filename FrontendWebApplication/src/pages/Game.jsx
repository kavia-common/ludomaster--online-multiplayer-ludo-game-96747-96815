import React, { useEffect, useState } from "react";
import LudoBoard from "../components/LudoBoard";
import Dice from "../components/Dice";
import ChatPanel from "../components/ChatPanel";
import { useGameStore } from "../state/gameStore";
import { useParams } from "react-router-dom";

// PUBLIC_INTERFACE
export default function Game({ mode: routeMode }) {
  const { roomId: routeRoomId } = useParams();
  const { reset, setRoom, setDice, movePiece, nextTurn, turn, appendLog } = useGameStore();
  const [socket] = useState(null);
  const effectiveMode = routeMode || (routeRoomId ? "multiplayer" : "solo");
  const roomId = routeRoomId || "solo";

  useEffect(() => {
    reset(effectiveMode);
    setRoom(roomId, effectiveMode);
    // eslint-disable-next-line
  }, [effectiveMode, roomId]);

  useEffect(() => {
    if (effectiveMode !== "solo") return;
    if (turn !== 1) return;
    const t = setTimeout(() => {
      const value = 1 + Math.floor(Math.random() * 6);
      setDice(value);
      movePiece(1, 0, value);
      appendLog(`AI rolled ${value} and moved.`);
      nextTurn();
    }, 800);
    return () => clearTimeout(t);
  }, [effectiveMode, turn, setDice, movePiece, appendLog, nextTurn]);

  const roll = () => {
    if (effectiveMode === "multiplayer") {
      // placeholder for WS
    } else {
      const value = 1 + Math.floor(Math.random() * 6);
      setDice(value);
      appendLog(`You rolled ${value}`);
    }
  };

  const move = (pieceIndex) => {
    if (effectiveMode === "multiplayer") {
      // placeholder for WS
    } else {
      const steps = Math.max(1, Math.floor(Math.random() * 6));
      movePiece(0, pieceIndex, steps);
      appendLog(`You moved piece ${pieceIndex+1} by ${steps}`);
      nextTurn();
    }
  };

  const sendChat = (content) => {
    // placeholder
    console.log("chat:", content);
  };

  return (
    <div className="grid cols-3">
      <div className="card" style={{ gridColumn: "span 2" }}>
        <h2>Game {effectiveMode === "solo" ? "(Solo vs AI)" : `(Room ${roomId})`}</h2>
        <div className="grid cols-2">
          <LudoBoard />
          <div>
            <Dice value={useGameStore.getState().dice} onRoll={roll} disabled={effectiveMode === "solo" ? turn !== 0 : false} />
            <div className="space" />
            <div role="group" aria-label="Your pieces">
              <div className="row">
                {[0,1,2,3].map(i => (
                  <button key={i} className="btn" onClick={() => move(i)} disabled={effectiveMode === "solo" ? (turn !== 0) : false} aria-label={`Move piece ${i+1}`}>
                    Move piece {i+1}
                  </button>
                ))}
              </div>
            </div>
            <div className="space" />
            <div className="card" role="log" aria-live="polite" aria-relevant="additions">
              <strong>Events</strong>
              <ul>
                {useGameStore.getState().log.slice(-10).map((l, i) => <li key={i} className="muted">{l}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <h3>Chat</h3>
        <ChatPanel socket={socket} onSend={sendChat} />
      </div>
    </div>
  );
}

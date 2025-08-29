import React, { useEffect, useRef, useState } from "react";

// PUBLIC_INTERFACE
export default function ChatPanel({ socket, onSend }) {
  const [text, setText] = useState("");
  const [log, setLog] = useState([]);
  const endRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    const handler = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "chat") {
          setLog((l) => [...l, msg]);
        } else if (msg.type === "system") {
          setLog((l) => [...l, { ...msg, system: true }]);
        }
      } catch {
        // ignore
      }
    };
    socket.addEventListener("message", handler);
    return () => socket.removeEventListener("message", handler);
  }, [socket]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const send = () => {
    const content = text.trim();
    if (!content) return;
    onSend?.(content);
    setText("");
  };

  return (
    <div className="chat-box" aria-label="In-game chat">
      <div className="chat-log card" role="log" aria-live="polite" aria-relevant="additions">
        {log.map((m, i) => (
          <div key={i} className="row">
            <span className="badge">{m.system ? "System" : m.from || "Player"}</span>
            <span>{m.content}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="chat-input-row">
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          aria-label="Chat message"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
        />
        <button className="btn primary" onClick={send} aria-label="Send chat message">Send</button>
      </div>
    </div>
  );
}

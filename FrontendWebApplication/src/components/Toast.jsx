import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastCtx = createContext(null);

// PUBLIC_INTERFACE
export function ToastViewport() {
  const { toasts, remove } = useToasts();
  return (
    <div aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div key={t.id} className="toast" role="status">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <strong>{t.title}</strong>
              {t.message ? <div className="muted">{t.message}</div> : null}
            </div>
            <button className="btn" onClick={() => remove(t.id)} aria-label="Close notification">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((title, message = "") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  const value = useMemo(() => ({ toasts, add, remove }), [toasts, add, remove]);
  return <ToastCtx.Provider value={value}>{children}</ToastCtx.Provider>;
}

// PUBLIC_INTERFACE
export function useToasts() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    return { toasts: [], add: () => {}, remove: () => {}, announce: (msg) => console.log("[toast]", msg) };
  }
  return { ...ctx, announce: (msg) => ctx.add("Announcement", msg) };
}

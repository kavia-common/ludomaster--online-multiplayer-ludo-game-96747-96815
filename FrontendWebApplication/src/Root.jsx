import React from "react";
import App from "./App";
import { ToastProvider } from "./components/Toast";

// PUBLIC_INTERFACE
export default function Root() {
  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  );
}

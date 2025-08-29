import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./App.css";
import Root from "./Root";
import { LiveAnnouncer } from "./lib/ariaLive";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <LiveAnnouncer>
      <Root />
    </LiveAnnouncer>
  </React.StrictMode>
);

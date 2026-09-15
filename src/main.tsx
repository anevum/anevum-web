import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { installRuntimeFixes } from "./runtimeFixes";
import "./styles.css";
import "./moderatedWiki.css";
import "./systemShell.css";
import "./publicV2.css";
import "./publicIsolation.css";

installRuntimeFixes();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

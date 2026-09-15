import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { installRuntimeFixes } from "./runtimeFixes";
import "./baseV2.css";
import "./moderatedWiki.css";
import "./systemShell.css";
import "./publicV2.css";
import "./brandArt.css";
import "./latticeV2.css";
import "./rhenlinkV2.css";
import "./publicIsolation.css";

installRuntimeFixes();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

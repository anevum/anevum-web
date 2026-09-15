import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { installRuntimeFixes } from "./runtimeFixes";
import "./styles.css";
import "./frontdoor.css";
import "./records.css";
import "./reply.css";
import "./locked.css";
import "./production.css";
import "./canonVisuals.css";
import "./wikiNative.css";
import "./wikiMember.css";
import "./runtimeFixes.css";

installRuntimeFixes();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

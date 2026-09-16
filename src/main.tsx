import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { installRuntimeFixes } from "./runtimeFixes";
import "./baseV2.css";
import "./production.css";
import "./systemShell.css";
import "./commandIntegration.css";
import "./publicV2.css";
import "./moderatedWiki.css";
import "./canonicalWiki.css";
import "./latticeV2.css";
import "./brandArt.css";
import "./rhenlinkV2.css";
import "./memberChrome.css";
import "./replyLaunch.css";
import "./launchTerminal.css";
import "./launchIntegration.css";
import "./launchPages.css";
import "./launchPolish.css";
import "./launchVisualV3.css";
import "./mobileLaunchFix.css";

installRuntimeFixes();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

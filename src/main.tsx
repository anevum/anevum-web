import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { RuntimeBoundary } from "./RuntimeBoundary";
import { installRuntimeFixes } from "./runtimeFixes";
import { COMMAND_HOST, LATTICE_HOST, normalizeRuntimePath, resolveRuntimeHostname, ROOT_HOST, WIKI_HOST } from "./runtimeHost";
import "./baseV2.css";
import "./production.css";
import "./systemShell.css";
import "./publicV2.css";
import "./brandArt.css";
import "./replyRelease.css";
import "./memberChrome.css";
import "./replyLaunch.css";
import "./launchTerminal.css";
import "./launchIntegration.css";
import "./launchPages.css";
import "./launchPolish.css";
import "./launchVisualV3.css";
import "./mobileLaunchFix.css";
import "./launchEditorialLight.css";
import "./legal.css";
import "./anevumTheme.css";
import "./runtimeBoundary.css";
import "./notifications.css";
import "./publicExperience.css";

function routeStyleImports() {
  const hostname = resolveRuntimeHostname(window.location.hostname);
  const pathname = normalizeRuntimePath(window.location.pathname);
  const styles: Promise<unknown>[] = [];

  const wikiRoute = hostname === WIKI_HOST || (hostname === ROOT_HOST && (pathname === "/wiki" || pathname.startsWith("/wiki/")));
  const latticeRoute = hostname === LATTICE_HOST || (hostname === ROOT_HOST && pathname === "/lattice");
  const commandRoute = hostname === COMMAND_HOST || (hostname === ROOT_HOST && pathname === "/command");

  if (wikiRoute) {
    styles.push(import("./canonicalWiki.css"), import("./moderatedWiki.css"));
  }
  if (latticeRoute) styles.push(import("./latticeV2.css"));
  if (commandRoute) styles.push(import("./commandIntegration.css"), import("./commandReadiness.css"), import("./commandFinance.css"), import("./commandCohesion.css"));
  if (hostname === ROOT_HOST && pathname === "/rhenlink") styles.push(import("./rhenlinkV2.css"), import("./rhenlinkOwnership.css"));
  if (hostname === ROOT_HOST && pathname === "/about") styles.push(import("./about.css"));

  return styles;
}

async function boot() {
  await Promise.allSettled(routeStyleImports());
  installRuntimeFixes();

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <RuntimeBoundary>
        <App />
      </RuntimeBoundary>
    </React.StrictMode>,
  );
}

void boot();

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { RuntimeBoundary } from "./RuntimeBoundary";
import { installRuntimeFixes } from "./runtimeFixes";
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
import "./runtimeBoundary.css";

const ROOT_HOST = "anevum.com";
const WIKI_HOST = "wiki.anevum.com";
const LATTICE_HOST = "lattice.anevum.com";
const COMMAND_HOST = "command.anevum.com";

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function routeStyleImports() {
  const hostname = window.location.hostname.toLowerCase();
  const pathname = normalizePath(window.location.pathname);
  const styles: Promise<unknown>[] = [];

  const wikiRoute = hostname === WIKI_HOST || (hostname === ROOT_HOST && (pathname === "/wiki" || pathname.startsWith("/wiki/")));
  const latticeRoute = hostname === LATTICE_HOST || (hostname === ROOT_HOST && pathname === "/lattice");
  const commandRoute = hostname === COMMAND_HOST || (hostname === ROOT_HOST && pathname === "/command");

  if (wikiRoute) {
    styles.push(import("./canonicalWiki.css"), import("./moderatedWiki.css"));
  }
  if (latticeRoute) styles.push(import("./latticeV2.css"));
  if (commandRoute) styles.push(import("./commandIntegration.css"), import("./commandReadiness.css"));
  if (hostname === ROOT_HOST && pathname === "/rhenlink") styles.push(import("./rhenlinkV2.css"));
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

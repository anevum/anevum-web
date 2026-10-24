import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { authenticate, AccessError } from "./src/identity.mjs";
import { interpretCommand } from "./src/intent.mjs";
import { getPublicDevelopmentActivity } from "./src/github.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const staticFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/icon.svg", ["icon.svg", "image/svg+xml"]],
  ["/manifest.webmanifest", ["manifest.webmanifest", "application/manifest+json"]]
]);
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=(self)",
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; manifest-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
};

function json(res, status, payload) {
  res.writeHead(status, { ...headers, "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}
function error(res, status, message) {
  json(res, status, { error: message });
}
function allowedOrigin(request, env) {
  const origin = request.headers.origin;
  if (typeof origin !== "string") return false;
  if (env.HOUSE_LOCAL_DEMO === "1" && env.NODE_ENV !== "production") {
    try {
      const url = new URL(origin);
      return (url.hostname === "localhost" || url.hostname === "127.0.0.1") && url.protocol === "http:";
    } catch {
      return false;
    }
  }
  return origin === env.HOUSE_PUBLIC_ORIGIN;
}
async function bodyJson(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 8192) throw new AccessError(413, "Command payload too large.");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AccessError(400, "Invalid JSON.");
  }
}

export function createHouseServer({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  return createServer(async (request, res) => {
    try {
      const path = new URL(request.url || "/", "http://localhost").pathname;
      if (request.method === "GET" && path === "/healthz") {
        return json(res, 200, { status: "ok", privateAccess: "fail-closed" });
      }
      // All static files and all other API endpoints require verified access,
      // or explicit loopback-only development mode. No public family surface.
      const identity = await authenticate(request, env, fetchImpl);
      if (path.startsWith("/api/")) {
        if (request.method === "GET" && path === "/api/session") {
          return json(res, 200, { identity, capabilities: ["public-activity", "safe-links", "local-voice-ui", "synthetic-family"] });
        }
        if (request.method === "GET" && path === "/api/activity") {
          return json(res, 200, await getPublicDevelopmentActivity(fetchImpl));
        }
        if (request.method === "GET" && path === "/api/integrations") {
          return json(res, 200, {
            integrations: [
              { id: "anevum", label: "ANEVUM", state: "linked-navigation", detail: "Existing public site and authenticated operator links" },
              { id: "github", label: "GitHub", state: "public-read-only", detail: "Public PR metadata, not live deployment verification" },
              { id: "railway", label: "Railway", state: "not-authorized", detail: "ChatGPT connection does not grant this new service runtime credentials" },
              { id: "cloudflare", label: "Cloudflare Access", state: identity.mode === "verified" ? "verified" : "local-preview", detail: "Owner verification required for hosted use" },
              { id: "home", label: "Home Assistant", state: "not-connected", detail: "Local controller and approval required" },
              { id: "ai", label: "IREN model", state: "not-connected", detail: "Only the explicit deterministic command router is available" }
            ]
          });
        }
        if (request.method === "GET" && path === "/api/family-preview") {
          return json(res, 200, {
            synthetic: true, persistent: false, synchronized: false,
            explorers: [
              { id: "explorer-a", label: "Explorer 01", stardust: 120, level: 3, theme: "aurora" },
              { id: "explorer-b", label: "Explorer 02", stardust: 85, level: 2, theme: "nebula" }
            ],
            missions: [
              { id: "reading", title: "Read together", reward: 15, state: "preview" },
              { id: "home", title: "Help with a home task", reward: 10, state: "preview" },
              { id: "creation", title: "Create something", reward: 20, state: "preview" }
            ]
          });
        }
        if (request.method === "POST" && path === "/api/command") {
          if (!allowedOrigin(request, env)) return error(res, 403, "Same-origin command required.");
          if (!String(request.headers["content-type"] || "").startsWith("application/json")) {
            return error(res, 415, "JSON required.");
          }
          const body = await bodyJson(request);
          if (!body || typeof body.command !== "string") return error(res, 400, "A command string is required.");
          return json(res, 200, {
            ...interpretCommand(body.command),
            execution: "read-only",
            modelConnected: false,
            householdDevicesConnected: false
          });
        }
        if (request.method !== "GET") return error(res, 405, "This prototype has no persistent write operations.");
        return error(res, 404, "Endpoint not found.");
      }
      if (request.method !== "GET" && request.method !== "HEAD") return error(res, 405, "Method not allowed.");
      const entry = staticFiles.get(path);
      if (!entry) return error(res, 404, "Page not found.");
      const [name, type] = entry;
      const content = await readFile(join(here, "public", name));
      res.writeHead(200, { ...headers, "Content-Type": type });
      if (request.method === "HEAD") return res.end();
      return res.end(content);
    } catch (caught) {
      if (caught instanceof AccessError) return error(res, caught.status, caught.message);
      return error(res, 503, "Temporarily unavailable. No operation was executed.");
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const local = process.env.HOUSE_LOCAL_DEMO === "1" && process.env.NODE_ENV !== "production";
  const host = local ? "127.0.0.1" : (process.env.HOST || "0.0.0.0");
  const port = Number(process.env.PORT || 8788);
  createHouseServer().listen(port, host, () => {
    console.log("Continuance House listening on " + host + ":" + port + (local ? " (synthetic local demonstration)" : " (verified access required)"));
  });
}

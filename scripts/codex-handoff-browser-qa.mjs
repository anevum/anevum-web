import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const base = process.env.BASE_URL;
if (!base) throw new Error("BASE_URL is required");

const routes = ["/command/system"];
const viewports = [
  { name: "desktop", width: 1440, height: 1000, mobile: false, deviceScaleFactor: 1 },
  { name: "mobile", width: 390, height: 844, mobile: true, deviceScaleFactor: 1 }
];

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "anevum-browser-qa-"));
const chrome = spawn("google-chrome", [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--remote-debugging-address=127.0.0.1",
  "--remote-debugging-port=0",
  "--no-first-run",
  "--disable-background-networking",
  "--disable-sync",
  "--user-data-dir=" + profile,
  "about:blank"
], { stdio: "ignore" });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let debugPort = null;

async function waitForDebugger() {
  const activePortFile = path.join(profile, "DevToolsActivePort");
  for (let i = 0; i < 200; i += 1) {
    if (chrome.exitCode !== null) {
      throw new Error("Chrome exited before DevTools became ready: " + chrome.exitCode);
    }
    try {
      if (fs.existsSync(activePortFile)) {
        const [port] = fs.readFileSync(activePortFile, "utf8").trim().split(/\r?\n/);
        if (port && /^\d+$/.test(port)) {
          const response = await fetch("http://127.0.0.1:" + port + "/json/version");
          if (response.ok) {
            debugPort = Number(port);
            return;
          }
        }
      }
    } catch {}
    await sleep(100);
  }
  throw new Error("Chrome DevTools endpoint did not become ready after 20 seconds");
}

async function target() {
  if (!debugPort) throw new Error("Chrome DevTools port is unavailable");
  const response = await fetch("http://127.0.0.1:" + debugPort + "/json/new?about:blank", { method: "PUT" });
  if (!response.ok) throw new Error("Could not create browser QA target");
  return response.json();
}

async function closeTarget(id) {
  try {
    if (debugPort) await fetch("http://127.0.0.1:" + debugPort + "/json/close/" + id);
  } catch {}
}

async function runCase(route, viewport) {
  const page = await target();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const pending = new Map();
  const runtimeErrors = [];
  let nextId = 1;

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("CDP timeout: " + method));
    }, 10000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("WebSocket open timeout")), 10000);
    ws.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    ws.addEventListener("error", () => { clearTimeout(timer); reject(new Error("WebSocket error")); }, { once: true });
  });

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id);
      clearTimeout(item.timer);
      pending.delete(message.id);
      if (message.error) item.reject(new Error(message.error.message));
      else item.resolve(message.result);
      return;
    }
    if (message.method === "Runtime.exceptionThrown") {
      runtimeErrors.push(message.params?.exceptionDetails?.text || "Runtime exception");
    }
    if (message.method === "Runtime.consoleAPICalled" && message.params?.type === "error") {
      const values = (message.params.args || []).map((arg) => arg.value || arg.description || "").join(" ");
      runtimeErrors.push("console.error: " + values);
    }
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor,
    mobile: viewport.mobile
  });
  await send("Page.addScriptToEvaluateOnNewDocument", {source: `
    window.__sentCommands = [];
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (url, init = {}) => {
      const path = String(url);
      if (path.includes("/api/command/session")) return Response.json({authenticated:true,auth_source:"cloudflare_access",command_admin:true,email:"qa@example.test"});
      if (path.includes("/api/command/iren/command")) {
        window.__sentCommands.push(JSON.parse(init.body).command);
        return Response.json({schema_version:"iren_command.v2",accepted:true,command:{status:"QUEUED"}},{status:202});
      }
      if (path.includes("/api/command/iren/status")) return Response.json({
        schema_version:"iren_command.v2",state:"HEALTHY",stale:false,observed_at:new Date().toISOString(),incidents:[],
        work:{objectives:[],jobs:[],commands:[],next_action:{title:"Add runtime evidence"},execution_mode:"codex/manual software",
          handoffs:[{handoff_id:"qa-1",objective_key:"iren.evidence",handoff_status:"PREPARED",
            package:{title:"Add runtime evidence",created_at:new Date().toISOString(),base_sha:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              branch:"codex/handoff/qa-1",prompt:"Inspect CURRENT main.\\nComplete the scoped objective.\\nDo not expand authority."},
            verification:{verified:false,blockers:["implementation_not_submitted"]}}]}
      });
      if (path.startsWith("/api/command/")) return Response.json({});
      return originalFetch(url, init);
    };
    Object.defineProperty(navigator, "clipboard", {value:{writeText:async text => {window.__copiedPrompt=text;}}});
  `});
  await send("Page.navigate", { url: base + route });
  await sleep(5000);

  await send("Runtime.evaluate", {expression: `
    document.querySelector(".iren-dock-handle")?.click();
    [...document.querySelectorAll("button")].find(b => b.textContent === "prepare for Codex")?.click();
  `});
  await sleep(500);
  await send("Runtime.evaluate", {expression: `
    [...document.querySelectorAll("button")].find(b => b.textContent === "Copy Codex Handoff")?.click();
  `});
  await sleep(200);
  const interactions = await send("Runtime.evaluate", {expression: `({
    prepared: window.__sentCommands?.includes("prepare for Codex"),
    copied: window.__copiedPrompt === document.querySelector('textarea[aria-label="Complete Codex prompt"]')?.value,
    prompt: document.querySelector('textarea[aria-label="Complete Codex prompt"]')?.value,
    blockers: document.querySelector(".iren-codex-handoff")?.textContent.includes("implementation not submitted")
  })`,returnByValue:true});
  const check = interactions.result?.value || {};
  if (!check.prepared || !check.copied || !check.prompt || !check.blockers) throw new Error("Handoff interaction failed: " + JSON.stringify(check));
  const result = await send("Runtime.evaluate", {
    expression: `(() => {
      const root = document.documentElement;
      const body = document.body;
      const offenders = [...document.querySelectorAll("*")].filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.right > root.clientWidth + 1 || rect.left < -1;
      }).slice(0, 12).map((el) => ({
        tag: el.tagName,
        className: String(el.className || "").slice(0, 120),
        left: Math.round(el.getBoundingClientRect().left),
        right: Math.round(el.getBoundingClientRect().right)
      }));
      return {
        title: document.title,
        rootClientWidth: root.clientWidth,
        rootScrollWidth: root.scrollWidth,
        bodyScrollWidth: body ? body.scrollWidth : 0,
        overflow: root.scrollWidth > root.clientWidth + 1 || (body && body.scrollWidth > root.clientWidth + 1),
        offenders
      };
    })()`,
    returnByValue: true
  });

  const value = result.result?.value || {};
  const failures = [];
  if (value.overflow) {
    failures.push("horizontal overflow " + JSON.stringify(value));
  }
  if (runtimeErrors.length) {
    failures.push("runtime errors " + JSON.stringify(runtimeErrors));
  }

  console.log(JSON.stringify({ route, viewport: viewport.name, ...value, runtimeErrors }));
  ws.close();
  await closeTarget(page.id);
  return failures;
}

let failures = [];
try {
  await waitForDebugger();
  for (const viewport of viewports) {
    for (const route of routes) {
      failures = failures.concat((await runCase(route, viewport)).map((item) => viewport.name + " " + route + ": " + item));
    }
  }
} finally {
  chrome.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => {
      if (chrome.exitCode !== null) resolve();
      else chrome.once("exit", resolve);
    }),
    sleep(2000)
  ]);
  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  } catch {
    // The GitHub runner is ephemeral; cleanup must never turn a passed browser QA into a failure.
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Browser runtime QA passed: no horizontal overflow or JavaScript runtime errors.");

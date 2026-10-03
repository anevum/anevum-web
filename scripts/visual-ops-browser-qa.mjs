import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const base = process.env.BASE_URL;
if (!base) throw new Error("BASE_URL is required");

const routes = ["/", "/live", "/products", "/command/overview", "/command/iren", "/command/rhen", "/command/graen", "/command/nostra", "/command/velum"];
const output = path.join(process.env.RUNNER_TEMP || os.tmpdir(), "anevum-visuals");
fs.mkdirSync(output, {recursive:true});
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
  await send("Page.addScriptToEvaluateOnNewDocument", {source: "(" + "() => {\n    const originalFetch=window.fetch.bind(window);\n    window.fetch=async (input,init={}) => {\n      const url=String(input);\n      if(url.includes(\"/api/command/session\")) return Response.json({authenticated:true,auth_source:\"cloudflare_access\",command_admin:true,email:\"qa@example.test\"});\n      if(url.includes(\"/api/command/iren/status\")) {\n        const at=new Date().toISOString();\n        return Response.json({\n          schema_version:\"iren_command.v2\",revision:42,observed_at:at,stale:false,state:\"DEGRADED\",action_required:true,\n          topology:{services:[\"IREN\",\"RHEN\",\"GRAEN\",\"NOSTRA\",\"VELUM\"].map(name=>({service_id:name.toLowerCase(),service_name:name+\" runtime\",runtime_kind:name.toLowerCase(),independent_runtime:true,status:name===\"NOSTRA\"?\"OFFLINE\":name===\"VELUM\"?\"IDLE\":\"HEALTHY\",liveness:name!==\"NOSTRA\",readiness:name!==\"NOSTRA\",observed_at:at,last_heartbeat_at:at,scope:\"qa\",revision:\"qa-fixture-not-production\",current_activity:{IREN:\"Coordinating observation and evidence.\",RHEN:\"Observing the latest market cycle.\",GRAEN:\"Evaluating retained research evidence.\",NOSTRA:\"Forecast runtime unavailable.\",VELUM:\"Ready for the next replay.\"}[name]})),dependencies:{foundation:{status:\"HEALTHY\",last_success:at}}},\n          incidents:[{key:\"service.nostra\",severity:\"warning\",reason:\"Forecast runtime is offline\",opened_at:at}],\n          work:{active_jobs:1,requires_human:1,blocked_objectives:1,objectives:[{owner_system:\"GRAEN\",objective_key:\"qa-research\",title:\"Evaluate retained evidence\",status:\"ACTIVE\",description:\"Review the current evidence window.\",updated_at:at}],jobs:[{owner_system:\"GRAEN\",job_id:\"qa-job\",title:\"Research evaluation\",status:\"RUNNING\",description:\"Checking retained observations.\",updated_at:at}],commands:[],handoffs:[],next_action:{title:\"Restore forecast observations\"}},\n          operator:{state:\"DEGRADED\",message:\"NOSTRA needs attention. Other systems remain observable.\",recent_transitions:[{key:\"service.nostra\",transition:\"INCIDENT_OPENED\",severity:\"warning\",reason:\"Forecast runtime is offline\",created_at:at}]}\n        });\n      }\n      if(url.includes(\"/api/command/\")) return Response.json({});\n      return originalFetch(input,init);\n    };\n  }" + ")()"});
  await send("Page.navigate", { url: base + route });
  await sleep(5000);
  const ops = await send("Runtime.evaluate", {expression: `(() => {
    const surface=document.querySelector("[data-visual-ops]");
    const cards=[...document.querySelectorAll(".vo-system-card, .vo-node")];
    const visible=el=>el.getBoundingClientRect().width>0;
    return {surface:Boolean(surface), cards:cards.filter(visible).length,
      heading:document.querySelector(".vo-console h1")?.textContent,
      nostra:document.querySelector('[data-system="NOSTRA"]')?.getAttribute("data-state"),
      velum:document.querySelector('[data-system="VELUM"]')?.getAttribute("data-state"),
      activeGraen:document.querySelector('[data-system="GRAEN"]')?.getAttribute("data-active"),
      links:cards.filter(el=>el.tagName==="A").every(el=>el.tabIndex===0&&el.hasAttribute("aria-label")),
      nav:routePlaceholder
    };
  })()`.replace("routePlaceholder", JSON.stringify(route)),returnByValue:true});
  const details=ops.result?.value||{};
  if(!details.surface || !details.cards || !details.links) throw new Error("Missing accessible visual surface: "+JSON.stringify(details));
  if(route==="/command/overview" && (details.nostra!=="OFFLINE" || details.velum!=="IDLE" || details.activeGraen!=="true")) throw new Error("State rendering failed: "+JSON.stringify(details));
  if(route.startsWith("/command/")) {
    await send("Runtime.evaluate",{expression:'document.querySelector(".vo-details summary")?.click()'});
    await send("Runtime.evaluate",{expression:'document.querySelector(".vo-details summary")?.click()'});
  }
  const screenshot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  fs.writeFileSync(path.join(output,"visual-"+(route.slice(1).replaceAll("/","-")||"home")+"-"+viewport.name+".png"),Buffer.from(screenshot.data,"base64"));
  await send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  const motion=await send("Runtime.evaluate",{expression:`[...document.querySelectorAll(".vo-console *, .vo-public-board *")].filter(el=>getComputedStyle(el).animationName!=="none" && getComputedStyle(el).animationDuration!=="0s").length`,returnByValue:true});
  if(motion.result?.value) throw new Error("Reduced motion left animations running: "+motion.result.value);
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

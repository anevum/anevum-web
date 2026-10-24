#!/usr/bin/env node
// Hardware-free real-Chromium smoke test. All local profile content is synthetic.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(appRoot, "artifacts");
const base = "http://127.0.0.1:8788/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  for (const name of ["google-chrome", "chromium", "chromium-browser"]) {
    const result = spawnSync("which", [name], { encoding: "utf8" });
    if (result.status === 0) return result.stdout.trim();
  }
  throw new Error("Chromium or Chrome is required for visual verification.");
}
async function eventually(fn, limitMs = 10000) {
  const start = Date.now();
  let error;
  while (Date.now() - start < limitMs) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (caught) {
      error = caught;
    }
    await sleep(100);
  }
  throw new Error("Browser readiness check timed out. " + (error?.message || ""));
}
class Devtools {
  constructor(ws) {
    this.ws = ws;
    this.next = 1;
    this.pending = new Map();
    ws.addEventListener("message", (event) => {
      let reply;
      try { reply = JSON.parse(event.data); } catch { return; }
      if (!reply.id) return;
      const pending = this.pending.get(reply.id);
      if (!pending) return;
      clearTimeout(pending.timeout);
      this.pending.delete(reply.id);
      if (reply.error) pending.reject(new Error(JSON.stringify(reply.error)));
      else pending.resolve(reply.result);
    });
  }
  send(method, params = {}) {
    const id = this.next++;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("CDP timeout: " + method));
      }, 15000);
      this.pending.set(id, { resolve, reject, timeout });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const reply = await this.send("Runtime.evaluate", {
      expression, returnByValue: true, awaitPromise: true
    });
    if (reply.exceptionDetails) throw new Error("Browser expression failed: " + JSON.stringify(reply.exceptionDetails));
    return reply.result.value;
  }
  async screenshot(file) {
    const result = await this.send("Page.captureScreenshot", {
      format: "png", captureBeyondViewport: false, fromSurface: true
    });
    await writeFile(join(output, file), Buffer.from(result.data, "base64"));
  }
}

const tmp = await mkdtemp(join(tmpdir(), "continuance-house-browser-"));
let server, chrome, socket;
try {
  server = spawn(process.execPath, ["server.mjs"], {
    cwd: appRoot,
    stdio: "ignore",
    env: { ...process.env, NODE_ENV: "test", HOUSE_LOCAL_DEMO: "1", PORT: "8788" }
  });
  await eventually(async () => {
    const response = await fetch(base + "api/session");
    return response.ok;
  });
  // Explicit localhost port is more portable across Ubuntu Chrome wrappers
  // than the optional DevToolsActivePort sidecar created with port=0.
  const debugPort = 9222;
  let chromeErrors = "";
  chrome = spawn(findChrome(), [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
    "--no-first-run", "--no-default-browser-check",
    "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=" + debugPort,
    "--user-data-dir=" + tmp, "about:blank"
  ], { stdio: ["ignore", "ignore", "pipe"] });
  chrome.stderr?.on("data", (chunk) => {
    chromeErrors = (chromeErrors + chunk.toString()).slice(-5000);
  });
  try {
    await eventually(async () => {
      if (chrome.exitCode !== null) throw new Error("Chrome exited with " + chrome.exitCode);
      const result = await fetch("http://127.0.0.1:" + debugPort + "/json/list");
      return result.ok;
    }, 15000);
  } catch (error) {
    throw new Error("Unable to connect to local Chrome DevTools: " + error.message + "\n" + chromeErrors);
  }
  const pages = await (await fetch("http://127.0.0.1:" + debugPort + "/json/list")).json();
  const page = pages.find((item) => item.type === "page");
  assert.ok(page?.webSocketDebuggerUrl, "Chrome must expose a page debugging target");
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolveConnect, rejectConnect) => {
    socket.addEventListener("open", resolveConnect, { once: true });
    socket.addEventListener("error", rejectConnect, { once: true });
  });
  const cdp = new Devtools(socket);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false
  });
  await cdp.send("Page.navigate", { url: base });
  await eventually(() => cdp.evaluate('document.querySelector("#access-label")?.textContent === "LOCAL DEMO"'));
  assert.equal(await cdp.evaluate('document.querySelectorAll(".module-card").length'), 3);
  assert.equal(await cdp.evaluate('getComputedStyle(document.querySelector(".sidebar")).display'), "flex");
  await mkdir(output, { recursive: true });
  await cdp.screenshot("desk-desktop-1440.png");

  await cdp.evaluate('document.querySelector(".side-nav [data-view=family]").click()');
  await eventually(() => cdp.evaluate('document.querySelectorAll(".explorer").length === 2'));
  await cdp.evaluate('document.querySelector("[data-mission=reading]").click()');
  assert.equal(await cdp.evaluate('document.querySelector("[data-mission=reading]").getAttribute("aria-pressed")'), "true");
  await cdp.evaluate('document.querySelector(".side-nav [data-view=systems]").click()');
  await eventually(() => cdp.evaluate('document.querySelectorAll(".integration-card").length >= 5'));
  await cdp.evaluate('document.querySelector("#command-input").value="deploy now";document.querySelector("#command-form").requestSubmit()');
  await eventually(() => cdp.evaluate('document.querySelector("#conversation").textContent.includes("Privileged operations require")'));
  await cdp.evaluate('document.querySelector(".side-nav [data-view=signals]").click()');
  await cdp.evaluate('document.querySelector("[data-feed=ci]").click()');
  assert.equal(await cdp.evaluate('document.querySelector("[data-feed=ci]").getAttribute("aria-pressed")'), "true");
  await cdp.evaluate('document.querySelector(".side-nav [data-view=desk]").click()');

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: true
  });
  await eventually(() => cdp.evaluate('getComputedStyle(document.querySelector(".mobile-nav")).display === "grid"'));
  assert.equal(await cdp.evaluate('window.innerWidth'), 390);
  await cdp.screenshot("desk-mobile-390.png");
  await cdp.evaluate('document.querySelector("#mobile-iren").click()');
  assert.equal(await cdp.evaluate('document.querySelector(".iren-panel").classList.contains("is-mobile-open")'), true);

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1024, height: 768, deviceScaleFactor: 1, mobile: false
  });
  await cdp.evaluate('document.querySelector(".mobile-nav [data-view=family]").click()');
  await cdp.evaluate('document.querySelector("#fridge-mode").click()');
  assert.equal(await cdp.evaluate('document.body.classList.contains("fridge-preview")'), true);
  await eventually(() => cdp.evaluate("window.scrollY === 0"));
  await cdp.screenshot("family-fridge-1024.png");
  await cdp.evaluate('document.querySelector("#fridge-mode").click()');
  assert.equal(await cdp.evaluate('document.body.classList.contains("fridge-preview")'), false);

  for (const file of ["desk-desktop-1440.png", "desk-mobile-390.png", "family-fridge-1024.png"]) {
    const data = await readFile(join(output, file));
    assert.equal(data.subarray(1,4).toString(), "PNG");
    assert.ok(data.byteLength > 10000, "Screenshot must be nonempty: " + file);
  }
  console.log("Browser PASS: desktop, mobile, IREN restrictions, synthetic missions, integrations, CI tab, fridge display.");
} finally {
  try { socket?.close(); } catch {}
  chrome?.kill("SIGTERM");
  server?.kill("SIGTERM");
  // Chrome may briefly rewrite its profile after SIGTERM. Its ephemeral
  // profile is non-secret and the runner deletes /tmp after completion.
  await rm(tmp, { recursive: true, force: true, maxRetries: 12, retryDelay: 150 })
    .catch((error) => console.warn("Ephemeral browser profile cleanup deferred:", error.code));
}

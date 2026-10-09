/* Genuine RHEN browser screenshot: Alpaca's required pre-OAuth disclosure.
 * No mock accounts, fake sessions, Alpaca tokens, or live order capabilities.
 * Runs against the actual compiled Vite preview with member linking OFF.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const base = "http://127.0.0.1:4177";
const out = path.join(process.env.RUNNER_TEMP || os.tmpdir(), "alpaca-review");
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "rhen-alpaca-review-"));
fs.mkdirSync(out, { recursive: true });
const server = spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1", "--port", "4177", "--strictPort"], {
  stdio: "ignore", detached: false
});
const chrome = spawn("google-chrome", [
  "--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
  "--no-first-run", "--disable-background-networking", "--disable-sync",
  "--remote-debugging-port=0", "--remote-debugging-address=127.0.0.1",
  "--user-data-dir=" + profile, "about:blank"
], { stdio: "ignore" });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function ready() {
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null || chrome.exitCode !== null) {
      throw new Error("Local Vite preview or browser exited early");
    }
    const portFile = path.join(profile, "DevToolsActivePort");
    if (fs.existsSync(portFile)) {
      try {
        const port = fs.readFileSync(portFile, "utf8").split(/\r?\n/)[0].trim();
        const [page, chromeVersion] = await Promise.all([
          fetch(base + "/apps/rhen/connect"),
          fetch("http://127.0.0.1:" + port + "/json/version")
        ]);
        if (page.ok && chromeVersion.ok) return Number(port);
      } catch {}
    }
    await sleep(200);
  }
  throw new Error("Vite preview or Chrome browser was not ready");
}

async function capture(port) {
  const response = await fetch("http://127.0.0.1:" + port + "/json/new?about:blank", { method: "PUT" });
  if (!response.ok) throw new Error("Could not open isolated browser tab");
  const target = await response.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  const awaiting = new Map();
  let counter = 0;
  let runtimeException = null;

  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", () => reject(Error("Chrome websocket could not open")), { once: true });
  });
  ws.addEventListener("message", event => {
    const message = JSON.parse(String(event.data));
    if (message.method === "Runtime.exceptionThrown") {
      runtimeException = message.params?.exceptionDetails?.text || "Runtime exception";
    }
    if (message.id && awaiting.has(message.id)) {
      const pending = awaiting.get(message.id);
      clearTimeout(pending.timeout);
      awaiting.delete(message.id);
      message.error ? pending.reject(Error(message.error.message)) : pending.resolve(message.result);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++counter;
    const timeout = setTimeout(() => {
      awaiting.delete(id);
      reject(Error("Timed out waiting for Chrome: " + method));
    }, 15000);
    awaiting.set(id, { resolve, reject, timeout });
    ws.send(JSON.stringify({ id, method, params }));
  });
  try {
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 880, height: 495, deviceScaleFactor: 1, mobile: false
    });
    await send("Page.navigate", { url: base + "/apps/rhen/connect" });
    let state = null;
    for (let i = 0; i < 100; i++) {
      const r = await send("Runtime.evaluate", {
        expression: `(() => {
          const disclosure = document.querySelector(".rhen-connect-disclosure");
          const button = document.querySelector(".rhen-connect-submit");
          const checkbox = document.querySelector(".rhen-connect-ack input");
          const text = disclosure?.innerText || "";
          const bounds = disclosure?.getBoundingClientRect();
          return {
            pathname: location.pathname,
            ready: Boolean(disclosure && button && checkbox),
            exactCopy: text.includes("authorization to place transactions in your account at your direction.") &&
              text.includes("Alpaca does not warrant or guarantee that RHEN by ANEVUM"),
            buttonDisabled: button?.disabled === true,
            checkboxDisabled: checkbox?.disabled === true,
            noTrading: document.body.innerText.includes("Live algorithmic order placement is not enabled"),
            disclosureVisible: Boolean(bounds && bounds.width > 0 && bounds.height > 0 &&
              bounds.left >= 0 && bounds.right <= window.innerWidth && bounds.top >= 0 &&
              bounds.bottom <= window.innerHeight),
            footer: document.body.innerText.includes("Application approval pending") ||
              document.body.innerText.includes("sign in required")
          };
        })()`,
        returnByValue: true
      });
      state = r.result?.value;
      if (state?.ready) break;
      await sleep(140);
    }
    if (runtimeException) throw Error("RHEN client error: " + runtimeException);
    if (!state?.ready || state.pathname !== "/apps/rhen/connect" || !state.exactCopy ||
        !state.buttonDisabled || !state.checkboxDisabled || !state.noTrading ||
        !state.disclosureVisible || !state.footer) {
      throw Error("Alpaca disclosure screenshot verification failed: " + JSON.stringify(state));
    }
    const result = await send("Page.captureScreenshot", {
      format: "png", captureBeyondViewport: false
    });
    const png = Buffer.from(result.data, "base64");
    if (png.length > 2_000_000 || png.length < 5000) {
      throw Error("Review screenshot exceeds 2 MB or was blank");
    }
    const file = path.join(out, "rhen-alpaca-disclosure-880x495.png");
    fs.writeFileSync(file, png);
    fs.writeFileSync(path.join(out, "evidence.json"), JSON.stringify({
      source: "GitHub Actions local Vite preview of RHEN code",
      route: "/apps/rhen/connect",
      type: "real customer-facing disclosure, public read-only state",
      website_deployed: false,
      alpaca_authorization_approved: false,
      broker_execution_enabled: false,
      dimensions: [880, 495],
      verification: state
    }, null, 2));
    console.log("RHEN disclosure browser verification passed: " + file);
  } finally {
    ws.close();
    try { await fetch("http://127.0.0.1:" + port + "/json/close/" + target.id); } catch {}
  }
}

try {
  const port = await ready();
  await capture(port);
} finally {
  chrome.kill("SIGTERM");
  server.kill("SIGTERM");
  // Chrome can still be writing its profile after SIGTERM; the runner's
  // temporary directory cleanup is a fallback, never a test failure.
  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 12, retryDelay: 250 });
  } catch (error) {
    console.warn("Temporary browser profile will be removed by CI runner:", error.code);
  }
}

// ANEVUM Community V007 compiled UI acceptance. Offline loopback fixture only.
// SYNTHETIC OFFLINE records may be present; never confuse captures with real users.
import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, timeout = 22000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try { const result = await fn(); if (result) return result; } catch {}
    await delay(150);
  }
  throw Error("V007_BROWSER_TIMEOUT");
}
function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url), pending = new Map();
    let id = 0;
    ws.addEventListener("open", () => resolve({
      send(method, params = {}) {
        return new Promise((res, rej) => {
          const key = ++id;
          pending.set(key, { res, rej });
          ws.send(JSON.stringify({ id: key, method, params }));
        });
      },
      close() { ws.close(); }
    }), { once: true });
    ws.addEventListener("message", ({ data }) => {
      const result = JSON.parse(String(data));
      if (typeof result.id !== "number") return;
      const handler = pending.get(result.id);
      if (!handler) return;
      pending.delete(result.id);
      result.error ? handler.rej(Error(result.error.message)) : handler.res(result.result || {});
    });
    ws.addEventListener("error", () => reject(Error("V007_CDP_CONNECT")), { once: true });
    ws.addEventListener("close", () => {
      for (const handler of pending.values()) handler.rej(Error("V007_CDP_CLOSED"));
      pending.clear();
    });
  });
}

const args = process.argv.slice(2);
const option = key => { const at = args.indexOf(key); return at < 0 ? null : args[at + 1]; };
const chrome = option("--chrome"), base = option("--base"), output = option("--output");
if (!chrome || !output || !/^http:\/\/127\.0\.0\.1:\d+$/.test(base || ""))
  throw Error("V007 requires a Chrome binary and a loopback-only fixture");
mkdirSync(output, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), "anevum-community-v007-"));
const child = spawn(chrome, [
  "--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
  "--disable-background-networking", "--remote-allow-origins=*",
  "--remote-debugging-port=0", "--no-first-run", "--user-data-dir=" + profile,
  "about:blank"
], { stdio: "ignore" });
let client = null;
try {
  const port = await until(() => {
    const file = join(profile, "DevToolsActivePort");
    if (!existsSync(file)) return null;
    const text = readFileSync(file, "utf8").split("\n")[0];
    return /^\d+$/.test(text) ? text : null;
  });
  const debuggerUrl = await until(async () => {
    const response = await fetch("http://127.0.0.1:" + port + "/json/list");
    if (!response.ok) return null;
    const pages = await response.json();
    return pages.find(page => page.type === "page" && page.webSocketDebuggerUrl)?.webSocketDebuggerUrl || null;
  });
  client = await connect(debuggerUrl);
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  const evaluate = async expression => {
    const result = await client.send("Runtime.evaluate", {
      expression, returnByValue: true, awaitPromise: true
    });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.text || "V007_BROWSER_EVALUATE");
    return result.result?.value;
  };
  async function screenshot(name, width) {
    const response = await client.send("Page.captureScreenshot", { format: "png", fromSurface: true });
    if (!response.data) throw Error("V007_SCREENSHOT_EMPTY");
    writeFileSync(join(output, name + "-" + width + ".png"), Buffer.from(response.data, "base64"));
  }
  for (const [width, height] of [[1440, 900], [1024, 768], [390, 844], [320, 720]]) {
    await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 641 });
    await client.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await client.send("Page.navigate", { url: base + "/creator/community" });
    await until(() => evaluate('document.readyState==="complete" && !!document.querySelector(".ch7-hub")'));
    await until(() => evaluate('document.querySelector(".ch7-status strong")?.textContent!=="—" && !!document.querySelector(".ch7-tabs button")'));
    await delay(450);
    const state = await evaluate('(()=>({title:document.querySelector(".ch7-hero h1")?.textContent,tabs:document.querySelectorAll(".ch7-tabs button").length,columns:!!document.querySelector(".ch7-columns"),art:!!document.querySelector(".ch7-hero-art img"),overflow:document.documentElement.scrollWidth>innerWidth+1,iframe:document.querySelectorAll("iframe").length,memberWrite:!!document.querySelector(".ch7-hub form[action*=\\"/api/"]")}))()');
    if (!state.title?.includes("Made by people") || state.tabs !== 4 || !state.columns ||
        !state.art || state.overflow || state.iframe || state.memberWrite)
      throw Error("V007_COMMUNITY_LAYOUT_" + width + ":" + JSON.stringify(state));
    await screenshot("community-v007-top", width);

    await evaluate('document.querySelector(".ch7-tabs button:nth-child(2)").click()');
    await until(() => evaluate('document.querySelector(".ch7-tabs button:nth-child(2)")?.getAttribute("aria-pressed")==="true"'));
    await evaluate('document.querySelector(".ch7-tabs-row").scrollIntoView({block:"start"})');
    await delay(350);
    if (await evaluate('document.documentElement.scrollWidth>innerWidth+1')) throw Error("V007_PROJECTS_OVERFLOW_" + width);
    await screenshot("community-v007-projects", width);

    await evaluate('document.querySelector(".ch7-tabs button:nth-child(3)").click()');
    await until(() => evaluate('document.querySelector(".ch7-tabs button:nth-child(3)")?.getAttribute("aria-pressed")==="true"'));
    await screenshot("community-v007-discussions", width);

    await evaluate('document.querySelector(".ch7-tabs button:nth-child(4)").click()');
    await until(() => evaluate('document.querySelector(".ch7-tabs button:nth-child(4)")?.getAttribute("aria-pressed")==="true"'));
    if (await evaluate('document.documentElement.scrollWidth>innerWidth+1')) throw Error("V007_PEOPLE_OVERFLOW_" + width);
    await screenshot("community-v007-people", width);
    console.log("COMMUNITY_V007_BROWSER_" + width + "=" + JSON.stringify(state));
  }
  writeFileSync(join(output, "capture-status.txt"),
    "COMMUNITY_V007_BROWSER_CAPTURE=PASS\nAll records in these screenshots are offline synthetic review fixtures, not live user activity. No staff, member, D1 or production mutations.\n");
} finally {
  client?.close();
  child.kill("SIGTERM");
  await delay(250);
  rmSync(profile, { recursive: true, force: true });
}

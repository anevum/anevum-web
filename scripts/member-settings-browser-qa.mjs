// Synthetic accounts and requests exist only in this browser fixture, never the server.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const base = process.env.BASE_URL;
if (!base) throw new Error("BASE_URL is required");
const output = path.join(process.env.RUNNER_TEMP || os.tmpdir(), "anevum-visuals");
fs.mkdirSync(output, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "anevum-settings-qa-"));
const chrome = spawn("google-chrome", ["--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0", "--user-data-dir=" + profile, "about:blank"], { stdio: "ignore" });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let port;
async function runCase(width, state) {
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl), pending = new Map(), errors = [];
  let next = 0;
  await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
  ws.addEventListener("message", event => {
    const value = JSON.parse(String(event.data));
    if (value.method === "Runtime.exceptionThrown") errors.push(value.params.exceptionDetails.text);
    if (!value.id) return;
    const task = pending.get(value.id); if (!task) return;
    pending.delete(value.id); clearTimeout(task.timer);
    if (value.error) task.reject(new Error(value.error.message)); else task.resolve(value.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++next, timer = setTimeout(() => { pending.delete(id); reject(new Error("CDP timeout: " + method)); }, 30000);
    pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result?.value;
  };
  const root = 'document.querySelector(".anevum-commons-v5-mount")?.shadowRoot';
  const surface = root + '?.querySelector(".member-settings")';
  const waitFor = async (expression, label) => {
    for (let i = 0; i < 120; i++) { if (await evaluate(expression)) return; await pause(100); }
    throw new Error("Settings browser timeout: " + label + " / " + state);
  };
  const snapshot = () => evaluate(`(() => {
    const page=${surface}, input=page?.querySelector("input"), form=page?.querySelector("form");
    return {state:page?.dataset.settingsState, text:page?.textContent||"", value:input?.value,
      disabled:input?.disabled, saveDisabled:form?.querySelector("button")?.disabled,
      export:!!page?.querySelector('a[href="/api/member/export"]'),
      deleteDisabled:page?.querySelector('.member-danger-action')?.disabled,
      mutations:window.__settingsQa.mutations, loads:window.__settingsQa.loads,
      pathname:location.pathname};
  })()`);
  try {
    await send("Page.enable"); await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width, height: width < 760 ? 900 : 1000, deviceScaleFactor: 1, mobile: width < 760 });
    await send("Page.addScriptToEvaluateOnNewDocument", { source: `(() => {
      const state=${JSON.stringify(state)}, original=window.fetch.bind(window);
      const qa=window.__settingsQa={member:"alpha",mutations:[],loads:[],aborted:[],held:[],names:{alpha:"Alpha private name",beta:"Beta private name"},holdBeta:false,confirm:false};
      window.confirm=()=>qa.confirm;
      qa.release=kind=>{qa.held.filter(item=>item.kind===kind).forEach(item=>item.resolve());qa.held=qa.held.filter(item=>item.kind!==kind);};
      const hold=kind=>new Promise(resolve=>qa.held.push({kind,resolve}));
      window.fetch=async(input,init={})=>{
        const url=String(input), method=init.method||"GET", member=qa.member;
        if(url.includes("/api/member/availability"))return Response.json({available:state!=="disabled",provider:"google"});
        if(url.includes("/api/auth/get-session"))return Response.json(state==="signed-out"||state==="disabled"?null:{session:{id:"session-"+member,userId:member,expiresAt:new Date(Date.now()+3600000).toISOString()},user:{id:member,name:member,email:member+"@example.test",emailVerified:true}});
        if(url.includes("/api/auth/sign-out")) {qa.mutations.push({member,method:"SIGN_OUT"});return Response.json({message:"Fixture sign-out failure"},{status:500});}
        if(url.includes("/api/auth/delete-user")) {qa.mutations.push({member,method:"DELETE"});return Response.json({message:"Recent sign-in required"},{status:401});}
        if(url.includes("/api/member/me")) {
          init.signal?.addEventListener("abort",()=>qa.aborted.push(member+":"+method),{once:true});
          if(method==="PATCH") {
            const name=JSON.parse(init.body).displayName;
            qa.mutations.push({member,method,name});
            if(state==="failed-save")return Response.json({message:"Fixture save failed"},{status:503});
            if(state==="switch")await hold("save");
            qa.names[member]=name;return Response.json({profile:{displayName:name,theme:"system"}});
          }
          qa.loads.push(member);
          const name=qa.names[member];
          if(state==="failed-load"&&qa.loads.length===1)return Response.json({message:"Fixture load failed"},{status:503});
          // Deliberately ignore AbortSignal on the held response to test late completion.
          if(state==="late-load"&&member==="alpha")await hold("load");
          if(member==="beta"&&qa.holdBeta)await hold("beta");
          return Response.json({user:{id:state==="crossed"?"beta":member},profile:{displayName:state==="malformed"?{private:"Never render"}:name,theme:"system"}});
        }
        if(url.includes("/api/command/"))return Response.json({message:"Operator access required"},{status:401});
        if(url.startsWith("/api/member/"))throw new Error("Unexpected member fixture request");
        return original(input,init);
      };
    })()` });
    await send("Page.navigate", { url: base + "/me/settings" });
    if (["disabled", "signed-out"].includes(state)) {
      await waitFor(`!!${root}?.querySelector('a[href="/sign-in"]')&&!${root}?.textContent.includes("Checking account")`, "signed-out page");
      const info = await snapshot();
      if (info.state || info.loads.length || info.mutations.length) throw new Error("Unavailable account displayed settings or requested private data");
    } else if (["switch", "late-load"].includes(state)) {
      if (state === "switch") {
        await waitFor(`${surface}?.dataset.settingsState==="verified"`, "alpha profile");
        await evaluate(`(() => {const input=${surface}.querySelector("input");input.focus();input.setSelectionRange(input.value.length,input.value.length);})()`);
        await send("Input.insertText", { text: " unsaved Alpha" });
        await evaluate(`${surface}.querySelector("form").requestSubmit();window.__settingsQa.holdBeta=true`);
        await waitFor('window.__settingsQa.held.some(item=>item.kind==="save")', "held alpha save");
      } else await waitFor('window.__settingsQa.held.some(item=>item.kind==="load")', "held alpha load");
      await evaluate(`window.__settingsQa.member="beta";window.dispatchEvent(new StorageEvent("storage",{key:"better-auth.message",newValue:JSON.stringify({event:"session",data:{trigger:"getSession"},clientId:"fixture-other-tab"})}))`);
      await waitFor(`${surface}?.textContent.includes("beta@example.test")`, "beta identity");
      if (state === "switch") {
        const info = await snapshot();
        if (info.value!==""||!info.disabled||!info.saveDisabled||info.export||!info.deleteDisabled||info.text.includes("Alpha private")) throw new Error("New member inherited editable Alpha state: "+JSON.stringify(info));
        await evaluate('window.__settingsQa.release("save");window.__settingsQa.holdBeta=false;window.__settingsQa.release("beta")');
      } else await evaluate('window.__settingsQa.release("load")');
      await waitFor(`${surface}?.querySelector("input")?.value==="Beta private name"&&${surface}?.dataset.settingsState==="verified"`, "verified beta profile");
      await pause(250);
      const info = await snapshot();
      if (info.value!=="Beta private name"||info.text.includes("Name saved")||info.text.includes("Alpha private")||info.pathname!=="/me/settings") throw new Error("Late Alpha completion changed Beta settings: "+JSON.stringify(info));
      if (state==="switch"&&(info.mutations.length!==1||info.mutations[0].member!=="alpha")) throw new Error("Account switch issued an unexpected mutation");
      if (await evaluate('!window.__settingsQa.aborted.some(item=>item.startsWith("alpha:"))')) throw new Error("Account switch did not abort prior settings requests");
    } else {
      const negative = ["crossed", "malformed", "failed-load"].includes(state);
      await waitFor(`${surface}?.dataset.settingsState===${JSON.stringify(negative ? "unverified" : "verified")}`, "profile response");
      let info = await snapshot();
      if (negative) {
        if (info.value!==""||!info.disabled||!info.saveDisabled||info.export||!info.deleteDisabled||info.mutations.length||info.text.includes("Alpha private")) throw new Error("Unverified profile remained editable: "+JSON.stringify(info));
        if(state==="failed-load") {
          await evaluate(`${surface}.querySelector('[role="alert"] button').click()`);
          await waitFor(`${surface}?.dataset.settingsState==="verified"`, "load retry");
        }
      } else {
        if (info.value!=="Alpha private name"||info.disabled||!info.export) throw new Error("Verified settings missing: "+JSON.stringify(info));
        await evaluate(`(() => {const input=${surface}.querySelector("input");input.focus();input.setSelectionRange(input.value.length,input.value.length);})()`);
        await send("Input.insertText", { text: " edited" });
        await evaluate(`${surface}.querySelector("form").requestSubmit()`);
        await waitFor(`${surface}?.textContent.includes(${JSON.stringify(state==="failed-save"?"Could not update your profile":"Name saved.")})`, "profile save");
        info = await snapshot();
        if(info.mutations.length!==1||info.mutations[0].name!=="Alpha private name edited") throw new Error("Profile form did not save the entered name");
        if(state==="failed-save") {
          if(info.value!==""||!info.disabled||info.export||info.text.includes("Name saved")) throw new Error("Failed save claimed success or kept unverified controls");
        } else {
          if(info.value!=="Alpha private name edited") throw new Error("Persisted profile did not reload");
          // Cancelling the irreversible action must issue no request.
          await evaluate(`${surface}.querySelector('.member-danger-action').click()`);
          if((await snapshot()).mutations.length!==1) throw new Error("Cancelled account deletion issued a request");
          if(state==="auth-errors") {
            await evaluate('window.__settingsQa.confirm=true');
            await evaluate(`${surface}.querySelector('.member-danger-action').click()`);
            await waitFor(`${surface}?.textContent.includes("recent sign-in")`, "delete denial");
            await evaluate(`[...${surface}.querySelectorAll('button')].find(button=>button.textContent==="Sign out").click()`);
            await waitFor(`${surface}?.textContent.includes("Could not sign out")`, "sign-out failure");
            if((await snapshot()).pathname!=="/me/settings") throw new Error("Failed account action navigated away");
          }
        }
      }
    }
    const overflow = await evaluate(`(() => {
      const page=${surface};
      return document.documentElement.scrollWidth>innerWidth+1||[...(page?.querySelectorAll("*")||[])].some(el=>el.scrollWidth>el.clientWidth+2&&getComputedStyle(el).display!=="inline");
    })()`);
    if (overflow || errors.length) throw new Error("Settings layout/runtime error: "+JSON.stringify({overflow,errors}));
    const png = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    fs.writeFileSync(path.join(output, `member-settings-${state}-${width}.png`), Buffer.from(png.data,"base64"));
    console.log(JSON.stringify({route:"/me/settings",state,width,ok:true}));
  } finally {
    ws.close(); await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
  }
}
try {
  for (let i = 0; i < 200; i++) {
    try { port = Number(fs.readFileSync(path.join(profile,"DevToolsActivePort"),"utf8").split("\n")[0]); if(port) break; } catch {}
    if(chrome.exitCode!==null) throw new Error("Chrome exited before settings QA");
    await pause(100);
  }
  if (!port) throw new Error("Chrome did not start");
  for (const width of [320,390,768,1024,1440]) await runCase(width,"member");
  for (const state of ["disabled","signed-out","crossed","malformed","failed-load","failed-save","switch","late-load","auth-errors"]) await runCase(390,state);
} finally {
  if (chrome.exitCode===null&&chrome.signalCode===null) {
    await new Promise(resolve=>{
      const timer=setTimeout(()=>{chrome.kill("SIGKILL");resolve();},5000);
      chrome.once("close",()=>{clearTimeout(timer);resolve();});chrome.kill();
    });
  }
  await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}

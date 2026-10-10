// UI fixtures are confined to this test browser; this never grants real member/operator access.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const base = process.env.BASE_URL;
if (!base) throw new Error("BASE_URL is required");
const output = path.join(process.env.RUNNER_TEMP || os.tmpdir(), "anevum-visuals");
fs.mkdirSync(output, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "anevum-member-qa-"));
const chrome = spawn("google-chrome", ["--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0", "--user-data-dir=" + profile, "about:blank"], { stdio: "ignore" });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let port;
for (let i=0; i<200; i++) { try { port=Number(fs.readFileSync(path.join(profile,"DevToolsActivePort"),"utf8").split("\n")[0]); if(port) break; } catch {} await pause(100); }
if(!port) { chrome.kill(); throw new Error("Chrome did not start"); }
async function runCase(viewport, state) {
  const target=await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {method:"PUT"})).json();
  const ws=new WebSocket(target.webSocketDebuggerUrl); const pending=new Map(); let next=0;
  await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true});});
  ws.addEventListener("message", event=>{const value=JSON.parse(String(event.data));if(!value.id)return;const task=pending.get(value.id);if(!task)return;pending.delete(value.id);clearTimeout(task.timer);if(value.error)task.reject(new Error(value.error.message));else task.resolve(value.result);});
  const send=(method,params={},timeoutMs=20000)=>new Promise((resolve,reject)=>{const id=++next;const timer=setTimeout(()=>{pending.delete(id);reject(new Error("CDP timeout: "+method));},timeoutMs);pending.set(id,{resolve,reject,timer});try{ws.send(JSON.stringify({id,method,params}));}catch(error){clearTimeout(timer);pending.delete(id);reject(error);}});
  const evaluate=async expression => {const result=await send("Runtime.evaluate", {expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.text);return result.result?.value;};
  await send("Page.enable"); await send("Runtime.enable"); await send("Emulation.setDeviceMetricsOverride", {width:viewport.width,height:viewport.height,deviceScaleFactor:1,mobile:viewport.width<760});
  await send("Page.addScriptToEvaluateOnNewDocument", {source:`(() => {
    const state=${JSON.stringify(state)};
    const original=window.fetch.bind(window); const saved=new Set();const follows=new Set();const mutations=[];
    window.__memberQa={mutations};
    window.fetch=async(input,init={}) => {
      const url=String(input);const method=init.method||"GET";
      if(url.includes("/api/member/availability"))return Response.json({available:state!=="disabled",provider:state==="disabled"?null:"google"});
      if(url.includes("/api/auth/get-session"))return Response.json(state==="member"?{session:{id:"qa-session",userId:"qa-member",expiresAt:new Date(Date.now()+3600000).toISOString()},user:{id:"qa-member",name:"QA Member",email:"member@example.test",emailVerified:true}}:null);
      if(url.includes("/api/member/me"))return Response.json({user:{name:"QA Member",email:"member@example.test"},profile:{displayName:"QA Member",theme:"light"},savedApps:[...saved],follows:[...follows],entitlements:[]});
      const match=url.match(/\\/api\\/member\\/(saved-apps|follows)\\/([a-z0-9-]+)/);
      if(match){const set=match[1]==="saved-apps"?saved:follows;if(method==="PUT")set.add(match[2]);else if(method==="DELETE")set.delete(match[2]);mutations.push({kind:match[1],slug:match[2],method});return Response.json({saved:method==="PUT"});}
      if(url.includes("/api/command/"))return Response.json({message:"Operator access required"},{status:401});
      return original(input,init);
    };
  })()`});
  // Cloudflare preview cold-start/navigation can outlive the default CDP command
  // timeout. Retry only a navigation timeout, never a UI/assertion failure.
  const destination=base+"/me";
  for(let attempt=0;attempt<2;attempt++){
    try{await send("Page.navigate",{url:destination},30000);break;}
    catch(error){
      if(error?.message!=="CDP timeout: Page.navigate"||attempt===1)throw error;
      await send("Page.stopLoading",{},10000).catch(()=>{});
      await pause(500);
    }
  }
  // Member Command now renders inside the Commons V5 open ShadowRoot. Inspect the
  // actual account surface, never the outer document's now-empty legacy wrapper.
  const accountExpr='document.querySelector(".anevum-commons-v5-mount")?.shadowRoot?.querySelector(".c2-member .member-command")';
  let mounted=false;
  for(let i=0;i<100;i++){
    mounted=await evaluate(`(() => {
      const account=${accountExpr};
      if(!account?.querySelector(".member-program")||account.textContent.includes("Checking your account"))return false;
      // Authenticated controls are intentionally disabled until private data loads.
      if(${JSON.stringify(state)}==="member"){
        const actions=[...account.querySelectorAll(".member-card-actions button")];
        return actions.length===2&&actions.every(el=>!el.disabled)&&!account.textContent.includes("Loading your programs");
      }
      return true;
    })()`);
    if(mounted)break;
    await pause(100);
  }
  if(!mounted)throw new Error("Member Command did not mount in the Commons V5 ShadowRoot");
  const info=await evaluate(`(() => {
    const root=document.querySelector(".anevum-commons-v5-mount")?.shadowRoot;
    const account=root?.querySelector(".c2-member .member-command");
    const shell=root?.querySelector(".app.account-view");
    return {
      text:account?.textContent||"",
      mounted:!!(root&&account&&shell),
      overflow:document.documentElement.scrollWidth>innerWidth+1,
      operator:!!account?.querySelector('a[href^="/command/rhen"]'),
      background:shell?getComputedStyle(shell).backgroundColor:"",
      buttons:[...(account?.querySelectorAll(".member-card-actions button")||[])].map(el=>el.textContent)
    };
  })()`);
  if(!info.mounted||info.overflow||info.operator||!info.background||info.background==="rgba(0, 0, 0, 0)"||info.background==="transparent")
    throw new Error("Member portal layout/access failure "+JSON.stringify(info));
  if(state==="disabled"&&(!info.text.includes("Member accounts are not open yet")||info.buttons.length))throw new Error("Disabled accounts advertised persistence");
  if(state==="signed-out"&&(!info.text.includes("Sign in to make this your Command")||info.buttons.length))throw new Error("Signed-out accounts advertised private state");
  if(state==="member") {
    if(!info.text.includes("QA Member")||info.buttons.length!==2)throw new Error("Member account did not load");
    await evaluate(`${accountExpr}.querySelectorAll('.member-card-actions button')[0].click()`);await pause(350);
    await evaluate(`${accountExpr}.querySelectorAll('.member-card-actions button')[1].click()`);await pause(350);
    const saved=await evaluate(`(() => {
      const account=${accountExpr};
      return {
        saved:!!account?.querySelector('.member-command-saved a[href="/apps/rhen"]'),
        updates:account?.querySelectorAll('.member-notes a').length||0,
        pressed:[...(account?.querySelectorAll('.member-card-actions button')||[])].every(el=>el.getAttribute('aria-pressed')==='true'),
        mutations:window.__memberQa.mutations
      };
    })()`);
    if(!saved.saved||!saved.pressed||!saved.updates||saved.mutations.length!==2)throw new Error("Member save/follow flow failed "+JSON.stringify(saved));
    await evaluate(`${accountExpr}.querySelectorAll('.member-card-actions button')[0].click()`);await pause(350);
    if(await evaluate(`!!${accountExpr}.querySelector('.member-command-saved a')`))throw new Error("Removed program remained saved");
  }
  const png=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});fs.writeFileSync(path.join(output,`member-command-${state}-${viewport.width}.png`),Buffer.from(png.data,"base64"));
  console.log(JSON.stringify({state,width:viewport.width,ok:true}));ws.close();await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
}
try {
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}])
    for(const state of ["disabled","signed-out","member"])await runCase(viewport,state);
} finally {
  if(chrome.exitCode === null && chrome.signalCode === null) {
    await new Promise(resolve => {
      const timeout=setTimeout(() => {chrome.kill("SIGKILL");resolve();},5000);
      chrome.once("close",() => {clearTimeout(timeout);resolve();});
      chrome.kill();
    });
  }
  await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}

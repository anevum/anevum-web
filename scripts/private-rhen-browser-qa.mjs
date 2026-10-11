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
async function runCase(viewport, state, route) {
  const target=await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {method:"PUT"})).json();
  const ws=new WebSocket(target.webSocketDebuggerUrl); const pending=new Map(); let next=0;
  await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true});});
  ws.addEventListener("message", event=>{const value=JSON.parse(String(event.data));if(!value.id)return;const task=pending.get(value.id);if(!task)return;pending.delete(value.id);clearTimeout(task.timer);if(value.error)task.reject(new Error(value.error.message));else task.resolve(value.result);});
  const send=(method,params={},timeoutMs=20000)=>new Promise((resolve,reject)=>{const id=++next;const timer=setTimeout(()=>{pending.delete(id);reject(new Error("CDP timeout: "+method));},timeoutMs);pending.set(id,{resolve,reject,timer});try{ws.send(JSON.stringify({id,method,params}));}catch(error){clearTimeout(timer);pending.delete(id);reject(error);}});
  const evaluate=async expression => {const result=await send("Runtime.evaluate", {expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.text);return result.result?.value;};
  await send("Page.enable"); await send("Runtime.enable"); await send("Emulation.setDeviceMetricsOverride", {width:viewport.width,height:viewport.height,deviceScaleFactor:1,mobile:viewport.width<760});
  await send("Page.addScriptToEvaluateOnNewDocument", {source:`(() => {
    const state=${JSON.stringify(state)};
    const original=window.fetch.bind(window); const mutations=[]; let draft=null;
    window.__rhenQa={mutations};
    const workspace={schema_version:"anevum.workspace-state.v1",workspace_id:"wrk_"+"a".repeat(32),member_id:state==="crossed"?"other-member":"qa-member",workspace_kind:"MEMBER_PRIVATE",engine_source:"RHEN_NEXT",evidence_state:"NOT_CONFIGURED",execution_permission:"NONE",broker_link_state:"NOT_LINKED",capabilities:["VIEW"],updated_at:"2026-10-10T14:00:00.000Z"};
    window.fetch=async(input,init={}) => {
      const url=String(input); const method=init.method||"GET";
      if(url.includes("/api/member/availability"))return Response.json({available:state!=="disabled",provider:state==="disabled"?null:"google"});
      if(url.includes("/api/auth/get-session"))return Response.json(["disabled","signed-out"].includes(state)?null:{session:{id:"qa-session",userId:"qa-member",expiresAt:new Date(Date.now()+3600000).toISOString()},user:{id:"qa-member",name:"QA Member",email:"member@example.test",emailVerified:true}});
      if(url.includes("/api/member/rhen/workspace"))return state==="off"?Response.json({message:"Not enabled"},{status:503}):Response.json({available:true,workspace:state==="empty"?null:workspace});
      if(url.includes("/api/member/rhen/draft")) {
        if(method==="PUT"){mutations.push(method);draft={...JSON.parse(init.body),marketScope:"us_equities_etfs",direction:"long_only",updatedAt:"2026-10-10T14:00:00.000Z"};}
        if(method==="DELETE"){mutations.push(method);draft=null;}
        return Response.json({available:true,draft,executionEnabled:false,brokerageConnected:false});
      }
      if(url.includes("/api/member/brokerage"))return Response.json({integration:"alpaca_connect",connectionAvailable:state==="review"||state==="elevated",accountConnected:state==="connected",paperTradingEnabled:false,liveTradingEnabled:state==="elevated",brokerWriteEnabled:state==="elevated",depositsEnabled:false,withdrawalsEnabled:false,account:state==="connected"?{environment:"paper",ending:"1234"}:null});
      if(url.includes("/api/command/"))return Response.json({message:"Operator access required"},{status:401});
      if(url.includes("/api/public/trading/"))throw new Error("Retired live feed must not be polled");
      return original(input,init);
    };
  })()`});
  await send("Page.navigate",{url:base+route},30000);
  const rootExpr='document.querySelector(".anevum-commons-v5-mount")?.shadowRoot';
  const accountExpr=rootExpr+'?.querySelector(".c2-member")';
  let mounted=false;
  for(let i=0;i<150;i++) {
    mounted=await evaluate(`(() => {
      const surface=${accountExpr}; const text=surface?.textContent||"";
      if(!surface||text.includes("Opening RHEN")||text.includes("Checking your private")||text.includes("Checking capabilities")||text.includes("Checking your draft"))return false;
      if(!["disabled","signed-out"].includes(${JSON.stringify(state)})&&!surface.querySelector(".c2-rhen"))return false;
      return true;
    })()`);
    if(mounted)break; await pause(100);
  }
  if(!mounted)throw new Error("Private RHEN did not finish mounting: "+route+" / "+state);
  const info=await evaluate(`(() => {
    const root=${rootExpr},surface=${accountExpr};
    return {text:surface.textContent,overflow:document.documentElement.scrollWidth>innerWidth+1,
      nestedMain:!!surface.querySelector("main"),
      operator:!!surface.querySelector('a[href^="/command/rhen"]'),
      form:!!surface.querySelector("form"),
      review:!!surface.querySelector('a[href="/apps/rhen/connect"]'),
      selected:surface.querySelector('nav[aria-label="RHEN workspace"] a[aria-current="page"]')?.getAttribute("href"),
      inputColor:surface.querySelector("input")?getComputedStyle(surface.querySelector("input")).backgroundColor:null,
      evidence:surface.querySelector('[data-evidence-state="SUSPENDED_FOR_REBUILD"]')?.textContent,
      mutations:window.__rhenQa.mutations};
  })()`);
  if(info.overflow||info.operator||info.nestedMain)throw new Error("Private RHEN layout or owner separation failed "+JSON.stringify(info));
  if(state==="disabled"&&(!info.text.includes("not open yet")||info.form||info.selected))throw new Error("Disabled RHEN showed private controls");
  if(state==="signed-out"&&(!info.text.includes("Sign in to use")||info.form||info.selected))throw new Error("Signed-out RHEN showed private controls");
  if(!["disabled","signed-out"].includes(state)&&info.selected!==route)throw new Error("Wrong RHEN active route: "+route);
  if(state==="crossed"&&(!info.text.includes("could not be verified")||info.text.includes("wrk_")))throw new Error("Cross-member workspace displayed");
  if(state==="off"&&info.text.includes("Create private workspace"))throw new Error("Disabled allocation advertised");
  if(state==="elevated"&&(info.review||!info.text.includes("could not be verified")))throw new Error("Unexpected broker authority did not fail closed");
  if(state==="review"&&!info.review)throw new Error("Read-only paper review entry missing");
  if(state==="connected"&&(!info.review||!info.text.includes("1234")))throw new Error("Masked paper status missing");
  if(route==="/apps/rhen/evidence"&&(!info.evidence||!info.evidence.includes("suspended")))throw new Error("Retired evidence state missing");
  if(route==="/apps/rhen/setup"&&state==="member"){
    await evaluate(`${accountExpr}.querySelector('#draft-name').focus()`);
    await send("Input.insertText",{text:"Private QA draft"});
    await pause(100);
    await evaluate(`${accountExpr}.querySelector('form').requestSubmit()`);
    let saved=false;
    for(let i=0;i<50;i++){saved=await evaluate(`${accountExpr}.textContent.includes("Draft saved to your ANEVUM account")`);if(saved)break;await pause(100);}
    if(!saved)throw new Error("Private draft did not save");
    await evaluate(`${accountExpr}.querySelector('.member-draft-delete').click()`);
    for(let i=0;i<50;i++){if(await evaluate(`${accountExpr}.textContent.includes("Draft deleted")`))break;await pause(100);}
    const result=await evaluate(`({text:${accountExpr}.textContent,mutations:window.__rhenQa.mutations})`);
    if(!result.text.includes("Draft deleted")||JSON.stringify(result.mutations)!==JSON.stringify(["PUT","DELETE"]))throw new Error("Private draft lifecycle failed");
  } else if(info.mutations.length)throw new Error("Read-only navigation performed a mutation");
  const png=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  const slug=route.split("/")[3]||"overview";
  fs.writeFileSync(path.join(output,`private-rhen-${slug}-${state}-${viewport.width}.png`),Buffer.from(png.data,"base64"));
  console.log(JSON.stringify({route,state,width:viewport.width,ok:true}));
  ws.close();await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
}
try {
  for(const width of [320,390,768,1024,1440])
    for(const route of ["/apps/rhen","/apps/rhen/account","/apps/rhen/setup","/apps/rhen/evidence","/apps/rhen/research","/apps/rhen/updates"])
      await runCase({width,height:width<760?900:1000},"member",route);
  for(const state of ["disabled","signed-out","off","crossed","empty"])
    await runCase({width:390,height:900},state,"/apps/rhen");
  for(const state of ["review","connected","elevated"])
    await runCase({width:390,height:900},state,"/apps/rhen/account");
} finally {
  if(chrome.exitCode === null && chrome.signalCode === null) {
    await new Promise(resolve => {
      const timeout=setTimeout(() => {chrome.kill("SIGKILL");resolve();},5000);
      chrome.once("close",() => {clearTimeout(timeout);resolve();});chrome.kill();
    });
  }
  await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}

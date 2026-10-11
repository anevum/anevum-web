// Synthetic accounts and requests exist only in this browser fixture, never the server.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const base = process.env.BASE_URL;
if (!base) throw new Error("BASE_URL is required");
const output = path.join(process.env.RUNNER_TEMP || os.tmpdir(), "anevum-visuals");
fs.mkdirSync(output, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "anevum-moderation-qa-"));
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
  const surface = root + '?.querySelector(".c2-moderation")';
  const waitFor = async (expression, label) => {
    for (let i=0;i<120;i++){if(await evaluate(expression))return;await pause(100);}
    throw new Error("Moderation browser timeout: "+label+" / "+state+" / "+JSON.stringify(await snapshot()));
  };
  const snapshot = () => evaluate(`(() => {
    const page=${surface};return {state:page?.dataset.reviewState,text:page?.textContent||"",
      cards:page?.querySelectorAll('.c2-moderation-item').length||0,
      textarea:page?.querySelector('textarea')?.value,
      blocked:[...(page?.querySelectorAll('form button')||[])].every(button=>button.disabled),
      mutations:window.__reviewQa.mutations,loads:window.__reviewQa.loads,pathname:location.pathname};
  })()`);
  const enterReason = async () => {
    await evaluate(`${surface}.querySelector('textarea').focus()`);
    await send("Input.insertText",{text:"Evidence supports the documented review decision."});
  };
  try {
    await send("Page.enable");await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride",{width,height:width<760?900:1000,deviceScaleFactor:1,mobile:width<760});
    await send("Page.addScriptToEvaluateOnNewDocument",{source:`(() => {
      const state=${JSON.stringify(state)},original=window.fetch.bind(window);
      const qa=window.__reviewQa={member:"alpha",loads:[],mutations:[],held:[],aborted:[],completed:false};
      qa.release=kind=>{qa.held.filter(item=>item.kind===kind).forEach(item=>item.resolve());qa.held=qa.held.filter(item=>item.kind!==kind);};
      const hold=kind=>new Promise(resolve=>qa.held.push({kind,resolve}));
      const id=index=>"223e4567-e89b-12d3-a456-"+String(index).padStart(12,"0");
      window.fetch=async(input,init={})=>{
        const url=String(input),member=qa.member;
        if(url.includes("/api/member/availability"))return Response.json({available:state!=="disabled",provider:"google"});
        if(url.includes("/api/auth/get-session"))return Response.json(state==="signed-out"||state==="disabled"?null:{session:{id:"session-"+member,userId:member,expiresAt:new Date(Date.now()+3600000).toISOString()},user:{id:member,name:member,email:member+"@example.test",emailVerified:true}});
        if(url.includes("/api/member/commons/moderation/reports")){
          init.signal?.addEventListener("abort",()=>qa.aborted.push(member),{once:true});
          if(init.method==="POST"){
            const body=JSON.parse(init.body),reportId=url.split("/").at(-2);qa.mutations.push({member,reportId,...body,keys:Object.keys(body).sort()});
            if(state==="switch")await hold("save"); // Intentionally ignore cancellation.
            if(state==="network"){qa.completed=true;throw new TypeError("Synthetic network uncertainty");}
            if(state==="conflict")return Response.json({message:"Already resolved"},{status:409});
            if(state==="revoked")return Response.json({message:"Access revoked"},{status:403});
            const ack={schemaVersion:"anevum.commons-review.v1",reviewerMemberId:member,reportId,decision:body.decision,resolved:true,moderationAuditRecorded:true,executionEnabled:false};
            if(state==="wrong-report")ack.reportId=id(999);
            if(state==="wrong-decision")ack.decision=body.decision==="HIDE"?"DISMISS":"HIDE";
            if(state==="wrong-reviewer")ack.reviewerMemberId="beta";
            if(state==="audit-missing")ack.moderationAuditRecorded=false;
            if(state==="execution-enabled")ack.executionEnabled=true;
            if(state==="review")qa.completed=true;
            return Response.json(ack);
          }
          qa.loads.push(member);
          if(state==="late-load"&&member==="alpha")await hold("load"); // Complete after switching accounts.
          if(member==="beta"||state==="denied")return Response.json({message:"Staff authorization required"},{status:403});
          if(state==="unavailable")return Response.json({message:"Pilot unavailable"},{status:503});
          const count=qa.completed?0:state==="capped"?30:1;
          const pending=Array.from({length:count},(_,index)=>({id:id(index+1),reason:"privacy",createdAt:77+index,post:{id:id(index+101),title:"Alpha private report "+(index+1),body:"Synthetic reported discussion with policy and methodological evidence.",status:"PUBLISHED"}}));
          if(state==="malformed")pending[0].post.body={private:"Never render"};
          return Response.json({schemaVersion:"anevum.commons-review.v1",reviewerMemberId:state==="crossed"?"beta":member,pending,pageCap:30,olderPendingMayExist:count===30});
        }
        if(url.includes("/api/command/"))return Response.json({message:"Operator access required"},{status:401});
        if(url.startsWith("/api/member/"))throw new Error("Unexpected member fixture request");
        return original(input,init);
      };
    })()`});
    await send("Page.navigate",{url:base+"/communities/moderation"});
    const denied=["signed-out","disabled","denied","unavailable"].includes(state);
    const invalid=["malformed","crossed"].includes(state);
    if(denied||invalid){
      await waitFor(`${surface}?.dataset.reviewState===${JSON.stringify(invalid?"error":"denied")}`,"closed queue");
      const info=await snapshot();
      if(info.cards||info.text.includes("Alpha private")||info.mutations.length)throw new Error("Unverified queue exposed report data");
      if(["signed-out","disabled"].includes(state)&&info.loads.length)throw new Error("Unavailable account requested private queue");
    }else if(state==="late-load"||state==="switch"){
      if(state==="switch"){
        await waitFor(`${surface}?.dataset.reviewState==="ready"`,"alpha queue");await enterReason();
        await evaluate(`${surface}.querySelector('form').requestSubmit()`);
        await waitFor('window.__reviewQa.held.some(item=>item.kind==="save")',"held decision");
      }else await waitFor('window.__reviewQa.held.some(item=>item.kind==="load")',"held queue");
      await evaluate(`window.__reviewQa.member="beta";window.dispatchEvent(new StorageEvent("storage",{key:"better-auth.message",newValue:JSON.stringify({event:"session",data:{trigger:"getSession"},clientId:"fixture-other-tab"})}))`);
      await waitFor('window.__reviewQa.loads.includes("beta")',"beta queue request");
      await waitFor(`${surface}?.dataset.reviewState==="denied"`,"beta denied");
      const before=await snapshot();if(before.cards||before.text.includes("Alpha private")||before.textarea)throw new Error("Account switch retained prior review form");
      await evaluate(`window.__reviewQa.release(${JSON.stringify(state==="switch"?"save":"load")})`);await pause(300);
      const info=await snapshot();
      if(info.state!=="denied"||info.cards||info.text.includes("Alpha private")||info.text.includes("was recorded")||info.pathname!=="/communities/moderation")throw new Error("Late prior member response changed denied review page");
      if(info.mutations.length!==(state==="switch"?1:0)||info.mutations.some(item=>item.member!=="alpha"))throw new Error("Unexpected cross-account mutation");
      if(!await evaluate('window.__reviewQa.aborted.includes("alpha")'))throw new Error("Prior review scope was not aborted");
    }else{
      await waitFor(`${surface}?.dataset.reviewState==="ready"`,"authorized queue");
      let info=await snapshot();
      if(!info.blocked||info.cards!==(state==="capped"?30:1))throw new Error("Review form did not require a documented reason");
      if(state==="capped"){
        if(!info.text.includes("30 pending reports")||!info.text.includes("may exist"))throw new Error("Capped queue omitted incomplete-page notice");
      }else{
        await evaluate(`${surface}.querySelector('textarea').focus()`);
        await send("Input.insertText",{text:"short"});
        if(!(await snapshot()).blocked)throw new Error("Short reason enabled review action");
        await evaluate(`(() => {const field=${surface}.querySelector('textarea');field.focus();field.select();})()`);
        await send("Input.insertText",{text:"Evidence supports the documented review decision."});
        // Keyboard traversal must expose the existing focus-visible treatment.
        await send("Input.dispatchKeyEvent",{type:"keyDown",key:"Tab",code:"Tab",windowsVirtualKeyCode:9});
        await send("Input.dispatchKeyEvent",{type:"keyUp",key:"Tab",code:"Tab",windowsVirtualKeyCode:9});
        if(!await evaluate(`(() => {const button=${surface}.querySelector('form button');return ${root}.activeElement===button&&getComputedStyle(button).outlineStyle!=="none";})()`))throw new Error("Review submit lacks visible keyboard focus");
        await evaluate(`(() => {const select=${surface}.querySelector('select');select.value="HIDE";select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
        const formPng=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
        if(state==="review")fs.writeFileSync(path.join(output,`moderation-review-form-${width}.png`),Buffer.from(formPng.data,"base64"));
        await evaluate(`${surface}.querySelector('form').requestSubmit()`);
        await waitFor(`${surface}?.textContent.includes(${JSON.stringify(state==="review"?"was recorded":"decision not verified")})`,"review outcome");
        info=await snapshot();
        if(info.mutations.length!==1||info.mutations[0].decision!=="HIDE"||info.mutations[0].reason!=="Evidence supports the documented review decision."||info.mutations[0].keys.join(",")!=="decision,reason")throw new Error("Review posted unexpected request fields");
        if(state==="review"){
          if(info.cards||!info.text.includes("No pending reports"))throw new Error("Verified decision did not remove report");
        }else{
          if(!info.blocked||info.text.includes("was recorded"))throw new Error("Unverified decision claimed success or permitted immediate retry");
          if(state==="revoked"&&(info.cards||info.state!=="denied"))throw new Error("Authorization denial retained queue");
          if(state==="network"){
            await evaluate(`${surface}.querySelector('.c2-review-reload').click()`);
            await waitFor(`${surface}?.dataset.reviewState==="ready"&&${surface}?.textContent.includes("No pending reports")`,"authoritative reload");
            info=await snapshot();if(info.mutations.length!==1||info.text.includes("decision not verified")||info.text.includes("was recorded"))throw new Error("Uncertain reload repeated mutation or claimed recorded audit");
          }
        }
      }
    }
    const overflow=await evaluate(`(() => {const page=${surface};return document.documentElement.scrollWidth>innerWidth+1||[...(page?.querySelectorAll('*')||[])].some(el=>el.scrollWidth>el.clientWidth+2&&getComputedStyle(el).display!=="inline");})()`);
    if(overflow||errors.length)throw new Error("Moderation layout/runtime error: "+JSON.stringify({overflow,errors}));
    const png=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
    fs.writeFileSync(path.join(output,`moderation-review-${state}-${width}.png`),Buffer.from(png.data,"base64"));
    console.log(JSON.stringify({route:"/communities/moderation",state,width,ok:true}));
  } finally {
    ws.close(); await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
  }
}
try {
  for (let i = 0; i < 200; i++) {
    try { port = Number(fs.readFileSync(path.join(profile,"DevToolsActivePort"),"utf8").split("\n")[0]); if(port) break; } catch {}
    if(chrome.exitCode!==null) throw new Error("Chrome exited before moderation QA");
    await pause(100);
  }
  if (!port) throw new Error("Chrome did not start");
  for (const width of [320,390,768,1024,1440]) await runCase(width,"review");
  for (const state of ["signed-out","disabled","denied","unavailable","malformed","crossed","capped","wrong-report","wrong-decision","wrong-reviewer","audit-missing","execution-enabled","conflict","network","revoked","switch","late-load"]) await runCase(390,state);
} finally {
  if (chrome.exitCode===null&&chrome.signalCode===null) {
    await new Promise(resolve=>{
      const timer=setTimeout(()=>{chrome.kill("SIGKILL");resolve();},5000);
      chrome.once("close",()=>{clearTimeout(timer);resolve();});chrome.kill();
    });
  }
  await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}

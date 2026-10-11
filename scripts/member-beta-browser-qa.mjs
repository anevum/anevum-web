// Browser-only fake sessions and endpoint responses: no real identity, secrets or broker calls.
import {spawn} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const base=process.env.BASE_URL;
if(!base)throw new Error("BASE_URL required");
const output=path.join(process.env.RUNNER_TEMP||os.tmpdir(),"anevum-visuals");
fs.mkdirSync(output,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"anevum-beta-browser-"));
const chrome=spawn("google-chrome",[
  "--headless","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
  "--remote-debugging-address=127.0.0.1","--remote-debugging-port=0",
  "--user-data-dir="+profile,"about:blank"
],{stdio:"ignore"});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let port;

function installFixture(scenario) {
  const original=window.fetch.bind(window);
  const test=window.__memberBetaQa={scenario,calls:[]};
  const signedIn=!["disabled","signed-out"].includes(scenario);
  const userId=scenario==="second"?"beta_member_5678":"alpha_member_1234";
  window.fetch=async(input,init={})=>{
    const url=String(input);
    const method=init.method||"GET";
    if(url.includes("/api/member/")||url.includes("/api/auth/")||url.includes("/api/command/")){
      test.calls.push({path:url,method});
      if(method!=="GET")throw Error("Private beta browser test must not mutate accounts");
    }
    if(url.includes("/api/member/availability"))
      return Response.json({available:scenario!=="disabled",provider:scenario==="disabled"?null:"google"});
    if(url.includes("/api/auth/get-session"))return Response.json(signedIn?{
      session:{id:"synthetic-session-"+userId,userId,expiresAt:new Date(Date.now()+3600000).toISOString()},
      user:{id:userId,name:userId,email:userId+"@example.test",emailVerified:true}
    }:null);
    if(url.includes("/api/command/session"))return scenario==="owner"?
      Response.json({auth_source:"cloudflare_access",command_admin:true,owner_member_bound:true}):
      Response.json({message:"Operator permission denied"},{status:401});
    if(url.includes("/api/member/owner-paper/status")){
      if(scenario!=="owner")throw Error("Ordinary member reached developer PAPER endpoint");
      return Response.json({available:true,paper:true,executionEnabled:false,
        account:{ending:"1234",environment:"paper",status:"ACTIVE"}});
    }
    if(url.includes("/api/member/me"))return Response.json({
      user:{id:scenario==="crossed"?"other-member":userId,name:userId},
      profile:{displayName:scenario==="crossed"?"Other private name":userId,theme:"system"},
      savedApps:[],follows:[],entitlements:[]
    });
    if(url.includes("/api/member/rhen/workspace"))return Response.json({available:true,workspace:null});
    if(url.includes("/api/member/rhen/draft"))
      return Response.json({message:"Draft feature not enabled"},{status:503});
    if(url.includes("/api/member/commons/posts"))
      return Response.json({message:"Discussions pilot not enabled"},{status:503});
    if(url.startsWith("/api/member/"))throw Error("Unexpected member endpoint");
    return original(input,init);
  };
}

async function runCase(width,scenario){
  const target=await(await fetch("http://127.0.0.1:"+port+"/json/new?about:blank",{method:"PUT"})).json();
  const ws=new WebSocket(target.webSocketDebuggerUrl);
  let next=0;
  const pending=new Map(),errors=[];
  await new Promise((resolve,reject)=>{
    ws.addEventListener("open",resolve,{once:true});
    ws.addEventListener("error",reject,{once:true});
  });
  ws.addEventListener("message",event=>{
    const response=JSON.parse(String(event.data));
    if(response.method==="Runtime.exceptionThrown")errors.push(response.params?.exceptionDetails?.text||"Script error");
    if(!response.id)return;
    const p=pending.get(response.id);
    if(!p)return;
    pending.delete(response.id);clearTimeout(p.timer);
    if(response.error)p.reject(new Error(response.error.message));else p.resolve(response.result);
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++next;
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error("Chromium timeout "+method));},30000);
    pending.set(id,{resolve,reject,timer});
    ws.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression=>{
    const reply=await send("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true});
    if(reply.exceptionDetails)throw new Error(reply.exceptionDetails.text);
    return reply.result?.value;
  };
  try {
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride",{
      width,height:width===390?844:1000,deviceScaleFactor:1,mobile:width===390
    });
    await send("Page.addScriptToEvaluateOnNewDocument",{
      source:"("+installFixture.toString()+")("+JSON.stringify(scenario)+");"
    });
    await send("Page.navigate",{url:base+"/me/beta"});
    let observed={};
    for(let attempt=0;attempt<130;attempt++){
      observed=await evaluate("(() => {"+
        "const root=document.querySelector('.anevum-commons-v5-mount')?.shadowRoot;"+
        "const page=root?.querySelector('.c2-member .c2-beta');"+
        "const heading=page?.querySelector('h1')?.textContent||'';"+
        "return {heading,text:page?.textContent||'',"+
        "states:[...(page?.querySelectorAll('[data-beta-state]')||[])].map(x=>x.dataset.betaState),"+
        "owner:root?.querySelector('[data-beta-owner-paper]')?.textContent||'',"+
        "links:[...(page?.querySelectorAll('a[href]')||[])].map(x=>x.getAttribute('href')),"+
        "robots:document.querySelector('meta[name=robots]')?.content||'',"+
        "canonical:document.querySelector('link[rel=canonical]')?.href||'',"+
        "overflow:document.documentElement.scrollWidth>innerWidth+1,"+
        "calls:window.__memberBetaQa?.calls||[]};"+
      "})()");
      const active=!["disabled","signed-out"].includes(scenario);
      const expectedHead=active?"Test your account and tools":
        scenario==="disabled"?"Beta unavailable":"Sign in to test your account";
      const stable=observed.heading===expectedHead &&
        (!active||(observed.states.length===4&&!observed.states.includes("checking"))) &&
        (scenario!=="owner"||observed.owner.includes("PAPER account ending 1234"));
      if(stable)break;
      await pause(100);
    }
    const active=!["disabled","signed-out"].includes(scenario);
    const expectedHead=active?"Test your account and tools":
      scenario==="disabled"?"Beta unavailable":"Sign in to test your account";
    if(observed.heading!==expectedHead||
       (active&&(observed.states.length!==4||observed.states.includes("checking")))||
       (scenario==="owner"&&!observed.owner.includes("PAPER account ending 1234")))
      throw new Error("Private beta did not settle: "+JSON.stringify({scenario,width,observed}));
    if(observed.overflow||errors.length||!observed.robots.startsWith("noindex")||observed.canonical)
      throw new Error("Private beta layout, SEO or JavaScript regression: "+JSON.stringify({scenario,width,observed,errors}));
    const calls=observed.calls.filter(c=>c.path.includes("/api/member/")&&!c.path.includes("/availability"));
    if(!active) {
      if(observed.states.length||calls.length||observed.owner)
        throw new Error("Signed-out user retrieved private member data: "+JSON.stringify(observed));
    } else {
      const first=scenario==="crossed"?"error":"available";
      if(JSON.stringify(observed.states)!==JSON.stringify([first,"available","disabled","disabled"]))
        throw new Error("Beta capability status incorrect: "+JSON.stringify(observed));
      for(const endpoint of ["/api/member/me","/api/member/rhen/workspace","/api/member/rhen/draft","/api/member/commons/posts"])
        if(!calls.some(c=>c.path.includes(endpoint)))throw new Error("Missing member-scoped capability read: "+endpoint);
      if(scenario==="crossed"&&(observed.links.includes("/me/settings")||
                                  observed.text.includes("Other private name")))
        throw new Error("Cross-member account response shown as verified.");
      const paperCalls=calls.filter(c=>c.path.includes("/api/member/owner-paper/status"));
      if(scenario==="owner") {
        if(paperCalls.length!==1 || !observed.owner.includes("No execution authority.") ||
           observed.owner.includes("FULL_ACCOUNT_NUMBER"))
          throw new Error("Owner private PAPER status verification failed.");
      } else if(paperCalls.length||observed.owner)
        throw new Error("Owner PAPER details leaked to ordinary member.");
    }
    if(observed.calls.some(c=>c.method!=="GET"))throw new Error("Beta browser attempted a write.");
    const screenshot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
    fs.writeFileSync(path.join(output,"member-beta-"+scenario+"-"+width+".png"),
      Buffer.from(screenshot.data,"base64"));
    console.log(JSON.stringify({scenario,width,ok:true,capabilities:observed.states,owner:!!observed.owner}));
  } finally {
    ws.close();
    await fetch("http://127.0.0.1:"+port+"/json/close/"+target.id).catch(()=>{});
  }
}

try {
  for(let count=0;count<200;count++){
    try{
      port=Number(fs.readFileSync(path.join(profile,"DevToolsActivePort"),"utf8").split("\n")[0]);
      if(port)break;
    }catch{}
    if(chrome.exitCode!==null)throw new Error("Chromium exited before QA");
    await pause(100);
  }
  if(!port)throw new Error("Chromium debugger did not start");
  for(const width of [390,1440])
    for(const scenario of ["disabled","signed-out","member","second","crossed","owner"])
      await runCase(width,scenario);
} finally {
  if(chrome.exitCode===null&&chrome.signalCode===null)
    await new Promise(resolve=>{
      const timeout=setTimeout(()=>{chrome.kill("SIGKILL");resolve();},5000);
      chrome.once("close",()=>{clearTimeout(timeout);resolve();});
      chrome.kill("SIGTERM");
    });
  await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}

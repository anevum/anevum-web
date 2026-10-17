// INSTITUTE V1 / isolated real-browser acceptance; synthetic, read-only.
import {spawn} from "node:child_process";
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from "node:fs";
import {join} from "node:path";
import {tmpdir} from "node:os";

const args=process.argv.slice(2);
const option=name=>{const i=args.indexOf(name);return i<0?null:args[i+1]};
const chrome=option("--chrome"),base=option("--base"),output=option("--output");
if(!chrome||!output||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base||""))
  throw Error("INSTITUTE_BROWSER_LOOPBACK_ONLY");
mkdirSync(output,{recursive:true});

const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,timeout=18000){
  const stop=Date.now()+timeout;let lastError=null;
  while(Date.now()<stop){
    try{const r=await fn();if(r)return r}catch(e){lastError=e}
    await delay(110);
  }
  throw Error("INSTITUTE_BROWSER_TIMEOUT: "+String(lastError||"unsatisfied condition"));
}
function connect(url){
  return new Promise((resolve,reject)=>{
    const ws=new WebSocket(url);const calls=new Map();let seq=0;
    ws.addEventListener("open",()=>resolve({
      send(method,params={}){return new Promise((res,rej)=>{
        const id=++seq;calls.set(id,{res,rej});ws.send(JSON.stringify({id,method,params}));
      })},close(){ws.close();}
    }),{once:true});
    ws.addEventListener("message",({data})=>{
      const v=JSON.parse(String(data));if(typeof v.id!=="number")return;
      const x=calls.get(v.id);if(!x)return;calls.delete(v.id);
      v.error?x.rej(Error(v.error.message)):x.res(v.result||{});
    });
    ws.addEventListener("error",()=>reject(Error("INSTITUTE_CDP_CONNECT_ERROR")),{once:true});
    ws.addEventListener("close",()=>{
      for(const v of calls.values())v.rej(Error("INSTITUTE_CDP_DISCONNECTED"));calls.clear();
    });
  });
}
const profile=mkdtempSync(join(tmpdir(),"anevum-institute-"));
const child=spawn(chrome,[
  "--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
  "--disable-background-networking","--no-first-run","--remote-allow-origins=*",
  "--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"
],{stdio:"ignore"});
let client=null;
const observations=[];
try{
  const port=await until(()=>{
    const file=join(profile,"DevToolsActivePort");
    if(!existsSync(file))return null;
    const first=readFileSync(file,"utf8").split("\n")[0];
    return /^\d+$/.test(first)?first:null;
  });
  const ws=await until(async()=>{
    const res=await fetch("http://127.0.0.1:"+port+"/json/list");
    if(!res.ok)return null;
    return (await res.json()).find(x=>x.type==="page"&&x.webSocketDebuggerUrl)?.webSocketDebuggerUrl;
  });
  client=await connect(ws);
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  const evaluate=async expression=>{
    const r=await client.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text||"INSTITUTE_EVAL_FAILED");
    return r.result?.value;
  };
  const assert=async (label,expr)=>{
    const value=await evaluate(expr);
    if(!value)throw Error("INSTITUTE_BROWSER_ASSERT_"+label);
    observations.push({label,passed:true});
  };
  const screenshot=async name=>{
    const r=await client.send("Page.captureScreenshot",{format:"png",fromSurface:true});
    if(!r.data)throw Error("INSTITUTE_NO_SCREENSHOT_"+name);
    const buffer=Buffer.from(r.data,"base64");
    if(buffer.length<5000)throw Error("INSTITUTE_SHORT_SCREENSHOT_"+name);
    writeFileSync(join(output,name+".png"),buffer);
  };
  const visit=async (width,height,reduced)=>{
    await client.send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<=640});
    await client.send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:reduced?"reduce":"no-preference"}]});
    await client.send("Page.navigate",{url:base+"/creator/institute/lab"});
    await until(()=>evaluate("document.querySelector('.il-lab[data-institute-prototype]')?.dataset.entity==='observation-node-001'"));
    await until(()=>evaluate("Boolean(document.querySelector('.il-art img')?.complete && document.querySelector('.il-art img')?.naturalWidth>0)"));
    await assert("native-route-"+width,"location.pathname==='/creator/institute/lab' && !!document.querySelector('.il-profile')");
    await assert("source-noindex-"+width,"document.querySelector('meta[name=robots]')?.content.includes('noindex')");
    await assert("loaded-svg-"+width,"document.querySelector('.il-art img')?.naturalWidth > 0");
    await assert("responsive-"+width,"document.querySelector('.il-lab').scrollWidth <= document.querySelector('.il-lab').clientWidth+2");
    await assert("real-entity-count-"+width,"document.querySelectorAll('.il-selection-card').length===2");
    if(reduced)await assert("motion-reduced-"+width,"document.querySelector('.il-art img').getAttribute('src').endsWith('-still.svg')");
  };
  await visit(1440,900,false);
  await screenshot("institute-desktop-1440");
  await evaluate("document.querySelectorAll('.il-selection-card')[1].click();true");
  await until(()=>evaluate("document.querySelector('.il-lab')?.dataset.entity==='regulation-node-002'"));
  await evaluate("document.querySelectorAll('.il-state-button')[1].click();true");
  await assert("triage-local","document.querySelector('.il-art')?.dataset.state==='triage'");
  await evaluate("document.getElementById('il-tab-transmissions').click();true");
  await assert("transmission-panel","document.querySelector('.il-notice-options button')!==null");
  await evaluate("document.querySelectorAll('.il-notice-options button')[0].click();true");
  await until(()=>evaluate("Boolean(document.querySelector('.il-notification.is-open'))"),4000);
  await screenshot("institute-transmission-preview-1440");
  await assert("synthetic-notice","document.querySelector('.il-notification').textContent.includes('SYNTHETIC')");
  await assert("human-authority","document.querySelector('.il-lab').textContent.includes('No live account')");
  await visit(390,844,true);
  await screenshot("institute-mobile-390");
  await visit(320,720,true);
  await screenshot("institute-mobile-320");
  writeFileSync(join(output,"acceptance.json"),JSON.stringify({
    schema:"anevum.institute.browser-acceptance.v1",
    status:"PASS",host:"127.0.0.1",syntheticOnly:true,sourceRoute:"/creator/institute/lab",
    observations
  },null,2));
  console.log("INSTITUTE_BROWSER_PASS "+observations.length+" checks");
}finally{
  client?.close();child.kill("SIGKILL");
  rmSync(profile,{recursive:true,force:true});
}

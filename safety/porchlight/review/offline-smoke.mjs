/**
 * Browser QA for actual standalone offline HTML preview, with no HTTP server.
 * Launches Chromium on a local file:// URL. Synthetic test data only.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
const args = process.argv;
const output = resolve(args.includes("--output") ? args[args.indexOf("--output")+1] : "evidence/porchlight-v001");
const chrome = args.includes("--chrome") ? args[args.indexOf("--chrome")+1] : (process.env.CHROME || "google-chrome");
const htmlPath = resolve(args.includes("--file") ? args[args.indexOf("--file")+1] : join(output,"porchlight-offline-review.html"));
assert.ok(existsSync(htmlPath),"Generate the offline preview before browser smoke tests.");
const profile = mkdtempSync(join(tmpdir(),"porchlight-review-chromium-"));
mkdirSync(output,{recursive:true});
async function until(fn,ms=22000) {
 const deadline = Date.now()+ms;let last;
 while(Date.now()<deadline) { try{const v=await fn();if(v)return v}catch(e){last=e};await sleep(80); }
 throw last || new Error("Browser assertion timed out");
}
async function connect(address) {
 const ws = new WebSocket(address);
 const pending = new Map();let nextId=0;
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true})});
 const requests=[];
 ws.addEventListener("message",event=>{
  const data=JSON.parse(String(event.data));
  if (data.method==="Network.requestWillBeSent")requests.push(data.params?.request?.url||"");
  if (!data.id)return;
  const p=pending.get(data.id);if(!p)return;pending.delete(data.id);
  if(data.error)p.reject(Error(data.error.message));else p.resolve(data.result||{});
 });
 return {requests,send(method,params={}){
   const id=++nextId;
   return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  },close(){ws.close()}
 };
}
let child,cdp;
try {
 child=spawn(chrome,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
   "--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"],{stdio:"ignore"});
 const port=await until(()=>{
  const f=join(profile,"DevToolsActivePort");
  return existsSync(f)?readFileSync(f,"utf8").split("\n")[0]:null;
 });
 const ws=await until(async()=>{
  const result=await(await fetch("http://127.0.0.1:"+port+"/json/list")).json();
  return result.find(x=>x.type==="page")?.webSocketDebuggerUrl;
 });
 cdp=await connect(ws);
 await cdp.send("Page.enable");await cdp.send("Runtime.enable");await cdp.send("Network.enable");
 async function evaluate(expression) {
  const r=await cdp.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.text||"Runtime exception");
  return r.result?.value;
 }
 await cdp.send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await cdp.send("Page.navigate",{url:pathToFileURL(htmlPath).href});
 await until(()=>evaluate("document.readyState==='complete'"));
 await until(()=>evaluate("document.getElementById('host-count')?.textContent==='2'"));
 assert.equal(await evaluate("document.title.includes('FICTIONAL OFFLINE REVIEW')"),true);
 assert.equal(await evaluate("!!document.querySelector('meta[http-equiv=Content-Security-Policy]')"),true);
 assert.equal(await evaluate("window.__porchlightReview.snapshot().fictionalOnly"),true);
 assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth+2"),true);
 const before=await cdp.send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
 writeFileSync(join(output,"offline-review-390.png"),Buffer.from(before.data,"base64"));
 await evaluate("document.getElementById('demo-fill').click()");
 assert.equal(await evaluate("document.querySelector('#host-email').value"),"household@example.test");
 assert.equal(await evaluate("document.querySelector('#host-adult').checked"),true);
 await evaluate("document.getElementById('host-form').requestSubmit()");
 await until(()=>evaluate("window.__porchlightReview.snapshot().pending==='pending' && document.getElementById('receipt-code').value.length===64 && !document.getElementById('receipt-panel').hidden"));
 const pending=await evaluate("({receiptShown:!document.getElementById('receipt-panel').hidden, codeLength:document.getElementById('receipt-code').value.length, visible:document.querySelectorAll('.host-item').length})");
 assert.deepEqual(pending,{receiptShown:true,codeLength:64,visible:2});
 await evaluate("document.getElementById('demo-approve').click()");
 await until(()=>evaluate("document.querySelectorAll('.host-item').length===3"));
 assert.equal(await evaluate("document.querySelectorAll('.map-pin').length"),1);
 assert.equal(await evaluate("[...document.querySelectorAll('.host-item')].some(el=>el.innerText.includes('Participating household'))"),true);
 await evaluate("document.getElementById('report-host').value='00000000-0000-4000-8000-000000000101';document.getElementById('report-details').value='FICTIONAL reporting scenario';document.getElementById('report-form').requestSubmit()");
 await until(()=>evaluate("window.__porchlightReview.snapshot().reportCount===1"));
 await evaluate("document.getElementById('remove-form').requestSubmit()");
 await until(()=>evaluate("window.__porchlightReview.snapshot().pending==='withdrawn'"));
 await until(()=>evaluate("document.querySelectorAll('.host-item').length===2"));
 const privateAfterRemoval=await evaluate("({code:document.getElementById('remove-code').value, count:document.querySelectorAll('.host-item').length})");
 assert.equal(privateAfterRemoval.code,"");
 assert.equal(privateAfterRemoval.count,2);
 const outside=await evaluate("(async()=>{try{await fetch('https://example.com');return 'NOT_BLOCKED'}catch(e){return e.message}})()");
 assert.equal(outside,"OFFLINE_REVIEW_BLOCKED_EXTERNAL_REQUEST");
 await evaluate("document.querySelector('.host-item a[target=_blank]').click()");
 assert.equal(await evaluate("window.__porchlightReview.snapshot().outboundRequestsBlocked"),1);
 await evaluate("document.getElementById('demo-close').click()");
 const closed=await evaluate("({state:window.__porchlightReview.snapshot(),publicPins:document.querySelectorAll('.map-pin').length,count:document.getElementById('host-count').textContent})");
 assert.equal(closed.state.closed,true);
 assert.equal(closed.publicPins,0);
 assert.equal(closed.count,"0");
 const forbidden=cdp.requests.filter(url=>url.startsWith("http:")||url.startsWith("https:"));
 assert.deepEqual(forbidden,[],"No HTTP network access is permitted from the local HTML preview.");
 writeFileSync(join(output,"offline-acceptance.json"),JSON.stringify({passed:true,kind:"OFFLINE_SYNTHETIC_ONLY",file:htmlPath.split("/").pop(),
  hostForm:true,privateReceipt:true,simulatedApproval:true,areaOnlyNoPin:true,report:true,revocation:true,emergencyClose:true,
  externalNetworkBlocked:true,requestCount:cdp.requests.length,viewport:390},null,2));
 console.log("PORCHLIGHT_OFFLINE_INTERACTIVE_REVIEW=PASS");
} finally {
 try{cdp?.close()}catch{}
 if(child){child.kill();await sleep(200)}
 try{rmSync(profile,{recursive:true,force:true,maxRetries:3})}catch{}
}

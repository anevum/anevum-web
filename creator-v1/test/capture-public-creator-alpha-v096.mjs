/**
 * V096 public guest alpha real compiled React browser verification.
 * This is a loopback synthetic fixture, never a real account or release gate.
 */
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const [chrome,base,output]=process.argv.slice(2);
if(!chrome||!/^http:\/\/127\.0\.0\.1:\d+$/.test(base||'')||!output)
 throw Error('V096_LOCAL_CHROMIUM_AND_LOOPBACK_REQUIRED');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,timeout=30000){
 const deadline=Date.now()+timeout,seen=[];
 while(Date.now()<deadline){
  try{const value=await fn();if(value)return value;}catch(e){seen.push(String(e))}
  await pause(140);
 }
 throw Error('V096_BROWSER_TIMEOUT '+seen.slice(-2).join(' / '));
}
const profile=mkdtempSync(join(tmpdir(),'anevum-v096-alpha-'));
mkdirSync(output,{recursive:true});
const browser=spawn(chrome,[
 '--headless=new','--no-sandbox','--disable-dev-shm-usage',
 '--disable-background-networking','--remote-allow-origins=*','--no-first-run',
 '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'
],{stdio:'ignore'});
let socket=null;
const results=[];
try{
 const port=await until(()=>{
  const file=join(profile,'DevToolsActivePort');
  return existsSync(file)?readFileSync(file,'utf8').split('\n')[0]:null;
 });
 const websocket=await until(async()=>{
  const response=await fetch('http://127.0.0.1:'+port+'/json/list');
  if(!response.ok)return null;
  return (await response.json()).find(target=>target.type==='page')?.webSocketDebuggerUrl||null;
 });
 socket=new WebSocket(websocket);
 const pending=new Map();let n=0;
 socket.addEventListener('message',({data})=>{
  const msg=JSON.parse(String(data));if(typeof msg.id!=='number')return;
  const current=pending.get(msg.id);if(!current)return;pending.delete(msg.id);
  msg.error?current.reject(Error(msg.error.message)):current.resolve(msg.result||{});
 });
 await new Promise((resolve,reject)=>{
  socket.addEventListener('open',resolve,{once:true});
  socket.addEventListener('error',reject,{once:true});
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++n;pending.set(id,{resolve,reject});
  socket.send(JSON.stringify({id,method,params}));
 });
 const evaluate=async expr=>{
  const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
  return r.result?.value;
 };
 const ensure=async(label,expr)=>{
  const value=await evaluate(expr);
  if(!value)throw Error('V096_BROWSER_FAILED_'+label);
 };
 const capture=async name=>{
  const {data}=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
  if(!data||data.length<3000)throw Error('V096_SCREENSHOT_EMPTY_'+name);
  writeFileSync(join(output,name+'.png'),Buffer.from(data,'base64'));
 };
 await send('Page.enable');
 await send('Runtime.enable');
 for(const [width,height] of [[320,720],[390,844],[768,1024],[1440,900]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=390});
  await send('Page.navigate',{url:base+'/creator/studio/alpha'});
  await until(()=>evaluate('Boolean(document.querySelector("[data-public-alpha=v096]")&&document.querySelector(".ap96-frame"))'));
  await ensure('guest-no-sign-in-'+width,'Boolean(document.querySelector(".ap96-source")===null&&!document.querySelector(".st-status"))');
  await ensure('temp-guest-copy-'+width,'document.querySelector(".ap96-access-panel")?.textContent.includes("temporary local workspace")');
  await ensure('all-templates-'+width,'document.querySelectorAll(".ap96-template").length===3');
  await ensure('source-editor-'+width,'document.querySelector("#ap96-source")?.getAttribute("aria-label")==="Edit HTML source"');
  await ensure('iframe-sandbox-'+width,'document.querySelector(".ap96-frame")?.getAttribute("sandbox")===""');
  await ensure('scriptless-srcdoc-'+width,'Boolean(document.querySelector(".ap96-frame")?.getAttribute("srcdoc")?.includes("script-src"))');
  await ensure('private-files-absent-'+width,'!document.querySelector("[data-native-creator],input[type=file],.av095-review")');
  await ensure('no-horizontal-overflow-'+width,'document.documentElement.scrollWidth<=innerWidth+1');
  // The sandbox must create a real srcdoc browsing context under the
  // production-matching route CSP, not just an iframe attribute.
  await pause(750);
  const frameAudit=await send('Page.getFrameTree');
  const iframeAudit=await evaluate('(()=>{const f=document.querySelector(".ap96-frame");return {iframePresent:!!f,srcdocSize:f?.srcdoc?.length,rect:f?.getBoundingClientRect()?.toJSON?.(),sandbox:f?.getAttribute("sandbox"),htmlLength:document.documentElement.outerHTML.length}})()');
  console.log('V096_FRAME_TREE_DIAG '+JSON.stringify({frameTree:frameAudit.frameTree,iframe:iframeAudit,viewport:width}));
  await until(async()=>{
    const {frameTree}=await send('Page.getFrameTree');
    return frameTree?.childFrames?.some(x=>['about:srcdoc','about:blank'].includes(x.frame?.url||''));
  },5000);
  await capture('public-alpha-first-'+width);

  await evaluate('document.querySelectorAll(".ap96-template")[1].click()');
  await until(()=>evaluate('document.querySelector(".ap96-template.is-current")?.textContent.includes("Pocket card")'));
  await ensure('template-selected-'+width,'document.querySelector("#ap96-source")?.value.includes("My little universe")');
  await until(()=>evaluate('document.querySelector(".ap96-frame")?.getAttribute("srcdoc")?.includes("My little universe")'));
  await evaluate('document.getElementById("ap96-workspace").scrollIntoView({block:"start"});true');
  await pause(240);
  await capture('public-alpha-workspace-'+width);
  await capture('public-alpha-card-'+width);

  await evaluate('document.querySelector(".ap96-tabs button:nth-child(2)").click()');
  await ensure('css-tab-'+width,'document.querySelector("#ap96-source")?.getAttribute("aria-label")==="Edit CSS source"');
  await evaluate('document.querySelector(".ap96-devices button:last-child").click()');
  await ensure('desktop-preview-'+width,'document.querySelector(".ap96-stage-frame")?.classList.contains("ap96-stage-desktop")');
  await ensure('no-horizontal-overflow-after-device-'+width,'document.documentElement.scrollWidth<=innerWidth+1');
  await capture('public-alpha-desktop-'+width);

  await evaluate('document.querySelector(".ap96-download").click()');
  await ensure('export-confirmation-'+width,'document.querySelector(".ap96-notice")?.textContent.includes("Exported one HTML file")');
  results.push({width,height,anonymous:true,scriptDisabled:true,templates:3,
    responsive:true,exportAction:true,syntheticOnly:true,passed:true});
  console.log('V096_GUEST_BROWSER_PASS_'+width);
 }
 const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 assert.match(source,/^[a-f0-9]{40}$/);
 writeFileSync(join(output,'acceptance.json'),JSON.stringify({
  source,status:'PASS',syntheticOnly:true,physicalDeviceAcceptance:false,
  productionDeployment:false,results
 },null,2)+'\n');
}finally{
 try{if(socket?.readyState===1)socket.close();}catch{}
 if(browser.exitCode===null){browser.kill('SIGTERM');await pause(800)}
 try{rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:200})}catch{}
}

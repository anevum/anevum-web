/** Synthetic Chromium release gate: run the exact apex / bundle as served,
 * catch missing /assets routes, JavaScript failure, CSS failure and blank root.
 * This is not authenticated acceptance or physical Safari acceptance.
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const [chrome,origin,output]=process.argv.slice(2);
assert.ok(chrome&&origin==='http://127.0.0.1:4180'&&output,'Use local 4180 apex root fixture only');
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
async function until(fn,timeout=30000){
 const end=Date.now()+timeout,errors=[];
 while(Date.now()<end){
  try{const value=await fn();if(value)return value;}catch(e){errors.push(String(e));}
  await sleep(170);
 }
 throw Error('V100_APEX_ROOT_TIMEOUT: '+errors.slice(-2).join(' / '));
}
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'anevum-v100-apex-'));
const proc=spawn(chrome,[
 '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
 '--disable-background-networking','--remote-allow-origins=*','--no-first-run',
 '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'
],{stdio:'ignore'});
const errors=[],assets=[],reports=[];
let socket;
try{
 const port=await until(()=>{
  const file=join(profile,'DevToolsActivePort');
  return existsSync(file)?readFileSync(file,'utf8').split('\n')[0]:null;
 });
 const wsUrl=await until(async()=>{
  const r=await fetch('http://127.0.0.1:'+port+'/json/list');
  return r.ok?(await r.json()).find(x=>x.type==='page')?.webSocketDebuggerUrl:null;
 });
 socket=new WebSocket(wsUrl);
 await new Promise((done,fail)=>{
  socket.addEventListener('open',done,{once:true});socket.addEventListener('error',fail,{once:true});
 });
 let sequence=0;
 const pending=new Map();
 socket.addEventListener('message',event=>{
  const message=JSON.parse(String(event.data));
  if(message.method==='Runtime.exceptionThrown')
    errors.push(String(message.params?.exceptionDetails?.exception?.description||message.params?.exceptionDetails?.text||'unknown JS exception'));
  if(message.method==='Network.responseReceived'){
    const u=message.params?.response?.url||'';
    if(u.startsWith(origin+'/assets/')&&/\.(?:js|css)(?:[?#]|$)/.test(u))assets.push({
      url:new URL(u).pathname,status:message.params?.response?.status,
      mime:message.params?.response?.mimeType
    });
  }
  if(typeof message.id!=='number')return;
  const job=pending.get(message.id);
  if(!job)return;
  pending.delete(message.id);
  message.error?job.fail(Error(message.error.message)):job.done(message.result||{});
 });
 const send=(method,params={})=>new Promise((done,fail)=>{
  const id=++sequence;pending.set(id,{done,fail});
  socket.send(JSON.stringify({id,method,params}));
 });
 const evalJS=async expression=>{
  const x=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(x.exceptionDetails)throw Error(x.exceptionDetails.text||'JavaScript exception');
  return x.result?.value;
 };
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 const ready=await fetch(origin+'/__ready');
 assert.equal(ready.status,200,'Fixture not ready');
 assert.equal((await ready.json()).ready,true,'Root build missing');
 for(const width of [320,390,1440]){
  const height=width===1440?900:width===320?720:844;
  const offset=assets.length,errOffset=errors.length;
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
  await send('Page.navigate',{url:origin+'/'});
  await until(()=>evalJS('!!document.querySelector("#root .site-shell")&&!!document.querySelector(".site-header")'));
  const result=await evalJS(`(()=>{
   const root=document.getElementById('root');
   const js=document.querySelector('script[type="module"][src^="/assets/"]');
   const css=document.querySelector('link[rel="stylesheet"][href^="/assets/"]');
   const header=document.querySelector('.site-header');
   return {mounted:!!root?.children.length,hasHeader:!!header,hasBrand:header?.textContent?.includes('ANEVUM'),
    moduleSrc:js?.getAttribute('src')||null,cssHref:css?.getAttribute('href')||null,
    cssLoaded:!!css?.sheet,stylesheetCount:document.styleSheets.length,viewport:innerWidth,
    hasVisibleApp:(()=>{const r=header?.getBoundingClientRect();return !!r&&r.width>0&&r.height>0})()};
  })()`);
  assert.equal(result.mounted,true,'Blank React root at '+width);
  assert.equal(result.hasHeader,true,'Main UI did not mount at '+width);
  assert.equal(result.hasBrand,true,'ANEVUM header missing at '+width);
  assert.ok(result.hasVisibleApp,'ANEVUM header invisible at '+width);
  assert.ok(result.moduleSrc?.startsWith('/assets/'),'Missing root JavaScript path at '+width);
  assert.ok(result.cssHref?.startsWith('/assets/'),'Missing root CSS path at '+width);
  assert.ok(result.cssLoaded,'CSS failed to load at '+width);
  assert.ok(result.stylesheetCount>=2,'Only fixture stylesheet present at '+width);
  assert.ok(!errors.slice(errOffset).length,'Runtime JS exception at '+width+': '+errors.slice(errOffset).join(' / '));
  const requests=assets.slice(offset),main=requests.filter(x=>x.url===result.moduleSrc||x.url===result.cssHref);
  assert.equal(main.length,2,'Main script or style was not requested at '+width);
  for(const item of requests){
   assert.equal(item.status,200,'Asset HTTP failure '+item.url);
   assert.match(item.mime,/^(?:text\/javascript|application\/javascript|text\/css)$/,'Bad asset MIME '+item.url);
  }
  const snap=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
  assert.ok(snap.data?.length>5000,'Screenshot missing '+width);
  writeFileSync(join(output,'apex-root-'+width+'.png'),Buffer.from(snap.data,'base64'));
  reports.push({width,height,rootMounted:true,cssLoaded:true,cssJsHttp200:true,script:result.moduleSrc,
    style:result.cssHref,syntheticOnly:true,chromiumNotSafari:true});
 }
 const record={status:'PASS',source:'OFFLINE SYNTHETIC APEX ROOT',results:reports,assetRequests:assets.length,
  runtimeExceptions:0,authenticatedAcceptance:false,physicalSafariAcceptance:false,productionApproved:false};
 writeFileSync(join(output,'acceptance.json'),JSON.stringify(record,null,2)+'\n');
 console.log('V100_APEX_ROOT_MOBILE_AND_DESKTOP_RENDER_PASS');
}finally{
 try{socket?.close();}catch{}
 if(proc.exitCode===null){proc.kill('SIGTERM');await sleep(500);}
 rmSync(profile,{recursive:true,force:true});
}

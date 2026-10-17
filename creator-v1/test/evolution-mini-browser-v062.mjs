// V062 GPU preview gate. Serves only local, untrusted public artwork assets.
// No user account, production mutations, hosted login, or external scripts.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const out=path.resolve('qa-v062-native');
await fs.mkdir(out,{recursive:true});
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'anevum-native-chrome-'));
const dir=path.resolve('creator-v1/dist/native-qa');
const assets=path.resolve('creator-v1/web/public/evolution');
const html=String.raw`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#08101a;color:#ede0d8;font:14px system-ui}
h1{font:500 24px system-ui;margin:0 0 12px}.panel{padding:32px;position:absolute;left:5vw;top:6vh;width:90%;border:1px solid #5c455c;border-radius:18px;background:#181724}
.row{display:flex;align-items:center;gap:15px;margin:24px 0;min-height:95px}
.profile{width:70px;height:70px;border:1px solid #9e758080;border-radius:50%;background:radial-gradient(circle,#b86873,#252541);display:grid;place-items:center;font-size:12px}
.native{width:70px;height:70px;display:inline-grid;place-items:center;position:relative}
.native img{width:70px;height:70px;object-fit:contain;pointer-events:none}
.native[data-live="true"] img{visibility:hidden}
</style></head><body>
<div class="panel"><h1>CONTINUANCE INSTITUTE · NATIVE MINIATURE QA</h1>
 <div class="row"><div class="profile">MEMBER</div><span id="vacuum" class="native"><img alt="" src="/evolution/assets/level-02-compact-128.png"></span><span>VACUUM WHISPER / L02</span></div>
 <div class="row"><div class="profile">MEMBER</div><span id="anevum" class="native"><img alt="" src="/evolution/assets/level-30-compact-128.png"></span><span>ANEVUM / L30</span></div>
</div>
<script type="module">import {registerAnimatedSpecimen} from '/mini-engine.js';
registerAnimatedSpecimen(document.getElementById('vacuum'),2);
registerAnimatedSpecimen(document.getElementById('anevum'),30);</script></body></html>`;
const mime=(p)=>p.endsWith('.js')?'text/javascript; charset=utf-8':p.endsWith('.png')?'image/png':p.endsWith('.webp')?'image/webp':p.endsWith('.json')?'application/json':p.endsWith('.gz')?'application/gzip':'application/octet-stream';
const server=http.createServer(async(req,res)=>{
 let file;
 const url=new URL(req.url||'/', 'http://localhost');
 if(url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end(html);return;}
 if(url.pathname==='/mini-engine.js')file=path.join(dir,'evolution-mini-renderer.js');
 else if(url.pathname.startsWith('/evolution/')){
  const relative=url.pathname.slice('/evolution/'.length);
  const normalized=path.normalize(relative);
  if(normalized.startsWith('..')||path.isAbsolute(normalized)){res.writeHead(403);res.end();return;}
  file=path.join(assets,normalized);
 }else{res.writeHead(404);res.end();return;}
 try{const buf=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime(file),'Cache-Control':'no-store'});res.end(buf);}
 catch{res.writeHead(404);res.end();}
});
await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',err=>err?reject(err):resolve()));
const port=server.address().port;
const chrome=spawn(process.env.CHROME_PATH||'/usr/bin/google-chrome',[
 '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu-sandbox',
 '--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
 '--remote-debugging-port=9241','--user-data-dir='+profile,'about:blank'
],{stdio:'ignore'});
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let ws,seq=0;
const pending=new Map(),exceptions=[];
try{
 let endpoints=[];
 for(let n=0;n<120;n++){
  try{endpoints=await(await fetch('http://127.0.0.1:9241/json')).json();if(endpoints.some(x=>x.type==='page'))break;}catch{}
  await wait(200);
 }
 const page=endpoints.find(x=>x.type==='page');if(!page)throw Error('Browser unavailable');
 ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
 ws.addEventListener('message',event=>{
  const message=JSON.parse(event.data);
  if(message.id){const promise=pending.get(message.id);if(promise){pending.delete(message.id);message.error?promise.reject(Error(message.error.message)):promise.resolve(message.result);}}
  else if(message.method==='Runtime.exceptionThrown')exceptions.push(message.params?.exceptionDetails?.exception?.description||message.params?.exceptionDetails?.text);
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{
  const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
  return result.result.value;
 };
 const until=async(expression,max=22000)=>{
  for(let elapsed=0;elapsed<max;elapsed+=300){if(await evaluate(expression))return;await wait(300);}
  throw Error('Native GPU renderer never marked the specimen live: '+expression);
 };
 const snap=async name=>{const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const result=Buffer.from(image.data,'base64');await fs.writeFile(path.join(out,name),result);return result;};
 await send('Page.enable');await send('Runtime.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:950,height:650,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:'+port+'/'});
 await until("document.querySelector('#vacuum[data-live=\"true\"]')!==null && document.querySelector('#anevum[data-live=\"true\"]')!==null");
 await wait(600);
 const before=await snap('native-frame-1.png');
 await wait(1150);
 const after=await snap('native-frame-2.png');
 const live=await evaluate("(()=>{const canvas=document.querySelector('canvas.av62-native-stage');const gl=canvas?.getContext('webgl');return {canvasCount:document.querySelectorAll('canvas').length,alive:!!canvas&&!canvas.hidden,gl:!!gl,canvasWidth:canvas?.width,canvasHeight:canvas?.height,level02:document.getElementById('vacuum')?.dataset.live,level30:document.getElementById('anevum')?.dataset.live,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth}})()");
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await wait(550);
 const pausedBefore=await snap('native-reduced-1.png');
 await wait(850);
 const pausedAfter=await snap('native-reduced-2.png');
 const moved=!before.equals(after),stopped=pausedBefore.equals(pausedAfter);
 const pass=live.canvasCount===1&&live.alive&&live.gl&&live.level02==='true'&&live.level30==='true'&&moved&&stopped&&live.scrollWidth<=live.viewport&&!exceptions.length;
 const evidence={pass,live,moved,stopped,exceptions,frameBytes:[before.length,after.length],reducedBytes:[pausedBefore.length,pausedAfter.length]};
 await fs.writeFile(path.join(out,'observations.json'),JSON.stringify(evidence,null,2));
 console.log(JSON.stringify(evidence));
 if(!pass)process.exitCode=1;
}finally{
 try{ws?.close();}catch{}
 chrome.kill('SIGTERM');
 await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),wait(1800)]).catch(()=>{});
 await fs.rm(profile,{recursive:true,force:true,maxRetries:8,retryDelay:200}).catch(()=>{});
 server.close();
}
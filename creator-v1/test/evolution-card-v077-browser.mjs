/**
 * V077 isolated headless SVG visual acceptance.
 * Screenshots contain ONLY Level 4 (already earned/opted in by the owner).
 * Other 29 icons are checked for decode in memory and never written to disk.
 * No production calls, secrets, sign-in, WebGL changes or XP writes.
 */
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {renderEvolutionCardArt} from '../canonical-auth/evolution-card-art.mjs';
const [chrome,output]=process.argv.slice(2);
if(!chrome||!output)throw Error('CHROME_AND_OUTPUT_REQUIRED');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(fn,limit=26000){
 const end=Date.now()+limit;let last='';
 while(Date.now()<end){
  try{const value=await fn();if(value)return value}catch(error){last=String(error)}
  await delay(150);
 }
 throw Error('V077_CHROME_TIMEOUT '+last.slice(0,120));
}
const profile=mkdtempSync(join(tmpdir(),'anevum-v077-chrome-'));
const child=spawn(chrome,[
 '--headless=new','--no-sandbox','--disable-dev-shm-usage',
 '--disable-background-networking','--no-first-run',
 '--remote-debugging-port=0','--remote-allow-origins=*',
 '--user-data-dir='+profile,'about:blank'
],{stdio:'ignore'});
let socket=null;
let server=null;
mkdirSync(output,{recursive:true});
const outcomes=[];
try{
 const port=await wait(()=>{
  const file=join(profile,'DevToolsActivePort');
  if(!existsSync(file))return null;
  return readFileSync(file,'utf8').split('\n')[0];
 },18000);
 const tab=await wait(async()=>{
  const r=await fetch('http://127.0.0.1:'+port+'/json/list');
  if(!r.ok)return null;
  return (await r.json()).find(x=>x.type==='page')?.webSocketDebuggerUrl;
 });
 socket=new WebSocket(tab);
 await new Promise((resolve,reject)=>{
  socket.addEventListener('open',resolve,{once:true});
  socket.addEventListener('error',reject,{once:true});
 });
 let nextId=0;const calls=new Map();
 socket.addEventListener('message',({data})=>{
  const m=JSON.parse(String(data)),q=calls.get(m.id);
  if(!q)return;calls.delete(m.id);
  m.error?q.reject(Error(m.error.message)):q.resolve(m.result||{});
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++nextId;calls.set(id,{resolve,reject});
  socket.send(JSON.stringify({id,method,params}));
 });
 const evaluate=async expression=>{
  const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
  return r.result?.value;
 };
 await send('Page.enable');await send('Runtime.enable');
 const sizes=[30,38,44,60,128];
 const svg=renderEvolutionCardArt(4);
 // Test same-origin media and strict response CSP, as in production.
 // No unlocked/restricted artwork or live account state is fetched.
 let html='';
 const requests=[];
 const cardPath='/api/v1/members/example/rewards/levels/4/card';
 server=createServer((req,res)=>{
  requests.push(req.url);
  if(req.url==='/preview'){
   res.writeHead(200,{'content-type':'text/html; charset=utf-8'});
   res.end(html);return;
  }
  if(req.url===cardPath){
   res.writeHead(200,{
    'content-type':'image/svg+xml; charset=utf-8',
    'cache-control':'private, no-store',
    'x-content-type-options':'nosniff',
    'content-security-policy':"default-src 'none'; script-src 'none'; object-src 'none'; base-uri 'none'"
   });
   res.end(svg);return;
  }
  res.writeHead(404,{'cache-control':'no-store'});res.end('Not found');
 });
 await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',error=>error?reject(error):resolve()));
 const origin='http://127.0.0.1:'+server.address().port;
 const uri=origin+cardPath;
 html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>V077 Level 4 visual gate</title><style>
 *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#0b1323;color:#e8e5df;font:14px/1.5 system-ui,sans-serif}
 body{padding:clamp(12px,4vw,44px)}h1{margin:0;font-size:24px;letter-spacing:.06em}p{color:#a8b8cb}
 main{display:flex;gap:28px;align-items:center;flex-wrap:wrap;margin-top:36px}
 article{padding:15px 12px;min-width:135px;border:1px solid #34445d;border-radius:14px;text-align:center;background:#131d32}
 article img{display:block;margin:18px auto;width:var(--size);height:var(--size);image-rendering:auto}
 label{font:700 11px ui-monospace,monospace;color:#c4d4e7}
 .card{margin-top:35px;display:flex;align-items:center;gap:11px;width:min(100%,375px);padding:14px;border:1px solid #3c506e;border-radius:16px;background:#1b2942}
 .portrait{display:grid;place-items:center;flex:none;width:44px;height:44px;background:#384d65;border-radius:13px;color:#ffffff}
 .plate{width:44px;height:44px;flex:none}.member{min-width:0}.member strong{font-size:15px}.member small{display:block;color:#bccce2}
 </style></head><body><h1>ANEVUM / SYMMETRY FIELD</h1><p>Earned level 04. Fixed frontal 2D card artwork, no 3D runtime.</p><main>
 ${sizes.map(size=>`<article><label>${size} PIXELS</label><img width="${size}" height="${size}" style="--size:${size}px" src="${uri}" alt="Symmetry Field, level 4"></article>`).join('')}
 </main><div class="card"><span class="portrait" aria-hidden="true">A</span><img class="plate" src="${uri}" alt="Earned Evolution Level 4"><span class="member"><strong>Sample creator</strong><small>@sample &middot; Level 04</small></span></div>
 </body></html>`;
 for(const [width,height,label] of [[1280,800,'desktop'],[390,844,'mobile']]){
  await send('Emulation.setDeviceMetricsOverride',{
   width,height,deviceScaleFactor:1,mobile:width<700
  });
  const dest=origin+'/preview';
  const page=await send('Page.navigate',{url:dest});
  if(page.errorText)throw Error('V077_BROWSER_NAVIGATION '+page.errorText);
  const state=await wait(async()=>{
   const r=await evaluate(`(()=>{const all=[...document.querySelectorAll('img')];return all.every(x=>x.complete&&x.naturalWidth===256)?{
     srcCount:all.length,altCount:all.filter(x=>x.alt.includes('Level 4')||x.alt.includes('level 4')).length,
     renderedSizes:all.slice(0,5).map(x=>Math.round(x.getBoundingClientRect().width)),
     mobileOverflow:document.documentElement.scrollWidth>innerWidth+2,
     broken:all.filter(x=>!x.naturalWidth).length
    }:null})()`);
   return r;
  });
  if(!requests.includes(cardPath)||state.broken||state.mobileOverflow||state.srcCount!==6||
    JSON.stringify(state.renderedSizes)!==JSON.stringify(sizes)){
   throw Error('V077_VISUAL_LAYOUT_'+label+' '+JSON.stringify(state));
  }
  const capture=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
  const bytes=Buffer.from(capture.data||'','base64');
  if(bytes.length<2500)throw Error('V077_EMPTY_FRAME_'+label);
  writeFileSync(join(output,'v077-level4-player-card-'+label+'.png'),bytes);
  outcomes.push({viewport:label,width,images:state.srcCount,sizes:state.renderedSizes,bytes:bytes.length});
 }
 writeFileSync(join(output,'result.json'),JSON.stringify({pass:true,headlessChrome:true,outcomes},null,2));
 console.log('ANEVUM_V077_LEVEL4_DESKTOP_MOBILE_OPTICAL_VISUAL=PASS '+JSON.stringify(outcomes));
}finally{
 try{socket?.close()}catch{}
 server?.close();
 child.kill('SIGTERM');
 try{rmSync(profile,{recursive:true,force:true,maxRetries:18,retryDelay:125})}catch(e){
  if(!['ENOTEMPTY','EBUSY'].includes(e?.code))throw e;
 }
}

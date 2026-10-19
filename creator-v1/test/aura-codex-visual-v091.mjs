/**
 * Aura Codex visual QA on the actual production-built V091 React bundle.
 * Synthetic localhost/static responses; no real member data or account writes.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,statSync,rmSync} from 'node:fs';
import {resolve,join,sep,extname} from 'node:path';
import {tmpdir} from 'node:os';

const [chrome,output]=process.argv.slice(2);
if(!chrome||!output)throw Error('Usage: node aura-codex-visual-v091.mjs CHROME_PATH OUT_DIR');
const staticRoot=resolve(new URL('../dist/web/',import.meta.url).pathname);
const index=join(staticRoot,'index.html');
if(!existsSync(index))throw Error('Build the V091 React web bundle before browser QA');
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
 '.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml',
 '.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp',
 '.json':'application/json; charset=utf-8','.woff2':'font/woff2'};
const hits=[];
const server=createServer((request,response)=>{
 const pathname=new URL(request.url||'/','http://localhost').pathname;
 hits.push(pathname);
 if(pathname.startsWith('/api/')){
  response.writeHead(404,{'content-type':'application/json; charset=utf-8'});
  response.end('{"error":"Synthetic fixture: no production member data"}');return;
 }
 const candidate=resolve(staticRoot,'.'+(pathname==='/'?'/index.html':pathname));
 if((candidate===staticRoot||candidate.startsWith(staticRoot+sep))&&
    existsSync(candidate)&&statSync(candidate).isFile()){
  response.writeHead(200,{'content-type':MIME[extname(candidate)]||'application/octet-stream'});
  response.end(readFileSync(candidate));return;
 }
 response.writeHead(200,{'content-type':'text/html; charset=utf-8'});
 response.end(readFileSync(index));
});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,timeout=40000){
 const end=Date.now()+timeout;let err='';
 while(Date.now()<end){
  try{const data=await fn();if(data)return data;}catch(error){err=String(error);}
  await delay(160);
 }
 throw Error('AURA_CODEX_BROWSER_TIMEOUT '+err.slice(0,180));
}
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'anevum-aura-v091-'));
let child,socket;
try{
 await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',e=>e?reject(e):resolve()));
 const origin='http://127.0.0.1:'+server.address().port;
 child=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--disable-background-networking','--no-first-run','--remote-allow-origins=*',
  '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
 const port=await until(()=>{
  const p=join(profile,'DevToolsActivePort');
  if(!existsSync(p))return null;
  const val=readFileSync(p,'utf8').split('\n')[0];return /^\d+$/.test(val)?val:null;
 },20000);
 const ws=await until(async()=>{
  const response=await fetch('http://127.0.0.1:'+port+'/json/list');
  return response.ok?(await response.json()).find(x=>x.type==='page')?.webSocketDebuggerUrl:null;
 });
 socket=new WebSocket(ws);await new Promise((resolve,reject)=>{
  socket.addEventListener('open',resolve,{once:true});
  socket.addEventListener('error',reject,{once:true});
 });
 const calls=new Map();let id=0;
 socket.addEventListener('message',({data})=>{
  const packet=JSON.parse(String(data));if(!packet.id)return;
  const job=calls.get(packet.id);if(!job)return;
  calls.delete(packet.id);packet.error?job.reject(Error(packet.error.message)):job.resolve(packet.result||{});
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const next=++id;calls.set(next,{resolve,reject});
  socket.send(JSON.stringify({id:next,method,params}));
 });
 const evaluate=async expression=>{
  const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
  return result.result?.value;
 };
 const probe=()=>{
  const cards=[...document.querySelectorAll('.av91-codex-entry')];
  if(cards.length!==6)return null;
  const coords=cards.map(card=>{
   const cardBox=card.getBoundingClientRect();
   const name=card.querySelector('h2')?.textContent;
   const body=card.querySelector('.av91-codex-entry-copy')?.getBoundingClientRect();
   return {name,left:cardBox.left,right:cardBox.right,width:cardBox.width,copyWidth:body?.width||0};
  });
  const title=document.querySelector('#av91-codex-title')?.textContent||'';
  const orbit=document.querySelector('.av91-codex-orbit');
  const helper=document.querySelector('.ir88-companion .ir87-scout')?.getBoundingClientRect();
  const helperCollision=Boolean(helper&&cards.some(card=>{
   const copy=card.querySelector('.av91-codex-entry-copy')?.getBoundingClientRect();
   return copy&&helper.left<copy.right&&helper.right>copy.left&&
    helper.top<copy.bottom&&helper.bottom>copy.top;
  }));
  return {title,pathname:location.pathname,innerWidth,
   overflow:document.documentElement.scrollWidth>innerWidth+2,
   cards:coords,animations:getComputedStyle(orbit).animationName,
   helperCollision,helperLeft:helper?.left??null,
   links:[...document.querySelectorAll('.av91-codex-actions a')].map(a=>a.getAttribute('href'))};
 };
 await send('Page.enable');await send('Runtime.enable');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 const viewports=[];
 for(const [width,height,label] of [[320,740,'small-phone'],[390,844,'phone'],[1440,900,'desktop']]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
  const navigation=await send('Page.navigate',{url:origin+'/auras'});
  if(navigation.errorText)throw Error('Aura Codex navigation: '+navigation.errorText);
  const data=await until(()=>evaluate('('+probe.toString()+')()'),35000);
  assert.match(data.title,/The Aura Codex/);
  assert.equal(data.pathname,'/auras');
  assert.equal(data.innerWidth,width,'CDP emulation should use requested width');
  assert.equal(data.overflow,false,'no full-page horizontal overflow at '+width);
  assert.equal(data.helperCollision,false,'IREN obscures aura meaning text at '+width);
  assert.ok(data.helperLeft!==null&&data.helperLeft>=8&&data.helperLeft<=25,
   'IREN should start in left reading gutter without overriding draggable preferences at '+width);
  assert.deepEqual(data.cards.map(x=>x.name),
   ['Unadorned','Aurora','Eclipse','Ember','Nebula','Transcosmic']);
  assert.ok(data.links.includes('/recognition')&&data.links.includes('/member?tab=awards'));
  assert.equal(data.animations,'none','reduced-motion preference must disable orbit spin');
  for(const card of data.cards){
   assert.ok(card.left>=-2&&card.right<=width+2,'Card bounds at '+width+': '+card.name);
   assert.ok(card.copyWidth>=140,'Aura text compressed at '+width+': '+card.name+' '+card.copyWidth);
  }
  const shot=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
  const bytes=Buffer.from(shot.data||'','base64');
  assert.ok(bytes.length>8000,'empty screenshot at '+width);
  const path=join(output,'aura-codex-'+label+'.png');writeFileSync(path,bytes);
  viewports.push({width,height,label,source:'production-built React on synthetic loopback',textMin:Math.min(...data.cards.map(x=>x.copyWidth))});
  console.log('AURA_CODEX_VISUAL_'+width+'=PASS '+JSON.stringify({minCopyWidth:viewports.at(-1).textMin,overflow:false}));
 }
 assert.ok(hits.includes('/auras'),'actual Aura Codex route must load');
 assert.equal(hits.some(p=>/\/api\/v1\/member\/staff-ops|\/api\/v1\/member\/xp-test/.test(p)),false,
  'public guide must not issue staff or XP requests');
 writeFileSync(join(output,'acceptance.json'),JSON.stringify({pass:true,viewports,productionWrites:0},null,2));
}finally{
 try{socket?.close();}catch{}
 child?.kill('SIGTERM');
 server.close();
 try{rmSync(profile,{recursive:true,force:true,maxRetries:8,retryDelay:180});}catch{}
}

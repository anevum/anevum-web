// Source-pinned, synthetic loopback screenshot verification for the static
// ANEVUM Updates Hub. No public-site mutations, account access or external JS.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,existsSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import hub from '../public-updates/worker.mjs';

const output=process.argv[2]||'evidence/public-updates-20261025';
mkdirSync(output,{recursive:true});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,label,timeout=18000){
 const deadline=Date.now()+timeout;let last;
 while(Date.now()<deadline){
  try {const result=await fn();if(result)return result;}catch(error){last=String(error);}
  await sleep(100);
 }
 throw Error('UPDATES_QA_TIMEOUT '+label+(last?' '+last:''));
}
const server=createServer(async(request,response)=>{
 try{
  const url=new URL(request.url||'/','https://anevum.com');
  const received=await hub.fetch(new Request(url,{method:request.method}));
  response.writeHead(received.status,Object.fromEntries(received.headers.entries()));
  response.end(Buffer.from(await received.arrayBuffer()));
 }catch(error){response.writeHead(500);response.end('Offline fixture error');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const profile=mkdtempSync(join(tmpdir(),'anevum-updates-qa-'));
const chrome=process.env.CHROME_BIN||'google-chrome';
const child=spawn(chrome,[
 '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
 '--disable-background-networking','--remote-allow-origins=*','--remote-debugging-port=0',
 '--no-first-run','--user-data-dir='+profile,'about:blank'
],{stdio:'ignore'});
let socket=null;
const unexpectedRequests=[];
const results=[];
try{
 const debugPort=await until(()=>{
  const active=join(profile,'DevToolsActivePort');
  if(!existsSync(active))return null;
  const port=readFileSync(active,'utf8').split('\n')[0];
  return /^\d+$/.test(port)?port:null;
 },'chrome-port');
 const ws=await until(async()=>{
  const res=await fetch('http://127.0.0.1:'+debugPort+'/json/list');
  if(!res.ok)return null;
  return (await res.json()).find(p=>p.type==='page'&&p.webSocketDebuggerUrl)?.webSocketDebuggerUrl;
 },'chrome-cdp');
 socket=new WebSocket(ws);
 await new Promise((resolve,reject)=>{
  socket.addEventListener('open',resolve,{once:true});
  socket.addEventListener('error',reject,{once:true});
 });
 let seq=0;
 const pending=new Map();
 socket.addEventListener('message',({data})=>{
  const msg=JSON.parse(String(data));
  if(msg.method==='Network.requestWillBeSent'){
   const url=msg.params?.request?.url||'';
   if(/^https?:\/\//.test(url)&&!url.startsWith(base+'/'))
    unexpectedRequests.push(url);
  }
  if(typeof msg.id==='number'){
   const task=pending.get(msg.id);if(!task)return;
   pending.delete(msg.id);msg.error?task.reject(Error(msg.error.message)):task.resolve(msg.result||{});
  }
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++seq;pending.set(id,{resolve,reject});
  socket.send(JSON.stringify({id,method,params}));
 });
 const evalJs=async expression=>{
  const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
  return result.result?.value;
 };
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=390});
  await send('Page.navigate',{url:base+'/updates'});
  await until(()=>evalJs("document.readyState==='complete'&&location.pathname==='/updates'&&!!document.getElementById('progress-title')"),'layout-'+width);
  const state=await evalJs("(()=>{const h=document.querySelector('h1');const tiles=[...document.querySelectorAll('.tiles a.tile')];const boxes=tiles.map(a=>{const r=a.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height};});const head=document.querySelector('.top').getBoundingClientRect();const style=getComputedStyle(document.querySelector('.ring.a'));return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:h?.textContent?.trim()||'',tiles:tiles.length,details:document.querySelectorAll('details.progress-item').length,links:tiles.map(a=>a.getAttribute('href')),boxes,header:{left:head.left,right:head.right},motion:style.animationName,bodyBg:getComputedStyle(document.body).backgroundColor};})()");
  assert.equal(state.width,width);
  assert.ok(state.h1.includes('A world of things'),state.h1);
  assert.equal(state.tiles,4);
  assert.equal(state.details,4);
  assert.deepEqual(state.links,['/discover','/creators','/community','/studio']);
  assert.ok(state.scrollWidth<=width+1,'Viewport overflow '+width+': '+state.scrollWidth);
  assert.ok(state.boxes.every(r=>r.left>=-1&&r.right<=width+1&&r.width>=250),'Card clipped '+width+': '+JSON.stringify(state.boxes));
  assert.equal(state.motion,'none','Reduced-motion setting must stop orbital animation');
  await evalJs("document.querySelectorAll('details.progress-item')[0].open=true");
  assert.equal(await evalJs("document.querySelectorAll('details.progress-item')[0].open"),true);
  const image=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
  assert.ok(image.data?.length>5000,'No meaningful screenshot '+width);
  writeFileSync(join(output,'updates-'+width+'.png'),Buffer.from(image.data,'base64'));
  results.push({width,passed:true,tiles:state.tiles,progressPanels:state.details,overflow:false,motion:state.motion});
  console.log('PUBLIC_UPDATES_COMPILED_BROWSER_'+width+'=PASS');
 }
 assert.deepEqual(unexpectedRequests,[],'Page requested unapproved network endpoints');
 writeFileSync(join(output,'acceptance.json'),JSON.stringify({
  source:'static-first-party-v1',syntheticLoopback:true,externalRequests:unexpectedRequests,
  appRoutesUntouched:true,physicalPhoneTested:false,checks:results
 },null,2));
}finally{
 try{socket?.close();}catch{}
 child.kill('SIGTERM');
 await new Promise(resolve=>server.close(resolve));
 try{rmSync(profile,{recursive:true,force:true});}catch{}
}

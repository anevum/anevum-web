/**
 * All households below are SYNTHETIC browser fixtures. No public service traffic.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdtempSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

const args=process.argv;
const output=args.includes('--output')?args[args.indexOf('--output')+1]:'evidence/porchlight-v001';
const chrome=args.includes('--chrome')?args[args.indexOf('--chrome')+1]:(process.env.CHROME||'google-chrome');
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'porchlight-offline-'));
const now=Math.floor(Date.now()/1000);
const hosts=[
 {id:'00000000-0000-4000-8000-000000000001',name:'SYNTHETIC Lantern Porch',location:'Approved synthetic point',visibility:'exact',lat:28.24001,lng:-81.28999,options:['candy','non_food']},
 {id:'00000000-0000-4000-8000-000000000002',name:'SYNTHETIC Area Host',location:'Synthetic neighborhood',visibility:'area',lat:null,lng:null,options:['decorations']}
];
const event={slug:'synthetic-pilot',title:'SYNTHETIC Halloween Fixture',neighborhood:'Synthetic neighborhood',
 startsAt:now+60,endsAt:now+86400,center:{lat:28.24,lng:-81.29},
 note:'Local browser fixture only'};
const assets={'/':'index.html','/index.html':'index.html','/app.css':'app.css','/app.js':'app.js',
 '/organizer.html':'organizer.html','/organizer.css':'organizer.css','/organizer.js':'organizer.js'};
function json(res,status,obj){
 res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(obj));
}
const server=createServer((req,res)=>{
 const pathname=new URL(req.url||'/', 'http://127.0.0.1').pathname;
 if(req.method==='GET'&&pathname==='/api/v1/porchlight/events')
  return json(res,200,{ok:true,events:[event],mapStyleUrl:null});
 if(req.method==='GET'&&pathname==='/api/v1/porchlight/events/synthetic-pilot/hosts')
  return json(res,200,{ok:true,hosts});
 if(req.method==='GET'&&pathname==='/_private/porchlight/events/invalid-probe/queue')
  return json(res,req.headers.authorization?404:401,req.headers.authorization?{ok:false,code:'EVENT_NOT_FOUND'}:{ok:false,code:'ORGANIZER_AUTH_REQUIRED'});
 const filename=assets[pathname];
 if(req.method!=='GET'||!filename)return json(res,404,{ok:false,code:'NOT_FOUND'});
 const body=readFileSync(new URL('../public/'+filename,import.meta.url));
 const extension=filename.split('.').pop();
 const type=extension==='html'?'text/html':extension==='css'?'text/css':'text/javascript';
 res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store',
 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'",
 'Permissions-Policy':'geolocation=(),camera=(),microphone=()'});
 res.end(body);
});
async function until(callback,ms=20000){
 const deadline=Date.now()+ms;let lastError;
 while(Date.now()<deadline){
  try{const value=await callback();if(value)return value}catch(e){lastError=e}
  await delay(70);
 }
 throw lastError||Error('Browser readiness timed out');
}
async function connect(socket){
 const ws=new WebSocket(socket);let serial=0;const pending=new Map();
 await new Promise((resolve,reject)=>{
  ws.addEventListener('open',resolve,{once:true});
  ws.addEventListener('error',reject,{once:true});
 });
 ws.addEventListener('message',event=>{
  const data=JSON.parse(String(event.data));
  const pendingCall=pending.get(data.id);if(!pendingCall)return;
  pending.delete(data.id);
  data.error?pendingCall.reject(Error(data.error.message)):pendingCall.resolve(data.result||{});
 });
 return {
  send(method,params={}){
   const id=++serial;
   return new Promise((resolve,reject)=>{
    pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));
   });
  },
  close(){ws.close()}
 };
}
let child=null,client=null;
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 child=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
 const port=await until(()=>{
  const file=join(profile,'DevToolsActivePort');
  return existsSync(file)?readFileSync(file,'utf8').split('\n')[0]:null;
 });
 const socket=await until(async()=>{
  const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
  return tabs.find(tab=>tab.type==='page')?.webSocketDebuggerUrl;
 });
 client=await connect(socket);
 await client.send('Page.enable');
 await client.send('Runtime.enable');
 async function evalJS(expression){
  const r=await client.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.text||'Browser runtime exception');
  return r.result?.value;
 }
 async function goto(page){
  await client.send('Page.navigate',{url:base+page});
  await until(()=>evalJS("document.readyState==='complete'"));
 }
 const widths=[];
 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await client.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=390});
  await goto('/');
  await until(()=>evalJS("document.querySelector('#host-count')?.textContent==='2'"));
  const info=await evalJS("({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,cards:document.querySelectorAll('.host-item').length,pins:document.querySelectorAll('.map-pin').length,area:document.body.innerText.includes('Synthetic neighborhood'),consent:!!document.querySelector('#host-exact'),mapLabel:document.querySelector('#schematic-map')?.getAttribute('aria-label')})");
  assert.equal(info.cards,2,JSON.stringify(info));
  assert.equal(info.pins,1,JSON.stringify(info));
  assert.equal(info.area,true);
  assert.equal(info.consent,true);
  assert.ok(info.mapLabel.includes('not a street map')||info.mapLabel.includes('No street basemap'));
  assert.ok(info.scrollWidth<=info.viewport+2,JSON.stringify(info));
  const screenshot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  writeFileSync(join(output,'public-'+width+'.png'),Buffer.from(screenshot.data,'base64'));
  widths.push({width,...info});
 }
 await client.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await goto('/organizer.html');
 await until(()=>evalJS("!!document.querySelector('#auth-form')"));
 assert.equal(await evalJS("document.querySelector('#admin-shell').hidden"),true);
 await evalJS("(()=>{document.querySelector('#token').value='a'.repeat(48);document.querySelector('#auth-form button').click();})()");
 await until(()=>evalJS("document.querySelector('#admin-shell').hidden===false"));
 const staffShot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 writeFileSync(join(output,'organizer-390.png'),Buffer.from(staffShot.data,'base64'));
 writeFileSync(join(output,'acceptance.json'),JSON.stringify({ok:true,fixture:'OFFLINE_SYNTHETIC_ONLY',widths,privateConsoleShownAfterAuth:true},null,2));
 console.log('PORCHLIGHT_V001_CHROMIUM=PASS widths='+widths.map(v=>v.width).join(','));
} finally {
 try{client?.close()}catch{}
 if(child){child.kill();await delay(150)}
 await new Promise(resolve=>server.close(()=>resolve()));
 try{rmSync(profile,{recursive:true,force:true,maxRetries:3})}catch{}
}

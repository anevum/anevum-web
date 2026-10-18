/**
 * Exact-source review of fictional Porchlight V002.
 * Local Chromium and the Node 22 runtime; no external network or dependencies.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdtempSync,existsSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';

const html=readFileSync(new URL('../porchlight-event-desk-preview.html',import.meta.url),'utf8');
const chrome=process.env.CHROME||'google-chrome';
const out=resolve(process.env.PORCHLIGHT_V002_EVIDENCE||'evidence/porchlight-v002');
mkdirSync(out,{recursive:true});
for(const text of ['FICTIONAL NEIGHBORHOOD','Fictional Sector','SIMULATED ORGANIZER MODE','NO LIVE DATA','AREA ONLY'])
 assert.ok(html.includes(text),'Missing fictional/consent disclosure: '+text);
assert.match(html,/connect-src 'none'/);
assert.doesNotMatch(html,/<script\s+[^>]*src=|<link\s+[^>]*stylesheet/i);
assert.doesNotMatch(html,/navigator\.geolocation|localStorage\.|sessionStorage\.|fetch\(|XMLHttpRequest|WebSocket\(/);
const profile=mkdtempSync(join(tmpdir(),'porchlight-v002-review-'));
const server=createServer((request,response)=>{
 if(request.method!=='GET'||request.url!=='/'){
  response.writeHead(404,{'Cache-Control':'no-store'});return response.end('Not found');
 }
 response.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store',
 'Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; object-src 'none'; frame-ancestors 'none'",
 'Permissions-Policy':'geolocation=(),camera=(),microphone=()'});
 response.end(html);
});
async function until(fn,timeout=18000){
 const limit=Date.now()+timeout;let last;
 while(Date.now()<limit){try{const v=await fn();if(v)return v}catch(e){last=e}await sleep(75)}
 throw last||Error('Browser assertion timed out');
}
async function cdp(url){
 const socket=new WebSocket(url);let id=0;const pending=new Map();const requests=[],errors=[];
 await new Promise((ok,fail)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',fail,{once:true})});
 socket.addEventListener('message',event=>{
  const data=JSON.parse(String(event.data));
  if(data.method==='Network.requestWillBeSent')requests.push(data.params?.request?.url||'');
  if(data.method==='Runtime.exceptionThrown')errors.push(data.params?.exceptionDetails?.text||'Runtime exception');
  if(!data.id)return;
  const p=pending.get(data.id);if(!p)return;pending.delete(data.id);
  data.error?p.fail(Error(data.error.message)):p.ok(data.result||{});
 });
 return {requests,errors,send(method,params={}){
  const current=++id;
  return new Promise((ok,fail)=>{pending.set(current,{ok,fail});socket.send(JSON.stringify({id:current,method,params}))});
 },close(){socket.close()}};
}
let processChrome,connection;
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 processChrome=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu',
 '--disable-dev-shm-usage','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
 const port=await until(()=>{const file=join(profile,'DevToolsActivePort');return existsSync(file)?readFileSync(file,'utf8').split('\n')[0]:null});
 const ws=await until(async()=>{
  const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
  return tabs.find(x=>x.type==='page')?.webSocketDebuggerUrl;
 });
 connection=await cdp(ws);
 for(const name of ['Page.enable','Runtime.enable','Network.enable'])await connection.send(name);
 async function run(expression){
  const r=await connection.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.text);
  return r.result?.value;
 }
 const widths=[];
 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await connection.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
  await connection.send('Page.navigate',{url:base+'/'});
  await until(()=>run("document.readyState==='complete'&&document.querySelectorAll('.stop-card').length===4"));
  const actual=await run("({w:innerWidth,scroll:document.documentElement.scrollWidth,cards:document.querySelectorAll('.stop-card').length,pins:document.querySelectorAll('.map-pin').length,queue:document.querySelectorAll('.review-item').length})");
  assert.equal(actual.cards,4);assert.equal(actual.pins,2);assert.equal(actual.queue,2);
  assert.ok(actual.scroll<=actual.w+2,JSON.stringify(actual));
  const shot=await connection.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  writeFileSync(join(out,'first-view-'+width+'.png'),Buffer.from(shot.data,'base64'));
  widths.push(actual);
 }
 await connection.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await connection.send('Page.navigate',{url:base+'/'});
 await until(()=>run("document.querySelectorAll('.stop-card').length===4"));
 await run("document.querySelector('[data-filter=nonfood]').click()");
 assert.equal(await run("document.querySelectorAll('.stop-card').length"),2);
 await run("document.querySelector('[data-filter=all]').click()");
 await run("document.querySelector('#stopSearch').value='Lantern';document.querySelector('#stopSearch').dispatchEvent(new Event('input',{bubbles:true}))");
 assert.equal(await run("document.querySelectorAll('.stop-card').length"),1);
 await run("document.querySelector('#stopSearch').value='';document.querySelector('#stopSearch').dispatchEvent(new Event('input',{bubbles:true}))");
 await run("document.querySelector('.stop-add').click()");
 assert.equal(await run("document.querySelector('#planCount').textContent"),'1 saved');
 await run("document.querySelector('.review-item button.approve').click()");
 assert.equal(await run("document.querySelectorAll('.stop-card').length"),5);
 assert.equal(await run("document.querySelectorAll('.map-pin').length"),2);
 await run("document.querySelector('.review-item .review-actions button:last-child').click()");
 assert.equal(await run("document.querySelectorAll('.review-item').length"),0);
 await run("document.querySelector('#updateMessage').value='Synthetic update for Garden Row';document.querySelector('#publishUpdate').click()");
 assert.equal(await run("document.querySelectorAll('.bulletin-item').length"),2);
 await run("document.querySelector('#shiftDemo').click()");
 assert.equal(await run("document.querySelectorAll('.shift strong')[2].textContent"),'2 / 2');
 await run("window.confirm=()=>true;document.querySelector('#closeEvent').click()");
 assert.equal(await run("document.querySelectorAll('.stop-card').length"),0);
 assert.equal(await run("document.querySelectorAll('.map-pin').length"),0);
 assert.equal(await run("document.querySelector('#eventStateText').textContent"),'EVENT CLOSED');
 assert.deepEqual(connection.errors,[],'No JavaScript runtime errors');
 assert.deepEqual(connection.requests.filter(url=>/^https?:/.test(url)&&!url.startsWith(base)),[],'No third-party network requests');
 writeFileSync(join(out,'acceptance.json'),JSON.stringify({status:'PASS',fictional:true,publicProduction:false,viewports:widths,flows:['filter','search','bookmark','approval','rejection','bulletin','volunteers','event-closure']},null,2));
 console.log('PORCHLIGHT_V002_FICTIONAL_VISUAL_REVIEW=PASS');
}finally{
 try{connection?.close()}catch{}
 if(processChrome){processChrome.kill();await sleep(100)}
 await new Promise(resolve=>server.close(resolve));
 try{rmSync(profile,{recursive:true,force:true,maxRetries:3})}catch{}
}

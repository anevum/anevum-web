// Synthetic, local-only browser acceptance for the private Lab moderator workstation.
// No Cloudflare Access token, real member session, live moderation or community data.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {MODERATOR_LAB_CSS,MODERATOR_LAB_JS,renderLabModeratorConsole} from '../moderator-ops-v042.mjs';

const arg=process.argv.slice(2),getArg=key=>{const i=arg.indexOf(key);return i<0?null:arg[i+1]};
const chrome=getArg('--chrome'),out=getArg('--output');
if(!chrome||!out)throw Error('Usage: --chrome <binary> --output <directory>');
mkdirSync(out,{recursive:true});
const prefix='/projects/backstage/moderation/';
const server=createServer((req,res)=>{
 const p=new URL(req.url,'http://127.0.0.1').pathname;
 let body,status=200,type='text/html; charset=utf-8';
 if(p===prefix||p===prefix+'index.html')body=renderLabModeratorConsole();
 else if(p===prefix+'console.css'){body=MODERATOR_LAB_CSS;type='text/css; charset=utf-8'}
 else if(p===prefix+'console.js'){body=MODERATOR_LAB_JS;type='text/javascript; charset=utf-8'}
 else {body='Not found';type='text/plain';status=404}
 res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store',
  'Content-Security-Policy':"default-src 'none'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'none'; frame-ancestors 'none'; form-action 'self'",
  'X-Content-Type-Options':'nosniff'});
 res.end(req.method==='HEAD'?'':body);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const temp=mkdtempSync(join(tmpdir(),'anevum-v042-lab-'));
const profile=join(temp,'chrome');
const child=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
 '--disable-background-networking','--remote-allow-origins=*','--remote-debugging-port=0',
 '--no-first-run','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,limit=24000){
 const stop=Date.now()+limit;
 while(Date.now()<stop){try{const v=await fn();if(v)return v}catch{}await wait(110)}
 throw Error('V042 Lab browser acceptance timed out');
}
function connect(url){
 return new Promise((resolve,reject)=>{
  const ws=new WebSocket(url),pending=new Map();
  let counter=0;
  ws.addEventListener('open',()=>resolve({
   send(method,params={}){
    const n=++counter;
    return new Promise((res,rej)=>{pending.set(n,{res,rej});ws.send(JSON.stringify({id:n,method,params}))});
   },close(){ws.close()}
  }),{once:true});
  ws.addEventListener('message',e=>{
   const data=JSON.parse(String(e.data)),item=pending.get(data.id);
   if(!item)return;
   pending.delete(data.id);data.error?item.rej(Error(data.error.message)):item.res(data.result||{});
  });
  ws.addEventListener('error',()=>reject(Error('Chrome DevTools unavailable')),{once:true});
 });
}
const result={fixture:'local-only',project:'BACKSTAGE MODERATION',widths:[],caseCreation:false,
 persistedAcrossReload:false,caseTransition:false,audit:false,verifiedHandoff:false};
let client=null;
try{
 const port=await until(()=>{
  try{return readFileSync(join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]}catch{return null}
 });
 const url=await until(async()=>{
  const d=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();
  return d.find(x=>x.type==='page')?.webSocketDebuggerUrl;
 });
 client=await connect(url);
 await client.send('Page.enable');await client.send('Runtime.enable');
 const evaluate=async exp=>{
  const r=await client.send('Runtime.evaluate',{expression:exp,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text||'Browser evaluation error');
  return r.result?.value;
 };
 async function goto(){
  await client.send('Page.navigate',{url:base+prefix});
  await until(()=>evaluate("document.readyState==='complete'&&!!document.querySelector('.metrics')"));
 }
 await goto();
 assert.equal(await evaluate("document.getElementById('countOpen').textContent"),'0');
 assert.equal(await evaluate("document.body.innerText.includes('No simulated community statistics.')"),true);
 const link=await evaluate("(()=>{const a=document.querySelector('a.real');return {href:a?.href,target:a?.target,rel:a?.rel}})()");
 assert.equal(link.href,'https://a.anevum.com/community/review');
 assert.equal(link.target,'_blank');assert.match(link.rel,/noopener/);
 result.verifiedHandoff=true;
 // Create a real LOCAL case, in the same format Backstage understands.
 await evaluate("document.querySelector('[data-tab=\"new\"]').click()");
 await until(()=>evaluate("document.getElementById('newForm').offsetParent!==null"));
 await evaluate("(()=>{document.getElementById('newTitle').value='Moderation readiness intake';document.getElementById('newDetail').value='Check the two-person review protocol before inviting new moderators.';document.getElementById('newTarget').value='https://a.anevum.com/community/review';document.getElementById('newPriority').value='high';document.querySelector('#newForm button[type=submit]').click()})()");
 await until(()=>evaluate("document.getElementById('caseDetailWrap').hidden===false"));
 const saved=await evaluate("(()=>{const raw=localStorage.getItem('anevum.lab.backstage.cases.v1');const v=JSON.parse(raw);return {schema:v.schema,count:v.cases.length,kind:v.cases[0].category,priority:v.cases[0].priority,state:v.cases[0].status}})()");
 assert.deepEqual(saved,{schema:'backstage-local-v1',count:1,kind:'moderation',priority:'high',state:'open'});
 result.caseCreation=true;
 await evaluate("(()=>{const d=document.querySelector('#caseDetail');d.querySelector('select').value='review';d.querySelector('textarea').value='Independent reviewer assignment required before publication';d.querySelector('button[type=submit]').click()})()");
 await until(()=>evaluate("document.querySelector('#caseDetail select')?.value==='review'"));
 const state=await evaluate("(()=>{const c=JSON.parse(localStorage.getItem('anevum.lab.backstage.cases.v1')).cases[0];return {status:c.status,events:c.events.length,notes:c.events[1]?.note}})()");
 assert.equal(state.status,'review');assert.equal(state.events,2);
 assert.match(state.notes,/Independent reviewer/);result.caseTransition=true;
 await goto();
 await until(()=>evaluate("document.getElementById('countReview').textContent==='1'"));
 result.persistedAcrossReload=true;
 await evaluate("document.querySelector('[data-tab=\"audit\"]').click()");
 await until(()=>evaluate("document.querySelectorAll('#auditList .event').length===2"));
 result.audit=true;
 await evaluate("document.querySelector('[data-tab=\"overview\"]').click()");
 for(const [width,height] of [[1440,900],[1024,768],[390,844],[320,720]]){
  await client.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=390});
  await wait(220);
  const layout=await evaluate("({viewport:innerWidth,docWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,visible:document.querySelector('.metrics')?.offsetWidth>0})");
  assert.ok(layout.docWidth<=width+2,JSON.stringify({width,...layout}));
  assert.equal(layout.visible,true);
  const image=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  writeFileSync(join(out,'lab-moderation-'+width+'.png'),Buffer.from(image.data,'base64'));
  result.widths.push({width,...layout});
 }
 writeFileSync(join(out,'acceptance.json'),JSON.stringify(result,null,2));
 console.log('ANEVUM_LAB_MODERATOR_V042_BROWSER=PASS');
}catch(e){console.error('ANEVUM_LAB_MODERATOR_V042_BROWSER_FAILED='+String(e));throw e}
finally{
 client?.close();child.kill();
 await new Promise(resolve=>{
  if(child.exitCode!==null||child.signalCode!==null){resolve();return}
  const timer=setTimeout(resolve,3000);child.once('exit',()=>{clearTimeout(timer);resolve()});
 });
 await new Promise(resolve=>server.close(()=>resolve()));
 try{rmSync(temp,{recursive:true,force:true,maxRetries:20,retryDelay:200})}
 catch(e){console.warn('Browser process cleanup deferred: '+String(e?.code||e))}
}

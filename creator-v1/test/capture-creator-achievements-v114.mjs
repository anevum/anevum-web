// Compiled React V114 browser acceptance. Synthetic SQL/identity ONLY.
// No production accounts, official achievement grants, XP or publication.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
const args=process.argv.slice(2),arg=key=>args[args.indexOf(key)+1];
const chrome=arg('--chrome'),output=resolve(arg('--output')||'evidence/creator-achievements-v114');
assert.ok(chrome,'Chromium binary required');
mkdirSync(output,{recursive:true});
const base='http://127.0.0.1:4178';
const projectId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,timeoutMs=20000){
 const end=Date.now()+timeoutMs;
 let error;
 while(Date.now()<end){
  try{const value=await fn();if(value)return value;}catch(e){error=e;}
  await pause(100);
 }
 throw Error(label+' timed out'+(error?' / '+error.message:''));
}
const profile=mkdtempSync(join(tmpdir(),'anevum-achievements-v114-'));
const child=spawn(chrome,['--headless=new','--no-sandbox','--no-first-run',
 '--disable-dev-shm-usage','--disable-background-networking','--remote-debugging-port=0',
 '--remote-allow-origins=*','--user-data-dir='+profile,'about:blank'],
 {stdio:['ignore','ignore','pipe']});
let stderr='',socket,sequence=0;
const pending=new Map(),events=new Map(),errors=[],requests=[];
child.stderr.on('data',data=>{stderr+=String(data);});
async function send(method,params={}){
 return new Promise((accept,reject)=>{
  const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},30000);
  pending.set(id,{accept,reject,timer});
  socket.send(JSON.stringify({id,method,params}));
 });
}
async function evaluate(expression){
 const reply=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});
 if(reply.exceptionDetails)throw Error(reply.exceptionDetails.exception?.description||reply.exceptionDetails.text||'Evaluation failed');
 return reply.result?.value;
}
const exists=selector=>evaluate('!!document.querySelector('+JSON.stringify(selector)+')');
const text=selector=>evaluate('document.querySelector('+JSON.stringify(selector)+')?.textContent||""');
const click=selector=>evaluate('(()=>{const element=document.querySelector('+JSON.stringify(selector)+');if(!element||element.disabled)throw Error("Unavailable action "+'+JSON.stringify(selector)+');element.click();return true;})()');
const cookie=async present=>present?send('Network.setCookie',{
 url:base,name:'anevum_offline_visual_fixture',value:'1',sameSite:'Strict'
}):send('Network.deleteCookies',{url:base,name:'anevum_offline_visual_fixture'});
async function navigate(path){
 await send('Page.navigate',{url:base+path});
 await until(()=>evaluate('document.readyState==="complete"'),'Document load');
}
async function metrics(width){
 await send('Emulation.setDeviceMetricsOverride',{width,height:width===1440?900:844,deviceScaleFactor:2,mobile:width<600});
 await pause(230);
 const m=await evaluate('(()=>({viewport:window.innerWidth,document:document.documentElement.scrollWidth,root:document.querySelector(".cav-root")?.scrollWidth,rootClient:document.querySelector(".cav-root")?.clientWidth}))()');
 assert.ok(m.root>0,'Builder root must exist');
 assert.ok(m.document<=m.viewport+1,'No horizontal document overflow at '+width+': '+JSON.stringify(m));
 assert.ok(m.root<=m.rootClient+1,'No horizontal builder overflow at '+width+': '+JSON.stringify(m));
 const screenshot=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
 assert.ok(screenshot.data,'Screenshot available '+width);
 writeFileSync(join(output,'compiled-'+width+'.png'),Buffer.from(screenshot.data,'base64'));
 return m;
}
try{
 await until(async()=>{try{const res=await fetch(base+'/__ready');return res.ok&&(await res.json()).ready;}catch{return false;}},'Built preview readiness');
 const port=await until(()=>{const f=join(profile,'DevToolsActivePort');return existsSync(f)?readFileSync(f,'utf8').split('\n')[0]:null;},'Chromium DevTools port',60000);
 const target=await until(async()=>{const res=await fetch('http://127.0.0.1:'+port+'/json/list');return (await res.json()).find(t=>t.type==='page'&&t.webSocketDebuggerUrl);},'Chromium page target');
 socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 socket.addEventListener('message',event=>{
  const payload=JSON.parse(String(event.data));
  if(payload.id){
   const p=pending.get(payload.id);if(!p)return;
   clearTimeout(p.timer);pending.delete(payload.id);
   payload.error?p.reject(Error(payload.error.message)):p.accept(payload.result||{});
  }else events.get(payload.method)?.(payload.params);
 });
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 events.set('Runtime.exceptionThrown',ev=>errors.push(ev.exceptionDetails?.exception?.description||ev.exceptionDetails?.text||'Page exception'));
 events.set('Network.requestWillBeSent',ev=>requests.push({url:ev.request?.url||'',method:ev.request?.method||''}));
 await cookie(true);
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:2,mobile:false});
 await navigate('/creator/studio/'+projectId+'/achievements');
 await until(()=>exists('[data-achievement-builder="v114"]'),'Mounted V114 React builder');
 await until(()=>text('.cav-boundary strong').then(v=>v.includes('SYNTHETIC REVIEW')),'Private project API inventory');
 assert.ok((await text('.cav-header')).includes('PRIVATE DESIGN / NOT ISSUING'));
 assert.ok((await text('.cav-footer')).includes('published definition'));
 const first=await metrics(1440);
 // The first starter is a private definition; preview and event testing issue no awards.
 await click('.cav-preview button');
 await until(()=>text('.cav-progress-label').then(x=>x.includes('SIMULATED COMPLETION')),'Simulated event completion');
 const before=await(await fetch(base+'/api/v1/member/studio/projects/'+projectId+'/achievements',{headers:{cookie:'anevum_offline_visual_fixture=1'}})).json();
 assert.equal(before.achievements.length,0,'Simulated milestone creates no saved reward');
 await click('.cav-editor button[type="submit"]');
 await until(()=>text('.cav-notice').then(x=>x.includes('Private draft saved')),'Private SQL save');
 assert.equal(await evaluate('document.querySelectorAll(".cav-draft").length'),1,'One saved mark');
 assert.equal(await evaluate('(()=>{const label=[...document.querySelectorAll(".cav-field")].find(x=>x.textContent.includes("Stable identifier"));return label?.querySelector("input")?.disabled;})()'),true,'Stable key locked after creation');
 // Simulate reload: persisted record must come from the server, not React memory.
 await navigate('/creator/studio/'+projectId+'/achievements');
 await until(()=>evaluate('document.querySelectorAll(".cav-draft").length===1'),'Saved mark survives full reload');
 await click('.cav-draft-list .cav-draft');
 assert.ok((await text('.cav-editor')).includes('REV 1'));
 await click('.cav-starters button:nth-of-type(2)');
 assert.ok((await text('.cav-preview h2')).includes('Undiscovered project mark'),'Secret remains concealed');
 await click('.cav-simulator button:nth-of-type(2)');
 assert.ok((await text('.cav-preview h2')).includes('Hidden Observatory'),'Secret revealed only in simulation');
 const mobile390=await metrics(390);
 const mobile320=await metrics(320);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".cav-sigil-orbit")).animationName'),'none','OS reduced motion respected');
 // A guest cannot load saved creator definitions; no signed-in data persists after page reload.
 await cookie(false);
 await navigate('/creator/studio/'+projectId+'/achievements');
 await until(()=>text('body').then(x=>x.includes('Sign in to design project achievements.')),'Guest denied private builder');
 assert.equal(await exists('.cav-draft'),false,'Guest cannot see private saved titles');
 assert.equal(requests.filter(r=>r.method!=='GET'&&/\/api\/v1\/member\/(?:recognition|progression|notifications\/ack)/.test(r.url)).length,0,'No XP/award/ack mutation route called');
 assert.equal(requests.filter(r=>/api\.openai\.com|chatgpt\.com\/backend-api/.test(r.url)).length,0,'No provider calls');
 assert.deepEqual(errors,[],'Compiled React must not throw');
 const result={status:'PASS',source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  scope:'Compiled React, synthetic Better Auth cookie and test-only SQLite-backed private draft service. Not production/Safari/user acceptance.',
  dimensions:[first,mobile390,mobile320],privateSave:true,reload:true,secretPreview:true,guestDenied:true,
  browserExceptions:errors,externalProviderCalls:0,platformAwardsIssued:0};
 writeFileSync(join(output,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(err){
 writeFileSync(join(output,'error.txt'),String(err)+'\n'+errors.join('\n')+'\n'+stderr.slice(-5000));
 throw err;
}finally{
 if(socket){for(const p of pending.values())clearTimeout(p.timer);socket.close();}
 if(child.exitCode===null){
  const exited=new Promise(resolve=>child.once('exit',resolve));
  child.kill('SIGTERM');await Promise.race([exited,pause(2000)]);
  if(child.exitCode===null)child.kill('SIGKILL');
 }
 try{rmSync(profile,{recursive:true,force:true,maxRetries:8,retryDelay:140});}
 catch(err){console.warn('Chromium scratch cleanup deferred:',String(err));}
}

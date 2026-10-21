/**
 * Real compiled React / Chromium Workbench alpha acceptance on disposable
 * loopback fixture accounts. NO live users, auth tokens, Cloudflare writes,
 * real AI, executable upload or production release evidence.
 */
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createWorkbenchBrowserFixture} from './workbench-alpha-browser-fixture.mjs';
const args=process.argv.slice(2),arg=n=>args[args.indexOf(n)+1],chrome=arg('--chrome'),output=arg('--output'),disabled=args.includes('--disabled');
assert.ok(chrome&&output,'Pass --chrome and --output for a checked-in Chromium fixture run');
const root=fileURLToPath(new URL('../../',import.meta.url));
let source=null;
try{source=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();}
catch{if(process.env.GITHUB_ACTIONS==='true')throw Error('Browser evidence must be tied to the exact Git checkout');}
if(source!==null)assert.match(source,/^[a-f0-9]{40}$/);
const PORT=4181,BASE_URL='http://127.0.0.1:'+PORT;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,label,timeout=30000){
 const end=Date.now()+timeout;let last;
 while(Date.now()<end){try{const v=await fn();if(v)return v;}catch(e){last=e;}await delay(125);}
 throw Error(label+' timed out'+(last?' ('+last.message+')':''));
}
mkdirSync(output,{recursive:true});
const fixture=createWorkbenchBrowserFixture();await fixture.start();
const profile=mkdtempSync(join(tmpdir(),'anevum-workbench-cdp-'));
const browser=spawn(chrome,[
 '--headless=new','--no-sandbox','--no-first-run','--disable-dev-shm-usage','--disable-background-networking',
 '--remote-debugging-port=0','--remote-allow-origins=*','--use-angle=swiftshader','--enable-unsafe-swiftshader',
 '--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
let browserLogs='';browser.stderr.on('data',b=>{browserLogs+=String(b)});
const evidence=[],errors=[];
async function connect(url){
 const ws=new WebSocket(url);await new Promise((ok,no)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',no,{once:true});});
 let seq=0;const pending=new Map();const subscriptions=new Map();
 ws.addEventListener('message',event=>{
  const m=JSON.parse(String(event.data));
  if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result||{});}
  else subscriptions.get(m.method)?.(m.params);
 });
 ws.addEventListener('close',()=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Chrome closed'));}pending.clear()});
 return {
  send(method,params={}){return new Promise((resolve,reject)=>{
   const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP method timeout: '+method));},30000);
   pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));
  });},on(name,callback){subscriptions.set(name,callback)},close(){ws.close()}
 };
}
let c;
async function evaluate(code){
 const r=await c.send('Runtime.evaluate',{expression:code,returnByValue:true,awaitPromise:true,userGesture:true});
 if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text||'Chrome evaluation failed');
 return r.result?.value;
}
const q=s=>evaluate('!!document.querySelector('+JSON.stringify(s)+')');
const contains=s=>evaluate('document.body.textContent.includes('+JSON.stringify(s)+')');
async function navigate(path='/studio/workbench'){
 const prior=await evaluate('performance.timeOrigin');
 await c.send('Page.navigate',{url:BASE_URL+'/creator'+path});
 await until(()=>evaluate('document.readyState==="complete"&&performance.timeOrigin!=='+prior),'Navigation '+path);
}
async function clickText(text,selector='button'){
 await evaluate('(()=>{const el=[...document.querySelectorAll('+JSON.stringify(selector)+')].find(x=>x.textContent.trim()==='+JSON.stringify(text)+');if(!el)throw Error("Missing control");el.click();})()');
}
async function changeField(selector,value){
 await evaluate('(()=>{const el=document.querySelector('+JSON.stringify(selector)+');if(!el)throw Error("Missing editable field");const type=el.tagName==="TEXTAREA"?HTMLTextAreaElement:HTMLInputElement;Object.getOwnPropertyDescriptor(type.prototype,"value").set.call(el,'+JSON.stringify(value)+');el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));})()');
}
async function screenshot(name){
 const frame=await c.send('Page.captureScreenshot',{format:'png',fromSurface:true});
 assert.ok(frame.data);
 writeFileSync(join(output,name+'.png'),Buffer.from(frame.data,'base64'));
}
async function layout(caseName,width){
 await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
 const result=await evaluate('(()=>{const root=document.querySelector(".wb-alpha");return {workbench:!!root,overflow:document.documentElement.scrollWidth>innerWidth+2,hasShell:!!document.querySelector(".site-shell--cinematic.av9-shell"),targetWidth:innerWidth,hasNav:!!document.querySelector("main#main")};})()');
 assert.equal(result.workbench,true,caseName+' Workbench DOM');
 assert.equal(result.overflow,false,caseName+' horizontal overflow');
 assert.equal(result.hasShell,true,caseName+' shared ANEVUM shell');
 assert.equal(result.hasNav,true,caseName+' shared main landmark');
 assert.equal(result.targetWidth,width,caseName+' viewport');
 await screenshot(caseName+'-'+width);
 evidence.push({case:caseName,width,passed:true});
}
try{
 await until(async()=>{const r=await fetch('http://127.0.0.1:4178/__ready');return r.ok&&(await r.json()).ready;},'Compiled React fixture');
 const port=await until(()=>{
  const f=join(profile,'DevToolsActivePort');return existsSync(f)?readFileSync(f,'utf8').split('\n')[0]:null;
 },'Chrome launch',60000);
 const target=await until(async()=>{
  const r=await fetch('http://127.0.0.1:'+port+'/json/list');return (await r.json()).find(x=>x.type==='page'&&x.webSocketDebuggerUrl);
 },'Chrome page target');
 c=await connect(target.webSocketDebuggerUrl);
 await c.send('Page.enable');await c.send('Runtime.enable');await c.send('Network.enable');
 c.on('Runtime.exceptionThrown',p=>errors.push(p.exceptionDetails?.exception?.description||p.exceptionDetails?.text||'Unhandled browser exception'));
 await c.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await c.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});

 if(disabled){
  fixture.control.setActor('owner');
  await navigate();
  await until(()=>contains('Private alpha is not active.'),'Default-OFF Studio alpha notice');
  assert.equal(fixture.control.count(),0,'Flag-OFF UI must not call any private Workbench API');
  await screenshot('alpha-default-off-390');
  evidence.push({case:'default-off',width:390,requests:0,passed:true});
 }else{
  fixture.control.setActor('guest');await navigate();
  await until(()=>contains('Sign in to enter.'),'Guest denied');
  assert.equal(fixture.control.count(),0,'Guest access cannot resolve private Workbench API');
  evidence.push({case:'guest-denied',passed:true});

  fixture.control.setActor('pilot');await navigate();
  await until(()=>contains('Invitation required.'),'Noninvited pilot denied');
  assert.equal(await q('.wb-layout'),false,'No editor before admission');
  evidence.push({case:'uninvited-denied',passed:true});

  fixture.control.setActor('owner');await navigate();
  await until(()=>q('.wb-pilots'),'Founder pilot panel');
  assert.equal(await q('.wb-access-find'),true,'Owner can find verified members');
  await screenshot('alpha-founder-390');
  evidence.push({case:'founder-management-visible',passed:true});
  // Browser UI proves owner-visible controls. Canonical SQLite tests separately
  // prove atomic grant/revoke, audit and staff independence.
  fixture.control.grant('pilot');

  fixture.control.setActor('pilot');
  for(const [width,height] of [[1440,1000],[768,1024],[390,844],[320,720]]){
   await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
   await navigate();await until(()=>q('.wb-library'),'Invited Workbench');
   await layout('alpha-invited',width);
  }
  await clickText('New signal story');
  await until(()=>q('.wb-editor-head'),'Editable sample');
  assert.equal(await contains('Unsaved changes'),true);
  await clickText('Playtest');
  await until(()=>q('.wb-preview'),'Safe branching playtest');
  await clickText('Follow the signal');
  await until(()=>contains('The Archive'),'Choice navigates to second scene');
  assert.equal(await q('.wb-preview script'),false,'Native text preview cannot execute HTML');
  await screenshot('alpha-branching-story-320');
  evidence.push({case:'scene-branching-playtest',passed:true});
  await clickText('Restart story');
  await until(()=>contains('The First Signal'),'Story restart before editing');
  await clickText('Visual editor');
  await until(()=>q('.wb-inspector textarea'),'Scene inspector');
  await changeField('.wb-inspector textarea','The First Signal <script>alert(1)</script>');
  await until(()=>contains('Unsaved changes'),'Changed native document');
  await clickText('Playtest');
  await until(()=>q('.wb-preview h2'),'Re-rendered safe preview');
  assert.equal(await q('.wb-preview script'),false,'Creator markup must remain text');
  assert.equal(await contains('<script>alert(1)</script>'),true,'Literal text retained');
  evidence.push({case:'markup-inert-in-safe-preview',passed:true});
  await clickText('Visual editor');
  await clickText('Save draft');
  await until(()=>contains('Saved to ANEVUM / revision 1'),'Private save acknowledgment');
  assert.equal(fixture.control.projects().length,1,'One owned project persisted');
  const savedId=fixture.control.projects()[0].id;
  assert.match(savedId,/^[0-9a-f-]{36}$/);
  await screenshot('alpha-saved-320');
  evidence.push({case:'real-ui-private-save',passed:true});

  await navigate();
  await until(()=>q('.wb-project'),'Saved project in private library');
  assert.equal(fixture.control.projects().length,1,'Revisit does not duplicate project');
  evidence.push({case:'revisit-owned-project',passed:true});

  fixture.control.grant('other');
  fixture.control.setActor('other');await navigate();
  await until(()=>contains('Start with two linked scenes.'),'Other member empty library');
  assert.equal(await q('.wb-project'),false,'Other member cannot read pilot project');
  evidence.push({case:'cross-account-isolation-ui',passed:true});

  fixture.control.revoke('pilot');fixture.control.setActor('pilot');await navigate();
  await until(()=>contains('Invitation required.'),'Revocation visible on fresh request');
  assert.equal(await q('.wb-layout'),false,'Revoked pilot cannot mount editor');
  evidence.push({case:'revoked-denied',passed:true});
 }
 if(errors.length)throw Error('Compiled React raised browser exceptions: '+errors.slice(0,3).join(' | '));
 const result={status:'PASS',source,disabled,syntheticOnly:true,physicalDeviceAcceptance:false,
  onProduction:false,realAIPowered:false,cases:evidence,exceptions:errors};
 writeFileSync(join(output,'acceptance.json'),JSON.stringify(result,null,2));
 console.log('WORKBENCH_ALPHA_SYNTHETIC_BROWSER_PASS '+evidence.length+' cases');
}finally{
 writeFileSync(join(output,'chromium.log'),browserLogs);
 try{c?.close()}catch{}
 const exited=browser.exitCode!==null?Promise.resolve():new Promise(resolve=>{
   browser.once('exit',resolve);
   browser.kill('SIGTERM');
 });
 await Promise.race([exited,delay(3000)]);
 await fixture.close();
 // Chrome may asynchronously finish Cache/Preferences writes after SIGTERM.
 // Source/browser acceptance has already been recorded; cleanup races must
 // not misreport a tested build as a product failure.
 try{rmSync(profile,{recursive:true,force:true,maxRetries:12,retryDelay:250});}
 catch(e){console.warn('Disposable Chromium profile cleanup incomplete:',e.code||e.message);}
}

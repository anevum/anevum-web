/** Compiled synthetic-only browser evidence for V115 visual-review route.
 * Requires local offline preview server port 4178 and a Chrome binary.
 * Never authenticates a real member or writes to a real service.
 */
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {existsSync,readFileSync,mkdirSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
const args=process.argv.slice(2),arg=key=>args[args.indexOf(key)+1];
const chrome=arg('--chrome'),output=resolve(arg('--output')||'evidence/studio-v115');
assert.ok(chrome,'Chromium executable required');
mkdirSync(output,{recursive:true});
const base='http://127.0.0.1:4178';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,label,limit=18000){
 const end=Date.now()+limit;let last;
 while(Date.now()<end){try{const result=await fn();if(result)return result;}catch(error){last=error;}await pause(130);}
 throw Error(label+' timed out'+(last?' ('+last.message+')':''));
}
const profile=mkdtempSync(join(tmpdir(),'anevum-studio-v115-'));
const child=spawn(chrome,['--headless=new','--no-sandbox','--no-first-run','--disable-dev-shm-usage',
 '--disable-background-networking','--remote-debugging-port=0','--remote-allow-origins=*',
 '--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
let stderr='',socket,sequence=0;
const pending=new Map(),events=new Map(),exceptions=[],requests=[],screens=[];
child.stderr.on('data',x=>{stderr+=String(x);});
async function send(method,params={}){
 return new Promise((resolve,reject)=>{
  const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},25000);
  pending.set(id,{resolve,reject,timer});
  socket.send(JSON.stringify({id,method,params}));
 });
}
async function evalJS(expression){
 const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});
 if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text||'Runtime eval exception');
 return r.result?.value;
}
function jsFind(selector){
 return 'document.querySelector('+JSON.stringify(selector)+')';
}
async function visible(selector){return evalJS('!!('+jsFind(selector)+')');}
async function click(selector){
 return evalJS('(()=>{const e='+jsFind(selector)+';if(!e)throw Error("Missing "+'+JSON.stringify(selector)+');e.click();return true;})()');
}
async function fill(selector,value){
 return evalJS('(()=>{const e='+jsFind(selector)+';if(!e)throw Error("Missing input");const d=Object.getOwnPropertyDescriptor(e.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,"value");d.set.call(e,'+JSON.stringify(value)+');e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));return true;})()');
}
async function screenshot(name){
 const r=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
 assert.ok(r.data,'Screenshot bytes missing');
 writeFileSync(join(output,name+'.png'),Buffer.from(r.data,'base64'));
 screens.push(name+'.png');
}
async function metrics(width,height){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:width<=640});
 await pause(190);
 return evalJS('(()=>{const r=document.querySelector(".cvs-root");const b=r.getBoundingClientRect();return {width:innerWidth,height:innerHeight,scrollWidth:r.scrollWidth,clientWidth:r.clientWidth,boxX:b.left,boxRight:b.right,objectsPanel:getComputedStyle(document.querySelector(".cvs-explorer")).position};})()');
}
try{
 await until(async()=>{try{const r=await fetch(base+'/__ready');return r.ok&&(await r.json()).ready;}catch{return false;}},'Compiled offline preview');
 const port=await until(()=>{const p=join(profile,'DevToolsActivePort');return existsSync(p)?readFileSync(p,'utf8').split('\n')[0]:null;},'Chromium start',60000);
 const target=await until(async()=>{const r=await fetch('http://127.0.0.1:'+port+'/json/list');return (await r.json()).find(v=>v.type==='page'&&v.webSocketDebuggerUrl);},'Browser target');
 socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 socket.addEventListener('message',event=>{
  const m=JSON.parse(String(event.data));
  if(m.id){
   const p=pending.get(m.id);if(!p)return;
   clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result||{});
  }else events.get(m.method)?.(m.params);
 });
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 events.set('Runtime.exceptionThrown',e=>exceptions.push(e.exceptionDetails?.exception?.description||e.exceptionDetails?.text||'Browser exception'));
 events.set('Network.requestWillBeSent',e=>requests.push({method:e.request?.method,url:e.request?.url}));
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:2,mobile:false});
 await send('Page.navigate',{url:base+'/creator/studio/visual-review'});
 await until(()=>visible('[data-creator-visual-review="v115"]'),'Actual compiled V115 React review');
 assert.equal(await evalJS('document.querySelector(".cvs-review-banner")?.textContent.includes("SYNTHETIC WORKSPACE")'),true);
 assert.equal(await visible('.cvs-head-brand svg.cvs-mark'),true,'Existing OrbitalMark present');
 assert.equal(await evalJS('document.querySelector(".cvs-primary").disabled'),true,'No pretend save');
 assert.equal(await evalJS('document.querySelector(".cvs-stage-badge").textContent.includes("NO GPU RENDERER YET")'),true);
 const desktop=await metrics(1440,900);
 assert.ok(desktop.scrollWidth<=desktop.clientWidth+2,'Desktop studio horizontal overflow '+JSON.stringify(desktop));
 await screenshot('desktop-world-1440');
 await click('.cvs-explorer-add');
 assert.equal(await evalJS('document.querySelectorAll(".cvs-object").length'),6,'Local object creation updates hierarchy');
 assert.equal(await evalJS('document.querySelector(".cvs-save-state").textContent.includes("LOCAL CHANGES")'),true);
 await fill('.cvs-field input[type=number]','6');
 await until(()=>evalJS('document.querySelector(".cvs-stage-coordinate")?.textContent.includes("6.0")'),'Local X transform reactive');
 await click('.cvs-tools button:nth-child(2)');
 assert.equal(await evalJS('document.querySelector(".cvs-tools button:nth-child(2)").getAttribute("aria-pressed")'),'true','Move tool selected');
 await click('.cvs-tools-secondary button');
 assert.equal(await evalJS('document.querySelector(".cvs-tools-secondary button").getAttribute("aria-pressed")'),'true','Night mode toggled');
 assert.equal(await evalJS('document.querySelector(".cvs-scene-art").getAttribute("style").includes("hue-rotate")'),true,'Visual filter changes');
 await screenshot('desktop-selected-transform-1440');
 await click('button[aria-label="Interface Builder"]');
 await until(()=>visible('.cvs-interface-preview'),'Interface sample active');
 await click('.cvs-sample-card button');
 assert.equal(await evalJS('document.querySelector(".cvs-sample-card small")?.textContent.includes("No changes were saved")'),true);
 await screenshot('desktop-interface-1440');
 await click('button[aria-label="Source & Logic"]');
 await until(()=>visible('.cvs-code-window textarea'),'Source sample');
 await fill('.cvs-code-window textarea','const synthetic = true;');
 assert.equal(await evalJS('document.querySelector(".cvs-code-window textarea").value'),'const synthetic = true;');
 await click('button[aria-label="World Composer"]');
 await fill('.cvs-asset-search input','Energy');
 await until(()=>evalJS('document.querySelectorAll(".cvs-asset-tile").length===1'),'Asset filter');
 await click('.cvs-project-actions .cvs-action');
 assert.equal(await evalJS('document.querySelectorAll(".cvs-object").length'),5,'Reset synthetic world');
 assert.equal(await evalJS('document.querySelector(".cvs-save-state").textContent.includes("NOT PERSISTED")'),true);
 await fill('.cvs-asset-search input','');
 const mobile=await metrics(390,844);
 assert.ok(mobile.scrollWidth<=mobile.clientWidth+2,'390 studio horizontal overflow '+JSON.stringify(mobile));
 assert.ok(mobile.boxX>=-2&&mobile.boxRight<=392,'390 viewport bounds '+JSON.stringify(mobile));
 assert.equal(await visible('.cvs-mobile-actionbar'),true,'Mobile controls exist');
 await screenshot('mobile-world-390');
 await click('.cvs-mobile-actionbar button:first-child');
 await until(()=>visible('.cvs-explorer.is-open'),'Mobile explorer drawer');
 await screenshot('mobile-explorer-390');
 await click('.cvs-explorer .cvs-mobile-close');
 await click('.cvs-mobile-actionbar button:nth-child(2)');
 await until(()=>visible('.cvs-inspector.is-open'),'Mobile inspector drawer');
 await screenshot('mobile-inspector-390');
 await click('.cvs-inspector .cvs-mobile-close');
 await click('.cvs-mobile-tabs button:nth-child(2)');
 await until(()=>visible('.cvs-interface-preview'),'Mobile interface mode');
 await screenshot('mobile-interface-390');
 await click('.cvs-mobile-tabs button:first-child');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 const reduced=await evalJS('parseFloat(getComputedStyle(document.querySelector(".cvs-craft")).animationDuration)');
 assert.ok(reduced<0.02,'Reduced-motion scene animation disabled: '+reduced);
 const phone=await metrics(320,720);
 assert.ok(phone.scrollWidth<=phone.clientWidth+2,'320 studio horizontal overflow '+JSON.stringify(phone));
 assert.ok(phone.boxX>=-2&&phone.boxRight<=322,'320 viewport bounds '+JSON.stringify(phone));
 await screenshot('small-phone-world-320');
 const writes=requests.filter(x=>x.method!=='GET'&&x.method!=='HEAD'&&/\/api\/v1\/member\/studio|\/upload\/v3|\/api\/v1\/xp|\/ai\b/.test(x.url));
 assert.equal(writes.length,0,'No Creator Studio or provider mutations from visual fixture');
 assert.equal(exceptions.length,0,'No runtime exceptions: '+exceptions.join('; '));
 const result={status:'PASS',syntheticOnly:true,realMemberAcceptance:false,
  browser:'Chromium headless',capturedAt:new Date().toISOString(),
  head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  desktop,mobile,phone,reducedMotionDuration:reduced,syntheticWrites:writes.length,
  exceptions,screens,feature:'V115 P0 / 2D illustrated reference only'};
 writeFileSync(join(output,'acceptance.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
}catch(error){
 writeFileSync(join(output,'failure.txt'),String(error)+'\n'+exceptions.join('\n')+'\n'+stderr.slice(-7000));
 throw error;
}finally{
 if(socket){for(const p of pending.values())clearTimeout(p.timer);socket.close();}
 if(child.exitCode===null){
  const exited=new Promise(resolve=>child.once('exit',resolve));child.kill('SIGTERM');
  await Promise.race([exited,pause(2000)]);if(child.exitCode===null)child.kill('SIGKILL');
 }
 try{rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:120});}
 catch(error){console.warn('Temporary Chrome profile cleanup deferred: '+String(error));}
}

/** V115 P1: compiled Chromium synthetic GPU and responsive scene acceptance.
 * Uses a local loopback fixture; never reaches a member DB, AI provider or
 * deployment service. Software-emulated WebGL2 is acceptable for this CI
 * execution test but NOT physical-device GPU/Safari sign-off.
 */
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const args=process.argv.slice(2),arg=key=>args[args.indexOf(key)+1];
const chrome=arg('--chrome'),output=resolve(arg('--output')||'evidence/studio-editor-v118');
assert.ok(chrome,'Chromium executable is required');
mkdirSync(output,{recursive:true});
const origin='http://127.0.0.1:4178';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(f,label,timeout=22000){
 const end=Date.now()+timeout;let last;
 while(Date.now()<end){try{const v=await f();if(v)return v;}catch(e){last=e;}await sleep(125);}
 throw Error(label+' timed out'+(last?' / '+String(last):''));
}
const dir=mkdtempSync(join(tmpdir(),'anevum-world-webgl2-'));
const child=spawn(chrome,['--headless=new','--no-sandbox','--no-first-run','--disable-dev-shm-usage',
 '--disable-background-networking','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader',
 '--remote-debugging-port=0','--remote-allow-origins=*','--user-data-dir='+dir,'about:blank'],{stdio:['ignore','ignore','pipe']});
let err='',socket,id=0;
const waiting=new Map(),listeners=new Map(),errors=[],requests=[],shots=[];
child.stderr.on('data',x=>{err+=String(x);});
async function send(method,params={}){
 return new Promise((ok,no)=>{
  const n=++id,t=setTimeout(()=>{waiting.delete(n);no(Error('CDP timeout '+method));},30000);
  waiting.set(n,{ok,no,t});socket.send(JSON.stringify({id:n,method,params}));
 });
}
async function evaluate(expression){
 const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});
 if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text||'Eval failed');
 return r.result?.value;
}
const q=s=>JSON.stringify(s);
async function click(selector){
 return evaluate('(()=>{const e=document.querySelector('+q(selector)+');if(!e)throw Error("Missing control");e.click();return true})()');
}
async function change(selector,value){
 return evaluate('(()=>{const e=document.querySelector('+q(selector)+');if(!e)throw Error("Missing input");'+
  'const d=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value");d.set.call(e,'+q(String(value))+');'+
  'e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}));return true})()');
}
async function photo(name){
 const r=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
 assert.ok(r.data);writeFileSync(join(output,name+'.png'),Buffer.from(r.data,'base64'));shots.push(name+'.png');
}
async function setSize(width,height){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:2,mobile:width<=680});
 await sleep(300);
 const val=await evaluate('(()=>{const r=document.querySelector(".cvw-root"),c=document.querySelector(".cvw-world-canvas");'+
  'const rect=r.getBoundingClientRect(),canvas=c?.getBoundingClientRect();return {'+
  'viewport:innerWidth,scrollWidth:r.scrollWidth,clientWidth:r.clientWidth,x:rect.x,right:rect.right,'+
  'canvasWidth:c?.width??0,canvasHeight:c?.height??0,visibleCanvasWidth:canvas?.width??0,'+
  'renderer:c?.parentElement?.dataset.worldCanvasV115??null}})()');
 assert.ok(val.scrollWidth<=val.clientWidth+2,'Studio overflow '+JSON.stringify(val));
 assert.ok(val.x>=-2&&val.right<=width+2,'Studio over viewport '+JSON.stringify(val));
 return val;
}
try{
 await until(async()=>{try{const r=await fetch(origin+'/__ready');return r.ok&&(await r.json()).ready;}catch{return false;}},'Offline fixture');
 const port=await until(()=>{const f=join(dir,'DevToolsActivePort');return existsSync(f)?readFileSync(f,'utf8').split('\n')[0]:null;},'Chrome ready',60000);
 const page=await until(async()=>{const r=await fetch('http://127.0.0.1:'+port+'/json/list');return (await r.json()).find(x=>x.type==='page'&&x.webSocketDebuggerUrl);},'Browser websocket');
 socket=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((ok,no)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',no,{once:true});});
 socket.addEventListener('message',event=>{
  const m=JSON.parse(String(event.data));
  if(m.id){
   const p=waiting.get(m.id);if(!p)return;waiting.delete(m.id);clearTimeout(p.t);m.error?p.no(Error(m.error.message)):p.ok(m.result||{});
  }else listeners.get(m.method)?.(m.params);
 });
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 listeners.set('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails?.exception?.description||e.exceptionDetails?.text||'Uncaught browser exception'));
 listeners.set('Network.requestWillBeSent',e=>requests.push({url:e.request?.url,method:e.request?.method}));
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:2,mobile:false});
 await send('Page.navigate',{url:origin+'/creator/studio/world-review'});
 await until(()=>evaluate('!!document.querySelector("[data-world-composer-v115]")'),'World Composer route');
 await until(()=>evaluate('document.querySelector("[data-world-canvas-v115]")?.dataset.worldCanvasV115==="webgl2"'),'Real WebGL2 shader initialization');
 const version=await evaluate('(()=>{const c=document.querySelector(".cvw-world-canvas"),gl=c.getContext("webgl2");return {version:gl?.getParameter(gl.VERSION),w:c.width,h:c.height,error:gl?.getError()};})()');
 assert.match(version.version,/WebGL 2/i,'This must be a real WebGL2 context');
 assert.ok(version.w>100&&version.h>100,'Canvas has physical GPU backbuffer');
 assert.equal(version.error,0,'No initial GL error');
 assert.equal(await evaluate('document.querySelector(".cvs-primary").disabled'),true,'Review must not have fake persistence');
 const desktop=await setSize(1440,900);
 await photo('world-gpu-1440');
 // V116 real unified Studio, not a static concept: file tree, mode navigation
 // and asset gallery are all present on the compiled React canvas route.
 assert.equal(await evaluate('document.querySelectorAll(".csn-workspace-tabs button").length'),6,'Six studio modes');
 assert.ok(await evaluate('document.querySelectorAll(".csn-file-node").length')>=10,'Hierarchical file navigator present');
 assert.equal(await evaluate('document.querySelectorAll(".csn-asset-card").length'),9,'Nine categorized design assets');
 assert.equal(await evaluate('document.querySelector(".cvs-head-brand h1").textContent.includes("CREATOR STUDIO")'),true,'Studio identity');
 await click('.csn-workspace-tabs button:nth-child(2)');
 await until(()=>evaluate('!!document.querySelector(".csn-interface-preview")'),'Responsive sample Interface Builder');
 await click('.csn-interface-preview button');
 assert.equal(await evaluate('document.querySelector(".csn-interface-preview small")?.textContent.includes("Nothing was saved")'),true);
 await photo('v116-desktop-interface-1440');
 await click('.csn-workspace-tabs button:nth-child(3)');
 await until(()=>evaluate('!!document.querySelector(".csn-code-content textarea")'),'Local Code mode');
 await click('.csn-code-filetabs button:nth-child(2)');
 assert.equal(await evaluate('document.querySelector(".csn-code-filetabs button:nth-child(2)").getAttribute("aria-selected")'),'true');
 await photo('v116-desktop-scripts-1440');
 await click('.csn-workspace-tabs button:nth-child(4)');
 await until(()=>evaluate('document.querySelectorAll(".csn-asset-card").length===9'),'Asset Foundry grid');
 await click('.csn-asset-card.is-preview');
 assert.equal(await evaluate('document.querySelector(".csn-preview-note")?.textContent.includes("concept artwork only")'),true);
 await photo('v116-desktop-assets-1440');
 await click('.csn-workspace-tabs button:first-child');
 await until(()=>evaluate('!!document.querySelector(".cvw-world-canvas")'),'Return to real WebGL2 world editor');
 await until(()=>evaluate('document.querySelector("[data-world-canvas-v115]")?.dataset.worldCanvasV115==="webgl2"'),'WebGL2 reinitialized after editor mode change');
 const before=await evaluate('document.querySelector("[data-camera-yaw]").dataset.cameraYaw');
 await evaluate('(()=>{const c=document.querySelector(".cvw-world-canvas");c.focus();c.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}));return true;})()');
 await until(()=>evaluate('document.querySelector("[data-camera-yaw]").dataset.cameraYaw!=='+q(before)),'Real camera orbit via keyboard');
 // A focused GPU viewport can move the selected scene object with
 // Shift+Arrow; the data change is undoable and inspector-visible.
 await evaluate('(()=>{const c=document.querySelector(".cvw-world-canvas");c.focus();c.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",shiftKey:true,bubbles:true}));return true;})()');
 await until(()=>evaluate('Number(document.querySelector(".cvw-vector input[type=number]").value)===.5'),'Selected object keyboard move');
 await click('.csn-axis-x button:last-child');
 await until(()=>evaluate('Number(document.querySelector(".cvw-vector input[type=number]").value)===1'),'Touch transform pad updates canonical XYZ inspector');
 await click('.csn-transform-heading button');
 await photo('v117-transform-pad-1440');
 await click('.cvw-primitive-grid button:first-child');
 await until(()=>evaluate('document.querySelectorAll(".cvw-tree-node").length===11'),'Local 3D node created');
 await click('button[aria-label="Undo scene edit"]');
 assert.equal(await evaluate('document.querySelectorAll(".cvw-tree-node").length'),10,'Undo reverted the world');
 await click('button[aria-label="Redo scene edit"]');
 assert.equal(await evaluate('document.querySelectorAll(".cvw-tree-node").length'),11,'Redo reinstated new world node');
 await evaluate('(()=>{const c=document.querySelector(".cvw-world-canvas");c.focus();c.dispatchEvent(new KeyboardEvent("keydown",{key:"z",ctrlKey:true,bubbles:true}));return true;})()');
 await until(()=>evaluate('document.querySelectorAll(".cvw-tree-node").length===10'),'Global Ctrl+Z undo scene edit');
 await evaluate('(()=>{const c=document.querySelector(".cvw-world-canvas");c.focus();c.dispatchEvent(new KeyboardEvent("keydown",{key:"z",ctrlKey:true,shiftKey:true,bubbles:true}));return true;})()');
 await until(()=>evaluate('document.querySelectorAll(".cvw-tree-node").length===11'),'Global Ctrl+Shift+Z redo scene edit');
 await change('.cvw-vector input[type=number]','5');
 await click('.cvw-toolbar button[aria-expanded]');
 await until(()=>evaluate('document.querySelector(".cvw-source textarea")?.value.includes("ANEVUM_WORLD_V1")'),'Real typed serialized document');
 const source=await evaluate('document.querySelector(".cvw-source textarea").value');
 assert.match(source,/"position":\[5,0,0\]/,'Inspector edit is encoded in actual document');
 await click('.csn-export-heading button');
 await until(()=>evaluate('document.querySelector(".csn-export-notice")?.textContent.includes("No cloud revision was saved")'),'Local world file export confirmation');
 assert.equal(await evaluate('document.querySelector(".cvs-primary").disabled'),true,'Export does not fake saving a member revision');
 await photo('world-gpu-inspector-1440');
 await click('.cvw-env select');
 await change('.cvw-env input[type=range]','.5');
 assert.ok(await evaluate('document.querySelector(".cvw-env strong").textContent.includes("0.50")'),'Light intensity updates model');
 const mobile=await setSize(390,844);
 assert.equal(mobile.renderer,'webgl2','GPU remains active at phone width');
 await photo('world-gpu-390');
 await click('.csn-workspace-tabs button:nth-child(2)');
 await until(()=>evaluate('!!document.querySelector(".csn-interface-preview")'),'390 responsive interface sample');
 const mobileInterface=await setSize(390,844);
 assert.ok(mobileInterface.scrollWidth<=mobileInterface.clientWidth+2,'Mobile interface avoids horizontal overflow');
 await photo('v116-mobile-interface-390');
 await click('.csn-workspace-tabs button:first-child');
 await until(()=>evaluate('document.querySelector("[data-world-canvas-v115]")?.dataset.worldCanvasV115==="webgl2"'),'390 return to WebGL2');

 await click('.cvw-mobile-tabs button:first-child');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".cvw-explorer")).display'),'flex');
 await photo('world-objects-390');
 await click('.cvw-explorer .cvw-close');
 await click('.cvw-mobile-tabs button:nth-child(2)');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".cvw-inspector")).display'),'flex');
 await photo('world-inspector-390');
 await click('.cvw-inspector .cvw-close');
 const small=await setSize(320,720);
 await photo('world-gpu-320');
 // A real WebGL2 loss extension, where offered, tests fallback/reinitialization.
 const hadExtension=await evaluate('(()=>{const gl=document.querySelector(".cvw-world-canvas").getContext("webgl2");const ext=gl.getExtension("WEBGL_lose_context");if(!ext)return false;window.__v115ContextLossExtension=ext;ext.loseContext();return true;})()');
 let recoveredBy='not-exercised';
 if(hadExtension){
  await until(()=>evaluate('document.querySelector("[data-world-canvas-v115]").dataset.worldCanvasV115==="lost"'),'Real WebGL2 context loss recovery state');
  assert.equal(await evaluate('document.querySelectorAll(".cvw-tree-node").length'),11,'Context loss preserved editable world');
  await photo('world-gpu-context-lost-320');
  // Restore using the SAME extension obtained before loss. Requerying the
  // context after loss silently skipped restoration on SwiftShader.
  await evaluate('(()=>{window.__v115ContextLossExtension.restoreContext();return true;})()');
  let nativeRestored=false;
  const nativeDeadline=Date.now()+5000;
  while(Date.now()<nativeDeadline){
   nativeRestored=await evaluate('document.querySelector("[data-world-canvas-v115]").dataset.worldCanvasV115==="webgl2"');
   if(nativeRestored)break;
   await sleep(150);
  }
  if(nativeRestored){
   recoveredBy='webglcontextrestored';
  }else{
   assert.equal(await evaluate('document.querySelector("[data-world-canvas-v115]").dataset.worldCanvasV115==="lost"'),true,'Fallback visible during stalled restore');
   await click('.cvw-retry-graphics');
   await until(()=>evaluate('document.querySelector("[data-world-canvas-v115]").dataset.worldCanvasV115==="webgl2"'),'Fresh-canvas GPU recovery',16000);
   recoveredBy='fresh-canvas-user-retry';
  }
  assert.equal(await evaluate('document.querySelectorAll(".cvw-tree-node").length'),11,'World state preserved after context recovery');
  await photo('world-gpu-recovered-320');
 }
 await click('.csn-asset-card.is-addable');
 await until(()=>evaluate('document.querySelectorAll(".cvw-tree-node").length===12'),'Asset shelf inserts a real undoable scene object');
 const newIsland=await evaluate('Array.from(document.querySelectorAll(".cvw-vector:first-of-type input")).slice(0,3).map(x=>Number(x.value))');
 assert.ok(newIsland.some(x=>x!==0),'Catalog island should spawn in unoccupied space rather than world origin');
 assert.equal(await evaluate('document.querySelector(".cvs-save-state")?.textContent.includes("UNSAVED LOCAL EDITS")'),true);
 await photo('v116-world-added-asset-320');
 // The Starcraft is no longer preview art: create a real GPU-selectable
 // world object and move it above the islands using the same typed transforms.
 await click('.csn-asset-card[title^="Add an editable Starcraft"]');
 await until(()=>evaluate('document.querySelectorAll(".cvw-tree-node").length===13'),'Playable procedural GPU Starcraft');
 const shipSpawn=await evaluate('Array.from(document.querySelectorAll(".cvw-vector:first-of-type input")).slice(0,3).map(x=>Number(x.value))');
 assert.ok(shipSpawn.some(x=>x!==0),'Starcraft should spawn in world space, not overlap the original spire');
 await change('.cvw-vector:first-of-type label:nth-child(2) input','6');
 await until(()=>evaluate('Number(document.querySelector(".cvw-vector input[type=number]").parentElement.parentElement.querySelectorAll("input")[1].value)===6'),'Starcraft vertical transform');
 await photo('v117-live-starcraft-320');
 // The compiled 1440 desktop scene and mobile craft have both been captured.
 // Avoid a redundant 2x GPU screenshot immediately after context restoration:
 // SwiftShader can stall the CDP capture command on this extra resize cycle.

 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 assert.equal(await evaluate('matchMedia("(prefers-reduced-motion: reduce)").matches'),true);
 const mutating=requests.filter(r=>r.method!=='GET'&&r.method!=='HEAD'&&
  /\/api\/|\/upload|\/billing|openai\.com|anthropic\.com/i.test(r.url||''));
 assert.equal(mutating.length,0,'Zero remote mutations from GPU prototype');
 assert.equal(errors.length,0,'No runtime browser exceptions '+errors.join('; '));
 const report={status:'PASS',source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  mode:'V118 editor flow / spaced asset placement / local world export / synthetic WebGL2 in Chromium CI',
  noRealMemberAcceptance:true,desktop,mobile,small,version,contextLossExercise:hadExtension,recoveredBy,
  prohibitedWrites:mutating.length,errors,screenshots:shots};
 writeFileSync(join(output,'acceptance.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
}catch(error){
 writeFileSync(join(output,'failure.txt'),String(error)+'\n'+errors.join('\n')+'\n'+err.slice(-7500));
 throw error;
}finally{
 if(socket){for(const p of waiting.values())clearTimeout(p.t);socket.close();}
 if(child.exitCode===null){const done=new Promise(ok=>child.once('exit',ok));child.kill('SIGTERM');
  await Promise.race([done,sleep(2000)]);if(child.exitCode===null)child.kill('SIGKILL');}
 try{rmSync(dir,{recursive:true,force:true,maxRetries:8,retryDelay:110});}catch{}
}

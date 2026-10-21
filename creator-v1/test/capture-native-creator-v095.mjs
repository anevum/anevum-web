/** Compiled React + browser interaction QA on loopback synthetic identities.
 * Does NOT certify real account acceptance or physical iPhone Safari behavior. */
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {spawn,execFileSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createNativeFixture,ids} from './native-creator-fixture-v095.mjs';
const args=process.argv.slice(2),get=name=>args[args.indexOf(name)+1];
const chrome=get('--chrome'),destination=get('--output'),output=destination?resolve(destination):null,disabled=args.includes('--disabled');
assert.ok(chrome&&output,'Pass the installed Chromium and an evidence directory');
// PR workflows check out the head commit, while GITHUB_SHA may identify a
// synthetic merge. Attribute captures only to the actual checked-out source.
let source=null;
try{
 source=execFileSync('git',['rev-parse','HEAD'],{
  cwd:fileURLToPath(new URL('../../',import.meta.url)),
  encoding:'utf8',stdio:['ignore','pipe','pipe']
 }).trim();
}catch{
 if(process.env.GITHUB_ACTIONS==='true')throw Error('Native browser evidence requires a Git source checkout in CI');
}
if(source!==null)assert.match(source,/^[a-f0-9]{40}$/,'Invalid checked-out source commit');
const base='http://127.0.0.1:4179',delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,timeout=25000){const stop=Date.now()+timeout;let last;while(Date.now()<stop){try{const x=await fn();if(x)return x;}catch(e){last=e;}await delay(120);}throw Error(label+' timed out'+(last?': '+last.message:''));}
mkdirSync(output,{recursive:true});
const fixture=createNativeFixture();await fixture.start();
const profile=mkdtempSync(join(tmpdir(),'anevum-v095-'));
const log=join(output,'chromium.log');
const child=spawn(chrome,['--headless=new','--no-sandbox','--no-first-run','--disable-dev-shm-usage','--disable-background-networking','--remote-debugging-port=0','--remote-allow-origins=*','--use-angle=swiftshader','--enable-unsafe-swiftshader','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
let chromeLog='',client;
child.stderr.on('data',x=>{chromeLog+=String(x);});
const results=[],exceptions=[];
async function connect(url){
 const socket=new WebSocket(url);await new Promise((ok,no)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',no,{once:true});});
 const pending=new Map(),handlers=new Map();let sequence=0;
 const c={send(method,params={},sessionId){return new Promise((ok,no)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);no(Error('CDP timeout: '+method));},30000);pending.set(id,{ok,no,timer});socket.send(JSON.stringify({id,method,params,...sessionId?{sessionId}:{}}));});},on(method,fn){handlers.set(method,fn);},close(){socket.close();}};
 socket.addEventListener('message',({data})=>{const msg=JSON.parse(String(data));if(msg.id){const p=pending.get(msg.id);if(!p)return;clearTimeout(p.timer);pending.delete(msg.id);msg.error?p.no(Error(msg.error.message)):p.ok(msg.result||{});}else handlers.get(msg.method)?.(msg.params,msg.sessionId);});
 socket.addEventListener('close',()=>{for(const p of pending.values()){clearTimeout(p.timer);p.no(Error('CDP closed'));}pending.clear();});return c;
}
let evaluate,screenshot;
try{
 await until(async()=>{const r=await fetch('http://127.0.0.1:4178/__ready');return r.ok&&(await r.json()).ready;},'Existing compiled fixture');
 const port=await until(()=>{const f=join(profile,'DevToolsActivePort');return existsSync(f)?readFileSync(f,'utf8').split('\n')[0]:null;},'Chromium startup',60000);
 const target=await until(async()=>{const r=await fetch('http://127.0.0.1:'+port+'/json/list');return (await r.json()).find(x=>x.type==='page'&&x.webSocketDebuggerUrl);},'Chromium target');
 client=await connect(target.webSocketDebuggerUrl);
 await client.send('Page.enable');await client.send('Runtime.enable');await client.send('Network.enable');
 client.on('Runtime.exceptionThrown',p=>exceptions.push(p.exceptionDetails?.exception?.description||p.exceptionDetails?.text||'Browser exception'));
 const demo='<!doctype html><html><head><style>body{background:#09182c;color:#edf4ff;font:18px system-ui;padding:30px}button{padding:16px;margin:8px}</style></head><body><p>OFFLINE SYNTHETIC EXECUTION FIXTURE</p><h1>Uplink playtest</h1><p id="count">0</p><button id="send">Send signal</button><button id="reset">Reset counter</button><script>let n=0;document.getElementById("send").onclick=()=>document.getElementById("count").textContent=++n;document.getElementById("reset").onclick=()=>{n=0;document.getElementById("count").textContent=n;};</script></body></html>';
 client.on('Fetch.requestPaused',async p=>{
  try{
   const u=new URL(p.request.url);
   if(u.origin==='https://anevum-package-alpha-v003-runtime.devonakins.workers.dev')await client.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'content-type',value:'text/html'},{name:'content-security-policy',value:"sandbox allow-scripts allow-pointer-lock; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'"}],body:Buffer.from(demo).toString('base64')});
   else await client.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});
  }catch(e){exceptions.push('Interception: '+e.message);}
 });
 await client.send('Fetch.enable',{patterns:[{urlPattern:'https://*',requestStage:'Request'}]});
 evaluate=async(expression,sessionId)=>{const value=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true},sessionId);if(value.exceptionDetails)throw Error(value.exceptionDetails.exception?.description||value.exceptionDetails.text);return value.result?.value;};
 screenshot=async name=>{const image=await client.send('Page.captureScreenshot',{format:'png',fromSurface:true});assert.ok(image.data);writeFileSync(join(output,name+'.png'),Buffer.from(image.data,'base64'));};
 const navigate=async path=>{const time=await evaluate('performance.timeOrigin');await client.send('Page.navigate',{url:base+'/creator'+path});await until(()=>evaluate('document.readyState==="complete"&&performance.timeOrigin!=='+time),'Navigation '+path);};
 const visible=selector=>evaluate('!!document.querySelector('+JSON.stringify(selector)+')');
 const clickText=async(text,selector='button')=>{await evaluate('(()=>{const x=[...document.querySelectorAll('+JSON.stringify(selector)+')].find(x=>x.textContent.trim()==='+JSON.stringify(text)+');if(!x)throw Error("Missing control: '+text.replaceAll('"','')+'");x.click();})()');};
 const formValue=async(selector,value)=>evaluate('(()=>{const x=document.querySelector('+JSON.stringify(selector)+');if(!x)throw Error("Missing field");const p=x.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,"value").set.call(x,'+JSON.stringify(value)+');x.dispatchEvent(new Event("input",{bubbles:true}));x.dispatchEvent(new Event("change",{bubbles:true}));})()');
 // Shell navigation and the portal launcher also own dialogs. Scope every
 // decision probe to the actual open native decision, never the first dialog.
 const dialog='dialog.av095-decision[open]';
 const confirmDecision=async()=>{
  await until(()=>visible(dialog),'Native decision dialog');
  await evaluate('document.querySelector('+JSON.stringify(dialog+' input[type=checkbox]')+').click()');
  await evaluate('document.querySelector('+JSON.stringify(dialog+' button[type=submit]')+').click()');
 };
 const layout=async(label,width)=>{
  await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  const state=await evaluate('({shell:document.querySelectorAll(".site-shell--cinematic.av9-shell").length,header:document.querySelectorAll(".site-header").length,main:document.querySelectorAll("main#main").length,overflow:document.documentElement.scrollWidth>innerWidth+1,tokens:["--av9-space","--av9-paper","--av9-display","--av9-glass"].every(k=>!!getComputedStyle(document.querySelector(".av9-shell")).getPropertyValue(k).trim())})');
  assert.equal(state.shell,1,label);assert.equal(state.header,1,label);assert.equal(state.main,1,label);assert.equal(state.overflow,false,label+' overflow');assert.equal(state.tokens,true,label+' shared theme');
  // Mobile nav can scroll horizontally, but its labels must not shrink into
  // overlapping text. Check intrinsic label widths as well as link rectangles.
  const nav=await evaluate('(()=>{const el=document.querySelector(".st-nav");if(!el)return null;const links=[...el.querySelectorAll(":scope > a")];const rects=links.map(link=>link.getBoundingClientRect());const active=el.querySelector("a[aria-current=page]"),selected=active?.getBoundingClientRect(),frame=el.getBoundingClientRect();return {count:links.length,targets:rects.every(r=>r.height>=44),labelsFit:links.every(link=>link.getBoundingClientRect().width+1>=link.scrollWidth),separate:rects.every((rect,i)=>i===0||rect.left>=rects[i-1].right+2),scrollable:el.scrollWidth>el.clientWidth+4,activeVisible:!selected||(selected.left>=frame.left-2&&selected.right<=frame.right+2)}})()');
  if(nav){
   assert.ok(nav.count>=4,label+' must retain creator navigation');
   assert.equal(nav.labelsFit,true,label+' navigation labels overlap their link boxes');
   assert.equal(nav.targets,true,label+' navigation touch targets are too short');
   assert.equal(nav.separate,true,label+' navigation links overlap');
   assert.equal(nav.activeVisible,true,label+' active destination is clipped outside the mobile tab viewport');
   if(width<=390)assert.equal(nav.scrollable,true,label+' mobile tabs must remain horizontally accessible');
  }
  await screenshot(label+'-'+width);results.push({case:label,width,sharedShell:true,noOverflow:true,navVerified:nav!==null,passed:true});
 };
 await client.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 // textContent checks semantic copy; CSS text-transform legitimately changes
 // innerText in the established Continuance heading treatment.
 if(disabled){
  await client.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await navigate('/studio/packages');await until(()=>evaluate('document.body.textContent.includes("not active yet")'),'Flag-off page');await layout('native-disabled',390);
  assert.equal(fixture.control.trace().filter(x=>x.path.includes('/native/')).length,0,'Disabled interface called native API');
  results.push({case:'flag-off',nativeRequests:0,passed:true});
  for(const [width,height] of [[1440,1000],[768,1024],[390,844],[320,720]]){
   await client.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<641});
   await navigate('/studio');await until(()=>visible('.st-nav'),'Canonical Studio navigation');
   await layout('canonical-studio-navigation',width);
  }
 }else{
  for(const [width,height] of [[1440,1000],[768,1024],[390,844],[320,720]]){
   fixture.control.set({actor:'owner',mode:'ready',reset:true});await client.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<641});
   await navigate('/studio/packages');await until(()=>visible('[data-native-project]'),'Build library');await layout('native-library',width);
   await navigate('/studio/packages/new');await until(()=>visible('.av095-upload-grid'),'Native uploader');await layout('native-upload',width);
   await navigate('/projects/package/'+ids.project+'?preview=1');await until(()=>visible('[data-native-player] iframe'),'Private native player');await layout('native-private-player',width);
   assert.equal(await evaluate('[...document.querySelectorAll("button")].some(x=>x.textContent.includes("Approve and publish"))'),false,'Creator cannot self-approve');
  }
  const frameStatus=await evaluate('document.querySelector(".av102-player-status")?.dataset.playerFrameState');
  assert.ok(['opening','frame-loaded','slow'].includes(frameStatus),'Player status must describe frame loading without claiming runtime health');
  const original=await evaluate('document.querySelector(".av095-player iframe").src');
  await clickText('Phone width');
  await until(()=>evaluate('document.querySelector(".av095-player").dataset.playerViewport==="phone"'),'Simulated phone stage');
  assert.equal(await evaluate('document.querySelector(".av095-player iframe").src'),original,'Resizing must not reload the untrusted frame');
  assert.equal(await evaluate('document.querySelector(".av102-player-note")?.textContent.includes("not physical Safari")'),true);
  await clickText('Full width');
  await until(()=>evaluate('document.querySelector(".av095-player").dataset.playerViewport==="fit"'),'Restored responsive stage');
  assert.equal(await evaluate('document.querySelector(".av095-player iframe").src'),original);
  await evaluate('HTMLElement.prototype.requestFullscreen=undefined');const before=await evaluate('document.querySelector(".av095-player iframe").src');
  await clickText('Expand player');await until(()=>visible('.av095-player--expanded'),'Immersive fallback');await screenshot('native-iphone-expand-320');
  assert.equal(await evaluate('document.querySelector(".av095-player iframe").src'),before);
  await clickText('Exit player');await until(async()=>!await visible('.av095-player--expanded'),'Exit player');
  assert.equal(await evaluate('document.activeElement.textContent'),'Expand player');results.push({case:'same-frame-iphone-expand-exit',passed:true});
  const sandbox=await evaluate('document.querySelector(".av095-player iframe").getAttribute("sandbox")');assert.equal(sandbox,'allow-scripts allow-pointer-lock');
  const targets=await client.send('Target.getTargets');const frameTarget=targets.targetInfos.find(x=>x.type==='iframe'&&x.url.includes('anevum-package-alpha-v003-runtime'));
  if(frameTarget){const {sessionId}=await client.send('Target.attachToTarget',{targetId:frameTarget.targetId,flatten:true});await evaluate('document.getElementById("send").click()',sessionId);assert.equal(await evaluate('document.getElementById("count").textContent',sessionId),'1');await evaluate('document.getElementById("reset").click()',sessionId);assert.equal(await evaluate('document.getElementById("count").textContent',sessionId),'0');results.push({case:'isolated-runtime-buttons',passed:true});}
  else {const frames=await client.send('Page.getFrameTree');const frame=frames.frameTree.childFrames?.find(x=>x.frame.url.includes('anevum-package-alpha-v003-runtime'));assert.ok(frame,'A real isolated execution frame must exist');const world=await client.send('Page.createIsolatedWorld',{frameId:frame.frame.id,worldName:'v095-synthetic-probe'});const result=await client.send('Runtime.evaluate',{contextId:world.executionContextId,expression:'document.getElementById("send").click();document.getElementById("count").textContent',returnByValue:true});assert.equal(result.result.value,'1');results.push({case:'isolated-runtime-buttons',passed:true});}
  await clickText('Save draft');await confirmDecision();await until(async()=>!await visible(dialog),'Saved draft');
  assert.equal(fixture.control.state().projects[0].retention,'saved');assert.equal(fixture.control.state().projects[0].liveReleaseId,ids.live);results.push({case:'save-exact-private-draft',passed:true});
  fixture.control.set({mode:'upload-error'});await navigate('/studio/packages/new');await until(()=>visible('.av095-upload-grid'),'Upload form');
  const uploadPath=join(output,'synthetic-upload.html');writeFileSync(uploadPath,'<!doctype html><html><body><button>SYNTHETIC UPLOAD</button></body></html>');
  await client.send('DOM.enable');const {root}=await client.send('DOM.getDocument');const {nodeId}=await client.send('DOM.querySelector',{nodeId:root.nodeId,selector:'.av095-drop input'});await client.send('DOM.setFileInputFiles',{nodeId,files:[uploadPath]});
  const beforeLocalProbe=fixture.control.trace().filter(x=>x.path.endsWith('/upload')).length;
  await until(()=>evaluate('document.querySelector(".av095-preflight strong")?.textContent==="Browser build candidate"'),
    'Local HTML compatibility findings');
  assert.equal(await evaluate('document.body.textContent.includes("AEP_HTML_DEPENDENCIES_UNVERIFIED")'),true,
    'Standalone HTML must warn about unverified dependencies');
  assert.equal(fixture.control.trace().filter(x=>x.path.endsWith('/upload')).length,beforeLocalProbe,
    'Choosing a file must not upload project bytes');
  await screenshot('native-local-compatibility-320');
  results.push({case:'local-v005-compatibility-with-no-upload',passed:true});
  await formValue('.av095-form-grid input','NATIVE UPLOAD SYNTHETIC QA');await formValue('.av095-upload-grid textarea','A disposable browser fixture for this integration test.');
  await evaluate('document.querySelector(".av095-upload-grid .av095-confirm input").click()');await clickText('Prepare private playtest');
  await until(()=>evaluate('document.body.textContent.includes("Synthetic upload quota")'),'Upload failure');
  assert.equal(await evaluate('document.querySelector(".av095-form-grid input").value'),'NATIVE UPLOAD SYNTHETIC QA');assert.equal(await evaluate('document.querySelector(".av095-drop input").files.length'),1);
  const attempts=fixture.control.trace().filter(x=>x.path.endsWith('/upload')).length;await delay(600);assert.equal(fixture.control.trace().filter(x=>x.path.endsWith('/upload')).length,attempts);await screenshot('native-upload-error-320');
  fixture.control.set({mode:'ready'});await clickText('Prepare private playtest');await until(()=>evaluate('location.pathname.includes('+JSON.stringify(ids.newProject)+')&&!!document.querySelector("[data-native-player] iframe")'),'Uploaded private playtest');
  results.push({case:'upload-rights-validation-error-preservation-and-private-open',passed:true});
  fixture.control.set({actor:'other',reset:true});await navigate('/studio/packages');await until(()=>evaluate('document.body.textContent.includes("limited to pilot creators")'),'Ordinary member restriction');assert.equal(await visible('[data-native-project]'),false);await screenshot('native-other-account-320');
  fixture.control.set({actor:'guest'});await navigate('/projects/package/'+ids.project+'?preview=1');await until(()=>evaluate('document.body.textContent.includes("Sign in for this private playtest")'),'Guest private refusal');assert.equal(await visible('iframe'),false);
  results.push({case:'separate-member-and-guest-private-isolation',passed:true});
  fixture.control.set({actor:'reviewer',mode:'pending',reset:true});await navigate('/studio/packages/review');await until(()=>visible('[data-native-project]'),'Reviewer queue');await layout('native-review-queue',320);
  await navigate('/projects/package/'+ids.project+'?preview=1');await until(()=>evaluate('[...document.querySelectorAll("button")].some(x=>x.textContent==="Approve and publish")'),'Reviewer preview');
  await clickText('Approve and publish');await until(()=>visible(dialog),'Independent review confirmation');assert.equal(await evaluate('document.querySelector('+JSON.stringify(dialog)+').textContent.includes('+JSON.stringify(ids.draft)+')'),true);await screenshot('native-review-confirmation-320');
  fixture.control.set({mode:'stale'});await confirmDecision();
  await until(()=>evaluate('document.querySelector('+JSON.stringify(dialog)+')?.textContent.includes("release changed")'),'Stale review refusal');assert.equal(fixture.control.state().projects[0].liveReleaseId,ids.live);await screenshot('native-stale-review-320');await clickText('Cancel',dialog+' button');results.push({case:'review-exact-release-and-stale-decision-refusal',passed:true});
  fixture.control.set({actor:'reviewer',mode:'pending',reset:true});await navigate('/projects/package/'+ids.project+'?preview=1');await until(()=>evaluate('[...document.querySelectorAll("button")].some(x=>x.textContent==="Approve and publish")'),'Fresh review');await clickText('Approve and publish');await confirmDecision();await until(()=>evaluate('!location.search&&!!document.querySelector("[data-native-player] iframe")'),'Published native player');
  assert.equal(fixture.control.state().projects[0].liveReleaseId,ids.draft);await until(()=>evaluate('[...document.querySelectorAll("button")].some(x=>x.textContent==="Share project")'),'Public sharing control');results.push({case:'review-to-public-native-player',passed:true});
  fixture.control.set({actor:'guest'});await navigate('/discover');await until(()=>visible('[data-package-id] .av010-work-primary'),'Discover package');
  const link=await evaluate('document.querySelector("[data-package-id] .av010-work-primary").getAttribute("href")');assert.equal(link,'/creator/projects/package/'+ids.project);
  await evaluate('document.querySelector("[data-package-id] .av010-work-primary").click()');await until(()=>visible('[data-native-player] iframe'),'Discover to native player');
  await navigate('/@v091_other');await until(()=>visible('.av010-package-gallery [data-package-id]'),'Member wall');const wallLink=await evaluate('document.querySelector(".av010-package-gallery .av010-work-primary").getAttribute("href")');assert.equal(wallLink,'/creator/projects/package/'+ids.project);await screenshot('native-member-wall-320');results.push({case:'discover-and-member-wall-native-routing',passed:true});
  fixture.control.set({actor:'owner',mode:'expiry',reset:true});await navigate('/projects/package/'+ids.project+'?preview=1');await until(()=>evaluate('!!document.querySelector("[data-native-player] iframe")||document.body.textContent.toLowerCase().includes("private playtest expired")'),'Expiring preview or immediate expiry');await until(()=>evaluate('document.body.textContent.toLowerCase().includes("private playtest expired")'),'Private capability expiry',10000);assert.equal(await visible('[data-native-player] iframe'),false);results.push({case:'expired-private-frame-removed',passed:true});
  for(const mode of ['unavailable','html']){fixture.control.set({actor:'owner',mode});await navigate('/studio/packages');await until(()=>visible('.av095-status'),'Unavailable mode');assert.equal(await visible('[data-native-project]'),false);await screenshot('native-'+mode+'-320');results.push({case:'fail-closed-'+mode,passed:true});}
 }
 assert.equal(exceptions.length,0,'Unhandled browser exceptions: '+JSON.stringify(exceptions));
 writeFileSync(join(output,'acceptance.json'),JSON.stringify({source,status:'PASS',syntheticOnly:true,physicalDeviceAcceptance:false,disabled,cases:results,requests:fixture.control.trace()},null,2));
 console.log('V095_NATIVE_REACT_BROWSER=PASS '+results.length+' cases; synthetic loopback only');
}catch(error){
 try{if(evaluate)writeFileSync(join(output,'failure-dom.html'),await evaluate('document.documentElement.outerHTML'));if(screenshot)await screenshot('failure');}catch{}
 writeFileSync(join(output,'failure.json'),JSON.stringify({error:error.stack,exceptions,cases:results},null,2));throw error;
}finally{
 writeFileSync(log,chromeLog);client?.close();
 if(child.exitCode===null&&child.signalCode===null){
  const exited=once(child,'exit');child.kill();await Promise.race([exited,delay(3000)]);
 }
 await fixture.close();
 // Chromium can still flush its profile during shutdown. Wait for exit and
 // retry filesystem cleanup instead of throwing from an untracked timer.
 rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}

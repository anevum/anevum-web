// ANEVUM package v004 synthetic Chrome screenshots and interaction acceptance.
// Never touches live accounts or provider routes.
import assert from "node:assert/strict";
import {spawn,execFileSync} from "node:child_process";
import {createServer} from "node:net";
import {mkdtemp,mkdir,writeFile,rm} from "node:fs/promises";
import {existsSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve,join} from "node:path";
import {pathToFileURL} from "node:url";
import {setTimeout as sleep} from "node:timers/promises";
import {uploadScreen,playerScreen,helpScreen} from "../site/alpha/v003/ui.mjs";
const chromeBin=()=>{
 for(const file of [process.env.CHROME_BIN,"/usr/bin/google-chrome","/usr/bin/chromium","/usr/bin/chromium-browser"])
   if(file&&existsSync(file))return file;
 for(const name of ["google-chrome","chromium","chromium-browser"])
   try{return execFileSync("which",[name],{encoding:"utf8"}).trim();}catch{}
 throw Error("Chrome is unavailable. No browser pass can be claimed.");
};
async function freePort(){
 return new Promise((ok,no)=>{
  const s=createServer();s.once("error",no);
  s.listen(0,"127.0.0.1",()=>{const p=s.address().port;s.close(()=>ok(p));});
 });
}
async function beginChrome(binary,port,dir){
 const proc=spawn(binary,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
  "--no-first-run","--remote-allow-origins=*","--remote-debugging-port="+port,
  "--user-data-dir="+dir,"about:blank"],{stdio:["ignore","ignore","pipe"]});
 let error="";
 proc.stderr.on("data",data=>{error=(error+data.toString()).slice(-1500);});
 let url;
 for(let i=0;i<80;i++){
  if(proc.exitCode!==null)throw Error("Chrome exited: "+error);
  try{const response=await fetch("http://127.0.0.1:"+port+"/json/list");
   if(response.ok)url=(await response.json()).find(p=>p.type==="page")?.webSocketDebuggerUrl;
  }catch{}
  if(url)break;
  await sleep(200);
 }
 if(!url){proc.kill("SIGKILL");throw Error("No Chrome debugging endpoint: "+error);}
 const ws=new WebSocket(url);
 await new Promise((ok,no)=>{ws.addEventListener("open",ok,{once:true});ws.addEventListener("error",no,{once:true});});
 let seq=0;const waiting=new Map();
 ws.addEventListener("message",event=>{
  const msg=JSON.parse(event.data),wait=waiting.get(msg.id);
  if(!wait)return;waiting.delete(msg.id);
  if(msg.error)wait.no(Error(msg.error.message));else wait.ok(msg.result);
 });
 function call(method,params={}){
  return new Promise((ok,no)=>{
   const id=++seq;
   const deadline=setTimeout(()=>{waiting.delete(id);no(Error("CDP timed out: "+method));},20000);
   waiting.set(id,{ok:value=>{clearTimeout(deadline);ok(value);},no:error=>{clearTimeout(deadline);no(error);}});
   ws.send(JSON.stringify({id,method,params}));
  });
 }
 return {proc,ws,call};
}
async function evalJS(call,expression){
 const value=await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
 if(value.exceptionDetails)throw Error("Browser exception: "+value.exceptionDetails.text);
 return value.result?.value;
}
async function visit(call,path,w,h){
 await call("Emulation.setDeviceMetricsOverride",{width:w,height:h,deviceScaleFactor:1,mobile:w<700,
  screenWidth:w,screenHeight:h});
 await call("Page.navigate",{url:pathToFileURL(path).href});
 for(let i=0;i<50;i++){
  if((await evalJS(call,"document.readyState"))==="complete")break;
  await sleep(100);
 }
 await sleep(200);
}
async function image(call,filename){
 const data=await call("Page.captureScreenshot",{format:"png",captureBeyondViewport:false,fromSurface:true});
 await writeFile(filename,Buffer.from(data.data,"base64"));
}
async function main(){
 const out=resolve("artifacts/package-v004-ui");
 await mkdir(out,{recursive:true});
 const tmp=await mkdtemp(join(tmpdir(),"anevum-package-v004-"));
 const project={id:"11111111-1111-4111-8111-111111111111",title:"Signal Drift",
  summary:"A clearly synthetic playable fixture for visual testing.",category:"game",
  status:"published",draft_release_id:"22222222-2222-4222-8222-222222222222",
  draft_status:"ready",updated_at:1760000000,release_version:2,
  live_release_id:"33333333-3333-4333-8333-333333333333"};
 const release={status:"ready",version:2,proposed_title:"Signal Drift v2",
  proposed_summary:"A new private build of the synthetic game.",proposed_category:"game",
  file_count:5,expanded_bytes:1048576};
 const runtimeFixture='<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1">'+
   '<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 50% 30%,#22425f,#080f20 72%);color:#edfaff;font:16px system-ui;display:grid;place-items:center;text-align:center;padding:20px}h1{font-size:29px;letter-spacing:-.04em;margin:10px 0}p{color:#bad0df}button{background:#bedee7;border:0;padding:16px 24px;border-radius:10px;color:#06121d;font-weight:700}small{color:#a0d6ea}</style>'+
   '<main><small>OFFLINE QA FIXTURE / NOT A PUBLISHED GAME</small><h1>Signal Drift</h1><p>Synthetic browser-player scene to test stage layout.</p><button onclick="this.textContent=\'RUNNING LOCAL FIXTURE\'">Begin test</button></main></html>';
 const runner="data:text/html;charset=utf-8,"+encodeURIComponent(runtimeFixture);
 const pages={
  uploader:await (await uploadScreen([],true,true,"")).text(),
  library:await (await uploadScreen([{...project,cover_release_id:"22222222-2222-4222-8222-222222222222"}],true,true,"")).text(),
  protected:await (await uploadScreen([{...project,draft_mode:"test",draft_expires_at:Math.floor(Date.now()/1000)+86400}],true,true,project.id,true,false,{memberPhysicalBytes:1048576,memberPhysicalLimit:200*1048576})).text(),
  guest:await (await uploadScreen([],false,false,"")).text(),
  player:await (await playerScreen(project,release,runner,true,true,false)).text(),
  review:await (await playerScreen(project,{...release,status:"pending_review"},runner,true,false,true)).text(),
  guide:await (await helpScreen()).text()
 };
 for(const [name,html] of Object.entries(pages))await writeFile(join(tmp,name+".html"),html);
 // CI Chrome can start before its DevTools endpoint is advertised.
 // Retry one fresh profile/port after an infrastructure-only startup failure.
 let browser,launchError;
 for(let attempt=1;attempt<=2;attempt++){
  try{
   browser=await beginChrome(chromeBin(),await freePort(),join(tmp,"chrome-"+attempt));
   break;
  }catch(error){
   launchError=error;
   if(attempt<2)await sleep(1200);
  }
 }
 if(!browser)throw launchError;
 try{
  const c=browser.call;
  await c("Page.enable");await c("Runtime.enable");
  for(const w of [320,390,1440]){
   await visit(c,join(tmp,"uploader.html"),w,w===1440?900:844);
   const dims=await evalJS(c,"({w:innerWidth,scroll:document.documentElement.scrollWidth,drop:document.querySelector('#drop').getBoundingClientRect().height,dropTop:document.querySelector('#drop').getBoundingClientRect().top,header:document.querySelector('header').getBoundingClientRect().height,button:document.querySelector('#upload-button').getBoundingClientRect().height,crest:!!document.querySelector('.av-crest'),orbit:!!document.querySelector('.av-orbit')})");
   assert.equal(dims.w,w,"Correct browser viewport");
   assert.ok(dims.scroll<=w,"No horizontal overflow at "+w+": "+dims.scroll);
   assert.ok(dims.drop>=120,"Touch file selection target");
   assert.ok(dims.button>=44,"CTA touch target");
   assert.ok(dims.crest&&dims.orbit,"Original Continuance vector identity must render");
   if(w<700){
    assert.ok(dims.header<=85,"Mobile header must fit in one short row; measured "+dims.header);
    assert.ok(dims.dropTop<770,"Upload selector should be visible in the first mobile screen");
   }
   await image(c,join(out,"upload-"+w+".png"));
  }
  for(const w of [320,390,1440]){
   await visit(c,join(tmp,"protected.html"),w,w===1440?900:844);
   const protectedUI=await evalJS(c,"({overflow:document.documentElement.scrollWidth>innerWidth,storage:!!document.querySelector('[aria-label=\"Private build storage\"]'),replacement:document.querySelector('#replace-private-build')?.value,save:[...document.querySelectorAll('button')].some(b=>b.textContent==='Save draft'),replace:[...document.querySelectorAll('a')].some(a=>a.textContent==='Replace private build')})");
   assert.equal(protectedUI.overflow,false,'Protected uploader overflow at '+w);
   assert.equal(protectedUI.storage,true);assert.equal(protectedUI.replacement,'1');assert.equal(protectedUI.save,true);assert.equal(protectedUI.replace,true);
   await image(c,join(out,'protected-upload-'+w+'.png'));
  }
  await visit(c,join(tmp,"uploader.html"),390,844);
  const selection=await evalJS(c,"(()=>{const input=document.querySelector('#bundle');const data=new DataTransfer();data.items.add(new File(['<!doctype html><html><body>Ready</body></html>'],'example.html',{type:'text/html'}));input.files=data.files;input.dispatchEvent(new Event('change',{bubbles:true}));return {name:document.querySelector('#file-label').textContent,status:document.querySelector('#activity').textContent};})()");
  assert.match(selection.name,/example\.html/);assert.match(selection.status,/File selected/);
  await image(c,join(out,"selected-390.png"));
  const picked=await evalJS(c,`(async()=>{
    const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;
    const ctx=canvas.getContext('2d'),fill=ctx.createLinearGradient(0,0,960,540);
    fill.addColorStop(0,'#142b4c');fill.addColorStop(.5,'#34808c');fill.addColorStop(1,'#0a182c');
    ctx.fillStyle=fill;ctx.fillRect(0,0,960,540);
    ctx.strokeStyle='rgba(220,250,255,.5)';ctx.lineWidth=2;
    for(let n=1;n<8;n++){ctx.beginPath();ctx.arc(480,270,n*45,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle='#e5fdff';ctx.font='36px Georgia';ctx.textAlign='center';ctx.fillText('SYNTHETIC QA ART',480,280);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    const input=document.querySelector('#cover'),files=new DataTransfer();
    files.items.add(new File([blob],'qa-cover.png',{type:'image/png'}));input.files=files.files;
    input.dispatchEvent(new Event('change',{bubbles:true}));
    return {size:blob.size,type:blob.type};
  })()`);
  assert.equal(picked.type,"image/png");
  let coverReady=false;
  for(let i=0;i<35;i++){
    coverReady=await evalJS(c,"!!document.querySelector('#cover-preview')?.getAttribute('src')&&document.querySelector('#cover-preview').hidden===false");
    if(coverReady)break;
    await sleep(100);
  }
  assert.ok(coverReady,"Selected local cover PNG should load and preview");
  await evalJS(c,"document.querySelector('#cover-preview-wrap').scrollIntoView({block:'center',behavior:'instant'})");
  await sleep(130);
  await image(c,join(out,"cover-selected-390.png"));
  await visit(c,join(tmp,"library.html"),390,844);
  const art=await evalJS(c,`(async()=>{
    const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#102342';ctx.fillRect(0,0,960,540);
    const fade=ctx.createRadialGradient(480,240,10,480,240,550);
    fade.addColorStop(0,'#6cbecc');fade.addColorStop(.5,'#315e8c');fade.addColorStop(1,'#09182c');
    ctx.fillStyle=fade;ctx.fillRect(0,0,960,540);
    ctx.lineWidth=2;ctx.strokeStyle='#c5f5ee';ctx.beginPath();ctx.arc(480,270,150,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#ebffff';ctx.textAlign='center';ctx.font='36px Georgia';ctx.fillText('QA ONLY / TEST COVER',480,290);
    const img=document.querySelector('.av-project-cover');img.src=canvas.toDataURL('image/png');
    img.scrollIntoView({block:'center',behavior:'instant'});
    await img.decode();
    return {loaded:img.naturalWidth,classes:img.closest('.av-project-plate').className};
  })()`);
  assert.equal(art.loaded,960);
  assert.match(art.classes,/av-has-cover/);
  const buttons=await evalJS(c,"Array.from(document.querySelectorAll('.project .actions>*')).map(el=>({x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y,w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height}))");
  assert.equal(buttons.length,4,"Creator with live and draft versions exposes four real actions");
  assert.ok(buttons[0].w>=120&&buttons[1].w>=120,"Creator actions should be readable at 390px");
  assert.ok(buttons[2].y>buttons[0].y+30,"Four actions should form two mobile rows");
  assert.ok(buttons.every(x=>x.h>=44),"All creator actions must meet touch target height");
  await image(c,join(out,"library-with-cover-390.png"));
  await visit(c,join(tmp,"guest.html"),390,844);
  assert.equal(await evalJS(c,"document.querySelector('#publish-form')===null"),true);
  await image(c,join(out,"guest-390.png"));
  await visit(c,join(tmp,"guide.html"),390,844);
  assert.ok((await evalJS(c,"document.documentElement.scrollWidth"))<=390,"Guide responsive width");
  await image(c,join(out,"guide-390.png"));
  await visit(c,join(tmp,"player.html"),390,844);
  assert.equal(await evalJS(c,"document.querySelector('#game-frame').getAttribute('sandbox')"),"allow-scripts allow-pointer-lock");
  await image(c,join(out,"private-player-390.png"));
  await visit(c,join(tmp,"review.html"),390,844);
  const modal=await evalJS(c,"(()=>{document.querySelector('[data-package-action=\"publish\"]').click();return {open:document.querySelector('#review-dialog').open,checked:document.querySelector('#decision-confirm').checked};})()");
  assert.equal(modal.open,true);assert.equal(modal.checked,false);
  await image(c,join(out,"review-390.png"));
  const result={pass:true,viewports:[320,390,1440],images:10,coverPreview:true,coverCard:true,
   scope:"synthetic headless Chromium UI/interaction acceptance only; real authenticated Safari and rollout still required"};
  await writeFile(join(out,"result.json"),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
 }finally{
  browser.ws.close();browser.proc.kill("SIGKILL");await sleep(100);
  await rm(tmp,{recursive:true,force:true}).catch(()=>{});
 }
}
main().catch(error=>{console.error(error);process.exitCode=1;});

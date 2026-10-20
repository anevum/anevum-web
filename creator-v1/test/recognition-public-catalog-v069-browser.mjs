// V069 public issuer/catalog browser verification. Uses synthetic loopback unless explicitly switched to
// read-only https://anevum.com after an independent production deployment.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
const live=process.env.ANEVUM_REGISTRY_LIVE_QA==='1';
const out=path.resolve(live?'qa-v069-live-catalog':'qa-v069-public-catalog');
await fs.mkdir(out,{recursive:true});
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'av67-'));
const chrome=spawn(process.env.CHROME_PATH||'/usr/bin/google-chrome',[
 '--headless=new','--no-sandbox','--disable-dev-shm-usage',
 '--remote-debugging-port=9287','--user-data-dir='+profile,'about:blank'
],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let ws,seq=0;const pending=new Map(),errors=[],captures=[],collectionChecks=[];
try{
 let pages=[];
 for(let i=0;i<120;i++){
  try{pages=await(await fetch('http://127.0.0.1:9287/json')).json();if(pages.some(x=>x.type==='page'))break;}catch{}
  await sleep(200);
 }
 const page=pages.find(x=>x.type==='page');if(!page)throw Error('Chrome debugging unavailable');
 ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 ws.addEventListener('message',evt=>{
  const msg=JSON.parse(evt.data);
  if(msg.id){const job=pending.get(msg.id);if(job){pending.delete(msg.id);msg.error?job.reject(Error(msg.error.message)):job.resolve(msg.result);}}
  else if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params?.exceptionDetails?.text||'exception');
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{
  const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.text||'JS exception');
  return r.result.value;
 };
 await send('Page.enable');await send('Runtime.enable');
 for(const [width,height] of [[1440,900],[1024,768],[390,844],[320,740]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=640});
  await send('Page.navigate',{url:live?'https://anevum.com/recognition':'http://127.0.0.1:4178/creator/recognition'});
  let ready=false;
  for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('.av66-registry-mark') && !!document.querySelector('.av66-catalog-shell')")){ready=true;break;}await sleep(200);}
  if(!ready){
   const probe=await evaluate("(()=>({href:location.href,ready:document.readyState,title:document.title,body:document.body?.innerText?.slice(0,1200),registry:document.querySelectorAll('.av66-registry').length,orbit:document.querySelectorAll('.av66-registry-mark').length,archive:document.querySelectorAll('.av66-catalog-shell').length,root:document.querySelector('#root')?.innerHTML.slice(0,400),scripts:[...document.scripts].map(x=>x.src).slice(0,4)}))()");
   console.log('LIVE_REGISTRY_RENDER_DIAGNOSTIC',JSON.stringify(probe));
   const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   await fs.writeFile(path.join(out,'missing-'+width+'.png'),Buffer.from(shot.data,'base64'));
   await fs.writeFile(path.join(out,'failure.json'),JSON.stringify({width,probe,errors},null,2));
   throw Error('Recognition route did not render: '+width);
  }
  let statusReady=false;
  for(let n=0;n<40;n++){
   const status=await evaluate("(()=>[...document.querySelectorAll('.av66-catalog-item')].find(x=>x.querySelector('h3')?.textContent==='First Orbit')?.querySelector('.av66-state')?.textContent||'')()");
   if(status==='AVAILABLE'){statusReady=true;break;}
   await sleep(100);
  }
  if(!statusReady)throw Error('Public issuer catalog did not resolve in guest browser: '+width);
  await sleep(250);
  const details=await evaluate("(()=>{const info=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect(),c=getComputedStyle(e);return {selector:s,tag:e.tagName,x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height),cssWidth:c.width,cssHeight:c.height,display:c.display,flex:c.flex,overflow:c.overflow,maxWidth:c.maxWidth,position:c.position}};const rules=[];const walk=a=>{for(const r of a){if(r.selectorText?.includes('.av66-registry-mark'))rules.push(r.cssText.slice(0,380));if(r.cssRules)walk(r.cssRules)}};for(const sh of document.styleSheets)try{walk(sh.cssRules)}catch{}return {viewport:[innerWidth,innerHeight],documentWidth:document.documentElement.scrollWidth,mark:info('.av66-registry-mark'),eyebrow:info('.av66-registry-eyebrow'),header:info('.av66-registry-header'),heading:info('.av66-registry-header h1'),metrics:info('.av66-registry-metrics'),archive:info('.av66-catalog-shell'),badgeStates:[...document.querySelectorAll('.av66-catalog-item')].map(x=>({name:x.querySelector('h3')?.textContent,status:x.querySelector('.av66-state')?.textContent,earned:x.classList.contains('is-earned')})),tabs:[...document.querySelectorAll('.av66-catalog-tabs button')].map(x=>({label:x.getAttribute('aria-label'),y:Math.round(x.getBoundingClientRect().y),width:Math.round(x.getBoundingClientRect().width),height:Math.round(x.getBoundingClientRect().height),text:x.innerText})),metricRows:[...document.querySelectorAll('.av66-registry-metrics>div')].map(x=>Math.round(x.getBoundingClientRect().y)),ctaRows:[...document.querySelectorAll('.av66-registry-nav>a')].map(x=>({y:Math.round(x.getBoundingClientRect().y),height:Math.round(x.getBoundingClientRect().height)})),rules:rules.slice(0,8),stylesheets:document.styleSheets.length}})()");
  captures.push(details);
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await fs.writeFile(path.join(out,'registry-'+width+'.png'),Buffer.from(shot.data,'base64'));
  if(width===390){
   for(const label of ['Service ribbons','Prestige medals']){
    await evaluate("document.querySelector('.av66-catalog-tabs button[aria-label="+JSON.stringify(label)+"]')?.click()");
    await sleep(200);
    const panel=await evaluate("(()=>({items:[...document.querySelectorAll('.av66-catalog-item')].map(x=>({status:x.querySelector('.av66-state')?.textContent,earned:x.classList.contains('is-earned')})),selected:document.querySelector('.av66-catalog-tabs button[aria-current=page]')?.getAttribute('aria-label')}))()");
    collectionChecks.push({label,...panel});
   }
  }
 }
 const report={source:live?'anevum.com read-only production':'127.0.0.1 synthetic offline preview; not real members',captures,collectionChecks,errors};
 await fs.writeFile(path.join(out,'geometry.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
 const invalid=captures.filter(x=>{
  const width=x.viewport[0],mobile=width<=640;
  if(!x.mark||!x.archive||x.documentWidth>width+2||x.mark.width!==29||x.mark.height!==29)return true;
  if(!mobile)return x.archive.y>(width>=1400?695:650);
  const maxTop=width>=390?585:660;
  return x.archive.y>maxTop||x.tabs.length!==3||new Set(x.tabs.map(t=>t.y)).size!==1||
   x.tabs.some(t=>t.height<40)||new Set(x.metricRows).size!==1||
   x.ctaRows.length!==2||new Set(x.ctaRows.map(x=>x.y)).size!==1;
 });
 const expected=new Set(['First Signal','World Shaper','First Orbit','First Transmission','First Response','Open Channel']);
 const badCatalog=captures.filter(x=>{
  if(x.badgeStates.length!==26)return true;
  const active=x.badgeStates.filter(b=>b.status==='AVAILABLE');
  return active.length!==6||active.some(b=>!expected.has(b.name))||
   x.badgeStates.some(b=>b.earned||b.status!==(expected.has(b.name)?'AVAILABLE':'PLANNED'));
 });
 const badPanels=collectionChecks.length!==2||collectionChecks.some(p=>
  p.selected!==p.label||p.items.length!==6||p.items.some(x=>x.status!=='PLANNED'||x.earned));
 if(invalid.length||errors.length||badCatalog.length||badPanels){
  console.error('V069_PUBLIC_CATALOG_BROWSER_REGRESSION',JSON.stringify({invalid,errors,badCatalog,badPanels,collectionChecks}));
  process.exitCode=1;
 }
}finally{
 try{ws?.close();}catch{}
 chrome.kill('SIGTERM');
 try{await Promise.race([new Promise(r=>chrome.once('exit',r)),sleep(1500)]);}catch{}
 await fs.rm(profile,{recursive:true,force:true,maxRetries:8,retryDelay:250}).catch(()=>{});
}

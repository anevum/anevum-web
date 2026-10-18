// V071: loopback-only visual QA for the reviewed creations atlas and player cards.
// Fixtures are explicitly synthetic; no live registration, D1 or user records.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
const out=path.resolve('qa-v071-offline-creation-atlas');
await fs.mkdir(out,{recursive:true});
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'av71-atlas-'));
const chrome=spawn(process.env.CHROME_PATH||'/usr/bin/google-chrome',[
 '--headless=new','--no-sandbox','--disable-dev-shm-usage',
 '--remote-debugging-port=9289','--user-data-dir='+profile,'about:blank'
],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let ws,seq=0;const pending=new Map(),errors=[],records=[];
try{
 let pages=[];
 for(let i=0;i<120;i++){
  try{pages=await(await fetch('http://127.0.0.1:9289/json')).json();if(pages.some(x=>x.type==='page'))break;}catch{}
  await sleep(200);
 }
 const page=pages.find(x=>x.type==='page');
 assert.ok(page,'Chromium page available');
 ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
 ws.addEventListener('message',event=>{
  const msg=JSON.parse(event.data);
  if(msg.id){const task=pending.get(msg.id);if(task){pending.delete(msg.id);msg.error?task.reject(Error(msg.error.message)):task.resolve(msg.result)}}
  else if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params?.exceptionDetails?.text||'uncaught exception');
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))
 });
 const evaluate=async expression=>{
  const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.text||'runtime exception');
  return result.result.value;
 };
 await send('Page.enable');await send('Runtime.enable');
 async function goto(url,selector){
  await send('Page.navigate',{url});
  for(let i=0;i<100;i++){
   if(await evaluate("!!document.querySelector("+JSON.stringify(selector)+")"))return;
   await sleep(120);
  }
  const probe=await evaluate("(()=>({url:location.href,body:document.body?.innerText?.slice(0,650)}))()");
  throw Error('Required rendered atlas element missing: '+JSON.stringify({selector,probe}));
 }
 async function shot(name){
  const result=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await fs.writeFile(path.join(out,name+'.png'),Buffer.from(result.data,'base64'));
 }
 for(const [width,height] of [[1440,900],[1024,768],[390,844],[320,740]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=640});
  await goto('http://127.0.0.1:4178/creator/creations','.av71-card');
  await sleep(400);
  const info=await evaluate("(()=>({viewport:[innerWidth,innerHeight],pageWidth:document.documentElement.scrollWidth,title:document.querySelector('.av71-archive-hero h1')?.textContent,cardCount:document.querySelectorAll('.av71-card').length,cards:[...document.querySelectorAll('.av71-card')].map(c=>({title:c.querySelector('h2')?.textContent,player:c.querySelector('[data-player-card=v065]')?.getAttribute('aria-label'),badges:c.querySelectorAll('.av65-badge').length,level:!!c.querySelector('.av61-specimen'),href:c.querySelector('.av71-card-art')?.getAttribute('href')})),cardsWidth:[...document.querySelectorAll('.av71-card')].map(x=>Math.round(x.getBoundingClientRect().width))}))()");
  assert.equal(info.cardCount,2,'Two separate synthetic authored works');
  assert.ok(info.pageWidth<=width+2,'No horizontal overflow: '+width);
  assert.equal(info.cards[0].badges,1,'Only earned first_creation displayed on first player card');
  assert.equal(info.cards[1].badges,0,'Second player has no fabricated badges');
  assert.equal(info.cards[0].level,true,'First creator has verified level 7 specimen');
  assert.equal(info.cards[1].level,false,'No fabricated second creator level');
  assert.match(info.cards[0].player,/Evolution level 7/);
  assert.equal(info.cards[0].href,'/creations/00000000-0000-4000-8000-000000008001');
  await shot('creations-'+width);
  records.push(info);
 }
 await goto('http://127.0.0.1:4178/creator/creations/00000000-0000-4000-8000-000000008001','.av71-detail');
 await sleep(350);
 const detail=await evaluate("(()=>({title:document.querySelector('.av71-detail-header h1')?.textContent,publicCreator:document.querySelector('.av71-detail-aside [data-player-card=v065]')?.getAttribute('aria-label'),links:[...document.querySelectorAll('.av71-detail-actions a')].map(x=>({href:x.getAttribute('href'),target:x.target,rel:x.rel})),media:[...document.querySelectorAll('.av71-detail img')].map(x=>x.src),leakedUpload:document.body.innerText.includes('storage_key')}))()");
 assert.equal(detail.title,'SYNTHETIC ORBITAL GARDEN');
 assert.match(detail.publicCreator,/First Creation/i);
 assert.equal(detail.links.length,1);
 assert.equal(detail.links[0].target,'_blank');
 assert.match(detail.links[0].rel,/noopener/);
 assert.equal(detail.leakedUpload,false);
 await shot('creation-detail-320');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 const reduced=await evaluate("(()=>({orbit:getComputedStyle(document.querySelector('.av71-art-orb')).animationName}))()");
 assert.equal(reduced.orbit,'none');
 const post=await fetch('http://127.0.0.1:4178/api/v1/creations',{method:'POST'});
 assert.equal(post.status,405);
 assert.deepEqual(errors,[],'No uncaught browser exceptions');
 const report={source:'synthetic-only loopback fixture',records,detail,reduced,errors};
 await fs.writeFile(path.join(out,'result.json'),JSON.stringify(report,null,2));
 console.log('V071_OFFLINE_GUEST_CREATOR_ATLAS_PASS',JSON.stringify({viewportWidths:records.map(x=>x.viewport[0]),detail:detail.title,errors:errors.length}));
}finally{
 try{ws?.close()}catch{}
 chrome.kill('SIGTERM');
 try{await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),sleep(1500)])}catch{}
 await fs.rm(profile,{recursive:true,force:true,maxRetries:8,retryDelay:250}).catch(()=>{});
}

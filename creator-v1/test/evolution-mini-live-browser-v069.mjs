// Read-only V069 production WebGL QA: validate FINAL desktop and mobile native state,
// not the earlier loading probe, which can time out while textures decode.
// Uses only public routes and Chrome DevTools. No credentials, mutations or XP writes.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
const out=path.resolve('qa-v069-native-live');
await fs.mkdir(out,{recursive:true});
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'anevum-v069-live-'));
const chrome=spawn(process.env.CHROME_PATH||'/usr/bin/google-chrome',[
 '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu-sandbox',
 '--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
 '--remote-debugging-port=9242','--user-data-dir='+profile,'about:blank'
],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let ws,seq=0;const requests=[],exceptions=[],pending=new Map();
try{
 let tabs;
 for(let n=0;n<110;n++){
  try{tabs=await(await fetch('http://127.0.0.1:9242/json')).json();if(tabs.some(x=>x.type==='page'))break;}catch{}
  await sleep(200);
 }
 const page=tabs?.find(x=>x.type==='page');if(!page)throw Error('Chrome debugging unavailable');
 ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
 ws.addEventListener('message',event=>{
  const msg=JSON.parse(event.data);
  if(msg.id){const job=pending.get(msg.id);if(job){pending.delete(msg.id);msg.error?job.reject(Error(msg.error.message)):job.resolve(msg.result);}}
  else if(msg.method==='Runtime.exceptionThrown')exceptions.push(msg.params?.exceptionDetails?.exception?.description||msg.params?.exceptionDetails?.text);
  else if(msg.method==='Network.responseReceived'){
   const url=msg.params?.response?.url||'';
   if(/mini-runtime|level-02-scene|level-02-compact|height\.png|albedo\.webp/.test(url))requests.push({path:url.split('anevum.com')[1]?.slice(0,160),status:msg.params.response.status,mime:msg.params.response.mimeType});
  }
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evalJS=async expression=>{
  const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
  return result.result.value;
 };
 const awaitCondition=async(expression,timeout=35000)=>{const start=Date.now();while(Date.now()-start<timeout){if(await evalJS(expression))return true;await sleep(350)}return false;};
 const screenshot=async file=>{const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(out,file),Buffer.from(shot.data,'base64'));};
 const details=()=>evalJS("(()=>{const p=document.querySelector('.mc-update .av62-native-host');const canvas=document.querySelector('canvas.av62-native-stage');const r=p?.getBoundingClientRect();const x=r?r.x+r.width/2:0,y=r?r.y+r.height/2:0;const top=document.elementFromPoint(x,y);const img=p?.querySelector('img');const gl=canvas?.getContext('webgl');return {nativeHost:!!p,live:p?.dataset.live||null,level:p?.dataset.level||null,canvasCount:document.querySelectorAll('canvas.av62-native-stage').length,canvasHidden:canvas?.hidden??null,canvasWidth:canvas?.width||0,glAvailable:!!gl,posterLoaded:!!img?.naturalWidth,posterVisibility:img?getComputedStyle(img).visibility:null,rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null,hit:top?.className||top?.tagName||null,hitInside:!!p?.contains(top),viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches}})()");
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'https://anevum.com/community?evolution-native-qa=v062'});
 const found=await awaitCondition("document.querySelector('.mc-update .av62-native-host')!==null");
 if(!found)throw Error('Production member badge host missing');
 await evalJS("document.querySelector('.mc-update')?.scrollIntoView({block:'center',behavior:'instant'})");
 const live=await awaitCondition("document.querySelector('.mc-update .av62-native-host')?.dataset.live==='true'",20000);
 const desktop=await details();
 await screenshot('desktop-1440.png');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await evalJS("document.querySelector('.mc-update')?.scrollIntoView({block:'center',behavior:'instant'})");
 const mobileLive=await awaitCondition("document.querySelector('.mc-update .av62-native-host')?.dataset.live==='true'",12000);
 const mobile=await details();
 await screenshot('mobile-390.png');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await sleep(750);
 const reduced=await details();
 await screenshot('mobile-reduced.png');
 const pass=desktop.live==='true'&&mobile.live==='true'&&mobileLive&&desktop.glAvailable&&mobile.glAvailable&&desktop.canvasCount===1&&mobile.canvasCount===1&&desktop.posterLoaded&&mobile.posterLoaded&&mobile.documentWidth<=394&&reduced.reduced&&exceptions.length===0;
 const evidence={pass,initialDesktopLiveBeforeCapture:live,liveAtFinalDesktopCapture:desktop.live,mobileLive,desktop,mobile,reduced,requests,exceptions};
 await fs.writeFile(path.join(out,'observations.json'),JSON.stringify(evidence,null,2));
 console.log(JSON.stringify(evidence));
 if(!pass)process.exitCode=1;
}finally{
 try{ws?.close();}catch{}
 chrome.kill('SIGTERM');
 try{await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),sleep(1500)])}catch{}
 await fs.rm(profile,{recursive:true,force:true,maxRetries:9,retryDelay:250}).catch(()=>{});
}
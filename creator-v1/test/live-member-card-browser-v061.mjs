// Read-only Chrome live QA for the V061 miniature Evolution artwork.
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
const out=path.resolve('qa-v061-member-card');
await fs.mkdir(out,{recursive:true});
const profile=await fs.mkdtemp('/tmp/anevum-visual-');
const chrome=spawn(process.env.CHROME_PATH||'/usr/bin/google-chrome',[
 '--headless=new','--no-sandbox','--disable-dev-shm-usage',
 '--remote-debugging-port=9239','--user-data-dir='+profile,'about:blank'
],{stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let ws,seq=0;const pending=new Map(),network=[];
try{
 let pages;
 for(let i=0;i<120;i++){try{pages=await (await fetch('http://127.0.0.1:9239/json')).json();if(pages?.some(x=>x.type==='page'))break;}catch{}await wait(200);}
 if(!pages?.length)throw Error('Chrome DevTools unavailable');
 ws=new WebSocket(pages.find(x=>x.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
 ws.addEventListener('message',event=>{
  const msg=JSON.parse(event.data);
  if(msg.id){const p=pending.get(msg.id);if(p){pending.delete(msg.id);msg.error?p.reject(Error(msg.error.message)):p.resolve(msg.result);}}
  else if(msg.method==='Network.responseReceived'){
   const url=msg.params?.response?.url||'';
   if(url.includes('/level-02-compact-128.png'))network.push({status:msg.params.response.status,mime:msg.params.response.mimeType});
  }
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{
  const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
  return r.result.value;
 };
 const until=async(expression,timeout=30000)=>{const start=Date.now();while(Date.now()-start<timeout){if(await evaluate(expression))return;await wait(250)}throw Error('Timeout '+expression);};
 const viewport=async(w,h)=>{await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:w<700});await wait(550);};
 const snap=async name=>{const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(out,name),Buffer.from(r.data,'base64'));};
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 await viewport(1440,900);
 await send('Page.navigate',{url:'https://anevum.com/community'});
 await until("document.querySelector('.mc-update .av61-identity') !== null");
 await wait(1500);
 const desktop=await evaluate("(() => {const row=document.querySelector('.mc-update');const icon=row?.querySelector('.av61-specimen img');return {identity:!!row?.querySelector('.av61-identity'),iconPresent:!!icon,iconSrc:icon?.src||null,naturalWidth:icon?.naturalWidth||0,complete:icon?.complete||false,fallback:!!row?.querySelector('.level-emblem-beyond'),levelLabel:row?.querySelector('.av61-level-label')?.textContent||''};})()");
 const decode=await evaluate("new Promise(resolve=>{const img=new Image();img.onload=()=>resolve({ok:true,width:img.naturalWidth});img.onerror=()=>resolve({ok:false});img.src='/evolution/assets/level-02-compact-128.png?qa=1';setTimeout(()=>resolve({ok:false,timeout:true}),9000)})");
 await evaluate("document.querySelector('.mc-update')?.scrollIntoView({block:'center'})");
 await snap('desktop-1440.png');
 await viewport(390,844);
 const mobile=await evaluate("(() => {const row=document.querySelector('.mc-update');return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,cardWidth:row?.getBoundingClientRect().width,iconFound:!!row?.querySelector('.av61-specimen img'),fallback:!!row?.querySelector('.level-emblem-beyond')};})()");
 await snap('mobile-390.png');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 const reduced=await evaluate("(() => {const img=document.querySelector('.mc-update .av61-specimen img');return img?getComputedStyle(img).animationDuration:'missing';})()");
 const pass=desktop.identity&&desktop.iconPresent&&desktop.naturalWidth>0&&!desktop.fallback&&desktop.levelLabel.includes('LVL 02')&&decode.ok&&mobile.iconFound&&!mobile.fallback&&mobile.scrollWidth<=394&&reduced==='0s';
 await fs.writeFile(path.join(out,'observations.json'),JSON.stringify({pass,desktop,decode,mobile,reduced,network},null,2));
 console.log(JSON.stringify({result:pass?'PASS':'FAIL',decoded:decode.ok,imageLoaded:desktop.naturalWidth>0,network,mobileOverflow:mobile.scrollWidth>394,reduced}));
 if(!pass)process.exitCode=1;
}finally{
 try{ws?.close()}catch{}
 chrome.kill('SIGTERM');
 await fs.rm(profile,{recursive:true,force:true});
}

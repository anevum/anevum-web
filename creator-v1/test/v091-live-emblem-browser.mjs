/** V091 read-only public earned-art browser acceptance (no logins or mutations).
 * Chromium inspects actual anonymous public media requests, not private rewards.
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const origin='https://anevum.com';
const url=origin+'/@devonakins';
const chrome=process.env.CHROME_BIN||'/usr/bin/google-chrome';
const output=process.env.V091_VISUAL_DIR||join(tmpdir(),'anevum-v091-public-emblem-evidence');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,maxMs=20000){
  const last=Date.now()+maxMs;
  let latest=null;
  while(Date.now()<last){
    try{const value=await fn();if(value)return value;}catch(error){latest=error;}
    await delay(160);
  }
  throw Error('V091_BROWSER_TIMEOUT'+(latest?' '+String(latest).slice(0,150):''));
}
function connect(ws,monitor){
  return new Promise((resolve,reject)=>{
    const socket=new WebSocket(ws),pending=new Map();let counter=0;
    socket.addEventListener('open',()=>resolve({
      send(method,params={}){
        return new Promise((res,rej)=>{
          const id=++counter;pending.set(id,{res,rej});
          socket.send(JSON.stringify({id,method,params}));
        });
      },
      close(){socket.close();}
    }),{once:true});
    socket.addEventListener('message',({data})=>{
      const value=JSON.parse(String(data));
      if(typeof value.id==='number'){
        const job=pending.get(value.id);
        if(!job)return;
        pending.delete(value.id);
        value.error?job.rej(Error(value.error.message)):job.res(value.result||{});
      }else monitor(value);
    });
    socket.addEventListener('error',()=>reject(Error('V091_CHROME_WS_ERROR')),{once:true});
    socket.addEventListener('close',()=>{for(const job of pending.values())job.rej(Error('V091_CHROME_WS_CLOSED'));pending.clear();});
  });
}
const profile=mkdtempSync(join(tmpdir(),'anevum-v091-browser-'));
mkdirSync(output,{recursive:true});
const child=spawn(chrome,[
  '--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
  '--disable-background-networking','--no-first-run','--remote-allow-origins=*',
  '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'
],{stdio:'ignore'});
let browser=null;
const requests=new Map(),media=[];
try{
  const port=await until(()=>{
    const p=join(profile,'DevToolsActivePort');
    if(!existsSync(p))return null;
    const candidate=readFileSync(p,'utf8').split('\n')[0];
    return /^\d+$/.test(candidate)?candidate:null;
  });
  const ws=await until(async()=>{
    const response=await fetch('http://127.0.0.1:'+port+'/json/list');
    if(!response.ok)return null;
    return (await response.json()).find(x=>x.type==='page'&&x.webSocketDebuggerUrl)?.webSocketDebuggerUrl||null;
  });
  browser=await connect(ws,event=>{
    const params=event.params||{};
    if(event.method==='Network.requestWillBeSent'&&params.request?.url?.includes('/rewards/levels/'))
      requests.set(params.requestId,new URL(params.request.url).pathname);
    if(event.method==='Network.responseReceived'&&params.response?.url?.includes('/rewards/levels/'))
      media.push({event:'response',path:new URL(params.response.url).pathname,
        status:params.response.status,mime:params.response.mimeType,
        fromDiskCache:params.response.fromDiskCache===true});
    if(event.method==='Network.loadingFailed'&&requests.has(params.requestId))
      media.push({event:'failed',path:requests.get(params.requestId),
        error:params.errorText,blocked:params.blockedReason||null});
  });
  await browser.send('Page.enable');
  await browser.send('Network.enable');
  await browser.send('Runtime.enable');
  await browser.send('Emulation.setDeviceMetricsOverride',
    {width:390,height:844,deviceScaleFactor:2,mobile:true});
  const navigation=await browser.send('Page.navigate',{url});
  if(navigation.errorText)throw Error('V091_NAVIGATION_'+navigation.errorText);
  const evaluate=async expression=>{
    const o=await browser.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(o.exceptionDetails)throw Error(o.exceptionDetails.exception?.description||'EVALUATION_ERROR');
    return o.result?.value;
  };
  await until(()=>evaluate("document.readyState==='complete'&&!!document.querySelector('.ms-public')"));
  await until(()=>evaluate("!!document.querySelector('.level-emblem, .av76-artwork-unavailable')"));
  await delay(3500);
  const results=await evaluate(`(()=>{
    const levels=[...document.querySelectorAll('.level-emblem')];
    return {
      path:location.pathname,
      width:innerWidth,
      images:levels.flatMap(level=>[...level.querySelectorAll('img')].map(img=>({
        path:img.currentSrc?new URL(img.currentSrc).pathname:null,
        complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight
      }))),
      fallback:document.querySelectorAll('.av76-artwork-unavailable').length,
      renderedLevels:levels.length,
      overflow:document.documentElement.scrollWidth>innerWidth+1
    };
  })()`);
  console.log('V091_LIVE_EMBLEM_BROWSER='+JSON.stringify({results,media}));
  const shot=await browser.send('Page.captureScreenshot',{format:'png',fromSurface:true});
  if(shot.data)writeFileSync(join(output,'public-earned-level-phone.png'),Buffer.from(shot.data,'base64'));
  assert.equal(results.path,'/@devonakins');
  assert.equal(results.overflow,false,'Actual mobile public member layout overflows');
  assert.ok(results.renderedLevels>0,'No public earned level was rendered');
  assert.equal(results.fallback,0,'Protected public art still falls back in an actual browser');
  assert.ok(results.images.some(image=>image.complete&&image.naturalWidth>0),
    'Approved public SVG could not render in the browser');
  console.log('V091_LIVE_PUBLIC_LEVEL_BROWSER=PASS');
}finally{
  try{browser?.close()}catch{}
  const exited=child.exitCode!==null||child.signalCode!==null;
  if(!exited){
    child.kill('SIGTERM');
    await Promise.race([new Promise(resolve=>child.once('exit',resolve)),delay(4000)]);
  }
  // Chrome writes profile metadata briefly after CDP disconnects. Cleanup
  // must not turn a verified real-browser pass into a false test failure.
  try{rmSync(profile,{recursive:true,force:true,maxRetries:8,retryDelay:180});}
  catch(error){console.warn('V091_BROWSER_TEMP_CLEANUP_INCOMPLETE',error?.code||'unknown');}
}

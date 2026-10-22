/** Real compiled companion, including silent GPU failures. Loopback only. */
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const [chrome,base,output]=process.argv.slice(2);
assert.ok(chrome&&/^http:\/\/127\.0\.0\.1:\d+$/.test(base||'')&&output);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<180;i++){if(await fn())return;await delay(100);}throw Error(label);}
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'iren-v104-'));
const child=spawn(chrome,['--headless=new','--no-sandbox','--no-first-run','--disable-dev-shm-usage','--disable-background-networking','--use-angle=swiftshader','--enable-unsafe-swiftshader','--remote-debugging-port=0','--remote-allow-origins=*','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
let log='',socket,send,evaluate;
child.stderr.on('data',v=>{log+=v});
const cases=[],exceptions=[];
try{
 await until(async()=>{try{return (await fetch(base+'/__ready')).ok}catch{return false}},'Fixture unavailable');
 const file=join(profile,'DevToolsActivePort');await until(()=>existsSync(file),'Browser unavailable');
 const port=readFileSync(file,'utf8').split('\n')[0];
 const target=(await (await fetch('http://127.0.0.1:'+port+'/json/list')).json()).find(x=>x.type==='page');
 socket=new WebSocket(target.webSocketDebuggerUrl);
 await once(socket,'open');
 const pending=new Map();let next=0;
 send=(method,params={})=>new Promise((ok,no)=>{
  const id=++next,timer=setTimeout(()=>{pending.delete(id);no(Error(method+' timeout'))},20000);
  pending.set(id,{ok,no,timer});socket.send(JSON.stringify({id,method,params}));
 });
 socket.addEventListener('message',({data})=>{
  const m=JSON.parse(String(data));
  if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.text);
  const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);
  m.error?p.no(Error(m.error.message)):p.ok(m.result||{});
 });
 socket.addEventListener('close',()=>{for(const p of pending.values()){clearTimeout(p.timer);p.no(Error('Browser closed'))}pending.clear()});
 evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result?.value};
 await send('Page.enable');await send('Runtime.enable');
 for(const [mode,width] of [['healthy',1440],['healthy',320],['paused',1920],['empty',1440],['unavailable',1440],['late-error',1440],['context-loss',1440]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<641});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:mode==='paused'?'reduce':'no-preference'}]});
  // Inject only into this synthetic browser. Real WebGL renders in the healthy
  // cases; empty models emulate drivers that accept draws but produce no pixels.
  const script=await send('Page.addScriptToEvaluateOnNewDocument',{source:`
   localStorage.setItem('anevum.iren.first-contact.v092','seen');
   window.__irenFrames=[];window.__irenFailure=false;
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(type,options){
    if(type==='webgl'&&${JSON.stringify(mode)}==='unavailable')return null;
    const gl=original.call(this,type,options);if(type!=='webgl'||!gl)return gl;
    window.__irenGL=gl;
    const draw=gl.drawArrays.bind(gl),read=gl.readPixels.bind(gl);
    gl.drawArrays=(...args)=>{if(window.__irenFailure)throw Error('Synthetic late GPU failure');if(${JSON.stringify(mode)}!=='empty')draw(...args)};
    gl.readPixels=(...args)=>{read(...args);const p=args[6];let alpha=0;for(let i=3;i<p.length;i+=4)if(p[i])alpha++;window.__irenFrames.push(alpha)};
    return gl;
   };
  `});
  await send('Page.navigate',{url:base+'/creator/'});
  await until(()=>evaluate('!!document.querySelector(".ir80-dock")'),'Companion absent');
  const fallback=['empty','unavailable'].includes(mode);
  await until(()=>evaluate(`!!document.querySelector('.ir88-figure.${fallback?'has-fallback':'is-rendering'}')`),'Frame state '+mode);
  if(!fallback)assert.ok(await evaluate('window.__irenFrames.some(n=>n>0)'),'No genuine rendered pixels');
  if(mode==='late-error')await evaluate('window.__irenFailure=true');
  if(mode==='context-loss')await evaluate('window.__irenGL.getExtension("WEBGL_lose_context").loseContext()');
  const failed=fallback||['late-error','context-loss'].includes(mode);
  if(failed){
   await until(()=>evaluate('!!document.querySelector(".ir88-figure.has-fallback")'),'Failure must restore vector '+mode);
   await until(()=>evaluate('getComputedStyle(document.querySelector(".ir88-svg-fallback")).opacity==="1"'),'Visible vector '+mode);
   assert.equal(await evaluate('document.querySelectorAll(".ir88-3d-canvas").length'),0);
  }
  await evaluate('document.querySelector(".ir80-dock").click()');
  await until(()=>evaluate('!!document.querySelector(".ir80-help")'),'Help must still work '+mode);
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+1'),false);
  const image=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
  writeFileSync(join(output,mode+'-'+width+'.png'),Buffer.from(image.data,'base64'));
  cases.push({mode,width,passed:true,visible:failed?'vector fallback':'verified WebGL pixels'});
  await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:script.identifier});
 }
 assert.deepEqual(exceptions,[]);
 const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 writeFileSync(join(output,'acceptance.json'),JSON.stringify({source,status:'PASS',syntheticOnly:true,physicalDeviceAcceptance:false,cases},null,2));
 console.log('IREN_V104_FRAME_BROWSER=PASS '+cases.length+' cases');
}finally{
 writeFileSync(join(output,'chromium.log'),log);
 await send?.('Browser.close').catch(()=>{});socket?.close();
 if(child.exitCode===null&&child.signalCode===null){const done=once(child,'exit');child.kill();await Promise.race([done,delay(3000)])}
 try{rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100})}catch{}
}

/**
 * V076 deployed 3D viewer smoke: read-only opted-in public member profile.
 * Uses native Node WebSocket and Chrome DevTools, no extra JS dependencies.
 */
import {spawn} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const [chrome,output]=process.argv.slice(2);
if(!chrome||!output)throw Error('V076_BROWSER_CHROME_AND_OUTPUT_REQUIRED');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,timeout=32000){
 const end=Date.now()+timeout;let last=null;
 while(Date.now()<end){
  try{const result=await fn();if(result)return result}catch(error){last=error}
  await delay(220);
 }
 throw Error('V076_LIVE_BROWSER_TIMEOUT'+(last?': '+String(last).slice(0,140):''));
}
function connect(url){
 return new Promise((resolve,reject)=>{
  const socket=new WebSocket(url),calls=new Map();let seq=0;
  socket.addEventListener('open',()=>resolve({
   send(method,params={}){
    return new Promise((res,rej)=>{
     const id=++seq;calls.set(id,{res,rej});
     socket.send(JSON.stringify({id,method,params}));
    });
   },
   close(){socket.close()}
  }),{once:true});
  socket.addEventListener('message',({data})=>{
   const message=JSON.parse(String(data)),call=calls.get(message.id);
   if(!call)return;calls.delete(message.id);
   message.error?call.rej(Error(message.error.message)):call.res(message.result||{});
  });
  socket.addEventListener('error',()=>reject(Error('V076_CDP_CONNECT_FAILED')),{once:true});
  socket.addEventListener('close',()=>{for(const call of calls.values())call.rej(Error('V076_CDP_CLOSED'))});
 });
}
function tileState(){
 const button=[...document.querySelectorAll('.av75-earned-level')].find(x=>x.textContent.includes('Symmetry Field'));
 const image=button?.querySelector('img');
 if(!button||!image?.complete||!image.naturalWidth)return null;
 return {label:button.textContent.trim().slice(0,180),naturalWidth:image.naturalWidth,
  src:image.currentSrc,overflow:document.documentElement.scrollWidth>innerWidth+2};
}
function openInspect(){
 const button=[...document.querySelectorAll('.av75-earned-level')].find(x=>x.textContent.includes('Symmetry Field'));
 if(!button)return false;button.click();return true;
}
function modelState(){
 const dialog=document.querySelector('.av75-reward-dialog');
 const canvas=dialog?.querySelector('.av75-model-canvas');
 if(!dialog?.open||!canvas)return null;
 const first=dialog.querySelector('.av75-reward-controls button');
 let version=null;
 try{version=canvas.getContext('webgl')?.getParameter(7938)||null}catch{}
 return {dialogOpen:dialog.open,title:dialog.querySelector('h2')?.textContent||'',
  canvasWidth:canvas.width,canvasHeight:canvas.height,
  controlsEnabled:!!first&&!first.disabled,poster:!!dialog.querySelector('.av75-model-poster'),
  glVersion:version,overflow:document.documentElement.scrollWidth>innerWidth+2};
}
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'anevum-v076-render-'));
const child=spawn(chrome,[
 '--headless=new','--no-sandbox','--disable-dev-shm-usage',
 '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
 '--enable-unsafe-swiftshader','--remote-debugging-port=0',
 '--remote-allow-origins=*','--disable-background-networking',
 '--no-first-run','--user-data-dir='+profile,'about:blank'
],{stdio:'ignore'});
let c=null;const checkpoints=[];
try{
 const port=await until(()=>{
  const file=join(profile,'DevToolsActivePort');
  if(!existsSync(file))return null;
  const number=readFileSync(file,'utf8').split('\n')[0];
  return /^\d+$/.test(number)?number:null;
 },18000);
 const ws=await until(async()=>{
  const r=await fetch('http://127.0.0.1:'+port+'/json/list');
  if(!r.ok)return null;
  return (await r.json()).find(x=>x.type==='page'&&x.webSocketDebuggerUrl)?.webSocketDebuggerUrl;
 },16000);
 c=await connect(ws);
 await c.send('Page.enable');await c.send('Runtime.enable');
 const evaluate=async expression=>{
  const r=await c.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text||'V076_BROWSER_EVAL');
  return r.result?.value;
 };
 const screenshot=async name=>{
  const r=await c.send('Page.captureScreenshot',{format:'png',fromSurface:true});
  const b=Buffer.from(r.data||'','base64');
  if(b.length<3500)throw Error('V076_EMPTY_SCREENSHOT_'+name);
  writeFileSync(join(output,name+'.png'),b);
 };
 for(const [width,height,label] of [[1440,900,'desktop'],[390,844,'mobile']]){
  await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<641});
  const p=await c.send('Page.navigate',{url:'https://anevum.com/@devon'});
  if(p.errorText)throw Error('V076_BROWSER_NAVIGATE_'+p.errorText);
  const tile=await until(()=>evaluate('('+tileState.toString()+')()'),45000);
  if(tile.naturalWidth<128||!tile.src.includes('/api/v1/members/devon/rewards/levels/4/')||tile.overflow)
   throw Error('V076_LIVE_ICON_INCORRECT_'+label+':'+JSON.stringify(tile));
  await screenshot('v076-earned-level4-'+label);
  if(!await evaluate('('+openInspect.toString()+')()'))
   throw Error('V076_REWARD_INSPECT_NOT_CLICKABLE_'+label);
  const ready=await until(()=>evaluate('('+modelState.toString()+')()'),35000);
  if(!ready.dialogOpen||!ready.title.includes('Symmetry Field'))
   throw Error('V076_REWARD_DIALOG_WRONG_'+label+':'+JSON.stringify(ready));
  const rendered=await until(async()=>{
   const state=await evaluate('('+modelState.toString()+')()');
   return state?.controlsEnabled&&!state.poster?state:null;
  },30000);
  if(rendered.canvasWidth<200||rendered.canvasHeight<200||!rendered.glVersion||rendered.overflow)
   throw Error('V076_WEBGL_RENDER_FAILED_'+label+':'+JSON.stringify(rendered));
  await delay(1100);
  await screenshot('v076-native-model-level4-'+label);
  checkpoints.push({viewport:label,tile,rendered});
  console.log('V076_LIVE_EVOLUTION_POPUP_'+label+'=PASS '+JSON.stringify({
    iconNaturalWidth:tile.naturalWidth,canvasWidth:rendered.canvasWidth,
    canvasHeight:rendered.canvasHeight,glVersion:rendered.glVersion}));
 }
 writeFileSync(join(output,'result.json'),JSON.stringify({pass:true,checkpoints},null,2));
 console.log('ANEVUM_V076_EVOLUTION_ORIGINAL_FULL_3D_BROWSER=PASS');
}finally{
 c?.close();child.kill('SIGTERM');
 // Headless Chrome can create one last profile file while exiting; never
 // let that ephemeral runner cleanup race overwrite validated browser QA.
 try{rmSync(profile,{recursive:true,force:true,maxRetries:20,retryDelay:150})}
 catch(error){
  if(error?.code!=='ENOTEMPTY'&&error?.code!=='EBUSY')throw error;
  console.warn('V076_CHROME_PROFILE_TEMP_CLEANUP_DEFERRED');
 }
}

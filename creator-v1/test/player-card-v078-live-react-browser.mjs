/**
 * V078 screenshot QA uses the REAL production-built React profile route and
 * styles, backed only by an isolated in-memory fake public member API.
 * Never touches anevum.com, real accounts, credentials or XP ledgers.
 */
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync,statSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {resolve,join,sep,extname} from 'node:path';
import {tmpdir} from 'node:os';
import {renderEvolutionCardArt} from '../canonical-auth/evolution-card-art.mjs';

const [chrome,output]=process.argv.slice(2);
if(!chrome||!output)throw Error('V078_CHROMIUM_AND_OUTPUT_REQUIRED');
const staticRoot=resolve(new URL('../dist/web/',import.meta.url).pathname);
if(!existsSync(join(staticRoot,'index.html')))throw Error('V078_BUILD_REQUIRED');
const svg=renderEvolutionCardArt(4);
const MIME={'.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.html':'text/html; charset=utf-8','.json':'application/json; charset=utf-8',
 '.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp',
 '.jpg':'image/jpeg','.woff2':'font/woff2','.ico':'image/x-icon'};
const json=(res,data,status=200)=>{res.writeHead(status,{
 'content-type':'application/json; charset=utf-8','cache-control':'private, no-store',
 'x-content-type-options':'nosniff'});res.end(JSON.stringify(data));};
const now=1760720000;
const publicProfile=handle=>({profile:{
 handle,displayName:'QA Member',bio:'Isolated browser regression fixture',
 joinedAt:now-86400,headline:'A member with one earned specimen.',
 worldTheme:'nocturne',focus:['art','research']
}});
const badgeIds=['first_signal','world_shaper','first_creation'];
const verifiedSpace=visible=>({
 media:{},awards:[],featuredAwards:visible?badgeIds:[],
 earnedBadges:visible?badgeIds.map((id,i)=>({id,earnedAt:now-i*7200})):[],
 badgeDisplay:{mode:'automatic',ids:[]},
 distinctions:{medals:[],ribbons:[]},
 aura:'aurora',constellation:null,showStats:visible,revision:1,
 ...(visible?{stats:{level:4,xp:925,levelStart:675,nextLevel:1200,
  artifact:'Symmetry Field',wallPosts:0,awards:3}}:{})
});
const hits=[];
const server=createServer((req,res)=>{
 const path=new URL(req.url||'/','http://localhost').pathname;
 hits.push(path);
 if(path==='/api/v1/members/qaexample')return json(res,publicProfile('qaexample'));
 if(path==='/api/v1/members/nostats')return json(res,publicProfile('nostats'));
 if(path==='/api/v1/members/privateqa')return json(res,{error:'Not found'},404);
 const space=/^\/api\/v1\/members\/(qaexample|nostats)\/space$/.exec(path);
 if(space)return json(res,verifiedSpace(space[1]==='qaexample'));
 const wall=/^\/api\/v1\/members\/(qaexample|nostats)\/wall$/.exec(path);
 if(wall)return json(res,{posts:[]});
 if(path==='/api/v1/members/qaexample/rewards/levels/4/card'){
  res.writeHead(200,{
   'content-type':'image/svg+xml; charset=utf-8',
   'content-security-policy':"default-src 'none'; script-src 'none'; object-src 'none'; base-uri 'none'",
   'cache-control':'private, no-store',
   'cross-origin-resource-policy':'same-origin',
   'x-content-type-options':'nosniff'
  });
  res.end(svg);return;
 }
 if(path.startsWith('/api/'))return json(res,{error:'Not found'},404);
 const requested=resolve(staticRoot,'.'+(path==='/'?'/index.html':path));
 const safe=requested===staticRoot||requested.startsWith(staticRoot+sep);
 if(safe&&existsSync(requested)&&statSync(requested).isFile()){
  res.writeHead(200,{'content-type':MIME[extname(requested)]||'application/octet-stream'});
  res.end(readFileSync(requested));return;
 }
 res.writeHead(200,{'content-type':'text/html; charset=utf-8'});
 res.end(readFileSync(join(staticRoot,'index.html')));
});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,timeout=38000){
 let error='';const end=Date.now()+timeout;
 while(Date.now()<end){
  try{const x=await fn();if(x)return x}catch(e){error=String(e)}
  await delay(185);
 }
 throw Error('V078_BROWSER_WAIT_TIMEOUT '+error.slice(0,200));
}
mkdirSync(output,{recursive:true});
const profileDir=mkdtempSync(join(tmpdir(),'anevum-v078-react-'));
let browser=null,socket=null;
try{
 await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',e=>e?reject(e):resolve()));
 const origin='http://127.0.0.1:'+server.address().port;
 browser=spawn(chrome,[
  '--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--disable-background-networking','--no-first-run',
  '--remote-debugging-port=0','--remote-allow-origins=*',
  '--user-data-dir='+profileDir,'about:blank'
 ],{stdio:'ignore'});
 const port=await until(()=>{
  const p=join(profileDir,'DevToolsActivePort');
  if(!existsSync(p))return null;
  return readFileSync(p,'utf8').split('\n')[0];
 },20000);
 const ws=await until(async()=>{
  const r=await fetch('http://127.0.0.1:'+port+'/json/list');
  return r.ok?(await r.json()).find(x=>x.type==='page')?.webSocketDebuggerUrl:null;
 });
 socket=new WebSocket(ws);
 await new Promise((resolve,reject)=>{
  socket.addEventListener('open',resolve,{once:true});
  socket.addEventListener('error',reject,{once:true});
 });
 let nextId=0;const calls=new Map();
 socket.addEventListener('message',({data})=>{
  const m=JSON.parse(String(data)),q=calls.get(m.id);
  if(!q)return;
  calls.delete(m.id);
  m.error?q.reject(Error(m.error.message)):q.resolve(m.result||{});
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++nextId;calls.set(id,{resolve,reject});
  socket.send(JSON.stringify({id,method,params}));
 });
 const evaluate=async expression=>{
  const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
  return result.result?.value;
 };
 await send('Page.enable');await send('Runtime.enable');
 await send('Emulation.setEmulatedMedia',{
  features:[{name:'prefers-reduced-motion',value:'reduce'}]
 });
 const results=[];
 for(const [width,height,name] of [[1440,900,'desktop'],[390,844,'mobile']]){
  await send('Emulation.setDeviceMetricsOverride',{
   width,height,deviceScaleFactor:1,mobile:width<700
  });
  const p=await send('Page.navigate',{url:origin+'/@qaexample'});
  if(p.errorText)throw Error('V078_NAVIGATION_FAILED '+p.errorText);
  const view=await until(async()=>{
   const data=await evaluate(`(()=>{
    const card=document.querySelector('[data-player-card="v078"].av65-player-card--featured');
    const progress=card?.querySelector('.av78-player-progress progress');
    const art=card?.querySelector('.av78-featured-art img');
    const badge=card?.querySelector('.av61-specimen img');
    if(!card||!progress||!art?.complete||!art.naturalWidth||!badge?.complete||!badge.naturalWidth)return null;
    const rect=card.getBoundingClientRect();
    const viewport=innerWidth;
    return {
      memberName:card.querySelector('.av61-member-name')?.textContent,
      artworkType:art.currentSrc,
      pixels:art.naturalWidth,
      badgePixels:badge.naturalWidth,
      label:card.querySelector('.av61-level-label')?.textContent,
      progressValue:progress.value,progressMax:progress.max,
      progressText:card.querySelector('.av78-progress-caption')?.textContent,
      width:Math.round(rect.width),left:Math.round(rect.left),right:Math.round(rect.right),
      viewport,overflow:document.documentElement.scrollWidth>innerWidth+2,
      hiddenAssetCount:[...document.querySelectorAll('img')].filter(x=>x.currentSrc.includes('levels/30')).length
    };
   })()`);
   return data;
  },50000);
  if(view.memberName!=='QA Member'||!view.artworkType.includes('/rewards/levels/4/card')||
   view.pixels!==256||view.badgePixels!==256||!view.label.includes('Symmetry Field')||
   view.progressValue!==250||view.progressMax!==525||view.hiddenAssetCount||
   view.left<0||view.right>view.viewport+2)
   throw Error('V078_REACT_CARD_INVALID '+name+' '+JSON.stringify(view));
  const capture=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
  const bytes=Buffer.from(capture.data||'','base64');
  if(bytes.length<3500)throw Error('V078_EMPTY_SCREENSHOT_'+name);
  writeFileSync(join(output,'v078-live-react-'+name+'.png'),bytes);
  results.push({viewport:name,cardWidth:view.width,imagePixels:view.pixels,
   progressValue:view.progressValue,progressMax:view.progressMax,
   pageOverflow:view.overflow,source:'production-React-rendered'});
  console.log('V078_PREMIUM_REACT_'+name+'=PASS '+JSON.stringify(view));
 }
 await send('Emulation.setDeviceMetricsOverride',{
  width:390,height:844,deviceScaleFactor:1,mobile:true
 });
 let p=await send('Page.navigate',{url:origin+'/@nostats'});
 if(p.errorText)throw Error('V078_NOSTATS_NAVIGATION_FAILED');
 const hidden=await until(async()=>{
  const data=await evaluate(`(()=>{
   const card=document.querySelector('[data-player-card="v078"].av65-player-card--featured');
   if(!card)return null;
   return {name:card.querySelector('.av61-member-name')?.textContent,
     level:!!card.querySelector('.av61-level-label'),art:!!card.querySelector('.av78-featured-art'),
     progress:!!card.querySelector('.av78-player-progress'),specimen:!!card.querySelector('.av61-specimen')};
  })()`);
  return data;
 });
 if(hidden.level||hidden.art||hidden.progress||hidden.specimen||hidden.name!=='QA Member')
  throw Error('V078_PRIVACY_LEAK '+JSON.stringify(hidden));
 p=await send('Page.navigate',{url:origin+'/@privateqa'});
 if(p.errorText)throw Error('V078_PRIVATE_NAVIGATION_FAILED');
 const privateState=await until(async()=>{
  const data=await evaluate(`(()=>{
    const heading=document.querySelector('.av12-public-world h1');
    return heading?{title:heading.textContent,card:!!document.querySelector('.av78-player-card')}:null;
   })()`);
  return data;
 });
 if(!privateState.title?.includes('PRIVATE WORLD')||privateState.card)
  throw Error('V078_PRIVATE_PROFILE_LEAK '+JSON.stringify(privateState));
 if(hits.some(p=>/\/levels\/(?:5|30)\//.test(p)))
  throw Error('V078_UNEARNED_ASSET_REQUEST');
 writeFileSync(join(output,'result.json'),JSON.stringify({
  pass:true,source:'isolated built React app',privateAndHiddenStats:true,
  viewports:results,realProductionApiWrites:0
 },null,2));
 console.log('ANEVUM_V078_REACT_PUBLIC_PRIVATE_RESPONSIVE_VISUAL=PASS');
}finally{
 try{socket?.close()}catch{}
 browser?.kill('SIGTERM');
 server.close();
 try{rmSync(profileDir,{recursive:true,force:true,maxRetries:20,retryDelay:125})}catch(e){
  if(!['ENOTEMPTY','EBUSY'].includes(e?.code))throw e;
 }
}

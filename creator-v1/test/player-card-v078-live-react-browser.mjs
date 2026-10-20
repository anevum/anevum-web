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
// Each variant is a synthetic localhost fixture; no real member grant or XP.
const syntheticVariants=new Map([
 ...['aurora','eclipse','ember','nebula','transcosmic','none'].map(aura=>
  ['qa'+aura,{aura,role:'founder'}]),
 ...['administrator','moderator','curator'].map(role=>
  ['qa'+role,{aura:'nebula',role}])
]);
const validSyntheticHandle=handle=>handle==='qaexample'||handle==='nostats'||syntheticVariants.has(handle);
const verifiedSpace=(visible,aura='aurora',role='founder')=>({
 media:{},awards:[],featuredAwards:visible?badgeIds:[],
 earnedBadges:visible?badgeIds.map((id,i)=>({id,earnedAt:now-i*7200})):[],
 badgeDisplay:{mode:'automatic',ids:[]},
 distinctions:{medals:[],ribbons:[]},
 aura,constellation:null,showStats:visible,revision:1,
 role,
 ...(visible?{earnedAura:'signal',reputation:{score:72,tier:'signal',nextAt:160,
  stats:{discussions:3,replies:2,appreciations:2,badges:1}}}:{}),
 ...(visible?{stats:{level:4,xp:925,levelStart:675,nextLevel:1200,
  artifact:'Symmetry Field',wallPosts:0,awards:3}}:{})
});
const hits=[];
const server=createServer((req,res)=>{
 const path=new URL(req.url||'/','http://localhost').pathname;
 hits.push(path);
 const publicPath=/^\/api\/v1\/members\/([a-z][a-z0-9_]{2,29})$/.exec(path);
 if(publicPath&&validSyntheticHandle(publicPath[1]))
  return json(res,publicProfile(publicPath[1]));
 if(path==='/api/v1/members/privateqa')return json(res,{error:'Not found'},404);
 const space=/^\/api\/v1\/members\/([a-z][a-z0-9_]{2,29})\/space$/.exec(path);
 if(space&&validSyntheticHandle(space[1])){
  const variant=syntheticVariants.get(space[1]);
  return json(res,verifiedSpace(space[1]!=='nostats',variant?.aura,variant?.role));
 }
 const wall=/^\/api\/v1\/members\/([a-z][a-z0-9_]{2,29})\/wall$/.exec(path);
 if(wall&&validSyntheticHandle(wall[1]))return json(res,{posts:[]});
 const earnedArt=/^\/api\/v1\/members\/([a-z][a-z0-9_]{2,29})\/rewards\/levels\/4\/card$/.exec(path);
 if(earnedArt&&validSyntheticHandle(earnedArt[1])&&earnedArt[1]!=='nostats'){
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
 for(const [width,height,name] of [[1440,900,'desktop'],[768,1024,'tablet'],[390,844,'mobile'],[320,740,'small-phone']]){
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
    const artPanel=card?.querySelector('.av78-featured-art');
    const badge=card?.querySelector('.av61-specimen img');
    if(!card||!progress||!badge?.complete||!badge.naturalWidth)return null;
    const decorHidden=!!artPanel&&getComputedStyle(artPanel).display==='none';
    // The giant watermark is deliberately not rendered on phones; a hidden
    // decorative image may never load. The earned level seal MUST load.
    if(!decorHidden&&(!art?.complete||!art.naturalWidth))return null;
    const rect=card.getBoundingClientRect();
    const viewport=innerWidth;
    return {
      memberName:card.querySelector('.av61-member-name')?.textContent,
      artworkType:decorHidden?badge.currentSrc:art.currentSrc,
      pixels:decorHidden?badge.naturalWidth:art.naturalWidth,
      decorHidden,badgePixels:badge.naturalWidth,
      label:card.querySelector('.av61-level-label')?.textContent,
      progressValue:progress.value,progressMax:progress.max,
      progressText:card.querySelector('.av78-progress-caption')?.textContent,
      width:Math.round(rect.width),left:Math.round(rect.left),right:Math.round(rect.right),
      viewport,overflow:document.documentElement.scrollWidth>innerWidth+2,
      hiddenAssetCount:[...document.querySelectorAll('img')].filter(x=>x.currentSrc.includes('levels/30')).length,
      role:card.querySelector('.av81-role-token')?.textContent,
      rep:card.querySelector('.av81-reputation-token')?.textContent,
      aura:card.className.includes('av81-earned--signal'),
      chosenAura:card.classList.contains('av65-aura--aurora'),
      auraCompasses:card.querySelectorAll('.av92-aura-compass').length,
      coverAtmosphere:!!document.querySelector('.ms-public .av92-presence-cover--aurora'),
      roleAtmosphere:!!document.querySelector('.ms-public .av92-presence-role--founder'),
      auraMarkerAnimation:getComputedStyle(card.querySelector('.av92-aura-compass'),':before').animationName,
      statusLabel:card.querySelector('.av81-contribution-stats')?.textContent
    };
   })()`);
   return data;
  },50000);
  if(view.memberName!=='QA Member'||!view.artworkType.includes('/rewards/levels/4/card')||
   view.pixels!==256||view.badgePixels!==256||!view.label.includes('Symmetry Field')||
   view.progressValue!==250||view.progressMax!==525||view.hiddenAssetCount||
   view.role!=='Founder'||!view.rep.includes('72 REP')||!view.aura||
   !view.chosenAura||view.auraCompasses!==1||!view.coverAtmosphere||!view.roleAtmosphere||
   view.auraMarkerAnimation!=='none'||!view.statusLabel.includes('THREADS')||
   view.decorHidden!==(width<=430)||view.left<0||view.right>view.viewport+2)
   throw Error('V078_REACT_CARD_INVALID '+name+' '+JSON.stringify(view));
  const capture=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
  const bytes=Buffer.from(capture.data||'','base64');
  if(bytes.length<3500)throw Error('V078_EMPTY_SCREENSHOT_'+name);
  writeFileSync(join(output,'v078-live-react-'+name+'.png'),bytes);
  results.push({viewport:name,cardWidth:view.width,imagePixels:view.pixels,
   mobileDecorativeArtHidden:view.decorHidden,
   progressValue:view.progressValue,progressMax:view.progressMax,
   pageOverflow:view.overflow,source:'production-React-rendered'});
  console.log('V078_PREMIUM_REACT_'+name+'=PASS '+JSON.stringify(view));
 }
 await send('Emulation.setDeviceMetricsOverride',{
  width:390,height:844,deviceScaleFactor:1,mobile:true
 });
 // Real React rendering of every assigned aura and all four verified roles.
 const combinations=[...syntheticVariants].map(([handle,{aura,role}])=>({handle,aura,role}));
 const matrixResults=[];
 for(const variant of combinations){
  const navigation=await send('Page.navigate',{url:origin+'/@'+variant.handle});
  if(navigation.errorText)throw Error('V092_MATRIX_NAVIGATION_'+variant.handle);
  const view=await until(async()=>evaluate(`(()=>{
    const card=document.querySelector('[data-player-card="v078"].av65-player-card--featured');
    const cover=document.querySelector('.ms-public .av92-presence-cover');
    if(!card||!cover)return null;
    const rect=card.getBoundingClientRect();
    const role=card.querySelector('.av81-role-token');
    const compass=card.querySelector('.av92-aura-compass');
    return {
      aura:card.className,
      cover:cover.className,
      role:role?.textContent?.trim(),
      compass:!!compass,
      badgeCount:card.querySelectorAll('.av65-badge').length,
      memberToken:!!card.querySelector('.av92-member-token'),
      rep:card.querySelector('.av81-reputation-token')?.textContent,
      width:Math.round(rect.width),right:Math.round(rect.right),
      viewport:innerWidth,
      reducedMotion:compass?getComputedStyle(compass,':before').animationName:'none'
    };
  })()`));
  if(!view||!view.aura.includes('av65-aura--'+variant.aura)||
    !view.cover.includes('av92-presence-cover--'+variant.aura)||
    !view.cover.includes('av92-presence-role--'+variant.role)||
    view.role!==variant.role[0].toUpperCase()+variant.role.slice(1)||
    view.compass!==(variant.aura!=='none')||view.badgeCount!==3||
    view.memberToken||!view.rep?.includes('72 REP')||
    view.reducedMotion!=='none'||view.right>view.viewport+2)
   throw Error('V092_MATRIX_INVALID '+variant.handle+' '+JSON.stringify(view));
  const image=await send('Page.captureScreenshot',{format:'png',fromSurface:true});
  const bytes=Buffer.from(image.data||'','base64');
  if(bytes.length<3500)throw Error('V092_MATRIX_EMPTY_SCREENSHOT_'+variant.handle);
  writeFileSync(join(output,'v092-presence-'+variant.handle+'.png'),bytes);
  matrixResults.push({handle:variant.handle,aura:variant.aura,role:variant.role,
   cardWidth:view.width,reducedMotionVerified:true});
  console.log('V092_VERIFIED_ROLE_AURA_'+variant.handle+'=PASS');
 }
 let p=await send('Page.navigate',{url:origin+'/@nostats'});
 if(p.errorText)throw Error('V078_NOSTATS_NAVIGATION_FAILED');
 const hidden=await until(async()=>{
  const data=await evaluate(`(()=>{
   const card=document.querySelector('[data-player-card="v078"].av65-player-card--featured');
   if(!card)return null;
   return {name:card.querySelector('.av61-member-name')?.textContent,
     level:!!card.querySelector('.av61-level-label'),art:!!card.querySelector('.av78-featured-art'),
     progress:!!card.querySelector('.av78-player-progress'),specimen:!!card.querySelector('.av61-specimen'),
     rep:!!card.querySelector('.av81-reputation-token'),role:card.querySelector('.av81-role-token')?.textContent,
      chosenAura:card.classList.contains('av65-aura--aurora'),
      auraMarker:!!card.querySelector('.av92-aura-compass'),
      coverAtmosphere:!!document.querySelector('.ms-public .av92-presence-cover--aurora')};
  })()`);
  return data;
 });
 if(hidden.level||hidden.art||hidden.progress||hidden.specimen||hidden.rep||hidden.role!=='Founder'||hidden.name!=='QA Member'||!hidden.chosenAura||!hidden.auraMarker||!hidden.coverAtmosphere)
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
  viewports:results,roleAuraMatrix:matrixResults,realProductionApiWrites:0
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

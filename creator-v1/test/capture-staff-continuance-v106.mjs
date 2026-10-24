/**
 * Observatory V105 isolated local browser fixture.
 * ALL COUNTS BELOW ARE SYNTHETIC TEST DATA; this script never uses production APIs.
 */
import {createServer} from 'node:http';
import {decorateObservatoryHtml} from '../operations/anevum-iren-staff-observatory-v106.mjs';
import {NEXT_CSS,NEXT_CLIENT} from '../operations/anevum-observatory-continuance-v106-assets.mjs';
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const [chrome,out]=process.argv.slice(2);
if(!chrome||!out)throw Error('V105_CHROME_AND_OUTPUT_REQUIRED');
const source=readFileSync(new URL('../operations/anevum-iren-staff-observatory-v105.mjs',import.meta.url),'utf8');
const asset=name=>{
 const match=source.match(new RegExp('const '+name+'=("(?:\\\\.|[^"\\\\])*");'));
 if(!match)throw Error('V105_MISSING_ASSET_'+name);
 return JSON.parse(match[1]);
};
const page=decorateObservatoryHtml(asset('PAGE'),'growth'),css=asset('STYLES'),js=asset('CLIENT');
const original=readFileSync(new URL('../operations/anevum-iren-staff-observatory-v104.mjs',import.meta.url),'utf8');
const legacyAsset=name=>{
 const match=original.match(new RegExp('const '+name+' = ("(?:\\\\.|[^"\\\\])*");'));
 if(!match)throw Error('V106_LEGACY_ASSET_MISSING_'+name);
 return JSON.parse(match[1]);
};
const ops=decorateObservatoryHtml(legacyAsset('PAGE'),'operations'),opsCss=legacyAsset('STYLES'),opsJs=legacyAsset('CLIENT');
const now=new Date();const utcMidnight=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
const d=offset=>new Date(utcMidnight-offset*86400000).toISOString().slice(0,10);
const counts={members:31,verified:22,new7d:6,prior7d:2,new30d:11,creatorProfiles:6,
 publishedProjects:5,pendingProjects:2,projectSaves:8,projectVotes:13,
 projectComments:7,forumThreads:3,forumReplies:12,wallPosts:2};
const fixture={
 counts,days:[{day:d(0),n:1},{day:d(2),n:3},{day:d(4),n:2},{day:d(8),n:2},{day:d(15),n:3}],
 checkedAt:now.toISOString(),timeZone:'UTC',source:'MEMBER_DB',
 coverage:[
 {label:'Visitors and marketing attribution',status:'unavailable',reason:'Not connected'},
 {label:'Visitor-to-signup conversion',status:'unavailable',reason:'Not connected'},
 {label:'Activation and D1/D7/D30 retention',status:'unavailable',reason:'Not connected'},
 {label:'Period-specific creator engagement',status:'unavailable',reason:'Not connected'},
 {label:'Collected revenue, CAC and campaign ROI',status:'unavailable',reason:'Not connected'}
 ]};
let role='owner',offline=false,requests=[];
const server=createServer((req,res)=>{
 const url=new URL(req.url||'/', 'http://127.0.0.1');
 const path=url.pathname;
 const reply=(body,type='text/plain',status=200)=>{
  res.writeHead(status,{'content-type':type,'x-anevum-test-fixture':'synthetic-only','cache-control':'no-store'});
  res.end(body);
 };
 if(path==='/staff/observatory'||path==='/staff/observatory/')return reply(ops,'text/html; charset=utf-8');
 if(path==='/staff/observatory/styles.css')return reply(opsCss,'text/css; charset=utf-8');
 if(path==='/staff/observatory/app.js')return reply(opsJs,'application/javascript; charset=utf-8');
 if(path==='/staff/observatory/continuance-v106.css')return reply(NEXT_CSS,'text/css; charset=utf-8');
 if(path==='/staff/observatory/continuance-v106.js')return reply(NEXT_CLIENT,'application/javascript; charset=utf-8');
 if(path==='/staff/observatory/api/overview')return reply(JSON.stringify({role,counts:{members:counts.members,verified:counts.verified,new7d:counts.new7d,sessionMembers:8,threads:3,replies:12,wallPosts:2,projectVotes:13,projectComments:7,projectSaves:8,recognitions:2,publishedProjects:5,pendingProjects:2,pendingForum:0,projectReports:0,forumReports:0,pendingTotal:2},signups:[],checkedAt:now.toISOString(),visitors:{status:'unavailable'}}),'application/json');
 if(path==='/staff/observatory/api/members')return reply(JSON.stringify({items:[],total:0,page:0,pageSize:50}),'application/json');
 if(path==='/staff/observatory/api/rewards')return reply(JSON.stringify({awards:[],auras:[],grants:[],distribution:[]}),'application/json');
 if(path==='/staff/observatory/api/audit')return reply(JSON.stringify({items:[]}),'application/json');
 if(path==='/staff/observatory/growth'||path==='/staff/observatory/growth/')return reply(page,'text/html; charset=utf-8');
 if(path==='/staff/observatory/growth/styles.css')return reply(css,'text/css; charset=utf-8');
 if(path==='/staff/observatory/growth/app.js')return reply(js,'application/javascript; charset=utf-8');
 if(path==='/staff/observatory/growth/api'){
  requests.push(path);
  if(offline)return reply(JSON.stringify({error:'Synthetic data source unavailable'}),'application/json',503);
  return reply(JSON.stringify({...fixture,role}),'application/json');
 }
 return reply('Fixture path not found','text/plain',404);
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function poll(fn,timeout=18000){
 const end=Date.now()+timeout,last=[];
 while(Date.now()<end){
  try{const val=await fn();if(val)return val}catch(e){last.push(String(e).slice(0,180))}
  await sleep(110);
 }
 throw Error('V105_BROWSER_TIMEOUT '+last.slice(-1));
}
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
const url='http://127.0.0.1:'+server.address().port;
const profile=mkdtempSync(join(tmpdir(),'anevum-v105-'));
mkdirSync(out,{recursive:true});
const cp=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
 '--disable-background-networking','--no-first-run','--remote-allow-origins=*',
 '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let socket=null;
const evidence=[];
try{
 const port=await poll(()=>{const f=join(profile,'DevToolsActivePort');return existsSync(f)?readFileSync(f,'utf8').split('\n')[0]:null});
 const endpoint=await poll(async()=>{
  const r=await fetch('http://127.0.0.1:'+port+'/json/list');
  return r.ok?(await r.json()).find(x=>x.type==='page')?.webSocketDebuggerUrl:null;
 });
 socket=new WebSocket(endpoint);
 const pending=new Map();let id=0;
 socket.addEventListener('message',({data})=>{
  const packet=JSON.parse(String(data)),task=pending.get(packet.id);
  if(!task)return;pending.delete(packet.id);
  packet.error?task.reject(Error(packet.error.message)):task.resolve(packet.result||{});
 });
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));
 });
 const evaluate=async expression=>{
  const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
  return result.result?.value;
 };
 const capture=async name=>{
  const {data}=await send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  const bytes=Buffer.from(data||'','base64');
  if(bytes.length<4000)throw Error('V105_SCREENSHOT_MISSING_'+name);
  writeFileSync(join(out,name+'.png'),bytes);
 };
 await send('Page.enable');await send('Runtime.enable');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const [currentRole,width,height,label] of [['owner',1440,900,'owner-desktop'],['owner',390,844,'owner-phone'],['owner',320,720,'owner-small-phone'],['reviewer',390,844,'reviewer-phone']]){
  role=currentRole;offline=false;requests=[];
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<820});
  const nav=await send('Page.navigate',{url:url+'/staff/observatory/growth'});
  if(nav.errorText)throw Error('V105_BROWSER_NAV_'+label+':'+nav.errorText);
  await poll(()=>evaluate("document.querySelectorAll('#kpis .kpi').length===8&&document.querySelectorAll('#trend .bar').length===30"));
  const state=await evaluate("(()=>({kpis:document.querySelectorAll('#kpis .kpi').length,bars:document.querySelectorAll('#trend .bar').length,coverage:document.querySelectorAll('#coverageRows .coverage-item').length,role:document.querySelector('#role')?.textContent,health:document.querySelector('#health')?.textContent,overflows:document.documentElement.scrollWidth>window.innerWidth+1,returnLink:!!document.querySelector('.mobile-title .backlink'),broken:[...document.querySelectorAll('img')].filter(i=>!i.complete||i.naturalWidth===0).length}))()");
  await poll(()=>evaluate("document.querySelector('[data-ci-days=\\\"7\\\"]')?.disabled===false"));
  if(!state?.kpis||!state?.bars)throw Error('V106_MISSING_VERIFIED_METRICS_'+label);
  if(state.kpis!==8||state.bars!==30||state.coverage!==5||state.role!==(role==='owner'?'OWNER':'REVIEWER')||
     !state.health?.includes('VERIFIED AGGREGATE')||state.overflows||!state.returnLink||state.broken)throw Error('V105_BROWSER_CONTRACT_'+label+':'+JSON.stringify(state));
  if(requests.length!==1)throw Error('V105_UNEXPECTED_REQUESTS_'+JSON.stringify(requests));
  const campaign=await evaluate("(()=>({link:document.querySelector('#campaignOutput')?.value,copyDisabled:document.querySelector('#campaignCopy')?.disabled}))()");
  if(!campaign.link?.startsWith('https://anevum.com/?utm_source=reddit&utm_medium=community&utm_campaign=founding-testers')||campaign.copyDisabled)
   throw Error('V105_CAMPAIGN_URL_CONTRACT_'+label+':'+JSON.stringify(campaign));
  if(role==='owner'){
   const invalid=await evaluate("(()=>{const x=document.querySelector('#utmSource');x.value='unsafe input !';x.dispatchEvent(new Event('input',{bubbles:true}));const rejected=document.querySelector('#campaignCopy').disabled&&document.querySelector('#campaignOutput').value==='';x.value='reddit';x.dispatchEvent(new Event('input',{bubbles:true}));return rejected&&document.querySelector('#campaignOutput').value.includes('utm_source=reddit')})()");
   if(!invalid)throw Error('V105_CAMPAIGN_INVALID_SLUG_ACCEPTED_'+label);
  }
  const visual=await evaluate("(()=>({theme:document.body.classList.contains('ci-next'),spine:!!document.querySelector('.ci-spine'),orbital:document.querySelectorAll('.ci-orbital-mark').length,overflows:document.documentElement.scrollWidth>innerWidth+1,calendar:document.querySelectorAll('[data-ci-days]').length,exportReady:!document.querySelector('#ci-export')?.disabled}))()");
  if(!visual.theme||!visual.spine||visual.orbital<2||visual.overflows||visual.calendar!==3||!visual.exportReady)throw Error('V106_VISUAL_CONTRACT_'+label+':'+JSON.stringify(visual));
  const range=await evaluate("(()=>{const btn=document.querySelector('[data-ci-days=\\\"7\\\"]');btn.click();const seven=document.querySelectorAll('#trend .bar-wrap:not([hidden])').length===7&&document.querySelector('#trendCaption').textContent.includes('7 UTC calendar dates');document.querySelector('[data-ci-days=\\\"14\\\"]').click();const fourteen=document.querySelectorAll('#trend .bar-wrap:not([hidden])').length===14;document.querySelector('[data-ci-days=\\\"30\\\"]').click();const thirty=document.querySelectorAll('#trend .bar-wrap:not([hidden])').length===30;return {seven,fourteen,thirty}})()");
  if(!range.seven||!range.fourteen||!range.thirty)throw Error('V106_CHART_WINDOW_'+label+':'+JSON.stringify(range));
  const motion=await evaluate("(()=>{const b=document.querySelector('#ci-motion');const before=b.getAttribute('aria-pressed');b.click();const toggled=b.getAttribute('aria-pressed')!==before;b.click();return toggled&&b.getAttribute('aria-pressed')===before})()");
  if(!motion)throw Error('V106_MOTION_CONTROL_'+label);
  await capture('growth-next-'+label);
  if(label==='owner-desktop'||label==='owner-phone'){
   await evaluate("document.querySelector('#campaign').scrollIntoView()");
   await capture('campaign-'+label);
  }
  const old=await send('Page.navigate',{url:url+'/staff/observatory'});
  if(old.errorText)throw Error('V106_OPERATIONS_NAV_'+label+':'+old.errorText);
  await poll(()=>evaluate("document.querySelector('.ci-hero')&&document.querySelector('#metrics')&&document.querySelector('.ci-spine')"));
  const operations=await evaluate("(()=>({theme:document.body.classList.contains('ci-next'),hero:!!document.querySelector('#ci-hero-title'),brand:!!document.querySelector('.brand .ci-orbital-mark'),controls:!!document.querySelector('[data-tab=\\\"moderation\\\"]'),ownerPanel:!!document.querySelector('#memberRows'),overflow:document.documentElement.scrollWidth>innerWidth+1,spine:!!document.querySelector('.ci-spine')}))()");
  if(!operations.theme||!operations.hero||!operations.brand||!operations.controls||!operations.ownerPanel||operations.overflow||!operations.spine)throw Error('V106_OPERATIONS_CONTRACT_'+label+':'+JSON.stringify(operations));
  await capture('operations-next-'+label);
  evidence.push({label,role,width,height,state,campaign,visual,range,motion,operations,requests:[...requests],syntheticOnly:true});
  console.log('V105_GROWTH_'+label.toUpperCase().replaceAll('-','_')+'=PASS');
 }
 offline=true;role='owner';requests=[];
 await send('Page.navigate',{url:url+'/staff/observatory/growth'});
 await poll(()=>evaluate("document.querySelector('.unavailable')?.textContent?.includes('Growth API unavailable')"));
 const failure=await evaluate("(()=>({kpis:document.querySelectorAll('#kpis .kpi').length,bars:document.querySelectorAll('#trend .bar').length,health:document.querySelector('#health')?.textContent}))()");
 if(failure.kpis||failure.bars||!failure.health.includes('DATA UNAVAILABLE'))throw Error('V105_MISSING_DATA_LIES_'+JSON.stringify(failure));
 const offlineCheck=await evaluate("document.querySelector('#ci-export')?.disabled===true&&document.body.classList.contains('ci-next')");
 if(!offlineCheck)throw Error('V106_OFFLINE_EXPORT_ENABLED');
 await capture('offline-phone');
 evidence.push({label:'offline-phone',failure,syntheticOnly:true});
 writeFileSync(join(out,'acceptance.json'),JSON.stringify({pass:true,productionRequests:0,productionWrites:0,fixture:'synthetic-only',evidence},null,2));
 console.log('V106_CONTINUANCE_OBSERVATORY_BROWSER_RESPONSIVE=PASS');
}finally{
 try{socket?.close()}catch{}
 cp.kill('SIGTERM');
 await new Promise(resolve=>server.close(resolve));
 try{rmSync(profile,{recursive:true,force:true,maxRetries:12,retryDelay:140})}
 catch(err){if(!['ENOTEMPTY','EBUSY'].includes(err?.code))throw err}
}

/**
 * V092 Observatory viewport acceptance using a strictly isolated loopback fixture.
 * Fake counters exist only in this QA process, never in the production website.
 * All worker routes, D1 records and Cloudflare authentication remain untouched.
 */
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const [chrome,output]=process.argv.slice(2);
if(!chrome||!output)throw Error('V092_CHROME_AND_OUTPUT_REQUIRED');
const source=readFileSync(new URL('../operations/anevum-iren-staff-observatory-v092.mjs',import.meta.url),'utf8');
const extracted=name=>{
 const m=source.match(new RegExp('const '+name+' = ("(?:\\\\.|[^"\\\\])*");'));
 if(!m)throw Error('V092_MISSING_SOURCE_'+name);
 return JSON.parse(m[1]);
};
const assets={page:extracted('PAGE'),css:extracted('STYLES'),js:extracted('CLIENT')};
let mode='owner';
let dataRequests=[];
const counts={members:23,verified:18,new7d:3,sessionMembers:10,xpEvents:2,xpTesters:1,
 threads:4,replies:8,wallPosts:3,projectVotes:9,projectComments:2,projectSaves:5,
 recognitions:6,publishedProjects:5,pendingProjects:2,pendingForum:1,projectReports:1,forumReports:0,
 pendingTotal:4};
const date='2026-10-19T23:00:00.000Z';
const replies={
 overview:()=>({role:mode,counts,signups:[{day:'2026-10-13',n:2},{day:'2026-10-19',n:1}],
  checkedAt:date,visitors:{status:'unavailable',reason:'Synthetic QA fixture; no visitor data'}}),
 members:()=>({members:[],total:0,page:0,pageSize:50,hasNext:false}),
 rewards:()=>({awards:[],auras:[]}),
 audit:()=>({entries:[]})
};
const server=createServer((req,res)=>{
 const url=new URL(req.url||'/', 'http://127.0.0.1');
 const path=url.pathname;
 const answer=(body,type,status=200)=>{
  res.writeHead(status,{'content-type':type,'cache-control':'no-store','x-anevum-test-fixture':'synthetic-only'});
  res.end(body);
 };
 if(path==='/staff/observatory'||path==='/staff/observatory/')
  return answer(assets.page,'text/html; charset=utf-8');
 if(path==='/staff/observatory/styles.css')
  return answer(assets.css,'text/css; charset=utf-8');
 if(path==='/staff/observatory/app.js')
  return answer(assets.js,'application/javascript; charset=utf-8');
 const prefix='/staff/observatory/api/';
 if(path.startsWith(prefix)){
  const key=path.slice(prefix.length);
  dataRequests.push({key,mode});
  if(!Object.hasOwn(replies,key))return answer(JSON.stringify({error:'Not found'}),'application/json',404);
  if(mode!=='owner'&&key!=='overview')return answer(JSON.stringify({error:'Forbidden'}),'application/json',403);
  return answer(JSON.stringify(replies[key]()),'application/json');
 }
 return answer('Not found','text/plain',404);
});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function poll(fn,ms=18000){
 const end=Date.now()+ms;let last='';
 while(Date.now()<end){try{const x=await fn();if(x)return x;}catch(e){last=String(e);}await sleep(130);}
 throw Error('V092_BROWSER_TIMEOUT '+last.slice(0,180));
}
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const base='http://127.0.0.1:'+server.address().port;
const profile=mkdtempSync(join(tmpdir(),'anevum-v092-observatory-'));
mkdirSync(output,{recursive:true});
const chromeProcess=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage',
 '--disable-gpu','--disable-background-networking','--no-first-run','--remote-allow-origins=*',
 '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let ws=null;
const evidence=[];
try {
 const port=await poll(()=>{const file=join(profile,'DevToolsActivePort');return existsSync(file)?readFileSync(file,'utf8').split('\n')[0]:null;});
 const endpoint=await poll(async()=>{
  const response=await fetch('http://127.0.0.1:'+port+'/json/list');
  return response.ok?(await response.json()).find(item=>item.type==='page')?.webSocketDebuggerUrl:null;
 });
 ws=new WebSocket(endpoint);
 const pending=new Map();let id=0;
 ws.addEventListener('message',({data})=>{
  const packet=JSON.parse(String(data));
  const work=pending.get(packet.id);if(!work)return;
  pending.delete(packet.id);
  packet.error?work.reject(Error(packet.error.message)):work.resolve(packet.result||{});
 });
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const key=++id;pending.set(key,{resolve,reject});
  ws.send(JSON.stringify({id:key,method,params}));
 });
 const evalJS=async expression=>{
  const reply=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(reply.exceptionDetails)throw Error(reply.exceptionDetails.exception?.description||reply.exceptionDetails.text);
  return reply.result?.value;
 };
 const capture=async name=>{
  const result=await send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  const bytes=Buffer.from(result.data||'','base64');
  if(bytes.length<4000)throw Error('V092_SCREENSHOT_MISSING_'+name);
  writeFileSync(join(output,name+'.png'),bytes);
 };
 await send('Page.enable');await send('Runtime.enable');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const [role,width,height,label] of [['owner',1440,900,'owner-desktop'],['owner',390,844,'owner-phone'],['owner',320,720,'owner-small-phone'],['reviewer',390,844,'reviewer-phone']]){
  mode=role;
  dataRequests=[];
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<720});
  const nav=await send('Page.navigate',{url:base+'/staff/observatory'});
  if(nav.errorText)throw Error('V092_NAV_'+label+':'+nav.errorText);
  await poll(()=>evalJS("document.querySelector('#syncState')?.dataset.state==='ready'&&document.querySelectorAll('#priorityActions .priority-item').length===4"));
  const state=await evalJS("(()=>({headline:document.querySelector('#mission-title')?.textContent,queue:document.querySelector('#missionStatus')?.textContent,metrics:document.querySelectorAll('#metrics .metric').length,priorities:[...document.querySelectorAll('#priorityActions .priority-value')].map(x=>x.textContent),days:document.querySelectorAll('#signups .chart-day').length,ownerHidden:[...document.querySelectorAll('.owner-only')].every(x=>x.hidden),role:document.querySelector('#role')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth+1,mainOverflow:document.querySelector('.main')?.scrollWidth>document.querySelector('.main')?.clientWidth+1,sourceStatus:document.querySelector('#syncState')?.textContent,brokenImages:[...document.querySelectorAll('img')].filter(x=>!x.complete||x.naturalWidth===0).length}))()");
  if(!state.headline?.includes('What needs attention')||!state.queue?.includes('4 recorded items')||
    state.metrics!==8||state.priorities.join(',')!=='2,1,1,3'||state.days!==8||
    state.ownerHidden!==(role==='reviewer')||
    state.role!==(role==='owner'?'OWNER CLEARANCE':'MODERATOR')||
    state.overflow||state.mainOverflow||state.brokenImages||!state.sourceStatus?.includes('LIVE DATA VERIFIED'))
    throw Error('V092_LAYOUT_CONTRACT_'+label+':'+JSON.stringify(state));
  if(role==='reviewer'&&dataRequests.some(x=>['members','rewards','audit'].includes(x.key)))
    throw Error('V092_REVIEWER_PRIVATE_API_REQUEST');
  await capture(label);
  evidence.push({viewport:label,width,height,role,details:state,requests:dataRequests.map(x=>x.key)});
  console.log('V092_OBSERVATORY_'+label.toUpperCase().replaceAll('-','_')+'=PASS');
 }
 writeFileSync(join(output,'acceptance.json'),JSON.stringify({
  pass:true,source:'isolated synthetic Observatory fixture (no production requests)',
  sourceWorker:'anevum-iren-staff-observatory-v092',productionWriteCount:0,evidence
 },null,2));
 console.log('V092_OBSERVATORY_RESPONSIVE_BROWSER=PASS');
}finally {
 try{ws?.close();}catch{}
 chromeProcess.kill('SIGTERM');
 await new Promise(resolve=>server.close(resolve));
 try{rmSync(profile,{recursive:true,force:true,maxRetries:12,retryDelay:140});}
 catch(error){if(!['ENOTEMPTY','EBUSY'].includes(error?.code))throw error;}
}

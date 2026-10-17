// ANEVUM V053: synthetic-only Chromium end-to-end acceptance.
// No canonical D1, Cloudflare Worker, real member sessions, or public releases.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {readFileSync,existsSync,mkdirSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,extname,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const dist=resolve(fileURLToPath(new URL('../dist/react-staging/',import.meta.url)));
const port=4193,base='http://127.0.0.1:'+port,owner='v053-synthetic-owner',cookie='studio_v053_fake_member=1';
const now=Math.floor(Date.now()/1000);
const records=new Map(),idempotency=new Map(),actions=[];
const label='SYNTHETIC OFFLINE REVIEW — NOT REAL CONTENT';
const overlay='<style>body::after{content:"SYNTHETIC OFFLINE REVIEW — NOT REAL CONTENT";position:fixed;bottom:5px;right:7px;pointer-events:none;z-index:2147483647;background:#fff0b2;color:#1c1010;border:2px solid #1c1010;padding:5px 8px;font:900 8px system-ui,sans-serif;max-width:230px}</style>';
const types={'.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.ico':'image/x-icon'};
const json=(res,value,status=200)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(value));};
const signed=req=>(req.headers.cookie||'').split(';').includes(cookie);
async function read(req){let s='';for await(const c of req){s+=c.toString('utf8');if(s.length>20000)throw Error('synthetic body too large');}return JSON.parse(s||'{}');}
async function fixture(req,res){
 try{
  const url=new URL(req.url||'/',base),path=url.pathname,method=req.method;
  if(path==='/__ready')return json(res,{ready:existsSync(join(dist,'index.html'))});
  if(path==='/__reset'){records.clear();idempotency.clear();actions.length=0;return json(res,{synthetic:true});}
  if(path==='/__state')return json(res,{synthetic:true,projects:[...records.values()],actions});
  if(path==='/api/v1/member/auth/get-session')return json(res,signed(req)?{
   user:{id:owner,emailVerified:true,name:'Synthetic Creator',email:'studio@anevum.invalid',
    createdAt:'2026-10-12T00:00:00Z',updatedAt:'2026-10-12T00:00:00Z'},
   session:{id:'local-not-real',userId:owner,createdAt:'2026-10-12T00:00:00Z',
    updatedAt:'2026-10-12T00:00:00Z',expiresAt:'2027-01-01T00:00:00Z'}}:null);
  if(path==='/api/v1/member/health')return json(res,{service:'synthetic',status:'ready',studioReady:true,studioUploadsReady:false,registration:'open'});
  if(path.startsWith('/api/v1/member/')){
   if(!signed(req))return json(res,{error:'Synthetic session missing'},401);
   if(path==='/api/v1/member/creator-profile')return json(res,{memberId:owner,profile:{
    handle:'synthetic_creator',displayName:'Synthetic Creator',bio:'',headline:'',worldTheme:'transcosmic',
    focus:[],visibility:'private',revision:1,createdAt:now,updatedAt:now
   }});
   if(path==='/api/v1/member/studio/projects'){
    if(method==='GET')return json(res,{projects:[...records.values()].sort((a,b)=>b.updatedAt-a.updatedAt),uploadsReady:false,canReview:false});
    if(method==='POST'){
     const r=await read(req),old=idempotency.get(r.clientRequestId);
     if(old)return json(res,{project:old,replayed:true});
     const p={...r.draft,id:randomUUID(),status:'draft',revision:1,
      submittedAt:null,createdAt:now,updatedAt:now};
     idempotency.set(r.clientRequestId,p);records.set(p.id,p);
     actions.push({method,path,title:p.title,category:p.category});
     return json(res,{project:p,replayed:false},201);
    }
   }
   const match=/^\/api\/v1\/member\/studio\/projects\/([a-f0-9-]{36})(?:\/(assets|submissions))?$/.exec(path);
   if(match){
    const p=records.get(match[1]);if(!p)return json(res,{error:'No synthetic draft'},404);
    if(match[2]==='assets')return json(res,{assets:[],quotaBytes:0,projectAssetLimit:20,memberUsedBytes:0,projectUsedBytes:0,globalUsedBytes:0,globalQuotaBytes:0,storageReady:false,uploadsReady:false});
    if(match[2]==='submissions')return json(res,{submissions:[],note:'No review history'});
    if(method==='GET')return json(res,{project:p,uploadsReady:false,reviewHistory:[]});
    if(method==='PATCH'){
     const r=await read(req);if(r.revision!==p.revision)return json(res,{error:'Synthetic revision conflict'},409);
     const updated={...p,...r.draft,revision:p.revision+1,updatedAt:now+1};
     records.set(p.id,updated);actions.push({method,path,revision:updated.revision});
     return json(res,{project:updated});
    }
   }
   return json(res,{error:'Not implemented in private synthetic fixture'},404);
  }
  if(path==='/creator'||path.startsWith('/creator/')){
   const asset=path.replace(/^\/creator\/?/,'');
   if(asset.startsWith('assets/')){
    const file=resolve(dist,asset);
    if(!file.startsWith(dist+sep)||asset.includes('..')||!existsSync(file))
     return json(res,{error:'Static file unavailable'},404);
    res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});
    return res.end(readFileSync(file));
   }
   res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
   return res.end(readFileSync(join(dist,'index.html'),'utf8').replace('</head>',overlay+'</head>'));
  }
  return json(res,{error:'not-found'},404);
 }catch(error){console.error(error);return json(res,{error:'fixture internal error'},500);}
}
const delay=t=>new Promise(r=>setTimeout(r,t));
async function until(fn){
 const stop=Date.now()+19000;let last;
 while(Date.now()<stop){try{const r=await fn();if(r)return r;}catch(e){last=e;}await delay(100);}
 throw Error('STUDIO_V053_BROWSER_TIMEOUT'+(last?': '+last:''));
}
function connect(url){return new Promise((resolve,reject)=>{
 const ws=new WebSocket(url),pending=new Map();let i=0;
 ws.addEventListener('open',()=>resolve({
  send(method,params={}){return new Promise((resolve,reject)=>{const id=++i;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});},
  close(){ws.close();}
 }),{once:true});
 ws.addEventListener('message',({data})=>{
  const r=JSON.parse(String(data)),p=pending.get(r.id);if(!p)return;pending.delete(r.id);
  r.error?p.reject(Error(r.error.message)):p.resolve(r.result||{});
 });
 ws.addEventListener('error',()=>reject(Error('CDP connection failed')),{once:true});
});}
const argv=process.argv.slice(2),opt=x=>{const i=argv.indexOf(x);return i===-1?null:argv[i+1]};
const chrome=opt('--chrome'),out=opt('--output');
if(!chrome||!out||!existsSync(join(dist,'index.html')))throw Error('Need --chrome, --output and built dist/react-staging.');
mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'studio-v053-cdp-'));
const server=createServer((req,res)=>void fixture(req,res));
await new Promise(r=>server.listen(port,'127.0.0.1',r));
const child=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
 '--disable-background-networking','--remote-allow-origins=*','--remote-debugging-port=0',
 '--no-first-run','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let c;
try{
 const debugPort=await until(()=>existsSync(join(profile,'DevToolsActivePort'))?
  readFileSync(join(profile,'DevToolsActivePort'),'utf8').split('\n')[0]:null);
 const ws=await until(async()=>{
  const r=await fetch('http://127.0.0.1:'+debugPort+'/json/list');
  if(!r.ok)return null;return (await r.json()).find(x=>x.type==='page')?.webSocketDebuggerUrl;
 });
 c=await connect(ws);await c.send('Page.enable');await c.send('Runtime.enable');await c.send('Network.enable');
 const evaluate=async expression=>{
  const r=await c.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error('PAGE_EXCEPTION:'+r.exceptionDetails.text);
  return r.result?.value;
 };
 const visit=async path=>{const r=await c.send('Page.navigate',{url:base+'/creator'+path});if(r.errorText)throw Error(r.errorText);};
 const screenshot=async name=>{
  const r=await c.send('Page.captureScreenshot',{format:'png',fromSurface:true});
  assert.ok(r.data&&r.data.length>5000);
  writeFileSync(join(out,name+'.png'),Buffer.from(r.data,'base64'));
 };
 const check=async(width)=>{
  const status=await evaluate('(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,synthetic:getComputedStyle(document.body,"::after").content.includes("SYNTHETIC OFFLINE REVIEW")}))()');
  assert.equal(status.width,width);assert.equal(status.overflow,false);assert.equal(status.synthetic,true);
 };
 for(const width of [1440,390,320]){
  await fetch(base+'/__reset');
  await c.send('Network.clearBrowserCookies');
  await c.send('Emulation.setDeviceMetricsOverride',{width,height:width===1440?920:844,deviceScaleFactor:1,mobile:width<641});
  await c.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await visit('/studio');await until(()=>evaluate('!!document.querySelector(".sl-guest-hero")'));
  await check(width);assert.equal(await evaluate('document.querySelectorAll(".sl-guest-starters article").length'),5);
  await screenshot('studio-v053-guest-'+width);
  await c.send('Network.setCookie',{name:'studio_v053_fake_member',value:'1',url:base+'/'});
  await visit('/studio');
  await until(()=>evaluate('!!document.querySelector(".sl-landing-hero")'));
  await check(width);
  const firstAction=await evaluate('(()=>{const n=document.querySelector(".sl-landing-actions .sl-primary");const b=n?.getBoundingClientRect();return {top:b?.top,below:b?.top>=innerHeight-105};})()');
  assert.ok(firstAction.top>0&&!firstAction.below,'First idea input should be visible without scrolling at '+width+' px: '+JSON.stringify(firstAction));
  await screenshot('studio-v053-launchpad-'+width);
  await evaluate('document.querySelector(".sl-spark-drawer>button").click()');
  await until(()=>evaluate('!!document.querySelector("#sl-idea")'));
  await evaluate('document.querySelector("#sl-idea").focus()');
  await c.send('Input.insertText',{text:'A forgotten observatory with an interactive mystery'});
  await until(()=>evaluate('document.querySelector(".sl-spark-form button[type=submit]")?.disabled===false'));
  await evaluate('document.querySelector(".sl-spark-form button[type=submit]").click()');
  await until(()=>evaluate('location.pathname.startsWith("/creator/studio/")&&!!document.querySelector(".st-creation-toolbar")'));
  await check(width);await screenshot('studio-v053-editor-'+width);
  const first=await (await fetch(base+'/__state')).json();
  assert.equal(first.projects.length,1);assert.equal(first.actions.filter(x=>x.method==='POST').length,1);
  assert.equal(first.projects[0].license,'');assert.equal(first.projects[0].status,'draft');
  await evaluate('document.querySelector(".st-editor-form textarea").focus()');
  await c.send('Input.insertText',{text:' Additional mystery clue.'});
  await until(()=>evaluate('document.querySelector(".st-save-state")?.dataset.unsaved==="true"'));
  await evaluate('window.confirm=()=>false;document.querySelector(".st-creation-underbar a[href]")?.click()');
  assert.match(await evaluate('location.pathname'),/^\/creator\/studio\/[a-f0-9-]{36}$/);
  await evaluate('document.querySelector(".st-editor-form button[type=submit]").click()');
  await until(()=>evaluate('document.querySelector(".st-save-state")?.dataset.unsaved==="false"'));
  const saved=await (await fetch(base+'/__state')).json();
  assert.equal(saved.projects[0].revision,2);
  assert.equal(saved.actions.filter(x=>x.method==='PATCH').length,1);
  await evaluate('document.querySelector(".st-project-settings").open=true');
  await evaluate('document.querySelector(".st-editor-modes button:last-child").click()');
  await until(()=>evaluate('!!document.querySelector(".st-editor-form input[type=url]")'));
  await check(width);await screenshot('studio-v053-advanced-'+width);
  await visit('/studio');
  await until(()=>evaluate('!!document.querySelector(".sl-return-action")&&document.querySelectorAll(".sl-project-card").length===1'));
  await check(width);await screenshot('studio-v053-resume-'+width);
  // V054: an actual starter now opens the structured block editor.
  await evaluate('document.querySelector(".sl-path-story").click()');
  await until(()=>evaluate('location.pathname.startsWith("/creator/studio/")&&!!document.querySelector(".wb-builder .wb-block")'));
  await evaluate('document.querySelector(".wb-builder").scrollIntoView({block:"start",behavior:"instant"})');
  await check(width);await screenshot('studio-v054-story-edit-'+width);
  const story=(await (await fetch(base+'/__state')).json()).projects.find(x=>x.category==='writing');
  assert.ok(story&&story.description.startsWith('ANEVUM_BLOCKS_V1\n'));
  assert.equal(story.revision,1);
  await evaluate('document.querySelector(".wb-switch button:last-child").click()');
  await until(()=>evaluate('document.querySelector(".wb-preview-paper h3")?.textContent?.includes("Your story title")'));
  await evaluate('document.querySelector(".wb-preview").scrollIntoView({block:"start",behavior:"instant"})');
  await check(width);await screenshot('studio-v054-story-preview-'+width);
  // Content is rendered as text, never interpreted as HTML or JavaScript.
  await evaluate('document.querySelector(".wb-switch button:first-child").click()');
  await until(()=>evaluate('!!document.querySelector(".wb-builder textarea")'));
  await evaluate('document.querySelector(".wb-builder textarea").focus()');
  await c.send('Input.insertText',{text:'<img src=x onerror=alert(1)>'});
  await until(()=>evaluate('document.querySelector(".st-save-state")?.dataset.unsaved==="true"'));
  await evaluate('document.querySelector(".wb-switch button:last-child").click()');
  await until(()=>evaluate('document.querySelector(".wb-preview-paper")?.textContent?.includes("<img src=x onerror=alert(1)>")'));
  assert.equal(await evaluate('document.querySelectorAll(".wb-preview-paper img,.wb-preview-paper iframe,.wb-preview-paper script").length'),0);
  await evaluate('document.querySelector(".st-editor-form button[type=submit]").click()');
  await until(()=>evaluate('document.querySelector(".st-save-state")?.dataset.unsaved==="false"'));
  const storySaved=(await (await fetch(base+'/__state')).json()).projects.find(x=>x.category==='writing');
  assert.equal(storySaved.revision,2);
  assert.ok(storySaved.description.includes('<img src=x onerror=alert(1)>'));
  // The branching story scene navigation is a local declarative interaction.
  await visit('/studio');await until(()=>evaluate('document.querySelectorAll(".sl-path-card").length===5'));
  await evaluate('document.querySelector(".sl-path-choices").click()');

  await until(()=>evaluate('!!document.querySelector(".wb-builder")'));
  await evaluate('document.querySelector(".wb-switch button:last-child").click()');
  await until(()=>evaluate('!!document.querySelector(".wb-choice")'));
  await evaluate('document.querySelector(".wb-preview").scrollIntoView({block:"start",behavior:"instant"})');
  await screenshot('studio-v054-choice-start-'+width);
  await evaluate('document.querySelector(".wb-choice").click()');
  await until(()=>evaluate('document.querySelector(".wb-preview-paper .wb-scene-heading")?.textContent?.includes("The Archive")'));
  assert.equal(await evaluate('document.querySelectorAll(".wb-preview-paper iframe,.wb-preview-paper script").length'),0);
  await evaluate('document.querySelector(".wb-preview").scrollIntoView({block:"start",behavior:"instant"})');
  await check(width);await screenshot('studio-v054-choice-target-'+width);
  // V054.2: one-click blank creation starts with a truly empty canvas.
  await visit('/studio');
  await until(()=>evaluate('!!document.querySelector(".sl-landing-actions .sl-primary")'));
  await evaluate('document.querySelector(".sl-landing-actions .sl-primary").click()');
  await until(()=>evaluate('!!document.querySelector(".wb-blank")'));
  const blank=(await (await fetch(base+'/__state')).json()).projects.find(x=>x.title==='Untitled creation');
  assert.ok(blank&&blank.description.includes('"blocks":[]'));
  await check(width);await screenshot('studio-v0542-blank-'+width);
  await evaluate('document.querySelector(".wb-tools button:first-child").click()');
  await until(()=>evaluate('!!document.querySelector(".wb-inline-text")'));
  await evaluate('document.querySelector(".wb-inline-text").focus()');
  await c.send('Input.insertText',{text:'My first creation starts here.'});
  await until(()=>evaluate('document.querySelector(".st-save-state")?.dataset.unsaved==="true"'));
  await evaluate('document.querySelector(".st-canvas-form button[type=submit]").click()');
  await until(()=>evaluate('document.querySelector(".st-save-state")?.dataset.unsaved==="false"'));
  await check(width);await screenshot('studio-v0542-writing-'+width);
  console.log('STUDIO_V054_WORKBENCH_'+width+'=PASS');
  console.log('STUDIO_V053_INTERACTIVE_'+width+'=PASS');
 }
 console.log('STUDIO_V053_LOCAL_ONLY_BROWSER_QA=PASS');
}finally{
 try{c?.close();}catch{}
 child.kill('SIGKILL');await new Promise(r=>server.close(r));
 rmSync(profile,{recursive:true,force:true});
}

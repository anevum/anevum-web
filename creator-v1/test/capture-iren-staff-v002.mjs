// IREN V002 — browser contract with local synthetic identity and records only.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync,statSync,mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {join,resolve,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';

const args=process.argv.slice(2);
const option=(key)=>{const idx=args.indexOf(key);return idx<0?null:args[idx+1]};
const chrome=option('--chrome'),out=option('--output'),dist=resolve('creator-v1/dist/staff');
if(!chrome||!out||!existsSync(join(dist,'index.html')))throw Error('Missing Chrome, output folder or built IREN assets');
mkdirSync(out,{recursive:true});
const now=Math.floor(Date.now()/1000);
const mock={
 role:'owner',memberId:'fixture-founder',room:'operations',checkedAt:now,
 invitations:[],tasks:[],messages:[],canvas:[],history:[],peers:[],
 roster:[{id:'fixture-founder',name:'Synthetic Founder',handle:'fixture_founder',role:'owner'}],
 memberMetrics:{total:2,verified:2,profiles:1,new24h:0,new7d:2,new30d:2},
 eligibleMembers:[{id:'fixture-second',name:'Synthetic Second',handle:'fixture_second'}],
 invitationMode:'manual-only',liveMode:'short-poll',callMode:'peer-preview'
};
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png',
 '.svg':'image/svg+xml','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2'};
const json=(res,data,status=200)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data))};
const server=createServer((req,res)=>{
 try{
  const url=new URL(req.url||'/', 'http://127.0.0.1');
  if(url.pathname==='/api/v1/member/auth/get-session')return json(res,{
   user:{id:'fixture-founder',name:'Synthetic Founder',email:'synthetic@anevum.invalid',emailVerified:true,
    createdAt:'2026-10-17T00:00:00Z',updatedAt:'2026-10-17T00:00:00Z'},
   session:{id:'synthetic-non-deployable-session',userId:'fixture-founder',
    createdAt:'2026-10-17T00:00:00Z',updatedAt:'2026-10-17T00:00:00Z',expiresAt:'2027-01-01T00:00:00Z'}
  });
  if(url.pathname==='/api/v1/member/staff-ops')return json(res,{...mock,room:url.searchParams.get('room')||'operations'});
  if(url.pathname==='/api/v1/member/forum-review')return json(res,{
   threads:[],replies:[],reports:[],recent:[],totals:{threads:0,replies:0,reports:0},checkedAt:now
  });
  if(url.pathname.startsWith('/api/'))return json(res,{error:'Fixture-only API'},404);
  const suffix=url.pathname.startsWith('/staff/assets/')?url.pathname.slice('/staff'.length):'/index.html';
  const file=resolve(dist,'.'+decodeURIComponent(suffix));
  if(file!==join(dist,'index.html')&&!file.startsWith(dist+sep))return json(res,{error:'Outside fixture'},404);
  if(!existsSync(file)||!statSync(file).isFile())return json(res,{error:'File not found'},404);
  res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});
  res.end(readFileSync(file));
 }catch(error){console.error(error);return json(res,{error:'Synthetic fixture error'},500)}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const profile=mkdtempSync(join(tmpdir(),'iren-v002-cdp-'));
const browser=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
 '--disable-background-networking','--remote-allow-origins=*','--remote-debugging-port=0',
 '--no-first-run','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,ms=20000){const end=Date.now()+ms;while(Date.now()<end){try{const v=await fn();if(v)return v}catch{}await delay(120)}throw Error('IREN browser readiness timed out')}
function connect(url){return new Promise((resolve,reject)=>{
 const ws=new WebSocket(url),pending=new Map();let id=0;
 ws.addEventListener('open',()=>resolve({send(method,params={}){
  return new Promise((ok,no)=>{const key=++id;pending.set(key,{ok,no});ws.send(JSON.stringify({id:key,method,params}))})
 },close(){ws.close()}}),{once:true});
 ws.addEventListener('message',event=>{const x=JSON.parse(String(event.data)),p=pending.get(x.id);if(!p)return;pending.delete(x.id);x.error?p.no(Error(x.error.message)):p.ok(x.result||{})});
 ws.addEventListener('error',()=>reject(Error('IREN CDP connection failed')),{once:true});
})}
let c;
try{
 const port=await until(()=>{const path=join(profile,'DevToolsActivePort');return existsSync(path)?readFileSync(path,'utf8').split('\n')[0]:null});
 const ws=await until(async()=>{const d=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();return d.find(x=>x.type==='page')?.webSocketDebuggerUrl});
 c=await connect(ws);await c.send('Page.enable');await c.send('Runtime.enable');
 const evaluate=async expression=>{
  const result=await c.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error('Browser evaluation exception');
  return result.result?.value;
 };
 for(const [width,height] of [[1440,900],[390,844],[320,720]]){
  await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=390});
  await c.send('Page.navigate',{url:base+'/staff'});
  try{
   await until(()=>evaluate("Boolean(document.querySelector('.ir-screen .ir-overview'))"),14000);
  }catch(error){
   const diagnosis=await evaluate("({path:location.pathname,body:document.body.innerText.slice(0,1600),html:document.documentElement.outerHTML.slice(0,200)})").catch(()=>({error:'Inspection unavailable'}));
   console.error('IREN_SYNTHETIC_BROWSER_GATE',JSON.stringify(diagnosis));
   throw error;
  }
  const layout=await evaluate("(()=>{const e=document.querySelector('.ir-screen');const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,viewportW:innerWidth,viewportH:innerHeight,locked:getComputedStyle(document.documentElement).overflow==='hidden',nav:document.querySelectorAll('.ir-nav>button').length,founder:document.body.innerText.includes('CREATOR PROFILES'),overflow:e.scrollWidth>e.clientWidth+2}})()");
  assert.equal(layout.nav,7,JSON.stringify({width,layout}));
  assert.equal(layout.locked,true,JSON.stringify({width,layout}));
  assert.equal(layout.overflow,false,JSON.stringify({width,layout}));
  assert.equal(layout.founder,true,JSON.stringify({width,layout}));
  assert.ok(layout.left>=-1&&layout.top>=-1&&layout.right<=width+2&&layout.bottom<=height+2,JSON.stringify({width,layout}));
  await evaluate("document.querySelectorAll('.ir-nav>button')[2].click()");
  await until(()=>evaluate("Boolean(document.querySelector('canvas.ir-canvas'))"));
  await evaluate("document.querySelectorAll('.ir-nav>button')[6].click()");
  await until(()=>evaluate("Boolean(document.querySelector('.ir-role-form'))"));
  await evaluate("document.querySelectorAll('.ir-nav>button')[0].click()");
  await until(()=>evaluate("Boolean(document.querySelector('.ir-overview'))"));
  const shot=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  assert.ok(shot.data?.length>5000);
  writeFileSync(join(out,'iren-v002-'+width+'.png'),Buffer.from(shot.data,'base64'));
  console.log('IREN_V002_SYNTHETIC_LAYOUT_'+width+'=PASS');
 }
 console.log('IREN_V002_SYNTHETIC_BROWSER_QA=PASS');
}finally{
 try{c?.close()}catch{}
 browser.kill('SIGKILL');await new Promise(resolve=>server.close(resolve));
 try{rmSync(profile,{force:true,recursive:true,maxRetries:10,retryDelay:150})}
 catch(error){console.warn('IREN_CHROMIUM_TEMP_CLEANUP_WARNING',String(error))}
}

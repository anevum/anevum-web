// V041 forum browser acceptance: all test people and content are synthetic.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join,extname} from 'node:path';
import {fixture} from './helpers/canonical-fixture.mjs';
import {canonicalForums} from '../canonical-auth/forums.mjs';

const argv=process.argv.slice(2),opt=x=>{const at=argv.indexOf(x);return at<0?null:argv[at+1]};
const chrome=opt('--chrome'),out=opt('--output');
if(!chrome||!out)throw Error('Provide --chrome and --output');
mkdirSync(out,{recursive:true});
const {db,env}=fixture();
db.exec(readFileSync(new URL('../canonical-auth/migrations/0006_member_community_forums.sql',import.meta.url),'utf8'));
env.CANONICAL_FORUM_ENABLED='true';env.CANONICAL_FORUM_REVIEWER_IDS='reviewer';
const id=()=>crypto.randomUUID();
function seed(key,handle,visibility='public'){
 db.prepare('INSERT INTO "user"(id,name,email,emailVerified,createdAt,updatedAt) VALUES(?,?,?,1,1,1)')
  .run(key,handle,key+'@synthetic.invalid');
 db.prepare('INSERT INTO member_creator_profiles(user_id,handle,display_name,bio,visibility,created_at,updated_at) VALUES(?,?,?,?,?,1,1)')
  .run(key,handle,'Fixture '+handle,'',visibility);
 return {id:key,emailVerified:true};
}
const author=seed('author','orbit_writer'),reader=seed('reader','orbit_reader');
const reviewer=seed('reviewer','orbit_reviewer'),privateUser=seed('private','private_orbit','private');
const queueAuthor=seed('queueauthor','orbit_queue_author');
const origin='https://a.anevum.com';
const request=(path,method='GET',body)=>new Request(origin+path,{
 method,headers:{origin,...(body?{'content-type':'application/json'}:{})},
 body:body===undefined?undefined:JSON.stringify(body)
});
const created=await canonicalForums(request('/api/v1/community/threads','POST',{
 requestId:id(),topic:'games',title:'Making accessible game worlds',
 body:'How can makers collaborate on accessible games for players with different abilities?'
}),env,author,1000);
assert.equal(created.status,201);const threadId=(await created.json()).id;
assert.equal((await canonicalForums(request('/api/v1/member/forum-review','POST',{
 targetKind:'thread',targetId:threadId,action:'publish'
}),env,reviewer,1001)).status,200);
const reply=await canonicalForums(request('/api/v1/community/threads/'+threadId+'/replies','POST',{
 requestId:id(),body:'Test controls, subtitles, color contrast and reduced motion early in development.'
}),env,reader,1002);
assert.equal(reply.status,201);const replyId=(await reply.json()).id;
assert.equal((await canonicalForums(request('/api/v1/member/forum-review','POST',{
 targetKind:'reply',targetId:replyId,action:'publish'
}),env,reviewer,1003)).status,200);
// Twenty-four extra approved forum entries exercise verified pagination.
for(let i=0;i<24;i++)db.prepare("INSERT INTO member_forum_threads(id,author_id,client_request_id,topic,title,body,status,created_at,published_at,updated_at) VALUES(?,?,?,?,?,?,'published',?,?,?)")
 .run(id(),author.id,id(),'games','Synthetic forum discussion '+String(i).padStart(2,'0'),
  'An independently approved synthetic thread for cursor and responsive testing.',1100+i,1100+i,1100+i);
db.prepare("INSERT INTO member_forum_threads(id,author_id,client_request_id,topic,title,body,status,created_at,published_at,updated_at) VALUES(?,?,?,?,?,?,'published',?,?,?)")
 .run(id(),privateUser.id,id(),'games','PRIVATE THREAD MUST NEVER APPEAR',
  'Hidden content from a private member must never be public.',1300,1300,1300);
// Fixture-only pending cases and independently reported published thread.
const pendingResult=await canonicalForums(request('/api/v1/community/threads','POST',{
 requestId:id(),topic:'making',title:'Accessible member tools and software',
 body:'How can we create a more accessible software workshop for the community?'
}),env,queueAuthor,1400);
assert.equal(pendingResult.status,201);const pendingThread=(await pendingResult.json()).id;
const ownResult=await canonicalForums(request('/api/v1/community/threads','POST',{
 requestId:id(),topic:'community',title:'Second reviewer required for staff content',
 body:'A moderator should not publish their own contribution without a separate reviewer.'
}),env,reviewer,1401);
assert.equal(ownResult.status,201);const selfThread=(await ownResult.json()).id;
assert.equal((await canonicalForums(request('/api/v1/community/reports','POST',{
 targetKind:'thread',targetId:threadId,reason:'unsafe'
}),env,reader,1402)).status,201);
const initialQueue=await (await canonicalForums(request('/api/v1/member/forum-review'),env,reviewer,1403)).json();
assert.equal(initialQueue.totals.threads,2);assert.equal(initialQueue.totals.reports,1);
assert.equal(initialQueue.threads.find(x=>x.id===selfThread).canPublish,false);

// Backlog is fixture-only; actual posting rate limits are not changed.
for(let i=0;i<63;i++)db.prepare("INSERT INTO member_forum_threads(id,author_id,client_request_id,topic,title,body,status,created_at,updated_at) VALUES(?,?,?,?,?,?,'pending_review',?,?)")
 .run(id(),queueAuthor.id,id(),'community','Backlog item '+String(i).padStart(3,'0'),
  'Fixture-only discussion for the V043 moderator paging controls.',1450+i,1450+i);
const backlog=await (await canonicalForums(request('/api/v1/member/forum-review'),env,reviewer,1550)).json();
assert.equal(backlog.totals.threads,65);
assert.equal(backlog.threads.length,50);
assert.ok(backlog.nextCursors.threads);

const dist=resolve('creator-v1/dist/web');assert.ok(existsSync(join(dist,'index.html')));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp',
 '.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.woff':'font/woff'};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://127.0.0.1');
    if(u.pathname==='/api/v1/member/auth/get-session'){
   res.statusCode=200;res.setHeader('content-type','application/json');
   res.setHeader('cache-control','no-store');
   res.end(JSON.stringify({
    session:{id:'synthetic-v042-session',userId:'reviewer',expiresAt:'2035-01-01T00:00:00.000Z',createdAt:'2026-10-16T00:00:00.000Z',updatedAt:'2026-10-16T00:00:00.000Z'},
    user:{id:'reviewer',name:'Fixture Reviewer',email:'reviewer@synthetic.invalid',emailVerified:true,createdAt:'2026-10-16T00:00:00.000Z',updatedAt:'2026-10-16T00:00:00.000Z'}
   }));return;
  }
  if(u.pathname==='/api/v1/member/forum-review'){
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const body=Buffer.concat(chunks).toString('utf8');
   const response=await canonicalForums(new Request(origin+u.pathname+u.search,{
    method:req.method,headers:{origin,'content-type':'application/json'},
    body:req.method==='POST'?body:undefined
   }),env,reviewer,1600+Math.floor(Math.random()*100));
   res.statusCode=response.status;
   for(const [key,value] of response.headers)res.setHeader(key,value);
   res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  if(u.pathname.startsWith('/api/v1/community/threads')){
   const response=await canonicalForums(new Request(origin+u.pathname+u.search),env);
   res.statusCode=response.status;
   for(const [k,v] of response.headers)res.setHeader(k,v);
   res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  if(u.pathname.startsWith('/api/')){
   res.statusCode=404;res.setHeader('content-type','application/json');
   res.end('{"error":"Fixture endpoint unavailable"}');return;
  }
  const path=resolve(dist,'.'+decodeURIComponent(u.pathname));
  const selected=path.startsWith(dist+'/')&&existsSync(path)&&statSync(path).isFile()?path:join(dist,'index.html');
  res.setHeader('content-type',mime[extname(selected)]||'application/octet-stream');
  res.end(readFileSync(selected));
 }catch(e){console.error(e);res.statusCode=500;res.end('Synthetic fixture failed');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const temp=mkdtempSync(join(tmpdir(),'anevum-v043-moderator-pagination-browser-'));
const profile=join(temp,'chrome');
const child=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu',
 '--disable-background-networking','--remote-allow-origins=*','--remote-debugging-port=0',
 '--no-first-run','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,timeout=23000){
 const end=Date.now()+timeout;
 while(Date.now()<end){try{const x=await fn();if(x)return x}catch{}await delay(120)}
 throw Error('V041 browser timed out');
}
function connect(url){
 return new Promise((resolve,reject)=>{
  const ws=new WebSocket(url),pending=new Map();let counter=0;
  ws.addEventListener('open',()=>resolve({
   send(method,params={}){
    const key=++counter;return new Promise((res,rej)=>{
     pending.set(key,{res,rej});ws.send(JSON.stringify({id:key,method,params}));
    });
   },close(){ws.close();}
  }),{once:true});
  ws.addEventListener('message',event=>{
   const data=JSON.parse(String(event.data)),item=pending.get(data.id);
   if(!item)return;pending.delete(data.id);
   data.error?item.rej(Error(data.error.message)):item.res(data.result||{});
  });
  ws.addEventListener('error',()=>reject(Error('CDP connection failed')),{once:true});
 });
}
const result={fixture:'synthetic local-only',version:'V043',widths:[],
 staffSession:false,initialWindow:0,afterLoad:0,noDuplicateIds:false,
 secondReviewerRequired:false,moreLinkGone:false,localSearchScope:false};
let client=null;
try{
 const port=await until(()=>{const p=join(profile,'DevToolsActivePort');return existsSync(p)?readFileSync(p,'utf8').split('\n')[0]:null;});
 const socket=await until(async()=>{
  const list=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();
  return list.find(p=>p.type==='page')?.webSocketDebuggerUrl;
 });
 client=await connect(socket);
 await client.send('Page.enable');await client.send('Runtime.enable');
 async function evaluate(expression){
  const r=await client.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.text||'Browser JS exception');
  return r.result?.value;
 }
 async function goto(path){
  await client.send('Page.navigate',{url:base+path});
  await until(()=>evaluate("document.readyState==='complete'"));
 }
 await goto('/community/review');
 await until(()=>evaluate("!!document.querySelector('.mc-console .mc-metrics')"));
 result.staffSession=true;
 const totals=await evaluate("[...document.querySelectorAll('.mc-metrics strong')].map(x=>x.textContent.trim())");
 assert.deepEqual(totals,['65','0','1']);
 await evaluate("document.querySelector('.mc-rail .mc-nav:nth-child(2)').click()");
 await until(()=>evaluate("document.querySelectorAll('.mc-case').length===50"));
 result.initialWindow=await evaluate("document.querySelectorAll('.mc-case').length");
 assert.equal(result.initialWindow,50);
 assert.equal(await evaluate("document.querySelectorAll('.mc-case .mc-approve:disabled').length"),1);
 result.secondReviewerRequired=true;
 assert.equal(await evaluate("document.querySelector('.mc-scope')?.textContent?.includes('50 loaded / 65 open threads')"),true);
 assert.equal(await evaluate("document.querySelector('.mc-page-foot button')?.textContent?.includes('LOAD MORE')"),true);

 for(const [width,height] of [[1440,900],[1024,768],[390,844],[320,720]]){
  await client.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=390});
  await delay(190);
  await evaluate("document.querySelector('.mc-summary').scrollIntoView({block:'start'})");
  await delay(220);
  const layout=await evaluate("(()=>{const e=document.querySelector('.mc-console');const r=e.getBoundingClientRect();return {viewport:innerWidth,left:r.left,right:r.right,overflow:e.scrollWidth>e.clientWidth+2,hasSummary:!!document.querySelector('.mc-metrics')}})()");
  assert.equal(layout.overflow,false,JSON.stringify({width,...layout}));
  assert.ok(layout.left>=-2&&layout.right<=width+3,JSON.stringify(layout));
  const shot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  assert.ok(shot.data);
  writeFileSync(join(out,'moderator-pagination-'+width+'.png'),Buffer.from(shot.data,'base64'));
  result.widths.push({width,...layout});
 }
 await evaluate("document.querySelector('.mc-page-foot button').click()");
 await until(()=>evaluate("document.querySelectorAll('.mc-case').length===65"));
 result.afterLoad=await evaluate("document.querySelectorAll('.mc-case').length");
 assert.equal(result.afterLoad,65);
 result.moreLinkGone=await evaluate("!document.querySelector('.mc-page-foot button')");
 assert.equal(result.moreLinkGone,true);
 assert.equal(await evaluate("document.querySelectorAll('.mc-case .mc-approve:disabled').length"),1);
 const queue=await (await canonicalForums(request('/api/v1/member/forum-review'),env,reviewer,1800)).json();
 const next=await (await canonicalForums(request('/api/v1/member/forum-review?'+new URLSearchParams({lane:'threads',after:queue.nextCursors.threads})),env,reviewer,1801)).json();
 assert.equal(new Set([...queue.threads,...next.items].map(x=>x.id)).size,65);
 result.noDuplicateIds=true;
 result.localSearchScope=await evaluate("document.body.textContent.includes('Search filters currently loaded records only')");
 assert.equal(result.localSearchScope,true);
 writeFileSync(join(out,'acceptance.json'),JSON.stringify(result,null,2));
 console.log('V043_MODERATOR_PAGINATION_BROWSER=PASS');
 }catch(e){console.error('V043_MODERATOR_PAGINATION_BROWSER_FAILED='+String(e));throw e}
finally{
 client?.close();
 child.kill();
 await new Promise(resolve=>{
  if(child.exitCode!==null||child.signalCode!==null){resolve();return}
  const timer=setTimeout(resolve,4000);
  child.once('exit',()=>{clearTimeout(timer);resolve()});
 });
 await new Promise(resolve=>server.close(()=>resolve()));
 db.close();
 try{rmSync(temp,{recursive:true,force:true,maxRetries:20,retryDelay:200})}
 catch(e){console.warn('Temporary Chrome profile cleanup deferred: '+String(e?.code||e));}
}

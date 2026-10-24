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
// Synthetic approved activity only. Public reputation is guarded by the same visibility and showStats projection.
env.CANONICAL_REPUTATION_ENABLED='true';
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
// Review-only, independently vetted synthetic author customizations. No live grants.
db.exec(readFileSync(new URL('../canonical-auth/migrations/0010_player_recognition.sql',import.meta.url),'utf8'));
db.exec(readFileSync(new URL('../canonical-auth/migrations/0011_verified_roles_v081.sql',import.meta.url),'utf8'));
db.prepare("UPDATE member_recognition_preferences SET badge_mode='curated',badge_ids_json='[\"accessibility_builder\"]',medal_id='first_light',ribbon_ids_json='[\"makers_service\"]',aura='nebula' WHERE user_id=?").run(author.id);
for(const [kind,id] of [['badge','accessibility_builder'],['medal','first_light'],['ribbon','makers_service']]){
 db.prepare('INSERT INTO member_recognition_grants(user_id,kind,recognition_id,earned_at,granted_by,evidence_ref,reviewed_by) VALUES(?,?,?,?,?,?,?)')
  .run(author.id,kind,id,1120,'synthetic_moderation','test-only-reviewed-evidence','synthetic_independent_reviewer');
}
db.prepare('INSERT INTO member_role_grants(user_id,role,granted_at,granted_by,reviewed_by,evidence_ref) VALUES(?,?,?,?,?,?)')
 .run(author.id,'curator',1120,'synthetic_moderation','synthetic_independent_reviewer','test-only-role-evidence');
env.CANONICAL_RECOGNITION_ENABLED='true';env.CANONICAL_VERIFIED_ROLES_ENABLED='true';
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
const dist=resolve('creator-v1/dist/web');assert.ok(existsSync(join(dist,'index.html')));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp',
 '.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.woff':'font/woff'};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://127.0.0.1');
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
const temp=mkdtempSync(join(tmpdir(),'anevum-v041-browser-'));
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
const result={fixture:'synthetic',widths:[],authorCards:false,authorDossiers:false,
 publicWallLinks:false,contributionDisclosure:false,compactHeight:null,
 customizedAura:false,visibleEarnedArt:false,threadNavigation:false,
 homeWayfinder:false,pagination:false,privateThreadExcluded:false};
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
 await goto('/community');
 await until(()=>evaluate("document.querySelectorAll('.cf-forums .cf-thread').length===20"));
 const first=await evaluate("(()=>{const c=document.querySelector('.cf-list .cf-author-dossier');return {count:document.querySelectorAll('.cf-forums .cf-thread').length,more:!!document.querySelector('.cf-more'),secret:document.body.innerText.includes('PRIVATE THREAD MUST NEVER APPEAR'),author:!!document.querySelector('.cf-author .av61-specimen .level-emblem'),dossiers:document.querySelectorAll('.cf-list .cf-author-dossier').length,rep:!!c?.querySelector('.av81-reputation-token'),wall:c?.querySelector('.cf-author-dossier-visit')?.getAttribute('href'),details:!!c?.querySelector('.cf-author-dossier-details'),aura:c?.getAttribute('data-aura'),badge:!!c?.querySelector('.av65-badge-rack'),medal:!!c?.querySelector('.av65-medal-slot'),ribbon:!!c?.querySelector('.av65-ribbon-rack'),role:!!c?.querySelector('.av81-role-token')}})()");
 assert.equal(first.count,20);assert.equal(first.more,true);
 assert.equal(first.secret,false);assert.equal(first.author,true);
 assert.equal(first.dossiers,20,'Each approved forum thread has one meaningful author dossier');
 assert.equal(first.wall,'/@orbit_writer','Public author link must lead to their canonical wall');
 assert.equal(first.rep,true,'Only server-validated, opted-in earned reputation is displayed');
 assert.equal(first.details,true,'The public profile uses a native keyboard-accessible disclosure');
 assert.equal(first.aura,'nebula','The chosen public member aura reaches the actual compact strip');
 assert.equal(first.badge,true,'The member selected earned badge is still rendered in the compact bar');
 assert.equal(first.medal,true,'The independently reviewed medal remains in the compact bar');
 assert.equal(first.ribbon,true,'The chosen earned ribbon remains in the compact bar');
 assert.equal(first.role,true,'The independently verified public role remains visible');
 result.authorCards=true;result.authorDossiers=true;result.publicWallLinks=true;
 result.customizedAura=true;result.visibleEarnedArt=true;result.privateThreadExcluded=true;
 await evaluate("document.querySelector('.cf-more').click()");
 await until(()=>evaluate("document.querySelectorAll('.cf-forums .cf-thread').length===25"));
 result.pagination=true;
 await evaluate("document.querySelectorAll('.cf-forums .cf-thread h3 a')[24].click()");
 await until(()=>evaluate("!!document.querySelector('.cf-detail .cf-fullbody')"));
 assert.equal(await evaluate("!!document.querySelector('.cf-detail .cf-author .av61-specimen .level-emblem')"),true);
 assert.equal(await evaluate("!!document.querySelector('.cf-detail .cf-author-dossier--detail .cf-author-dossier-visit')"),true);
 assert.equal(await evaluate("!!document.querySelector('.cf-detail .cf-author-dossier--reply')"),true);
 result.threadNavigation=true;
 await client.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await evaluate("(()=>{const e=document.querySelector('.cf-detail');window.scrollTo(0,e.getBoundingClientRect().top+window.scrollY-82)})()");
 await delay(220);
 const detailShot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 writeFileSync(join(out,'forum-detail-390.png'),Buffer.from(detailShot.data,'base64'));
 const beforeExpand=await evaluate("(()=>{const e=document.querySelector('.cf-detail .cf-author-dossier--detail');const d=e?.querySelector('details');return {height:e?.getBoundingClientRect().height,closed:!d?.open,links:e?.querySelectorAll('a').length,colors:e?.getAttribute('data-aura')}})()");
 assert.ok(beforeExpand.closed,'The additional author dossier should be collapsed on entry');
 assert.ok(beforeExpand.height<170,'Compact customized member bar must remain short on phone: '+JSON.stringify(beforeExpand));
 assert.equal(beforeExpand.links,1,'Single canonical public wall action, no nested links');
 result.compactHeight=beforeExpand.height;
 const disclosures=await evaluate("(()=>{const entry=document.querySelector('.cf-detail .cf-author-dossier--detail details');if(!entry)return {open:false,counts:0};entry.querySelector('summary').click();return {open:entry.open,counts:entry.querySelectorAll('.cf-author-dossier-activity>span').length,chosen:entry.innerText.includes('Nebula'),award:entry.innerText.includes('Accessibility Builder')}})()");
 assert.equal(disclosures.open,true);
 assert.equal(disclosures.counts,4,'Only four bounded, public approved-activity counters');
 assert.equal(disclosures.chosen,true,'Public cosmetic choice is readable when expanded');
 assert.equal(disclosures.award,true,'Only independently verified selected earned awards appear when expanded');
 result.contributionDisclosure=true;
 const openShot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 writeFileSync(join(out,'forum-author-contributions-390.png'),Buffer.from(openShot.data,'base64'));
 await evaluate("document.querySelector('.cf-detail .cf-author-dossier--detail summary').click()");
 await delay(130);
 const collapsedShot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 writeFileSync(join(out,'forum-author-compact-390.png'),Buffer.from(collapsedShot.data,'base64'));
 await goto('/');
 // V079 deliberately removes the old forum-highlights panel from the
 // homepage. Forum author cards are verified above on real thread routes;
 // the homepage now supplies direct community navigation instead.
 await until(()=>evaluate("document.querySelectorAll('.av79-gateway').length===4&&!!document.querySelector('.av79-home .av79-hero')"));
 result.homeWayfinder=true;
 await client.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await evaluate("document.querySelector('.av79-gateways').scrollIntoView({block:'start'})");
 await delay(350);
 const homePosition=await evaluate("(()=>{const r=document.querySelector('.av79-gateways').getBoundingClientRect();return {top:r.top,bottom:r.bottom,community:!!document.querySelector('.av79-gateway[href*=community]'),overflow:document.documentElement.scrollWidth>innerWidth+1}})()");
 assert.ok(homePosition.top<844&&homePosition.bottom>75&&!homePosition.overflow&&homePosition.community,JSON.stringify(homePosition));
 result.homeCaptureVisible=true;
 const homeShot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 writeFileSync(join(out,'forum-home-wayfinder-390.png'),Buffer.from(homeShot.data,'base64'));
 await goto('/community');
 await until(()=>evaluate("document.querySelectorAll('.cf-forums .cf-thread').length===20"));
 for(const [width,height] of [[1440,900],[1024,768],[390,844],[320,720]]){
  await client.send('Emulation.setDeviceMetricsOverride',
   {width,height,deviceScaleFactor:1,mobile:width<=390});
  await delay(200);
  await evaluate("(()=>{const e=document.querySelector('.cf-forums');window.scrollTo(0,e.getBoundingClientRect().top+window.scrollY-84)})()");
  await delay(160);
  const layout=await evaluate("(()=>{const e=document.querySelector('.cf-forums');const r=e.getBoundingClientRect();return {viewport:innerWidth,left:r.left,right:r.right,overflow:e.scrollWidth>e.clientWidth+2,cards:document.querySelectorAll('.cf-forums .cf-thread').length}})()");
  assert.equal(layout.overflow,false,JSON.stringify({width,...layout}));
  assert.ok(layout.left>=-2&&layout.right<=width+3,JSON.stringify(layout));
  const authorLayout=await evaluate("(()=>{const a=document.querySelector('.cf-list .cf-author-dossier');const r=a?.getBoundingClientRect();return {height:r?.height,overflow:a?.scrollWidth>a?.clientWidth+2,art:!!a?.querySelector('.av61-specimen'),auralabel:a?.getAttribute('data-aura')}})()");
  assert.equal(authorLayout.overflow,false,'Identity must not overflow at '+width);
  assert.equal(authorLayout.auralabel,'nebula','User aura remains selected at '+width);
  assert.ok(authorLayout.height < (width<=320?196:width<=390?174:156),'Forum author bar is not compact at '+width+': '+JSON.stringify(authorLayout));
  const shot=await client.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  assert.ok(shot.data);writeFileSync(join(out,'forum-'+width+'.png'),Buffer.from(shot.data,'base64'));
  result.widths.push({width,...layout});
 }
 // Turning the feature off must remove the new forum without hiding the legacy community.
 env.CANONICAL_FORUM_ENABLED='false';
 await goto('/community');
 await until(()=>evaluate("!!document.querySelector('.ch7-hub')&&!document.querySelector('.cf-forums')"));
 result.disabledHidesForum=true;
 writeFileSync(join(out,'acceptance.json'),JSON.stringify(result,null,2));
 console.log('V041_CANONICAL_FORUM_GUEST_BROWSER=PASS');
}catch(e){console.error('V041_FORUM_BROWSER_FAILED='+String(e));throw e}
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

/** Loopback-only synthetic native API fixture. Never part of a Worker build.
 * All data and identities below are disposable test doubles, not real users.
 */
import {createServer} from 'node:http';
const origin='http://127.0.0.1:4179',upstream='http://127.0.0.1:4178';
export const ids={project:'11111111-1111-4111-8111-111111111111',live:'22222222-2222-4222-8222-222222222222',draft:'33333333-3333-4333-8333-333333333333',newProject:'44444444-4444-4444-8444-444444444444',newRelease:'55555555-5555-4555-8555-555555555555',otherRelease:'66666666-6666-4666-8666-666666666666'};
export const members={owner:'00000000000000000000000000000099',reviewer:'00000000000000000000000000000098',other:'00000000000000000000000000000097'};
const runtime='https://anevum-package-alpha-v003-runtime.devonakins.workers.dev';
const now=()=>Math.floor(Date.now()/1000);
const sample=()=>({id:ids.project,title:'SIGNAL ATLAS / SYNTHETIC QA',summary:'An offline interaction fixture for the native ANEVUM Creator Studio. Not a real published project.',category:'app',status:'published',version:2,updatedAt:now(),publishedAt:now()-86400,coverUrl:null,liveReleaseId:ids.live,draftReleaseId:ids.draft,draftStatus:'ready',draftTitle:'SIGNAL ATLAS / PRIVATE REVISION',draftSummary:'A synthetic private update for testing the complete creator workflow.',draftCategory:'app',retention:'test',expiresAt:now()+172800,reviewReason:null});
const publicProject=p=>({id:p.id,title:p.title,summary:p.summary,category:p.category,status:p.status,version:1,updatedAt:p.updatedAt,publishedAt:p.publishedAt,coverUrl:null,liveReleaseId:p.liveReleaseId});
function json(res,data,status=200){res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data));}
export function createNativeFixture({responseFor=null}={}){
 let actor='owner',mode='ready',projects=[sample()];const requests=[];
 const control={
  set(next){actor=next.actor??actor;mode=next.mode??'ready';if(next.reset)projects=[sample()];if(mode==='pending')projects[0].draftStatus='pending_review';if(mode==='stale')projects[0].draftReleaseId=ids.otherRelease;},
  trace(){return requests.map(x=>({...x}));},
  state(){return {actor,mode,projects:structuredClone(projects)};}
 };
 const server=createServer(async(req,res)=>{
  try{
   if(req.headers.host!=='127.0.0.1:4179')return json(res,{error:'Loopback test only'},403);
   const url=new URL(req.url,origin),path=url.pathname;
   const document=responseFor?.(url);
   if(document){
    if(req.method!=='GET')return json(res,{error:'Synthetic document is read-only'},405);
    res.writeHead(200,{'content-type':document.type+'; charset=utf-8','cache-control':'no-store','x-anevum-test-fixture':'synthetic-only'});
    return res.end(document.body);
   }
   // Existing canonical Studio layout, with no real accounts or project writes.
   if(path==='/api/v1/member/health'){
    if(mode==='hang-canonical')return; // request abort closes the disposable connection
    return json(res,{status:'ready',studioReady:true,studioUploadsReady:false});
   }
   if(path==='/api/v1/member/creator-profile')return actor==='guest'?json(res,{error:'Sign in'},401):json(res,{memberId:members[actor],profile:{handle:mode==='canonical-records'?'v103_'+actor:'v099_layout',displayName:'Synthetic Studio Layout',bio:'',headline:'',worldTheme:'continuance',focus:[],visibility:'private',revision:0,createdAt:now(),updatedAt:now()}});
   if(path==='/api/v1/member/studio/projects'&&req.method==='GET')return actor==='guest'?json(res,{error:'Sign in'},401):json(res,{projects:mode==='canonical-records'&&actor==='owner'?[{id:ids.project,title:'OWNER PRIVATE RECORD',summary:'Disposable account isolation marker.',slug:'private-marker',category:'games',status:'draft',revision:1,createdAt:now(),updatedAt:now()}]:[],uploadsReady:false,canReview:actor==='reviewer'});
   if(path==='/api/v1/member/auth/get-session')return json(res,actor==='guest'?null:{user:{id:members[actor],name:'SYNTHETIC '+actor,email:actor+'@anevum.invalid',emailVerified:true,createdAt:'2026-10-20T00:00:00Z',updatedAt:'2026-10-20T00:00:00Z'},session:{id:'synthetic-v095-not-an-authentication-token',userId:members[actor],expiresAt:'2030-01-01T00:00:00Z',createdAt:'2026-10-20T00:00:00Z',updatedAt:'2026-10-20T00:00:00Z'}});
   if(path.startsWith('/upload/v3/api/v1/packages/')){
    const sub=path.slice('/upload/v3/api/v1/packages/'.length);
    requests.push({actor,path,method:req.method});
    if(mode==='hang-native'&&sub==='native/session')return;
    if(mode==='unavailable')return json(res,{error:'Synthetic native service unavailable; no work changed.'},503);
    if(mode==='html'){res.writeHead(200,{'content-type':'text/html'});return res.end('<html>SYNTHETIC sign-in response</html>');}
    if(sub==='projects'&&req.method==='GET')return json(res,{projects:projects.filter(p=>p.status==='published').map(p=>({id:p.id,title:p.title,summary:p.summary,category:p.category,version:1,cover_url:null}))});
    const creator=/^creators\/(v091_other|v091_private)\/projects$/.exec(sub);
    if(creator){if(creator[1]==='v091_private')return json(res,{error:'Not found'},404);return json(res,{handle:creator[1],projects:projects.filter(p=>p.status==='published').map(p=>({id:p.id,title:p.title,summary:p.summary,category:p.category,version:1,cover_url:null,play_url:'/upload/v3/play/'+p.id,published_at:p.publishedAt}))});}
    const envelope={contract:'native-creator-v095',memberId:members[actor]};
    if(sub==='native/session')return actor==='guest'?json(res,{error:'Sign in'},401):json(res,{...envelope,canUpload:actor==='owner',canReview:['owner','reviewer'].includes(actor),resourceProtection:true});
    if(sub==='native/mine')return actor!=='owner'?json(res,{error:'Pilot creator required'},403):json(res,{...envelope,projects,usage:{memberPhysicalBytes:8192,memberPhysicalLimit:209715200,pilotPhysicalBytes:8192,pilotPhysicalLimit:536870912,cleanupPending:0}});
    if(sub==='native/review')return !['owner','reviewer'].includes(actor)?json(res,{error:'Reviewer required'},403):json(res,{...envelope,pending:projects.filter(p=>p.draftStatus==='pending_review'),moderation:projects.filter(p=>!!p.liveReleaseId)});
    const play=/^native\/projects\/([0-9a-f-]{36})$/.exec(sub);
    if(play){
     const p=projects.find(p=>p.id===play[1]),preview=url.searchParams.get('preview')==='1';
     if(!p||p.status==='suspended'||preview&&(!p.draftReleaseId||!['owner','reviewer'].includes(actor))||!preview&&!p.liveReleaseId)return json(res,{error:'Project unavailable.'},404);
     const releaseId=preview?p.draftReleaseId:p.liveReleaseId;
     return json(res,{...envelope,memberId:preview?members[actor]:null,project:preview?p:publicProject(p),preview,
      release:{id:releaseId,version:preview?2:1,status:preview?p.draftStatus:'published',fileCount:1,expandedBytes:600,archiveSha256:preview?'a'.repeat(64):null},canEdit:preview&&actor==='owner',canReview:preview&&actor==='reviewer'&&p.draftStatus==='pending_review',runtimeUrl:runtime+(preview?'/p/'+releaseId+'/'+'b'.repeat(64):'/r/'+releaseId)+'/index.html',expiresAt:preview?now()+(mode==='expiry'?2:900):null});
    }
    if(req.method==='POST'){
     const parts=[];let size=0;for await(const part of req){size+=part.length;if(size>2*1048576)return json(res,{error:'Synthetic fixture limit'},413);parts.push(part);}const bytes=Buffer.concat(parts);
     if(sub==='upload'){
      if(actor!=='owner')return json(res,{error:'Pilot required'},403);
      if(mode==='upload-error')return json(res,{error:'Synthetic upload quota. Your selected file and title are preserved.'},429);
      const form=await new Request(origin,{method:'POST',headers:{'content-type':req.headers['content-type']},body:bytes}).formData();
      if(form.get('rights_ack')!=='yes'||!form.get('file'))return json(res,{error:'Rights and file required'},422);
      const p={...sample(),id:ids.newProject,title:String(form.get('title')),draftTitle:String(form.get('title')),summary:String(form.get('summary')),draftSummary:String(form.get('summary')),category:String(form.get('category')),status:'draft',liveReleaseId:null,publishedAt:null,draftReleaseId:ids.newRelease};projects.push(p);
      return json(res,{id:p.id,release_id:p.draftReleaseId,status:'ready'},201);
     }
     const actionPath=/^projects\/([0-9a-f-]{36})\/(save|submit|discard|review|moderate)$/.exec(sub);
     if(actionPath){
      const p=projects.find(x=>x.id===actionPath[1]),body=JSON.parse(bytes.toString('utf8'));
      if(!p)return json(res,{error:'Not found'},404);
      requests.at(-1).action=body.action;requests.at(-1).expectedRelease=body.expected_release_id;
      const expected=['suspend','restore'].includes(body.action)?p.liveReleaseId:p.draftReleaseId;
      if(body.expected_release_id!==expected)return json(res,{error:'The submitted release changed. Reopen and review the actual build.'},409);
      if(['publish','reject'].includes(body.action)&&actor!=='reviewer')return json(res,{error:'Independent reviewer required'},403);
      if(body.action==='save'){p.retention='saved';p.expiresAt=null;return json(res,{saved:true});}
      if(body.action==='submit'){p.draftStatus='pending_review';return json(res,{status:'pending_review'});}
      if(body.action==='discard'){p.draftReleaseId=null;p.draftStatus=null;return json(res,{discarded:true});}
      if(body.action==='publish'){p.status='published';p.liveReleaseId=p.draftReleaseId;p.draftReleaseId=null;p.draftStatus=null;return json(res,{status:'published'});}
      if(body.action==='reject'){p.draftReleaseId=null;p.draftStatus=null;p.reviewReason=body.reason;return json(res,{status:'rejected'});}
      if(body.action==='suspend'){p.status='suspended';return json(res,{status:'suspended'});}
      if(body.action==='restore'){p.status='published';return json(res,{status:'published'});}
     }
    }
    return json(res,{error:'Unknown synthetic endpoint'},404);
   }
   const headers={accept:req.headers.accept||'*/*'};if(req.headers.cookie)headers.cookie=req.headers.cookie;
   const upstreamResponse=await fetch(upstream+req.url,{headers,redirect:'manual'});
   const h=Object.fromEntries(upstreamResponse.headers);delete h['content-encoding'];delete h['content-length'];delete h['transfer-encoding'];
   res.writeHead(upstreamResponse.status,h);res.end(Buffer.from(await upstreamResponse.arrayBuffer()));
  }catch(e){json(res,{error:'Synthetic fixture error: '+e.message},500);}
 });
 return {control,async start(){await new Promise((ok,fail)=>{server.once('error',fail);server.listen(4179,'127.0.0.1',ok);});},async close(){
  const closed=new Promise(resolve=>server.close(resolve));
  // Hung-read tests intentionally leave a socket open. Close it before waiting
  // for shutdown, otherwise a successful recovery test never exits.
  server.closeAllConnections();await closed;
 }};
}

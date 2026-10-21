/**
 * Disposable loopback-only Creator Workbench browser fixture.
 * No Better Auth tokens, real accounts, stored user bytes or production Worker routes.
 * Backend authorization is independently tested against SQLite fixtures.
 */
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';

const HOST='127.0.0.1',PORT=4181,UPSTREAM='http://127.0.0.1:4178';
const person={
 owner:{id:'00000000000000000000000000000099',handle:'owner',name:'Owner'},
 pilot:{id:'00000000000000000000000000000098',handle:'pilot',name:'Pilot'},
 other:{id:'00000000000000000000000000000097',handle:'other',name:'Other'}
};
const now=()=>Math.floor(Date.now()/1000);
const reply=(res,body,status=200)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex,nofollow'});res.end(JSON.stringify(body))};
const row=(p,grant)=>({memberId:p.id,handle:p.handle,displayName:p.name,revision:grant?.revision||0,enabled:grant?.enabled||0,expiresAt:grant?.expiresAt||null});
const minimal=(d,p,id,revision,time)=>({...d,id,revision,userId:p.id,status:'draft',createdAt:time,updatedAt:time,submittedAt:null});
async function body(req,max=24000){
 let chunks=[],total=0;
 for await(const piece of req){total+=piece.length;if(total>max)return null;chunks.push(piece);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return null;}
}
export function createWorkbenchBrowserFixture(){
 let actor='owner',grants=new Map(),projects=[],reads=[],requestCount=0;
 const control={
  setActor(next){if(!['owner','pilot','other','guest'].includes(next))throw Error('Unknown fixture actor');actor=next;},
  grant(name){const p=person[name];if(!p||name==='owner')throw Error('Invalid fixture grant');const before=grants.get(name);grants.set(name,{enabled:1,revision:(before?.revision||0)+1,expiresAt:now()+86400});},
  revoke(name){const before=grants.get(name);if(!before)return;grants.set(name,{...before,enabled:0,revision:before.revision+1,expiresAt:now()});},
  requests(){return structuredClone(reads);},
  projects(){return structuredClone(projects);},
  count(){return requestCount}
 };
 const server=createServer(async(req,res)=>{
  try{
   if(req.headers.host!==HOST+':'+PORT)return reply(res,{error:'Loopback only'},403);
   const url=new URL(req.url,'http://'+HOST+':'+PORT),path=url.pathname,method=req.method;
   if(path==='/api/v1/member/auth/get-session'){
    return reply(res,actor==='guest'?null:{user:{
      id:person[actor].id,name:'SYNTHETIC '+person[actor].name,email:actor+'@anevum.invalid',emailVerified:true,
      createdAt:'2026-10-20T00:00:00.000Z',updatedAt:'2026-10-20T00:00:00.000Z'
     },session:{id:'synthetic-browser-fixture',userId:person[actor].id,createdAt:'2026-10-20T00:00:00.000Z',updatedAt:'2026-10-20T00:00:00.000Z',expiresAt:'2030-01-01T00:00:00.000Z'}});
   }
   if(path.startsWith('/api/v1/member/workbench/')){
    requestCount++;reads.push({actor,path,method});
    if(actor==='guest')return reply(res,{error:'Verified sign-in required'},401);
    const p=person[actor],permit=actor==='owner'||(grants.get(actor)?.enabled===1&&grants.get(actor).expiresAt>now());
    if(path==='/api/v1/member/workbench/status'&&method==='GET')
     return reply(res,{memberId:p.id,allowed:!!permit,canManage:actor==='owner',level:actor==='owner'?'owner':permit?'tester':'none',expiresAt:actor==='owner'?null:permit?grants.get(actor).expiresAt:null,pilotCap:10,capabilities:{privateDrafts:permit,visualPreview:permit,ai:false,codeExecution:false,publish:false}});
    if(path==='/api/v1/member/workbench/access'){
     if(actor!=='owner')return reply(res,{error:'Owner required'},403);
     if(method==='GET')return reply(res,{members:[...grants.entries()].map(([key,g])=>row(person[key],g)),pilotCap:10});
     if(method==='POST'){
      const b=await body(req),key=Object.keys(person).find(k=>person[k].id===b?.memberId),prior=grants.get(key);
      if(!key||key==='owner'||!['grant','revoke'].includes(b.action)||![7,30].includes(b.days)||
         b.expectedRevision!==(prior?.revision||0)||typeof b.reason!=='string'||b.reason.length<10)
       return reply(res,{error:'Invalid synthetic grant'},422);
      const updated={enabled:b.action==='grant'?1:0,revision:(prior?.revision||0)+1,expiresAt:b.action==='grant'?now()+b.days*86400:now()};
      grants.set(key,updated);return reply(res,{ok:true,revision:updated.revision,enabled:updated.enabled,expiresAt:updated.expiresAt});
     }
    }
    if(path==='/api/v1/member/workbench/member'&&method==='GET'){
     if(actor!=='owner')return reply(res,{error:'Owner required'},403);
     const key=Object.keys(person).find(k=>person[k].handle===url.searchParams.get('handle'));
     return key?reply(res,{member:row(person[key],grants.get(key))}):reply(res,{error:'No eligible account'},404);
    }
    if(!permit)return reply(res,{error:'Invitation required'},403);
    const match=/^\/api\/v1\/member\/workbench\/projects(?:\/([0-9a-f-]{36}))?$/.exec(path);
    if(!match)return reply(res,{error:'Not a Workbench API'},404);
    const existing=match[1]?projects.find(x=>x.id===match[1]&&x.userId===p.id):null;
    if(method==='GET'&&!match[1])return reply(res,{projects:projects.filter(x=>x.userId===p.id),uploadsReady:false,canReview:false});
    if(method==='GET'&&match[1])return existing?reply(res,{project:existing,uploadsReady:false,reviewHistory:[]}):reply(res,{error:'Not found'},404);
    if(method==='POST'&&!match[1]){
     const b=await body(req);
     if(!b?.draft||!String(b.draft.description).startsWith('ANEVUM_BLOCKS_V1\n'))return reply(res,{error:'Invalid document'},422);
     const existingRequest=projects.find(x=>x.userId===p.id&&x.clientRequestId===b.clientRequestId);
     if(existingRequest)return reply(res,{project:existingRequest,replayed:true});
     const time=now(),value={...minimal(b.draft,p,randomUUID(),1,time),clientRequestId:b.clientRequestId};
     projects.unshift(value);return reply(res,{project:value,replayed:false},201);
    }
    if(method==='PATCH'&&existing){
     const b=await body(req);
     if(b?.revision!==existing.revision)return reply(res,{error:'A newer revision exists'},409);
     if(!b.draft||!String(b.draft.description).startsWith('ANEVUM_BLOCKS_V1\n'))return reply(res,{error:'Invalid document'},422);
     Object.assign(existing,b.draft,{revision:existing.revision+1,updatedAt:now()});return reply(res,{project:existing});
    }
    return reply(res,{error:'Not found'},404);
   }
   // Proxy only into the already-existing local fixture, never to Internet.
   const upstream=await fetch(UPSTREAM+req.url,{headers:{accept:req.headers.accept||'*/*'},redirect:'manual'});
   const headers=Object.fromEntries(upstream.headers.entries());
   for(const key of ['content-length','transfer-encoding','content-encoding','connection'])delete headers[key];
   res.writeHead(upstream.status,headers);
   res.end(Buffer.from(await upstream.arrayBuffer()));
  }catch(e){reply(res,{error:'Fixture service unavailable: '+e.message},500);}
 });
 return {control,async start(){await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(PORT,HOST,resolve);});},
 async close(){await new Promise(resolve=>server.close(resolve));server.closeAllConnections();}};
}

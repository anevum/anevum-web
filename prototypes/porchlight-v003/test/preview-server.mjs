/* LOCALHOST-ONLY, TEST-ONLY fixture bridge. Never deploy, import or run in a real Worker. */
import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPorchlightHandler} from '../../porchlight-v002/service.mjs';
import {SqliteD1, ORIGIN} from '../../porchlight-v002/test/harness.mjs';

if (process.env.PORCHLIGHT_FIXTURE_TEST_ONLY !== '1') throw Error('test_only_gate_closed');
const dir=resolve(fileURLToPath(new URL('..',import.meta.url)));
const db=new SqliteD1();
const at=()=> '2026-10-29T12:00:00.000Z';
const seed=(sql,...args)=>db.raw.prepare(sql).run(...args);
seed(`INSERT INTO porchlight_events (id,slug,title,region_label,public_from,starts_at,ends_at,status,created_at) VALUES(?,?,?,?,?,?,?,?,?)`,
 'demo-event','halloween-2026','Fictional Halloween Field Trial','Test Region','2026-10-25T00:00:00.000Z','2026-10-31T16:00:00.000Z','2026-11-01T02:00:00.000Z','open','2026-10-17T00:00:00.000Z');
for(const [code,label] of [['lantern-walk','Fictional Lantern Walk'],['oak-court','Fictional Oak Court']])
 seed('INSERT INTO porchlight_event_blocks(event_id,code,public_label) VALUES(?,?,?)','demo-event',code,label);
for(const [who,role] of [['moderator-A','reviewer'],['manager-A','manager']])
 seed('INSERT INTO porchlight_organizer_grants(event_id,principal_id,role,granted_at) VALUES(?,?,?,?)','demo-event',who,role,at());
const sessions=new Map(),cookies={};
for(const actor of ['host-A','host-B','moderator-A','manager-A']) {
 const token=randomBytes(32).toString('hex');
 sessions.set(token,Object.freeze({id:actor,verified:true,emailVerified:true,adultEligible:true}));
 cookies[actor]=token;
}
const h=createPorchlightHandler({
 resolveActor: async request => {
   const cookie=request.headers.get('cookie') || '';
   const token=cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('pv_fixture='))?.slice('pv_fixture='.length);
   return sessions.get(token) || null;
 },
 authorizeWriteQuota: async ()=>true,
 now:at,
});
const env={PORCHLIGHT_ORIGIN:ORIGIN,PORCHLIGHT_DATA_ENABLED:'true',PORCHLIGHT_DB:db};
const files={'/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/app.mjs':'app.mjs'};
const mime={'html':'text/html; charset=utf-8','css':'text/css; charset=utf-8','mjs':'text/javascript; charset=utf-8'};
const staticHeaders={
 'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer',
 'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'"
};
async function receive(req) {
 const chunks=[];let size=0;
 for await (const chunk of req) {size+=chunk.length;if(size>4096)throw Error('too_large');chunks.push(chunk);}
 return Buffer.concat(chunks);
}
const server=http.createServer(async(req,res)=>{
 try {
   const port=server.address().port;
   const actualOrigin=`http://127.0.0.1:${port}`;
   if(req.headers.host!==`127.0.0.1:${port}`){res.writeHead(403,staticHeaders).end('not_allowed');return;}
   const url=new URL(req.url,actualOrigin);
   if(Object.hasOwn(files,url.pathname)&&req.method==='GET'){
     const data=readFileSync(resolve(dir,files[url.pathname]));
     res.writeHead(200,{...staticHeaders,'content-type':mime[files[url.pathname].split('.').at(-1)]});res.end(data);return;
   }
   if(!url.pathname.startsWith('/v1/')){res.writeHead(404,staticHeaders).end('not_found');return;}
   const method=req.method.toUpperCase();
   if(!['GET','POST'].includes(method)){res.writeHead(405,staticHeaders).end('method_denied');return;}
   if(method==='POST' && req.headers.origin!==actualOrigin){res.writeHead(403,staticHeaders).end('origin_denied');return;}
   const body=method==='POST'?await receive(req):undefined;
   const headers=new Headers();
   if(req.headers.cookie)headers.set('cookie',req.headers.cookie);
   if(req.headers['content-type'])headers.set('content-type',req.headers['content-type']);
   if(method==='POST')headers.set('Origin',ORIGIN);
   // Fixed synthetic HTTPS origin ONLY inside this localhost test transport.
   const request=new Request(ORIGIN+url.pathname+url.search,{method,headers,...(body?{body}:{})});
   const answer=await h(request,env);
   const output=Buffer.from(await answer.arrayBuffer());
   const outgoing=Object.fromEntries(answer.headers.entries());
   res.writeHead(answer.status,{...staticHeaders,...outgoing});res.end(output);
 }catch(e){res.writeHead(e.message==='too_large'?413:503,staticHeaders).end('fixture_unavailable');}
});
server.listen(0,'127.0.0.1',()=>{
 console.log(JSON.stringify({port:server.address().port,cookies}));
});
process.on('SIGTERM',()=>{server.close();db.close();});

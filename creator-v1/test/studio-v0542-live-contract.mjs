// V054.2 read-only hosted acceptance: no credentials, writes, or project mutations.
import assert from 'node:assert/strict';
const root='https://a.anevum.com';
async function request(path){
 const response=await fetch(root+path,{redirect:'error',headers:{accept:'application/json'},signal:AbortSignal.timeout(15000),cache:'no-store'});
 const text=await response.text();
 return {status:response.status,type:response.headers.get('content-type')||'',text};
}
function check(condition,what){assert.ok(condition,what);console.log('PASS '+what);}
async function main(){
 const health=await request('/api/v1/member/health');
 check(health.status===200,'Member health is reachable');
 const h=JSON.parse(health.text);
 check(h.status==='ready'&&h.studioReady===true,'Creator Studio health ready');
 check(h.studioUploadsReady===false,'Media upload remains disabled');
 check(h.registration==='open','Registration still enabled');
 for(const path of ['/api/v1/member/studio/projects','/api/v1/member/studio/review','/api/v1/member/forum-review']){
  const r=await request(path);
  check(r.status===401,'Anonymous access denied: '+path);
 }
 for(const path of ['/studio','/studio/new','/join']){
  const r=await request(path);
  check(r.status===200&&r.text.includes('id="root"'),'Frontend route responds: '+path);
 }
 const c=await request('/api/v1/community/threads');
 check(c.status===200,'Community remains reachable');
 const items=JSON.parse(c.text);
 check(Array.isArray(items.items)&&Object.hasOwn(items,'nextCursor'),'Community contract retained');
 console.log('V0542_LIVE_READ_ONLY_PREFLIGHT=PASS');
}
await main().catch(e=>{console.error('V0542_LIVE_READ_ONLY_PREFLIGHT=FAIL',e?.message||e);process.exitCode=1;});

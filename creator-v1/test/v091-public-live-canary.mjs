/** ANEVUM V091 / read-only live public canary.
 * Only anonymous GET/HEAD requests to known first-party endpoints.
 * Never modifies D1, auth, roles, XP, uploads, publishing or Cloudflare.
 */
import assert from 'node:assert/strict';
const ORIGIN='https://anevum.com';
const HANDLE='devonakins'; // Existing deliberately public founder member world.
const TIMEOUT=12000;
async function read(path,accept='application/json',method='GET'){
  const url=new URL(path,ORIGIN);
  assert.equal(url.origin,ORIGIN);
  assert.ok(['GET','HEAD'].includes(method));
  const response=await fetch(url,{method,redirect:'manual',cache:'no-store',credentials:'omit',
    headers:{Accept:accept},signal:AbortSignal.timeout(TIMEOUT)});
  return response;
}
async function json(path){
  const response=await read(path);
  assert.equal(response.status,200,path+' HTTP '+response.status);
  assert.match(response.headers.get('content-type')||'',/application\/json/i,path);
  return response.json();
}
const phase=(name,result)=>console.log('V091_LIVE_CANARY_'+name+'='+result);
const catalogue=await json('/api/v1/status');
assert.ok(Number.isSafeInteger(catalogue.counts?.publishedProjects)&&catalogue.counts.publishedProjects>=0);
phase('PUBLIC_CATALOGUE','PASS');
const releases=await json('/api/v1/projects?limit=24');
assert.ok(Array.isArray(releases.items));
const credited=releases.items.some(item=>item.creatorHandle===HANDLE&&typeof item.title==='string');
phase('PUBLIC_PROJECT_CREDIT',credited?'PASS':'NOT_PRESENT_IN_FIRST_PAGE');
const methods=await json('/api/v1/member/auth-methods');
assert.ok(['open','invite-only','closed'].includes(methods.registration));
phase('CANONICAL_AUTH_CAPABILITY','PASS');
const health=await json('/api/v1/member/health');
assert.equal(typeof health.status,'string');
phase('CANONICAL_MEMBER_HEALTH',health.status==='ready'?'READY':'NOT_READY');
const member=await json('/api/v1/members/'+HANDLE);
assert.equal(member.profile.handle,HANDLE);
phase('PUBLIC_MEMBER_WORLD','PASS');
const spaceResponse=await read('/api/v1/members/'+HANDLE+'/space');
if(spaceResponse.status===404){
  phase('EARNED_ARTWORK','SKIP_PRIVATE');
}else{
  assert.equal(spaceResponse.status,200,'Public member space status');
  const space=await spaceResponse.json();
  const level=space?.showStats===true&&Number.isSafeInteger(space?.stats?.level)
    ?space.stats.level:null;
  if(level===null){
    phase('EARNED_ARTWORK','SKIP_HIDDEN_STATS');
  }else{
    assert.ok(level>=1&&level<=30);
    const path='/api/v1/members/'+HANDLE+'/rewards/levels/'+level+'/card';
    const head=await read(path,'image/svg+xml','HEAD');
    assert.equal(head.status,200,'Protected public earned SVG HEAD: HTTP '+head.status);
    assert.match(head.headers.get('content-type')||'',/^image\/svg\+xml/i);
    assert.match(head.headers.get('cache-control')||'',/no-store/i);
    const get=await read(path,'image/svg+xml');
    assert.equal(get.status,200,'Protected public earned SVG GET: HTTP '+get.status);
    assert.match(get.headers.get('content-type')||'',/^image\/svg\+xml/i);
    const svg=await get.text();
    assert.ok(svg.startsWith('<svg ')&&svg.includes('</svg>'),'Approved SVG response is not complete');
    phase('EARNED_ARTWORK','PASS_LEVEL_'+level);
  }
}
phase('PRODUCTION_WRITES','ZERO');

// ANEVUM.IREN.BUILD.2026-10-17.004.STAFF-LIVE-ANONYMOUS-SMOKE
// Read-only check of current apex routing; never sends cookies, OAuth tokens,
// passwords, OTPs, session headers or POST bodies. Safe for public CI runners.
import assert from 'node:assert/strict';

const origin='https://anevum.com';
const timeout=AbortSignal.timeout(18000);
const checked=[];
async function get(path,accept='*/*'){
 const response=await fetch(origin+path,{
  method:'GET',redirect:'manual',cache:'no-store',
  headers:{accept,'user-agent':'ANEVUM-IREN-ReadOnly-Acceptance/1.0'},
  signal:timeout
 });
 checked.push({path,status:response.status});
 return response;
}
const home=await get('/','text/html');
assert.equal(home.status,200,'Existing public root must remain available');
assert.match(home.headers.get('content-type')||'',/text\/html/i);
const homeHtml=await home.text();
assert.match(homeHtml,/ANEVUM/i);

const page=await get('/staff','text/html');
assert.equal(page.status,200,'Staff document must be routed on apex');
assert.match(page.headers.get('content-type')||'',/text\/html/i);
assert.match(page.headers.get('cache-control')||'',/no-store/i);
assert.match(page.headers.get('x-robots-tag')||'',/noindex/i);
assert.match(page.headers.get('permissions-policy')||'',/microphone=\(self\)/i);
const staffHtml=await page.text();
assert.match(staffHtml,/<title>IREN\s*\/\s*ANEVUM Staff Command<\/title>/i);
const scriptPath=staffHtml.match(/(?:src|href)="(\/staff\/assets\/[A-Za-z0-9_.-]+\.js)"/)?.[1];
assert.ok(scriptPath,'Staff page must reference its own /staff/assets JS bundle');
const asset=await get(scriptPath,'text/javascript');
assert.equal(asset.status,200);
assert.match(asset.headers.get('content-type')||'',/javascript/i);
await asset.body?.cancel();

for(const path of ['/api/v1/member/staff-ops','/api/v1/member/forum-review']){
 const result=await get(path,'application/json');
 assert.equal(result.status,401,'Unauthenticated staff API must fail closed: '+path);
 assert.match(result.headers.get('cache-control')||'',/no-store/i);
 assert.equal(result.headers.get('access-control-allow-origin'),null);
 const body=await result.json();
 assert.ok(body&&typeof body.error==='string');
}
console.log('IREN_LIVE_ANONYMOUS_SMOKE=PASS');
console.log(JSON.stringify({checks:checked}));

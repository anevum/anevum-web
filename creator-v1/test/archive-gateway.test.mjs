import test from 'node:test';
import assert from 'node:assert/strict';
import gateway, { verifyArchiveAccess, archiveFetch, archivePathAllowed } from '../ops/archive-gateway.mjs';
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);jwk.kid='fixture-key';
const env={ACCESS_ISSUER:'https://fixture.cloudflareaccess.com',ACCESS_AUDIENCE:'fixture-audience',ACCESS_EMAILS:'owner@example.com'};
const b64=b=>Buffer.from(b).toString('base64url');
const now=1780000000;
async function token(overrides={}){const parts=[b64(JSON.stringify({alg:'RS256',kid:'fixture-key'})),b64(JSON.stringify({iss:env.ACCESS_ISSUER,aud:[env.ACCESS_AUDIENCE],email:'owner@example.com',iat:now-1,exp:now+3600,...overrides}))];parts.push(b64(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(parts.join('.')))));return parts.join('.');}
const keys=async()=>Response.json({keys:[jwk]});
test('correctly signed owner assertion is accepted',async()=>assert.equal(await verifyArchiveAccess(await token(),env,keys,now),true));
test('wrong audience and issuer are rejected',async()=>{await assert.rejects(()=>verifyArchiveAccess(awaitableWrong,env,keys,now));});
const awaitableWrong=await token({aud:['different']});
test('expired, premature, malformed and unauthorized assertions are rejected',async()=>{for(const claims of [{exp:now},{nbf:now+1},{iat:now+100},{email:'stranger@example.com'},{iss:'https://wrong.cloudflareaccess.com'}]){const t=await token(claims);await assert.rejects(()=>verifyArchiveAccess(t,env,keys,now));}await assert.rejects(()=>verifyArchiveAccess('not-a-jwt',env,keys,now));});
test('forged signature is rejected',async()=>{const t=await token();const pieces=t.split('.');pieces[2]=b64(new Uint8Array(256));await assert.rejects(()=>verifyArchiveAccess(pieces.join('.'),env,keys,now));});
test('account, broker, admin and arbitrary routes are not archived endpoints',()=>{for(const p of ['/api/member','/command/rhen','/studio','/login','/v1/orders','/assets/../secret'])assert.equal(archivePathAllowed(p),false,p);for(const p of ['/','/products/rhen','/about','/assets/example.js'])assert.equal(archivePathAllowed(p),true,p);});
test('no token fails closed before the retained service is reached',async()=>{const r=await archiveFetch(new Request('https://backstage.anevum.com/'),{...env,LEGACY:{fetch(){assert.fail('forwarded')}}});assert.equal(r.status,401);});
test('authenticated source forwarding strips credentials and response cookies',async()=>{const e={...env,LEGACY:{async fetch(r){assert.equal(r.headers.get('cookie'),null);assert.equal(r.headers.get('authorization'),null);assert.equal(r.headers.get('cf-access-jwt-assertion'),null);return new Response('<html><body>Archived public page</body></html>',{headers:{'content-type':'text/html','set-cookie':'unsafe=yes'}})}}};const r=await archiveFetch(new Request('https://backstage.anevum.com/',{headers:{cookie:'private=session',authorization:'Bearer private','cf-access-jwt-assertion':'test'}}),e,async()=>true);assert.equal(r.status,200);assert.equal(r.headers.get('set-cookie'),null);assert.ok((await r.text()).includes('read-only historical build'));});
test('writes and alternative hostnames are denied',async()=>{assert.equal((await archiveFetch(new Request('https://backstage.anevum.com/',{method:'POST'}),env)).status,405);assert.equal((await archiveFetch(new Request('https://unexpected.example/'),env)).status,404);});
test('authenticated private routes still remain disabled',async()=>{const r=await archiveFetch(new Request('https://backstage.anevum.com/api/member'),env,async()=>true);assert.equal(r.status,410);});

test('Cloudflare ExecutionContext is not confused with a verification callback',async()=>{const oldFetch=globalThis.fetch;globalThis.fetch=keys;try{const t=await token({exp:Math.floor(Date.now()/1000)+3600});const e={...env,LEGACY:{fetch:async()=>new Response('<html><body>Archive</body></html>',{headers:{'content-type':'text/html'}})}};const r=await gateway.fetch(new Request('https://backstage.anevum.com/',{headers:{'cf-access-jwt-assertion':t}}),e,{waitUntil(){}});assert.equal(r.status,200);}finally{globalThis.fetch=oldFetch;}});

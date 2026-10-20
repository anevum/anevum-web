import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {createPublicStageWorker} from '../creator-v1/web/a-staging-worker.mjs';
const ts=readFileSync(new URL('../creator-v1/web/src/lib/native-creator-v095.ts',import.meta.url),'utf8').replace("import.meta.env.VITE_NATIVE_CREATOR_STUDIO_V095==='true'",'true');
const client=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(ts)).toString('base64'));
const id='11111111-1111-4111-8111-111111111111',release='22222222-2222-4222-8222-222222222222';
const base='https://anevum-package-alpha-v003-runtime.devonakins.workers.dev';
const project=()=>({id,title:'Synthetic fixture',summary:'A synthetic record, not public content.',category:'game',status:'published',version:1,updatedAt:1760000000,publishedAt:1760000000,coverUrl:null,liveReleaseId:release});
const playback=()=>({contract:'native-creator-v095',memberId:'owner',project:project(),preview:true,release:{id:release,version:1,status:'ready',fileCount:1,expandedBytes:200,archiveSha256:'a'.repeat(64)},canEdit:true,canReview:false,runtimeUrl:base+'/p/'+release+'/'+'b'.repeat(64)+'/index.html',expiresAt:Math.floor(Date.now()/1000)+900});
async function mocked(fn,body,status=200,type='application/json'){
 const original=globalThis.fetch,calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response(typeof body==='string'?body:JSON.stringify(body),{status,headers:{'content-type':type}});};
 try{return await fn(calls);}finally{globalThis.fetch=original;}
}
test('native routes validate project IDs and keep the existing API namespace',()=>{
 assert.equal(client.PACKAGE_API,'/upload/v3/api/v1/packages');assert.equal(client.LEGACY_PACKAGE_REVIEW,'/upload/v3/review');
 assert.equal(client.nativePlayerPath(id,true),'/projects/package/'+id+'?preview=1');
 assert.equal(client.nativeBuildPath(id),'/studio/packages/'+id);
 for(const bad of ['../secret','//evil.example',id+'?owner=1',id.toUpperCase().replace('1','A'),'not-id'])assert.throws(()=>client.nativePlayerPath(bad));
});
test('runtime validator accepts only the reviewed execution origin and exact release capability shape',()=>{
 assert.equal(client.validRuntimeURL(base+'/r/'+release+'/index.html',release,false),true);
 assert.equal(client.validRuntimeURL(playback().runtimeUrl,release,true),true);
 for(const url of ['http://'+new URL(base).host+'/r/'+release+'/index.html','https://anevum.com/r/'+release+'/index.html','https://evil.example/r/'+release+'/index.html',base+'/r/'+id+'/index.html',base+'/r/'+release+'/index.html?leak=1',base+'/r/'+release+'/index.html#code',base.replace('https://','https://user@')+'/r/'+release+'/index.html'])assert.equal(client.validRuntimeURL(url,release,false),false,url);
 assert.equal(client.validRuntimeURL(base+'/p/'+release+'/wrong/index.html',release,true),false);
});
test('native DTO validation rejects foreign covers, malformed private fields and invalid statuses',()=>{
 assert.equal(client.validNativeProject(project()),true);
 for(const extra of [{id:'bad'},{category:'server'},{title:{html:'bad'}},{status:'deleted'},{coverUrl:'https://evil.example/x.png'},{draftTitle:{html:'bad'}},{draftStatus:'approved_by_xp'},{retention:'forever-public'},{expiresAt:-2}])assert.equal(client.validNativeProject({...project(),...extra}),false);
});
test('authenticated reads preserve only same-origin session semantics and require the exact member ID',async()=>{
 await mocked(async calls=>{
  const session=await client.readNativeSession('owner');assert.equal(session.memberId,'owner');
  assert.equal(calls.length,1);assert.equal(calls[0].url,'/upload/v3/api/v1/packages/native/session');
  assert.equal(calls[0].options.credentials,'same-origin');assert.equal(calls[0].options.redirect,'error');assert.equal(calls[0].options.cache,'no-store');
  assert.equal(calls[0].options.headers.authorization,undefined);
  await assert.rejects(()=>client.readNativeSession('other'),/account changed/);
 },{contract:'native-creator-v095',memberId:'owner',canUpload:true,canReview:false,resourceProtection:true});
});
test('an HTML or invalid backend response cannot masquerade as an authenticated success',async()=>{
 await mocked(async()=>assert.rejects(()=>client.readNativeSession('owner'),/unexpected response/),'<html>sign in</html>',200,'text/html');
 await mocked(async()=>assert.rejects(()=>client.readNativeSession('owner'),/not ready/),{ok:true});
 await mocked(async()=>assert.rejects(()=>client.readNativeSession('owner'),/invalid project data/),'not-json');
});
test('private playback is scoped to the observed canonical account and rejects expired capabilities',async()=>{
 await mocked(async()=>{
  assert.equal((await client.readNativePlayback(id,true,undefined,'owner')).memberId,'owner');
  await assert.rejects(()=>client.readNativePlayback(id,true,undefined,'other'),/account changed/);
 },playback());
 await mocked(async()=>assert.rejects(()=>client.readNativePlayback(id,true,undefined,'owner'),/expired/),{...playback(),expiresAt:1});
 await mocked(async()=>assert.rejects(()=>client.readNativePlayback(id,true,undefined,'owner'),/could not be verified/),{...playback(),runtimeUrl:'https://evil.example/app'});
});
test('a native decision includes the exact reviewed release and a mismatched receipt stays uncertain',async()=>{
 await mocked(async calls=>{
  await client.nativeBuildAction(id,release,'publish');assert.equal(calls.length,1);
  const {url,options}=calls[0];assert.equal(url,'/upload/v3/api/v1/packages/projects/'+id+'/review');
  assert.deepEqual(JSON.parse(options.body),{action:'publish',reason:'',expected_release_id:release});
  assert.equal(options.headers['x-anevum-package'],'v003');
 },{status:'published'});
 await mocked(async calls=>{await assert.rejects(()=>client.nativeBuildAction(id,release,'publish'),/could not be confirmed/);assert.equal(calls.length,1,'uncertain writes are never retried automatically');},{status:'pending_review'});
});
test('an unchanged approved upload returns a public-player disposition rather than an unavailable private preview',async()=>{
 await mocked(async()=>{const value=await client.uploadNativeBuild(new FormData());assert.equal(value.status,'published');},{id,release_id:release,status:'published',duplicate:true});
 await mocked(async()=>assert.rejects(()=>client.uploadNativeBuild(new FormData()),/uncertain/),{id,release_id:release,status:'unknown'});
});
test('file checks reject sources/executables, empty builds and oversized browser files',()=>{
 assert.equal(client.checkNativeFile(new File(['<html/>'],'game.html')),'');
 for(const file of [null,new File(['1'],'server.py'),new File([],'empty.zip'),new File([new Uint8Array(5*1048576+1)],'large.html')])assert.notEqual(client.checkNativeFile(file),'');
});
test('native iframe CSP is explicitly enabled, limited to the isolated runtime and preserves all existing protections',async()=>{
 const worker=createPublicStageWorker({hostname:'anevum.com'});
 const env={ASSETS:{async fetch(){return new Response('<!doctype html><html><div id="root"></div></html>',{headers:{'content-type':'text/html','set-cookie':'must-not-leak=1'}});}}};
 const request=()=>new Request('https://anevum.com/studio/packages');
 const off=await worker.fetch(request(),env,{});assert.doesNotMatch(off.headers.get('content-security-policy'),/frame-src /);
 env.PACKAGE_NATIVE_STUDIO_ENABLED='true';const on=await worker.fetch(request(),env,{}),csp=on.headers.get('content-security-policy');
 assert.match(csp,/frame-src https:\/\/anevum-package-alpha-v003-runtime\.devonakins\.workers\.dev;/);
 for(const directive of ["default-src 'none'","connect-src 'self'","frame-ancestors 'none'","object-src 'none'","script-src 'self'"])assert.ok(csp.includes(directive));
 assert.equal(on.headers.get('set-cookie'),null);assert.equal(on.headers.get('x-frame-options'),'DENY');
 assert.equal((await worker.fetch(new Request('https://anevum.com/api/v1/packages/native/session'),env,{})).status,404,'the presentation CSP change grants no API route');
});
test('native React screens use one shell and never inject creator markup or privilege-bearing browser state',()=>{
 const app=readFileSync(new URL('../creator-v1/web/src/App.tsx',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../creator-v1/web/src/pages/NativeCreatorStudio.tsx',import.meta.url),'utf8');
 const viewport=readFileSync(new URL('../creator-v1/web/src/components/IsolatedProjectViewport.tsx',import.meta.url),'utf8');
 assert.equal((app.match(/element={<Shell\/>}/g)||[]).length,1);
 for(const route of ['studio/packages','studio/packages/new','studio/packages/review','projects/package/:projectId'])assert.ok(app.includes('path="'+route+'"'));
 assert.doesNotMatch(ui,/dangerouslySetInnerHTML|localStorage|sessionStorage|<Shell|<IrenGuided/);
 assert.ok(ui.includes('state.key===key'),'old-account data must disappear in the account-changing render');
 assert.ok(viewport.includes('sandbox="allow-scripts allow-pointer-lock"'));
 assert.ok(!viewport.match(/sandbox="[^"]*allow-same-origin/));
 assert.ok(viewport.includes('referrerPolicy="no-referrer"'));
});

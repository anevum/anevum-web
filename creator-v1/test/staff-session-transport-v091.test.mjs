import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';

const require=createRequire(import.meta.url);
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const names=['anevum-iren-staff-entry-v003','anevum-profile-staff-access-v001',
 'anevum-iren-staff-session-status-v001','anevum-iren-apex-staff-v002','anevum-iren-staff-observatory-v001'];

test('staff identity checks execute in workerd and reject invalid identities and redirects',()=>{
 const temp=mkdtempSync(join(tmpdir(),'anevum-v091-staff-'));
 try {
  const helpers=['','\nexport {roleFor};','','\nexport {getVerifiedUser};','\nexport {getStaff};'];
  for(let i=0;i<names.length;i++) {
   const source=readFileSync(join(root,'creator-v1/operations',names[i]+'.mjs'),'utf8');
   assert.doesNotMatch(source,/redirect\s*:\s*["']error["']/);
   writeFileSync(join(temp,'worker'+i+'.mjs'),source+helpers[i]);
  }
  writeFileSync(join(temp,'auth.mjs'),`export default {fetch(request){
   const mode=(request.headers.get('cookie')||'').split('=').pop();
   if(mode==='redirect')return Response.redirect('https://blocked.invalid/',302);
   if(mode==='unavailable')return new Response('Unavailable',{status:503});
   if(mode==='limited')return new Response('Limited',{status:429});
   if(mode==='notjson')return new Response('<html>sign in</html>');
   const id=mode==='reviewer'?'reviewer':mode==='nonstaff'?'nonstaff':'owner';
   return Response.json({user:{id,emailVerified:mode!=='unverified'},
    session:{id:'synthetic-session',userId:mode==='mismatch'?'other':id,
     expiresAt:new Date(Date.now()+(mode==='expired'?-60000:60000)).toISOString()}});
  }};`);
  writeFileSync(join(temp,'test.mjs'),`
   import entry,{resolveAccess} from './worker0.mjs';
   import profile,{roleFor} from './worker1.mjs';
   import diagnostic from './worker2.mjs';
   import {getVerifiedUser} from './worker3.mjs';
   import observatory,{getStaff} from './worker4.mjs';
   function check(condition,message){if(!condition)throw Error(message);}
   const site='https://anevum.com';
   const request=(mode,path='/staff')=>new Request(site+path,{headers:mode?{cookie:'__Secure-anevum_can_apex.session_token='+mode}: {}});
   function database(){return {prepare(sql){check(/^SELECT /i.test(sql),'Only read-only grant lookups are permitted');
    check(/revoked_at IS NULL/.test(sql),'Revoked grants must be excluded');
    return {bind(id){return {async first(){return id==='nonstaff'?null:{role:id,email:id==='owner'?'devon@anevum.com':'reviewer@example.invalid'};}}}};}};}
   export default {async test(ctrl,bindings){
    let calls=0;
    const auth={fetch(req){calls++;check(req.redirect==='manual','Identity redirects must be inspected');
     check(req.cache==='no-store','Identity must not use a cache');
     check(req.url===site+'/api/v1/member/auth/get-session','Fixed canonical auth destination');
     check(!req.headers.has('authorization'),'Do not synthesize authentication');return bindings.AUTH.fetch(req);}};
    const env={APEX_AUTH:auth,AUTH:auth,MEMBER_DB:database(),DB:database(),STAFF:{fetch(){return new Response(null,{status:403});}}};
    for(const mode of ['owner','reviewer']){
     const req=request(mode);check((await resolveAccess(req,env)).role===mode,'Entry '+mode);
     const role=await roleFor(req,env);const result=await role.json();check(result.role===mode,'Profile '+mode);
     check(result.designation===(mode==='owner'?'founder':null),'Founder label is cosmetic');
     check((await getStaff(req,env)).role===mode,'Observatory '+mode);
     check((await getVerifiedUser(req,env)).id===mode,'Staff API '+mode);
     const page=await observatory.fetch(request(mode,'/staff/observatory'),env);check(page.status===200,'Staff page '+mode);
    }
    const before=calls;
    check((await resolveAccess(request(null),env)).status==='signed_out','Entry requires cookie');
    check((await roleFor(request(null),env)).status===401,'Profile requires cookie');
    check(await getStaff(request(null),env)===null,'Observatory requires cookie');
    check(await getVerifiedUser(request(null),env)===null,'API requires cookie');
    check(calls===before,'Missing cookie must not reach auth');
    for(const mode of ['redirect','unavailable','limited','notjson','unverified','mismatch','expired']){
     check((await resolveAccess(request(mode),env)).status!=='verified','Entry rejects '+mode);
     const role=await roleFor(request(mode),env);check(role.status!==200,'Profile rejects '+mode);
     check(await getStaff(request(mode),env)===null,'Observatory rejects '+mode);
     check(await getVerifiedUser(request(mode),env)===null,'API rejects '+mode);
     const page=await observatory.fetch(request(mode,'/staff/observatory'),env);check(page.status===401,'Staff page rejects '+mode);
     const status=await diagnostic.fetch(request(mode,'/__anevum_iren_staff_session_status_v001'),env);
     const data=await status.json();check(data.canonicalSession!=='verified','Diagnostic rejects '+mode);
     check(!JSON.stringify(data).includes('synthetic-session'),'No session data in diagnostic');
    }
    check((await resolveAccess(request('nonstaff'),env)).status==='not_staff','No entry without grant');
    check((await (await roleFor(request('nonstaff'),env)).json()).role===null,'No profile role without grant');
    check(await getStaff(request('nonstaff'),env)===null,'No Observatory without grant');
    const cross=new Request(site+'/__anevum_profile_staff_role_v001',{headers:{cookie:'__Secure-anevum_can_apex.session_token=owner',origin:'https://other.invalid','sec-fetch-site':'cross-site'}});
    check((await profile.fetch(cross,env)).status===403,'Cross-origin role lookup rejected');
    const status=await diagnostic.fetch(request('owner','/__anevum_iren_staff_session_status_v001'),env);
    const data=await status.json();check(data.canonicalSession==='verified'&&data.staffGrant==='owner'&&data.staffApi==='http_403','Diagnostic uses both service bindings');
    check(!('user' in data)&&!('session' in data)&&!JSON.stringify(data).includes('synthetic-session'),'Diagnostic stays redacted');
    check((await entry.fetch(request('owner'),env)).headers.get('location')==='/staff/observatory','Existing entry destination retained');
    console.log('V091_STAFF_RUNTIME: owner, reviewer, missing cookie, redirects, outages, rate limits, content type, verification, identity mismatch, expiry, grants, origin and redaction passed');
   }};
  `);
  const modules=['test.mjs',...names.map((_,i)=>'worker'+i+'.mjs')].map(name=>`(name=${JSON.stringify(name)},esModule=embed ${JSON.stringify(name)})`).join(',');
  const schema=require.resolve('workerd/workerd.capnp');
  writeFileSync(join(temp,'config.capnp'),`using Workerd=import ${JSON.stringify(schema)};
   const config :Workerd.Config=(services=[
    (name="test",worker=(modules=[${modules}],bindings=[(name="AUTH",service="auth")])),
    (name="auth",worker=(modules=[(name="auth.mjs",esModule=embed "auth.mjs")]))]);`);
  const bin=join(dirname(require.resolve('workerd/package.json')),'bin/workerd');
  const result=spawnSync(bin,['test','--compat-date=2026-09-28','-I/',join(temp,'config.capnp')],{encoding:'utf8',timeout:30000});
  assert.equal(result.status,0,result.error?.message||result.stdout+'\n'+result.stderr);
  assert.match(result.stdout+result.stderr,/V091_STAFF_RUNTIME/);
 } finally {rmSync(temp,{recursive:true,force:true});}
});

test('member navigation no longer exposes the retired XP test control',()=>{
 const source=readFileSync(join(root,'creator-v1/web/src/components/MemberSpaceDashboard.tsx'),'utf8');
 assert.doesNotMatch(source,/XP TEST|to=["']\/thebutton["']/);
 assert.match(source,/CREATOR STUDIO/);
 assert.match(source,/COMMUNITY/);
});

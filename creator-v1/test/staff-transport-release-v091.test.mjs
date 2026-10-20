import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {repairStaffTransport,digest,moduleSource,retainedDeployment} from '../ops/v091-staff-transport.mjs';
const spec=JSON.parse(readFileSync(new URL('../operations/staff-transport-v091.json',import.meta.url),'utf8'));
const candidate=w=>readFileSync(new URL('../operations/'+w.name+'.mjs',import.meta.url),'utf8');
function original(w){let text=candidate(w);for(const e of [...w.source_edits].reverse()){
 assert.equal(text.slice(e.offset,e.offset+e.after.length),e.after);
 assert.match(e.before,/^redirect\s*:\s*(["'])error\1$/);assert.equal(e.after,'redirect:"manual"');
 text=text.slice(0,e.offset)+e.before+text.slice(e.offset+e.after.length);
}return text;}
const context={GITHUB_REPOSITORY:'anevum/anevum-web',GITHUB_REF:'refs/heads/release/v084-continuance-approved-20261019',GITHUB_WORKFLOW:'ANEVUM V091 Guarded Continuance Experience Production'};
function fixture({drift=false,failAt=0,moduleDrift=false,format='multipart'}={}){
 const writes=[],states=new Map(spec.workers.map(w=>[w.name,{version:w.baseline_version,source:original(w)}]));
 const routes=structuredClone(spec.routes);
 const settings={bindings:[{name:'APEX_AUTH',type:'service',service:'anevum-apex-prelaunch-gateway',environment:'production'},
  {name:'MEMBER_DB',type:'d1',database_id:'e1d29049-c83b-4534-8355-dc1fa36ba6d8'},
  {name:'ASSETS',type:'assets'},{name:'EXISTING_FEATURE_FLAG',type:'plain_text',text:'preserve'}],
  compatibility_date:'2026-10-19',compatibility_flags:[],tags:[],tail_consumers:[],logpush:false};
 const api=async(method,path,body)=>{
  if(path.endsWith('/routes')){assert.equal(method,'GET');return routes;}
  const name=path.split('/scripts/')[1]?.split('/')[0],state=states.get(name);
  assert.ok(state,'Only the five named Workers may be accessed');
  if(method==='GET'){
   if(path.endsWith('/settings'))return structuredClone(settings);
   if(path.endsWith('/deployments'))return {deployments:[{versions:[{version_id:drift?'unexpected':state.version,percentage:100}]}]};
   if(format==='raw')return state.source;
   const module=moduleDrift?'unexpected.js':(spec.workers.find(w=>w.name===name).module_file||'index.mjs');
   const newline=format==='lf'?'\n':'\r\n';
   return ['--boundary','Content-Disposition: form-data; name="'+module+'"','',state.source,'--boundary--',''].join(newline);
  }
  writes.push({method,path,body});
  if(method==='PUT'){
   assert.equal(body.metadata.keep_assets,true);assert.deepEqual(body.metadata.bindings,settings.bindings);
   assert.equal(body.metadata.main_module,spec.workers.find(w=>w.name===name).module_file||'index.mjs');
   state.source=body.source;state.version='repaired-'+name;
   if(writes.filter(w=>w.method==='PUT').length===failAt)throw Error('Transport failed after upload');
  }else{
   assert.equal(method,'POST');assert.ok(path.endsWith('/deployments'));
   state.version=body.versions[0].version_id;state.source=original(spec.workers.find(w=>w.name===name));
  }
  return {};
 };
 return {api,writes,states,routes};
}
test('all checked-in staff sources differ from the pinned live baseline only in redirect mode',()=>{
 for(const w of spec.workers){assert.equal(digest(candidate(w)),w.candidate_sha256);assert.equal(digest(original(w)),w.baseline_sha256);}
});
test('default preflight is read-only and source/version drift stops every production write',async()=>{
 const f=fixture();assert.equal((await repairStaffTransport(f.api)).status,'verified_read_only');assert.equal(f.writes.length,0);
 const drift=fixture({drift:true});await assert.rejects(()=>repairStaffTransport(drift.api,{apply:true,context}),/drift/);assert.equal(drift.writes.length,0);
 await assert.rejects(()=>repairStaffTransport(f.api,{apply:true,context:{}}),/guarded production workflow/);assert.equal(f.writes.length,0);
 const changed=fixture({moduleDrift:true});await assert.rejects(()=>repairStaffTransport(changed.api,{apply:true,context}),/module layout/);
 assert.equal(changed.writes.length,0);
});
test('raw, LF and CRLF module downloads retain exact pinned source and module checks',async()=>{
 for(const format of ['raw','multipart','lf']){
  const f=fixture({format});
  assert.equal((await repairStaffTransport(f.api)).status,'verified_read_only');
  assert.equal(f.writes.length,0);
 }
 assert.equal(moduleSource('source','worker.js').module,'worker.js');
 assert.equal(moduleSource('--boundary\nContent-Disposition: form-data; name="worker.js"\n\nsource\n--boundary--\n','worker.js').source,'source');
 assert.throws(()=>moduleSource('--boundary\nContent-Disposition: form-data; name="worker.js"\n\nsource\n--boundary--\n'),/module layout/);
 assert.throws(()=>moduleSource('--boundary\nContent-Disposition: form-data; name="index.mjs"\n\nfirst\n--boundary\nContent-Disposition: form-data; name="other.mjs"\n\nsecond\n--boundary--\n'),/module count/);
});
test('guarded rollout preserves assets, bindings and routes and changes exactly the five scripts',async()=>{
 const f=fixture();assert.equal((await repairStaffTransport(f.api,{apply:true,context})).status,'repaired');
 assert.equal(f.writes.length,5);assert.ok(f.writes.every(w=>w.method==='PUT'));
 assert.equal(f.writes.filter(w=>w.body.metadata.main_module==='worker.js').length,1);
 assert.equal(f.writes.filter(w=>w.body.metadata.main_module==='index.mjs').length,4);
 for(const w of spec.workers)assert.equal(digest(f.states.get(w.name).source),w.candidate_sha256);
});
test('failure after an upload restores every attempted Worker to its recorded baseline',async()=>{
 const f=fixture({failAt:2});await assert.rejects(()=>repairStaffTransport(f.api,{apply:true,context}),/baseline deployments restored/);
 assert.equal(f.writes.filter(w=>w.method==='POST').length,2);
 for(const w of spec.workers)assert.equal(f.states.get(w.name).version,w.baseline_version);
});

test('reviewed Observatory V002 can only be retained at its exact version and source hash',()=>{
 const worker=spec.workers.find(w=>w.name==='anevum-iren-staff-observatory-v001');
 const kept=worker.retained_deployments[0];
 assert.equal(retainedDeployment(worker,kept.version,kept.sha256),true);
 assert.equal(retainedDeployment(worker,'unreviewed-version',kept.sha256),false);
 assert.equal(retainedDeployment(worker,kept.version,worker.candidate_sha256),false);
 assert.equal(retainedDeployment(spec.workers[0],kept.version,kept.sha256),false);
});
test('route identity and fail-closed limits are pinned even when the route count stays equal',async()=>{
 assert.equal(spec.routes.length,38);
 assert.ok(spec.routes.every(r=>r.request_limit_fail_open===false));
 for(const edit of [r=>r[0].script='unreviewed-worker',r=>r[0].pattern='anevum.com/unreviewed*',r=>r[0].request_limit_fail_open=true,r=>r.pop()]){
  const f=fixture();edit(f.routes);
  await assert.rejects(()=>repairStaffTransport(f.api,{apply:true,context}),/Live routes changed/);
  assert.equal(f.writes.length,0);
 }
});

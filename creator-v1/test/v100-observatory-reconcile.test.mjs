import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reconcile,decodeModules} from '../ops/v100-observatory-reconcile.mjs';
import {patchUi} from '../ops/v100-observatory-ui-candidate.mjs';
const candidate=readFileSync(new URL('../operations/anevum-iren-staff-observatory-v092.mjs',import.meta.url),'utf8');
const original=readFileSync(new URL('../operations/anevum-iren-staff-observatory-v001.mjs',import.meta.url),'utf8');
const prior='03b731d4-be7f-480c-80ad-c50683a2dc8f',id='11111111-1111-4111-8111-111111111111';
const privateValue='PRIVATE_BINDING_AND_ANNOTATION_DO_NOT_OUTPUT';
const b=[{name:'MEMBER_DB',type:'d1',database_id:'same-db'},{name:'PRIVATE',type:'plain_text',text:privateValue}];
const runtime={compatibility_date:'2026-01-01',compatibility_flags:[],usage_model:'standard'};
const modules=s=>[{name:'index.mjs',content_type:'application/javascript+module',content_base64:Buffer.from(s).toString('base64')}];
async function fixture(tamper=false,extra={}){
 const [patched]=await patchUi([{name:'index.mjs',source:original}],candidate);
 return async(path,json=true)=>{
  if(!json)return original;
  if(path.includes('?include=modules'))return {id:path.includes(prior)?prior:id,main_module:'index.mjs',bindings:b,...runtime,modules:modules(path.includes(prior)?original:patched.source+(tamper?'\n// unexpected server byte':'')),...path.includes(prior)?{}:extra};
  if(path.endsWith('/script-settings'))return {logpush:false,observability:{enabled:true},tags:[],tail_consumers:[]};
  if(path.endsWith('/settings'))return {bindings:b,...runtime,annotations:{'workers/message':privateValue}};
  if(path.endsWith('/versions?per_page=100'))return {items:[{id,metadata:{created_on:'2026-10-21T10:50:43Z'}},{id:prior,metadata:{created_on:'2026-10-20T01:00:00Z'}}]};
  if(path.includes('/versions/'))return {id:path.endsWith(prior)?prior:id,resources:{bindings:b,script_runtime:runtime},annotations:{'workers/message':privateValue}};
  if(path.endsWith('/deployments'))return {deployments:[{id:'fixture',versions:[{version_id:prior,percentage:100}]}]};
  if(path.endsWith('/subdomain'))return {enabled:false,previews_enabled:false};
  if(path.endsWith('/workers/routes'))return [];
  throw new Error('Unexpected fixture read');
 };
}
test('read-only recovery proves exact modules and does not publish private settings or invent a lost baseline',async()=>{
 const out=await reconcile(await fixture(),candidate);
 assert.equal(out.candidate_count_in_upload_window,1);assert.deepEqual(out.candidate_ids,[id]);
 assert.equal(out.candidate_modules_exactly_match_ui_patch,true);assert.equal(out.candidate_bindings_match_prior,true);
 assert.equal(out.candidate_runtime_matches_prior,true);assert.equal(out.state_stable_during_reconciliation,true);
 assert.equal(out.historical_pre_upload_snapshot_available,false);assert.equal(out.settings_change_from_failed_upload_unresolved,true);
 assert.equal(out.production_activated,false);assert.equal(out.physical_iphone_tested,false);
 assert.ok(!JSON.stringify(out).includes(privateValue));assert.ok(!JSON.stringify(out).includes(original));
});
test('any unexpected server byte in the already-uploaded candidate fails the source proof',async()=>{
 const out=await reconcile(await fixture(true),candidate);
 assert.equal(out.candidate_modules_exactly_match_ui_patch,false);
});
test('a new candidate-only configuration field is reported as a difference',async()=>{
 const out=await reconcile(await fixture(false,{limits:{cpu_ms:50}}),candidate);
 assert.deepEqual(out.candidate_version_fields_differ_from_prior,['limits']);
});
test('module recovery rejects noncanonical base64, unsafe names, duplicate modules and invalid UTF-8',()=>{
 for(const bad of [
  [{...modules('export default {};')[0],content_base64:'not base64'}],
  [{...modules('export default {};')[0],name:'../index.mjs'}],
  [...modules('export default {};'),...modules('export default {};')],
  [{...modules('export default {};')[0],content_base64:Buffer.from([255]).toString('base64')}]
 ])assert.throws(()=>decodeModules({modules:bad}));
});

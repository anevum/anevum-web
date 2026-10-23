import test from 'node:test';
import assert from 'node:assert/strict';
import {plannedBindings,configuration,verifyBaseline,verifyUploaded,APEX,TARGET,PUBLIC,PRIOR,NOTE} from '../ops/native-private-controller-v114.mjs';
export function fixtureBindings(){return [
 {name:'AUTH',type:'service',service:APEX,environment:'production'},
 {name:'DB',type:'d1',database_id:'00000000-0000-4000-8000-000000000001'},
 {name:'MEDIA',type:'r2_bucket',bucket_name:'synthetic-bucket'},
 {name:'PACKAGE_CANONICAL_AUTH_VERSION',type:'plain_text',text:'3ba8602c-6616-49a4-af29-1efe60ad164a'},
 {name:'PACKAGE_CREATOR_GALLERY_ENABLED',type:'plain_text',text:'true'},
 {name:'PACKAGE_NATIVE_STUDIO_ENABLED',type:'plain_text',text:'true'},
 {name:'PACKAGE_PREVIEW_KEY',type:'secret_text'},
 {name:'PACKAGE_PUBLIC_PUBLISH_ENABLED',type:'plain_text',text:'true'},
 {name:'PACKAGE_RESOURCE_PROTECTION_ENABLED',type:'plain_text',text:'true'},
 {name:'PILOT_IDS',type:'plain_text',text:'synthetic-pilot'},
 {name:'STAFF_IDS',type:'plain_text',text:'synthetic-reviewer'},
 {name:'RUNTIME_HOST',type:'plain_text',text:'runtime.example.test'},
 {name:'STAGING_CONTROL_HOST',type:'plain_text',text:'control.example.test'}
];}
function fixture(){
 const bs=fixtureBindings(),runtime={compatibility_date:'2026-10-18',usage_model:'standard'};
 return {deployment:{id:'6306bbbf-7954-4f91-850c-9b0edf89dca4',versions:[{version_id:PUBLIC,percentage:100},{version_id:PRIOR,percentage:0}]},
 live:{id:PUBLIC,resources:{script:{etag:'1bc2d678522f7eac92a273648db5cb9e36afac88a7813be53cdeebb08d5139e4'}}},
 prior:{id:PRIOR,resources:{bindings:bs,script:{etag:'dfae79f4474d1dc905b82d44c647725aabe52b7e8fe0b219bf1c777289ec9870'},script_runtime:runtime}},
 settings:{compatibility_date:'2026-10-18',bindings:structuredClone(bs)},exposure:{enabled:false,previews_enabled:false},
 routes:Array.from({length:40},(_,i)=>({pattern:'synthetic/'+i,script:'synthetic-worker'})),versions:[{id:PUBLIC},{id:PRIOR}],
 apexDeployment:{id:'6372ee35-8c7d-468c-9486-536d9c4b0a0d',versions:[{version_id:'93cc7f07-cf39-457e-af69-c9f6f4c02d25',percentage:100},{version_id:'6f26f0cc-6eee-483d-9f07-329e45bd5e76',percentage:0}]},
 apex:{id:TARGET,resources:{script:{etag:'bb20187a20e7174cfdf7451c24f4274a00bfa2c3e2570d29d9f9b3018682acc2'},bindings:[{name:'CANONICAL_CREATOR_UPLOADS_ENABLED',type:'plain_text',text:'false'},{name:'CANONICAL_XP_TEST_ENABLED',type:'plain_text',text:'false'}]}},
 entryDeployment:{id:'984dd104-3642-47f8-8983-0fde8a337ce9',versions:[{version_id:'406ef0ca-cfaa-411f-812d-1fb390b91ffc',percentage:100}]},entryExpiry:'1792711995',ruleVersion:'12',ruleExpiry:'1792711995'};
}
function uploaded(){const before=fixture(),after=structuredClone(before),bindings=plannedBindings(before.prior.resources.bindings),id='11111111-2222-4333-8444-555555555555';after.settings.bindings=structuredClone(bindings);after.versions.unshift({id});const candidate={id,annotations:{'workers/message':NOTE},resources:{bindings,script_runtime:before.prior.resources.script_runtime}};return {before,after,candidate};}
test('private plan repairs only AUTH pin and disables executable publishing, preserving roles and secret name',()=>{
 const bs=fixtureBindings(),planned=plannedBindings(bs),changed=planned.filter((x,i)=>JSON.stringify(x)!==JSON.stringify(bs[i])).map(x=>x.name);
 assert.deepEqual(changed,['PACKAGE_CANONICAL_AUTH_VERSION','PACKAGE_PUBLIC_PUBLISH_ENABLED']);
 assert.equal(planned.find(x=>x.name==='PACKAGE_CANONICAL_AUTH_VERSION').text,TARGET);
 const c=configuration(bs,'/repo/api.mjs');assert.equal(c.vars.PACKAGE_PUBLIC_PUBLISH_ENABLED,'false');assert.equal(c.vars.PACKAGE_NATIVE_STUDIO_ENABLED,'true');assert.ok(!('PACKAGE_PREVIEW_KEY' in c.vars));assert.deepEqual(c.routes,[]);assert.equal(c.workers_dev,false);assert.equal(c.preview_urls,false);
});
test('current closed-window baseline is accepted without declaring pin eligibility',()=>assert.equal(verifyBaseline(fixture()),true));
test('deployment, exposed previews, stale apex and changed closed-window conditions block preflight',()=>{
 for(const mutate of [s=>s.deployment.versions[0].percentage=99,s=>s.exposure.enabled=true,s=>s.apex.id='wrong',s=>s.ruleVersion='13',s=>s.ruleExpiry='1792711996',s=>s.entryDeployment.versions[0].version_id='other']){const s=fixture();mutate(s);assert.throws(()=>verifyBaseline(s));}
});
test('one new undeployed candidate preserves live controller and keeps publishing off',()=>{const f=uploaded(),r=verifyUploaded(f.before,f.after,f.candidate,'a'.repeat(64));assert.equal(r.publicPublishingEnabled,false);assert.equal(r.newVersionTrafficPercent,0);assert.equal(r.authPinEligibleInCurrentApexDeployment,false);assert.equal(r.productionReleaseApproved,false);});
test('secret loss, role expansion, incorrect pin and publishing activation are rejected',()=>{
 for(const mutate of [c=>c.resources.bindings.pop(),c=>c.resources.bindings.find(x=>x.name==='STAFF_IDS').text='extra-user',c=>c.resources.bindings.find(x=>x.name==='PACKAGE_CANONICAL_AUTH_VERSION').text=PRIOR,c=>c.resources.bindings.find(x=>x.name==='PACKAGE_PUBLIC_PUBLISH_ENABLED').text='true']){const f=uploaded();mutate(f.candidate);assert.throws(()=>verifyUploaded(f.before,f.after,f.candidate,'a'.repeat(64)));}
});
test('traffic, routing, entry renewal and operational changes cannot be hidden by upload',()=>{
 for(const mutate of [s=>s.deployment.versions[1].version_id='other',s=>s.apexDeployment.id='other',s=>s.routes[0].script='other',s=>s.settings.logpush=true,s=>s.entryExpiry='future']){const f=uploaded();mutate(f.after);assert.throws(()=>verifyUploaded(f.before,f.after,f.candidate,'a'.repeat(64)));}
});
test('zero or two introduced versions do not count as the intended upload',()=>{for(const n of [0,2]){const f=uploaded();f.after.versions=n===0?f.before.versions:[...f.after.versions,{id:'other'}];assert.throws(()=>verifyUploaded(f.before,f.after,f.candidate,'a'.repeat(64)));}});
test('changes outside the two planned latest-setting variables fail postflight',()=>{const f=uploaded();f.after.settings.bindings.find(x=>x.name==='PILOT_IDS').text='expanded';assert.throws(()=>verifyUploaded(f.before,f.after,f.candidate,'a'.repeat(64)));});

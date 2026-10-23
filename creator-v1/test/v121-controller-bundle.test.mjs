import test from 'node:test';import assert from 'node:assert/strict';
import {controllerConfig,TARGET_AUTH} from '../ops/v121-controller-bundle.mjs';
const PRIVATE='86dc4b9d-4020-432a-8a15-e65606f31316';
const pub='9851d9c5-6270-4c4e-a70e-1b82451b170d';
const priv='b957257c-d265-4656-bd97-db6b5da81b71';
const field=(name,text)=>({name,type:'plain_text',text});
const bs=[
 {name:'AUTH',type:'service',service:'anevum-apex-prelaunch-gateway'},
 {name:'DB',type:'d1',database_id:'fe6a2c20-ccde-451e-ab5f-3610b38d97ff'},
 {name:'MEDIA',type:'r2_bucket',bucket_name:'fictional-media-fixture'},
 field('PACKAGE_CANONICAL_AUTH_VERSION',PRIVATE),field('PACKAGE_CREATOR_GALLERY_ENABLED','true'),
 field('PACKAGE_NATIVE_STUDIO_ENABLED','true'),{name:'PACKAGE_PREVIEW_KEY',type:'secret_text'},
 field('PACKAGE_PUBLIC_PUBLISH_ENABLED','false'),field('PACKAGE_RESOURCE_PROTECTION_ENABLED','true'),
 field('PILOT_IDS','fixture'),field('RUNTIME_HOST','example.invalid'),
 field('STAFF_IDS','fixture'),field('STAGING_CONTROL_HOST','example.invalid')
];
function fixture(){return {controllerPrivate:{id:priv,resources:{bindings:structuredClone(bs)}},controllerPublic:{id:pub,resources:{bindings:structuredClone(bs)}},controllerDeployment:{versions:[{version_id:pub,percentage:100},{version_id:priv,percentage:0}]},apexDeployment:{versions:[{version_id:'93cc7f07-cf39-457e-af69-c9f6f4c02d25',percentage:100},{version_id:PRIVATE,percentage:0}]}};}
test('controller bundle pins V116 and disables publishing without leaking secrets',()=>{
 const c=controllerConfig(fixture(),'/tmp/fixture.mjs');
 assert.equal(c.vars.PACKAGE_CANONICAL_AUTH_VERSION,TARGET_AUTH);
 assert.equal(c.vars.PACKAGE_PUBLIC_PUBLISH_ENABLED,'false');
 assert.equal(c.services[0].service,'anevum-apex-prelaunch-gateway');
 assert.equal(c.d1_databases.length,1);
 assert.equal(c.r2_buckets.length,1);
 assert.equal(c.routes.length,0);
 assert.equal(c.preview_urls,false);
 assert.equal(c.upload_source_maps,false);
 assert.ok(!JSON.stringify(c).includes('PACKAGE_PREVIEW_KEY'));
});
test('fails closed on privileged settings, stale auth, or changed worker identity',()=>{
 const changes=[
 x=>x.controllerPrivate.resources.bindings.find(b=>b.name==='PACKAGE_PUBLIC_PUBLISH_ENABLED').text='true',
 x=>x.controllerPrivate.resources.bindings.find(b=>b.name==='PACKAGE_CANONICAL_AUTH_VERSION').text=TARGET_AUTH,
 x=>x.controllerPrivate.resources.bindings.find(b=>b.name==='AUTH').service='other',
 x=>x.controllerPrivate.resources.bindings.find(b=>b.name==='DB').database_id='changed',
 x=>x.controllerPrivate.resources.bindings.pop(),
 x=>x.controllerDeployment.versions[0].percentage=90,
 x=>x.apexDeployment.versions[0].version_id=TARGET_AUTH
 ];
 for(const change of changes){const s=fixture();change(s);assert.throws(()=>controllerConfig(s,'/tmp/fixture.mjs'));}
});

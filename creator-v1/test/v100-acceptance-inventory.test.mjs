import test from 'node:test';
import assert from 'node:assert/strict';
import {inventory,featureOnRoutingReady} from '../ops/v100-acceptance-inventory.mjs';
const secret='never-publish-cookie-or-provider-binding';
const read=async(path,json=true)=>{
 if(!json)return '--random-boundary\n'+secret+'\n__Host-anevum-v095-v096-qa\n--random-boundary--';
 if(path.endsWith('/workers/routes'))return [{pattern:'anevum.com/__enter/v095-v096*',script:'fixture'}];
 if(path.endsWith('/settings'))return {bindings:[{name:'QA_ROUTING_TOKEN',type:'plain_text',text:secret},{name:secret,type:'secret_text'}]};
 if(path.endsWith('/deployments'))return {deployments:[{id:'fixture-deployment',versions:[{version_id:'fixture-version',percentage:100}],annotations:secret}]};
 if(path.includes('/versions/'))return {id:path.split('/').at(-1)};
 if(path.includes('/rulesets/'))return {rules:[{expression:secret}]};
 if(path.endsWith('/snippets/snippet_rules'))return [{enabled:true,snippet_name:secret,expression:secret}];
 throw Error('Unexpected request');
};
test('only booleans, code digests and deployment IDs leave the audit',async()=>{
 const out=await inventory(read),encoded=JSON.stringify(out);
 assert.equal(out.readOnly,true);assert.equal(out.newCandidateExists,true);
 assert.equal(out.snippetsReadable,true);assert.equal(out.routingSnippets.length,1);
 assert.ok(!encoded.includes(secret));assert.ok(!encoded.includes('random-boundary'));
 assert.ok(!encoded.includes('bindings'));assert.ok(!encoded.includes('annotations'));
 assert.match(out.entry.sourceDigest,/^[a-f0-9]{64}$/);
});
test('source digests do not change with multipart transport boundaries',async()=>{
 const a=await inventory(read),b=await inventory((path,json)=>json===false?Promise.resolve('--other-boundary\n'+secret+'\n__Host-anevum-v095-v096-qa\n--other-boundary--'):read(path,json));
 assert.equal(a.entry.sourceDigest,b.entry.sourceDigest);
});
test('missing or duplicate entry routes stop before inspecting any Worker',async()=>{
 for(const routes of [[],[{pattern:'anevum.com/__enter/v095-v096*'},{pattern:'anevum.com/__enter/v095-v096*'}]]){
  let calls=0;await assert.rejects(()=>inventory(async()=>{calls++;return routes;}));assert.equal(calls,1);
 }
});

const ready={
 featureOnCandidateUploaded:true,featureOnAtZeroPercentInCurrentDeployment:true,
 entryCandidateMatchesFeatureOn:true,entryHasRoutingSecret:true,entryHasOnlyPlainOrSecretBindings:true,
 entryExpiryValid:true,entry:{hasFeatureOnCandidate:true,hasRoutingCookie:true,hasTimedGate:true,hasAccessIdentity:true},
 http_request_late_transform:{qaRuleCount:1,hasFeatureOnCandidate:true,hasRoutingCookie:true,hasVersionOverride:true}
};
test('feature-ON routing readiness requires the exact staged 0 percent version and the protected entry',()=>{
 assert.equal(featureOnRoutingReady(ready),true);
 for(const name of ['featureOnCandidateUploaded','featureOnAtZeroPercentInCurrentDeployment','entryCandidateMatchesFeatureOn','entryHasRoutingSecret','entryHasOnlyPlainOrSecretBindings','entryExpiryValid']){
  assert.equal(featureOnRoutingReady({...ready,[name]:false}),false,'must refuse missing '+name);
 }
 for(const name of ['hasFeatureOnCandidate','hasRoutingCookie','hasTimedGate','hasAccessIdentity']){
  assert.equal(featureOnRoutingReady({...ready,entry:{...ready.entry,[name]:false}}),false,'must refuse missing entry '+name);
 }
 assert.equal(featureOnRoutingReady({...ready,http_request_late_transform:{...ready.http_request_late_transform,qaRuleCount:0}}),false);
 assert.equal(featureOnRoutingReady({...ready,http_request_late_transform:{...ready.http_request_late_transform,qaRuleCount:2}}),false);
 for(const name of ['hasFeatureOnCandidate','hasRoutingCookie','hasVersionOverride']){
  assert.equal(featureOnRoutingReady({...ready,http_request_late_transform:{...ready.http_request_late_transform,[name]:false}}),false,'must refuse missing rule '+name);
 }
 assert.equal(featureOnRoutingReady({...ready,entry:undefined}),false);
 assert.equal(featureOnRoutingReady({...ready,http_request_late_transform:undefined}),false);
});
test('current historical-route fixture remains not feature-ON and never implies acceptance',async()=>{
 const out=await inventory(read);
 assert.equal(out.featureOnCandidateUploaded,true);
 assert.equal(out.featureOnAtZeroPercentInCurrentDeployment,false);
 assert.equal(out.featureOnProtectedRoutingReady,false);
 assert.equal(out.featureOnAuthenticatedAcceptance,false);
 assert.equal(out.featureOnPhysicalDeviceAcceptance,false);
 assert.equal(out.featureOnProductionApproved,false);
});

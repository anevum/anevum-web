import test from 'node:test';
import assert from 'node:assert/strict';
import {inspect,V116,PRIVATE_APEX,PUBLIC_APEX,PUBLIC_CTRL,PRIVATE_CTRL,WINDOW_END} from '../ops/v120-protected-acceptance.mjs';
const version=(id,bindings)=>({id,resources:{bindings}});
const text=(name,text)=>({name,type:'plain_text',text});
const ctrl=[
 {name:'AUTH',type:'service',service:'anevum-apex-prelaunch-gateway'},
 {name:'DB',type:'d1',database_id:'fe6a2c20-ccde-451e-ab5f-3610b38d97ff'},
 {name:'MEDIA',type:'r2_bucket',bucket_name:'media-fixture'},
 text('PACKAGE_CANONICAL_AUTH_VERSION',PRIVATE_APEX),
 text('PACKAGE_CREATOR_GALLERY_ENABLED','true'),text('PACKAGE_NATIVE_STUDIO_ENABLED','true'),
 {name:'PACKAGE_PREVIEW_KEY',type:'secret_text'},
 text('PACKAGE_PUBLIC_PUBLISH_ENABLED','false'),text('PACKAGE_RESOURCE_PROTECTION_ENABLED','true'),
 text('PILOT_IDS','synthetic'),text('RUNTIME_HOST','example.invalid'),
 text('STAFF_IDS','synthetic'),text('STAGING_CONTROL_HOST','example.invalid')
];
const apex=[text('CANONICAL_CREATOR_UPLOADS_ENABLED','false'),text('CANONICAL_XP_TEST_ENABLED','false'),
 ...Array.from({length:24},(_,i)=>text('FIXTURE_'+i,'test'))];
const entry=[text('QA_CANDIDATE',PRIVATE_APEX),text('QA_EXPIRES_AT',String(WINDOW_END)),
 text('ANEVUM_ACCESS_AUD','synthetic'),{name:'ANEVUM_PREVIEW_ALLOWED_EMAILS',type:'secret_text'},
 {name:'QA_ROUTING_TOKEN',type:'secret_text'}];
const oldNames=['anevum-apex-prelaunch-gateway','anevum-package-alpha-v003-control'];
function fixture(){
 return {apexDeployment:{id:'549f57c4-3d29-4b8b-856f-9554cab437e2',versions:[{version_id:PUBLIC_APEX,percentage:100},{version_id:PRIVATE_APEX,percentage:0}]},
 controllerDeployment:{id:'4ab43569-392c-40a0-838f-1745873e0918',versions:[{version_id:PUBLIC_CTRL,percentage:100},{version_id:PRIVATE_CTRL,percentage:0}]},
 entryDeployment:{id:'8ecc6c54-829a-4e62-974d-fb3f548a5ebc',versions:[{version_id:'81ec7236-dc66-45cd-84e1-c812706c2b31',percentage:100}]},
 apexVersions:[{id:V116}],apexCandidate:version(V116,apex),controllerPublic:version(PUBLIC_CTRL,ctrl),
 controllerPrivate:version(PRIVATE_CTRL,ctrl),entryPublic:version('81ec7236-dc66-45cd-84e1-c812706c2b31',entry),
 ruleset:{id:'7a8ccf2e80704acb90de7ad857a2728c',version:13,rules:[
 {id:'1279cf299bef404e883c7832c49d42a3',enabled:true},
 {id:'d2b00ef8a7de4278bf98e66a45d2afcc',enabled:true,
 expression:'http.host eq "anevum.com" and http.request.timestamp.sec lt 1792733407 and __Host-anevum-v095-v096-qa',
 action_parameters:{headers:{'cloudflare-workers-version-overrides':{operation:'set',
 value:oldNames[0]+'="'+PRIVATE_APEX+'", '+oldNames[1]+'="'+PRIVATE_CTRL+'"'}}}}]},
 routes:[{pattern:'anevum.com/*',script:'anevum-native-frame-policy-v001'},...Array.from({length:39},(_,i)=>({pattern:'fixture'+i+'.invalid/*'}))],
 apexExposure:{enabled:false,previews_enabled:false}};
}
const now=WINDOW_END+100;
test('plans V116 pinned controller without changing the public deployment',()=>{
 const r=inspect(fixture(),now);
 assert.equal(r.status,'V116_PROTECTED_REVIEW_BLOCKED_AWAITING_STAGING');
 assert.equal(r.publicTrafficPercent,100);
 assert.equal(r.privateTrafficPercent,0);
 assert.equal(r.privateControllerTarget,V116);
 assert.equal(r.proposedControllerBindings.find(x=>x.name==='PACKAGE_CANONICAL_AUTH_VERSION').text,V116);
 assert.equal(r.proposedControllerBindings.find(x=>x.name==='PACKAGE_PUBLIC_PUBLISH_ENABLED').text,'false');
 assert.equal(r.cloudflareWritesPerformed,false);
 assert.equal(r.authVerified,false);
 assert.equal(r.physicalSafariAcceptance,false);
});
test('rejects premature selector, wrong controller pin, public drift and publishing enablement',()=>{
 const edits=[
 x=>x.apexDeployment.versions[0].percentage=99,
 x=>x.apexDeployment.versions[1].version_id=V116,
 x=>x.controllerPrivate.resources.bindings.find(b=>b.name==='PACKAGE_CANONICAL_AUTH_VERSION').text=V116,
 x=>x.controllerPrivate.resources.bindings.find(b=>b.name==='PACKAGE_PUBLIC_PUBLISH_ENABLED').text='true',
 x=>x.entryPublic.resources.bindings.find(b=>b.name==='QA_CANDIDATE').text=V116,
 x=>x.ruleset.version=14,
 x=>x.ruleset.rules[1].expression=x.ruleset.rules[1].expression.replace('1792733407','1799999999'),
 x=>x.routes[0].script='anevum-apex-prelaunch-gateway',
 x=>x.apexCandidate.resources.bindings.find(b=>b.name==='CANONICAL_CREATOR_UPLOADS_ENABLED').text='true'
 ];
 for(const edit of edits){const x=fixture();edit(x);assert.throws(()=>inspect(x,now));}
});
test('old protected window must remain closed',()=>assert.throws(()=>inspect(fixture(),WINDOW_END-1)));

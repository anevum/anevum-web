import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PIN,context,digest,verifyLock,verifyAfter,configuration} from './inactive-upload.mjs';
const pub={version_id:PIN.public,percentage:100},priv={version_id:PIN.private,percentage:0};
const binding=(name,text)=>({name,type:'plain_text',text});
function fixture(){
 const components={},versionIds={};
 for(const [name,count]of [[PIN.apex,26],[PIN.controller,13],[PIN.entry,5]]){
  const settings={compatibility_date:'2026-10-17',compatibility_flags:['nodejs_compat'],bindings:Array.from({length:count},(_,i)=>binding('B'+i,'false'))};
  components[name]={settings,deployment:{versions:[pub,priv]},secrets:[],subdomain:{enabled:false,previews_enabled:false},deployedVersions:{[PIN.private]:{resources:{script_runtime:{compatibility_date:'2026-10-17'}}}}};versionIds[name]=[PIN.private,PIN.public].sort();
 }
 components.routes=Array.from({length:40},(_,i)=>({id:String(i),pattern:'/route'+i,script:'preserved'}));components.access={policies:[{decision:'allow'}]};components.lateTransform={version:'13'};
 const s={components,versionIds},lock={componentSha256:Object.fromEntries(Object.entries(components).map(([k,v])=>[k,digest(v)])),versionIds:structuredClone(versionIds)};return {s,lock};
}
test('requires main, manual owner dispatch, first attempt, exact archive and a bounded time',()=>{
 const env={GITHUB_REPOSITORY:PIN.repo,GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/main',GITHUB_ACTOR:'anevum',GITHUB_TRIGGERING_ACTOR:'anevum',GITHUB_RUN_ATTEMPT:'1',CONFIRM_V131:PIN.archive,CLOUDFLARE_ACCOUNT_ID:PIN.account};
 context(env,Date.parse('2026-10-23T20:00:00Z'));
 for(const [key,value]of Object.entries({GITHUB_EVENT_NAME:'push',GITHUB_REF:'refs/heads/unreviewed',GITHUB_ACTOR:'other',GITHUB_TRIGGERING_ACTOR:'other',GITHUB_RUN_ATTEMPT:'2',CONFIRM_V131:'older-artifact',CLOUDFLARE_ACCOUNT_ID:'other'}))assert.throws(()=>context({...env,[key]:value},Date.parse('2026-10-23T20:00:00Z')));
 assert.throws(()=>context(env,Date.parse('2026-10-25T00:00:00Z')));
});
test('provider locks reject route, Access, secret names, flag, controller, expiry and version drift',()=>{
 const {s,lock}=fixture();verifyLock(s,lock);
 const changes=[x=>x.components.routes[0].script='other',x=>x.components.access.policies=[],x=>x.components.lateTransform.version='14',x=>x.components[PIN.apex].settings.bindings[0].text='true',x=>x.components[PIN.controller].settings.bindings.pop(),x=>x.components[PIN.entry].settings.bindings[0].text='renewed',x=>x.components[PIN.apex].secrets.push({name:'new',type:'secret_text'}),x=>x.versionIds[PIN.apex].push('unexpected')];
 for(const change of changes){const bad=structuredClone(s);change(bad);assert.throws(()=>verifyLock(bad,lock));}
});
test('postflight requires exactly one inactive version and all production components unchanged',()=>{
 const {s}=fixture(),after=structuredClone(s),id='new-v131';after.versionIds[PIN.apex].push(id);after.versionIds[PIN.apex].sort();
 const candidate={id,annotations:{'workers/message':PIN.message},resources:{bindings:s.components[PIN.apex].settings.bindings,script_runtime:{compatibility_date:'2026-10-17'},script:{etag:'provider-etag'}}};
 assert.equal(verifyAfter(s,after,candidate).candidatePercent,0);
 for(const change of [x=>x.components[PIN.apex].deployment.versions.push({version_id:id,percentage:1}),x=>x.components[PIN.controller].settings.bindings.pop(),x=>x.versionIds[PIN.apex].push('extra'),x=>x.versionIds[PIN.entry].push('extra')]){const bad=structuredClone(after);change(bad);assert.throws(()=>verifyAfter(s,bad,candidate));}
 assert.throws(()=>verifyAfter(s,after,{...candidate,annotations:{'workers/message':'old V116'}}));
});
test('configuration keeps root assets and never assigns routes or opens worker previews',()=>{
 const {s}=fixture(),c=configuration(s,'/tmp/verified-v131');assert.equal(c.no_bundle,true);assert.equal(c.workers_dev,false);assert.equal(c.preview_urls,false);assert.deepEqual(c.routes,[]);assert.equal(c.assets.run_worker_first,true);assert.ok(c.main.endsWith('/worker-bundle/gateway.js'));
});
test('workflow cannot invoke its credentialed job on PR, push, issue comment or arbitrary ref',()=>{
 const w=readFileSync(new URL('../../.github/workflows/v131-inactive-upload.yml',import.meta.url),'utf8');
 assert.match(w,/github.event_name == 'workflow_dispatch'/);assert.match(w,/github.ref == 'refs\/heads\/main'/);assert.match(w,/versions upload/);
 assert.doesNotMatch(w,/^  (push|issue_comment|pull_request_target):/m);assert.doesNotMatch(w,/wrangler[^\n]*(?:versions deploy|deploy --)/);
 assert.match(w,/--no-bundle --no-upload-source-maps --keep-vars/);assert.match(w,/wrangler@4\.135\.0/);
});

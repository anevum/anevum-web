import test from 'node:test';import assert from 'node:assert/strict';
import {baseline} from '../ops/apex-worker-bundle-v117.mjs';
import {verifyBefore,verifyAfter,UPLOAD_MESSAGE,BASE,ARTIFACT,RUN} from '../ops/apex-inactive-upload-v118.mjs';
const NEW='55555555-4444-4333-8222-111111111111';
function fixture(){const s=structuredClone(baseline);s.publicVersion.resources.script={etag:'a'.repeat(64)};s.candidateVersion.resources.script={etag:'b'.repeat(64)};s.versions=[{id:s.publicVersion.id},{id:s.candidateVersion.id}];return s;}
function after(){const s=fixture(),prior=verifyBefore(s);s.versions.push({id:NEW});const candidate={id:NEW,annotations:{'workers/message':UPLOAD_MESSAGE},resources:structuredClone(s.candidateVersion.resources)};candidate.resources.script={etag:'c'.repeat(64)};return {s,prior,candidate};}
test('Exact source identity and release limits',()=>{assert.equal(BASE,'356112a94575c988c28efcd9ab083277c3838b80');assert.equal(RUN,39889939571);assert.equal(ARTIFACT,12474282482);});
test('Inactive new version leaves rollback/public traffic unchanged',()=>{const f=after(),r=verifyAfter(f.prior,f.s,f.candidate);assert.equal(r.status,'V116_IMMUTABLE_INACTIVE_UPLOADED');assert.equal(r.publicPercent,100);assert.equal(r.newVersionPercent,0);assert.equal(r.authPinRemediated,false);assert.equal(r.productionReleaseApproved,false);});
test('Preflight fails on baseline/route/setting drift',()=>{for(const mutate of [s=>s.deployment.id='changed',s=>s.routes.pop(),s=>s.settings.bindings.pop(),s=>s.exposure.enabled=true]){const s=fixture();mutate(s);assert.throws(()=>verifyBefore(s));}});
test('Postflight fails on traffic/secret/database change and unexpected upload count',()=>{for(const mutate of [f=>f.s.deployment.versions[0].percentage=99,f=>f.candidate.resources.bindings.pop(),f=>f.candidate.resources.bindings.find(x=>x.type==='d1').database_id='wrong',f=>f.s.versions.push({id:'22222222-3333-4444-8555-666666666666'}),f=>f.candidate.annotations['workers/message']='wrong']){const f=after();mutate(f);assert.throws(()=>verifyAfter(f.prior,f.s,f.candidate));}});
test('No production write API in verifier',async()=>{const {readFileSync}=await import('node:fs');const source=readFileSync(new URL('../ops/apex-inactive-upload-v118.mjs',import.meta.url),'utf8');assert.doesNotMatch(source,/method:['"](?:POST|PUT|PATCH|DELETE)['"]|\bwrangler\s+deploy\b/);assert.match(source,/allowPublicDeployment:false/);});

test('V119 API-origin recovery requires one marker, fresh readback and a non-deploying version upload',async()=>{
 const {readFileSync}=await import('node:fs');
 const source=readFileSync(new URL('../ops/apex-inactive-upload-v118.mjs',import.meta.url),'utf8');
 const workflow=readFileSync(new URL('../../.github/workflows/v118-v116-inactive-upload.yml',import.meta.url),'utf8');
 assert.match(source,/release\\(v119\\): reconcile API-origin V116 Worker immutable inactive only/);
 assert.match(source,/\.github\\/release-approvals\\/v119-v116-inactive-upload\.json/);
 assert.match(source,/allowPublicDeployment:false/);
 assert.match(source,/assert\.equal\\(now\.deployment,before\.deployment/);
 assert.match(workflow,/wrangler versions upload --no-bundle --no-upload-source-maps --keep-vars --config/);
 assert.doesNotMatch(workflow,/wrangler versions upload [^\\n]*--strict/);
 assert.doesNotMatch(workflow,/wrangler deploy /);
 assert.match(workflow,/github\.actor == 'anevum'/);
});

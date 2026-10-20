import test from 'node:test';
import assert from 'node:assert/strict';
import {manifest,normalizeRoutes,signatures,validateBaseline,validateUploadedCandidate} from '../ops/v095-inactive-candidate-gate.mjs';

const base=()=>({
 deployment:structuredClone(manifest.deployment),routes:structuredClone(manifest.routes),
 settings:{bindings:structuredClone(manifest.required_binding_signatures)},
 live:{id:manifest.live_version.id,resources:{script:{etag:manifest.live_version.etag},bindings:manifest.required_binding_signatures.filter(x=>!['CANONICAL_PACKAGE_PROOF_ENABLED','CANONICAL_PACKAGE_PROOF_KEY'].includes(x.name)).map(x=>({...x,text:x.type==='plain_text'?'true':undefined})),script_runtime:structuredClone(manifest.prior_inactive_version.runtime)}},
 pilot:{id:manifest.prior_inactive_version.id,resources:{script:{etag:manifest.prior_inactive_version.etag},bindings:manifest.required_binding_signatures.map(x=>({...x,text:x.type==='plain_text'?'true':undefined})),script_runtime:structuredClone(manifest.prior_inactive_version.runtime)}},
 exposure:structuredClone(manifest.exposure)
});
test('39-route snapshot retains separate family Worker',()=>{assert.equal(manifest.routes.length,39);assert.equal(manifest.routes.find(x=>x.pattern==='family.anevum.com/*').script,'anevum-family-holiday-v001');});
test('normalizers ignore ordering but not changed routes/bindings',()=>{assert.deepEqual(normalizeRoutes([...manifest.routes].reverse()),manifest.routes);assert.deepEqual(signatures([...manifest.required_binding_signatures].reverse()),manifest.required_binding_signatures);});
test('reject route drift before upload',()=>{const s=base();s.routes.pop();assert.throws(()=>validateBaseline(s),/route inventory drift/);});
test('reject traffic promotion before upload',()=>{const s=base();s.deployment.versions[0].percentage=99;assert.throws(()=>validateBaseline(s),/Traffic distribution changed/);});
test('reject new or missing binding before upload',()=>{const s=base();s.settings.bindings.pop();assert.throws(()=>validateBaseline(s),/Current bindings drift/);});
test('reject preview exposure before upload',()=>{const s=base();s.exposure.enabled=true;assert.throws(()=>validateBaseline(s),/Public preview exposure changed/);});
test('reject upload pretending to have unchanged traffic',()=>{const s=base();const t=structuredClone(s);t.deployment.versions[0].percentage=95;assert.throws(()=>validateUploadedCandidate({before:s,after:t,candidate:{id:'new',resources:{bindings:s.pilot.resources.bindings,script_runtime:s.pilot.resources.script_runtime}}}),/Version upload changed traffic/);});

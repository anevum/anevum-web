import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=source('web/src/App.tsx');
const studio=source('web/src/pages/CanonicalStudioPage.tsx');
const workbench=source('web/src/pages/WorkbenchAlpha.tsx');
const server=source('canonical-auth/worker.mjs');
const handler=source('canonical-auth/workbench-alpha.mjs');

test('guest V096 /studio/alpha remains public and cannot become private Workbench',()=>{
 assert.doesNotThrow(()=>parse(app,{sourceType:'module',plugins:['typescript','jsx']}));
 assert.match(app,/path="studio\/alpha" element=\{<PublicCreatorAlphaPage\/>\}/);
 assert.match(app,/path="studio\/workbench" element=\{<Suspense fallback=\{creatorFallback\}><WorkbenchAlphaPage\/><\/Suspense>\}/);
 assert.doesNotMatch(workbench,/to="\/studio\/alpha"/);
 assert.match(workbench,/to="\/studio\/workbench"/);
 assert.match(app,/path="studio" element=\{nativeCreatorEnabled\?<Suspense/);
 assert.match(app,/path="studio\/records" element=\{<CanonicalStudioPage\/>\}/);
});

test('private Workbench entry loads only behind Vite feature flag and server access',()=>{
 assert.match(studio,/workbenchAlphaEnabled&&<Suspense fallback=\{null\}><WorkbenchAlphaEntryGate\/>/);
 assert.match(workbench,/workbenchAlphaEnabled&&access&&access\.memberId===memberId&&access\.allowed/);
 assert.match(workbench,/key=\{user\.id\}/);
 assert.match(server,/ownWorkbench&&env\?\.CANONICAL_WORKBENCH_ALPHA_ENABLED!=="true"/);
 assert.match(server,/if\(ownWorkbench\)return safeResponse\(await canonicalWorkbench\(clean,env,session\.user\)\)/);
 assert.match(handler,/CANONICAL_WORKBENCH_SCHEMA_APPROVED/);
 assert.match(handler,/member_workbench_access/);
 assert.match(handler,/staff_access_grants/);
 assert.match(handler,/publish:false/);
});

test('no new rights escalation, cloud migration or executable preview via guest route',()=>{
 assert.doesNotMatch(workbench,/dangerouslySetInnerHTML/);
 assert.match(handler,/CANONICAL_WORKBENCH_ALPHA_ENABLED/);
 assert.match(source('workbench-alpha/document.mjs'),/anevum.blocks.v1/);
 assert.doesNotMatch(studio,/VITE_CREATOR_WORKBENCH_ALPHA\s*[:=]\s*['"]true['"]/);
 assert.doesNotMatch(server,/CANONICAL_WORKBENCH_ALPHA_ENABLED\s*[:=]\s*['"]true['"]/);
});

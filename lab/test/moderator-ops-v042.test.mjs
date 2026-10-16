import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MODERATOR_LAB_CSS,MODERATOR_LAB_JS,renderLabModeratorConsole} from '../moderator-ops-v042.mjs';
import {installLabModeratorBridge,LAB_V042_VERSION} from '../private-lab-moderator-bridge-v042.mjs';

test('V042 Lab moderator page renders a separate private planning workbench',()=>{
 const page=renderLabModeratorConsole();
 assert.match(page,/<title>ANEVUM \/ Backstage \/ Moderation Lab<\/title>/);
 assert.match(page,/Moderation <em>workstation\.<\/em>/);
 assert.match(page,/PRIVATE LAB/);
 assert.match(page,/LOCAL PLANNING/);
 assert.match(page,/No simulated community statistics/);
 assert.match(page,/data-screen="overview"/);
 assert.match(page,/data-screen="queue"/);
 assert.match(page,/data-screen="new"/);
 assert.match(page,/data-screen="protocol"/);
 assert.match(page,/data-screen="audit"/);
 assert.match(page,/No real user data imported/i);
 assert.doesNotMatch(page,/faker|Math\.random\(\)\*100|1000 members/i);
});
test('V042 Lab only links to canonical reviewer, never authenticates through a cross-origin proxy',()=>{
 const page=renderLabModeratorConsole();
 assert.match(page,/href="https:\/\/a\.anevum\.com\/community\/review"/);
 assert.match(page,/target="_blank" rel="noopener noreferrer"/);
 assert.match(page,/ANEVUM member session and server-side reviewer authorization/i);
 assert.match(page,/No account bans, review approvals, public posts, API tokens or cross-domain session transfers/);
 assert.doesNotMatch(MODERATOR_LAB_JS,/fetch\(|XMLHttpRequest|navigator\.sendBeacon|document\.cookie|postMessage|Authorization/);
 assert.doesNotMatch(MODERATOR_LAB_JS,/innerHTML|outerHTML|insertAdjacentHTML|eval\(/);
});
test('V042 Lab writes only legacy-compatible private Backstage local cases',()=>{
 assert.match(MODERATOR_LAB_JS,/anevum\.lab\.backstage\.cases\.v1/);
 assert.match(MODERATOR_LAB_JS,/backstage-local-v1/);
 assert.match(MODERATOR_LAB_JS,/LOCAL-\[0-9\]/);
 assert.match(MODERATOR_LAB_JS,/category:'moderation'/);
 assert.match(MODERATOR_LAB_JS,/cases.length>=200/);
 assert.match(MODERATOR_LAB_JS,/item\.events\.length>=60/);
 assert.match(MODERATOR_LAB_JS,/textarea/);
 assert.match(MODERATOR_LAB_JS,/textContent/);
 assert.doesNotMatch(MODERATOR_LAB_JS,/sessionStorage|indexedDB|localStorage\.clear|localStorage\.removeItem/);
});
test('V042 Lab mobile layout and reduced-motion behavior do not force horizontal scrolling',()=>{
 assert.match(MODERATOR_LAB_CSS,/@media\(max-width:840px\)/);
 assert.match(MODERATOR_LAB_CSS,/@media\(max-width:560px\)/);
 assert.match(MODERATOR_LAB_CSS,/prefers-reduced-motion:reduce/);
 assert.match(MODERATOR_LAB_CSS,/grid-template-columns:minmax\(0,1fr\)/);
 assert.match(MODERATOR_LAB_CSS,/overflow-x:auto/);
 assert.match(MODERATOR_LAB_CSS,/focus-visible/);
});
test('existing Backstage and canonical forum boundaries remain documented in source',()=>{
 const doc=readFileSync(new URL('../../docs/creator-platform/ANEVUM.WEB.BUILD.2026-10-16.002.MODERATOR-CONSOLE.md',import.meta.url),'utf8');
 assert.match(doc,/Better Auth canonical member identity/i);
 assert.match(doc,/same-origin/i);
 assert.match(doc,/Private Lab Backstage integration/i);
 assert.match(doc,/lab\.anevum\.com\/projects\/backstage\/moderation/);
 assert.match(doc,/separate.*promoting the canonical V042/i);
 assert.match(doc,/account bans/i);
 assert.match(doc,/staging release/i);
 const reviewer=readFileSync(new URL('../../creator-v1/canonical-auth/forums.mjs',import.meta.url),'utf8');
 assert.match(reviewer,/CANONICAL_FORUM_REVIEWER_IDS/);
 assert.match(reviewer,/Independent review is required/);
});

test('V042 Lab bridge inserts a single isolated path and preserves all original scope gates',()=>{
 const original=[
  "import {BACKSTAGE_CSS,BACKSTAGE_JS,renderBackstageWorkspace} from './backstage-workspace.mjs';",
  "const HOST='lab.anevum.com';",
  "const VERSION='2026-10-16.lab.v6-cadets-family-game';",
  "if(url.hostname!==HOST)return response('Not Found');",
  "if(!['GET','HEAD'].includes(request.method))return response('Method not allowed');",
  "else if(path==='/projects/backstage/'||path==='/projects/backstage/index.html')res=response(renderBackstageWorkspace());",
  "else if(path==='/projects/transcosmic')res=response(null,'text/plain; charset=utf-8',308,{Location:'/projects/transcosmic/'});",
  "else if(path==='/projects/cadets')res=response(null,'text/plain; charset=utf-8',308);",
  "else if(path==='/projects/the-fold/'||path==='/projects/the-fold/index.html')res=response(null);",
  "//"+'Lab private source is intentionally never included in public tests. '.repeat(30)
 ].join('\n');
 const patched=installLabModeratorBridge(original);
 assert.match(patched,/renderLabModeratorConsole/);
 assert.match(patched,/MODERATOR_LAB_CSS/);
 assert.match(patched,/MODERATOR_LAB_JS/);
 assert.match(patched,/renderLinkedBackstage/);
 assert.match(patched,/projects\/backstage\/moderation\/console\.js/);
 assert.match(patched,/projects\/backstage\/moderation\/console\.css/);
 assert.ok(patched.includes(LAB_V042_VERSION));
 assert.match(patched,/if\(url\.hostname!==HOST\)/);
 assert.match(patched,/if\(!\['GET','HEAD'\]\.includes\(request\.method\)\)/);
 assert.match(patched,/projects\/the-fold/);
 assert.match(patched,/projects\/cadets/);
 assert.throws(()=>installLabModeratorBridge(patched),/already present/);
 assert.throws(()=>installLabModeratorBridge(original.replace("const HOST='lab.anevum.com';","const HOST='other.example';")),/missing or ambiguous/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../web/public/institute/lab');
const read=name=>readFileSync(resolve(root,name),'utf8');

test('Institute Lab has nonindexable static routes and CSP-safe local modules',()=>{
 for(const name of ['specimens.html','observation-node-001.html','regulation-node-002.html']){
  const page=read(name);
  assert.match(page,/<html lang="en">/);
  assert.match(page,/noindex,nofollow,noarchive/);
  assert.doesNotMatch(page,/<script\s*>[\s\S]*?<\/script>/i,'inline JS is disallowed by staging Worker CSP');
  assert.doesNotMatch(page,/\bon(?:click|load|error)\s*=/i);
 }
 for(const name of ['observation-node-001','regulation-node-002']){
  const page=read(name+'.html');
  assert.ok(page.includes('<script type="module" src="./'+name+'.mjs"></script>'));
  assert.ok(existsSync(resolve(root,name+'.mjs')));
 }
});

test('Both vector identities support reduced motion and static fallback',()=>{
 const observation=read('observation-node-001.svg');
 const regulation=read('regulation-node-002.svg');
 const still=read('regulation-node-002-still.svg');
 assert.match(observation,/Observation Node 001/);
 assert.match(regulation,/Regulation Node 002/);
 assert.match(observation,/prefers-reduced-motion/);
 assert.match(regulation,/prefers-reduced-motion/);
 assert.match(still,/animation:none!important/);
 assert.notEqual(observation,regulation);
});

test('Regulation demo remains synthetic and cannot call moderation services',()=>{
 const html=read('regulation-node-002.html');
 const js=read('regulation-node-002.mjs');
 assert.match(html,/SYNTHETIC CASES ONLY/);
 assert.match(html,/server-configured forum reviewer grants/i);
 assert.doesNotMatch(html,/Cloudflare Access identity/);
 assert.match(html,/no report is filed/i);
 assert.match(js,/SIMULATED STAFF REVIEW/);
 assert.match(js,/No action performed/);
 assert.match(js,/regulation-node-002-still\.svg/);
 for(const source of [html,js,read('observation-node-001.mjs')]){
  assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|WebSocket\s*\(/);
  assert.doesNotMatch(source,/\blocalStorage\b|\bsessionStorage\b/);
 }
});

test('Institute index links two distinct specimens with provisional names',()=>{
 const html=read('specimens.html');
 for(const name of ['observation-node-001.html','regulation-node-002.html','observation-node-001.svg','regulation-node-002.svg'])
  assert.ok(html.includes('./'+name),name);
 assert.match(html,/Provisional entity names/);
 assert.match(html,/No live activity/i);
});


test('native Creator V1 route is presented without any live Institute authority',()=>{
 const web=resolve(dirname(fileURLToPath(import.meta.url)),'../web');
 const app=readFileSync(resolve(web,'src/App.tsx'),'utf8');
 const page=readFileSync(resolve(web,'src/pages/InstituteLabPage.tsx'),'utf8');
 const registry=readFileSync(resolve(web,'src/lib/institute-entities.ts'),'utf8');
 const css=readFileSync(resolve(web,'src/pages/institute-lab.css'),'utf8');
 const status=readFileSync(resolve(web,'src/pages/StatusPage.tsx'),'utf8');
 assert.match(app,/path="institute\/lab"/);
 assert.match(app,/import\("\.\/pages\/InstituteLabPage"\)/);
 assert.match(status,/to="\/institute\/lab"/);
 assert.match(page,/noindex,nofollow,noarchive/);
 assert.match(page,/PRESENTATION|PREVIEW ONLY|DESIGN LAB ONLY/i);
 assert.match(page,/prefers-reduced-motion/);
 assert.match(page,/ArrowRight/);
 assert.match(page,/SYNTHETIC TRANSMISSION/);
 assert.match(page,/Official automated entity|OFFICIAL AUTOMATED ENTITY/i);
 assert.match(registry,/presentationOnly: true/);
 assert.match(registry,/observation-node-001/);
 assert.match(registry,/regulation-node-002/);
 assert.match(css,/prefers-reduced-motion/);
 assert.ok(existsSync(resolve(root,'observation-node-001-still.svg')));
 // This frontend is a deliberately local-only design lab; in particular it
 // must not access staff-review endpoints, award receipts or auth sessions.
 for(const source of [page,registry]){
   assert.doesNotMatch(source,/fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket\s*\(/);
   assert.doesNotMatch(source,/\/api\/v1\/member\/forum-review|\/api\/v1\/member\/progression/);
   assert.doesNotMatch(source,/localStorage|sessionStorage|memberAuth|canonicalAuthClient/);
 }
});

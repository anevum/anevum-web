/** V136 Continuance foundation: source contract plus separate compiled browser QA. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const css=read('../web/src/parity/continuance-design-system.css');
const main=read('../web/src/main.tsx');
const portal=read('../web/src/parity/ParityPortalV136.tsx');
const worker=read('../../.github/workflows/v136-interactive-owner-review.yml');
const color=name=>{
 const matched=css.match(new RegExp('--'+name+':(#[0-9a-f]{6})(?:;|$)'));
 assert.ok(matched,'Missing token '+name);return matched[1];
};
const luminance=hex=>{
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const [r,g,b]=rgb.map(n=>n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4));
 return .2126*r+.7152*g+.0722*b;
};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
test('V136 candidate visibly transitions from navy/cyan to legible obsidian/bone/copper/violet',()=>{
 assert.equal(color('av-void'),'#07060b');
 assert.equal(color('av-canvas'),'#100d16');
 assert.equal(color('av-text'),'#efe6da');
 assert.equal(color('av-violet'),'#b49bce');
 assert.equal(color('av-copper'),'#d2a57f');
 assert.equal(color('av-ice'),'#a8cbd2');
 for(const name of ['av-text','av-copper','av-ice'])
  assert.ok(contrast(color(name),color('av-void'))>=4.5,'Insufficient text contrast: '+name);
 assert.doesNotMatch(css,/--av-void:#080b12|--av-canvas:#0d121b/);
});
test('one existing visual authority owns shared public surfaces and preserves actual media',()=>{
 const imports=['visual-foundation-v136.css','concept-convergence-v136017.css',
   'sitewide-interface-v136.css','continuance-design-system.css'].map(n=>main.indexOf('import("./parity/'+n+'")'));
 assert.ok(imports.every(n=>n>=0));
 assert.ok(imports.every((n,i)=>i===0||n>imports[i-1]));
 for(const alias of ['--p-void:var(--av-void)','--cx-void:var(--av-void)',
  '--av136-glass:var(--av-panel)','--ch7-line:var(--av-border)',
  '--ms-surface:var(--av-surface)'])assert.ok(css.includes(alias),alias);
 for(const surface of ['p136-header','p136-hero','p136-discover-hero',
   'p136-creators-hero','p136-console-wayfinder','p136-studio-console','ch7-hero'])
   assert.ok(css.includes('.'+surface),'Missing theme surface: '+surface);
 assert.match(css,/\.p136-hero::before\{/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(forced-colors:active\)/);
 assert.doesNotMatch(css,/@import\b|@font-face\b|url\(\s*["']?https?:/);
 assert.match(portal,/<CinematicArrivalV136\/>/);
 assert.match(portal,/CATEGORY INDEX \/ NOT CREATOR COVER/);
 assert.match(worker,/node --test creator-v1\/test\/visual-convergence-v136\.test\.mjs/);
});

test('PWA chrome and review banner share Continuance palette; cinematic CI has one unambiguous dispatch',()=>{
 const html=read('../web/index.html');
 const manifest=JSON.parse(read('../web/public/site.webmanifest'));
 const preview=read('../web/v136-visual-review.worker.mjs');
 const workflow=read('../../.github/workflows/parity-v136-cinematic-production.yml');
 assert.match(html,/<meta name="theme-color" content="#07060b"\s*\/>/);
 assert.equal(manifest.theme_color,color('av-void'));
 assert.equal(manifest.background_color,color('av-void'));
 assert.match(preview,/NON-PRODUCTION/);
 assert.match(preview,/background:#17111d/);
 assert.match(preview,/border-bottom:1px solid #d2a57f/);
 assert.equal((workflow.match(/^  workflow_dispatch:/gm)||[]).length,1);
 assert.match(workflow,/^  pull_request:/m);
 assert.match(workflow,/github\.event_name == 'workflow_dispatch'/);
});

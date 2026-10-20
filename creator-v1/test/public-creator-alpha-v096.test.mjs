import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {
 ALPHA_DOCUMENT_CSP,ALPHA_MAX_HTML,ALPHA_MAX_CSS,
 alphaTemplates,buildAlphaDocument,validAlphaSource
} from '../web/src/lib/public-alpha-v096.ts';
import {createPublicStageWorker} from '../web/a-staging-worker.mjs';
import {createApexPrelaunchGateway} from '../apex-prelaunch/gateway.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('web/src/App.tsx');
const page=read('web/src/pages/PublicCreatorAlphaPage.tsx');
const css=read('web/src/pages/public-alpha-v096.css');
const source=read('web/src/lib/public-alpha-v096.ts');
const stage=read('web/a-staging-worker.mjs');
const gateway=read('apex-prelaunch/gateway.mjs');

test('unlisted guest route uses the canonical Shell without a member gate',()=>{
 for(const [label,value] of [['App',app],['Alpha page',page],['Alpha source',source]])
  assert.doesNotThrow(()=>parse(value,{sourceType:'module',plugins:['typescript','jsx']}),label);
 assert.match(app,/<Route path="studio\/alpha" element=\{<PublicCreatorAlphaPage\/>\}\/>/);
 assert.ok(app.indexOf('path="studio/alpha"')<app.indexOf('path="studio/:projectId"'));
 assert.ok(app.indexOf('path="studio/alpha"')<app.indexOf('<Route element={<MemberGate/>}>'));
 assert.match(page,/data-public-alpha="v096"/);
 assert.match(page,/to="\/join"/);
 assert.match(page,/to="\/studio"/);
 assert.doesNotMatch(page,/(?:fetch\(|localStorage|sessionStorage|indexedDB|WebSocket|dangerouslySetInnerHTML)/);
 assert.doesNotMatch(source,/(?:fetch\(|localStorage|sessionStorage|indexedDB|WebSocket)/);
});

test('guest source is bounded, 100% local and exportable',()=>{
 assert.equal(alphaTemplates.length,3);
 assert.deepEqual(alphaTemplates.map(x=>x.id),['signal','postcard','blank']);
 assert.ok(alphaTemplates.every(t=>validAlphaSource(t.source)));
 assert.equal(validAlphaSource({html:'x'.repeat(ALPHA_MAX_HTML+1),css:''}),false);
 assert.equal(validAlphaSource({html:'',css:'y'.repeat(ALPHA_MAX_CSS+1)}),false);
 assert.equal(validAlphaSource({html:'',css:''}),true);
 assert.equal(validAlphaSource({html:42,css:''}),false);
 assert.match(page,/Blob\(\[doc\]/);
 assert.match(page,/download='anevum-guest-creation.html'/);
 assert.match(page,/window\.confirm\(/);
 assert.match(page,/autoCapitalize="off"/);
 assert.match(page,/Auto-preview/);
 assert.match(page,/Nothing here is published/);
});

test('preview is sandboxed at an opaque origin and forbids scripts and network',()=>{
 assert.match(page,/<iframe key=\{revision\} title="Anonymous HTML and CSS preview" sandbox=""/);
 assert.doesNotMatch(page,/sandbox="[^"]*(?:allow-scripts|allow-same-origin|allow-forms)/);
 assert.match(ALPHA_DOCUMENT_CSP,/script-src 'none'/);
 assert.match(ALPHA_DOCUMENT_CSP,/connect-src 'none'/);
 assert.match(ALPHA_DOCUMENT_CSP,/frame-src 'none'/);
 assert.match(ALPHA_DOCUMENT_CSP,/form-action 'none'/);
 assert.match(ALPHA_DOCUMENT_CSP,/font-src 'none'/);
 assert.match(ALPHA_DOCUMENT_CSP,/img-src data: blob:/);
 const malicious=buildAlphaDocument({html:'<script>top.location="https://evil.invalid"</script>',css:'</style><script>alert(9)</script>'});
 assert.ok(malicious.indexOf('Content-Security-Policy')<malicious.indexOf('<script>'));
 assert.ok(malicious.includes('script-src &#39;none&#39;')===false);
 assert.ok(malicious.includes("script-src 'none'"));
 assert.ok(malicious.includes('<\\/style><script>alert(9)</script>'));
 assert.doesNotMatch(malicious.slice(0,malicious.indexOf('</head>')),/<\/style><script>/i);
});

test('only alpha route adds limited frame permission; anonymous APIs remain unavailable',async()=>{
 const worker=createPublicStageWorker({hostname:'anevum.com'});
 const env={PACKAGE_NATIVE_STUDIO_ENABLED:'false',ASSETS:{fetch:async()=>new Response('<!doctype html><html></html>',{headers:{'content-type':'text/html; charset=utf-8'}})}};
 const fetch=path=>worker.fetch(new Request('https://anevum.com'+path),env,{});
 const publicAlpha=await fetch('/studio/alpha');
 assert.equal(publicAlpha.status,200);
 const csp=publicAlpha.headers.get('content-security-policy');
 assert.match(csp,/frame-src 'self' about: blob:/);
 assert.match(csp,/default-src 'none'/);
 assert.match(csp,/script-src 'self'/);
 assert.equal(publicAlpha.headers.get('x-frame-options'),'DENY','Guest route still forbids framing of the HTTP page');
 assert.doesNotMatch(csp,/frame-ancestors/,'Opaque srcdoc must not inherit a self-blocking ancestor policy');
 const ordinary=await fetch('/studio');
 assert.doesNotMatch(ordinary.headers.get('content-security-policy'),/frame-src/);
 assert.match(ordinary.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 assert.equal((await worker.fetch(new Request('https://anevum.com/studio/alpha',{method:'POST'}),env,{})).status,405);
 assert.equal((await fetch('/api/v1/member/studio/projects')).status,404);
 const slashAlpha=await fetch('/studio/alpha/');
 assert.match(slashAlpha.headers.get('content-security-policy'),/frame-src 'self' about: blob:/);
 assert.match(stage,/PUBLIC_ALPHA\.test\(url\.pathname\)/);
});

test('native package player CSP survives when both presentation flags are enabled',async()=>{
 const worker=createPublicStageWorker({hostname:'anevum.com'});
 const env={PACKAGE_NATIVE_STUDIO_ENABLED:'true',ASSETS:{fetch:async()=>new Response('<html/>',{headers:{'content-type':'text/html'}})}};
 const alpha=await worker.fetch(new Request('https://anevum.com/studio/alpha'),env,{});
 assert.match(alpha.headers.get('content-security-policy'),/frame-src https:\/\/anevum-package-alpha-v003-runtime\.devonakins\.workers\.dev 'self' about: blob:/);
 const privatePath=await worker.fetch(new Request('https://anevum.com/studio/packages'),env,{});
 assert.match(privatePath.headers.get('content-security-policy'),/frame-src https:\/\/anevum-package-alpha-v003-runtime\.devonakins\.workers\.dev;/);
 assert.doesNotMatch(privatePath.headers.get('content-security-policy'),/about:/);
});

test('public apex makes only guest alpha unlisted without altering private Access or launch gates',async()=>{
 const gate=createApexPrelaunchGateway({identity:async()=>null,platform:async()=>new Response('ok',{headers:{'content-type':'text/html','x-robots-tag':'noindex, nofollow, noarchive'}})});
 const env={ANEVUM_CANONICAL_APEX_ENABLED:'true',ANEVUM_LAUNCH_APPROVED:'true',ANEVUM_PRELAUNCH_MODE:'public'};
 const alpha=await gate.fetch(new Request('https://anevum.com/studio/alpha'),env,{});
 assert.equal(alpha.status,200);
 assert.equal(alpha.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
 const ordinary=await gate.fetch(new Request('https://anevum.com/studio'),env,{});
 assert.equal(ordinary.headers.get('x-robots-tag'),null);
 const gated=await gate.fetch(new Request('https://anevum.com/studio/alpha'),{...env,ANEVUM_PRELAUNCH_MODE:'gated'},{});
 assert.match(await gated.text(),/ANEVUM \/\/ THE TRANSMISSION/);
 assert.equal(gated.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
 const slashAlpha=await gate.fetch(new Request('https://anevum.com/studio/alpha/'),env,{});
 assert.equal(slashAlpha.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
 assert.match(gateway,/PUBLIC_ALPHA\.test\(pathname\)/);
});

test('layout keeps mobile source, preview and interactions accessible',()=>{
 for(const selector of ['.ap96-root','.ap96-workspace','.ap96-editor-grid','.ap96-frame','.ap96-template-list','.ap96-notice'])assert.ok(css.includes(selector),selector);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/@media\(max-width:360px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(forced-colors:active\)/);
 assert.match(page,/aria-label="Source editor"/);
 assert.match(page,/aria-label="Live design preview"/);
 assert.match(page,/role="status" aria-live="polite"/);
 assert.match(page,/aria-label="Preview screen width"/);
 assert.match(page,/checked=\{live\}/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {publicPageMetadata} from '../web/src/lib/public-page-metadata.ts';

test('actual public V136 destinations receive unique, truthful canonical metadata',()=>{
  const routes=['/','/discover','/start','/guide','/creators','/community',
    '/boards','/status','/levels','/recognition','/auras','/join',
    '/support','/support/transparency'];
  const titles=new Set();
  for(const path of routes){
    const meta=publicPageMetadata(path);
    assert.equal(meta.canonicalPath,path);
    assert.equal(meta.indexable,true);
    assert.match(meta.title,/ANEVUM/);
    assert.ok(meta.description.length>=65);
    assert.equal(titles.has(meta.title),false,'Distinct public route title: '+path);
    titles.add(meta.title);
  }
  assert.equal(publicPageMetadata('/discover/').canonicalPath,'/discover');
  assert.equal(publicPageMetadata('/discover?category=games').canonicalPath,null,
    'Function accepts the router pathname, not an untrusted full URL');
});

test('private, unknown and unverified dynamic routes never borrow homepage canonical',()=>{
  for(const route of ['/member','/member/setup','/studio','/studio/new',
    '/studio/packages/secret','/saved','/library','/workspace',
    '/community/write','/community/review','/projects/package/private',
    '/projects/unapproved','/creators/unverified','/not-a-route']){
    const meta=publicPageMetadata(route);
    assert.equal(meta.indexable,false,route);
    assert.equal(meta.canonicalPath,null,route);
  }
  assert.equal(publicPageMetadata('/community-other').indexable,false);
});

test('client-side head manager is mounted once and leaves release/backends untouched',()=>{
  const app=readFileSync(new URL('../web/src/App.tsx',import.meta.url),'utf8');
  const source=readFileSync(new URL('../web/src/components/PublicPageMetadata.tsx',import.meta.url),'utf8');
  assert.equal((app.match(/<PublicPageMetadata\/>/g)||[]).length,1);
  for(const token of ['document.title','link[rel="canonical"]','og:url','twitter:description','noindex,nofollow']){
    assert.ok(source.includes(token),'Missing route-aware head contract: '+token);
  }
  assert.doesNotMatch(source,/fetch\s*\(|localStorage|sessionStorage|XMLHttpRequest|document\.cookie/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {COMMONS_DISTRICTS,decodeCommonsQuery,nextCommonsQuery,moderatedPostsEnabled} from '../web/src/lib/commons-next-model.ts';
test('all eight existing category API identifiers have unique districts',()=>{
 const ids=COMMONS_DISTRICTS.map(x=>x.id);
 assert.deepEqual([...new Set(ids)].sort(),['automation','creative','games','learning','libraries','other','research','tools']);
 assert.ok(COMMONS_DISTRICTS.every(x=>x.coordinates.length===2&&x.coordinates.every(n=>n>=0&&n<=100)));
});
test('invalid URL state resolves to safe known views and categories',()=>{
 const q=decodeCommonsQuery(new URLSearchParams('view=staff&category=secret&sort=future'));
 assert.equal(q.view,'signals');assert.equal(q.category,'');assert.equal(q.sort,'new');
});
test('URL parsing supports atlas and hot sort',()=>{
 const q=decodeCommonsQuery(new URLSearchParams('view=atlas&category=games&sort=hot&q=maker'));
 assert.deepEqual(q,{view:'atlas',category:'games',sort:'hot',q:'maker'});
});
test('navigation updates preserve unrelated URL state',()=>{
 const a=nextCommonsQuery(new URLSearchParams('view=atlas&q=render&sort=hot'),{category:'research',view:'signals'});
 assert.equal(a.get('category'),'research');assert.equal(a.get('q'),'render');assert.equal(a.get('sort'),'hot');
});
test('clearing removes keys rather than emptying them',()=>{
 const a=nextCommonsQuery(new URLSearchParams('q=old&category=games'),{q:'',category:''});
 assert.equal(a.has('q'),false);assert.equal(a.has('category'),false);
});
test('project search is bounded and trimmed',()=>{
 const a=nextCommonsQuery(new URLSearchParams(),{q:'   '+'x'.repeat(100)});
 assert.equal(a.get('q').length,72);
 assert.equal(decodeCommonsQuery(new URLSearchParams('q='+('z'.repeat(90)))).q.length,72);
});
test('discussion availability is fail-closed',()=>{
 assert.equal(moderatedPostsEnabled(undefined),false);
 assert.equal(moderatedPostsEnabled({features:{}}),false);
 assert.equal(moderatedPostsEnabled({features:{communityPosts:false}}),false);
 assert.equal(moderatedPostsEnabled({features:{communityPosts:true}}),true);
});
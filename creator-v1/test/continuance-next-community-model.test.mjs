import test from 'node:test';
import assert from 'node:assert/strict';
import {COMMONS_DISTRICTS,decodeCommonsQuery,nextCommonsQuery,moderatedPostsEnabled,normalizeCommonsSearch,commonsDiscoverPath,commonsCreatorsPath} from '../web/src/lib/commons-next-model.ts';
import {projectDetailPath,safeReturnPath} from '../web/src/lib/navigation.ts';
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
 assert.deepEqual(q,{view:'atlas',category:'games',sort:'hot',q:'maker',atlas:''});
});
test('navigation updates preserve unrelated URL state',()=>{
 const original=new URLSearchParams('view=atlas&q=render&sort=hot&review=owner');
 const a=nextCommonsQuery(original,{category:'research',view:'signals'});
 assert.equal(a.get('category'),'research');assert.equal(a.get('q'),'render');assert.equal(a.get('sort'),'hot');
 assert.equal(a.get('review'),'owner');assert.equal(original.get('view'),'atlas');assert.equal(original.has('category'),false);
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
test('decoded and submitted searches normalize controls and whitespace consistently',()=>{
 const raw='  Maker\u0000\t  tools\r\n& ideas\u007f  ';
 const expected='Maker tools & ideas';
 assert.equal(normalizeCommonsSearch(raw),expected);
 assert.equal(decodeCommonsQuery(new URLSearchParams({q:raw})).q,expected);
 assert.equal(nextCommonsQuery(new URLSearchParams(),{q:raw}).get('q'),expected);
 assert.equal(nextCommonsQuery(new URLSearchParams('q=old'),{q:' \n\t\u0000 '}).has('q'),false);
});
test('query bounds keep complete Unicode characters',()=>{
 const result=normalizeCommonsSearch('a'.repeat(71)+'🪐');
 assert.equal(result,'a'.repeat(71));
 assert.equal(normalizeCommonsSearch('🪐'.repeat(40)),'🪐'.repeat(36));
 assert.equal(normalizeCommonsSearch('a'.repeat(71)+'  next'),'a'.repeat(71));
});
test('Discover continuation and project return preserve supported filters',()=>{
 const current=decodeCommonsQuery(new URLSearchParams('view=signals&category=research&q=orbital+maps&sort=hot&review=owner'));
 const destination=commonsDiscoverPath(current);
 assert.equal(destination,'/discover?q=orbital+maps&category=research');
 assert.equal(safeReturnPath(destination),destination);
 const detail=new URL(projectDetailPath('project id',destination),'https://anevum.invalid');
 assert.equal(detail.pathname,'/projects/project%20id');
 assert.equal(detail.searchParams.get('from'),destination);
});
test('directory links encode query text as data and cannot introduce navigation parameters',()=>{
 const q='https://elsewhere.test/?view=staff&category=secret#top';
 const discovery=new URL(commonsDiscoverPath({q,category:'games'}),'https://anevum.invalid');
 assert.equal(discovery.origin,'https://anevum.invalid');
 assert.equal(discovery.pathname,'/discover');assert.equal(discovery.hash,'');
 assert.deepEqual([...discovery.searchParams.keys()],['q','category']);
 assert.equal(discovery.searchParams.get('q'),q);assert.equal(discovery.searchParams.get('category'),'games');
 const people=commonsCreatorsPath({q:'  Nina & Sol  ',category:'games',sort:'hot'});
 assert.equal(people,'/creators?q=Nina+%26+Sol');
 assert.equal(safeReturnPath(people),people);
});
test('empty and invalid destination filters fall back to the public directory roots',()=>{
 assert.equal(commonsDiscoverPath({q:' \u0000 ',category:'private'}),'/discover');
 assert.equal(commonsDiscoverPath({q:'',category:'automation'}),'/discover?category=automation');
 assert.equal(commonsCreatorsPath({q:'\t '}),'/creators');
});
test('non-Latin queries remain within the existing project-return path budget',()=>{
 for(const q of ['界'.repeat(72),'🪐'.repeat(36),('界🪐 ').repeat(24)]){
  for(const destination of [commonsDiscoverPath({q,category:'automation'}),commonsCreatorsPath({q})]){
   assert.ok(destination.length<=512);
   assert.equal(safeReturnPath(destination),destination);
   const restored=new URL(destination,'https://anevum.invalid').searchParams.get('q');
   assert.ok(restored.length>0);assert.ok(normalizeCommonsSearch(q).startsWith(restored));
   assert.equal(restored.includes('\ufffd'),false);
   if(destination.startsWith('/discover'))assert.equal(new URL(destination,'https://anevum.invalid').searchParams.get('category'),'automation');
  }
 }
});
test('discussion availability is fail-closed',()=>{
 assert.equal(moderatedPostsEnabled(undefined),false);
 assert.equal(moderatedPostsEnabled({features:{}}),false);
 assert.equal(moderatedPostsEnabled({features:{communityPosts:false}}),false);
 assert.equal(moderatedPostsEnabled({features:{communityPosts:true}}),true);
});

test('Atlas presentation links are typed, bounded and device-default when absent or invalid',()=>{
 for(const value of ['map','list']){
  const q=decodeCommonsQuery(new URLSearchParams('view=atlas&atlas='+value));
  assert.equal(q.atlas,value);
  const updated=nextCommonsQuery(new URLSearchParams('view=atlas&q=maker&category=tools'),{atlas:value});
  assert.equal(updated.get('atlas'),value);
  assert.equal(updated.get('q'),'maker');
  assert.equal(updated.get('category'),'tools');
 }
 for(const raw of ['', 'auto', 'mobile', 'MAP', 'private', 'https://elsewhere.invalid']){
  const params=new URLSearchParams({view:'atlas',atlas:raw});
  assert.equal(decodeCommonsQuery(params).atlas,'');
 }
 const reset=nextCommonsQuery(new URLSearchParams('view=atlas&atlas=map&category=research&q=field'),{atlas:''});
 assert.equal(reset.has('atlas'),false);
 assert.equal(reset.get('category'),'research');
 assert.equal(reset.get('q'),'field');
});
test('individual removal of project category or search keeps the other query and does not mutate inputs',()=>{
 const original=new URLSearchParams('view=signals&category=research&q=field&sort=hot&atlas=map');
 const withoutCategory=nextCommonsQuery(original,{category:''});
 const withoutSearch=nextCommonsQuery(original,{q:''});
 assert.equal(withoutCategory.get('category'),null);
 assert.equal(withoutCategory.get('q'),'field');
 assert.equal(withoutCategory.get('atlas'),'map');
 assert.equal(withoutSearch.get('q'),null);
 assert.equal(withoutSearch.get('category'),'research');
 assert.equal(withoutSearch.get('sort'),'hot');
 assert.equal(original.get('q'),'field');
 assert.equal(original.get('category'),'research');
});

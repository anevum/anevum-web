import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogueParams,catalogueRoute,catalogueReturn,projectRoute,publicLocation,projectDestination} from '../site/catalogue-state.mjs';

test('category changes retain search and creator but restart pagination', () => {
  assert.equal(catalogueRoute('browse','q=adventure&category=tools&creator=alice&cursor=p8',{category:'games'}), 'browse?q=adventure&category=games&creator=alice');
});
test('All removes only the category', () => {
  assert.equal(catalogueRoute('browse','q=adventure&category=games&cursor=p8',{category:null}), 'browse?q=adventure');
});
test('a new search keeps category and resets the cursor', () => {
  assert.equal(catalogueRoute('browse','category=games&cursor=p8',{q:'forest'}), 'browse?q=forest&category=games');
});
test('next and first page keep the original filters', () => {
  const query='q=forest&category=games&limit=12&cursor=p8';
  assert.equal(catalogueRoute('browse',query,{cursor:'p9'}),'browse?q=forest&category=games&limit=12&cursor=p9');
  assert.equal(catalogueRoute('browse',query,{cursor:null}),'browse?q=forest&category=games&limit=12');
});
test('routing metadata and unexpected keys never reach the API', () => {
  assert.equal(catalogueParams('q=forest&from=browse&token=x&admin=true').toString(), 'q=forest');
});
test('directory and portfolio requests use their own allowed fields', () => {
  assert.equal(catalogueParams('q=ada&category=tools&creator=alice&cursor=alice&limit=12','creators').toString(),'q=ada&limit=12&cursor=alice');
  assert.equal(catalogueParams('q=ada&category=tools&limit=12&cursor=p3','creator/alice').toString(),'limit=12&cursor=p3');
});
test('return links retain safe catalogue state', () => {
  const route='browse?q=forest&category=games&cursor=p8';
  assert.equal(catalogueReturn(route),route);
  assert.equal(projectRoute('forest-game',route),'project/forest-game?from='+encodeURIComponent(route));
});
test('untrusted return targets cannot redirect or enter private routes', () => {
  for (const value of ['https://evil.example','//evil.example','javascript:alert(1)','account','../studio','browse#account','browse\\account',null,'a'.repeat(2049)]) assert.equal(catalogueReturn(value),'browse');
});
test('unknown return parameters cannot carry credentials', () => {
  assert.equal(catalogueReturn('browse?q=forest&token=x&from=https://evil.example'),'browse?q=forest');
});
test('project ids cannot escape their route', () => {
  for (const value of ['../staff','a/b','a?x=1','<script>','',null]) assert.equal(projectRoute(value),null);
});
test('direct URLs and hash links resolve identically', () => {
  const direct=publicLocation({pathname:'/discover',search:'?q=forest&category=games',hash:''});
  const hash=publicLocation({pathname:'/',search:'',hash:'#browse?q=forest&category=games'});
  assert.equal(direct.key,hash.key);
  assert.equal(publicLocation({pathname:'/projects/forest',hash:'',search:''}).route,'project/forest');
  assert.equal(publicLocation({pathname:'/creators/alice',hash:'',search:''}).route,'creator/alice');
});
test('hash navigation overrides an old direct creator URL', () => {
  assert.equal(publicLocation({pathname:'/creators',hash:'#browse?category=games',search:'?q=alice'}).key,'browse?category=games');
});
test('skip-to-content hash is not an invalid app route', () => {
  assert.equal(publicLocation({pathname:'/discover',hash:'#main',search:'?category=games'}).key,'browse?category=games');
});
test('unknown screens remain unknown rather than granting a private action', () => {
  assert.equal(publicLocation({pathname:'/',hash:'#studio',search:''}).route,'studio');
});
test('search bounds, single parameters and cursor syntax match public limits', () => {
  assert.equal(catalogueParams('q='+encodeURIComponent(' x\n')+'&q=other&limit=999&cursor=../x&category=bad').toString(),'q=x');
  assert.equal(catalogueParams({q:'a'.repeat(150)},'creators').get('q').length,80);
  assert.equal(catalogueParams({q:'a'.repeat(150)}).get('q').length,100);
});
test('project destinations name their real host', () => {
  assert.deepEqual(projectDestination('https://creator.example/game'),{href:'https://creator.example/game',host:'creator.example'});
});
test('unsafe destination schemes, credentials and private addresses are rejected', () => {
  for (const value of ['http://creator.example','javascript:alert(1)','https://user:pass@creator.example','https://127.0.0.1','https://[::1]','https://localhost','https://a.internal','https://creator.example:8443','https://creator.example?access_token=x',null]) assert.equal(projectDestination(value),null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePackageCatalogue,readPackageCatalogue,packageDiscoveryResults} from '../web/src/lib/creator-package-gallery-v010.ts';

const id='5764a892-0526-47b6-953b-4cf6a9053c0f';
const other='6764a892-0526-47b6-953b-4cf6a9053c0f';
const play='/upload/v3/play/'+id;
const raw={id,title:'Signal Drift',summary:'A browser game about finding a distant signal.',category:'game',version:1,cover_url:null};

test('published package discovery accepts only valid records and canonical playable paths',()=>{
 const result=parsePackageCatalogue({projects:[raw,raw,{...raw,id:'bad'},
  {...raw,id:other,play_url:'https://outside.invalid/game'},
  {...raw,id:other,status:'pending_review'},
  {...raw,id:other,draft_status:'ready'},
  {...raw,id:other,play_url:'/upload/v3/play/'+other+'?preview=1'},
  {...raw,id:other,version:0}]});
 assert.equal(result.length,1);
 assert.equal(result[0].playUrl,play);
 assert.equal(result[0].status,'published');
 assert.equal(result[0].previewUrl,null);
 assert.equal(result[0].draftStatus,null);
 assert.equal(result[0].publishedAt,null,'A missing publication timestamp is not fabricated');
 assert.equal(parsePackageCatalogue({projects:[{...raw,cover_url:'https://outside.invalid/art.png'}]})[0].coverUrl,null);
 assert.throws(()=>parsePackageCatalogue({items:[raw]}),/catalogue response/);
});

test('package discovery shares search and category filters without inventing free declarations',()=>{
 const projects=parsePackageCatalogue({projects:[raw,
  {...raw,id:other,title:'Orbital Lab',category:'simulation'},
  {...raw,id:'7764a892-0526-47b6-953b-4cf6a9053c0f',title:'Task Ledger',category:'app'},
  {...raw,id:'8764a892-0526-47b6-953b-4cf6a9053c0f',title:'Echo Chronicle',category:'story'}]});
 const filter={query:'',category:'',freeOnly:false};
 assert.equal(packageDiscoveryResults(projects,filter).length,4);
 assert.equal(packageDiscoveryResults(projects,{...filter,query:'SIGNAL DRIFT'}).length,1);
 assert.equal(packageDiscoveryResults(projects,{...filter,query:'distant signal'}).length,4);
 assert.deepEqual(packageDiscoveryResults(projects,{...filter,category:'games'}).map(x=>x.category),['game','simulation']);
 assert.equal(packageDiscoveryResults(projects,{...filter,category:'tools'})[0].title,'Task Ledger');
 assert.equal(packageDiscoveryResults(projects,{...filter,category:'creative'})[0].title,'Echo Chronicle');
 assert.equal(packageDiscoveryResults(projects,{...filter,category:'research'}).length,0);
 assert.equal(packageDiscoveryResults(projects,{...filter,freeOnly:true}).length,0);
});

test('duplicate legacy records are recognized only by exact project identity or canonical package demo',()=>{
 const projects=parsePackageCatalogue({projects:[raw]}),filter={query:'',category:'',freeOnly:false};
 for(const legacy of [[{id,demoUrl:null}], [{id:'legacy',demoUrl:play}],
  [{id:'legacy',demoUrl:'https://anevum.com'+play+'/'}]]){
  assert.equal(packageDiscoveryResults(projects,filter,legacy).length,0);
 }
 for(const demoUrl of ['https://outside.invalid'+play,'https://anevum.com.attacker.invalid'+play,
  'https://anevum.com'+play+'?preview=1','https://someone@anevum.com'+play]){
  assert.equal(packageDiscoveryResults(projects,filter,[{id:'legacy',demoUrl}]).length,1);
 }
});

test('package catalogue defaults off, omits credentials and preserves disabled/outage distinctions',async()=>{
 const original=globalThis.fetch,calls=[];
 try{
  globalThis.fetch=async(url,init)=>{calls.push({url,init});return Response.json({projects:[raw]});};
  assert.equal(await readPackageCatalogue(),null);
  assert.equal(await readPackageCatalogue(false),null);
  assert.equal(calls.length,0);
  const result=await readPackageCatalogue(true);
  assert.equal(result[0].id,id);
  assert.equal(calls[0].url,'/upload/v3/api/v1/packages/projects');
  assert.equal(calls[0].init.method,'GET');assert.equal(calls[0].init.credentials,'omit');
  assert.equal(calls[0].init.mode,'same-origin');assert.equal(calls[0].init.cache,'no-store');
  assert.equal(calls[0].init.redirect,'error');
  globalThis.fetch=async()=>new Response('Not found',{status:404});
  assert.equal(await readPackageCatalogue(true),null);
  globalThis.fetch=async()=>new Response('Unavailable',{status:503});
  await assert.rejects(readPackageCatalogue(true),/temporarily unavailable/);
  globalThis.fetch=async()=>new Response('<html>not JSON</html>',{status:200,headers:{'content-type':'text/html'}});
  await assert.rejects(readPackageCatalogue(true),/unexpected response/);
 }finally{globalThis.fetch=original;}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {selectWeeklyDiscoveryCandidates,fetchWeeklyDiscoveryPreview} from '../communications/weekly-discovery-preview.mjs';

const NOW=Date.parse('2026-10-24T12:00:00Z');
const item=(id,creatorHandle='alice',days=1)=>({id,title:'A real published creation',summary:'Public description',
  category:'tools',creatorHandle,creatorName:'Verified creator',publishedAt:new Date(NOW-days*86400000).toISOString()});
const board=items=>({source:'approved-public-projects',qualityRankingAvailable:false,latestReleases:items,firstLooks:[],publishingCreators:[]});
test('no content gives no digest, without invented work or outbound delivery',()=>{
 const result=selectWeeklyDiscoveryCandidates(board([]),{now:NOW});
 assert.equal(result.eligible,false);assert.equal(result.shouldSend,false);
 assert.deepEqual(result.items,[]);
 assert.equal(result.reason,'no-new-approved-publications');
 assert.equal(result.mode,'preview-only');
});
test('only genuinely recent approved public rows selected, restricted to distinct creators first',()=>{
 const rows=[item('old','oldcreator',8),item('future','ahead',-2),item('one','alice',1),item('two','alice',2),item('three','bob',3),item('four','charlie',1),item('five','dan',1),item('six','eve',1),item('seven','frank',1)];
 const r=selectWeeklyDiscoveryCandidates(board(rows),{now:NOW});
 assert.equal(r.shouldSend,false);assert.equal(r.items.length,5);
 assert.equal(r.distinctCreators,5);
 assert.deepEqual(new Set(r.items.map(x=>x.creatorHandle)),new Set(['alice','charlie','dan','eve','frank']));
 assert.ok(!r.items.some(x=>x.id==='old'||x.id==='future'||x.id==='two'||x.id==='three'));
 assert.ok(r.items.every(x=>x.url.startsWith('https://anevum.com/projects/')));
});
test('reject forged source, quality scores, malformed ids and unpublished or unsupported rows',()=>{
 assert.throws(()=>selectWeeklyDiscoveryCandidates({...board([]),source:'some-creator-draft'}, {now:NOW}));
 assert.throws(()=>selectWeeklyDiscoveryCandidates({...board([]),qualityRankingAvailable:true}, {now:NOW}));
 assert.throws(()=>selectWeeklyDiscoveryCandidates(board([item('../private')]), {now:NOW}));
 assert.throws(()=>selectWeeklyDiscoveryCandidates(board([{...item('valid'),category:'unpublished'}]), {now:NOW}));
 assert.throws(()=>selectWeeklyDiscoveryCandidates(board([{...item('valid'),creatorHandle:'invalid name'}]), {now:NOW}));
 assert.throws(()=>selectWeeklyDiscoveryCandidates(board(Array.from({length:13},(_,i)=>item('id'+i))), {now:NOW}));
});
test('user-controlled public text is length-bounded and never becomes an external URL',()=>{
 const payload={...item('safe'),title:'A'.repeat(500),summary:'<script>alert(1)</script>',creatorName:'C'.repeat(1000)};
 assert.throws(()=>selectWeeklyDiscoveryCandidates(board([payload]),{now:NOW}));
 const candidate={...item('safe'),title:'Hello',summary:'<b>Text only</b>',demoUrl:'https://evil.example',sourceUrl:'https://evil.example'};
 const result=selectWeeklyDiscoveryCandidates(board([candidate]),{now:NOW});
 assert.equal(result.items[0].url,'https://anevum.com/projects/safe');
 assert.equal(result.items[0].summary,'<b>Text only</b>');
 assert.equal('demoUrl' in result.items[0],false);
});
test('read-only public boards preview accepts only JSON, sends no credentials, enforces source',async()=>{
 let called=0;
 const fetcher=async(url,options)=>{
  called++;
  assert.equal(url,'https://anevum.com/api/v1/boards');
  assert.equal(options.method,'GET');assert.equal(options.credentials,'omit');
  return new Response(JSON.stringify(board([item('project')])),{headers:{'content-type':'application/json'}});
 };
 const preview=await fetchWeeklyDiscoveryPreview({fetcher,now:NOW});
 assert.equal(called,1);assert.equal(preview.items.length,1);assert.equal(preview.shouldSend,false);
 await assert.rejects(()=>fetchWeeklyDiscoveryPreview({fetcher:async()=>new Response('bad',{headers:{'content-type':'text/html'}}),now:NOW}));
});

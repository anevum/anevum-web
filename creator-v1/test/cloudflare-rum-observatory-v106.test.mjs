import test from 'node:test';
import assert from 'node:assert/strict';
import {rumBindingState,buildRumQuery,normalizeRumResponse,fetchRumAggregates,RUM_SOURCE} from '../analytics/cloudflare-rum-observatory-v106.mjs';

const NOW=Date.parse('2026-10-23T18:22:02.000Z');
const tag='0123456789abcdef0123456789abcdef';
const env={ANEVUM_RUM_ACCOUNT_TAG:tag,ANEVUM_RUM_SITE_TAG:'1234567890abcdef',ANEVUM_RUM_READ_TOKEN:'local-synthetic-not-a-real-secret-000000'};
const rows=[
 {dimensions:{date:'2026-10-23'},count:12,sum:{visits:7}},
 {dimensions:{date:'2026-10-20'},count:3,sum:{visits:2}}
];
const response=(records=rows,overrides={})=>({
 ok:true,
 headers:{get(key){if(key==='content-type')return 'application/json';if(key==='content-length')return null;return null;}},
 async text(){return JSON.stringify({data:{viewer:{accounts:[{rumPageloadEventsAdaptiveGroups:records}]}},...overrides})}
});
test('optional Cloudflare RUM reader requires explicit valid private account, site, and token bindings',()=>{
 assert.equal(rumBindingState({}),'unavailable');
 assert.equal(rumBindingState({...env,ANEVUM_RUM_READ_TOKEN:''}),'unavailable');
 assert.equal(rumBindingState({...env,ANEVUM_RUM_ACCOUNT_TAG:'bad'}),'unavailable');
 assert.equal(rumBindingState({...env,ANEVUM_RUM_SITE_TAG:'unsafe site'}),'unavailable');
 assert.equal(rumBindingState(env),'ready');
});
test('inactive reader cannot call Cloudflare and returns unavailable, not a fabricated zero',async()=>{
 let calls=0;
 const result=await fetchRumAggregates({}, {now:NOW,fetcher:async()=>{calls++;throw Error('must not request')}});
 assert.equal(calls,0);
 assert.equal(result.status,'unavailable');
 assert.ok(!('visits' in result));
 assert.ok(!('pageLoads' in result));
 assert.equal(result.source,RUM_SOURCE);
});
test('GraphQL query is bounded to own account/site and thirty UTC dates, injection rejected',()=>{
 const q=buildRumQuery(tag,'1234567890abcdef','2026-09-24','2026-10-23');
 assert.match(q,/rumPageloadEventsAdaptiveGroups\(limit: 31, orderBy: \[date_ASC\]/);
 assert.match(q,/sum \{ visits \}/);
 assert.ok(q.includes('"2026-09-24"'));
 assert.ok(q.includes('"2026-10-23"'));
 assert.throws(()=>buildRumQuery(tag,'broken"} } viewer {','2026-09-24','2026-10-23'),/Invalid/);
 assert.throws(()=>buildRumQuery(tag,'1234567890abcdef','2026-10-24','2026-10-23'),/Invalid/);
});
test('valid returned browser-beacon counts are zero filled and explicitly labeled estimated',()=>{
 const d=normalizeRumResponse({viewer:{accounts:[{rumPageloadEventsAdaptiveGroups:rows}]}},NOW);
 assert.equal(d.status,'estimated');
 assert.equal(d.quality,'may_be_sampled');
 assert.equal(d.source,RUM_SOURCE);
 assert.equal(d.days.length,30);
 assert.equal(d.from,'2026-09-24');
 assert.equal(d.to,'2026-10-23');
 assert.equal(d.visits,9);
 assert.equal(d.pageLoads,15);
 assert.equal(d.days.find(x=>x.day==='2026-10-22').visits,0);
 assert.match(d.warning,/test\/bot/);
 assert.match(d.meaning,/not unique people/);
});
test('duplicate, malformed, oversize and out-of-range aggregates fail closed',()=>{
 const pack=a=>({viewer:{accounts:[{rumPageloadEventsAdaptiveGroups:a}]}});
 assert.throws(()=>normalizeRumResponse(pack([...rows,rows[0]]),NOW));
 assert.throws(()=>normalizeRumResponse(pack([{dimensions:{date:'2026-10-31'},count:1,sum:{visits:1}}]),NOW));
 assert.throws(()=>normalizeRumResponse(pack([{dimensions:{date:'2026-10-21'},count:-1,sum:{visits:1}}]),NOW));
 assert.throws(()=>normalizeRumResponse(pack([{dimensions:{date:'2026-10-21'},count:1,sum:{visits:Infinity}}]),NOW));
 assert.throws(()=>normalizeRumResponse(pack(Array.from({length:31},(_,i)=>({dimensions:{date:'2026-10-23'},count:i,sum:{visits:1}}))),NOW));
 assert.throws(()=>normalizeRumResponse({viewer:{accounts:[]}},NOW));
});
test('server request is POST to Cloudflare only, uses private token, validates response',async()=>{
 let call;
 const data=await fetchRumAggregates(env,{
  now:NOW,
  fetcher:async (url,init)=>{call={url,init};return response()}
 });
 assert.equal(call.url,'https://api.cloudflare.com/client/v4/graphql');
 assert.equal(call.init.method,'POST');
 assert.equal(call.init.redirect,'error');
 assert.equal(call.init.headers.Authorization,'Bearer '+env.ANEVUM_RUM_READ_TOKEN);
 assert.equal(data.visits,9);
 assert.equal(data.pageLoads,15);
 assert.ok(!JSON.stringify(data).includes(tag));
 assert.ok(!JSON.stringify(data).includes(env.ANEVUM_RUM_READ_TOKEN));
});
test('Cloudflare errors and upstream token strings cannot leak through generic error',async()=>{
 for(const resp of [
  {ok:false,headers:{get(){return 'application/json'}}},
  {...response(),text:async()=>JSON.stringify({errors:[{message:'secret'}],data:{}})},
  {...response(),headers:{get(key){return key==='content-type'?'text/html':null}}},
  {...response(),text:async()=>'<html>secret</html>'}
 ]){
  await assert.rejects(fetchRumAggregates(env,{now:NOW,fetcher:async()=>resp}),e=>
   e.message==='CLOUDFLARE_RUM_READ_UNAVAILABLE'&&!e.message.includes(env.ANEVUM_RUM_READ_TOKEN));
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import * as blocks from '../../creator-v1/workbench-alpha/document.mjs';
import * as ui from '../../creator-v1/interface-builder/document.mjs';
import {createServer,MAX_BODY_BYTES} from './server.mjs';

const TOKEN='local-test-token-with-thirty-two-characters-minimum';
async function withService(callback) {
  const server=createServer({token:TOKEN});
  await new Promise((ok,fail)=>server.once('error',fail).listen(0,'127.0.0.1',ok));
  const base='http://127.0.0.1:'+server.address().port;
  try { await callback(base); }
  finally { await new Promise((ok,fail)=>server.close(err=>err?fail(err):ok())); }
}
const auth={authorization:'Bearer '+TOKEN};
const post=(base,body,headers={})=>fetch(base+'/v1/diagnose',{
  method:'POST',
  headers:{...auth,'content-type':'application/json',...headers},
  body:typeof body==='string'?body:JSON.stringify(body)
});

test('startup fails closed without an adequate server token',()=>{
  assert.throws(()=>createServer({token:''}),/LAB_API_TOKEN/);
  assert.throws(()=>createServer({token:'short'}),/LAB_API_TOKEN/);
});

test('public health does not expose credentials, user content or a model', async()=>{
  await withService(async base=>{
    const response=await fetch(base+'/healthz');
    const body=await response.json();
    assert.equal(response.status,200);
    assert.equal(body.ok,true);
    assert.equal(body.mode,'read-only');
    assert.equal(body.models,false);
    assert.equal(body.persistence,false);
    assert.match(response.headers.get('cache-control'),/no-store/);
    assert.ok(!JSON.stringify(body).includes(TOKEN));
  });
});

test('capabilities require a token and advertise no writes or model',async()=>{
  await withService(async base=>{
    assert.equal((await fetch(base+'/v1/capabilities')).status,401);
    const response=await fetch(base+'/v1/capabilities',{headers:auth});
    assert.equal(response.status,200);
    const body=await response.json();
    assert.deepEqual(body.capabilities,['studio.document.diagnose','lab.synthetic-benchmark.run']);
    assert.equal(body.writesEnabled,false);
    assert.equal(body.modelEnabled,false);
    assert.equal(body.storesSource,false);
  });
});

test('diagnose is unauthorized by default and does not leak source on success',async()=>{
  await withService(async base=>{
    const source=blocks.encode(blocks.starter());
    const forbidden=await fetch(base+'/v1/diagnose',{method:'POST',
      headers:{'content-type':'application/json'},body:JSON.stringify({source})});
    assert.equal(forbidden.status,401);
    const reply=await post(base,{source});
    const text=await reply.text();
    assert.equal(reply.status,200);
    assert.equal(JSON.parse(text).format,'anevum.blocks.v1');
    assert.equal(JSON.parse(text).brief.status,'no_structural_warnings');
    assert.deepEqual(JSON.parse(text).brief.recommendations,[]);
    assert.equal(JSON.parse(text).sourceBytes,Buffer.byteLength(source));
    assert.ok(!text.includes(source));
  });
});

test('reliably identifies actual narrative and UI defects without editing content',async()=>{
  await withService(async base=>{
    const story=blocks.starter();
    story.blocks.push(blocks.block('scene','Disconnected chapter'));
    const storySource=blocks.encode(story);
    const storyReply=await post(base,{source:storySource});
    assert.equal(storyReply.status,200);
    assert.ok((await storyReply.json()).findings.some(x=>x.code==='scene.unreachable'));

    const doc=ui.starter();
    const loose=ui.page('Hidden page');
    loose.components.push(ui.component('button','',''));
    doc.pages.push(loose);
    const source=ui.encode(doc);
    const response=await post(base,{source});
    assert.equal(response.status,200);
    const result=await response.json();
    assert.ok(result.findings.some(x=>x.code==='page.unreachable'));
    assert.ok(result.findings.some(x=>x.code==='button.unlabeled'));
    assert.ok(result.findings.some(x=>x.code==='button.inert'));
    assert.equal(result.brief.schema,'anevum.project-doctor.brief.v001');
    assert.equal(result.brief.status,'review');
    assert.ok(result.brief.recommendations.every(x=>typeof x.nextStep==='string'));
    assert.ok(!JSON.stringify(result.brief).includes('Private project text'));
  });
});

test('invalid payloads, unknown formats and oversized bodies fail closed',async()=>{
  await withService(async base=>{
    assert.equal((await post(base,'{')).status,400);
    assert.equal((await post(base,{source:23})).status,400);
    assert.equal((await post(base,{source:'abc',extra:'unexpected'})).status,400);
    assert.equal((await post(base,{source:'arbitrary JavaScript'})).status,422);
    const wrongType=await post(base,{source:'text'},{'content-type':'text/plain'});
    assert.equal(wrongType.status,415);
    const tooBig=await post(base,{source:'x'.repeat(MAX_BODY_BYTES)});
    assert.equal(tooBig.status,413);
  });
});

test('unknown routes, methods and query strings have no side effects',async()=>{
  await withService(async base=>{
    assert.equal((await fetch(base+'/v1/unknown',{headers:auth})).status,404);
    assert.equal((await fetch(base+'/v1/diagnose',{headers:auth})).status,405);
    assert.equal((await fetch(base+'/v1/capabilities?secret=1',{headers:auth})).status,404);
  });
});

test('source is rejected even if valid JSON when canonical validation fails',async()=>{
  await withService(async base=>{
    const document=blocks.starter();
    document.blocks[0].type='invalid';
    const source=blocks.PREFIX+JSON.stringify(document);
    const reply=await post(base,{source});
    assert.equal(reply.status,422);
    assert.equal((await reply.json()).findings[0].code,'document.invalid');
  });
});

test('authenticated benchmark runs synthetic fixtures only and returns measured scores',async()=>{
  await withService(async base=>{
    const unauth=await fetch(base+'/v1/benchmark');
    assert.equal(unauth.status,401);
    const response=await fetch(base+'/v1/benchmark',{headers:auth});
    assert.equal(response.status,200);
    const stats=await response.json();
    assert.equal(stats.benchmark,'continuance-project-doctor-synthetic-v001');
    assert.equal(stats.source,'synthetic-fixtures-only');
    assert.equal(stats.memberData,false);
    assert.equal(stats.modelEvaluated,false);
    assert.equal(stats.fixtures,60);
    assert.equal(stats.clean,10);
    assert.equal(stats.defectCases,50);
    assert.equal(stats.exactMatches,60);
    assert.equal(stats.falsePositives,0);
    assert.equal(stats.falseNegatives,0);
    assert.equal(stats.precision,1);
    assert.equal(stats.recall,1);
    assert.deepEqual(stats.mismatches,[]);
    assert.match(stats.validation,/not real-world accuracy/);
    assert.match(response.headers.get('cache-control'),/no-store/);
    assert.ok(!JSON.stringify(stats).includes(TOKEN));
  });
});

test('benchmark supports only GET with no query parameters',async()=>{
  await withService(async base=>{
    const badMethod=await fetch(base+'/v1/benchmark',{headers:auth,method:'POST'});
    assert.equal(badMethod.status,405);
    assert.equal(badMethod.headers.get('allow'),'GET');
    assert.equal((await fetch(base+'/v1/benchmark?config=1',{headers:auth})).status,404);
    assert.equal((await fetch(base+'/v1/benchmark/',{headers:auth})).status,404);
  });
});

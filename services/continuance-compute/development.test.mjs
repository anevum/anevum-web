import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from './server.mjs';
import {generateLocal,inspectLocalBackend} from './ollama.mjs';
import {EXTENDED_CASES,scoreLexical,casesFor} from './benchmark-fixtures.mjs';
import {runBenchmark} from './benchmark.mjs';
import {createSyntheticJob,advanceSyntheticJob} from './job-contract.mjs';

const TOKEN='only-synthetic-very-long-operator-test-token';
const MODEL='synthetic-model';
const ENDPOINT='http://127.0.0.1:11434';
const DIGEST=createHash('sha256').update('synthetic-input').digest('hex');
const OUT=createHash('sha256').update('synthetic-result').digest('hex');
const JID='cc_'+'a'.repeat(32);
const LEASE='b'.repeat(32);
const newJob=()=>createSyntheticJob({id:JID,task:'code-review',inputDigest:DIGEST,createdAt:100,expiresAt:10_100});
async function localServer(opts,fn) {
  const server=createServer({token:TOKEN,endpoint:ENDPOINT,model:MODEL,...opts});
  await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{await fn(base);}finally{await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
}

// Backend readiness is a factual installed-model check, not a generation proof.
test('local model inventory distinguishes installed, missing and unreachable',async()=>{
  const modelReply=models=>({ok:true,text:async()=>JSON.stringify({models})});
  const good=await inspectLocalBackend({endpoint:ENDPOINT,model:MODEL,fetchImpl:async(u,opt)=>{
    assert.equal(u,'http://127.0.0.1:11434/api/tags');assert.equal(opt.redirect,'error');
    return modelReply([{name:MODEL}]);
  }});
  assert.equal(good.status,'installed');assert.equal(good.inferenceTested,false);
  const missing=await inspectLocalBackend({endpoint:ENDPOINT,model:MODEL,
    fetchImpl:async()=>modelReply([{name:'different-model'}])});
  assert.equal(missing.status,'model_missing');
  const offline=await inspectLocalBackend({endpoint:ENDPOINT,model:MODEL,
    fetchImpl:async()=>{throw Error('sensitive backend reason');}});
  assert.equal(offline.status,'unreachable');
  assert.equal((await inspectLocalBackend({endpoint:'https://remote.example',model:MODEL})).status,'not_configured');
});
test('provider rejects redirect targets and oversized response without leaking content',async()=>{
  await assert.rejects(()=>generateLocal({endpoint:ENDPOINT,model:MODEL,instruction:'a',prompt:'b',maxOutputTokens:100,
    fetchImpl:async(_url,options)=>{assert.equal(options.redirect,'error');throw Error('redirect refused');}}),/backend_unavailable/);
  const tooBig=await inspectLocalBackend({endpoint:ENDPOINT,model:MODEL,
    fetchImpl:async()=>({ok:true,headers:{get:()=>String(200000)},text:async()=>{throw Error('should not read');}})});
  assert.equal(tooBig.status,'unreachable');
});
test('model-status is authenticated, factual, and separate from public configuration health',async()=>{
  let called=0;
  await localServer({inspect:async()=>{called++;return {status:'installed'};}},async base=>{
    const health=await (await fetch(base+'/healthz')).json();
    assert.equal(health.backendConfigured,true);assert.equal(health.modelInstalled,undefined);
    assert.equal((await fetch(base+'/v1/model-status')).status,401);
    assert.equal((await fetch(base+'/v1/model-status?foo=bar',{headers:{authorization:'Bearer '+TOKEN}})).status,404);
    assert.equal((await fetch(base+'/v1/model-status',{method:'POST',headers:{authorization:'Bearer '+TOKEN}})).status,405);
    const response=await fetch(base+'/v1/model-status',{headers:{authorization:'Bearer '+TOKEN}});
    assert.equal(response.status,200);
    const data=await response.json();
    assert.equal(data.status,'installed');assert.equal(data.modelInstalled,true);
    assert.equal(data.inferenceTested,false);assert.equal(data.cloudFallback,false);
    assert.equal(called,1);
  });
});
test('model-status fails closed when unavailable or not configured',async()=>{
  await localServer({inspect:async()=>{throw Error('private secret');}},async base=>{
    const reply=await (await fetch(base+'/v1/model-status',{headers:{authorization:'Bearer '+TOKEN}})).text();
    assert.equal(JSON.parse(reply).status,'unreachable');assert.ok(!reply.includes('private secret'));
  });
  await localServer({endpoint:null,inspect:async()=>{throw Error('must not execute');}},async base=>{
    const data=await (await fetch(base+'/v1/model-status',{headers:{authorization:'Bearer '+TOKEN}})).json();
    assert.equal(data.status,'not_configured');
  });
});
test('extended benchmark fixtures are synthetic, unique, partitioned and bounded',()=>{
  assert.equal(EXTENDED_CASES.length,25);
  assert.equal(new Set(EXTENDED_CASES.map(item=>item.id)).size,25);
  assert.equal(casesFor('extended','development').length,15);
  assert.equal(casesFor('extended','reserved').length,10);
  assert.equal(new Set(EXTENDED_CASES.map(x=>x.task)).size,5);
  assert.ok(EXTENDED_CASES.every(x=>x.prompt.length<500&&x.required.length>0));
  assert.throws(()=>casesFor('extended','all'),/unsupported/);
  assert.throws(()=>casesFor('secret','reserved'),/unsupported/);
});
test('lexical scoring keeps raw model answers out of results',()=>{
  const fixture=EXTENDED_CASES.find(x=>x.id==='res-05-source');
  assert.equal(scoreLexical(fixture,'No supporting citations were provided.').pass,true);
  assert.equal(scoreLexical(fixture,'See https://invalid.example/report for sources.').reason,'prohibited_signal_found');
  assert.equal(scoreLexical(EXTENDED_CASES[0],'Probably not that value').pass,false);
  assert.equal(scoreLexical(EXTENDED_CASES[0],'The integer is 323.').pass,true);
});
test('reserved benchmark returns only synthetic task scores and durations',async()=>{
  const seen=[];let time=0;
  const fetchImpl=async(url,init)=>{
    assert.equal(url,'http://127.0.0.1:3217/v1/infer');
    const body=JSON.parse(init.body);seen.push(body);time+=17;
    return {ok:true,json:async()=>({backend:'ollama-local',answer:'not an expected result, raw secret token'})};
  };
  const report=await runBenchmark({base:'http://127.0.0.1:3217',token:TOKEN,fetchImpl,
    suite:'extended',partition:'reserved',now:()=>time});
  assert.equal(report.cases,10);assert.equal(report.passed,0);
  assert.equal(report.scoring,'regex-presence-only');assert.equal(report.modelQualityProven,false);
  assert.equal(report.memberData,false);assert.equal(report.byTask['math-explain'].cases,2);
  assert.ok(!JSON.stringify(report).includes('raw secret token'));
  assert.ok(seen.every(x=>x.dataClass==='synthetic'));
  await assert.rejects(()=>runBenchmark({base:'https://host.invalid',token:TOKEN,fetchImpl,suite:'extended'}),/local_benchmark/);
});

test('synthetic job transitions through approved, leased, running, succeeded without content',()=>{
  const initial=newJob();assert.equal(initial.state,'awaiting_approval');
  assert.ok(Object.isFrozen(initial));assert.ok(!JSON.stringify(initial).includes('synthetic-input'));
  const queued=advanceSyntheticJob(initial,{type:'approve',at:200});
  const leased=advanceSyntheticJob(queued,{type:'lease',at:300,leaseId:LEASE});
  const running=advanceSyntheticJob(leased,{type:'start',at:400,leaseId:LEASE});
  const finished=advanceSyntheticJob(running,{type:'succeed',at:500,leaseId:LEASE,resultDigest:OUT});
  assert.equal(initial.state,'awaiting_approval');assert.equal(queued.state,'queued');
  assert.equal(finished.state,'succeeded');assert.equal(finished.resultDigest,OUT);
  assert.equal(finished.revision,4);
  assert.throws(()=>advanceSyntheticJob(finished,{type:'approve',at:600}),/terminal/);
});
test('synthetic job rejects replay, invalid leases, timing and unexpected payloads',()=>{
  assert.throws(()=>createSyntheticJob({id:'bad',task:'home.command',inputDigest:'bad',createdAt:0,expiresAt:4}),/invalid_input/);
  assert.throws(()=>createSyntheticJob({id:JID,task:'code-review',inputDigest:DIGEST,createdAt:100,expiresAt:10100,prompt:'secret'}),/unexpected_field/);
  const waiting=newJob();
  assert.throws(()=>advanceSyntheticJob(waiting,{type:'start',at:200,leaseId:LEASE}),/invalid_lease/);
  assert.throws(()=>advanceSyntheticJob(waiting,{type:'approve',at:200,rawPrompt:'secret'}),/unexpected_field/);
  const queued=advanceSyntheticJob(waiting,{type:'approve',at:200});
  assert.throws(()=>advanceSyntheticJob(queued,{type:'approve',at:201}),/invalid_transition/);
  assert.throws(()=>advanceSyntheticJob(queued,{type:'lease',at:199,leaseId:LEASE}),/invalid_timestamp/);
  assert.throws(()=>advanceSyntheticJob(queued,{type:'lease',at:300,leaseId:LEASE,resultDigest:OUT}),/unexpected_field/);
  const leased=advanceSyntheticJob(queued,{type:'lease',at:300,leaseId:LEASE});
  assert.throws(()=>advanceSyntheticJob(leased,{type:'start',at:400,leaseId:'d'.repeat(32)}),/invalid_lease/);
  assert.throws(()=>advanceSyntheticJob(leased,{type:'start',at:10_101,leaseId:LEASE}),/expired/);
  const expired=advanceSyntheticJob(leased,{type:'expire',at:10_100});assert.equal(expired.state,'expired');
  assert.throws(()=>advanceSyntheticJob(leased,{type:'expire',at:500}),/premature/);
});
test('synthetic job denial, failure and cancellation terminate irreversibly',()=>{
  const waiting=newJob();
  const stopped=advanceSyntheticJob(waiting,{type:'cancel',at:120});
  assert.equal(stopped.state,'cancelled');
  const queued=advanceSyntheticJob(waiting,{type:'approve',at:150});
  const leased=advanceSyntheticJob(queued,{type:'lease',at:200,leaseId:LEASE});
  const active=advanceSyntheticJob(leased,{type:'start',at:250,leaseId:LEASE});
  assert.throws(()=>advanceSyntheticJob(active,{type:'succeed',at:260,leaseId:LEASE,resultDigest:'bad'}),/invalid_result_digest/);
  assert.throws(()=>advanceSyntheticJob(active,{type:'fail',at:260,leaseId:LEASE,failureCode:'raw_error'}),/invalid_failure_code/);
  const failed=advanceSyntheticJob(active,{type:'fail',at:300,leaseId:LEASE,failureCode:'task_timeout'});
  assert.equal(failed.failureCode,'task_timeout');assert.equal(failed.state,'failed');
  assert.throws(()=>advanceSyntheticJob(failed,{type:'fail',at:400,leaseId:LEASE,failureCode:'task_timeout'}),/terminal/);
});

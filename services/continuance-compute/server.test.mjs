import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from './server.mjs';
import {parseLocalEndpoint,validateLocalRequest} from './policy.mjs';
import {generateLocal} from './ollama.mjs';
const TOKEN='synthetic-test-bearer-token-very-long-value';
const model='synthetic-model';
const endpoint='http://127.0.0.1:11434';
const request={task:'math-explain',prompt:'What is 17 times 19?',dataClass:'synthetic'};
async function withServer(opts,run) {
 const server=createServer({token:TOKEN,endpoint,model,...opts});
 await new Promise((ok,fail)=>server.once('error',fail).listen(0,'127.0.0.1',ok));
 const url=`http://127.0.0.1:${server.address().port}`;
 try{await run(url);}finally{await new Promise((ok,fail)=>server.close(error=>error?fail(error):ok()));}
}
const call=(url,input=request,token=TOKEN)=>fetch(url+'/v1/infer',{method:'POST',
 headers:{'authorization':'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(input)});

test('backend address cannot be arbitrary network host or cloud',()=>{
  for (const url of ['https://api.openai.com','http://192.168.1.10:11434','http://localhost.evil.com','http://localhost:11434/other','http://user:pw@localhost:11434','file:///tmp/a']) {
    assert.equal(parseLocalEndpoint(url),null,url);
  }
  assert.equal(parseLocalEndpoint(endpoint),'http://127.0.0.1:11434/api/generate');
});
test('request permits owner or synthetic tasks only; rejects member and actions',()=>{
  assert.equal(validateLocalRequest(request).ok,true);
  assert.equal(validateLocalRequest({...request,dataClass:'member-private'}).ok,false);
  assert.equal(validateLocalRequest({...request,task:'home.command'}).ok,false);
  assert.equal(validateLocalRequest({...request,prompt:'x'.repeat(9000)}).ok,false);
  assert.equal(validateLocalRequest({...request,maxOutputTokens:10000}).ok,false);
  assert.equal(validateLocalRequest({...request,url:'http://evil'}).ok,false);
});
test('startup demands a strong bearer secret',()=>{
  assert.throws(()=>createServer({token:'weak'}),/strong_token_required/);
});
test('auth, content types, zero cloud fallback and health mode',async()=>{
  await withServer({endpoint:null},async url=>{
    const health=await (await fetch(url+'/healthz')).json();
    assert.equal(health.backendConfigured,false);assert.equal(health.cloudFallback,false);
    assert.equal((await call(url,request,'wrong')).status,401);
    assert.equal((await call(url)).status,503);
    assert.equal((await fetch(url+'/v1/unknown')).status,404);
  });
});
test('local inference is authenticated, bounded, read-only, and returns declared provider',async()=>{
  let seen;
  await withServer({generate:async args=>{seen=args;return {answer:'323',usage:{promptTokens:6,outputTokens:1}};}},async url=>{
    assert.equal((await call(url,request,'invalid')).status,401);
    const response=await call(url);
    const data=await response.json();
    assert.equal(response.status,200);
    assert.equal(data.backend,'ollama-local');assert.equal(data.answer,'323');assert.equal(data.writes,false);
    assert.equal(seen.prompt,request.prompt);
    assert.equal(seen.maxOutputTokens,384);
    assert.match(response.headers.get('cache-control'),/no-store/);
  });
});
test('invalid prompts and unsupported data never reach provider',async()=>{
  let attempts=0;
  await withServer({generate:async()=>{attempts++;return {answer:'ok',usage:{}};}},async url=>{
    assert.equal((await call(url,{...request,dataClass:'member-private'})).status,400);
    assert.equal((await call(url,{...request,extra:'unexpected'})).status,400);
    assert.equal((await call(url,{...request,prompt:'a'.repeat(9000)})).status,400);
    assert.equal(attempts,0);
  });
});
test('one inference at a time, no silent fallback if backend fails',async()=>{
  let release;const gate=new Promise(ok=>{release=ok;});
  await withServer({generate:async()=>{await gate;return {answer:'ok',usage:{}};}},async url=>{
    const first=call(url);
    // Wait for provider invocation rather than racing the event loop.
    await new Promise(ok=>setTimeout(ok,20));
    assert.equal((await call(url)).status,429);
    release();assert.equal((await first).status,200);
  });
  await withServer({generate:async()=>{throw Error('synthetic-secret-do-not-echo');}},async url=>{
    const response=await call(url);
    assert.equal(response.status,503);
    assert.ok(!(await response.text()).includes('synthetic-secret'));
  });
});
test('Ollama adapter posts locally only with finite output limit',async()=>{
 let target,init;
 const fetchImpl=async(url,options)=>{target=url;init=options;
   return {ok:true,text:async()=>JSON.stringify({response:'323',prompt_eval_count:9,eval_count:2})};};
 const reply=await generateLocal({endpoint,model,instruction:'solve',prompt:'17*19',maxOutputTokens:100,fetchImpl});
 assert.equal(target,'http://127.0.0.1:11434/api/generate');
 const body=JSON.parse(init.body);
 assert.equal(body.stream,false);assert.equal(body.options.num_predict,100);
 assert.deepEqual(reply.usage,{promptTokens:9,outputTokens:2});
 await assert.rejects(()=>generateLocal({endpoint:'https://external.test',model,prompt:'hi',instruction:'hi',maxOutputTokens:100,fetchImpl}),/backend_unavailable/);
});

test('synthetic evaluation cannot target remote services or disclose model answers',async()=>{
  const {CASES,runBenchmark}=await import('./benchmark.mjs');
  const seen=[];
  const fetchImpl=async(url,init)=>{const req=JSON.parse(init.body);seen.push(req);
    const answers=['323','The index is outside array bounds: use index < array.length.',
      'This is 50 percent growth, not evidence of quality.','The button has no action; verify it responds.'];
    return {ok:true,json:async()=>({backend:'ollama-local',answer:answers[seen.length-1]})};
  };
  await assert.rejects(()=>runBenchmark({base:'https://elsewhere',token:TOKEN,fetchImpl}),/local_benchmark/);
  const output=await runBenchmark({base:'http://127.0.0.1:3217',token:TOKEN,fetchImpl});
  assert.equal(output.cases,CASES.length);assert.equal(output.passed,CASES.length);
  assert.ok(seen.every(x=>x.dataClass==='synthetic'));
  assert.ok(!JSON.stringify(output).includes('The button has no action'));
  assert.equal(output.modelQualityProven,false);
});

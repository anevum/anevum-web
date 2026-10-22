import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../operations/anevum-xp-test-retirement-v001.mjs';

const methods=['GET','HEAD','POST','PUT','DELETE','PATCH','OPTIONS'];
const forbiddenBindings=new Proxy({}, {get(){throw new Error('Retired routes must not access bindings');}});

test('existing edge retirement redirects directly to levels for every method without reading member data',async()=>{
  for(const method of methods)for(const path of ['/thebutton','/thebutton/','/thebutton/history?returnTo=https://example.invalid']){
    const request=new Request('https://anevum.com'+path,{method});
    const response=await worker.fetch(request,forbiddenBindings);
    assert.equal(response.status,302,method+' '+path);
    assert.equal(response.headers.get('location'),'https://anevum.com/levels');
    assert.equal(await response.text(),'');
    assert.equal(response.headers.get('cache-control'),'private, no-store');
    assert.equal(response.headers.has('set-cookie'),false);
  }
});

test('all retired API methods stay 404 before auth, body consumption or any database access',async()=>{
  for(const method of methods)for(const path of ['/api/v1/member/xp-test','/api/v1/member/xp-test/','/api/v1/member/xp-test?requestId=retired']){
    const request=new Request('https://anevum.com'+path,{method,...(['POST','PUT','PATCH','DELETE'].includes(method)?{body:'{"xp":5}'}:{})});
    const response=await worker.fetch(request,forbiddenBindings);
    assert.equal(response.status,404,method+' '+path);
    assert.deepEqual(await response.json(),{error:'Not found'});
    assert.equal(request.bodyUsed,false);
    assert.equal(response.headers.has('location'),false);
    assert.equal(response.headers.has('set-cookie'),false);
    assert.equal(response.headers.get('cache-control'),'private, no-store');
  }
  assert.equal((await worker.fetch(new Request('https://anevum.com/thebutton-unrelated'),forbiddenBindings)).status,404);
});

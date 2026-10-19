import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveCreatorRoute} from '../web/src/lib/creator-route.ts';

const handle='public_maker';
const failure=status=>Object.assign(Error('lookup failed'),{status});
const missing=async()=>{throw failure(404)};
const publicMember=async()=>({profile:{handle}});

test('existing legacy channels keep their own identity and do not probe member accounts',async()=>{
  const profile={handle,displayName:'Independent channel',publishedProjects:2};
  const result=await resolveCreatorRoute(handle,async()=>profile,async()=>assert.fail('unnecessary canonical lookup'));
  assert.deepEqual(result,{kind:'channel',profile});
});
test('a genuine channel 404 resolves only the exact independently public member',async()=>{
  assert.deepEqual(await resolveCreatorRoute(handle,missing,publicMember),{kind:'member'});
  assert.deepEqual(await resolveCreatorRoute(handle,missing,async()=>({profile:{handle:'different_maker'}})),{kind:'missing'});
});
test('private and missing canonical identities have the same public result',async()=>{
  for(const status of [403,404]){
    assert.deepEqual(await resolveCreatorRoute(handle,missing,async()=>{throw failure(status)}),{kind:'missing'});
  }
});
test('legacy service errors never trigger an identity-system fallback',async()=>{
  for(const status of [401,403,429,500,503]){
    const error=failure(status);
    await assert.rejects(resolveCreatorRoute(handle,async()=>{throw error},async()=>assert.fail('must not fall back')),e=>e===error);
  }
});
test('canonical outages remain retryable errors instead of claiming a missing profile',async()=>{
  for(const error of [failure(429),failure(500),failure(503),new TypeError('network offline')]){
    await assert.rejects(resolveCreatorRoute(handle,missing,async()=>{throw error}),e=>e===error);
  }
});
test('aborted lookups stay aborted across both identity systems',async()=>{
  const abort=new DOMException('Navigation changed','AbortError');
  await assert.rejects(resolveCreatorRoute(handle,async()=>{throw abort},publicMember),e=>e===abort);
  await assert.rejects(resolveCreatorRoute(handle,missing,async()=>{throw abort}),e=>e===abort);
});
test('a mismatched legacy response cannot attribute another creator to this route',async()=>{
  await assert.rejects(resolveCreatorRoute(handle,async()=>({handle:'another_maker'}),publicMember),/identity could not be verified/);
});
test('invalid route handles never reach either identity API',async()=>{
  const unexpected=async()=>assert.fail('invalid route reached a public identity API');
  for(const value of ['','null/../member','@public_maker','ab','../owner','PUBLIC_MAKER','x'.repeat(31)]){
    assert.deepEqual(await resolveCreatorRoute(value,unexpected,unexpected),{kind:'missing'});
  }
});

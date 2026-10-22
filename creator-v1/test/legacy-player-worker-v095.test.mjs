import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../operations/anevum-native-project-player-v006.mjs';

test('legacy player still transforms only successful canonical JS/CSS assets',async()=>{
 for(const [path,type] of [['/assets/index-a.js','application/javascript'],['/assets/index-a.css','text/css']]){
  const original=new Response('ORIGINAL',{headers:{'content-type':type,etag:'original','content-length':'8','content-security-policy':"default-src 'none'",'x-existing':'preserved'}});
  const request=new Request('https://anevum.com'+path);let calls=0;
  const result=await worker.fetch(request,{UPSTREAM:{async fetch(received){calls++;assert.equal(received,request);return original;}}});
  assert.equal(calls,1);assert.equal(result.status,200);
  const body=await result.text();assert.ok(body.startsWith('ORIGINAL\n'));assert.ok(body.length>1000);
  assert.equal(result.headers.get('content-type'),type);
  assert.equal(result.headers.get('content-security-policy'),"default-src 'none'");
  assert.equal(result.headers.get('x-existing'),'preserved');
  assert.equal(result.headers.get('cache-control'),'private,no-store');
  assert.equal(result.headers.has('etag'),false);assert.equal(result.headers.has('content-length'),false);
 }
});

test('non-assets, wrong types, errors and non-GET requests pass through intact',async()=>{
 for(const [path,method,status,type] of [
  ['/api/v1/member/progression','GET',200,'application/json'],
  ['/assets/index-a.js','POST',200,'application/javascript'],
  ['/assets/index-a.js','GET',404,'application/javascript'],
  ['/assets/index-a.js','GET',200,'text/html'],
  ['/assets/index-a.css','GET',200,'application/javascript'],
 ]){
  const original=new Response('UNCHANGED',{status,headers:{'content-type':type,'cache-control':'original'}});
  const request=new Request('https://anevum.com'+path,{method});
  const result=await worker.fetch(request,{UPSTREAM:{async fetch(received){assert.equal(received,request);return original;}}});
  assert.equal(result,original);assert.equal(await result.text(),'UNCHANGED');
 }
});

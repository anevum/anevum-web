import test from 'node:test';
import assert from 'node:assert/strict';
import {browserRequestId} from '../web/src/lib/request-id.ts';
test('native UUID and development fallback both preserve cryptographic request IDs',()=>{
 const value='12345678-1234-4234-8234-123456789abc';
 assert.equal(browserRequestId({randomUUID:()=>value,getRandomValues:()=>{throw Error('unexpected')}}),value);
 let calls=0;
 const fallback=browserRequestId({getRandomValues:bytes=>{calls++;bytes.fill(255);return bytes;}});
 assert.equal(calls,1);assert.equal(fallback,'ffffffff-ffff-4fff-bfff-ffffffffffff');
 assert.match(browserRequestId(),/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
});

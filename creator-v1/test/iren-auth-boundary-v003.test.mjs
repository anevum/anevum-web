// IREN staff auth-boundary regression, all identities are synthetic.
// This test never creates a real account, role or public deployment.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createIrenApexStaffWorker} from '../staff-portal/worker.mjs';

const url='https://anevum.com/api/v1/member/staff-ops';
const worker=createIrenApexStaffWorker();
function fakeEnvironment(payload) {
 return {
  CANONICAL_STAFF_OPS_ENABLED:'true',
  APEX_AUTH:{async fetch(){return Response.json(payload)}}
 };
}
test('IREN V003 denies mismatched identities and invalid session responses',async()=>{
 const cases=[
  null,
  {session:null,user:null},
  {session:{userId:'one'},user:{id:'two',emailVerified:true}},
  {session:{userId:'one'},user:{id:'one',emailVerified:false}},
  {session:{userId:'one'},user:{id:12,emailVerified:true}},
  {session:'invalid',user:{id:'one',emailVerified:true}}
 ];
 for(const payload of cases){
  const response=await worker.fetch(new Request(url,{headers:{cookie:'synthetic'}}),fakeEnvironment(payload));
  assert.equal(response.status,401,JSON.stringify(payload));
 }
});

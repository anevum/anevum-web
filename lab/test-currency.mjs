import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {initialState,execute,parseAmount,assertState} from './currency/model.mjs';
import {CURRENCY_ASSETS} from './currency-snapshot.mjs';
import {RHEN_JS} from './rhen-ui.mjs';
import worker from './worker.mjs';
let serial=0;
const req=(type,extra={})=>({type,id:'test-'+(++serial),...extra});
const funded=()=>execute(initialState(),req('issue',{amount:10000}));
test('integer parsing rejects ambiguous, negative, excessive, and fractional-cent amounts',()=>{
 assert.equal(parseAmount('10.44'),1044);assert.equal(parseAmount('1.2'),120);
 for(const x of ['0','-1','1e3','Infinity','1.001',' 1','1,000','1000000.01'])assert.throws(()=>parseAmount(x));
});
test('issuance, transfers and redemption preserve backing and total supply',()=>{
 let s=funded();s=execute(s,req('transfer',{amount:2500,recipient:'collaborator',policyVersion:0}));
 s=execute(s,req('transfer',{amount:1000,recipient:'merchant',policyVersion:0}));
 s=execute(s,req('redeem',{amount:1500,policyVersion:0}));
 assert.deepEqual(s.balances,{owner:5000,collaborator:2500,merchant:1000});
 assert.equal(s.supply,8500);assert.equal(s.reserves,8500);assertState(s);
});
test('duplicate requests cannot mint, transfer or redeem twice; conflicting reuse fails',()=>{
 for(const type of ['issue','transfer','redeem']){
  const s=funded(),r=req(type,{amount:100,recipient:type==='transfer'?'merchant':undefined,policyVersion:0});
  const next=execute(s,r);assert.equal(execute(next,r),next);
  assert.throws(()=>execute(next,{...r,amount:101}),/different operation/);
 }
});
test('permission versions, protected goal, release and revocation constrain movement',()=>{
 let s=execute(initialState(),req('policy'));
 s=execute(s,req('issue',{amount:10001}));assert.equal(s.goal,2000);
 const before=structuredClone(s);
 assert.throws(()=>execute(s,req('transfer',{amount:8002,recipient:'merchant',policyVersion:1})),/Insufficient/);
 assert.deepEqual(s,before);
 s=execute(s,req('revoke'));
 assert.throws(()=>execute(s,req('redeem',{amount:1,policyVersion:1})),/Permissions changed/);
 s=execute(s,req('issue',{amount:100}));assert.equal(s.goal,2000);
 s=execute(s,req('release-goal'));s=execute(s,req('redeem',{amount:10101,policyVersion:2}));
 assert.equal(s.supply,0);assert.equal(s.reserves,0);
});
test('paused reconciliation blocks movement while revocation remains available',()=>{
 let s=execute(funded(),req('pause'));
 for(const type of ['issue','transfer','redeem'])assert.throws(()=>execute(s,req(type,{amount:1,recipient:'merchant',policyVersion:0})),/paused/);
 s=execute(s,req('revoke'));s=execute(s,req('reconcile'));
 assert.equal(execute(s,req('redeem',{amount:10000,policyVersion:1})).supply,0);
});
test('invalid recipients, overspending, overflow and corrupted state fail atomically',()=>{
 const s=funded(),copy=structuredClone(s);
 for(const r of [req('transfer',{amount:1,recipient:'__proto__',policyVersion:0}),req('redeem',{amount:10001,policyVersion:0}),req('issue',{amount:100000000})])assert.throws(()=>execute(s,r));
 assert.deepEqual(s,copy);assert.throws(()=>execute({...s,reserves:1},req('reconcile')),/reconciliation/);
});
test('deterministic mixed transactions retain accounting invariants',()=>{
 let s=initialState();
 for(let i=0;i<500;i++){
  s=execute(s,req('issue',{amount:i+1}));
  s=execute(s,req(i%2?'transfer':'redeem',{amount:1,recipient:i%2?'merchant':undefined,policyVersion:0}));
  assertState(s);
 }
 assert.equal(s.receipts.length,1000);
});
test('snapshot matches editable source; existing console script parses',async()=>{
 for(const file of ['index.html','style.css','client.mjs','model.mjs','verification.mjs'])assert.equal(CURRENCY_ASSETS['/projects/rhen/currency/'+(file==='index.html'?'':file)],await readFile(new URL('./currency/'+file,import.meta.url),'utf8'));
 assert.doesNotThrow(()=>new vm.Script(RHEN_JS));
});
test('sandbox routes keep private host, method, no-store and noindex boundaries',async()=>{
 for(const path of Object.keys(CURRENCY_ASSETS)){
  const res=await worker.fetch(new Request('https://lab.anevum.com'+path));assert.equal(res.status,200);assert.match(res.headers.get('Cache-Control'),/no-store/);
  assert.match(res.headers.get('X-Robots-Tag'),/noindex/);
  assert.equal((await worker.fetch(new Request('https://anevum.com'+path))).status,404);
  assert.equal((await worker.fetch(new Request('https://lab.anevum.com'+path,{method:'POST'}))).status,405);
 }
 assert.match(await (await worker.fetch(new Request('https://lab.anevum.com/projects/rhen/'))).text(),/OPEN CURRENCY SANDBOX/);
});
test('custom goal percentage rounds down and new policy affects future receipts only',()=>{
 let s=execute(funded(),req('policy',{goalPercent:37,perTransferLimit:100,sessionTransferLimit:200}));
 assert.equal(s.goal,0);s=execute(s,req('issue',{amount:101}));assert.equal(s.goal,37);
 for(const goalPercent of [-1,101,NaN,0.5])assert.throws(()=>execute(s,req('policy',{goalPercent})),/percentage/);
 for(const perTransferLimit of [0,-1,Infinity,1.1])assert.throws(()=>execute(s,req('policy',{perTransferLimit})));
});
test('per-transfer and cumulative limits survive editing, retry and allocation revocation',()=>{
 let s=execute(funded(),req('policy',{goalPercent:0,perTransferLimit:1000,sessionTransferLimit:1500}));
 const payment=req('transfer',{amount:1000,recipient:'merchant',policyVersion:1});
 s=execute(s,payment);assert.equal(execute(s,payment).transferred,1000);
 assert.throws(()=>execute(s,req('transfer',{amount:501,recipient:'merchant',policyVersion:1})),/payment limit/);
 s=execute(s,req('policy',{perTransferLimit:1200,sessionTransferLimit:1500}));
 assert.equal(s.transferred,1000);s=execute(s,req('revoke'));
 assert.throws(()=>execute(s,req('transfer',{amount:501,recipient:'merchant',policyVersion:3})),/payment limit/);
 // Spending ceilings never prevent redeeming available owner units.
 s=execute(s,req('redeem',{amount:9000,policyVersion:3}));assert.equal(s.balances.owner,0);
});
test('policy content participates in duplicate identity and stale reviews fail',()=>{
 let s=funded();const r=req('policy',{goalPercent:10,policyVersion:0});s=execute(s,r);
 assert.equal(execute(s,r),s);
 assert.throws(()=>execute(s,{...r,goalPercent:20}),/different operation/);
 assert.throws(()=>execute(s,req('policy',{policyVersion:0,goalPercent:20})),/Permissions changed/);
 assert.throws(()=>execute(s,req('issue',{policyVersion:0,amount:100})),/Permissions changed/);
});

import {createExport,verifyExport,MAX_EXPORT_BYTES} from './currency/verification.mjs';
test('export verifier replays approvals, allocations, transfers, revocation and redemption',()=>{
 let s=execute(initialState(),req('policy',{goalPercent:25,policyVersion:0}));
 s=execute(s,req('issue',{amount:10000,policyVersion:1}));
 s=execute(s,req('transfer',{amount:1000,recipient:'collaborator',policyVersion:1}));
 s=execute(s,req('revoke'));s=execute(s,req('release-goal'));
 s=execute(s,req('redeem',{amount:9000,policyVersion:2}));
 const copy=structuredClone(s),summary=verifyExport(createExport(s));
 assert.equal(summary.acceptedInstructions,6);assert.equal(summary.supply,1000);assert.deepEqual(s,copy);
});
test('export verification rejects changed balances, receipt content, sequence and duplicates',()=>{
 const original=JSON.parse(createExport(funded()));
 for(const change of [d=>d.balances.owner++,d=>d.receipts[0].amount++,d=>d.receipts[0].detail='fabricated',d=>d.receipts[0].sequence=9,d=>d.receipts.push({...d.receipts[0],sequence:2}),d=>d.receipts[0].provenance='LIVE',d=>d.requests={}]){
  const data=structuredClone(original);change(data);assert.throws(()=>verifyExport(JSON.stringify(data)));
 }
});
test('export verifier rejects malformed, oversized, unsupported and excessively long histories',()=>{
 for(const text of ['null','{}','oops',' '.repeat(MAX_EXPORT_BYTES+1)])assert.throws(()=>verifyExport(text));
 const data=JSON.parse(createExport(initialState()));data.receipts=Array(1001).fill({});assert.throws(()=>verifyExport(JSON.stringify(data)),/1,000/);
 data.version=1;assert.throws(()=>verifyExport(JSON.stringify(data)),/Unsupported/);
});
test('special valid request identifiers preserve duplicate protection and replay',()=>{
 const s=execute(initialState(),{id:'__proto__',type:'issue',amount:100});
 assert.equal(execute(s,{id:'__proto__',type:'issue',amount:100}),s);
 assert.equal(verifyExport(createExport(s)).supply,100);
});

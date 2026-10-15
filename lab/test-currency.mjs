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
 for(const file of ['index.html','style.css','client.mjs','model.mjs'])assert.equal(CURRENCY_ASSETS['/projects/rhen/currency/'+(file==='index.html'?'':file)],await readFile(new URL('./currency/'+file,import.meta.url),'utf8'));
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

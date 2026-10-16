import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  QUANTO_PROTOCOL, QUANTO_WALLETS, QUANTO_MAX_ENTRIES,
  createQuantoLedger, applyQuantoInstruction, assertQuantoInvariants,
  verifyQuantoExport, formatQuantoCents
} from "../web/src/lib/quanto-ledger.mjs";

const issue = (id, amountCents, to = "operator") =>
  ({requestId:id, type:"issue", amountCents, to});
const transfer = (id, amountCents, from = "operator", to = "creator") =>
  ({requestId:id, type:"transfer", amountCents, from, to});
const redeem = (id, amountCents, from = "creator") =>
  ({requestId:id, type:"redeem", amountCents, from});
const clone = value => JSON.parse(JSON.stringify(value));
const source = path => readFileSync(new URL("../"+path, import.meta.url),"utf8");
const next = (state, command) => applyQuantoInstruction(state, command);

test("empty ledger has zero monetary value, zero supply and no server account", () => {
  const state=createQuantoLedger();
  assert.equal(state.protocol,QUANTO_PROTOCOL);
  assert.equal(state.sequence,0);
  assert.equal(state.journal.length,0);
  assert.equal(state.balances.SIM_USD.reserves,0);
  assert.equal(state.balances.QTO.issuer,0);
  for(const wallet of QUANTO_WALLETS) assert.equal(state.balances.QTO[wallet],0);
  assert.equal(assertQuantoInvariants(state),true);
  assert.equal(verifyQuantoExport(state),true);
});
test("issue posts equal and opposite simulated QTO and backing entries",()=>{
  const initial=createQuantoLedger();
  const state=next(initial,issue("issue-0001",2500));
  assert.equal(initial.sequence,0);
  assert.equal(state.sequence,1);
  assert.equal(state.balances.QTO.operator,2500);
  assert.equal(state.balances.QTO.issuer,-2500);
  assert.equal(state.balances.SIM_USD.reserves,2500);
  assert.equal(state.balances.SIM_USD.source,-2500);
  assert.equal(state.journal[0].postings.length,4);
  assert.equal(verifyQuantoExport(state),true);
});
test("wallet transfer is exactly zero-sum and never affects simulated reserves",()=>{
  let state=next(createQuantoLedger(),issue("issue-0001",2500));
  state=next(state,transfer("transfer-0001",1005));
  assert.equal(state.balances.QTO.operator,1495);
  assert.equal(state.balances.QTO.creator,1005);
  assert.equal(state.balances.SIM_USD.reserves,2500);
  assert.equal(state.journal[1].postings.length,2);
  assert.equal(verifyQuantoExport(state),true);
});
test("redemption burns units and decreases fictional backing symmetrically",()=>{
  let state=next(createQuantoLedger(),issue("issue-0001",2500));
  state=next(state,transfer("transfer-0001",1100));
  state=next(state,redeem("redeem-0001",1099));
  assert.equal(state.balances.QTO.creator,1);
  assert.equal(state.balances.QTO.issuer,-1401);
  assert.equal(state.balances.SIM_USD.reserves,1401);
  assert.equal(verifyQuantoExport(state),true);
});
test("overdrawn debit and redemption reject atomically",()=>{
  const state=next(createQuantoLedger(),issue("issue-0001",200));
  const before=JSON.stringify(state);
  assert.throws(()=>next(state,transfer("transfer-0001",201)),/insufficient/);
  assert.throws(()=>next(state,redeem("redeem-0001",1)),/insufficient/);
  assert.equal(JSON.stringify(state),before);
});
test("request IDs are idempotent for identical instructions, unique for other contents",()=>{
  const state=next(createQuantoLedger(),issue("issue-0001",200));
  assert.equal(next(state,issue("issue-0001",200)),state);
  assert.throws(()=>next(state,issue("issue-0001",201)),/already used/);
  assert.throws(()=>next(state,transfer("issue-0001",1)),/already used/);
});
test("invalid commands are rejected without changing balances",()=>{
  const state=createQuantoLedger();
  const invalid=[
    issue("bad",1), issue("issue-0001",0), issue("issue-0002",-1),
    issue("issue-0003",0.01),issue("issue-0004",Infinity),
    issue("issue-0005",1000001),issue("issue-0006",Number.MAX_SAFE_INTEGER),
    issue("issue-0007",NaN),issue("issue-0008",1,"issuer"),
    transfer("transfer-0001",1,"operator","operator"),
    transfer("transfer-0002",1,"issuer","creator"),
    {requestId:"issue-0009",type:"issue",amountCents:1,to:"operator",admin:true},
    {requestId:"issue-0010",type:"issue",amountCents:1},
    {requestId:"issue-0011",type:"savings",amountCents:1,to:"creator"}
  ];
  for(const command of invalid) assert.throws(()=>next(state,command));
  assert.equal(state.sequence,0);
});
test("simulation caps both supply and journal operations",()=>{
  let state=createQuantoLedger();
  for(let i=0;i<100;i++) state=next(state,issue("supply-"+String(i).padStart(4,"0"),1_000_000));
  assert.equal(state.balances.SIM_USD.reserves,100_000_000);
  assert.throws(()=>next(state,issue("supply-0100",1)),/supply cap/);
  let short=createQuantoLedger();
  for(let i=0;i<QUANTO_MAX_ENTRIES;i++){
    short=next(short,issue("journal-"+String(i).padStart(4,"0"),1));
  }
  assert.equal(short.sequence,QUANTO_MAX_ENTRIES);
  assert.throws(()=>next(short,issue("journal-next",1)),/capacity/);
});
test("500 mixed operations remain balanced and fully replayable",()=>{
  let state=createQuantoLedger();
  for(let i=0;i<100;i++){
    const suffix=String(i).padStart(4,"0");
    state=next(state,issue("issue-"+suffix,1000));
    state=next(state,transfer("transfer-"+suffix,700,"operator","creator"));
    state=next(state,transfer("merchant-"+suffix,300,"creator","studio"));
    state=next(state,redeem("redeem-"+suffix,100,"studio"));
    state=next(state,redeem("operator-"+suffix,100,"operator"));
  }
  assert.equal(state.sequence,500);
  assert.equal(state.balances.SIM_USD.reserves,80_000);
  assert.equal(state.balances.QTO.operator,20_000);
  assert.equal(state.balances.QTO.creator,40_000);
  assert.equal(state.balances.QTO.studio,20_000);
  assert.equal(verifyQuantoExport(state),true);
  for(const entry of state.journal){
    const sums=entry.postings.reduce((acc,row)=>{
      acc[row.unit]=(acc[row.unit]||0)+row.deltaCents;
      return acc;
    },{});
    assert.equal(sums.QTO,0);
    if(entry.type!=="transfer")assert.equal(sums.SIM_USD,0);
  }
});
test("tampered balances, postings, sequence, receipt order and duplicates fail replay",()=>{
  let original=next(createQuantoLedger(),issue("issue-0001",1000));
  original=next(original,transfer("transfer-0001",200));
  assert.equal(verifyQuantoExport(original),true);
  const copies=[
    value=>{value.balances.QTO.creator++;},
    value=>{value.balances.QTO.issuer++;},
    value=>{value.balances.SIM_USD.reserves++;},
    value=>{value.journal[0].postings[0].deltaCents++;},
    value=>{value.journal[0].command.amountCents++;},
    value=>{value.sequence++;},
    value=>{value.journal.reverse();},
    value=>{value.journal[1]=value.journal[0];}
  ];
  for(const mutate of copies){
    const corrupted=clone(original);
    mutate(corrupted);
    assert.equal(verifyQuantoExport(corrupted),false);
  }
  assert.equal(verifyQuantoExport({}),false);
  assert.equal(verifyQuantoExport(null),false);
});
test("self-consistency is separate from external financial authenticity",()=>{
  const fabricated=next(createQuantoLedger(),issue("fake-00001",800));
  assert.equal(verifyQuantoExport(fabricated),true);
  assert.match(source("web/src/pages/QuantoDemoPage.tsx"),/not proof of authenticity, ownership, or real reserves/i);
  assert.match(source("web/src/pages/QuantoDemoPage.tsx"),/NO REAL MONEY/);
  assert.doesNotMatch(source("web/src/lib/quanto-ledger.mjs"),/\bfetch\s*\(|localStorage|sessionStorage|indexedDB|paymentIntent|secretKey/);
});
test("demo integration does not grant legacy accounts or alter signup routes",()=>{
  const app=source("web/src/App.tsx");
  const member=source("web/src/components/MemberExperienceMap.tsx");
  assert.match(app,/path="quanto\/demo"/);
  assert.match(app,/path="join"/);
  assert.match(app,/path="member"/);
  assert.match(app,/path="account"/);
  assert.match(member,/to="\/quanto\/demo"/);
  assert.match(member,/NO REAL VALUE/);
  assert.match(source("web/src/pages/QuantoDemoPage.tsx"),/import "\.\.\/quanto-v001\.css"/);
});
test("formatter uses fixed two-decimal notation for integer cents",()=>{
  assert.equal(formatQuantoCents(0),"0.00");
  assert.equal(formatQuantoCents(1),"0.01");
  assert.equal(formatQuantoCents(1001),"10.01");
  assert.throws(()=>formatQuantoCents(1.5),/invalid display/);
});

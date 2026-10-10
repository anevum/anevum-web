import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parsePaperReviewBrokerage } from "../src/contracts/paper-review-brokerage.ts";

const paper = () => ({
  integration:"alpaca_connect",connectionAvailable:true,accountConnected:false,
  paperTradingEnabled:false,liveTradingEnabled:false,brokerWriteEnabled:false,
  depositsEnabled:false,withdrawalsEnabled:false,account:null
});
const linked = () => ({
  ...paper(),accountConnected:true,
  account:{provider:"Alpaca",environment:"paper",ending:"1234",connectedAt:1790000000}
});

test("paper-only state and masked account status are accepted",()=>{
  const normalized=parsePaperReviewBrokerage(paper());
  assert.ok(normalized);
  assert.equal(normalized.connectionAvailable,true);
  assert.equal(normalized.brokerWriteEnabled,undefined); // never render unneeded broker fields
  const connected=parsePaperReviewBrokerage(linked());
  assert.deepEqual(connected?.account,{ending:"1234",environment:"paper"});
  assert.equal(connected?.accountConnected,true);
  assert.equal("provider" in connected.account,false);
  assert.equal("connectedAt" in connected.account,false);
  assert.deepEqual(parsePaperReviewBrokerage({
    integration:"unavailable",connectionAvailable:false,accountConnected:false,
    paperTradingEnabled:false,liveTradingEnabled:false,
    depositsEnabled:false,withdrawalsEnabled:false,account:null
  }),{
    integration:"unavailable",connectionAvailable:false,accountConnected:false,
    paperTradingEnabled:false,liveTradingEnabled:false,
    depositsEnabled:false,withdrawalsEnabled:false,account:null
  });
});

test("elevated execution, deposits, withdrawals, and malformed status always fail closed",()=>{
  for(const altered of [
    {liveTradingEnabled:true},{paperTradingEnabled:true},{brokerWriteEnabled:true},
    {depositsEnabled:true},{withdrawalsEnabled:true},{connectionAvailable:"true"},
    {accountConnected:"true"},{integration:"other"},
    {integration:"unavailable",connectionAvailable:true},
    {account:{environment:"paper",ending:"1234"}}
  ]){
    assert.equal(parsePaperReviewBrokerage({...paper(),...altered}),null,
      JSON.stringify(altered));
  }
  for(const raw of [null,undefined,[],{},true,42,"connected",{"accountConnected":false}]){
    assert.equal(parsePaperReviewBrokerage(raw),null,String(raw));
  }
});

test("paper account must be masked, properly typed, and never live",()=>{
  for(const account of [
    null,{environment:"live",ending:"1234"},{environment:"paper",ending:"123"},
    {environment:"paper",ending:"12345"},{environment:"paper",ending:"a:12"},
    {environment:"paper",ending:1234},{environment:"paper",ending:"1234",brokerSecret:"raw"}
  ]){
    // An additional unrecognized brokerSecret field is never forwarded to UI.
    const result=parsePaperReviewBrokerage({...linked(),account});
    if(account && "brokerSecret" in account){
      assert.ok(result);
      assert.equal("brokerSecret" in result.account,false);
    } else {
      assert.equal(result,null,JSON.stringify(account));
    }
  }
});

test("review view resets all member state at the identity boundary",()=>{
  const read=(p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
  const page=read("src/pages/RhenReviewConnect.tsx");
  assert.match(page,/RhenReviewMember key=\{identityKey\}/);
  assert.match(page,/session\?\.user\?\.id/);
  assert.match(page,/memberId/);
  assert.match(page,/controller\.abort\(\)/);
  assert.match(page,/parsePaperReviewBrokerage\(await result\.json\(\)\)/);
  assert.match(page,/setStatus\(null\)/);
  assert.match(page,/Connecting is disabled/);
  assert.match(page,/!canAuthorize \|\| !acknowledged/);
  assert.doesNotMatch(page,/client_secret|brokerToken|password/);
});

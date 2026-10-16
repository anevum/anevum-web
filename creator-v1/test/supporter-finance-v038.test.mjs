import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildPublicFinanceReport} from '../finance/public-report.mjs';

const SHA='a'.repeat(64),SHA2='b'.repeat(64),SHA3='c'.repeat(64);
function ledger(){
 return {
  schemaVersion:1,period:'2026-09',scope:'ANEVUM_CORE',currency:'USD',mode:'closed-month',
  review:{
   approved:true,reviewedAt:'2026-10-03T16:10:11Z',evidenceSha256:SHA,
   expenseCoverageComplete:true,supporterCoverageComplete:true,
   balanceReconciled:true,taxReserveReviewed:true,accountCountReconciled:true,goalApproved:true
  },
  expenses:[
   {id:'host-inv-12345',category:'hosting',cents:2000,invoiceSha256:SHA2},
   {id:'store-inv-12345',category:'storage',cents:300,invoiceSha256:SHA3}
  ],
  supporterMovements:[
   {id:'txn_charge_one123',kind:'charge',amountCents:500,feeCents:48,balanceEvidenceSha256:SHA},
   {id:'txn_charge_two456',kind:'charge',amountCents:3600,feeCents:160,balanceEvidenceSha256:SHA2},
   {id:'txn_refund_one789',kind:'refund',amountCents:-500,feeCents:0,balanceEvidenceSha256:SHA3}
  ],
  reconciliation:{
   grossCents:4100,feeCents:208,refundCents:500,disputeCents:0,
   netCents:3392,taxLiabilityReserveCents:100,taxReserveEvidenceSha256:SHA2,stripeBalanceEvidenceSha256:SHA3
  },
  activeSupporters:{activeCount:3,asOf:'2026-10-03T15:50:00Z',evidenceSha256:SHA},
  goal:{monthlyTargetCents:6000,evidenceSha256:SHA2}
 };
}
const base=JSON.parse(readFileSync(new URL('../web/src/data/supporter-public-finance-v038.json',import.meta.url),'utf8'));
test('production source stays unverified while no ledgers or invoices are approved',()=>{
 assert.equal(base.published,false);
 assert.equal(base.verified,false);
 assert.equal(base.expenses.totalCents,null);
 assert.equal(base.receipts.netCents,null);
 assert.equal(base.activeSupporters,null);
 assert.equal(base.approvedMonthlyTargetCents,null);
 assert.equal(base.cashCoveragePercent,null);
});
test('verified synthetic month calculates exact cash gross, Stripe fees, refund, net and costs',()=>{
 const report=buildPublicFinanceReport(ledger());
 assert.equal(report.published,true);
 assert.equal(report.period,'2026-09');
 assert.equal(report.mode,'closed-month');
 assert.equal(report.expenses.totalCents,2300);
 assert.equal(report.expenses.categories.hosting,2000);
 assert.equal(report.expenses.categories.storage,300);
 assert.equal(report.expenses.categories.email,0);
 assert.deepEqual(report.receipts,{
  grossCents:4100,feesCents:208,refundsCents:500,disputesCents:0,netCents:3392,taxReservedCents:100,availableCents:3292
 });
 assert.equal(report.activeSupporters,3);
 assert.equal(report.approvedMonthlyTargetCents,6000);
 assert.equal(report.cashCoveragePercent,143.13);
 assert.match(report.methodology,/annual upfront/i);
});
test('private supplier IDs, digest references, customer details and vendor invoice IDs cannot leak to aggregate',()=>{
 const input=ledger();
 const serialized=JSON.stringify(buildPublicFinanceReport(input));
 for(const unsafe of ['host-inv-12345','txn_charge_one123',SHA,SHA2,SHA3,'member@example.invalid','customer','invoiceSha256','balanceEvidenceSha256','reviewer']){
  assert.ok(!serialized.includes(unsafe),'public output leaked '+unsafe);
 }
 assert.deepEqual(Object.keys(JSON.parse(serialized)).sort(),[
  'schemaVersion','published','verified','period','mode','scope','currency','reviewedAt','methodology',
  'expenses','receipts','activeSupporters','approvedMonthlyTargetCents','cashCoveragePercent','completeness'
 ].sort());
});
test('partial expense coverage never creates verified operating cost or funding coverage',()=>{
 const input=ledger();
 input.review.expenseCoverageComplete=false;
 const out=buildPublicFinanceReport(input);
 assert.equal(out.expenses.totalCents,null);
 for(const v of Object.values(out.expenses.categories))assert.equal(v,null);
 assert.equal(out.receipts.netCents,3392);
 assert.equal(out.cashCoveragePercent,null);
});
test('partial Stripe reconciliation never displays made-up income or supporter count',()=>{
 const input=ledger();
 input.review.supporterCoverageComplete=false;
 input.review.balanceReconciled=false;
 input.review.taxReserveReviewed=false;
 input.reconciliation=null;
 input.review.accountCountReconciled=false;
 input.activeSupporters=null;
 input.review.goalApproved=false;input.goal=null;
 const out=buildPublicFinanceReport(input);
 assert.equal(out.receipts.grossCents,null);
 assert.equal(out.receipts.netCents,null);
 assert.equal(out.activeSupporters,null);
 assert.equal(out.approvedMonthlyTargetCents,null);
 assert.equal(out.cashCoveragePercent,null);
});
test('reconciliation mismatch, duplicate transaction and invalid signs fail closed',()=>{
 let x=ledger();x.reconciliation.netCents++;
 assert.throws(()=>buildPublicFinanceReport(x),/Stripe reconciliation mismatch/);
 x=ledger();x.supporterMovements[1].id=x.supporterMovements[0].id;
 assert.throws(()=>buildPublicFinanceReport(x),/duplicate supporter/);
 x=ledger();x.supporterMovements[2].amountCents=500;
 assert.throws(()=>buildPublicFinanceReport(x),/sign\/kind mismatch/);
 x=ledger();x.supporterMovements[1].feeCents=1.3;
 assert.throws(()=>buildPublicFinanceReport(x),/integer number of cents/);
 x=ledger();x.expenses[1].id=x.expenses[0].id;
 assert.throws(()=>buildPublicFinanceReport(x),/duplicate expense/);
});
test('no mixed business accounts, currency FX shortcuts, hidden fields or unapproved publication',()=>{
 let x=ledger();x.scope='RHEN';assert.throws(()=>buildPublicFinanceReport(x),/mixed business/);
 x=ledger();x.currency='EUR';assert.throws(()=>buildPublicFinanceReport(x),/non-USD/);
 x=ledger();x.supporterMovements[0].personalEmail='person@example.com';
 assert.throws(()=>buildPublicFinanceReport(x),/fields must match schema/);
 x=ledger();x.review.approved=false;assert.throws(()=>buildPublicFinanceReport(x),/human-reviewed/);
 x=ledger();x.goal.monthlyTargetCents=0;assert.throws(()=>buildPublicFinanceReport(x),/positive/);
});
test('not-yet-closed month and future-dated reviews never masquerade as finalized finances',()=>{
 let x=ledger();x.period='2026-10';x.mode='closed-month';
 assert.throws(()=>buildPublicFinanceReport(x),/closed month/);
 x=ledger();x.period='2026-10';x.mode='month-to-date';
 const partial=buildPublicFinanceReport(x);
 assert.equal(partial.mode,'month-to-date');
 x=ledger();x.mode='month-to-date';
 assert.throws(()=>buildPublicFinanceReport(x),/month-to-date review/);
});
test('zero receipts require explicit reviewed reconciliation and are not inferred from no data',()=>{
 const input=ledger();
 input.supporterMovements=[];
 input.reconciliation={
  grossCents:0,feeCents:0,refundCents:0,disputeCents:0,netCents:0,taxLiabilityReserveCents:0,taxReserveEvidenceSha256:SHA2,stripeBalanceEvidenceSha256:SHA
 };
 const output=buildPublicFinanceReport(input);
 assert.equal(output.receipts.netCents,0);
 assert.equal(output.receipts.availableCents,0);
 assert.equal(output.expenses.totalCents,2300);
 assert.equal(output.cashCoveragePercent,0);
});

test('verified Stripe cash is not called spendable until sales-tax reserves are reviewed',()=>{
 const input=ledger();
 input.review.taxReserveReviewed=false;
 input.reconciliation.taxLiabilityReserveCents=null;
 input.reconciliation.taxReserveEvidenceSha256=null;
 const output=buildPublicFinanceReport(input);
 assert.equal(output.receipts.netCents,3392,'gross-minus-fees/refunds may be independently reconciled');
 assert.equal(output.receipts.taxReservedCents,null);
 assert.equal(output.receipts.availableCents,null);
 assert.equal(output.cashCoveragePercent,null,'coverage cannot claim potentially owed tax money');
 assert.equal(output.completeness.taxReserve,false);
});
test('fake or negative tax liability reserve cannot enter public report',()=>{
 let input=ledger();
 input.reconciliation.taxLiabilityReserveCents=-1;
 assert.throws(()=>buildPublicFinanceReport(input),/integer number of cents/);
 input=ledger();
 input.reconciliation.taxReserveEvidenceSha256='unverified';
 assert.throws(()=>buildPublicFinanceReport(input),/SHA-256/);
 input=ledger();
 input.reconciliation.taxLiabilityReserveCents=null;
 input.reconciliation.taxReserveEvidenceSha256=null;
 assert.throws(()=>buildPublicFinanceReport(input),/tax reserve cannot be called verified/);
});

/**
 * ANEVUM / PRIVATE -> PUBLIC FINANCIAL REPORT / V038
 *
 * This module NEVER fetches payment-provider/Cloudflare/Railway data, stores raw invoices,
 * or publishes on its own. It converts a complete, manually reconciled,
 * owner-approved PRIVATE ledger into an allowlisted aggregate-only report.
 * The private ledger must remain outside source control and public servers.
 *
 * Cents are used for arithmetic; this reports CASH RECEIVED, not guaranteed
 * recurring revenue or a charitable donation. Annual payments are cash in
 * their settlement month and are not treated as twelve repeat payments.
 */

const CATEGORIES=Object.freeze([
  'hosting','storage','delivery','email','moderation','software','other'
]);
const MOVEMENT_TYPES=Object.freeze([
  'charge','refund','dispute','fee_adjustment'
]);
const DIGEST=/^[a-f0-9]{64}$/;
const PERIOD=/^(20[2-9][0-9])-(0[1-9]|1[0-2])$/;
const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const SAFE_ID=/^[A-Za-z0-9_-]{7,100}$/;
const USD=100;
const MAX_CENTS=1_000_000_000_000; // $10 billion cap against overflow
const MAX_ROWS=10000;
export const publicCategories=CATEGORIES;

function ensure(test,message){if(!test)throw new Error('Financial report validation: '+message)}
function exactKeys(value,keys,label){
  ensure(value!==null&&typeof value==='object'&&!Array.isArray(value),label+' must be an object');
  ensure(Object.keys(value).sort().join('|')===keys.slice().sort().join('|'),label+' fields must match schema');
}
function integer(value,label,{signed=false}={}){
  ensure(Number.isSafeInteger(value)&&Math.abs(value)<=MAX_CENTS&&(signed||value>=0),label+' must be an integer number of cents');
  return value;
}
function digest(value,label){ensure(typeof value==='string'&&DIGEST.test(value),label+' must be a lowercase SHA-256 digest')}
function id(value,label){ensure(typeof value==='string'&&SAFE_ID.test(value),label+' invalid identifier')}
function formatDate(value,label){
 ensure(typeof value==='string'&&ISO.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().startsWith(value.slice(0,19)),label+' invalid UTC timestamp');
 return value;
}
function add(amounts,value){
  const sum=amounts+value;
  ensure(Number.isSafeInteger(sum)&&Math.abs(sum)<=MAX_CENTS,'monetary total exceeds bound');
  return sum;
}
function asUsd(cents){return Math.round(cents)/USD;}
function lastDay(period){const [y,m]=period.split('-').map(Number);return Date.UTC(y,m,0,23,59,59,999)}
function nonnegativeAmount(v,label){return integer(v,label)}
function parseReviewer(review,period){
 exactKeys(review,['approved','reviewedAt','evidenceSha256','expenseCoverageComplete','supporterCoverageComplete','balanceReconciled','taxReserveReviewed','accountCountReconciled','goalApproved'],'review');
 ensure(review.approved===true,'a human-reviewed release is required');
 formatDate(review.reviewedAt,'reviewedAt');
 ensure(Date.parse(review.reviewedAt)>=Date.parse(period+'-01T00:00:00.000Z'),'review date predates report');
 digest(review.evidenceSha256,'review.evidenceSha256');
 for(const k of ['expenseCoverageComplete','supporterCoverageComplete','balanceReconciled','taxReserveReviewed','accountCountReconciled','goalApproved'])
   ensure(typeof review[k]==='boolean','invalid review completeness flag '+k);
 return review;
}
function parseExpenses(entries){
 ensure(Array.isArray(entries)&&entries.length<=MAX_ROWS,'expense row count exceeds bound');
 const sums=Object.fromEntries(CATEGORIES.map(c=>[c,0]));
 const seen=new Set();
 for(const entry of entries){
  exactKeys(entry,['id','category','cents','invoiceSha256'],'expense');
  id(entry.id,'expense.id');
  ensure(!seen.has(entry.id),'duplicate expense document/line ID');
  seen.add(entry.id);
  ensure(CATEGORIES.includes(entry.category),'unknown expense category');
  nonnegativeAmount(entry.cents,'expense.cents');
  digest(entry.invoiceSha256,'expense.invoiceSha256');
  sums[entry.category]=add(sums[entry.category],entry.cents);
 }
 return sums;
}
function parseMovements(entries){
 ensure(Array.isArray(entries)&&entries.length<=MAX_ROWS,'supporter transaction count exceeds bound');
 const seen=new Set();
 const result={grossCents:0,feeCents:0,refundCents:0,disputeCents:0,netCents:0};
 for(const entry of entries){
  exactKeys(entry,['id','kind','amountCents','feeCents','balanceEvidenceSha256'],'supporter movement');
  id(entry.id,'supporter movement.id');
  ensure(!seen.has(entry.id),'duplicate supporter balance transaction');
  seen.add(entry.id);
  ensure(MOVEMENT_TYPES.includes(entry.kind),'unknown supporter movement kind');
  digest(entry.balanceEvidenceSha256,'movement.balanceEvidenceSha256');
  const value=integer(entry.amountCents,'movement.amountCents',{signed:true});
  const fee=integer(entry.feeCents,'movement.feeCents',{signed:true});
  ensure((entry.kind==='charge'&&value>0)||
    (entry.kind==='refund'&&value<0)||
    (entry.kind==='dispute'&&value<0)||
    (entry.kind==='fee_adjustment'&&value===0),
    'transaction sign/kind mismatch');
  if(entry.kind==='charge')result.grossCents=add(result.grossCents,value);
  if(entry.kind==='refund')result.refundCents=add(result.refundCents,-value);
  if(entry.kind==='dispute')result.disputeCents=add(result.disputeCents,-value);
  result.feeCents=add(result.feeCents,fee);
  result.netCents=add(result.netCents,value-fee);
 }
 return result;
}
function reconcile(actual,expected){
 exactKeys(expected,['grossCents','feeCents','refundCents','disputeCents','netCents','taxLiabilityReserveCents','taxReserveEvidenceSha256','processorBalanceEvidenceSha256'],'reconciliation');
 if(expected.taxLiabilityReserveCents!==null){
   nonnegativeAmount(expected.taxLiabilityReserveCents,'reconciliation.taxLiabilityReserveCents');
   digest(expected.taxReserveEvidenceSha256,'reconciliation.taxReserveEvidenceSha256');
 }else{
   ensure(expected.taxReserveEvidenceSha256===null,'unverified tax reserve must not have attestation');
 }
 digest(expected.processorBalanceEvidenceSha256,'reconciliation.processorBalanceEvidenceSha256');
 for(const k of ['grossCents','refundCents','disputeCents'])
  nonnegativeAmount(expected[k],'reconciliation.'+k);
 for(const k of ['feeCents','netCents'])
  integer(expected[k],'reconciliation.'+k,{signed:true});
 for(const k of ['grossCents','feeCents','refundCents','disputeCents','netCents'])
  ensure(actual[k]===expected[k],'payment-provider reconciliation mismatch for '+k);
}
function reviewPeriod(period,reviewedAt,mode){
 ensure(['closed-month','month-to-date'].includes(mode),'invalid reporting mode');
 const verified=Date.parse(reviewedAt);
 const end=lastDay(period);
 if(mode==='closed-month')ensure(verified>end,'closed month requires a review after period end');
 else ensure(verified<=end,'month-to-date review occurs during the reporting month');
 return mode;
}
function readCount(meta){
 exactKeys(meta,['activeCount','asOf','evidenceSha256'],'activeSupporters');
 nonnegativeAmount(meta.activeCount,'active supporter count');
 formatDate(meta.asOf,'active supporter asOf');
 digest(meta.evidenceSha256,'activeSupporters.evidenceSha256');
 return meta.activeCount;
}
function readGoal(meta){
 exactKeys(meta,['monthlyTargetCents','evidenceSha256'],'goal');
 const amount=nonnegativeAmount(meta.monthlyTargetCents,'goal.monthlyTargetCents');
 ensure(amount>0,'monthly target must be positive');
 digest(meta.evidenceSha256,'goal.evidenceSha256');
 return amount;
}

/**
 * Only a complete, reviewed ledger can produce a public report with numbers.
 * No raw IDs, invoice hashes, reviewer PII or individual supporter data survive.
 */
export function buildPublicFinanceReport(privateLedger){
 exactKeys(privateLedger,[
   'schemaVersion','period','scope','currency','mode','review','expenses',
   'supporterMovements','reconciliation','activeSupporters','goal'
 ],'ledger');
 ensure(privateLedger.schemaVersion===1,'unsupported version');
 ensure(typeof privateLedger.period==='string'&&PERIOD.test(privateLedger.period),'invalid period');
 ensure(privateLedger.scope==='ANEVUM_CORE','mixed business/lab financial scope forbidden');
 ensure(privateLedger.currency==='USD','non-USD settlement requires FX reconciliation first');
 const mode=reviewPeriod(privateLedger.period,privateLedger.review.reviewedAt,privateLedger.mode);
 const review=parseReviewer(privateLedger.review,privateLedger.period);
 const costs=parseExpenses(privateLedger.expenses);
 const movement=parseMovements(privateLedger.supporterMovements);
 const safeExpense=review.expenseCoverageComplete;
 const safeReceipts=review.supporterCoverageComplete&&review.balanceReconciled;
 const costsCents=Object.values(costs).reduce((total,c)=>add(total,c),0);
 if(safeReceipts)reconcile(movement,privateLedger.reconciliation);
 else if(privateLedger.reconciliation!==null){
   // Reject a misleading partial reconciliation claim; require explicit null.
   ensure(review.balanceReconciled,'unreconciled supporter revenues cannot publish reconciliation');
   reconcile(movement,privateLedger.reconciliation);
 }
 const count=review.accountCountReconciled?readCount(privateLedger.activeSupporters):null;
 ensure(review.accountCountReconciled||privateLedger.activeSupporters===null,
   'unverified active supporter count must remain null');
 const goalCents=review.goalApproved?readGoal(privateLedger.goal):null;
 ensure(review.goalApproved||privateLedger.goal===null,
   'unapproved goal must remain null');
 const operating=safeExpense?costsCents:null;
 const net=safeReceipts?movement.netCents:null;
 // Gross payment-provider cash less payment-provider fees/refunds is NOT all spendable income:
 // sales tax collected for a government may still be owed after settlement.
 // Publish available-to-operate cash and a funding coverage bar only when
 // that specific remaining tax reserve has independently been reconciled.
 const taxReserve=safeReceipts&&review.taxReserveReviewed
   ?privateLedger.reconciliation.taxLiabilityReserveCents:null;
 ensure(!review.taxReserveReviewed||(
   safeReceipts&&taxReserve!==null
 ),'tax reserve cannot be called verified without complete payment-provider reconciliation');
 const available=net!==null&&taxReserve!==null?net-taxReserve:null;
 const coverage=operating!==null&&operating>0&&available!==null
   ?Math.round(available/operating*10000)/100
   :null;
 return {
   schemaVersion:1,
   published:true,
   verified:true,
   period:privateLedger.period,
   mode,
   scope:'ANEVUM_CORE',
   currency:'USD',
   reviewedAt:review.reviewedAt,
   methodology:'Verified booked cash movements for supporter Prices, including annual upfront payments, less processing fees, refunds and dispute reversals. Remaining verified tax liabilities are reserved before cash is treated as available for operations. Expenses reflect invoiced costs for this window. No promise of recurring income or cash-basis profit.',
   expenses: {
     totalCents:operating,
     categories:Object.fromEntries(CATEGORIES.map(k=>[k,safeExpense?costs[k]:null]))
   },
   receipts:{
     grossCents:safeReceipts?movement.grossCents:null,
     feesCents:safeReceipts?movement.feeCents:null,
     refundsCents:safeReceipts?movement.refundCents:null,
     disputesCents:safeReceipts?movement.disputeCents:null,
     netCents:net,
     taxReservedCents:taxReserve,
     availableCents:available
   },
   activeSupporters:count,
   approvedMonthlyTargetCents:goalCents,
   cashCoveragePercent:coverage,
   completeness:{
     expenses:safeExpense,
     supporterReceipts:safeReceipts,
     taxReserve:taxReserve!==null,
     activeSupporters:review.accountCountReconciled,
     fundraisingGoal:review.goalApproved
   }
 };
}

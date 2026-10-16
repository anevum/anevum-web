import {Link} from 'react-router-dom';
import snapshot from '../data/supporter-transparency-snapshot-v037.json';
import rawFinancialReport from '../data/supporter-public-finance-v038.json';

type MoneyCents=number|null;
type PublicFinance={
 schemaVersion:number;published:boolean;verified:boolean;period:string|null;
 mode:'closed-month'|'month-to-date'|null;scope:string;currency:string;
 reviewedAt:string|null;methodology:string;
 expenses:{totalCents:MoneyCents;categories:Record<string,MoneyCents>};
 receipts:{grossCents:MoneyCents;feesCents:MoneyCents;refundsCents:MoneyCents;disputesCents:MoneyCents;netCents:MoneyCents;taxReservedCents:MoneyCents;availableCents:MoneyCents};
 activeSupporters:number|null;approvedMonthlyTargetCents:MoneyCents;
 cashCoveragePercent:number|null;
 completeness:{expenses:boolean;supporterReceipts:boolean;taxReserve:boolean;activeSupporters:boolean;fundraisingGoal:boolean};
};
const finance=rawFinancialReport as unknown as PublicFinance;
const verifiedFinance=finance.schemaVersion===1&&finance.published===true&&finance.verified===true&&
 finance.scope==='ANEVUM_CORE'&&finance.currency==='USD'&&
 /^20[2-9][0-9]-(0[1-9]|1[0-2])$/.test(finance.period??'')&&
 ['closed-month','month-to-date'].includes(finance.mode??'');
const centsToUsd=(value:MoneyCents)=>value===null?null:value/100;
const categoryNames:Record<string,string>={
 hosting:'Hosting',storage:'Storage',delivery:'Bandwidth & delivery',
 email:'Email',moderation:'Moderation',software:'Software',other:'Other infrastructure'
};

const fmt=(value:number|null)=>value===null?'NOT VERIFIED':new Intl.NumberFormat('en-US').format(value);
const size=(value:number|null)=>value===null?'NOT VERIFIED':value<1024?value+' B':(value/1024).toFixed(1)+' KiB';
const money=(value:number|null)=>value===null?'NOT VERIFIED':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
function Meter({label,value,total,unit}:{label:string;value:number|null;total:number|null;unit?:string}){
 const usable=typeof value==='number'&&Number.isFinite(value)&&typeof total==='number'&&Number.isFinite(total)&&total>0;
 const actualPercent=usable?(value/total)*100:0;
 const visualPercent=Math.min(100,Math.max(0,actualPercent));
 return <div className="av37-meter">
  <div className="av37-meter-label"><span>{label}</span><strong>{usable?actualPercent.toFixed(1)+'%':'AWAITING VERIFIED TARGET'}</strong></div>
  <div className="av37-meter-track" role="progressbar" aria-label={label} aria-valuemin={0}
   aria-valuemax={usable?Math.max(total,value,1):undefined} aria-valuenow={usable?Math.max(0,value):undefined}
   aria-valuetext={usable?String(value)+' of '+String(total)+(unit?' '+unit:''):'No verified denominator available'}>
   <span style={{width:visualPercent+'%'}}/>
  </div>
 </div>;
}
function Metric({label,value,detail}:{label:string;value:string;detail:string}){
 return <article className="av37-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}
export function SupporterTransparency(){
 const s=snapshot;
 const verifiedBudget=verifiedFinance&&finance.completeness.expenses?
  centsToUsd(finance.expenses.totalCents):s.operations.verifiedMonthlyOperatingCostUsd;
 const raised=verifiedFinance&&finance.completeness.supporterReceipts&&finance.completeness.taxReserve?
  centsToUsd(finance.receipts.availableCents):s.funding.verifiedMonthlySupporterNetUsd;
 const supporterCount=verifiedFinance&&finance.completeness.activeSupporters?
  finance.activeSupporters:s.funding.verifiedActiveSupporterCount;
 const fundingTarget=verifiedFinance&&finance.completeness.fundraisingGoal?
  centsToUsd(finance.approvedMonthlyTargetCents):s.funding.approvedMonthlyTargetUsd;
 return <div className="av37-transparency" id="transparency">
  <header className="av37-intro">
   <div><span className="av32-index">ANEVUM / OPEN OPERATIONS / 002</span>
    <h2>Know what keeps <em>the signal alive.</em></h2>
    <p>Supporting ANEVUM should be an informed choice. Here is what we can verify, what is still unknown, and which improvements support would help make possible.</p></div>
   <div className="av37-stamp"><span>LAST VERIFIED</span><strong>{s.verifiedOn}</strong><small>MANUAL SNAPSHOT · STAGING ONLY</small></div>
  </header>
  <div className="av37-notice" role="note"><strong>Transparency standard</strong><p>Numbers below are a dated engineering snapshot, not live telemetry. A blank funding meter means we do not yet have verified finances or an approved goal—not that ANEVUM has raised $0. Database storage, user-uploaded image bytes and R2 storage must not be added together as if they were independent bills.</p></div>
  <section aria-labelledby="av37-funding">
   <div className="av37-section-heading"><span className="av32-index">01 / FUNDING THE NETWORK</span><h3 id="av37-funding">Where we stand.</h3></div>
   <div className="av37-metrics">
    <Metric label="REPORTED OPERATING EXPENSES" value={money(verifiedBudget)} detail="Actual approved invoices for the stated reporting period, or unverified"/>
    <Metric label="SUPPORTER CASH AVAILABLE TO OPERATE" value={money(raised)} detail="Collected cash after processing fees, refunds, disputes and verified remaining sales-tax reserve"/>
    <Metric label="VERIFIED ACTIVE SUPPORTERS" value={fmt(supporterCount)} detail="A separately confirmed active member count, not a checkout conversion estimate"/>
    <Metric label="APPROVED MONTHLY FUNDING TARGET" value={money(fundingTarget)} detail="Only published after owner approval and supporting evidence"/>
   </div>
   <p className="av37-period" role="status">{verifiedFinance
    ? 'REPORTING '+finance.period+' / '+(finance.mode==='closed-month'?'CLOSED PERIOD':'MONTH TO DATE')+' / REVIEWED '+new Date(finance.reviewedAt??'').toLocaleDateString()
    : 'NO APPROVED FINANCIAL REPORT HAS BEEN PUBLISHED'}</p>
   <Meter label="Net supporter cash received vs verified operating expenses for the same period" value={raised} total={verifiedBudget} unit="USD"/>
   {verifiedFinance&&<div className="av38-finance" aria-label="Verified finance breakdown">
    <section className="av38-finance-panel" aria-labelledby="av38-expense-heading"><h4 id="av38-expense-heading">Operating expense categories</h4>
     {Object.entries(finance.expenses.categories).filter(([key])=>key in categoryNames).map(([key,amount])=>
      <div className="av38-finance-row" key={key}><span>{categoryNames[key]}</span><strong>{money(centsToUsd(amount))}</strong></div>)}
     <p>These are actual invoiced costs for the stated window, not theoretical maximum infrastructure capacity.</p>
    </section>
    <section className="av38-finance-panel" aria-labelledby="av38-receipts-heading"><h4 id="av38-receipts-heading">Where supporter payments go</h4>
     {[['Gross collected',finance.receipts.grossCents],['Payment processing fees',finance.receipts.feesCents],['Refunds',finance.receipts.refundsCents],['Disputes / reversals',finance.receipts.disputesCents],['Net settled before taxes',finance.receipts.netCents],['Verified remaining tax reserve',finance.receipts.taxReservedCents],['Available for operating costs',finance.receipts.availableCents]].map(([name,amount])=>
      <div key={String(name)} className="av38-finance-row"><span>{name}</span><strong>{money(centsToUsd(amount as MoneyCents))}</strong></div>)}
     <p>{finance.methodology}</p>
    </section>
   </div>}
   {!verifiedFinance&&<p className="av38-unpublished">Income, Stripe fees, invoices and fundraising totals have not been reconciled or approved. The bars intentionally show no percentage until their sources are verified.</p>}
   <p className="av37-footnote">Annual memberships are collected upfront, so one month of cash receipts is not recurring monthly revenue. Costs can be covered only by reconciled cash after verified outstanding tax reserves; we do not treat tax collections as ANEVUM operating money. Publishing a complete monthly run-rate requires a separate active-subscription report. Unverified or partial categories remain unavailable.</p>
  </section>
  <section aria-labelledby="av37-storage">
   <div className="av37-section-heading"><span className="av32-index">02 / STORAGE AND CAPACITY</span><h3 id="av37-storage">Our current footprint.</h3></div>
   <div className="av37-metrics">
    <Metric label="CANONICAL MEMBER DATABASE" value={size(s.storage.canonicalMemberD1FileBytes)} detail="Cloudflare D1 reported file size, staging"/>
    <Metric label="CREATOR STAGING DATABASE" value={size(s.storage.communityD1FileBytes)} detail="Separate Cloudflare D1 reported file size"/>
    <Metric label="MEMBER AVATAR + BANNER DATA" value={size(s.storage.memberUploadedImageBlobBytes)} detail="Included inside the canonical member database, not additional storage"/>
    <Metric label="PROFILE-MEDIA R2 OBJECTS" value={fmt(s.storage.r2ProfileObjectCount)} detail="0 objects at audit time; R2 bucket exists but is not the active profile image store"/>
   </div>
   <div className="av37-split">
    <article className="av37-panel"><span className="av32-index">ACTIVE MEMBER MEDIA LIMITS</span><h4>Profile media</h4>
     <p>Current source permits two profile image slots per member: one square avatar and one banner. Each JPEG is limited to <strong>256 KiB</strong>. This is a per-image upload rule, not an account storage allowance.</p>
     <Meter label="Staging profile image slots filled (not global storage capacity)" value={s.storage.memberImageCount} total={s.community.stagingMemberAccounts*s.storage.imageSlotsPerMember} unit="slots"/>
     <p className="av37-footnote">No individual member's storage usage is exposed here. Public creator asset quotas are not verified.</p>
    </article>
    <article className="av37-panel"><span className="av32-index">STORAGE EXPANSION / PROPOSED</span><h4>What support can unlock</h4>
     <p>First establish actual storage, delivery, and moderation costs. Then publish a fair free upload allowance and fund additional creator capacity. No paid storage tier is promised until capacity and costs are validated.</p>
     <Meter label="Creator storage expansion funding" value={null} total={null} unit="USD"/>
    </article>
   </div>
  </section>
  <section aria-labelledby="av37-activity">
   <div className="av37-section-heading"><span className="av32-index">03 / DEVELOPMENT SIGNAL</span><h3 id="av37-activity">Real activity, clearly scoped.</h3></div>
   <div className="av37-metrics">
    <Metric label="CANONICAL STAGING ACCOUNTS" value={fmt(s.community.stagingMemberAccounts)} detail="Test and development identities; not a public member total"/>
    <Metric label="STAGING CREATOR PROFILES" value={fmt(s.community.stagingCreatorProfiles)} detail="Canonical member profiles"/>
    <Metric label="STAGING WALL POSTS" value={fmt(s.community.stagingWallPosts)} detail="Private development environment"/>
    <Metric label="RAILWAY STAGING PROBE" value="0 RECORDED" detail="24-hour CPU, memory, disk and network sample; not a billing statement"/>
   </div>
   <p className="av37-footnote">Production members, submissions, impressions and engagement are not reported until an independently validated analytics source is available. We will not represent staging activity as a public community.</p>
  </section>
  <section aria-labelledby="av37-goals">
   <div className="av37-section-heading"><span className="av32-index">04 / FUNDING ROADMAP</span><h3 id="av37-goals">What support would build.</h3></div>
   <div className="av37-goals">
    {s.milestones.map((m,index)=><article className="av37-goal" key={m.id}>
     <div className="av37-goal-head"><span className="av37-goal-number">{String(index+1).padStart(2,'0')}</span><div><span className="av32-index">{m.stage.toUpperCase()} / PROPOSED</span><h4>{m.title}</h4></div></div>
     <p>{m.goal}</p>
     <Meter label={m.title+' funding'} value={m.verifiedRaisedUsdMonthly} total={m.fundingGoalUsdMonthly} unit="USD"/>
     <ul>{m.deliverables.map(x=><li key={x}>{x}</li>)}</ul>
     <small>Target and progress will remain unavailable until actual costs and allocation are approved.</small>
    </article>)}
   </div>
  </section>
  <section aria-labelledby="av37-readiness">
   <div className="av37-section-heading"><span className="av32-index">05 / WHAT IS READY</span><h3 id="av37-readiness">Source is not the same as launch.</h3></div>
   <div className="av37-checks">{s.releaseChecks.map(item=><div className="av37-check" key={item.id}>
    <span>{item.label}</span><strong data-state={item.state}>{item.state==='source-verified'?'SOURCE TESTED':item.state==='source-in-review'?'IN REVIEW':'NOT LAUNCHED'}</strong>
   </div>)}</div>
   <p className="av37-footnote">Supporter checkout is not publicly open. Tested code, an approved migration, a deployed staging feature and a production release are different milestones.</p>
  </section>
  <section aria-labelledby="av37-accountability">
   <div className="av37-section-heading"><span className="av32-index">06 / ACCOUNTABILITY</span><h3 id="av37-accountability">How we report.</h3></div>
   <div className="av37-accountability">
    <article><strong>Costs</strong><p>Hosting, storage, bandwidth, transactional email, moderation and other recurring expenses will be separated by category after invoice verification.</p></article>
    <article><strong>Income</strong><p>Gross support, processing fees, refunds and net available funds will be reported separately after reconciliation.</p></article>
    <article><strong>Progress</strong><p>Every funding goal must have an approved target, progress definition, last-updated date and an explanation when metrics cannot be verified.</p></article>
    <article><strong>Privacy</strong><p>No individual payment, member identity, private asset, invoice account number, API key or operational credential belongs on a public dashboard.</p></article>
   </div>
   <details className="av37-sources"><summary>Data sources and reporting limitations</summary>
    {s.sourceNotes.map(note=><p key={note.title}><strong>{note.title}:</strong> {note.detail}</p>)}
    <p>Infrastructure snapshot figures were collected {s.verifiedOn}. The finance report, if published, is a separately reviewed offline aggregate with an explicit reporting period and review date. Neither automatically updates, and private invoices/customer transactions are never exposed here.</p>
   </details>
  </section>
  <div className="av37-bottom"><span className="av32-index">CONTINUANCE / SUPPORT WITHOUT CONTROL</span><p>Supporters help keep the creative network available. They do not buy XP, medals, creator rank, moderation power, visibility or influence over editorial decisions.</p><Link to="/join">JOIN THE COMMUNITY ↗</Link></div>
 </div>;
}

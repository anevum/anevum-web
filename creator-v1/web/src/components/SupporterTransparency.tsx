import {Link} from 'react-router-dom';
import snapshot from '../data/supporter-transparency-snapshot-v037.json';

const fmt=(value:number|null)=>value===null?'NOT VERIFIED':new Intl.NumberFormat('en-US').format(value);
const size=(value:number|null)=>value===null?'NOT VERIFIED':value<1024?value+' B':(value/1024).toFixed(1)+' KiB';
const money=(value:number|null)=>value===null?'NOT VERIFIED':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
function Meter({label,value,total,unit}:{label:string;value:number|null;total:number|null;unit?:string}){
 const usable=typeof value==='number'&&Number.isFinite(value)&&typeof total==='number'&&Number.isFinite(total)&&total>0;
 const percent=usable?Math.min(100,Math.max(0,(value/total)*100)):0;
 return <div className="av37-meter">
  <div className="av37-meter-label"><span>{label}</span><strong>{usable?percent.toFixed(1)+'%':'AWAITING VERIFIED TARGET'}</strong></div>
  <div className="av37-meter-track" role="progressbar" aria-label={label} aria-valuemin={0}
   aria-valuemax={usable?total??undefined:undefined} aria-valuenow={usable?value??undefined:undefined}
   aria-valuetext={usable?String(value)+' of '+String(total)+(unit?' '+unit:''):'No verified denominator available'}>
   <span style={{width:percent+'%'}}/>
  </div>
 </div>;
}
function Metric({label,value,detail}:{label:string;value:string;detail:string}){
 return <article className="av37-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}
export function SupporterTransparency(){
 const s=snapshot;
 const verifiedBudget=s.operations.verifiedMonthlyOperatingCostUsd;
 const raised=s.funding.verifiedMonthlySupporterNetUsd;
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
    <Metric label="VERIFIED MONTHLY OPERATING COST" value={money(verifiedBudget)} detail="Railway, Cloudflare and other actual invoices must be reconciled first"/>
    <Metric label="VERIFIED MONTHLY SUPPORTER NET" value={money(raised)} detail="After processing fees and refunds; not yet linked to a verified ledger"/>
    <Metric label="VERIFIED ACTIVE SUPPORTERS" value={fmt(s.funding.verifiedActiveSupporterCount)} detail="Never inferred from test checkout sessions"/>
    <Metric label="MONTHLY FUNDING TARGET" value={money(s.funding.approvedMonthlyTargetUsd)} detail="Will be set from actual recurring expenses, not a marketing guess"/>
   </div>
   <Meter label="Essential monthly operating coverage" value={raised} total={verifiedBudget} unit="USD"/>
   <p className="av37-footnote">Public fundraising totals will be enabled only after a verified financial ledger and approved reporting policy exist. Expenses, gross income, net receipts, and what is reinvested will be separated.</p>
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
     <Meter label="Avatar upload limit" value={null} total={s.storage.perImageUploadMaxBytes} unit="bytes"/>
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
    <p>All snapshot figures were collected {s.verifiedOn}. The site does not automatically update this report.</p>
   </details>
  </section>
  <div className="av37-bottom"><span className="av32-index">CONTINUANCE / SUPPORT WITHOUT CONTROL</span><p>Supporters help keep the creative network available. They do not buy XP, medals, creator rank, moderation power, visibility or influence over editorial decisions.</p><Link to="/join">JOIN THE COMMUNITY ↗</Link></div>
 </div>;
}

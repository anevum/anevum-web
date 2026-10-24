import {useCallback,useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {OrbitalMark} from '../components/OrbitalMark';

type Interval='month'|'year';
type SupportV2={
 available:boolean;mode:'sandbox'|'off';sandbox:boolean;subscriber:boolean;
 status:string;cancelAtPeriodEnd?:boolean;paidUntil?:string|null;
 plans:{month:number;year:number};
};
function trustedSquareDestination(value:unknown){
 if(typeof value!=='string')return null;
 try{
  const u=new URL(value);
  return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&
   ['square.link','checkout.square.site'].includes(u.hostname)?u.href:null;
 }catch{return null;}
}
export function SupporterPage(){
 const {data:session,isPending}=canonicalAuthClient.useSession();
 const memberId=session?.user?.emailVerified===true?session.user.id:null;
 const [interval,setInterval]=useState<Interval>('year');
 const [billing,setBilling]=useState<SupportV2|null>(null);
 const [checking,setChecking]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const reload=useCallback(async(signal?:AbortSignal)=>{
  if(!memberId)return;
  setChecking(true);
  try{
   const response=await fetch('/api/v1/member/support-v2',{
    method:'GET',mode:'same-origin',credentials:'same-origin',
    redirect:'error',cache:'no-store',referrerPolicy:'same-origin',signal,
    headers:{accept:'application/json'}
   });
   if(!response.ok)throw Error('Supporter service is paused');
   const payload:unknown=await response.json();
   if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('Invalid supporter status');
   const result=payload as Partial<SupportV2>;
   if(typeof result.available!=='boolean'||typeof result.subscriber!=='boolean'||
      !result.plans||result.plans.month!==500||result.plans.year!==3600||
      !['sandbox','off'].includes(result.mode??''))throw Error('Unable to confirm supporter prices');
   if(!signal?.aborted){setBilling(result as SupportV2);setError('');}
  }catch{
   if(!signal?.aborted){setBilling(null);setError('');}
  }finally{if(!signal?.aborted)setChecking(false);}
 },[memberId]);
 useEffect(()=>{
  const controller=new AbortController();
  setBilling(null);setError('');setNotice('');
  if(memberId)void reload(controller.signal);
  return()=>controller.abort();
 },[memberId,reload]);
 const sandbox=Boolean(billing?.available&&billing.mode==='sandbox');
 const supporter=Boolean(sandbox&&billing?.subscriber);
 const underReview=billing?.status==='billing-review';
 const pending=Boolean(billing?.status&&['checkout-pending','payment-pending-verification','unverified'].includes(billing.status));
 const paymentReturn=new URLSearchParams(window.location.search).get('checkout')==='returned';
 async function openCheckout(){
  if(!memberId||!sandbox||supporter||pending||busy||checking||underReview)return;
  setBusy(true);setError('');setNotice('');
  try{
   const response=await fetch('/api/v1/member/support-v2/checkout',{
    method:'POST',credentials:'same-origin',mode:'same-origin',redirect:'error',
    cache:'no-store',referrerPolicy:'same-origin',
    headers:{'content-type':'application/json',accept:'application/json'},
    body:JSON.stringify({interval})
   });
   if(!response.ok)throw Error(response.status===409?
    'An existing checkout or membership needs review before starting another.':
    'Sandbox checkout could not be opened. No payment was confirmed.');
   const result:unknown=await response.json();
   if(!result||typeof result!=='object')throw Error('Invalid checkout response');
   const data=result as {url?:unknown;mode?:unknown;amount?:unknown;currency?:unknown};
   const url=trustedSquareDestination(data.url);
   if(!url||data.mode!=='sandbox'||data.amount!==(interval==='year'?3600:500)||data.currency!=='USD')
     throw Error('The payment destination or price could not be verified.');
   window.location.assign(url);
  }catch(e){setError(e instanceof Error?e.message:'Checkout unavailable');}
  finally{setBusy(false);}
 }
 async function stopRenewal(){
  if(!memberId||!supporter||busy||checking||billing?.cancelAtPeriodEnd)return;
  if(!window.confirm('Cancel future renewals of your sandbox supporter subscription? Your paid period may remain available until it ends.'))return;
  setBusy(true);setError('');setNotice('');
  try{
   const response=await fetch('/api/v1/member/support-v2/cancel',{
    method:'POST',credentials:'same-origin',mode:'same-origin',redirect:'error',
    cache:'no-store',referrerPolicy:'same-origin',headers:{accept:'application/json'}
   });
   if(!response.ok)throw Error('Could not verify cancellation. Check your Square sandbox account.');
   const result=await response.json() as {status?:string};
   if(result.status!=='canceling')throw Error('The cancellation response was not verified.');
   setNotice('Sandbox renewal cancellation recorded. Verify the provider confirmation.');
   await reload();
  }catch(e){setError(e instanceof Error?e.message:'Unable to cancel');}
  finally{setBusy(false);}
 }
 return <div className="av32-support av45-support">
  <section className="av45-hero" aria-labelledby="av45-title">
   <div className="av45-hero-copy">
    <span className="av32-index">ANEVUM / THE CONTINUANCE FUND</span>
    <h1 id="av45-title">Keep the <em>signal</em> alive.</h1>
    <p>Help build a home for games, art, apps and independent makers. ANEVUM stays free to explore, create and belong to.</p>
    <div className="av45-promise"><span>NO INTRUSIVE ADS</span><span>FREE TO JOIN</span><span>CREATORS FIRST</span></div>
   </div>
   <div className="av45-symbol" aria-hidden="true">
    <span className="av45-ring"/><span className="av45-ring av45-ring-alt"/>
    <span className="av45-ring av45-ring-core"/><OrbitalMark/>
   </div>
  </section>
  <section className="av45-offer" aria-label="Founding supporter membership">
   <div className="av45-offer-copy">
    <span className="av32-index">01 / BECOME A FOUNDING SUPPORTER</span>
    <h2>Help something good grow.</h2>
    <p>Support ANEVUM's independence and collect a few beautiful ways to show you were here from the beginning. Participation, recognition through XP, and publishing remain free.</p>
    <ul className="av45-benefits">
     <li><strong>Collector seals</strong><small>Milestone marks that evolve over time</small></li>
     <li><strong>Profile frames</strong><small>Distinctive orbit-inspired borders</small></li>
     <li><strong>Wall auras</strong><small>Animated cosmic atmospheres</small></li>
    </ul>
    <Link className="av45-link" to="/support/collection">Explore the supporter collection →</Link>
   </div>
   <aside className="av45-buy" aria-label="Membership pricing">
    <div className="av45-buy-head"><strong>FOUNDING SUPPORTER</strong><span>{sandbox?'SANDBOX ONLY':'PRE-LAUNCH'}</span></div>
    <div className="av45-switch" role="group" aria-label="Proposed billing interval">
     <button type="button" aria-pressed={interval==='year'} onClick={()=>setInterval('year')}>Yearly · save 40%</button>
     <button type="button" aria-pressed={interval==='month'} onClick={()=>setInterval('month')}>Monthly</button>
    </div>
    <div className="av45-price"><strong>{interval==='year'?'$36':'$5'}</strong><span>/ {interval==='year'?'year':'month'}</span></div>
    <p className="av45-frequency">{interval==='year'?'Equivalent to $3 a month. Billed once yearly.':'Proposed recurring monthly option.'}</p>
    <p className="av45-status" role="status">{underReview?'PAYMENT REVIEW REQUIRED':
      supporter?'SANDBOX MEMBERSHIP VERIFIED':
      sandbox?(pending?'SANDBOX VERIFICATION PENDING':'SANDBOX CHECKOUT AVAILABLE'):
      'PAYMENTS PAUSED · PROVIDER TRANSITION'}</p>
    {sandbox?<p className="av45-frequency">Development checkout only. Square sandbox processes simulated transactions; no real card charge or bank deposit occurs.</p>:
     <p className="av45-frequency">Paid enrollment is not open. The proposed plans are for reference only, and no payment is collected.</p>}
    {supporter&&billing?.paidUntil&&<p className="av45-frequency">Provider-verified sandbox period through {billing.paidUntil}{billing.cancelAtPeriodEnd?' · Renewal cancellation scheduled':''}.</p>}
    {paymentReturn&&<p className="av45-frequency" role="status">You returned from checkout. Payment verification is independent of this redirect; refresh your membership status.</p>}
    {memberId&&checking&&<p className="av45-frequency" role="status">Checking supporter status…</p>}
    {error&&<p className="av45-error" role="alert">{error}</p>}
    {notice&&<p className="av45-frequency" role="status">{notice}</p>}
    {sandbox&&memberId&&!supporter&&!underReview&&!pending?
     <button className="av45-primary" type="button" disabled={busy||checking} onClick={()=>void openCheckout()}>
      {busy?'Opening sandbox…':'OPEN SECURE SANDBOX CHECKOUT ↗'}
     </button>:
     <Link className="av45-primary" to="/join">Join ANEVUM for free →</Link>}
    <div className="av45-action-row">
     {memberId&&<button type="button" disabled={busy||checking} onClick={()=>void reload()}>Refresh supporter status</button>}
     {supporter&&!billing?.cancelAtPeriodEnd&&
      <button type="button" disabled={busy||checking} onClick={()=>void stopRenewal()}>Cancel sandbox renewal</button>}
     {!memberId&&!isPending&&<Link to="/join">Already a member? Sign in</Link>}
     <Link to="/support/collection">Preview the collection →</Link>
    </div>
    {sandbox&&<p className="av45-frequency">New sandbox subscriptions renew automatically until cancelled. The checkout provider handles payment details. No real supporter rewards are granted during testing.</p>}
    <p className="av45-legal">This is voluntary support of an independent commercial platform, not a charitable donation, tax deduction, investment, or financial entitlement. Live prices, refunds, privacy terms, and payout arrangements require separate review before launch.</p>
   </aside>
  </section>
  <section className="av45-impact" aria-label="Where support goes">
   <div className="av45-impact-copy"><span className="av32-index">02 / YOUR IMPACT</span><strong>What support helps build.</strong></div>
   <div className="av45-impact-items">
    <span>Keep ANEVUM online</span>
    <span>Improve creator tools</span>
    <span>Support safer community spaces</span>
   </div>
   <Link className="av45-link" to="/support/transparency">Open transparency report →</Link>
  </section>
  <p className="av45-principle">Supporting is always optional. It never buys XP, medals, better ranking, moderator power or extra visibility.</p>
 </div>;
}

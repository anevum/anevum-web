import {useCallback,useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {OrbitalMark} from '../components/OrbitalMark';

type Interval='month'|'year';
type Billing={available:boolean;supporter:boolean;status:string;until?:number|null;cancelAtPeriodEnd?:boolean;interval?:Interval|null;publicInsignia?:boolean;revision?:number;plans:{month:number;year:number}};
function destination(value:unknown,host:string){
 if(typeof value!=='string')return null;
 try{const u=new URL(value);return u.protocol==='https:'&&u.hostname===host&&!u.username&&!u.password?u.href:null}catch{return null}
}
export function SupporterPage(){
 const {data:session,isPending}=canonicalAuthClient.useSession();
 const id=session?.user?.emailVerified===true?session.user.id:null;
 const [billing,setBilling]=useState<Billing|null>(null),[checking,setChecking]=useState(false),[busy,setBusy]=useState(false);
 const [interval,setInterval]=useState<Interval>('year'),[error,setError]=useState('');
 const refresh=useCallback(async(signal?:AbortSignal)=>{
  if(!id)return;setChecking(true);
  try{
   const r=await fetch('/api/v1/member/supporter',{method:'GET',mode:'same-origin',credentials:'same-origin',redirect:'error',cache:'no-store',referrerPolicy:'same-origin',signal});
   if(!r.ok)throw Error('unavailable');
   const data:unknown=await r.json();
   if(!data||typeof data!=='object'||Array.isArray(data))throw Error('invalid');
   const value=data as Billing;
   if(typeof value.available!=='boolean'||typeof value.supporter!=='boolean')throw Error('invalid');
   if(!signal?.aborted)setBilling(value);
  }catch{if(!signal?.aborted){setBilling(null);setError('Supporter status is unavailable. Payment actions remain disabled.')}}
  finally{if(!signal?.aborted)setChecking(false)}
 },[id]);
 useEffect(()=>{
  const controller=new AbortController();setBilling(null);setError('');
  if(id)void refresh(controller.signal);
  return()=>controller.abort();
 },[id,refresh]);
 async function action(kind:'checkout'|'portal'){
  if(!id||!billing?.available||checking||busy)return;
  setBusy(true);setError('');
  try{
   const r=await fetch('/api/v1/member/supporter/'+kind,{method:'POST',mode:'same-origin',credentials:'same-origin',
    referrerPolicy:'same-origin',cache:'no-store',redirect:'error',
    headers:kind==='checkout'?{'content-type':'application/json',accept:'application/json'}:{accept:'application/json'},
    body:kind==='checkout'?JSON.stringify({interval}):undefined});
   if(!r.ok)throw Error(r.status===409?'Membership status changed. Recheck your account before continuing.':'The billing action is unavailable.');
   const data:unknown=await r.json();
   const url=destination(data&&typeof data==='object'&&'url' in data?(data as {url:unknown}).url:null,
    kind==='checkout'?'checkout.stripe.com':'billing.stripe.com');
   if(!url)throw Error('The payment destination was not verified.');
   window.location.assign(url);
  }catch(e){setError(e instanceof Error?e.message:'This action is unavailable.')}
  finally{setBusy(false)}
 }
 async function updateDisplay(show:boolean){
  if(!id||!billing?.available||!billing.supporter||checking||busy)return;
  setBusy(true);setError('');
  try{
   const response=await fetch('/api/v1/member/supporter',{
    method:'PATCH',mode:'same-origin',credentials:'same-origin',cache:'no-store',
    redirect:'error',referrerPolicy:'same-origin',
    headers:{'content-type':'application/json',accept:'application/json'},
    body:JSON.stringify({publicInsignia:show,revision:billing.revision??0})
   });
   if(!response.ok)throw Error(response.status===409?'Your membership or display preference changed. Recheck your status.':'Could not change supporter display.');
   const changed=await response.json() as {publicInsignia:boolean;revision:number};
   if(typeof changed.publicInsignia!=='boolean'||!Number.isSafeInteger(changed.revision))throw Error('Display change not verified.');
   setBilling(old=>old?{...old,...changed}:old);
  }catch(e){setError(e instanceof Error?e.message:'Display change unavailable.')}
  finally{setBusy(false)}
 }

 const enabled=Boolean(id&&billing?.available),supporter=Boolean(billing?.supporter);
 const billingReview=billing?.status==='billing-review';
 return <main className="av32-support av45-support">
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
    <div className="av45-buy-head"><strong>FOUNDING SUPPORTER</strong><span>PRE-LAUNCH</span></div>
    <div className="av45-switch" role="group" aria-label="Proposed billing interval">
     <button type="button" aria-pressed={interval==='year'} onClick={()=>setInterval('year')}>Yearly · save 40%</button>
     <button type="button" aria-pressed={interval==='month'} onClick={()=>setInterval('month')}>Monthly</button>
    </div>
    <div className="av45-price"><strong>{interval==='year'?'$36':'$5'}</strong><span>/ {interval==='year'?'year':'month'}</span></div>
    <p className="av45-frequency">{interval==='year'?'Equivalent to $3 a month. Billed once yearly.':'Proposed recurring monthly option.'}</p>
    <p className="av45-status" role="status">
     {billingReview?'BILLING REVIEW NEEDED':supporter?'TEST MEMBERSHIP ACTIVE':enabled?'TEST CHECKOUT AVAILABLE':'PROPOSED PRICE · ENROLLMENT NOT OPEN'}
    </p>
    {supporter&&billing?.until&&<p className="av45-frequency">Access through {new Date(billing.until).toLocaleDateString()}{billing.cancelAtPeriodEnd?' · Renewal cancelled':''}.</p>}
    {id&&checking&&<p className="av45-frequency" role="status">Checking membership…</p>}
    {id&&error&&<p role="alert" className="av45-error">{error}</p>}
    {enabled
     ? <button className="av45-primary" type="button" disabled={busy||checking||billingReview} onClick={()=>void action(supporter?'portal':'checkout')}>
        {busy?'Opening…':billingReview?'Membership under review':supporter?'Manage test membership ↗':'Open test checkout ↗'}
       </button>
     : <Link className="av45-primary" to="/join">Join ANEVUM for free →</Link>}
    <div className="av45-action-row">
     {billingReview&&enabled&&<button type="button" disabled={busy||checking} onClick={()=>void action('portal')}>Open billing management ↗</button>}
     {id&&<button type="button" disabled={busy||checking} onClick={()=>{setError('');void refresh()}}>Refresh membership</button>}
     {!id&&!isPending&&<Link to="/join">Already a member? Sign in</Link>}
    </div>
    {supporter&&<details className="av45-options"><summary>Public supporter badge</summary>
      <label className="av32-privacy-setting"><input type="checkbox" checked={billing?.publicInsignia===true} disabled={!enabled||busy||checking} onChange={e=>void updateDisplay(e.target.checked)}/>
       <span><strong>Show badge on my profile</strong><small>Private by default; affects cosmetics only, never XP or ranking.</small></span>
      </label>
    </details>}
    <p className="av45-legal">Memberships and live payments are not open. These proposed prices and benefits will be confirmed with full terms before enrollment.</p>
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
 </main>;
}

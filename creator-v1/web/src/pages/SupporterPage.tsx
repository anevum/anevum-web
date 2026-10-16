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
 return <div className="av32-support">
  <section className="av32-hero" aria-labelledby="av32-title">
   <div className="av32-hero-copy"><span className="av32-index">ANEVUM / COMMUNITY CONTINUANCE / 001</span>
    <h1 id="av32-title">Keep the <em>signal</em> alive.</h1>
    <p>ANEVUM is an independent home for people who make, explore and share things. Supporting the network should be a choice, never the price of belonging.</p>
    <div className="av32-ethics"><span>NO INTRUSIVE ADS</span><span>NO PURCHASED XP</span><span>NO PAY-TO-WIN</span></div>
    <p className="av32-availability">FOUNDING SUPPORTER / <strong>PRE-LAUNCH PROPOSAL</strong></p>
   </div>
   <div className="av32-orbit" aria-hidden="true"><div className="av32-ring av32-ring-one"/><div className="av32-ring av32-ring-two"/><div className="av32-ring av32-ring-three"/><OrbitalMark/></div>
  </section>
  <section className="av32-grid" aria-label="Founding supporter membership">
   <article className="av32-panel"><span className="av32-index">01 / FREE MEMBERSHIP</span><h2>Belonging stays free.</h2>
    <p>Every member can have a profile and wall, discover creative work, take part in community and make submissions when publishing opens. XP, sixty level artifacts and medals stay earned.</p>
    <div className="av32-statement"><strong>Support is not an achievement.</strong><span>Payment never improves your level, earned awards, search placement, moderation privileges or creator eligibility.</span></div>
    <Link className="av32-link" to="/join">EXPLORE MEMBERSHIP ↗</Link>
   </article>
   <article className="av32-panel av32-price-panel"><span className="av32-index">02 / FOUNDING SUPPORTER</span>
    <h2>Back an independent creative universe.</h2>
    <div className="av32-intervals" role="group" aria-label="Billing interval">
     <button type="button" aria-pressed={interval==='month'} onClick={()=>setInterval('month')}>MONTHLY</button>
     <button type="button" aria-pressed={interval==='year'} onClick={()=>setInterval('year')}>ANNUAL</button>
    </div>
    <div className="av32-price"><strong>{'$'+(interval==='month'?'5':'36')}</strong><span>USD / {interval==='month'?'MONTH':'YEAR'}</span></div>
    <p className="av32-subprice">{interval==='year'?'Equivalent to $3 per month. One payment per year.':'Recurring monthly until cancelled.'}</p>
    <ul className="av32-perks">
     <li><strong>Distinctive supporter insignia</strong><small>Planned opt-in designation, separate from earned medals</small></li>
     <li><strong>A more personal space</strong><small>Additional optional cosmetic profile treatments planned</small></li>
     <li><strong>Keep the network independent</strong><small>Support hosting, development, creative infrastructure and upkeep</small></li>
    </ul>
    <p role="status" className="av32-test-note">{supporter?'TEST MEMBERSHIP VERIFIED':enabled?'TEST MODE ONLY · NO LIVE CHARGES':'Enrollment not open. Pricing and benefits are proposals, not a live sale.'}</p>
    {supporter&&billing?.until&&<p>Recorded access through {new Date(billing.until).toLocaleDateString()}{billing.cancelAtPeriodEnd?' · Cancels at period end':''}.</p>}
    {id&&checking&&<p role="status">Checking billing status…</p>}
    {error&&<p role="alert" className="av32-error">{error}</p>}
    <button type="button" className="av32-primary" disabled={!enabled||busy||checking} onClick={()=>void action(supporter?'portal':'checkout')}>
     {busy?'OPENING…':!enabled?'CHECKOUT NOT OPEN':supporter?'TEST BILLING MANAGEMENT ↗':'TEST SUPPORTER CHECKOUT ↗'}
    </button>
    {supporter&&<label className="av32-privacy-setting"><input type="checkbox" checked={billing?.publicInsignia===true} disabled={busy||checking} onChange={e=>void updateDisplay(e.target.checked)}/><span><strong>Show my founding supporter insignia</strong><small>Off by default. Visible on your public wall only when you choose to display it and your test membership is active. This does not affect earned awards.</small></span></label>}
    {id&&<button type="button" className="av32-refresh" disabled={checking||busy} onClick={()=>{setError('');void refresh()}}>RECHECK STATUS</button>}
    {!id&&!isPending&&<Link className="av32-link" to="/join">JOIN OR SIGN IN ↗</Link>}
    <p className="av32-legal">Final benefits, recurring payment terms, cancellation, refunds and tax information must be published before live enrollment. This does not offer investment returns or early financial benefits.</p>
   </article>
  </section>
  <section className="av32-afterword"><span className="av32-index">CONTINUANCE / PRINCIPLE 001</span>
   <blockquote>Creativity should be funded by people who believe in it, without selling their attention.</blockquote>
   <p>Creator sales and payouts are a separate future phase. ANEVUM will not hold creator funds or process marketplace transactions until verified publishing and payout systems are ready.</p>
  </section>
 </div>;
}

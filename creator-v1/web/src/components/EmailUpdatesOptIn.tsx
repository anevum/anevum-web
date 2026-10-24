import {useState,type FormEvent} from 'react';
import {Link} from 'react-router-dom';

const emailEnabled=import.meta.env.VITE_ANEVUM_EMAIL_UPDATES==='true';
type Status='idle'|'saving'|'submitted'|'error';
/** Marketing consent is NEVER inferred from login, account verification, or
 * an existing membership. No form is sent until its own explicit opt-in. */
export function EmailUpdatesOptIn(){
 const [email,setEmail]=useState('');
 const [releases,setReleases]=useState(false);
 const [weekly,setWeekly]=useState(false);
 const [status,setStatus]=useState<Status>('idle');
 const [error,setError]=useState('');
 async function subscribe(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!emailEnabled||status==='saving'||!(releases||weekly))return;
  setStatus('saving');setError('');
  try{
   const response=await fetch('/api/v1/communications/subscribe',{
    method:'POST',credentials:'omit',mode:'same-origin',cache:'no-store',redirect:'error',
    referrerPolicy:'no-referrer',
    headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify({email:email.trim().toLowerCase(),topics:{releases,weekly},consent:true})
   });
   if(!response.ok)throw Error('Email enrollment is currently unavailable.');
   setStatus('submitted');setEmail('');
  }catch{
   setError('Email enrollment is unavailable right now. No subscription was confirmed.');
   setStatus('error');
  }
 }
 return <section className="au26-optin" aria-labelledby="au26-optin-title">
  <span className="au26-kicker">ANEVUM / STAY IN THE SIGNAL</span>
  <h2 id="au26-optin-title">Get the updates you want.</h2>
  <p>Choose what ANEVUM sends you. Confirm your email before receiving anything. You can unsubscribe from either topic whenever you want.</p>
  {!emailEnabled?<p className="au26-optin-pending" role="status">Email subscriptions are being prepared for the tester release. In-site release notes are available now.</p>:
   status==='submitted'?<div className="au26-optin-result" role="status"><strong>Check your inbox.</strong><p>If the address is eligible, a confirmation link will arrive. You are not subscribed until you confirm.</p><button type="button" onClick={()=>setStatus('idle')}>Use another address</button></div>:
   <form onSubmit={subscribe} className="au26-optin-form">
    <label htmlFor="au26-subscribe-email">Email address</label>
    <input id="au26-subscribe-email" type="email" required autoComplete="email" maxLength={254}
     value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@example.com" disabled={status==='saving'}/>
    <fieldset><legend>Choose your emails (optional until selected)</legend>
     <label><input type="checkbox" checked={releases} onChange={event=>setReleases(event.target.checked)} disabled={status==='saving'}/><span><strong>Product updates and patch notes</strong><small>Important releases, tester fixes and changes.</small></span></label>
     <label><input type="checkbox" checked={weekly} onChange={event=>setWeekly(event.target.checked)} disabled={status==='saving'}/><span><strong>Weekly discoveries</strong><small>A selection of genuinely published games, apps and creations. No emails when there's nothing to feature.</small></span></label>
    </fieldset>
    <button type="submit" disabled={status==='saving'||!(releases||weekly)}>{status==='saving'?'Requesting confirmation…':'Send confirmation email'}</button>
    {status==='error'&&<p role="alert">{error}</p>}
    <small>No automatic enrollment from signing in. Only confirmed choices receive email. This is separate from account/security emails. <Link to="/updates/preferences">Manage an existing subscription</Link>. <Link to="/guide">Community guidance</Link>.</small>
   </form>}
 </section>;
}

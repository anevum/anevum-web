import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {Link} from 'react-router-dom';

type State={available:boolean;canClose:boolean;reason?:string|null;reauthRequired:boolean};
const PHRASE='DELETE MY ANEVUM ACCOUNT';

/** Owner-only irreversible operation; live billing identities always require review. */
export function MemberClosurePanel({memberId,memberEmail}:{memberId:string;memberEmail:string}){
 const [state,setState]=useState<State|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [email,setEmail]=useState('');
 const [phrase,setPhrase]=useState('');
 const load=useCallback(async(signal?:AbortSignal)=>{
  setLoading(true);
  try{
   const response=await fetch('/api/v1/member/account-closure',{
    credentials:'same-origin',mode:'same-origin',redirect:'error',cache:'no-store',
    referrerPolicy:'same-origin',signal,headers:{accept:'application/json'}
   });
   if(!response.ok)throw Error('Closure verification is unavailable.');
   const data:unknown=await response.json();
   if(!data||typeof data!=='object'||Array.isArray(data)||
      typeof (data as State).available!=='boolean'||
      typeof (data as State).canClose!=='boolean'||
      typeof (data as State).reauthRequired!=='boolean')
    throw Error('Closure verification was not confirmed.');
   if(!signal?.aborted){setState(data as State);setError('');}
  }catch(e){if(!signal?.aborted){setState(null);setError(e instanceof Error?e.message:'Account controls unavailable.');}}
  finally{if(!signal?.aborted)setLoading(false);}
 },[memberId]);
 useEffect(()=>{
  const ctl=new AbortController();
  setState(null);setEmail('');setPhrase('');setError('');
  void load(ctl.signal);
  return()=>ctl.abort();
 },[load,memberId]);
 const canSubmit=Boolean(state?.available&&state.canClose&&!state.reauthRequired&&
  !loading&&!busy&&email===memberEmail&&phrase===PHRASE);
 async function close(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!canSubmit)return;
  setBusy(true);setError('');
  try{
   const response=await fetch('/api/v1/member/account-closure',{
    method:'POST',credentials:'same-origin',mode:'same-origin',redirect:'error',
    cache:'no-store',referrerPolicy:'same-origin',
    headers:{'content-type':'application/json',accept:'application/json'},
    body:JSON.stringify({confirmation:phrase,memberEmail:email})
   });
   if(!response.ok)throw Error(response.status===409
     ?'Your billing or account state changed. Reload this page before attempting closure.'
     :response.status===403?'Sign out and sign in again before confirming deletion.'
     :'The server could not verify deletion. Your account may still exist.');
   const result=await response.json() as {deleted?:boolean;sessionRevoked?:boolean};
   if(result.deleted!==true||result.sessionRevoked!==true)
    throw Error('The server did not confirm account deletion.');
   // Better Auth session and creator records have been removed server-side.
   window.location.replace('/join');
  }catch(e){setError(e instanceof Error?e.message:'Closure unavailable.');setBusy(false);}
 }
 return <section className="av36-closure" aria-labelledby="av36-closure-title">
  <span className="kicker">DATA RIGHTS / ACCOUNT CONTROL</span>
  <h2 id="av36-closure-title">Your account, your decision.</h2>
  <p>Download your account data before making a permanent request. Closing a free account removes your canonical member profile, wall, artwork uploads, sessions and earned progression. It cannot be undone.</p>
  <a href="/api/v1/member/account-export" download="anevum-member-export.json">DOWNLOAD MY ACCOUNT DATA ↓</a>
  {loading&&<p role="status">Verifying account and billing state…</p>}
  {!loading&&state&&!state.available&&<p className="av36-closure-note" role="status">
   Self-service deletion is not activated in this release. Your profile and data remain unchanged.
  </p>}
  {state?.available&&!state.canClose&&<div className="av36-closure-note" role="status">
   <strong>{state.reason==='billing-review'?'Billing review required':state.reason==='checkout-review'?'An earlier checkout needs review':'Another closure is being processed'}</strong>
   <p>{state.reason==='billing-review'
     ?'This account has supporter billing history. To avoid an unwanted recurring charge, manage the subscription and have the account closure reviewed before deletion.'
     :state.reason==='checkout-review'
       ?'A prior payment or Checkout session must be resolved before we can safely remove this identity.'
       :'Reload this page after the current request finishes.'}</p>
   {(state.reason==='billing-review'||state.reason==='checkout-review')&&
    <Link to="/support">OPEN SUPPORTER BILLING ↗</Link>}
  </div>}
  {state?.available&&state.canClose&&state.reauthRequired&&
   <p className="av36-closure-note" role="status">For account security, sign out and sign in again before requesting deletion.</p>}
  {state?.available&&state.canClose&&!state.reauthRequired&&
   <form className="av36-closure-form" onSubmit={event=>void close(event)}>
    <p>This irreversible action is available only to accounts without Stripe billing or checkout history.</p>
    <label htmlFor="av36-email">Type your verified sign-in email</label>
    <input id="av36-email" type="email" autoComplete="off" autoCapitalize="none"
     value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}
     placeholder="Your sign-in email" required/>
    <label htmlFor="av36-confirmation">Type: <strong>{PHRASE}</strong></label>
    <input id="av36-confirmation" autoComplete="off" value={phrase}
     onChange={e=>setPhrase(e.target.value)} disabled={busy} required/>
    <button type="submit" disabled={!canSubmit} className="av36-delete">
     {busy?'VERIFYING ACCOUNT CLOSURE…':'PERMANENTLY DELETE MY ACCOUNT'}
    </button>
   </form>}
  {error&&<p role="alert" className="av36-closure-error">{error}</p>}
 </section>;
}

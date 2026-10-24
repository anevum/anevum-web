import {useMemo,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import '../release-updates-v026.css';
const enabled=import.meta.env.VITE_ANEVUM_EMAIL_UPDATES==='true';
const CONFIRM=/^[A-Za-z0-9_-]{40,90}$/;
const UNSUB=/^v1\.[a-f0-9-]{36}\.[A-Za-z0-9_-]{40,90}$/;
export function EmailUpdatePreferencesPage(){
 const [params]=useSearchParams();
 const action=useMemo(()=>params.get('action'),[params]);
 const token=useMemo(()=>params.get('token')||'',[params]);
 const valid=action==='confirm'?CONFIRM.test(token):action==='unsubscribe'?UNSUB.test(token):false;
 const [status,setStatus]=useState<'idle'|'busy'|'done'|'error'>('idle');
 async function submit(){
  if(!enabled||!valid||status==='busy')return;
  setStatus('busy');
  try{
   const response=await fetch('/api/v1/communications/'+action,{
    method:'POST',mode:'same-origin',credentials:'omit',cache:'no-store',redirect:'error',
    referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify({token})
   });
   if(!response.ok)throw Error('Request unavailable');
   setStatus('done');
   window.history.replaceState(null,'','/updates/preferences');
  }catch{setStatus('error')}
 }
 return <main className="au26-page au26-preferences"><span className="au26-kicker">ANEVUM / EMAIL PREFERENCES</span>
  <h1>{action==='unsubscribe'?'Stop email updates':action==='confirm'?'Confirm your updates':'Manage your updates'}</h1>
  {!enabled?<p>Email preference changes are not yet available.</p>:
   !valid?<p>This email link is invalid or incomplete. For privacy, no subscription state has been changed.</p>:
   status==='done'?<p role="status">{action==='unsubscribe'?'Your subscription has been turned off.':'Your requested email preferences have been confirmed.'}</p>:
   <><p>{action==='unsubscribe'?'Confirm to stop all optional ANEVUM newsletters. Account security emails are separate.':'Select confirm to activate only the email topics you requested.'}</p>
    <button type="button" disabled={status==='busy'} onClick={submit}>{status==='busy'?'Processing…':action==='unsubscribe'?'Unsubscribe':'Confirm email updates'}</button>
    {status==='error'&&<p role="alert">Unable to save your request. No change has been confirmed. You can retry.</p>}</>}
  <p><Link to="/updates">Back to release notes</Link></p>
 </main>;
}

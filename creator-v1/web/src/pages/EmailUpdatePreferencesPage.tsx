import {useEffect,useMemo,useState,type FormEvent} from 'react';
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
 const [manageEmail,setManageEmail]=useState('');
 const [manageStatus,setManageStatus]=useState<'idle'|'busy'|'submitted'|'error'>('idle');
 useEffect(()=>{if(params.has('token'))window.history.replaceState(window.history.state,'','/updates/preferences');},[params]);
 const [topic,setTopic]=useState<'all'|'releases'|'weekly'>('all');
 async function requestManage(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!enabled||manageStatus==='busy')return;
  setManageStatus('busy');
  try{
   const response=await fetch('/api/v1/communications/manage',{
    method:'POST',mode:'same-origin',credentials:'omit',cache:'no-store',redirect:'error',
    referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify({email:manageEmail.trim().toLowerCase()})
   });
   if(!response.ok)throw Error('Unavailable');
   setManageStatus('submitted');
   setManageEmail('');
  }catch{setManageStatus('error')}
 }
 async function submit(){
  if(!enabled||!valid||status==='busy')return;
  setStatus('busy');
  try{
   const response=await fetch('/api/v1/communications/'+action,{
    method:'POST',mode:'same-origin',credentials:'omit',cache:'no-store',redirect:'error',
    referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify(action==='unsubscribe'?{token,topic}:{token})
   });
   if(!response.ok)throw Error('Request unavailable');
   setStatus('done');
   window.history.replaceState(null,'','/updates/preferences');
  }catch{setStatus('error')}
 }
 return <main className="au26-page au26-preferences"><span className="au26-kicker">ANEVUM / EMAIL PREFERENCES</span>
  <h1>{action==='unsubscribe'?'Stop email updates':action==='confirm'?'Confirm your updates':'Manage your updates'}</h1>
  {!enabled?<p>Email preference changes are not yet available.</p>:
   !action?<form className="au26-optin-form" onSubmit={requestManage}>
    <p>Request a private, expiring link to manage your optional newsletters. This does not change your sign-in or security emails.</p>
    <label htmlFor="au26-manage-email">Email address</label>
    <input id="au26-manage-email" type="email" autoComplete="email" required maxLength={254}
      disabled={manageStatus==='busy'||manageStatus==='submitted'} value={manageEmail}
      onChange={event=>setManageEmail(event.target.value)} placeholder="you@example.com"/>
    {manageStatus==='submitted'?<p role="status">If this address has a confirmed ANEVUM subscription, you will receive a private preferences link.</p>:
      <button type="submit" disabled={manageStatus==='busy'}>{manageStatus==='busy'?'Requesting…':'Send preferences link'}</button>}
    {manageStatus==='error'&&<p role="alert">The request could not be completed. No subscription settings were changed.</p>}
   </form>:
   !valid?<p>This email link is invalid or incomplete. For privacy, no subscription state has been changed.</p>:
   status==='done'?<p role="status">{action==='unsubscribe'?'Your selected email updates have been turned off.':'Your requested email preferences have been confirmed.'}</p>:
   <><p>{action==='unsubscribe'?'Choose which optional ANEVUM emails to stop. Account security emails are separate.':'Select confirm to activate only the email topics you requested.'}</p>
    {action==='unsubscribe'&&<fieldset><legend>Stop receiving</legend><label><input type="radio" name="topic" checked={topic==='all'} onChange={()=>setTopic('all')}/> All optional updates</label><label><input type="radio" name="topic" checked={topic==='releases'} onChange={()=>setTopic('releases')}/> Product updates and patch notes</label><label><input type="radio" name="topic" checked={topic==='weekly'} onChange={()=>setTopic('weekly')}/> Weekly discoveries</label></fieldset>}
    <button type="button" disabled={status==='busy'} onClick={submit}>{status==='busy'?'Processing…':action==='unsubscribe'?'Unsubscribe':'Confirm email updates'}</button>
    {status==='error'&&<p role="alert">Unable to save your request. No change has been confirmed. You can retry.</p>}</>}
  <p><Link to="/updates">Back to release notes</Link></p>
 </main>;
}

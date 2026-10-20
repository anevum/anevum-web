import {useState} from 'react';
import {Link} from 'react-router-dom';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {useResource} from '../lib/useResource';
import './forums.css';

type PendingThread={id:string;topic:string;title:string;body:string;created_at:number;handle:string;display_name:string};
type PendingReply={id:string;thread_id:string;body:string;created_at:number;handle:string;display_name:string};
type OpenReport={id:string;target_kind:'thread'|'reply';target_id:string;reason:string;created_at:number};
type Queue={threads:PendingThread[];replies:PendingReply[];reports:OpenReport[]};
type Kind='thread'|'reply'|'report';
type Action='publish'|'reject'|'hide'|'dismiss_report';

async function call<T>(method:'GET'|'POST',body?:unknown,signal?:AbortSignal):Promise<T>{
 const response=await fetch('/api/v1/member/forum-review',{
  method,mode:'same-origin',credentials:'same-origin',redirect:'error',
  cache:'no-store',referrerPolicy:'same-origin',signal,
  headers:body?{Accept:'application/json','Content-Type':'application/json'}:{Accept:'application/json'},
  body:body?JSON.stringify(body):undefined
 });
 const result=await response.json().catch(()=>({error:'Review service unavailable'}));
 if(!response.ok)throw Error(response.status===403?'Reviewer authorization required':result?.error||'Review service unavailable');
 return result as T;
}
function formatted(at:number){return new Date(at*1000).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}
function ReviewWorkspace({memberId}:{memberId:string}){
 const [revision,setRevision]=useState(0),[busy,setBusy]=useState<string|null>(null);
 const [failure,setFailure]=useState(''),[notice,setNotice]=useState('');
 const queue=useResource(signal=>call<Queue>('GET',undefined,signal),[memberId,revision]);
 async function act(targetKind:Kind,targetId:string,action:Action){
  if(busy)return;
  if((action==='reject'||action==='hide')&&!window.confirm(action==='hide'?'Hide this already published content?':'Reject this pending submission?'))return;
  setBusy(targetId);setFailure('');setNotice('');
  try{
   await call('POST',{targetKind,targetId,action});
   setRevision(v=>v+1);
   setNotice(action==='publish'?'Approved and published.':action==='hide'?'Content hidden from public views.':action==='reject'?'Submission rejected.':'Report dismissed with an audit record.');
  }catch(error){setFailure(error instanceof Error?error.message:'Review was not saved.');}
  finally{setBusy(null);}
 }
 return <section className="cf-forums cf-review" aria-labelledby="cf-review-title">
  <header className="cf-header"><div><span className="cf-kicker">ANEVUM / CONTINUANCE INSTITUTE / OPERATIONS</span>
   <h1 id="cf-review-title">Community <em>review desk.</em></h1>
   <p>Independent moderation of real member submissions. Every decision is recorded under the authenticated reviewer.</p>
  </div><Link className="cf-primary" to="/community">RETURN TO COMMONS</Link></header>
  {failure&&<p role="alert" className="cf-error">{failure}</p>}
  {notice&&<p role="status" className="cf-notice">{notice}</p>}
  {queue.state==='loading'&&<p role="status">Checking authorization and review queue…</p>}
  {queue.state==='error'&&<div className="cf-note" role="alert"><h2>Review access unavailable.</h2>
   <p>Only explicitly authorized reviewers can see the private moderation queue. No submissions have been changed.</p>
   <button type="button" onClick={()=>setRevision(v=>v+1)}>RETRY AUTHORIZATION</button></div>}
  {queue.state==='ready'&&<>
   <div className="cf-review-totals" aria-label="Pending review totals">
    <span><strong>{queue.data.threads.length}</strong> THREADS</span>
    <span><strong>{queue.data.replies.length}</strong> REPLIES</span>
    <span><strong>{queue.data.reports.length}</strong> REPORTS</span>
   </div>
   <section aria-labelledby="cf-pending-threads"><h2 id="cf-pending-threads">THREAD SUBMISSIONS</h2>
    {queue.data.threads.length===0&&<p className="cf-note">No pending threads in the visible review window.</p>}
    {queue.data.threads.map(t=><article className="cf-thread" key={t.id}>
     <div className="cf-thread-meta"><span>{t.topic.toUpperCase()} / PENDING REVIEW</span><time>{formatted(t.created_at)}</time></div>
     <h3>{t.title}</h3><p className="cf-review-author">{t.display_name} / @{t.handle}</p>
     <p className="cf-fullbody">{t.body}</p>
     <div className="cf-thread-foot"><button type="button" disabled={Boolean(busy)} onClick={()=>void act('thread',t.id,'publish')}>APPROVE & PUBLISH</button>
      <button type="button" disabled={Boolean(busy)} onClick={()=>void act('thread',t.id,'reject')}>REJECT</button></div>
    </article>)}
   </section>
   <section aria-labelledby="cf-pending-replies"><h2 id="cf-pending-replies">REPLY SUBMISSIONS</h2>
    {queue.data.replies.length===0&&<p className="cf-note">No pending replies in the visible review window.</p>}
    {queue.data.replies.map(r=><article className="cf-thread" key={r.id}>
     <div className="cf-thread-meta"><span>REPLY / PENDING REVIEW</span><time>{formatted(r.created_at)}</time></div>
     <p className="cf-review-author">{r.display_name} / @{r.handle}</p>
     <p className="cf-fullbody">{r.body}</p>
     <Link to={'/community/threads/'+r.thread_id}>READ PARENT THREAD ↗</Link>
     <div className="cf-thread-foot"><button type="button" disabled={Boolean(busy)} onClick={()=>void act('reply',r.id,'publish')}>APPROVE & PUBLISH</button>
      <button type="button" disabled={Boolean(busy)} onClick={()=>void act('reply',r.id,'reject')}>REJECT</button></div>
    </article>)}
   </section>
   <section aria-labelledby="cf-reports"><h2 id="cf-reports">MEMBER REPORTS</h2>
    {queue.data.reports.length===0&&<p className="cf-note">No open reports in the visible review window.</p>}
    {queue.data.reports.map(r=><article className="cf-thread" key={r.id}>
     <div className="cf-thread-meta"><span>{r.target_kind.toUpperCase()} / {r.reason.toUpperCase()}</span><time>{formatted(r.created_at)}</time></div>
     <p>Reported content is reviewed independently. Reporter identities are not displayed in the queue.</p>
     {r.target_kind==='thread'&&<Link to={'/community/threads/'+r.target_id}>OPEN REPORTED THREAD ↗</Link>}
     <div className="cf-thread-foot"><button type="button" disabled={Boolean(busy)} onClick={()=>void act(r.target_kind,r.target_id,'hide')}>HIDE PUBLIC CONTENT</button>
      <button type="button" disabled={Boolean(busy)} onClick={()=>void act('report',r.id,'dismiss_report')}>DISMISS REPORT</button></div>
    </article>)}
   </section>
   <p className="cf-disclosure">Only the first 50 pending records per queue are listed at a time. Actions are checked against current server state; entries cannot be published by a client-side toggle.</p>
  </>}
 </section>;
}
export function ForumReviewPage(){
 const {data:session,isPending}=canonicalAuthClient.useSession();
 if(isPending)return <section className="cf-forums" role="status">Verifying reviewer identity…</section>;
 if(!session?.user?.id)return <section className="cf-forums"><h1>Member sign-in required.</h1><p>Only authorized reviewers can access the moderation queue.</p><Link to="/join">SIGN IN</Link></section>;
 return <ReviewWorkspace key={session.user.id} memberId={session.user.id}/>;
}

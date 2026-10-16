import {useEffect,useMemo,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {useResource} from '../lib/useResource';
import {ForumAuthorCard} from '../components/ForumAuthorCard';
import {MemberPortrait} from '../components/MemberPortrait';
import type {ForumAuthor} from '../lib/member-forums';
import './forum-moderator.css';

type Member=ForumAuthor&{visibility:'public'|'private'};
type PendingThread={
 id:string;topic:string;title:string;body:string;createdAt:number;
 author:Member;selfAuthored:boolean;canPublish:boolean
};
type PendingReply={
 id:string;threadId:string;threadTitle:string;threadTopic:string;body:string;
 createdAt:number;author:Member;selfAuthored:boolean;canPublish:boolean
};
type OpenReport={
 id:string;targetKind:'thread'|'reply';targetId:string;threadId:string|null;
 threadTitle:string|null;topic:string|null;reason:'unsafe'|'harassment'|'spam'|'other';
 createdAt:number;targetStatus:string;parentStatus:string|null;
 contentPreview:string;authorHandle:string|null;authorDisplayName:string|null;
 authorVisibility:string|null;canHide:boolean
};
type AuditEvent={
 id:string;targetKind:'thread'|'reply'|'report';targetId:string;
 action:'publish'|'reject'|'hide'|'dismiss_report';createdAt:number;reviewerHandle:string|null
};
type ReviewSnapshot={
 threads:PendingThread[];replies:PendingReply[];reports:OpenReport[];recent:AuditEvent[];
 totals:{threads:number;replies:number;reports:number;
  oldestThreadAt:number|null;oldestReplyAt:number|null;oldestReportAt:number|null};
 pageSize:number;auditSize:number;checkedAt:number
};
type Lane='overview'|'threads'|'replies'|'reports'|'activity';
type Decision={kind:'thread'|'reply'|'report';id:string;action:'publish'|'reject'|'hide'|'dismiss_report';summary:string};
const lanes:ReadonlyArray<{key:Lane;name:string;index:string}>=[
 {key:'overview',name:'Overview',index:'00'},
 {key:'threads',name:'Threads',index:'01'},
 {key:'replies',name:'Replies',index:'02'},
 {key:'reports',name:'Reports',index:'03'},
 {key:'activity',name:'Decision log',index:'04'}
];
const actions={
 publish:{title:'Authorize publication',detail:'This submission becomes publicly visible. The decision and reviewer are permanently recorded in the moderation log.',button:'CONFIRM PUBLICATION'},
 reject:{title:'Reject submission',detail:'This pending submission will be rejected. It will not appear in public discussion feeds. The action is audited.',button:'CONFIRM REJECTION'},
 hide:{title:'Withdraw from public view',detail:'This published item will be hidden. Open reports against this exact item are resolved, and the action is audited.',button:'HIDE CONTENT'},
 dismiss_report:{title:'Dismiss member report',detail:'This report will be resolved without changing the reported content. The resolution is recorded in the moderation log.',button:'DISMISS REPORT'}
} as const;
const displayTime=(seconds:number)=>new Date(seconds*1000).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
const uppercase=(s:string)=>s.replaceAll('_',' ').toUpperCase();
const reasonLabel=(s:string)=>({unsafe:'SAFETY',harassment:'HARASSMENT',spam:'SPAM',other:'OTHER'} as Record<string,string>)[s]||'OTHER';

async function reviewRequest<T>(method:'GET'|'POST',body?:unknown,signal?:AbortSignal):Promise<T>{
 const response=await fetch('/api/v1/member/forum-review',{
  method,mode:'same-origin',credentials:'same-origin',redirect:'error',
  cache:'no-store',referrerPolicy:'same-origin',signal,
  headers:body===undefined?{Accept:'application/json'}:{Accept:'application/json','Content-Type':'application/json'},
  body:body===undefined?undefined:JSON.stringify(body)
 });
 let result:unknown=null;
 try{result=await response.json()}catch{/* network or invalid JSON is handled below */}
 if(!response.ok){
  const error=result&&typeof result==='object'&&'error' in result?String(result.error):'Review service unavailable';
  throw new Error(response.status===403?'Reviewer authorization required':response.status===401?'Verified member sign-in required':error);
 }
 if(!result||typeof result!=='object')throw new Error('Invalid moderation service response');
 return result as T;
}
function Person({member}:{member:Member}){
 if(member.visibility==='public')return <ForumAuthorCard author={member}/>;
 return <div className="mc-person mc-private">
  <MemberPortrait name={member.displayName}/>
  <span><strong>{member.displayName}</strong><small>PRIVATE PROFILE · IDENTITY RESTRICTED</small></span>
 </div>;
}
function Guardrail({selfAuthored,canPublish}:{selfAuthored:boolean;canPublish:boolean}){
 if(canPublish)return <span className="mc-eligible">ELIGIBLE FOR INDEPENDENT REVIEW</span>;
 return <span className="mc-ineligible">{selfAuthored?'SECOND REVIEWER REQUIRED':'AUTHOR OR PARENT IS NOT PUBLIC / VERIFIED'}</span>;
}
function Workspace({memberId}:{memberId:string}){
 const [revision,setRevision]=useState(0);
 const [lane,setLane]=useState<Lane>('overview');
 const [query,setQuery]=useState('');
 const [choice,setChoice]=useState<Decision|null>(null);
 const [busy,setBusy]=useState(false);
 const [mutationError,setMutationError]=useState('');
 const [notice,setNotice]=useState('');
 const dialog=useRef<HTMLDialogElement>(null);
 const queue=useResource(signal=>reviewRequest<ReviewSnapshot>('GET',undefined,signal),[memberId,revision]);
 const data=queue.state==='ready'?queue.data:null;
 const search=query.trim().toLocaleLowerCase();
 const visible=useMemo(()=>{
  const matches=(...parts:(string|null|undefined)[])=>!search||parts.some(part=>(part||'').toLocaleLowerCase().includes(search));
  return {
   threads:(data?.threads||[]).filter(t=>matches(t.topic,t.title,t.body,t.author.handle,t.author.displayName)),
   replies:(data?.replies||[]).filter(r=>matches(r.threadTitle,r.body,r.author.handle,r.author.displayName)),
   reports:(data?.reports||[]).filter(r=>matches(r.reason,r.threadTitle,r.contentPreview,r.authorHandle,r.authorDisplayName)),
   recent:(data?.recent||[]).filter(r=>matches(r.action,r.targetKind,r.reviewerHandle))
  };
 },[data,search]);
 useEffect(()=>{
  const node=dialog.current;
  if(choice&&!node?.open)node?.showModal();
  else if(!choice&&node?.open)node.close();
 },[choice]);
 const begin=(kind:Decision['kind'],id:string,action:Decision['action'],summary:string)=>{
  if(busy)return;
  setMutationError('');setNotice('');setChoice({kind,id,action,summary});
 };
 async function decide(){
  if(!choice||busy)return;
  setBusy(true);setMutationError('');
  try{
   await reviewRequest('POST',{targetKind:choice.kind,targetId:choice.id,action:choice.action});
   setChoice(null);
   setRevision(v=>v+1);
   setNotice(choice.action==='publish'?'Publication recorded.':choice.action==='hide'?'Content hidden and matching reports resolved.':choice.action==='reject'?'Submission rejected.':'Report dismissed.');
  }catch(err){setMutationError(err instanceof Error?err.message:'Decision could not be saved. Refresh the queue and retry.');}
  finally{setBusy(false)}
 }
 const refresh=()=>{if(!busy){setNotice('');setRevision(v=>v+1)}};
 const oldest=[data?.totals.oldestThreadAt,data?.totals.oldestReplyAt,data?.totals.oldestReportAt]
   .filter((x):x is number=>typeof x==='number').sort((a,b)=>a-b)[0];
 const count=(key:'threads'|'replies'|'reports')=>data?.totals[key]||0;
 const total=count('threads')+count('replies')+count('reports');
 const opening=(kind:'threads'|'replies'|'reports',shown:number)=>
  <p className="mc-scope">{data&&data.totals[kind]>data.pageSize
   ?'Showing the first '+data.pageSize+' of '+data.totals[kind]+' records. Resolve older items, then refresh to see the next window.'
   :shown===0?'No matching records in this review window.':'Showing '+shown+' of '+data?.totals[kind]+' open records.'}</p>;

 const threadCards=(items:PendingThread[])=><div className="mc-records">{items.map(t=>
  <article className="mc-case" key={t.id}>
   <div className="mc-case-top"><span className="mc-case-type">TRANSMISSION / {uppercase(t.topic)}</span>
    <time dateTime={new Date(t.createdAt*1000).toISOString()}>{displayTime(t.createdAt)}</time></div>
   <h3>{t.title}</h3><p className="mc-case-body">{t.body}</p>
   <div className="mc-case-person"><Person member={t.author}/></div>
   <div className="mc-case-foot"><Guardrail selfAuthored={t.selfAuthored} canPublish={t.canPublish}/>
    <div className="mc-actions"><button type="button" className="mc-approve" disabled={busy||!t.canPublish} onClick={()=>begin('thread',t.id,'publish',t.title)}>APPROVE & PUBLISH</button>
     <button type="button" disabled={busy} onClick={()=>begin('thread',t.id,'reject',t.title)}>REJECT</button></div>
   </div>
  </article>)}</div>;

 const replyCards=(items:PendingReply[])=><div className="mc-records">{items.map(r=>
  <article className="mc-case" key={r.id}>
   <div className="mc-case-top"><span className="mc-case-type">REPLY / {uppercase(r.threadTopic)}</span>
    <time dateTime={new Date(r.createdAt*1000).toISOString()}>{displayTime(r.createdAt)}</time></div>
   <h3 className="mc-parent">{r.threadTitle}</h3>
   <p className="mc-case-body">{r.body}</p>
   <div className="mc-case-person"><Person member={r.author}/></div>
   <div className="mc-case-foot"><Guardrail selfAuthored={r.selfAuthored} canPublish={r.canPublish}/>
    <div className="mc-actions"><Link to={'/community/threads/'+r.threadId}>PARENT THREAD ↗</Link>
     <button type="button" className="mc-approve" disabled={busy||!r.canPublish} onClick={()=>begin('reply',r.id,'publish','Reply in '+r.threadTitle)}>APPROVE</button>
     <button type="button" disabled={busy} onClick={()=>begin('reply',r.id,'reject','Reply in '+r.threadTitle)}>REJECT</button></div>
   </div>
  </article>)}</div>;

 const reportCards=(items:OpenReport[])=><div className="mc-records">{items.map(r=>
  <article className="mc-case mc-report" key={r.id}>
   <div className="mc-case-top"><span className={'mc-reason mc-reason-'+r.reason}>{reasonLabel(r.reason)} / {uppercase(r.targetKind)}</span>
    <time dateTime={new Date(r.createdAt*1000).toISOString()}>{displayTime(r.createdAt)}</time></div>
   <h3>{r.threadTitle||'Original discussion unavailable'}</h3>
   <div className="mc-evidence-label">REPORTED MATERIAL / STAFF-ONLY EXCERPT</div>
   <blockquote className="mc-evidence">{r.contentPreview||'Reported content is no longer available in its original record.'}</blockquote>
   <p className="mc-report-context">{r.authorDisplayName?('Author: '+r.authorDisplayName+(r.authorHandle?' / @'+r.authorHandle:'')):'Original author unavailable'} · Content state: {uppercase(r.targetStatus)}
    {r.parentStatus&&' · Parent: '+uppercase(r.parentStatus)}</p>
   <div className="mc-case-foot"><span className="mc-privacy">REPORTER IDENTITY IS WITHHELD</span>
    <div className="mc-actions">
     {r.threadId&&<Link to={'/community/threads/'+r.threadId}>VIEW DISCUSSION ↗</Link>}
     <button type="button" className="mc-danger" disabled={busy||!r.canHide} onClick={()=>begin(r.targetKind,r.targetId,'hide','Reported '+r.targetKind+' in '+(r.threadTitle||'discussion'))}>HIDE CONTENT</button>
     <button type="button" disabled={busy} onClick={()=>begin('report',r.id,'dismiss_report','Report of '+r.targetKind+' / '+reasonLabel(r.reason))}>DISMISS</button>
    </div>
   </div>
  </article>)}</div>;

 const auditCards=(items:AuditEvent[])=><div className="mc-log">{items.map(r=><article className="mc-log-entry" key={r.id}>
  <span className="mc-log-symbol" aria-hidden="true">{r.action==='publish'?'↗':r.action==='hide'?'−':r.action==='reject'?'×':'✓'}</span>
  <div><strong>{uppercase(r.action)}</strong><span>{uppercase(r.targetKind)} / {r.reviewerHandle?'@'+r.reviewerHandle:'STAFF REVIEWER'}</span>
   <small>{r.targetId.slice(0,8)}… · {displayTime(r.createdAt)}</small></div>
 </article>)}</div>;

 return <section className="cf-forums mc-console" aria-labelledby="mc-heading">
  <header className="mc-top"><div className="mc-top-copy">
   <span className="mc-eyebrow">ANEVUM / CONTINUANCE INSTITUTE / COMMUNITY INTEGRITY</span>
   <h1 id="mc-heading">Moderation <em>console.</em></h1>
   <p>Review community submissions, protect the discussion space, and retain an accountable record of every decision.</p>
  </div><Link className="mc-return" to="/community">↗ BACK TO COMMONS</Link></header>

  {notice&&<p className="mc-feedback" role="status">{notice}</p>}
  {queue.state==='loading'&&<div className="mc-wait" role="status">AUTHENTICATING · RETRIEVING STAFF REVIEW WINDOW…</div>}
  {queue.state==='error'&&<section className="mc-denied" role="alert">
   <span>RESTRICTED ACCESS</span><h2>The review desk is unavailable.</h2>
   <p>{queue.error.message}</p><p>Only staff authorized by the canonical member service can view this workspace. No decisions were made.</p>
   <button type="button" onClick={refresh}>RETRY SECURE CONNECTION</button>
  </section>}
  {data&&<div className="mc-layout">
   <aside className="mc-rail" aria-label="Moderator workspaces">
    <p className="mc-rail-label">OPERATIONS / V042</p>
    <nav aria-label="Moderation navigation">{lanes.map(item=><button key={item.key} type="button"
     className={'mc-nav '+(lane===item.key?'is-active':'')} aria-current={lane===item.key?'page':undefined}
     onClick={()=>setLane(item.key)}>
     <span>{item.index}</span><strong>{item.name}</strong>
     {item.key==='threads'||item.key==='replies'||item.key==='reports'
      ?<small>{count(item.key)}</small>:null}
    </button>)}</nav>
    <div className="mc-rail-foot"><span className="mc-live-dot" aria-hidden="true"/>
     <strong>CANONICAL REVIEW</strong><p>Verified staff access. Decisions are enforced and logged by the server.</p>
    </div>
   </aside>

   <div className="mc-work">
    <div className="mc-summary"><div><span className="mc-eyebrow">CURRENT WORKLOAD / REAL RECORDS</span>
     <h2>{total===0?'Clear signal.':total+' awaiting review.'}</h2>
     <p>{oldest?'Oldest unresolved item · '+displayTime(oldest):'No outstanding threads, replies, or member reports.'}</p>
    </div><button type="button" className="mc-refresh" onClick={refresh} disabled={busy}>↻ REFRESH QUEUE</button></div>
    <div className="mc-metrics" aria-label="Live moderation queue counts">
     <button type="button" onClick={()=>setLane('threads')}><span>01 / THREADS</span><strong>{count('threads')}</strong><small>AWAITING PUBLICATION</small></button>
     <button type="button" onClick={()=>setLane('replies')}><span>02 / REPLIES</span><strong>{count('replies')}</strong><small>AWAITING REVIEW</small></button>
     <button type="button" onClick={()=>setLane('reports')}><span>03 / REPORTS</span><strong>{count('reports')}</strong><small>UNRESOLVED SIGNALS</small></button>
    </div>

    <div className="mc-toolbar">
     <div><span className="mc-eyebrow">INSTITUTE RECORDS</span>
      <h2>{lanes.find(x=>x.key===lane)?.name}</h2></div>
     <label className="mc-search"><span>FILTER VISIBLE RECORDS</span>
      <input type="search" value={query} onChange={e=>setQuery(e.target.value)}
       placeholder="Topic, member, or content…" aria-label="Filter currently loaded moderation records"/></label>
    </div>

    {lane==='overview'&&<div className="mc-stack">
     <section aria-labelledby="mc-overview-reports"><div className="mc-section-title">
      <h3 id="mc-overview-reports">Member reports</h3><button type="button" onClick={()=>setLane('reports')}>OPEN QUEUE ↗</button></div>
      {visible.reports.length===0?<p className="mc-empty">No open reports in this review window.</p>:reportCards(visible.reports.slice(0,3))}
     </section>
     <section aria-labelledby="mc-overview-threads"><div className="mc-section-title">
      <h3 id="mc-overview-threads">Pending transmissions</h3><button type="button" onClick={()=>setLane('threads')}>OPEN QUEUE ↗</button></div>
      {visible.threads.length===0?<p className="mc-empty">No matching pending threads.</p>:threadCards(visible.threads.slice(0,3))}
     </section>
     <section aria-labelledby="mc-overview-replies"><div className="mc-section-title">
      <h3 id="mc-overview-replies">Pending replies</h3><button type="button" onClick={()=>setLane('replies')}>OPEN QUEUE ↗</button></div>
      {visible.replies.length===0?<p className="mc-empty">No matching pending replies.</p>:replyCards(visible.replies.slice(0,3))}
     </section>
    </div>}
    {lane==='threads'&&<section aria-labelledby="mc-threads-title"><h3 className="mc-section-heading" id="mc-threads-title">THREAD REVIEW / OLDEST FIRST</h3>
     {opening('threads',visible.threads.length)}{visible.threads.length===0?<p className="mc-empty">No matching pending threads.</p>:threadCards(visible.threads)}
    </section>}
    {lane==='replies'&&<section aria-labelledby="mc-replies-title"><h3 className="mc-section-heading" id="mc-replies-title">REPLY REVIEW / OLDEST FIRST</h3>
     {opening('replies',visible.replies.length)}{visible.replies.length===0?<p className="mc-empty">No matching pending replies.</p>:replyCards(visible.replies)}
    </section>}
    {lane==='reports'&&<section aria-labelledby="mc-reports-title"><h3 className="mc-section-heading" id="mc-reports-title">MEMBER REPORTS / SAFETY REASON FIRST</h3>
     {opening('reports',visible.reports.length)}{visible.reports.length===0?<p className="mc-empty">No matching member reports.</p>:reportCards(visible.reports)}
    </section>}
    {lane==='activity'&&<section aria-labelledby="mc-activity-title"><h3 className="mc-section-heading" id="mc-activity-title">STAFF DECISION RECORD / MOST RECENT FIRST</h3>
     <p className="mc-scope">Showing the latest {data.auditSize} audited decisions, not a complete historical export. Reporter identities and account IDs are never included.</p>
     {visible.recent.length===0?<p className="mc-empty">No matching audited decisions.</p>:auditCards(visible.recent)}
    </section>}
    <footer className="mc-disclosure">
     <span>REVIEW WINDOW / {data.pageSize} PER QUEUE</span>
     <p>Totals include all open records; lists are limited to the oldest {data.pageSize} entries in each category. Search filters only the loaded window. All approvals and removals require a separate server-authorized decision.</p>
     <p>Snapshot · {displayTime(data.checkedAt)}. Reports identify the reported content, not the person who filed the report. Nothing in this console awards XP.</p>
    </footer>
   </div>
  </div>}
  {choice&&<dialog ref={dialog} className="mc-dialog" aria-labelledby="mc-dialog-title"
    onCancel={event=>{if(busy)event.preventDefault();else setChoice(null)}}>
   <form method="dialog" onSubmit={event=>event.preventDefault()}>
    <span className="mc-eyebrow">DOCUMENTED STAFF ACTION / {uppercase(choice.kind)}</span>
    <h2 id="mc-dialog-title">{actions[choice.action].title}</h2>
    <p className="mc-target">{choice.summary}</p>
    <p>{actions[choice.action].detail}</p>
    {mutationError&&<p className="mc-form-error" role="alert">{mutationError}</p>}
    <div className="mc-dialog-controls">
     <button type="button" onClick={()=>setChoice(null)} disabled={busy} autoFocus>CANCEL</button>
     <button type="button" className={choice.action==='hide'||choice.action==='reject'?'mc-danger':'mc-approve'}
       disabled={busy} onClick={()=>void decide()}>{busy?'RECORDING…':actions[choice.action].button}</button>
    </div>
   </form>
  </dialog>}
 </section>;
}
export function ForumReviewPage(){
 const {data:session,isPending}=canonicalAuthClient.useSession();
 if(isPending)return <section className="cf-forums mc-auth" role="status">Verifying reviewer identity…</section>;
 if(!session?.user?.id)return <section className="cf-forums mc-auth"><h1>Member sign-in required.</h1>
  <p>This console requires an explicitly authorized, verified moderator account.</p><Link to="/join">SIGN IN TO ANEVUM</Link></section>;
 return <Workspace key={session.user.id} memberId={session.user.id}/>;
}

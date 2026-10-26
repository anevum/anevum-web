import {useEffect,useRef,useState,type FormEvent} from 'react';
import {Link,useParams} from 'react-router-dom';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {useResource} from '../lib/useResource';
import {useMemberRevalidation} from '../lib/useMemberRevalidation';
import {ForumAuthorCard as AuthorCard} from '../components/ForumAuthorCard';
import {browserRequestId} from '../lib/request-id';
import {forumRequest as request,FORUM_TOPICS as topics,FORUM_ID as UUID,ForumApiError,
 type ForumThread as Thread,type ForumReply as Reply,type MemberSubmission as MyThread,
 type ForumThreadPage,type ForumReplyPage} from '../lib/member-forums';
import './forums.css';
function date(seconds:number){return new Date(seconds*1000).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}
function MySubmissions({memberId}:{memberId:string}){
 const [revision,setRevision]=useState(0),[withdrawing,setWithdrawing]=useState<string|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const saved=useResource(signal=>request<{items:MyThread[]}>('/api/v1/member/forum-submissions','GET',undefined,signal),[memberId,revision]);
 async function withdraw(item:MyThread){
  if(withdrawing||!window.confirm(item.status==='published'?'Withdraw this published thread from public view?':'Withdraw this pending discussion from review?'))return;
  setWithdrawing(item.id);setError('');setNotice('');
  try{
   await request('/api/v1/member/forum-submissions/'+item.id,'DELETE');
   setRevision(x=>x+1);setNotice('Thread withdrawn from public view and the review queue.');
  }catch(e){setError(e instanceof Error?e.message:'The thread could not be withdrawn.');}
  finally{setWithdrawing(null)}
 }
 return <section className="cf-mine" aria-labelledby="cf-my-title">
  <div className="cf-mine-head"><h3 id="cf-my-title">YOUR TRANSMISSIONS</h3><button type="button" disabled={saved.state==='loading'} onClick={()=>setRevision(v=>v+1)}>REFRESH</button></div>
  <p>Submissions are private until approved. Your account sees the review status of its own threads.</p>
  {error&&<p className="cf-error" role="alert">{error}</p>}
  {notice&&<p className="cf-notice" role="status">{notice}</p>}
  {saved.state==='loading'&&<p role="status">Checking your submissions…</p>}
  {saved.state==='error'&&<p role="status">Your private submission history could not be verified.</p>}
  {saved.state==='ready'&&<div className="cf-mine-list">{saved.data.items.length===0&&<p>No threads submitted yet.</p>}
   {saved.data.items.map(item=><article key={item.id}><span className="cf-mine-status" data-state={item.status}>{item.status==='pending_review'?'AWAITING REVIEW':item.status==='published'?'PUBLISHED':item.status==='rejected'?'NOT APPROVED':'HIDDEN'}</span>
    <h4>{item.status==='published'?<Link to={'/community/threads/'+item.id}>{item.title}</Link>:item.title}</h4>
    <small>{item.topic.toUpperCase()} / {date(item.created_at)}</small>
    {(item.status==='pending_review'||item.status==='published')&&
     <button className="cf-withdraw" type="button" disabled={Boolean(withdrawing)}
      onClick={()=>void withdraw(item)}>{withdrawing===item.id?'WITHDRAWING…':'WITHDRAW THREAD'}</button>}
   </article>)}</div>}
 </section>;
}
export function CommunityForums(){
 const {data:session}=canonicalAuthClient.useSession();
 const identityRevision=useMemberRevalidation();
 const [topic,setTopic]=useState('all'),[revision,setRevision]=useState(0),[compose,setCompose]=useState(false);
 const [title,setTitle]=useState(''),[body,setBody]=useState(''),[draftTopic,setDraftTopic]=useState('community'),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
 const threads=useResource(signal=>request<ForumThreadPage>('/api/v1/community/threads'+(topic==='all'?'':'?topic='+topic),'GET',undefined,signal),[topic,revision,identityRevision]);
 const [requestId,setRequestId]=useState(()=>browserRequestId());
 const streamKey=topic+'|'+revision+'|'+identityRevision;
 const activeStream=useRef(streamKey);activeStream.current=streamKey;
 const [extra,setExtra]=useState<{key:string;items:Thread[];nextCursor:string|null}>({key:'',items:[],nextCursor:null});
 const [morePending,setMorePending]=useState(false),[moreFailure,setMoreFailure]=useState('');
 const additional=extra.key===streamKey?extra.items:[];
 const listed=threads.state==='ready'?[...threads.data.items,...additional]:[];
 const nextCursor=extra.key===streamKey?extra.nextCursor:threads.state==='ready'?threads.data.nextCursor:null;
 async function loadMore(){
  if(!nextCursor||morePending||threads.state!=='ready')return;
  const key=streamKey;setMorePending(true);setMoreFailure('');
  const params=new URLSearchParams({after:nextCursor});if(topic!=='all')params.set('topic',topic);
  try{
   const next=await request<ForumThreadPage>('/api/v1/community/threads?'+params.toString());
   if(activeStream.current!==key)return;
   setExtra(prev=>{
    const carried=prev.key===key?prev.items:[];
    const known=new Set([...threads.data.items,...carried].map(entry=>entry.id));
    return {key,items:[...carried,...next.items.filter(entry=>!known.has(entry.id))],nextCursor:next.nextCursor};
   });
  }catch(error){if(activeStream.current===key)setMoreFailure(error instanceof Error?error.message:'More threads could not be loaded');}
  finally{setMorePending(false)}
 }
 async function submit(e:FormEvent){e.preventDefault();if(busy)return;setBusy(true);setError('');try{
  await request('/api/v1/community/threads','POST',{topic:draftTopic,title,body,requestId});
  setTitle('');setBody('');setDraftTopic('community');setRequestId(browserRequestId());setCompose(false);
  setNotice('Your thread is saved for staff review. It will appear publicly only when approved.');setRevision(x=>x+1);
 }catch(e){setError(e instanceof Error?e.message:'Nothing was saved')}finally{setBusy(false)}}
 if(threads.state==='error'&&threads.error instanceof ForumApiError&&threads.error.status===404)return null;
 return <section className="cf-forums" aria-labelledby="cf-title"><header className="cf-header"><div><span className="cf-kicker">CONTINUANCE INSTITUTE / PUBLIC COMMONS</span><h2 id="cf-title">The conversation <em>continues.</em></h2><p>Questions, ideas, feedback and creative work, organized by the people behind them.</p></div>
 <button type="button" className="cf-primary" disabled={threads.state!=='ready'} onClick={()=>{setCompose(x=>!x);setError('')}}>{compose?'CLOSE COMPOSER':'START A THREAD'}</button></header>
 <nav className="cf-topics" aria-label="Discussion topic filters">{topics.map(([id,label])=><button type="button" key={id} aria-pressed={topic===id} onClick={()=>setTopic(id)}>{label}</button>)}</nav>
 {compose&&(session?.user?<form className="cf-compose" onSubmit={e=>void submit(e)}><h3>TRANSMIT A NEW DISCUSSION</h3><p>Public profile required. Your submission enters a review queue before publication.</p>
 <label>CHANNEL<select value={draftTopic} onChange={e=>setDraftTopic(e.target.value)}>{topics.slice(1).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
 <label>TITLE<input minLength={8} maxLength={120} required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Give your discussion a clear title"/></label>
 <label>MESSAGE<textarea minLength={20} maxLength={5000} required rows={6} value={body} onChange={e=>setBody(e.target.value)} placeholder="Share a question, an idea, or useful feedback…"/></label>
 <button className="cf-primary" disabled={busy||title.trim().length<8||body.trim().length<20}>{busy?'SUBMITTING…':'SUBMIT FOR REVIEW'}</button></form>:
 <div className="cf-compose"><p>Join or sign in to create a thread with your own member identity.</p><Link to="/join">OPEN MEMBER ACCESS ↗</Link></div>)}
 {notice&&<p role="status" className="cf-notice">{notice}</p>}{error&&<p role="alert" className="cf-error">{error}</p>}
 {threads.state==='loading'&&<p role="status" className="cf-note">Reading approved public conversations…</p>}
 {threads.state==='error'&&<div className="cf-note" role="status"><p>The next-generation member forum is not enabled in this environment yet. Existing community spaces remain accessible below.</p><button type="button" onClick={()=>setRevision(x=>x+1)}>RECHECK AVAILABILITY</button></div>}
 {threads.state==='ready'&&<div className="cf-list">{listed.length===0&&<p className="cf-note">No approved threads in this channel yet. Be the first to start a conversation.</p>}
 {listed.map(t=><article className="cf-thread" key={t.id}><div className="cf-thread-meta"><span>{topics.find(x=>x[0]===t.topic)?.[1]}</span><time>{date(t.publishedAt)}</time></div><h3><Link to={'/community/threads/'+t.id}>{t.title}</Link></h3><p>{t.body.length>320?t.body.slice(0,317)+'…':t.body}</p><div className="cf-thread-foot"><AuthorCard author={t.author}/><Link to={'/community/threads/'+t.id} className="cf-count">{t.replyCount} REPLIES · {t.reactions} REACTIONS ↗</Link></div></article>)}
 {nextCursor&&<button type="button" className="cf-more" disabled={morePending} onClick={()=>void loadMore()}>{morePending?'READING MORE…':'LOAD MORE DISCUSSIONS'}</button>}
 {moreFailure&&<p role="alert" className="cf-error">{moreFailure}</p>}</div>}
 {session?.user?.id&&threads.state==='ready'&&<MySubmissions key={session.user.id} memberId={session.user.id}/>}
 <p className="cf-disclosure">Only approved public threads and members appear here. Posting and replying do not automatically award XP.</p></section>;
}
export function CommunityThread(){
 const {id=''}=useParams();
 const identityRevision=useMemberRevalidation();
 const {data:session}=canonicalAuthClient.useSession();
 const memberId=session?.user?.id??null;
 const [revision,setRevision]=useState(0),[body,setBody]=useState('');
 const [requestId,setRequestId]=useState(()=>browserRequestId());
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const [likedOverride,setLikedOverride]=useState<boolean|null>(null);
 const [reportTarget,setReportTarget]=useState<{kind:'thread'|'reply';id:string}|null>(null);
 const [reportReason,setReportReason]=useState<'spam'|'harassment'|'unsafe'|'other'>('spam');
 useEffect(()=>{setLikedOverride(null);setReportTarget(null);setNotice('')},[id,memberId]);
 const valid=UUID.test(id);
 const thread=useResource(signal=>valid?request<{thread:Thread}>('/api/v1/community/threads/'+id,'GET',undefined,signal):Promise.reject(Error('Invalid thread')),[id,revision,identityRevision]);
 const replies=useResource(signal=>valid?request<ForumReplyPage>('/api/v1/community/threads/'+id+'/replies','GET',undefined,signal):Promise.reject(Error('Invalid thread')),[id,revision,identityRevision]);
 const replyKey=id+'|'+revision+'|'+identityRevision;
 const activeReplyKey=useRef(replyKey);activeReplyKey.current=replyKey;
 const [extraReplies,setExtraReplies]=useState<{key:string;items:Reply[];nextCursor:string|null}>({key:'',items:[],nextCursor:null});
 const [moreReplyPending,setMoreReplyPending]=useState(false),[moreReplyError,setMoreReplyError]=useState('');
 const shownReplies=replies.state==='ready'?[...replies.data.items,...(extraReplies.key===replyKey?extraReplies.items:[])]:[];
 const nextReplyCursor=extraReplies.key===replyKey?extraReplies.nextCursor:replies.state==='ready'?replies.data.nextCursor:null;
 async function loadMoreReplies(){
  if(!nextReplyCursor||moreReplyPending||replies.state!=='ready')return;
  const key=replyKey;
  setMoreReplyPending(true);setMoreReplyError('');
  try{
   const more=await request<ForumReplyPage>('/api/v1/community/threads/'+id+'/replies?after='+encodeURIComponent(nextReplyCursor));
   if(activeReplyKey.current!==key)return;
   setExtraReplies(prev=>{
    const carried=prev.key===key?prev.items:[];
    const seen=new Set([...replies.data.items,...carried].map(x=>x.id));
    return {key,items:[...carried,...more.items.filter(x=>!seen.has(x.id))],nextCursor:more.nextCursor};
   });
  }catch(e){if(activeReplyKey.current===key)setMoreReplyError(e instanceof Error?e.message:'More replies could not be loaded.');}
  finally{setMoreReplyPending(false)}
 }
 const reaction=useResource(signal=>memberId&&valid?request<{reacted:boolean}>('/api/v1/community/threads/'+id+'/reaction','GET',undefined,signal):Promise.resolve({reacted:false}),[id,memberId,revision]);
 const liked=likedOverride??(reaction.state==='ready'&&reaction.data.reacted);
 async function action(method:string,path:string,payload?:unknown){
  if(busy)return false;
  setBusy(true);setNotice('');
  try{await request(path,method,payload);setRevision(x=>x+1);return true}
  catch(e){setNotice(e instanceof Error?e.message:'Action unavailable');return false}
  finally{setBusy(false)}
 }
 async function submitReply(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(body.trim().length<10)return;
  if(await action('POST','/api/v1/community/threads/'+id+'/replies',{body,requestId})){
   setBody('');setRequestId(browserRequestId());
   setNotice('Your reply was received for independent review. It is not public yet.');
  }
 }
 async function submitReport(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!reportTarget)return;
  if(await action('POST','/api/v1/community/reports',{targetKind:reportTarget.kind,targetId:reportTarget.id,reason:reportReason})){
   setReportTarget(null);
   setNotice('Report recorded for a moderator to review.');
  }
 }
 async function toggleReaction(){
  if(await action(liked?'DELETE':'POST','/api/v1/community/threads/'+id+'/reaction'))setLikedOverride(!liked);
 }
 return <section className="cf-forums cf-detail">
  <Link to="/community">← RETURN TO COMMUNITY</Link>
  {thread.state==='loading'&&<p role="status">Opening discussion…</p>}
  {thread.state==='error'&&<p role="alert">This thread is unavailable or not approved for public viewing.</p>}
  {thread.state==='ready'&&<>
   <header className="cf-header"><div>
    <span className="cf-kicker">COMMUNITY / {thread.data.thread.topic.toUpperCase()} / APPROVED</span>
    <h1>{thread.data.thread.title}</h1>
    <AuthorCard author={thread.data.thread.author}/>
   </div></header>
   <article className="cf-thread">
    <p className="cf-fullbody">{thread.data.thread.body}</p>
    <div className="cf-thread-foot"><span>{thread.data.thread.reactions} REACTIONS · {thread.data.thread.replyCount} APPROVED REPLIES</span>
     {memberId&&<>
      <button type="button" aria-pressed={liked} disabled={busy||reaction.state==='loading'||reaction.state==='error'} onClick={()=>void toggleReaction()}>{liked?'REMOVE REACTION':'APPRECIATE'}</button>
      <button type="button" disabled={busy} onClick={()=>setReportTarget({kind:'thread',id})}>REPORT THREAD</button>
     </>}
    </div>
   </article>
   <h2>THE CONVERSATION</h2>
   {replies.state==='loading'&&<p role="status">Reading reviewed replies…</p>}
   {replies.state==='error'&&<p role="status">Approved replies are temporarily unavailable.</p>}
   {replies.state==='ready'&&(shownReplies.length?shownReplies.map(reply=>
    <article className="cf-thread" key={reply.id}>
     <AuthorCard author={reply.author}/>
     <p className="cf-fullbody">{reply.body}</p>
     <div className="cf-thread-foot"><time>{date(reply.publishedAt)}</time>
      {memberId&&<button type="button" disabled={busy} onClick={()=>setReportTarget({kind:'reply',id:reply.id})}>REPORT REPLY</button>}
     </div>
    </article>):<p className="cf-note">No approved replies yet.</p>)}
   {nextReplyCursor&&<button type="button" className="cf-more" disabled={moreReplyPending} onClick={()=>void loadMoreReplies()}>{moreReplyPending?'READING MORE REPLIES…':'LOAD MORE REPLIES'}</button>}
   {moreReplyError&&<p className="cf-error" role="alert">{moreReplyError}</p>}
   {memberId?<form className="cf-compose" onSubmit={e=>void submitReply(e)}>
    <h3>ADD YOUR PERSPECTIVE</h3>
    <label>YOUR REPLY<textarea minLength={10} maxLength={2000} rows={5} required value={body} disabled={busy} onChange={e=>setBody(e.target.value)} placeholder="Give constructive feedback or ask a thoughtful question…"/></label>
    <p>Replies enter a review queue and appear only after approval.</p>
    <button className="cf-primary" disabled={busy||body.trim().length<10}>{busy?'SENDING…':'SUBMIT REPLY FOR REVIEW'}</button>
   </form>:<p className="cf-note"><Link to="/join">Sign in</Link> to join the conversation.</p>}
   {memberId&&reportTarget&&<form className="cf-report" onSubmit={e=>void submitReport(e)}>
    <h3>REPORT {reportTarget.kind.toUpperCase()}</h3>
    <p>Reports are private to the moderation team. Please choose the most accurate reason.</p>
    <label htmlFor="cf-report-reason">REASON</label>
    <select id="cf-report-reason" value={reportReason} disabled={busy} onChange={e=>setReportReason(e.target.value as typeof reportReason)}>
     <option value="spam">Spam or manipulation</option>
     <option value="harassment">Harassment or abuse</option>
     <option value="unsafe">Unsafe content</option>
     <option value="other">Other rule violation</option>
    </select>
    <div className="cf-report-actions">
     <button type="submit" disabled={busy}>SUBMIT REPORT</button>
     <button type="button" disabled={busy} onClick={()=>setReportTarget(null)}>CANCEL</button>
    </div>
   </form>}
   {notice&&<p role="status" className="cf-notice">{notice}</p>}
  </>}
 </section>;
}

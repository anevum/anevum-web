import {type FormEvent,useState} from "react";
import {Link,useParams,useSearchParams} from "react-router-dom";
import {useResource} from "../lib/useResource";
import {memberMe,memberCreatorProfile,MemberApiError,type MemberIdentity} from "../lib/member-api";
import {
  FORUM_ROOMS,isForumRoom,readForumRoom,readForumThread,startForumThread,replyToForumThread,
  reportForumPost,forumMemberPath,type ForumRoomId,type ForumPost,ForumAuthor
} from "../lib/forum-api";
import {ForumAuthorCard,ForumPostCard} from "../components/ForumProfileCard";
import {PortalHeading} from "../components/PortalHeading";
import {OrbitalMark} from "../components/OrbitalMark";
import {LoadingState,ErrorState} from "../components/States";
import {Icon} from "../components/Icons";

function useOptionalMember(){
 return useResource(async signal=>{
  try{return (await memberMe(signal)).member;}
  catch(e){if(e instanceof MemberApiError&&e.status===401)return null;throw e;}
 },[]);
}
function MemberPostingNotice({account}:{account:ReturnType<typeof useOptionalMember>}) {
 if(account.state==="loading")return <p className="forum-small-note">Checking invited member access…</p>;
 if(account.state==="error")return <p className="forum-small-note">Member sign-in is not available here. Public reading does not require an account.</p>;
 if(!account.data)return <p className="forum-small-note">Writing is currently limited to invited members with a verified profile. <a href="/api/v1/member/join">Invited member sign-in ↗</a></p>;
 if(!account.data.handle)return <p className="forum-small-note">Set up your public identity to write. <Link to="/account/edit">Complete profile ↗</Link></p>;
 return <p className="forum-small-note">Posting as <strong>@{account.data.handle}</strong>. New messages require staff approval and do not award XP.</p>;
}
const sent=(v:number)=>new Date(v*1000).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});
export function ForumRoomPage(){
 const {roomId=""}=useParams();
 const [params,setParams]=useSearchParams();
 const cursor=params.get("cursor")||"";
 const room=FORUM_ROOMS.find(entry=>entry.id===roomId);
 const data=useResource(signal=>readForumRoom(roomId,cursor,signal),[roomId,cursor]);
 const account=useOptionalMember();
 const [title,setTitle]=useState("");
 const [body,setBody]=useState("");
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState("");
 const [failed,setFailed]=useState(false);
 if(!room||!isForumRoom(roomId))return <ErrorState title="ROOM NOT FOUND" detail="This room does not exist in the moderated community."/>;

 async function submit(event:FormEvent){
  event.preventDefault();if(busy||!account.data?.handle)return;
  setBusy(true);setFeedback("");setFailed(false);
  try{
   const result=await startForumThread(roomId as ForumRoomId,title,body);
   if(result.status!=="pending")throw Error("Discussion was not confirmed");
   setTitle("");setBody("");setFeedback(result.notice);
  }catch{setFailed(true);setFeedback("The message has not been confirmed. Check your account and the community service before retrying.");}
  finally{setBusy(false);}
 }
 return <div className="forum-page">
  <Link className="project-return" to="/community">← ALL COMMUNITY ROOMS</Link>
  <PortalHeading eyebrow="ANEVUM / COMMUNITY TRANSMISSIONS" title={room.name==="The Arcade"?"THE":room.name==="The Workshop"?"THE":room.name==="The Lab"?"THE":"THE"} accent={room.name.slice(4).toUpperCase()+"."} description={room.subject+". Human-reviewed conversations and original creator identities."} index="FORUM / ROOM"/>
  <div className="forum-layout">
    <section className="forum-main">
      <div className="forum-section-title"><div><span className="kicker">ROOM TRANSMISSIONS / VERIFIED PUBLIC MESSAGES</span><h2>DISCUSSIONS</h2></div><span className="forum-section-tag">STAFF-MODERATED</span></div>
      {data.state==="loading"&&<LoadingState label="Loading approved community discussions"/>}
      {data.state==="error"&&<div className="forum-closed" role="status"><OrbitalMark/><h3>THE MESSAGE BOARDS ARE STILL IN PREPARATION.</h3><p>No conversation is being simulated. The invited community service and moderation pipeline need staging approval before the first public thread appears.</p><Link className="button secondary" to="/community">BACK TO THE COMMONS</Link></div>}
      {data.state==="ready"&&<>{data.data.items.length?
       <div className="forum-thread-list">{data.data.items.map(t=><Link className="forum-topic" to={"/community/thread/"+t.id} key={t.id}>
        <div className="forum-topic-avatar" aria-hidden="true"><OrbitalMark/></div>
        <div className="forum-topic-copy"><strong>{t.title}</strong><span>STARTED BY <b>@{t.author.handle}</b> · {sent(t.createdAt)}</span></div>
        <div className="forum-topic-stats"><span>{t.postCount} {t.postCount===1?"POST":"POSTS"}</span><span className="forum-topic-arrow"><Icon name="arrow" size={19}/></span></div>
       </Link>)}</div>:
       <div className="forum-closed forum-closed-empty"><OrbitalMark/><h3>NO APPROVED THREADS YET.</h3><p>This room is ready to display real conversations. Submitted messages appear only after human moderation.</p></div>}
       {data.data.nextCursor&&<Link className="button secondary forum-next" to={"/community/room/"+roomId+"?cursor="+data.data.nextCursor}>OLDER DISCUSSIONS <Icon name="arrow" size={16}/></Link>}
       {cursor&&<Link className="button secondary forum-next" to={"/community/room/"+roomId}>BACK TO FIRST PAGE</Link>}
       </>}
      <section className="forum-composer">
        <div className="forum-section-title"><div><span className="kicker">NEW TOPIC / 01</span><h2>START A CONVERSATION.</h2></div></div>
        <MemberPostingNotice account={account}/>
        {account.state==="ready"&&account.data?.handle?<form onSubmit={submit}>
          <label htmlFor="forum-topic-title">Discussion title</label>
          <input id="forum-topic-title" value={title} onChange={event=>setTitle(event.target.value)} minLength={5} maxLength={110} required placeholder="What do you want to talk about?" disabled={busy}/>
          <label htmlFor="forum-topic-message">Your first message</label>
          <textarea id="forum-topic-message" value={body} onChange={event=>setBody(event.target.value)} minLength={2} maxLength={2400} rows={5} required placeholder="Start something useful. Questions, feedback, help and introductions are welcome." disabled={busy}/>
          <div className="forum-compose-footer"><small>TEXT ONLY · MAX 2,400 CHARACTERS · NO AUTO-PUBLISHING</small><button type="submit" className="button primary" disabled={busy}>{busy?"SUBMITTING…":"SUBMIT FOR REVIEW"}</button></div>
        </form>:null}
        {feedback&&<p className={"forum-feedback"+(failed?" forum-feedback-error":"")} role={failed?"alert":"status"}>{feedback}</p>}
      </section>
    </section>
    <aside className="forum-sidebar">
      <section className="forum-side-panel"><span className="kicker">ROOM 0{FORUM_ROOMS.findIndex(x=>x.id===roomId)+1} / COMMUNITY</span><h2>{room.name.toUpperCase()}</h2><p>{room.subject}. There are no imaginary members, inflated posts or purchased badges here.</p><div className="forum-rooms-nav">{FORUM_ROOMS.map(r=><Link className={roomId===r.id?"active":""} key={r.id} to={"/community/room/"+r.id}>{r.name}<span aria-hidden="true">↗</span></Link>)}</div></section>
      <section className="forum-side-panel"><span className="kicker">THE COMMUNITY STANDARD</span><h2>MAKE IT WORTH READING.</h2><p>Be kind, give useful details, respect privacy and credit creators. Report harmful content rather than engaging with it. Staff can hide messages; levels and badges never grant moderation powers.</p><Link className="forum-side-link" to="/levels">EARNED RECOGNITION ↗</Link></section>
    </aside>
  </div>
 </div>;
}
const reportReasons=[
 ["spam","Spam or advertising"],["harassment","Harassment or bullying"],["unsafe","Unsafe or personal information"],["copyright","Rights or attribution issue"],["other","Other concern"]
] as const;
function PostReport({post,member}:{post:ForumPost;member:MemberIdentity|null}) {
 const [expanded,setExpanded]=useState(false);
 const [reason,setReason]=useState<(typeof reportReasons)[number][0]>("spam");
 const [details,setDetails]=useState("");
 const [busy,setBusy]=useState(false);
 const [done,setDone]=useState(false);
 const [error,setError]=useState("");
 if(!member?.handle||member.handle===post.author.handle)return null;
 async function submit(event:FormEvent){
  event.preventDefault();if(busy||done)return;
  setBusy(true);setError("");
  try{
   const result=await reportForumPost(post.id,reason,details);
   if(!result.recorded)throw Error("Report not recorded");
   setDone(true);setExpanded(false);
  }catch{setError("Could not confirm your report. Please retry later.");}
  finally{setBusy(false);}
 }
 return done?<span className="forum-report-confirmed" role="status">REPORT SENT FOR REVIEW</span>:
  <div className="forum-report">
    <button type="button" className="forum-report-trigger" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>REPORT MESSAGE</button>
    {expanded&&<form onSubmit={submit}>
      <label htmlFor={"reason-"+post.id}>Why does this message need review?</label>
      <select id={"reason-"+post.id} value={reason} onChange={event=>setReason(event.target.value as typeof reason)} disabled={busy}>{reportReasons.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
      <label htmlFor={"details-"+post.id}>Context (optional)</label>
      <textarea id={"details-"+post.id} maxLength={500} rows={2} value={details} onChange={event=>setDetails(event.target.value)} disabled={busy}/>
      <button type="submit" className="button secondary" disabled={busy}>{busy?"SUBMITTING…":"SEND PRIVATE REPORT"}</button>
      {error&&<span role="alert">{error}</span>}
    </form>}
  </div>;
}
export function ForumThreadPage(){
 const {threadId=""}=useParams();
 const [params]=useSearchParams();
 const cursor=params.get("cursor")||"";
 const data=useResource(signal=>readForumThread(threadId,cursor,signal),[threadId,cursor]);
 const account=useOptionalMember();
 const [body,setBody]=useState("");
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState("");
 const [failed,setFailed]=useState(false);
 async function submit(event:FormEvent){
  event.preventDefault();if(busy||!account.data?.handle)return;
  setBusy(true);setFeedback("");setFailed(false);
  try{
   const r=await replyToForumThread(threadId,body);
   if(r.status!=="pending")throw Error("No saved reply");
   setBody("");setFeedback(r.notice);
  }catch{setFailed(true);setFeedback("Your reply has not been confirmed. Retry after checking your session.");}
  finally{setBusy(false);}
 }
 return <div className="forum-page">
  <Link className="project-return" to="/community">← COMMUNITY ROOMS</Link>
  {data.state==="loading"&&<LoadingState label="Loading approved discussion messages"/>}
  {data.state==="error"&&<ErrorState title="DISCUSSION NOT AVAILABLE" detail="The topic is not publicly approved, has been hidden or the community service is not open yet."/>}
  {data.state==="ready"&&<>
    <header className="forum-topic-header"><Link className="forum-back-link" to={"/community/room/"+data.data.thread.room}>← BACK TO {data.data.thread.room.toUpperCase()}</Link><span className="kicker">COMMUNITY / REAL CONVERSATIONS</span><h1>{data.data.thread.title}</h1><p>Public messages are human-reviewed. Account achievements are verified, not purchased.</p></header>
    <div className="forum-layout">
      <section className="forum-main">
        <div className="forum-section-title"><div><span className="kicker">DISPATCH ARCHIVE</span><h2>MESSAGES</h2></div><span className="forum-section-tag">{data.data.posts.length} ON THIS PAGE</span></div>
        <div className="forum-post-list">{data.data.posts.map(post=><ForumPostCard key={post.id} post={post}><PostReport post={post} member={account.state==="ready"?account.data:null}/></ForumPostCard>)}</div>
        {data.data.nextCursor&&<Link className="button secondary forum-next" to={"/community/thread/"+threadId+"?cursor="+data.data.nextCursor}>MORE APPROVED MESSAGES <Icon name="arrow" size={16}/></Link>}
        {cursor&&<Link className="button secondary forum-next" to={"/community/thread/"+threadId}>FIRST PAGE</Link>}
        <section className="forum-composer" id="reply">
          <div className="forum-section-title"><div><span className="kicker">RESPOND / 02</span><h2>ADD TO THE CONVERSATION.</h2></div></div>
          <MemberPostingNotice account={account}/>
          {account.state==="ready"&&account.data?.handle?<form onSubmit={submit}>
            <label htmlFor="forum-reply-message">Your message</label>
            <textarea id="forum-reply-message" value={body} onChange={event=>setBody(event.target.value)} minLength={2} maxLength={2400} rows={5} required disabled={busy} placeholder="Be specific, helpful and respectful. Reply only with what you're happy to have reviewed."/>
            <div className="forum-compose-footer"><small>NEW REPLIES REQUIRE HUMAN REVIEW</small><button type="submit" className="button primary" disabled={busy}>{busy?"SUBMITTING…":"SUBMIT REPLY"}</button></div>
          </form>:null}
          {feedback&&<p role={failed?"alert":"status"} className={"forum-feedback"+(failed?" forum-feedback-error":"")}>{feedback}</p>}
        </section>
      </section>
      <aside className="forum-sidebar">
        {data.data.thread.author&&<section className="forum-side-panel"><span className="kicker">ORIGINAL THREAD CREATOR</span><ForumAuthorCard author={data.data.thread.author} large/></section>}
        <section className="forum-side-panel"><span className="kicker">SAFE CONVERSATIONS</span><h2>PEOPLE FIRST.</h2><p>Posts can be reported and reviewed. Staff moderation determines publication independently of XP, badges and levels.</p><Link className="forum-side-link" to="/community">ALL ROOMS ↗</Link></section>
      </aside>
    </div>
  </>}
 </div>;
}
export function ForumMemberPage(){
 const {handle=""}=useParams();
 const details=useResource(signal=>memberCreatorProfile(handle,signal),[handle]);
 if(details.state==="loading")return <LoadingState label="Loading verified public member identity"/>;
 if(details.state==="error")return <ErrorState title="MEMBER PROFILE UNAVAILABLE" detail="This profile is not currently public or the member service is unavailable. No account details have been inferred."/>;
 const d=details.data;
 const author:ForumAuthor={handle:d.creator.handle,displayName:d.creator.displayName,level:d.progression.level,artifact:d.progression.artifact,
  badges:d.achievements.filter(a=>a.earned).map(a=>({key:a.key,name:a.name,symbol:a.symbol}))};
 return <div className="forum-page forum-member-page">
  <Link className="project-return" to="/community">← BACK TO THE COMMONS</Link>
  <PortalHeading eyebrow="ANEVUM / COMMUNITY IDENTITY" title="MEET THE" accent="MEMBER." description="A real independent creator in the community. Level and earned recognition come from verified account evidence only." index="MEMBER / PROFILE"/>
  <div className="forum-member-layout">
    <ForumAuthorCard author={author} large/>
    <section className="forum-member-story"><span className="kicker">PUBLIC CHANNEL / MEMBER BIO</span><h2>{d.creator.displayName}</h2><p className="forum-member-handle">@{d.creator.handle}</p><p>{d.creator.bio||"This member has not added a public biography."}</p>
      <div className="forum-member-stats"><span><strong>{d.contributions.publishedProjects}</strong> PUBLISHED CREATIONS</span><span><strong>{d.contributions.ratings}</strong> VERIFIED RATINGS</span><span><strong>{author.badges.length}</strong> EARNED BADGES</span></div>
      <p className="forum-member-disclosure">No follower count, private email, direct-message access, artificial reputation, or unpaid promotional rank is shown.</p>
      <Link className="button secondary" to="/community">RETURN TO THE COMMONS</Link>
    </section>
  </div>
 </div>;
}

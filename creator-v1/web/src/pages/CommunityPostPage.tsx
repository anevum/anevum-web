import {useParams,Link} from "react-router-dom";
import {useState,type FormEvent} from "react";
import {readCommunityPost} from "../lib/api";
import {memberPostReaction,memberReactPost,memberCreateReply,memberMyReplies,MemberApiError} from "../lib/member-api";
import {useResource} from "../lib/useResource";
import {LoadingState,ErrorState} from "../components/States";
import "./community-discussions.css";

function when(value:string){
 const time=Date.parse(value);
 return Number.isFinite(time)?new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(time):"DATE NOT LISTED";
}
const validPostId=(value:string)=>/^[a-f0-9]{32}$/.test(value);

/** Public published-only discussion. Never renders unapproved text or arbitrary HTML. */
export function CommunityPostPage(){
 const {id=""}=useParams();
 const isValid=validPostId(id);
 const post=useResource(signal=>isValid?readCommunityPost(id,signal):Promise.reject(new Error("invalid-id")),[id,isValid]);
 const reaction=useResource(async signal=>{
   if(!isValid)return {myReaction:null,available:false};
   try{
     const data=await memberPostReaction(id,signal);
     return {...data,available:true};
   }catch{return {myReaction:null,available:false};}
 },[id,isValid]);
 const [local,setLocal]=useState<{score:0|1;revision:number}|null>(null);
 const [replyText,setReplyText]=useState("");
 const [replyPending,setReplyPending]=useState(false);
 const [replyNotice,setReplyNotice]=useState("");
 const [replyVersion,setReplyVersion]=useState(0);
 const ownReplies=useResource(async signal=>{
   if(!isValid)return {items:[],available:false};
   try{
     const data=await memberMyReplies(id,signal);
     return {...data,available:true};
   }catch{return {items:[],available:false};}
 },[id,isValid,replyVersion]);
 async function submitReply(event:FormEvent<HTMLFormElement>){
   event.preventDefault();
   if(replyPending||replyText.trim().length<10)return;
   setReplyPending(true);setReplyNotice("");
   try{
     const created=await memberCreateReply(id,replyText);
     if(created.status!=="pending_review")throw new Error("Unexpected review state");
     setReplyText("");
     setReplyNotice("Reply submitted privately for review. It will not appear publicly until approved.");
     setReplyVersion(current=>current+1);
   }catch(error){
     setReplyNotice(error instanceof MemberApiError?error.message:"Reply could not be submitted. Nothing was published.");
   }finally{setReplyPending(false);}
 }
 const [working,setWorking]=useState(false);
 const [message,setMessage]=useState("");
 async function rate(score:0|1){
   if(working)return;
   setWorking(true);setMessage("");
   try{
     const existing=local||(reaction.state==="ready"?reaction.data.myReaction:null);
     const result=await memberReactPost(id,score,existing?.revision||0);
     setLocal({score,revision:result.revision});
     setMessage(result.changed?"Your reaction was saved.":"Your reaction is unchanged.");
   }catch(error){
     setMessage(error instanceof MemberApiError?error.message:"Reaction could not be saved.");
   }finally{setWorking(false);}
 }
 if(!isValid)return <div className="discussion-page"><ErrorState title="DISCUSSION NOT FOUND" detail="The discussion reference is invalid."/></div>;
 if(post.state==="loading")return <div className="discussion-page"><LoadingState label="Reading moderated public conversation"/></div>;
 if(post.state==="error")return <div className="discussion-page"><ErrorState title="DISCUSSION UNAVAILABLE" detail="This post may have been withdrawn, hidden, or is not publicly approved."/><Link to="/atlas/community">RETURN TO COMMUNITY ↗</Link></div>;
 const {post:item,replies}=post.data;
 const myReaction=local||(reaction.state==="ready"?reaction.data.myReaction:null);
 return <article className="discussion-page">
   <nav aria-label="Discussion breadcrumb" className="discussion-crumb"><Link to="/atlas">NETWORK</Link><span>/</span><Link to="/atlas/community">COMMUNITY</Link><span>/</span><span>DISCUSSION</span></nav>
   <header className="discussion-article-head"><span className="nfc-eyebrow">PUBLIC / APPROVED DISCUSSION · {item.topic.toUpperCase()}</span>
      <h1>{item.title}</h1>
      <div className="discussion-identity">
        <span className="discussion-avatar">{item.authorName.charAt(0).toUpperCase()}</span>
        <div><Link to={"/atlas/creators/"+encodeURIComponent(item.authorHandle)}>{item.authorName} / @{item.authorHandle}</Link><small>{when(item.publishedAt)} · MODERATED PUBLIC POST</small></div>
      </div>
   </header>
   <div className="discussion-paper">
     <div className="discussion-body">{item.body}</div>
     <div className="discussion-reactions">
       <span>{item.score+(local?(local.score-(reaction.state==="ready"?reaction.data.myReaction?.score||0:0)):0)} REACTIONS</span>
       <span>{item.replyCount} APPROVED REPLIES</span>
       {reaction.state==="ready"&&reaction.data.available&&<div className="discussion-vote" role="group" aria-label="React to this discussion">
         <button type="button" aria-pressed={myReaction?.score===1} disabled={working} onClick={()=>void rate(1)}>APPRECIATE <span aria-hidden="true">↑</span></button>
         {myReaction?.score===1&&<button type="button" aria-pressed={false} disabled={working} onClick={()=>void rate(0)}>UNDO REACTION</button>}
       </div>}
     </div>
     {message&&<p className="discussion-message" role="status">{message}</p>}
     {reaction.state==="ready"&&!reaction.data.available&&<p className="discussion-muted">Reactions are available to invited members when authenticated community services are enabled.</p>}
   </div>
   <section className="discussion-responses" aria-label="Approved community replies">
     <div className="discussion-section-head"><span className="nfc-eyebrow">COMMUNITY / FOLLOW-UP</span><h2>THE CONVERSATION.</h2></div>
     {replies.length?replies.map(reply=><article key={reply.id} className="discussion-reply">
       <div className="discussion-identity"><span className="discussion-avatar">{reply.authorName.charAt(0).toUpperCase()}</span>
         <div><Link to={"/atlas/creators/"+encodeURIComponent(reply.authorHandle)}>{reply.authorName} / @{reply.authorHandle}</Link><small>{when(reply.publishedAt)}</small></div>
       </div>
       <p>{reply.body}</p>
     </article>):<p className="discussion-muted">No approved replies yet. Replies are being introduced through the moderation workflow.</p>}
   </section>
   <section className="discussion-reply-composer" aria-label="Contribute to this discussion">
     <div className="discussion-section-head"><span className="nfc-eyebrow">COMMUNITY / PARTICIPATE</span><h2>ADD YOUR PERSPECTIVE.</h2></div>
     {ownReplies.state==="loading"&&<p className="discussion-muted">Checking invited-member reply access…</p>}
     {ownReplies.state==="ready"&&ownReplies.data.available?
       <form onSubmit={event=>void submitReply(event)}>
         <label htmlFor="community-reply-body">YOUR REPLY</label>
         <textarea id="community-reply-body" rows={5} minLength={10} maxLength={2000} required disabled={replyPending}
           value={replyText} onChange={event=>setReplyText(event.target.value)}
           placeholder="Share thoughtful feedback, a question, or something you learned…"/>
         <div className="discussion-reply-actions"><small>{replyText.length} / 2000 · STAFF REVIEW REQUIRED</small>
           <button type="submit" disabled={replyPending||replyText.trim().length<10}>{replyPending?"SUBMITTING…":"SUBMIT REPLY FOR REVIEW ↗"}</button>
         </div>
         {replyNotice&&<p role="status" className="discussion-reply-notice">{replyNotice}</p>}
       </form>:
       <p className="discussion-muted">Replying is available to invited members when authenticated community services are enabled. Public reading remains free.</p>}
     {ownReplies.state==="ready"&&ownReplies.data.available&&ownReplies.data.items.length>0&&
       <div className="discussion-own-replies" aria-label="Your private reply moderation status">
         <strong>YOUR SUBMITTED REPLIES</strong>
         {ownReplies.data.items.map(entry=><article key={entry.id}>
           <small>{entry.status==="pending_review"?"AWAITING STAFF REVIEW":entry.status==="published"?"PUBLISHED":"NOT PUBLIC"} · {when(new Date(entry.createdAt*1000).toISOString())}</small>
           <p>{entry.body}</p>
         </article>)}
       </div>}
   </section>
   <div className="discussion-end"><Link to="/atlas/community">← ALL COMMUNITY SPACES</Link><Link to="/atlas">FRONT PAGE ↗</Link></div>
 </article>;
}

import {useState,type FormEvent} from "react";
import {Link,useParams} from "react-router-dom";
import {readCommunityPost} from "../lib/api";
import {useResource} from "../lib/useResource";
import {memberCreateDiscussion,memberMyDiscussions,memberMe,memberHealth,memberPostReaction,memberReactPost,MemberApiError,type PostReaction} from "../lib/member-api";
import {LoadingState,ErrorState} from "../components/States";
import "./community-post-pages.css";

const TOPICS=[
 ["games","Games and Playtesting"],
 ["tools","Software and Tools"],
 ["creative","Art and Creative Work"],
 ["learning","Learning and Education"],
 ["libraries","Open Source"],
 ["research","Research"],
 ["automation","Automation"],
 ["other","General Community"]
] as const;

function dateLabel(value:string){
 const stamp=Date.parse(value);
 return Number.isFinite(stamp)?new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(stamp)):"DATE UNLISTED";
}
export function CommunityComposerPage(){
 const posts=useResource(memberMyDiscussions,[]);
 const [topic,setTopic]=useState<string>("creative");
 const [title,setTitle]=useState("");
 const [body,setBody]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [confirmation,setConfirmation]=useState<string|null>(null);
 async function submit(event:FormEvent<HTMLFormElement>){
   event.preventDefault();if(busy)return;
   setBusy(true);setError("");setConfirmation(null);
   try{
     const reply=await memberCreateDiscussion({title:title.trim(),body:body.trim(),topic});
     setConfirmation("Your discussion was submitted as a private "+reply.status.replaceAll("_"," ")+" item. It is not visible to other members until approved.");
     setTitle("");setBody("");
   }catch(err){setError(err instanceof MemberApiError?err.message:"Discussion submission unavailable. Try again later.");}
   finally{setBusy(false);}
 }
 return <div className="cp-wrap">
   <nav className="cp-breadcrumb"><Link to="/atlas/community">← COMMUNITY</Link><span>/</span><span>NEW DISCUSSION</span></nav>
   <header className="cp-heading">
     <span className="cp-kicker">CREATOR NETWORK / PRIVATE SUBMISSION</span>
     <h1>START A <em>CONVERSATION.</em></h1>
     <p>Ask for feedback, share progress, or open a discussion. Submissions remain private until staff approval. Posts are plain text and do not award XP for being created.</p>
   </header>
   <div className="cp-layout">
     <form className="cp-composer" onSubmit={submit}>
       <label>COMMUNITY TOPIC
         <select value={topic} onChange={event=>setTopic(event.target.value)}>
           {TOPICS.map(([value,label])=><option value={value} key={value}>{label}</option>)}
         </select>
       </label>
       <label>DISCUSSION TITLE
         <input type="text" minLength={8} maxLength={120} value={title}
           onChange={event=>setTitle(event.target.value)} required placeholder="What would you like to discuss?"/>
       </label>
       <label>YOUR POST
         <textarea minLength={20} maxLength={5000} rows={9} required
           value={body} onChange={event=>setBody(event.target.value)}
           placeholder="Describe what you're working on, your question, or the feedback you're looking for."/>
       </label>
       <div className="cp-composer-foot"><span>{body.length} / 5000 CHARACTERS</span>
         <button type="submit" disabled={busy||title.trim().length<8||body.trim().length<20}>
           {busy?"SUBMITTING…":"SUBMIT FOR REVIEW ↗"}
         </button>
       </div>
       {error&&<p className="cp-error" role="alert">{error}</p>}
       {confirmation&&<p className="cp-confirm" role="status">{confirmation}</p>}
     </form>
     <aside className="cp-side">
       <section><span className="cp-kicker">DISCUSSION GUIDELINES</span><h2>MAKE IT WORTH READING.</h2>
         <p>Credit original work, use specific feedback, avoid personal information, and keep posts accessible. Staff review is separate from votes, XP and popularity.</p>
       </section>
       <section><span className="cp-kicker">YOUR SUBMISSIONS</span>
         {posts.state==="loading"&&<p>Checking private submissions…</p>}
         {posts.state==="error"&&<p>Your submission history could not be loaded.</p>}
         {posts.state==="ready"&&(posts.data.items.length?
           posts.data.items.slice(0,6).map(item=><div className="cp-private-entry" key={item.id}><strong>{item.title}</strong><small>{item.status.replaceAll("_"," ").toUpperCase()}</small></div>):
           <p>You have no previous discussion submissions.</p>)}
         {confirmation&&<p className="cp-refresh-hint">Refresh this page to load the newly submitted item into your history.</p>}
       </section>
     </aside>
   </div>
 </div>;
}

type ReactionState={kind:"guest"|"unavailable"}|{kind:"member";reaction:PostReaction|null};
function PostEngagement({postId,initialScore}:{postId:string;initialScore:number}){
 const auth=useResource<ReactionState>(async signal=>{
   try{
     const health=await memberHealth(signal);
     if(health.status!=="ok")return {kind:"unavailable"};
     await memberMe(signal);
     const own=await memberPostReaction(postId,signal);
     return {kind:"member",reaction:own.myReaction};
   }catch(error){
     if(error instanceof MemberApiError&&error.status===401)return {kind:"guest"};
     return {kind:"unavailable"};
   }
 },[postId]);
 const [updated,setUpdated]=useState<{reaction:PostReaction;delta:number}|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const current=updated?.reaction||(auth.state==="ready"&&auth.data.kind==="member"?auth.data.reaction:null);
 const count=initialScore+(updated?.delta||0);
 async function react(){
   if(auth.state!=="ready"||auth.data.kind!=="member"||busy)return;
   const previous=current?.score||0,next=previous===1?0:1;
   setBusy(true);setError("");
   try{
     const response=await memberReactPost(postId,next as 0|1,current?.revision||0);
     setUpdated({reaction:{score:response.score,revision:response.revision},delta:response.changed?next-previous:0});
   }catch(err){setError(err instanceof MemberApiError?err.message:"Could not save your reaction.");}
   finally{setBusy(false);}
 }
 return <div className="cp-engagement">
   <strong>{count} {count===1?"APPRECIATION":"APPRECIATIONS"}</strong>
   {auth.state==="ready"&&auth.data.kind==="member"?
     <button type="button" disabled={busy} aria-pressed={current?.score===1} onClick={react}>{busy?"UPDATING…":current?.score===1?"APPRECIATED ✓":"APPRECIATE THIS POST"}</button>:
     <span>MEMBER REACTIONS ARE INVITATION-ONLY</span>}
   {error&&<p role="alert" className="cp-error">{error}</p>}
 </div>;
}

export function CommunityPostPage(){
 const {id=""}=useParams();
 const resource=useResource(signal=>readCommunityPost(id,signal),[id]);
 if(resource.state==="loading")return <div className="cp-wrap"><LoadingState label="Opening approved community discussion"/></div>;
 if(resource.state==="error")return <div className="cp-wrap"><ErrorState title="DISCUSSION NOT AVAILABLE" detail="This discussion is unpublished, removed, or the public feed cannot be reached."/><Link to="/atlas/community">← RETURN TO COMMUNITY</Link></div>;
 const {post,replies}=resource.data;
 return <article className="cp-wrap">
   <nav className="cp-breadcrumb"><Link to="/atlas/community">← COMMUNITY</Link><span>/</span><span>{post.topic.toUpperCase()}</span></nav>
   <header className="cp-heading">
     <span className="cp-kicker">APPROVED COMMUNITY DISCUSSION / {post.topic.toUpperCase()}</span>
     <h1>{post.title}</h1>
     <div className="cp-author"><Link to={"/atlas/creators/"+encodeURIComponent(post.authorHandle)}>@{post.authorHandle}</Link>
       <span>{dateLabel(post.publishedAt)}</span></div>
   </header>
   <div className="cp-post-body">{post.body}</div>
   <PostEngagement key={post.id} postId={post.id} initialScore={post.score}/>
   <section className="cp-replies">
     <span className="cp-kicker">APPROVED REPLIES / {replies.length}</span>
     <h2>THE CONVERSATION.</h2>
     {replies.length?replies.map(reply=><article key={reply.id} className="cp-reply">
       <div><Link to={"/atlas/creators/"+encodeURIComponent(reply.authorHandle)}>@{reply.authorHandle}</Link><span>{dateLabel(reply.publishedAt)}</span></div>
       <p>{reply.body}</p>
     </article>):<p>No approved replies yet. Public replies will be displayed only after genuine submissions and review.</p>}
   </section>
 </article>;
}

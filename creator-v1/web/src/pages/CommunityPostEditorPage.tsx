import {useState,type FormEvent} from "react";
import {Link} from "react-router-dom";
import {memberCreateDiscussion,memberMyDiscussions,MemberApiError,type DiscussionDraft} from "../lib/member-api";
import {useMemberContext} from "../components/MemberGate";
import {useResource} from "../lib/useResource";
import "./community-discussions.css";

const TOPICS=[
 ["games","Games & Play"],["tools","Software & Apps"],["creative","Creative Work"],
 ["learning","Learning"],["libraries","Open Source"],["research","Research"],
 ["automation","Automation"],["other","General Community"]
] as const;
const initial:DiscussionDraft={title:"",body:"",topic:"games"};
function statusLabel(status:string){
 return ({pending_review:"AWAITING STAFF REVIEW",published:"PUBLISHED",rejected:"NOT APPROVED",hidden:"HIDDEN"})[status]||status.replaceAll("_"," ").toUpperCase();
}

/** Private staging discussion submissions from invited authenticated members only.
 * Creating a post never publishes it automatically or awards client-side XP.
 */
export function CommunityPostEditorPage(){
 const {member}=useMemberContext();
 const [draft,setDraft]=useState<DiscussionDraft>(initial);
 const [pending,setPending]=useState(false);
 const [failure,setFailure]=useState("");
 const [success,setSuccess]=useState("");
 const [refresh,setRefresh]=useState(0);
 const saved=useResource(member.handle?signal=>memberMyDiscussions(signal):async()=>({items:[]}),[member.handle,refresh]);
 function change<K extends keyof DiscussionDraft>(key:K,value:DiscussionDraft[K]){
   setDraft(existing=>({...existing,[key]:value}));setFailure("");setSuccess("");
 }
 async function submit(event:FormEvent<HTMLFormElement>){
   event.preventDefault();
   if(pending)return;
   setPending(true);setFailure("");setSuccess("");
   try{
     const result=await memberCreateDiscussion(draft);
     if(result.status!=="pending_review")throw new Error("Unexpected moderation state");
     setSuccess("Your discussion was submitted privately for review. It is not public until a moderator approves it.");
     setDraft(initial);
     setRefresh(value=>value+1);
   }catch(error){
     setFailure(error instanceof MemberApiError?error.message:"Unable to submit the discussion. Nothing was published.");
   }finally{setPending(false);}
 }
 if(!member.handle)return <section className="discussion-composer"><span className="nfc-eyebrow">COMMUNITY / PROFILE REQUIRED</span>
   <h1>COMPLETE YOUR CREATOR IDENTITY.</h1><p>An authenticated creator handle is required before you can submit discussions for staff review.</p>
   <Link to="/atlas/account/edit">EDIT CREATOR PROFILE ↗</Link>
 </section>;
 return <div className="discussion-composer">
   <nav className="discussion-crumb" aria-label="Community breadcrumb"><Link to="/atlas">NETWORK</Link><span>/</span><Link to="/atlas/community">COMMUNITY</Link><span>/</span><span>NEW DISCUSSION</span></nav>
   <header><span className="nfc-eyebrow">CREATOR NETWORK / INVITED MEMBERS</span><h1>START A <em>CONVERSATION.</em></h1>
      <p>Share a useful question, development note, or creative discussion. Posts are private until staff review. Approval and visibility are not automatic.</p>
   </header>
   <div className="discussion-composer-layout">
     <form className="discussion-composer-panel" onSubmit={event=>void submit(event)}>
       <div><label htmlFor="discussion-topic">CHANNEL</label>
         <select id="discussion-topic" name="topic" value={draft.topic} disabled={pending} onChange={e=>change("topic",e.target.value)}>
           {TOPICS.map(([id,label])=><option key={id} value={id}>{label}</option>)}
         </select>
       </div>
       <div><label htmlFor="discussion-title">DISCUSSION TITLE</label>
         <input id="discussion-title" name="title" type="text" minLength={8} maxLength={120} required disabled={pending}
           placeholder="What's on your mind?" value={draft.title} onChange={e=>change("title",e.target.value)}/>
         <small>{draft.title.length} / 120</small>
       </div>
       <div><label htmlFor="discussion-body">YOUR MESSAGE</label>
         <textarea id="discussion-body" name="body" minLength={20} maxLength={5000} rows={9} required disabled={pending}
           placeholder="What are you building, exploring, or looking for feedback on?" value={draft.body} onChange={e=>change("body",e.target.value)}/>
         <small>{draft.body.length} / 5000</small>
       </div>
       <div className="discussion-composer-notice">Your message is sent to the private review queue. It does not immediately appear in the community feed and cannot be edited after submission in this first version.</div>
       {failure&&<p role="alert" className="discussion-error">{failure}</p>}
       {success&&<p role="status" className="discussion-success">{success}</p>}
       <div className="discussion-composer-actions">
         <button type="submit" disabled={pending||draft.title.trim().length<8||draft.body.trim().length<20}>{pending?"SUBMITTING…":"SUBMIT FOR REVIEW ↗"}</button>
         <Link to="/atlas/community">CANCEL</Link>
       </div>
     </form>
     <aside className="discussion-composer-panel">
       <span className="nfc-eyebrow">YOUR PRIVATE SUBMISSIONS</span><h2>REVIEW STATUS.</h2>
       {saved.state==="loading"&&<p className="discussion-muted">Loading your discussion submissions…</p>}
       {saved.state==="error"&&<div><p className="discussion-muted">Your submission history is temporarily unavailable.</p><button type="button" onClick={()=>setRefresh(v=>v+1)}>RETRY</button></div>}
       {saved.state==="ready"&&!saved.data.items.length&&<p className="discussion-muted">You haven't submitted any discussions yet.</p>}
       {saved.state==="ready"&&saved.data.items.length>0&&<div className="discussion-private-list">
         {saved.data.items.map(item=><article key={item.id}><span className="nfc-eyebrow">{item.topic.toUpperCase()} / {statusLabel(item.status)}</span><strong>{item.title}</strong>
           <p>{item.body}</p>
           {item.status==="published"&&<Link to={"/atlas/community/posts/"+encodeURIComponent(item.id)}>READ PUBLIC DISCUSSION ↗</Link>}
         </article>)}
       </div>}
     </aside>
   </div>
 </div>;
}

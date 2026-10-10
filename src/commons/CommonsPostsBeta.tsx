import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { memberAuthClient } from "../member/auth-client";
import { useMemberAvailability } from "../member/useMemberAvailability";

type Topic="systems"|"engineering"|"research"|"releases";
type Post={
  id:string;topic:Topic;title:string;body:string;
  createdAt:number;updatedAt:number;ownedByMe:boolean;authorLabel:string;
};
type Reply={
  id:string;postId:string;body:string;createdAt:number;
  ownedByMe:boolean;authorLabel:string;
};
const topics:Topic[]=["systems","engineering","research","releases"];
const reasons=["spam","harassment","privacy","misinformation","other"] as const;
type ReportReason=typeof reasons[number];

function isoDate(epoch:number){
  const date=new Date(epoch*1000);
  return Number.isFinite(date.getTime())?date.toISOString():undefined;
}
function stamp(epoch:number){
  const date=new Date(epoch*1000);
  return Number.isFinite(date.getTime())?
    date.toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"}):
    "Date unavailable";
}

function SignedInDiscussions({memberId}:{memberId:string}){
  const [filter,setFilter]=useState<Topic|"all">("all");
  const [status,setStatus]=useState<"loading"|"ready"|"off"|"error">("loading");
  const [posts,setPosts]=useState<Post[]>([]);
  const [title,setTitle]=useState("");
  const [topic,setTopic]=useState<Topic>("research");
  const [body,setBody]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [replies,setReplies]=useState<Record<string,Reply[]>>({});
  const [replyDraft,setReplyDraft]=useState<Record<string,string>>({});
  const [reportReason,setReportReason]=useState<Record<string,ReportReason>>({});

  useEffect(()=>{
    const controller=new AbortController();
    setStatus("loading");setPosts([]);setMessage("");setReplies({});
    const suffix=filter==="all"?"":"?topic="+encodeURIComponent(filter);
    void fetch("/api/member/commons/posts"+suffix,{
      credentials:"same-origin",cache:"no-store",signal:controller.signal
    }).then(async res=>{
      if(res.status===503)return null;
      if(!res.ok)throw Error("Unavailable");
      return await res.json() as {available?:boolean;posts?:Post[]};
    }).then(payload=>{
      if(controller.signal.aborted)return;
      if(!payload || payload.available!==true){setStatus("off");return;}
      if(!Array.isArray(payload.posts))throw Error("Malformed feed");
      setPosts(payload.posts);setStatus("ready");
    }).catch(()=>{if(!controller.signal.aborted)setStatus("error");});
    return ()=>controller.abort();
  },[filter,memberId]);

  async function refresh(){
    const suffix=filter==="all"?"":"?topic="+encodeURIComponent(filter);
    const res=await fetch("/api/member/commons/posts"+suffix,{
      credentials:"same-origin",cache:"no-store"
    });
    if(!res.ok)throw Error("Feed refresh failed");
    const payload=await res.json() as {posts?:Post[]};
    if(!Array.isArray(payload.posts))throw Error("Malformed feed");
    setPosts(payload.posts);
  }
  async function publish(){
    if(busy || status!=="ready" || title.trim().length<8 ||
       body.trim().length<20 || body.trim().length>3000)return;
    setBusy(true);setMessage("");
    try{
      const res=await fetch("/api/member/commons/posts",{
        method:"POST",credentials:"same-origin",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({topic,title,body})
      });
      if(!res.ok)throw Error("Post not accepted");
      setTitle("");setBody("");setMessage("Post published to the private pilot feed.");
      await refresh();
    }catch{setMessage("Could not publish. Verify the daily limit and pilot status.");}
    finally{setBusy(false);}
  }
  async function remove(postId:string){
    if(busy)return;
    setBusy(true);setMessage("");
    try{
      const res=await fetch("/api/member/commons/posts/"+postId,{
        method:"DELETE",credentials:"same-origin"
      });
      if(!res.ok)throw Error("Remove failed");
      await refresh();setMessage("Your post was removed.");
    }catch{setMessage("Post removal is unavailable.");}
    finally{setBusy(false);}
  }
  async function showReplies(postId:string){
    try{
      const res=await fetch("/api/member/commons/posts/"+postId+"/replies",{
        credentials:"same-origin",cache:"no-store"
      });
      if(!res.ok)throw Error("Replies unavailable");
      const payload=await res.json() as {replies?:Reply[]};
      if(!Array.isArray(payload.replies))throw Error("Malformed replies");
      setReplies(prev=>({...prev,[postId]:payload.replies!}));
    }catch{setMessage("Replies could not be loaded.");}
  }
  async function publishReply(postId:string){
    const content=replyDraft[postId]?.trim()||"";
    if(busy || content.length<2 || content.length>1000)return;
    setBusy(true);setMessage("");
    try{
      const res=await fetch("/api/member/commons/posts/"+postId+"/replies",{
        method:"POST",credentials:"same-origin",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({body:content})
      });
      if(!res.ok)throw Error("Reply rejected");
      setReplyDraft(prev=>({...prev,[postId]:""}));
      await showReplies(postId);
    }catch{setMessage("The reply could not be saved.");}
    finally{setBusy(false);}
  }
  async function report(postId:string){
    if(busy)return;
    setBusy(true);setMessage("");
    try{
      const res=await fetch("/api/member/commons/posts/"+postId+"/report",{
        method:"POST",credentials:"same-origin",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({reason:reportReason[postId]||"other"})
      });
      if(!res.ok)throw Error("Report declined");
      setMessage("Report recorded for moderator review.");
    }catch{setMessage("Report could not be submitted or was already filed.");}
    finally{setBusy(false);}
  }

  return <section className="c2-social" aria-labelledby="v5-social-heading">
    <header className="c2-social-header">
      <h2 id="v5-social-heading">Member discussions</h2>
      <p>Real member-written discussions, separate from RHEN execution, brokerage accounts and published research evidence.</p>
    </header>
    {status==="loading"&&<p role="status">Checking private Commons availability…</p>}
    {status==="off"&&<div className="c2-truth" role="status">Posting and replies are not yet enabled. The published research directory remains available.</div>}
    {status==="error"&&<p role="alert">The discussion feed is unavailable. No posts have been loaded.</p>}
    {status==="ready"&&<>
      <form className="c2-social-composer c2-card" onSubmit={event=>{event.preventDefault();void publish();}}>
        <h3>Start a discussion</h3>
        <label htmlFor="commons-social-topic">Topic</label>
        <select id="commons-social-topic" value={topic} onChange={event=>setTopic(event.target.value as Topic)}>
          {topics.map(value=><option value={value} key={value}>{value.charAt(0).toUpperCase()+value.slice(1)}</option>)}
        </select>
        <label htmlFor="commons-social-title">Title</label>
        <input id="commons-social-title" maxLength={120} minLength={8} required value={title}
          onChange={event=>setTitle(event.target.value)} placeholder="A concrete question or observation"/>
        <label htmlFor="commons-social-body">Discussion</label>
        <textarea id="commons-social-body" rows={4} maxLength={3000} minLength={20} required value={body}
          onChange={event=>setBody(event.target.value)} placeholder="Describe the context, evidence, and what you would like to discuss."/>
        <p className="c2-social-limit">Pilot limit: 3 posts per member every 24 hours. No trading instructions or automatically copied orders.</p>
        <button type="submit" disabled={busy || title.trim().length<8 || body.trim().length<20}>Publish discussion</button>
      </form>
      <nav className="c2-tabs" aria-label="Filter Commons discussions">
        {(["all",...topics] as const).map(value=>
          <button type="button" key={value} className={filter===value?"selected":""}
            aria-current={filter===value?"page":undefined} onClick={()=>setFilter(value)} disabled={busy}>
            {value==="all"?"All":value.charAt(0).toUpperCase()+value.slice(1)}
          </button>
        )}
      </nav>
      <div className="c2-social-stream" aria-label="Member discussions">
        {posts.length===0?<div className="c2-empty"><h3>No published discussions yet</h3><p>No activity has been fabricated for the pilot. Members can start the first conversation when posting is enabled.</p></div>:
          posts.map(post=><article className="c2-card c2-social-post" key={post.id}>
            <div className="c2-card-meta"><span>{post.topic}</span><time dateTime={isoDate(post.createdAt)}>{stamp(post.createdAt)}</time><span>{post.authorLabel}</span></div>
            <h3>{post.title}</h3><p>{post.body}</p>
            <div className="c2-social-actions">
              <button type="button" onClick={()=>void showReplies(post.id)}>View replies</button>
              {post.ownedByMe?<button type="button" disabled={busy} onClick={()=>void remove(post.id)}>Remove my post</button>:<>
                <label htmlFor={"commons-report-"+post.id}>Report reason</label>
                <select id={"commons-report-"+post.id} value={reportReason[post.id]||"other"}
                  onChange={event=>setReportReason(old=>({...old,[post.id]:event.target.value as ReportReason}))}>
                  {reasons.map(reason=><option value={reason} key={reason}>{reason}</option>)}
                </select>
                <button type="button" disabled={busy} onClick={()=>void report(post.id)}>Report</button>
              </>}
            </div>
            {replies[post.id]&&<section className="c2-social-replies" aria-label={"Replies to "+post.title}>
              {replies[post.id].length===0?<p>No replies yet.</p>:replies[post.id].map(reply=>
                <div className="c2-social-reply" key={reply.id}>
                  <small>{reply.authorLabel} · {stamp(reply.createdAt)}</small><p>{reply.body}</p>
                </div>)}
              <form onSubmit={event=>{event.preventDefault();void publishReply(post.id);}}>
                <label htmlFor={"commons-reply-"+post.id}>Add a reply</label>
                <textarea id={"commons-reply-"+post.id} rows={2} minLength={2} maxLength={1000}
                  value={replyDraft[post.id]||""}
                  onChange={event=>setReplyDraft(old=>({...old,[post.id]:event.target.value}))}/>
                <button type="submit" disabled={busy || (replyDraft[post.id]?.trim().length||0)<2}>Reply</button>
              </form>
            </section>}
          </article>)}
      </div>
    </>}
    {message&&<p role="status" className="c2-social-message">{message}</p>}
  </section>;
}
export default function CommonsPostsBeta(){
  const availability=useMemberAvailability();
  const {data:session,isPending}=memberAuthClient.useSession();
  if(isPending || availability==="checking")
    return <section className="c2-social"><p role="status">Checking Commons membership…</p></section>;
  if(availability!=="available" || !session?.user?.id)
    return <section className="c2-social">
      <h2>Member discussions</h2><p>Published Field Notes are open to everyone. Member participation requires an ANEVUM account and an approved discussion pilot.</p>
      <Link to="/sign-in" className="c2-text-link">Sign in to Commons</Link>
    </section>;
  return <SignedInDiscussions key={session.user.id} memberId={session.user.id}/>;
}

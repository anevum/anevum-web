import {useEffect,useRef,useState} from "react";
import {Link} from "react-router-dom";
import {memberAuthClient} from "../member/auth-client";
import {useMemberAvailability} from "../member/useMemberAvailability";
import {topics,parsePostPage,parseReplyPage,mergeDiscussionPage,verifiedDiscussionAction,validDiscussionText,type Topic,type Post,type Reply,type Page} from "./discussion-contract";
const reasons=["spam","harassment","privacy","misinformation","other"] as const;
type ReportReason=typeof reasons[number];
function isoDate(epoch:number){return new Date(epoch*1000).toISOString();}
function stamp(epoch:number){return new Date(epoch*1000).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"});}
function SignedInDiscussions({memberId}:{memberId:string}){
  const [filter,setFilter]=useState<Topic|"all">("all");
  return <DiscussionFeed key={filter} memberId={memberId} filter={filter} onFilterChange={setFilter}/>;
}
function DiscussionFeed({memberId,filter,onFilterChange}:{memberId:string;filter:Topic|"all";onFilterChange:(filter:Topic|"all")=>void}){
  const [status,setStatus]=useState<"loading"|"ready"|"off"|"error">("loading");
  const [posts,setPosts]=useState<Post[]>([]),[nextCursor,setNextCursor]=useState<string|null>(null);
  const [title,setTitle]=useState(""),[topic,setTopic]=useState<Topic>("research"),[body,setBody]=useState("");
  const [busy,setBusy]=useState(false),[uncertain,setUncertain]=useState(false),[problem,setProblem]=useState(false),[message,setMessage]=useState("");
  const [replies,setReplies]=useState<Record<string,Page<Reply>>>({});
  const [replyDraft,setReplyDraft]=useState<Record<string,string>>({});
  const [reportReason,setReportReason]=useState<Record<string,ReportReason>>({});
  const [revision,setRevision]=useState(0);
  const scope=useRef<AbortController|null>(null),locked=useRef(false);
  function feedUrl(cursor?:string|null){const query=new URLSearchParams();if(filter!=="all")query.set("topic",filter);if(cursor)query.set("cursor",cursor);return "/api/member/commons/posts"+(query.size?"?"+query.toString():"");}
  async function read(url:string,controller:AbortController,init:RequestInit={}){
    const response=await fetch(url,{...init,credentials:"same-origin",cache:"no-store",signal:controller.signal});
    if(controller.signal.aborted)throw Error("Cancelled");
    if(!response.ok){if([401,403,503].includes(response.status)){setPosts([]);setReplies({});setNextCursor(null);setStatus("off");}throw Error("Request unavailable");}
    const value:unknown=await response.json();if(controller.signal.aborted)throw Error("Cancelled");return value;
  }
  async function refresh(controller:AbortController){
    const page=parsePostPage(await read(feedUrl(),controller),memberId,filter);
    if(controller.signal.aborted)return;
    setPosts(page.items);setNextCursor(page.nextCursor);setReplies({});setReplyDraft({});setReportReason({});setStatus("ready");
  }
  useEffect(()=>{
    const controller=new AbortController();scope.current=controller;locked.current=false;
    setStatus("loading");setPosts([]);setNextCursor(null);setReplies({});setReplyDraft({});setReportReason({});setBusy(false);setUncertain(false);setProblem(false);setMessage("");
    void refresh(controller).catch(()=>{if(!controller.signal.aborted)setStatus(old=>old==="off"?"off":"error");});
    return ()=>controller.abort();
    // The tree is keyed by member and filter; revision is an explicit authoritative reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[memberId,filter,revision]);
  async function task(write:boolean,action:(controller:AbortController)=>Promise<void>){
    const controller=scope.current;
    if(!controller||controller.signal.aborted||locked.current||uncertain||status!=="ready")return;
    locked.current=true;setBusy(true);setProblem(false);setMessage("");
    try{await action(controller);}catch{
      if(!controller.signal.aborted){setProblem(true);if(write){setUncertain(true);setMessage("Action not verified. Reload latest discussions before another attempt; the server may already have recorded it.");}else setMessage("Could not load this page. Retry or reload the authorized discussion feed.");}
    }finally{if(!controller.signal.aborted){locked.current=false;setBusy(false);}}
  }
  async function olderPosts(){await task(false,async controller=>{
    if(!nextCursor)return;
    const page=parsePostPage(await read(feedUrl(nextCursor),controller),memberId,filter);
    const merged=mergeDiscussionPage(posts,page.items,"posts");
    setPosts(posts.length>=300?page.items:merged);setNextCursor(page.nextCursor);
    if(posts.length>=300){setReplies({});setReplyDraft({});setReportReason({});}
  });}
  async function loadReplies(postId:string,controller:AbortController,more=false){
    const previous=replies[postId],cursor=more?previous?.nextCursor:null;
    if(more&&!cursor)return;
    const page=parseReplyPage(await read("/api/member/commons/posts/"+postId+"/replies"+(cursor?"?cursor="+encodeURIComponent(cursor):""),controller),memberId,postId);
    const items=more?mergeDiscussionPage(previous.items,page.items,"replies"):page.items;
    setReplies(old=>({...old,[postId]:{items:more&&previous.items.length>=300?page.items:items,nextCursor:page.nextCursor}}));
  }
  async function showReplies(postId:string,more=false){await task(false,controller=>loadReplies(postId,controller,more));}
  function mutation(method:string,body?:unknown):RequestInit{return {method,...(body===undefined?{}:{headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})};}
  async function publish(){
    if(!validDiscussionText(title,8,120)||!validDiscussionText(body,20,3000))return;
    await task(true,async controller=>{
      const content={topic,title:title.trim(),body:body.trim()};
      verifiedDiscussionAction(await read("/api/member/commons/posts",controller,mutation("POST",content)),memberId,"post",content);
      setTitle("");setBody("");await refresh(controller);if(controller.signal.aborted)return;setMessage("Post published to the private pilot feed.");
    });
  }
  async function remove(postId:string){
    if(!posts.some(post=>post.id===postId&&post.ownedByMe)||!window.confirm("Remove your post and its discussion text?"))return;
    await task(true,async controller=>{
      verifiedDiscussionAction(await read("/api/member/commons/posts/"+postId,controller,mutation("DELETE")),memberId,"remove-post",{postId});
      await refresh(controller);if(controller.signal.aborted)return;setMessage("Your post was removed.");
    });
  }
  async function removeReply(postId:string,replyId:string){
    if(!replies[postId]?.items.some(row=>row.id===replyId&&row.ownedByMe)||!window.confirm("Remove your reply and its text?"))return;
    await task(true,async controller=>{
      verifiedDiscussionAction(await read("/api/member/commons/posts/"+postId+"/replies/"+replyId,controller,mutation("DELETE")),memberId,"remove-reply",{postId,replyId});
      await loadReplies(postId,controller);if(controller.signal.aborted)return;setMessage("Your reply was removed.");
    });
  }
  async function publishReply(postId:string){
    const content=replyDraft[postId]?.trim()||"";if(!validDiscussionText(content,2,1000))return;
    await task(true,async controller=>{
      verifiedDiscussionAction(await read("/api/member/commons/posts/"+postId+"/replies",controller,mutation("POST",{body:content})),memberId,"reply",{postId,body:content});
      setReplyDraft(old=>({...old,[postId]:""}));await loadReplies(postId,controller);if(controller.signal.aborted)return;setMessage("Reply saved. Load more replies if it is beyond the first page.");
    });
  }
  async function report(postId:string){
    if(!posts.some(row=>row.id===postId&&!row.ownedByMe))return;
    await task(true,async controller=>{
      verifiedDiscussionAction(await read("/api/member/commons/posts/"+postId+"/report",controller,mutation("POST",{reason:reportReason[postId]||"other"})),memberId,"report",{postId});
      setMessage("Report recorded for moderator review.");
    });
  }
  return <section className="c2-social" data-discussion-state={status} aria-busy={busy||status==="loading"} aria-labelledby="v5-social-heading">
    <header className="c2-social-header">
      <h2 id="v5-social-heading">Member discussions</h2>
      <p>Real member-written discussions, separate from RHEN execution, brokerage accounts and published research evidence.</p>
    </header>
    {message&&<p role={problem?"alert":"status"} className="c2-social-message">{message}</p>}
    {status==="loading"&&<p role="status">Checking private Commons availability…</p>}
    {status==="off"&&<div className="c2-truth" role="status">Discussion access is unavailable. Posting and replies remain closed until membership and pilot authorization are verified.</div>}
    {status==="error"&&<p role="alert">The discussion feed is unavailable. No posts have been loaded.</p>}
    <button type="button" className="c2-social-reload" disabled={busy||status==="loading"} onClick={()=>setRevision(old=>old+1)}>Reload latest discussions</button>
    {status==="ready"&&<>
      <form className="c2-social-composer c2-card" onSubmit={event=>{event.preventDefault();void publish();}}>
        <h3>Start a discussion</h3>
        <label htmlFor="commons-social-topic">Topic</label>
        <select id="commons-social-topic" disabled={busy||uncertain} value={topic} onChange={event=>setTopic(event.target.value as Topic)}>
          {topics.map(value=><option value={value} key={value}>{value.charAt(0).toUpperCase()+value.slice(1)}</option>)}
        </select>
        <label htmlFor="commons-social-title">Title</label>
        <input id="commons-social-title" disabled={busy||uncertain} maxLength={120} minLength={8} required value={title}
          onChange={event=>setTitle(event.target.value)} placeholder="A concrete question or observation"/>
        <label htmlFor="commons-social-body">Discussion</label>
        <textarea id="commons-social-body" disabled={busy||uncertain} rows={4} maxLength={3000} minLength={20} required value={body}
          onChange={event=>setBody(event.target.value)} placeholder="Describe the context, evidence, and what you would like to discuss."/>
        <p className="c2-social-limit">Pilot limit: 3 posts per member every 24 hours. No trading instructions or automatically copied orders.</p>
        <button type="submit" disabled={busy||uncertain||!validDiscussionText(title,8,120)||!validDiscussionText(body,20,3000)}>Publish discussion</button>
      </form>
      <nav className="c2-tabs" aria-label="Filter Commons discussions">
        {(["all",...topics] as const).map(value=>
          <button type="button" key={value} className={filter===value?"selected":""}
            aria-current={filter===value?"page":undefined} onClick={()=>onFilterChange(value)} disabled={busy||uncertain}>
            {value==="all"?"All":value.charAt(0).toUpperCase()+value.slice(1)}
          </button>
        )}
      </nav>
      <div className="c2-social-stream" aria-label="Member discussions">
        {posts.length===0?<div className="c2-empty"><h3>No discussions in this view</h3><p>No published records were returned for this topic. Reload or select another topic.</p></div>:
          posts.map(post=><article className="c2-card c2-social-post" key={post.id}>
            <div className="c2-card-meta"><span>{post.topic}</span><time dateTime={isoDate(post.createdAt)}>{stamp(post.createdAt)}</time><span>{post.authorLabel}</span></div>
            <h3>{post.title}</h3><p>{post.body}</p>
            <div className="c2-social-actions">
              <button type="button" disabled={busy||uncertain} onClick={()=>void showReplies(post.id)}>View replies</button>
              {post.ownedByMe?<button type="button" disabled={busy||uncertain} onClick={()=>void remove(post.id)}>Remove my post</button>:<>
                <label htmlFor={"commons-report-"+post.id}>Report reason</label>
                <select disabled={busy||uncertain} id={"commons-report-"+post.id} value={reportReason[post.id]||"other"}
                  onChange={event=>setReportReason(old=>({...old,[post.id]:event.target.value as ReportReason}))}>
                  {reasons.map(reason=><option value={reason} key={reason}>{reason}</option>)}
                </select>
                <button type="button" disabled={busy||uncertain} onClick={()=>void report(post.id)}>Report</button>
              </>}
            </div>
            {replies[post.id]&&<section className="c2-social-replies" aria-label={"Replies to "+post.title}>
              {replies[post.id].items.length===0?<p>No replies yet.</p>:replies[post.id].items.map(reply=>
                <div className="c2-social-reply" key={reply.id}>
                  <small>{reply.authorLabel} · {stamp(reply.createdAt)}</small><p>{reply.body}</p>
                  {reply.ownedByMe&&<button type="button" disabled={busy||uncertain} onClick={()=>void removeReply(post.id,reply.id)}>Remove my reply</button>}
                </div>)}
              {replies[post.id].nextCursor&&<button type="button" disabled={busy||uncertain} onClick={()=>void showReplies(post.id,true)}>{replies[post.id].items.length>=300?"Continue replies in a new window":"Load more replies"}</button>}
              {!replies[post.id].nextCursor&&<p className="c2-social-limit">End of this reply list. Reload replies to check for new contributions.</p>}
              <form onSubmit={event=>{event.preventDefault();void publishReply(post.id);}}>
                <label htmlFor={"commons-reply-"+post.id}>Add a reply</label>
                <textarea id={"commons-reply-"+post.id} disabled={busy||uncertain} rows={2} minLength={2} maxLength={1000}
                  value={replyDraft[post.id]||""}
                  onChange={event=>setReplyDraft(old=>({...old,[post.id]:event.target.value}))}/>
                <button type="submit" disabled={busy||uncertain||!validDiscussionText(replyDraft[post.id]||"",2,1000)}>Reply</button>
              </form>
            </section>}
          </article>)}
      </div>
      {nextCursor?<button type="button" className="c2-social-more" disabled={busy||uncertain} onClick={()=>void olderPosts()}>{posts.length>=300?"Continue older discussions in a new window":"Load older discussions"}</button>:<p className="c2-social-limit">End of the current discussion list. Reload latest discussions to check for new posts.</p>}
    </>}
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

import {Link} from "react-router-dom";
import {useState} from "react";
import {readCommunityPosts,readStatus,type CommunityPostsPage,type CommunityPostSort} from "../lib/api";
import {useResource} from "../lib/useResource";
import "./morph-community-feed.css";

type Availability={mode:"available";page:CommunityPostsPage}|{mode:"not-public"};
function postedAt(value:string){
 const timestamp=Date.parse(value);
 return Number.isFinite(timestamp)?new Intl.DateTimeFormat("en-US",{timeZone:"UTC",month:"short",day:"numeric"}).format(new Date(timestamp)):"DATE UNLISTED";
}

/** Community posts only appear after real submission and staff moderation.
 * Empty systems render a truthful, useful entrypoint instead of fake engagement.
 */
export function HotCommunityPosts(){
 const [sort,setSort]=useState<CommunityPostSort>("hot");
 const [revision,setRevision]=useState(0);
 const resource=useResource<Availability>(async signal=>{
   try{
     // The homepage does not query an unprovisioned public post service.
     // Only staff-reviewed, published discussions can be considered available.
     const status=await readStatus(signal);
     if(status.features?.communityPosts!==true)return {mode:"not-public"};
     const page=await readCommunityPosts({sort,limit:"5"},signal);
     return {mode:"available",page};
   }catch(error){
     if((error as {status?:number}).status===404)return {mode:"not-public"};
     throw error;
   }
 },[sort,revision]);
 const data=resource.state==="ready"&&resource.data.mode==="available"?resource.data.page:null;
 return <section className="nfc-module nfc-discussions" aria-labelledby="nfc-discussion-title">
   <div className="nfc-module-heading">
     <div><span className="nfc-eyebrow">COMMUNITY / CONVERSATIONS</span><h2 id="nfc-discussion-title">HOT <em>DISCUSSIONS</em></h2></div>
     <Link to="/atlas/community" aria-label="Explore ANEVUM community">↗</Link>
   </div>
   <div className="nfc-discussion-switch" role="group" aria-label="Order approved discussion posts">
     <button type="button" aria-pressed={sort==="hot"} onClick={()=>setSort("hot")}>HOT</button>
     <button type="button" aria-pressed={sort==="new"} onClick={()=>setSort("new")}>NEW</button>
     <button type="button" onClick={()=>setRevision(n=>n+1)} aria-label="Refresh approved discussions" disabled={resource.state==="loading"}>↻</button>
   </div>
   {resource.state==="loading"&&<p className="nfc-module-muted" role="status">Checking published discussions…</p>}
   {resource.state==="error"&&<div className="nfc-discussion-empty" role="status">
     <strong>DISCUSSIONS UNAVAILABLE</strong><p>The public discussion service could not be reached.</p>
     <button type="button" onClick={()=>setRevision(n=>n+1)}>RETRY</button>
   </div>}
   {resource.state==="ready"&&resource.data.mode==="not-public"&&<div className="nfc-discussion-empty">
     <span className="nfc-discussion-mark" aria-hidden="true">✳</span>
     <strong>THE CONVERSATION STARTS HERE.</strong>
     <p>Community posting is being built. No public discussions have been opened or ranked yet.</p>
     <Link to="/atlas/community">VISIT COMMUNITY ↗</Link>
   </div>}
   {data&&!data.items.length&&<div className="nfc-discussion-empty">
      <strong>NO APPROVED POSTS YET.</strong>
      <p>New discussions will appear after real community submissions pass review.</p>
      <Link to="/atlas/community">EXPLORE THE COMMUNITY ↗</Link>
    </div>}
   {data&&data.items.length>0&&<div className="nfc-posts">
     {data.items.map((post,i)=><article key={post.id} className="nfc-post">
       <div className="nfc-post-top"><span>{String(i+1).padStart(2,"0")} · {post.topic.toUpperCase()}</span><span>{postedAt(post.publishedAt)}</span></div>
       <h3><Link to={"/atlas/community/posts/"+encodeURIComponent(post.id)}>{post.title}</Link></h3>
       <p>{post.excerpt}</p>
       <div className="nfc-post-meta"><Link to={"/atlas/creators/"+encodeURIComponent(post.authorHandle)}>@{post.authorHandle}</Link>
         <span>{post.score} REACTIONS</span><span>{post.replyCount} REPLIES</span></div>
     </article>)}
   </div>}
   <div className="nfc-module-footer"><Link to="/atlas/community">ALL COMMUNITY SPACES ↗</Link><Link to="/atlas/community/new">START A DISCUSSION ↗</Link></div>
 </section>;
}

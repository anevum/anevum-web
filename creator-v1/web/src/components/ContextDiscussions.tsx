import {useState} from "react";
import {Link} from "react-router-dom";
import {readCommunityPosts,readStatus,type CommunityPostsPage} from "../lib/api";
import {useResource} from "../lib/useResource";
import "../pages/community-discussions.css";

type Scope={projectId:string;creator?:never}|{creator:string;projectId?:never};
type Result={available:false}|{available:true;page:CommunityPostsPage};

/** Current, approved activity. Authored discussion is not collaborator credit. */
export function ContextDiscussions(scope:Scope){
 const [refresh,setRefresh]=useState(0);
 const resource=useResource<Result>(async signal=>{
   const status=await readStatus(signal);
   if(status.features?.communityPosts!==true||(scope.projectId&&status.features?.projectDiscussions!==true))return {available:false};
   return {available:true,page:await readCommunityPosts({sort:'new',limit:'6',project:scope.projectId,creator:scope.creator},signal)};
 },[scope.projectId,scope.creator,refresh]);
 const page=resource.state==='ready'&&resource.data.available?resource.data.page:null;
 const write='/community/write'+(scope.projectId?'?project='+encodeURIComponent(scope.projectId):'');
 return <section className="portal-box context-discussions" aria-label={scope.projectId?'Project discussions':'Creator discussion activity'}>
   <header className="portal-box-header"><div><span className="kicker">COMMUNITY / MODERATED CONVERSATIONS</span><h2>{scope.projectId?'PROJECT DISCUSSIONS':'FROM THE CONVERSATION'}</h2></div>
     <button className="context-refresh" type="button" disabled={resource.state==='loading'} aria-label="Refresh discussion activity" onClick={()=>setRefresh(n=>n+1)}>↻</button>
   </header>
   {resource.state==='loading'&&<p role="status">Loading approved discussions…</p>}
   {resource.state==='error'&&<div role="status"><p>Discussion activity could not be loaded.</p><button type="button" onClick={()=>setRefresh(n=>n+1)}>TRY AGAIN</button></div>}
   {resource.state==='ready'&&!resource.data.available&&<p>{scope.projectId?'Project discussions are being connected to the moderation workflow.':'Public discussion activity is not available yet.'}</p>}
   {page&&!page.items.length&&<p>{scope.projectId?'No approved discussions about this project yet.':'This creator has no approved discussions yet.'}</p>}
   {page&&page.items.length>0&&<div className="context-posts">{page.items.map(post=><article key={post.id}>
     <span className="kicker">{post.topic.toUpperCase()} / APPROVED DISCUSSION</span>
     <h3><Link to={'/community/posts/'+encodeURIComponent(post.id)}>{post.title}</Link></h3>
     <p>{post.excerpt}</p>
     <div className="context-post-meta"><Link to={'/creators/'+encodeURIComponent(post.authorHandle)}>@{post.authorHandle}</Link><span>{post.score} REACTIONS</span><span>{post.replyCount} APPROVED REPLIES</span></div>
     {!scope.projectId&&post.project&&<Link className="context-project-link" to={'/projects/'+encodeURIComponent(post.project.id)}>ABOUT {post.project.title} ↗</Link>}
   </article>)}</div>}
   <footer className="context-discussion-links"><Link to={'/community'}>EXPLORE COMMUNITY ↗</Link>
     {resource.state==='ready'&&resource.data.available&&<Link to={write}>{scope.projectId?'DISCUSS THIS PROJECT':'START A DISCUSSION'} ↗</Link>}
   </footer>
 </section>;
}

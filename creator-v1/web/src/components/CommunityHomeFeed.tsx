import {Link} from "react-router-dom";
import {useEffect,useState} from "react";
import {readCommunityPosts,type Category,type CommunityPost,type Creator,type Project} from "../lib/api";
import {useResource} from "../lib/useResource";
import {projectDetailPath} from "../lib/navigation";
import {CosmicArtwork} from "./CosmicArtwork";
import type {CosmicScene} from "./CosmicIllustration";
import {Icon} from "./Icons";
import {ErrorState,LoadingState} from "./States";

/** A real public index, never a synthetic social feed. Private, queued and
 * unreviewed records must remain excluded by their authoritative API.
 * "Automated" means indexing approved public data, not bot-generated posts.
 */
type View="all"|"projects"|"discussions";
type FeedItem=
  | {kind:"project";key:string;date:number;value:Project}
  | {kind:"discussion";key:string;date:number;value:CommunityPost};
type Props={
  projects:readonly Project[];
  creators:readonly Creator[];
  state:"loading"|"ready"|"error";
  communityEnabled:boolean;
};
const categories:readonly {name:string;id:Category;scene:CosmicScene}[]=[
  {name:"Games",id:"games",scene:"games"},
  {name:"Apps & Tools",id:"tools",scene:"tools"},
  {name:"Art & AI",id:"creative",scene:"creative"},
  {name:"Research",id:"research",scene:"research"},
  {name:"Learning",id:"learning",scene:"learning"},
  {name:"Open Source",id:"libraries",scene:"libraries"},
  {name:"Automation",id:"automation",scene:"automation"},
  {name:"Other Worlds",id:"other",scene:"other"}
];
const categoryScene=Object.fromEntries(categories.map(c=>[c.id,c.scene])) as Record<Category,CosmicScene>;
function dateOrder(raw:string|null|undefined){
  const value=raw?Date.parse(raw):0;
  return Number.isFinite(value)?value:0;
}
function dateLabel(raw:string|null|undefined){
  const value=dateOrder(raw);
  return value?new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(value):"Date unavailable";
}
function ProfileCard({handle,name,known}:{handle:string;name:string;known?:Creator}){
  const href="/creators/"+encodeURIComponent(handle);
  return <aside className="av6-author" aria-label={"Creator "+name}>
    <span className="av6-author-label">CREATOR / PUBLIC CHANNEL</span>
    <Link to={href} className="av6-author-person">
      <span className="av6-author-avatar" aria-hidden="true">{(name.trim().charAt(0)||handle.charAt(0)||"A").toUpperCase()}</span>
      <span className="av6-author-identity"><strong>{name}</strong><small>@{handle}</small></span>
    </Link>
    {known&&<span className="av6-author-stat">{known.publishedProjects} {known.publishedProjects===1?"published work":"published works"}</span>}
    <Link to={href} className="av6-author-visit">VIEW CHANNEL <Icon name="arrow" size={13}/></Link>
  </aside>;
}
function ProjectEntry({project,creators}:{project:Project;creators:readonly Creator[]}){
  const author=creators.find(c=>c.handle===project.creatorHandle);
  const title=project.title;
  const href=projectDetailPath(project.id,"/");
  const cat=categories.find(c=>c.id===project.category);
  return <article className="av6-feed-item av6-feed-project">
    <div className="av6-feed-record"><span>PUBLIC INDEX <b>/</b> PROJECT <b>/</b> {project.category.toUpperCase()}</span><time dateTime={project.publishedAt||undefined}>{dateLabel(project.publishedAt)}</time></div>
    <div className="av6-feed-item-body">
      <Link to={href} className="av6-feed-art" aria-label={"Open "+title}>
        <CosmicArtwork scene={categoryScene[project.category]}/>
        <span>CATEGORY ILLUSTRATION</span>
      </Link>
      <div className="av6-feed-description">
        <span className="av6-feed-eyebrow">{project.freeToUse?"FREE TO EXPLORE":"PUBLISHED PROJECT"}</span>
        <h3><Link to={href}>{title}</Link></h3>
        <p>{project.summary}</p>
        <div className="av6-feed-action-row">
          <Link to={href} className="av6-feed-action av6-feed-action--primary">OPEN PROJECT <Icon name="arrow" size={15}/></Link>
          <Link to={"/discover?category="+project.category} className="av6-feed-inline">{cat?.name||"Browse category"}</Link>
        </div>
      </div>
      <ProfileCard handle={project.creatorHandle} name={project.creatorName||project.creatorHandle} known={author}/>
    </div>
  </article>;
}
function DiscussionEntry({post,creators}:{post:CommunityPost;creators:readonly Creator[]}){
  const author=creators.find(c=>c.handle===post.authorHandle);
  const href="/community/posts/"+encodeURIComponent(post.id);
  return <article className="av6-feed-item av6-feed-discussion">
    <div className="av6-feed-record"><span>PUBLIC INDEX <b>/</b> DISCUSSION <b>/</b> {post.topic.toUpperCase()}</span><time dateTime={post.publishedAt}>{dateLabel(post.publishedAt)}</time></div>
    <div className="av6-feed-item-body">
      <span className="av6-discussion-emblem" aria-hidden="true">✳</span>
      <div className="av6-feed-description">
        <span className="av6-feed-eyebrow">APPROVED CONVERSATION</span>
        <h3><Link to={href}>{post.title}</Link></h3>
        <p>{post.excerpt}</p>
        <div className="av6-feed-action-row">
          <Link to={href} className="av6-feed-action av6-feed-action--primary">READ DISCUSSION <Icon name="arrow" size={15}/></Link>
          <span className="av6-feed-inline">{post.replyCount} {post.replyCount===1?"reply":"replies"} · {post.score} reactions</span>
        </div>
      </div>
      <ProfileCard handle={post.authorHandle} name={post.authorName||post.authorHandle} known={author}/>
    </div>
  </article>;
}

export function CommunityHomeFeed({projects,creators,state,communityEnabled}:Props){
  const [view,setView]=useState<View>("all");
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    if(!communityEnabled)return;
    const refresh=()=>{if(document.visibilityState==="visible")setRevision(value=>value+1);};
    const interval=window.setInterval(refresh,150000);
    document.addEventListener("visibilitychange",refresh);
    return()=>{window.clearInterval(interval);document.removeEventListener("visibilitychange",refresh);};
  },[communityEnabled]);
  const discussions=useResource(async signal=>{
    if(!communityEnabled)return {available:false,items:[] as CommunityPost[]};
    try{
      const page=await readCommunityPosts({sort:"new",limit:"8"},signal);
      return {available:true,items:page.items};
    }catch(error){
      if((error as {status?:number}).status===404)return {available:false,items:[] as CommunityPost[]};
      throw error;
    }
  },[communityEnabled,revision]);
  const postList=discussions.state==="ready"&&discussions.data.available?discussions.data.items:[];
  const entries:FeedItem[]=[
    ...projects.map(p=>({kind:"project" as const,key:"project:"+p.id,date:dateOrder(p.publishedAt),value:p})),
    ...postList.map(p=>({kind:"discussion" as const,key:"discussion:"+p.id,date:dateOrder(p.publishedAt),value:p}))
  ].filter(item=>view==="all"||(view==="projects"&&item.kind==="project")||(view==="discussions"&&item.kind==="discussion")).sort((a,b)=>b.date-a.date).slice(0,10);
  const postUnavailable=!communityEnabled||(discussions.state==="ready"&&!discussions.data.available);

  return <section className="av6-community-index" aria-labelledby="av6-index-title">
    <div className="av6-index-masthead">
      <div>
        <span className="av6-registry-line">ANEVUM / PUBLIC INDEX <span aria-hidden="true">—</span> VOL. 001</span>
        <h2 id="av6-index-title">Made by <em>people.</em></h2>
        <p>Discover what the community is creating, sharing, and discussing. Every entry links to a real published project or approved conversation.</p>
      </div>
      <Link to="/community" className="av6-header-action">EXPLORE THE COMMUNITY <Icon name="arrow" size={16}/></Link>
    </div>
    <div className="av6-index-layout">
      <div className="av6-index-main">
        <div className="av6-feed-toolbar">
          <div className="av6-feed-tabs" role="group" aria-label="Filter the public index">
            {(["all","projects","discussions"] as const).map(tab=><button key={tab} type="button" aria-pressed={view===tab} onClick={()=>setView(tab)}>{tab==="all"?"ALL ACTIVITY":tab==="projects"?"PROJECTS":"DISCUSSIONS"}</button>)}
          </div>
          <span className="av6-feed-order">LATEST APPROVED FIRST</span>
        </div>
        {state==="loading"&&<LoadingState label="Reading real public releases"/>}
        {state==="error"&&<ErrorState title="PUBLIC INDEX UNAVAILABLE" detail="The approved public catalogue could not be loaded. No sample members or fictional posts are substituted."/>}
        {view==="discussions"&&communityEnabled&&discussions.state==="loading"&&<LoadingState label="Checking approved conversations"/>}
        {view==="discussions"&&communityEnabled&&discussions.state==="error"&&<ErrorState title="DISCUSSIONS UNAVAILABLE" detail="The approved discussion index could not be reached."/>}
        {state==="ready"&&entries.map(entry=>entry.kind==="project"?
          <ProjectEntry key={entry.key} project={entry.value} creators={creators}/>:
          <DiscussionEntry key={entry.key} post={entry.value} creators={creators}/>)}
        {state==="ready"&&!entries.length&&!(view==="discussions"&&communityEnabled&&discussions.state==="loading")&&!(view==="discussions"&&communityEnabled&&discussions.state==="error")&&<div className="av6-index-empty">
          <span className="av6-registry-line">ARCHIVE / OPEN RECORD</span>
          <h3>{view==="discussions"&&postUnavailable?"The conversation space is preparing.":"The first entries are ahead."}</h3>
          <p>{view==="discussions"&&postUnavailable?"Public conversations appear only after the discussion system and its moderation controls are approved.":"Nothing has passed public review for this view yet. You can explore categories without signing in."}</p>
          <Link className="av6-feed-action av6-feed-action--primary" to={view==="discussions"?"/boards":"/discover"}>{view==="discussions"?"VISIT BOARDS":"BROWSE WORLDS"} <Icon name="arrow" size={15}/></Link>
        </div>}
        <div className="av6-index-footnote">INDEX POLICY / This view includes approved public records only. No synthetic members, rankings or engagement counts.</div>
      </div>
      <aside className="av6-index-aside" aria-label="Community index side panels">
        <section className="av6-aside-panel">
          <div className="av6-aside-heading"><span>01 / CATEGORY INDEX</span><span>PUBLIC</span></div>
          <h3>What’s new <em>by field.</em></h3>
          <p>Automatically drawn from the approved public catalogue; not editorial endorsements or engagement rankings.</p>
          <div className="av6-category-index">
            {categories.map(category=>{
              const latest=projects.filter(p=>p.category===category.id).sort((a,b)=>dateOrder(b.publishedAt)-dateOrder(a.publishedAt))[0];
              return <Link key={category.id} to={"/discover?category="+category.id}>
                <span className="av6-category-art" aria-hidden="true"><CosmicArtwork scene={category.scene}/></span>
                <span className="av6-category-label"><strong>{category.name}</strong><small>{latest?latest.title:"Explore this field"}</small></span>
                <Icon name="arrow" size={15}/>
              </Link>;
            })}
          </div>
        </section>
        <section className="av6-aside-panel">
          <div className="av6-aside-heading"><span>02 / CREATOR DIRECTORY</span><span>PUBLIC</span></div>
          <h3>Behind the work.</h3>
          {creators.length?<div className="av6-maker-list">{creators.map(c=><Link key={c.handle} to={"/creators/"+encodeURIComponent(c.handle)}>
            <span className="av6-maker-avatar" aria-hidden="true">{(c.displayName.charAt(0)||"A").toUpperCase()}</span>
            <span><strong>{c.displayName}</strong><small>@{c.handle}</small></span>
            <span className="av6-maker-count">{c.publishedProjects}</span>
          </Link>)}</div>:<p>Public creator channels appear after real, reviewed publications.</p>}
          <Link className="av6-aside-footer" to="/creators">FIND CREATORS <Icon name="arrow" size={14}/></Link>
        </section>
        <section className="av6-aside-panel av6-aside-commons">
          <div className="av6-aside-heading"><span>03 / COMMUNITY DESK</span><span>OPEN</span></div>
          <h3>Find your place.</h3>
          <p>Read the boards, find collaborators, and prepare your own work.</p>
          <Link to="/boards">PUBLIC BOARDS <Icon name="arrow" size={14}/></Link>
          <Link to="/create">CREATOR STUDIO <Icon name="arrow" size={14}/></Link>
          <Link to="/levels">ARTIFACTS & LEVELS <Icon name="arrow" size={14}/></Link>
        </section>
      </aside>
    </div>
  </section>;
}
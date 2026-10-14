import {useEffect,useMemo,useState} from "react";
import {Link} from "react-router-dom";
import {CosmicArtwork} from "../components/CosmicArtwork";
import type {CosmicScene} from "../components/CosmicIllustration";
import {readCategories,readCreators,readProjects,readStatus,type Category,type Creator,type Project,type CategoryCount} from "../lib/api";
import {useResource} from "../lib/useResource";
import {MorphActivityStream} from "./MorphActivityStream";
import {HotCommunityPosts} from "./HotCommunityPosts";
import "./morph-community-feed.css";
import "./community-network.css";

const SCENES:Record<Category,CosmicScene>={
 games:"games",tools:"tools",creative:"creative",learning:"learning",research:"research",
 automation:"automation",libraries:"libraries",other:"other"
};
const TOPICS:readonly {id:Category;label:string;tag:string}[]=[
 {id:"games",label:"Games",tag:"PLAY"},
 {id:"tools",label:"Software",tag:"BUILD"},
 {id:"creative",label:"Art & Creative",tag:"MAKE"},
 {id:"learning",label:"Learning",tag:"LEARN"},
 {id:"libraries",label:"Open Source",tag:"SHARE"},
 {id:"research",label:"Research",tag:"DISCOVER"}
];
function dateLabel(value:string|null){
 if(!value)return "RECENT RELEASE";
 const date=new Date(value);
 return Number.isFinite(date.getTime())?
   new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(date).toUpperCase():"RECENT RELEASE";
}
function creatorPath(handle:string){return "/atlas/creators/"+encodeURIComponent(handle);}
function projectPath(id:string){return "/atlas/experience/"+encodeURIComponent(id);}

/** One real-data community homepage. No fake discussion counts, invented people,
 * synthetic post reactions or unrelated first-party mini-games.
 */
export function MorphHomeConsole({onExplore}:{onExplore:()=>void}){
 const [refresh,setRefresh]=useState(0);
 const data=useResource(async signal=>{
   const [projects,creators,status,categories]=await Promise.allSettled([
     readProjects({sort:"new",limit:"24"},signal),
     readCreators({limit:"24"},signal),
     readStatus(signal),
     readCategories(signal)
   ]);
   return {
     projects:projects.status==="fulfilled"?projects.value.items:null,
     creators:creators.status==="fulfilled"?creators.value.items:null,
     status:status.status==="fulfilled"?status.value:null,
     categories:categories.status==="fulfilled"?categories.value.categories:null
   };
 },[refresh]);
 useEffect(()=>{
   const update=()=>{if(document.visibilityState==="visible")setRefresh(value=>value+1);};
   const timer=window.setInterval(update,120000);
   document.addEventListener("visibilitychange",update);
   return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",update);};
 },[]);

 const projects=useMemo(()=>data.state==="ready"&&data.data.projects?
   [...data.data.projects].sort((a,b)=>((Date.parse(b.publishedAt||"")||0)-(Date.parse(a.publishedAt||"")||0))||a.id.localeCompare(b.id))
   :[],[data]);
 const lead:Project|null=projects[0]||null;
 const makers:Creator[]=data.state==="ready"&&data.data.creators?
   [...data.data.creators].sort((a,b)=>b.publishedProjects-a.publishedProjects||a.handle.localeCompare(b.handle)).slice(0,5):[];
 const topics:CategoryCount[]=data.state==="ready"&&data.data.categories?data.data.categories:[];
 const reported=data.state==="ready"?data.data.status:null;
 const postOpen=reported?.features?.communityPosts===true;

 return <div className="nfc-home">
   <header className="nfc-intro">
     <div>
       <span className="nfc-eyebrow"><span className="nfc-indicator" aria-hidden="true"/> ANEVUM / COMMUNITY NETWORK</span>
       <h1>WHAT'S HAPPENING <em>ON ANEVUM?</em></h1>
       <p>New creations, useful conversations, and the people building things together.</p>
     </div>
     <nav className="nfc-intro-actions" aria-label="Community quick actions">
       <Link className="nfc-share" to="/atlas/create/new"><span aria-hidden="true">＋</span> SHARE A PROJECT</Link>
       <button type="button" onClick={onExplore}>EXPLORE <span aria-hidden="true">⌄</span></button>
     </nav>
   </header>

   <section className="nfc-network-strip" aria-label="Verified network information">
     <div><span>NETWORK</span><strong>PUBLIC CREATOR SPACE</strong></div>
     <div><span>RELEASES</span><strong>{reported?reported.counts.publishedProjects:"—"} APPROVED</strong></div>
     <div><span>CREATORS</span><strong>{reported?reported.counts.publishedCreators:"—"} PUBLISHED CHANNELS</strong></div>
     <button type="button" onClick={()=>setRefresh(value=>value+1)} aria-label="Refresh public network information">↻ <span>SYNC</span></button>
   </section>

   <div className="nfc-layout">
     <main className="nfc-main" aria-label="Public submissions and network activity">
       <div className="nfc-region-heading">
         <div><span className="nfc-eyebrow">SUBMISSIONS / SELECTED WORK</span><h2>FROM THE <em>NETWORK.</em></h2></div>
         <Link to="/atlas/discover">BROWSE PROJECTS ↗</Link>
       </div>
       {lead?<article className="nfc-spotlight">
         <Link to={projectPath(lead.id)} className="nfc-spotlight-visual" aria-label={"Explore "+lead.title}>
           <CosmicArtwork scene={SCENES[lead.category]}/>
           <span>CATEGORY ARTWORK</span>
         </Link>
         <div className="nfc-spotlight-content">
           <span className="nfc-spotlight-label">PUBLIC RELEASE / {lead.category.toUpperCase()}</span>
           <h3><Link to={projectPath(lead.id)}>{lead.title}</Link></h3>
           <p>{lead.summary}</p>
           <Link to={creatorPath(lead.creatorHandle)} className="nfc-spotlight-creator">BY {lead.creatorName} · @{lead.creatorHandle}</Link>
           <div className="nfc-spotlight-actions">
             <Link to={projectPath(lead.id)}>EXPLORE PROJECT <span aria-hidden="true">↗</span></Link>
             <span>{dateLabel(lead.publishedAt)}</span>
           </div>
         </div>
       </article>:
       <section className="nfc-spotlight-empty" aria-label="Awaiting approved community creations">
         <span aria-hidden="true">✳</span>
         <div><strong>THE NEXT FEATURED CREATION COULD BE YOURS.</strong>
           <p>{data.state==="loading"?"Finding approved projects…":
             data.state==="ready"&&data.data.projects===null?"Approved releases are temporarily unavailable.":
             "This space will feature real community submissions after they're approved. No demo projects are substituted."}</p>
           <Link to="/atlas/discover">EXPLORE THE CATALOGUE ↗</Link>
         </div>
       </section>}
       <MorphActivityStream/>
       <section className="cnb-home-bridge" aria-labelledby="cnb-home-heading">
         <span className="cnb-kicker">ANEVUM / CONNECTED COMMUNITY</span>
         <h2 id="cnb-home-heading">THE WORLD BEYOND A RELEASE.</h2>
         <p>Every public project connects to a creator, a category, and the wider community. Find first-time makers, browse verified releases, or read approved discussions.</p>
         <div className="cnb-home-links">
           <Link to="/atlas/boards">DISCOVERY & CREATOR BOARDS ↗</Link>
           <Link to="/atlas/community">COMMUNITY ROOMS ↗</Link>
           <Link to="/atlas/levels">EARNED RECOGNITION ↗</Link>
         </div>
       </section>
     </main>

     <aside className="nfc-sidebar" aria-label="Discussions, members and topics">
       <HotCommunityPosts/>
       <section className="nfc-module nfc-makers" aria-labelledby="nfc-makers-title">
         <div className="nfc-module-heading"><div><span className="nfc-eyebrow">PUBLIC CHANNELS / PEOPLE</span>
           <h2 id="nfc-makers-title">MEET THE <em>MAKERS.</em></h2></div>
           <Link to="/atlas/creators" aria-label="All published creator profiles">↗</Link></div>
         {makers.length?<div className="nfc-maker-list">
           {makers.map((creator,i)=><Link to={creatorPath(creator.handle)} key={creator.handle} className="nfc-maker">
             <span className="nfc-maker-avatar" aria-hidden="true">{creator.displayName.charAt(0).toUpperCase()}</span>
             <span className="nfc-maker-details"><strong>{creator.displayName}</strong><small>@{creator.handle} · {creator.publishedProjects} APPROVED {creator.publishedProjects===1?"RELEASE":"RELEASES"}</small></span>
             <span className="nfc-maker-arrow" aria-hidden="true">↗</span>
           </Link>)}
         </div>:<div className="nfc-module-empty">
           <p>{data.state==="loading"?"Loading creator profiles…":
             data.state==="ready"&&data.data.creators===null?"Creator channels are temporarily unavailable.":
             "Verified creator channels will appear as real projects are published."}</p>
         </div>}
         <div className="nfc-module-footer"><Link to="/atlas/creators">VIEW ALL CREATORS ↗</Link></div>
       </section>

       <section className="nfc-module nfc-topics" aria-labelledby="nfc-topics-title">
         <div className="nfc-module-heading"><div><span className="nfc-eyebrow">EXPLORE / CREATIVE CHANNELS</span>
           <h2 id="nfc-topics-title">YOUR <em>CORNER.</em></h2></div></div>
         <div className="nfc-topic-list">
           {TOPICS.map((topic,i)=>{
             const count=topics.find(item=>item.category===topic.id)?.count;
             return <Link to={"/atlas/discover?category="+topic.id} key={topic.id} className="nfc-topic">
               <span className="nfc-topic-index">{String(i+1).padStart(2,"0")}</span>
               <span className="nfc-topic-label"><strong>{topic.label}</strong><small>{topic.tag}</small></span>
               <span className="nfc-topic-count">{count===undefined?"—":count}</span>
               <span className="nfc-topic-arrow" aria-hidden="true">↗</span>
             </Link>;
           })}
         </div>
       </section>
       <aside className="nfc-curation-note" aria-label="Network editorial status">
         <span>IREN / NETWORK CURATION</span>
         <p>{postOpen?
           "Verified public discussions and approved submissions can appear in this network view.":
           "IREN editorial automation and community post publication are not enabled here yet. Feed items currently come from approved public projects."}</p>
         <Link to="/atlas/status">VIEW NETWORK STATUS ↗</Link>
       </aside>
     </aside>
   </div>
   <footer className="nfc-footer"><span>ANEVUM / CREATOR COMMUNITY</span><span>REAL SUBMISSIONS · VERIFIED PROFILES · MODERATED CONVERSATIONS WHEN AVAILABLE</span></footer>
 </div>;
}

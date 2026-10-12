import { Link, useParams } from "react-router-dom";
import { readCreator, readCreators, readProjects } from "../lib/api";
import { useResource } from "../lib/useResource";
import { ProjectCard } from "../components/ProjectCard";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { OrbitalMark } from "../components/OrbitalMark";

export function CreatorsPage(){
 const data=useResource(signal=>readCreators({},signal),[]);
 return <><section className="page-masthead"><div><span className="kicker">PEOPLE / PUBLIC CREATORS</span><h1>MEET THE<br/><em>MAKERS.</em></h1></div><p>Creator profiles only appear after approved public work exists. No placeholder accounts or fabricated follower counts.</p></section>{data.state==="loading"&&<LoadingState/>}{data.state==="error"&&<ErrorState/>}{data.state==="ready"&&(data.data.items.length?<section className="creator-grid">{data.data.items.map((c,i)=><Link to={`/creators/${encodeURIComponent(c.handle)}`} className={`creator-poster creator-poster-${i%3}`} key={c.handle}><span className="creator-number">0{i+1}</span><OrbitalMark className="creator-mark"/><strong>{c.displayName}</strong><small>@{c.handle} / {c.publishedProjects} PUBLISHED</small></Link>)}</section>:<EmptyState title="THE FIRST CREATOR PROFILES ARE STILL AHEAD" detail="Profiles become public when they have approved published work."/>)}</>;
}

export function CreatorPage(){
 const {handle=""}=useParams();
 const data=useResource(async signal=>{const [profile,projects]=await Promise.all([readCreator(handle,signal),readProjects({creator:handle,limit:"24"},signal)]);return {profile:profile.creator,projects};},[handle]);
 if(data.state==="loading")return <LoadingState label="Opening creator channel"/>;
 if(data.state==="error")return <ErrorState title="CREATOR NOT AVAILABLE" detail="This creator does not have a public profile or the catalogue could not be reached."/>;
 const {profile,projects}=data.data;
 return <><section className="creator-hero"><div className="creator-avatar-large"><OrbitalMark/></div><div><span className="kicker">CREATOR CHANNEL</span><h1>{profile.displayName}</h1><p>@{profile.handle}</p><strong>{profile.publishedProjects} PUBLISHED {profile.publishedProjects===1?"PROJECT":"PROJECTS"}</strong></div></section><div className="section-heading"><div><span className="kicker">RELEASES</span><h2>PUBLISHED WORK</h2></div></div>{projects.items.length?<section className="project-grid">{projects.items.map(p=><ProjectCard key={p.id} project={p}/>)}</section>:<EmptyState title="NO AVAILABLE RELEASES" detail="This creator has no currently visible projects."/>}</>;
}

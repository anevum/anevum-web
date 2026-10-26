import {useState} from "react";
import {Link} from "react-router-dom";
import type {Project} from "../lib/api";
import {selectPlayer} from "../lib/player-registry";
import {ProjectThumbnail} from "./ProjectThumbnail";
import {CompactMemberIdentity} from "./CompactMemberIdentity";
import "./project-player-shell.css";
import {publicCreatorHandle} from "../lib/public-creator-handle";
import {isAnevumHostedRelease} from "../lib/project-hosting";

/** The public stage opens safe creator-hosted links. It never executes creator code. */
export function ProjectPlayerShell({project,demo,source}:{
  project:Project;demo:URL|null;source:URL|null;
}){
  const selection=selectPlayer(project.category,Boolean(demo),Boolean(source));
  const hosted=isAnevumHostedRelease(project.id,demo);
  const primaryLabel=hosted?"OPEN IN ANEVUM":selection.primaryAction;
  const primary=demo||source;
  const handle=publicCreatorHandle(project.creatorHandle);
  const credit=project.creatorName||"ANEVUM member";
  const longTitle=project.title.length>50;
  const longSummary=project.summary.length>240;
  const [shareStatus,setShareStatus]=useState("");

  async function shareProject(){
    const url=new URL(import.meta.env.BASE_URL+"projects/"+encodeURIComponent(project.id),window.location.origin).href;
    try{
      if(typeof navigator.share==="function"){
        await navigator.share({title:project.title,url});
        setShareStatus("Project shared.");
      }else if(navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(url);
        setShareStatus("Project link copied.");
      }else{
        setShareStatus("Copy this project's URL from your browser address bar.");
      }
    }catch{
      setShareStatus("Sharing was canceled or is unavailable.");
    }
  }

  return <div className="avp-stage-column">
    <section className={"avp-stage avp-stage--"+selection.kind+(longTitle?" avp-stage--long-title":"")} aria-labelledby="avp-project-title">
      <div className="avp-stage-art" aria-hidden="true"><ProjectThumbnail kind={project.category} title={project.title} priority decorative/></div>
      <div className="avp-stage-shade" aria-hidden="true"/>
      <div className="avp-stage-top">
        <span>ANEVUM / EXPERIENCE SYSTEMS</span>
        <span className="avp-state">{hosted?"ANEVUM-HOSTED":selection.status}</span>
      </div>
      <div className="avp-stage-body">
        <span className="avp-stage-kicker">{selection.format} / {project.category.toUpperCase()}</span>
        <h1 id="avp-project-title">{project.title}</h1>
        <p className={"avp-stage-summary"+(longSummary?" avp-stage-summary--long":"")}>{project.summary}</p>
        {longSummary&&<a className="avp-stage-readmore" href="#avp-about">READ FULL SUMMARY <span aria-hidden="true">↓</span></a>}
        <div className="avp-stage-actions">
          {primary&&selection.primaryAction?
            <a className="avp-primary-action" href={primary.href} target="_blank" rel="noopener noreferrer"
              aria-label={primaryLabel+" at "+primary.hostname+" (opens in a new tab)"}>
              {primaryLabel}<span aria-hidden="true">↗</span>
            </a>:
            <span className="avp-no-action">NO PUBLIC EXPERIENCE LINKED</span>}
          {demo&&source&&
            <a className="avp-secondary-action" href={source.href} target="_blank" rel="noopener noreferrer"
              aria-label={"View source at "+source.hostname+" (opens in a new tab)"}>
              VIEW SOURCE <span aria-hidden="true">↗</span>
            </a>}
        </div>
        <p className="avp-stage-handoff">{hosted?"Opens this published release in the isolated ANEVUM browser player. Device compatibility is not yet verified.":selection.explanation}</p>
      </div>
      <div className="avp-stage-foot">
        <span>{primary?"DESTINATION / "+primary.hostname:"PUBLIC MEDIA / NOT AVAILABLE"}</span>
        <span>{hosted?"ANEVUM PLAYER OPENS IN A NEW TAB":"EXTERNAL LINKS OPEN IN A NEW TAB"}</span>
      </div>
    </section>
    <div className="avp-stage-identity">
      {handle?<Link className="avp-creator-credit" to={"/creators/"+encodeURIComponent(handle)}>
        <CompactMemberIdentity interactive={false} size="compact" className="av65-project-channel" member={{handle,displayName:credit,avatar:false,level:null,featuredAwards:[],source:'creator-channel'}}/>
        <span aria-hidden="true">↗</span>
      </Link>:<div className="avp-creator-credit" aria-label="Public creator channel not linked">
        <span><strong>{credit}</strong><br/><small>Public creator channel not linked</small></span>
      </div>}
      <nav className="avp-stage-shortcuts" aria-label="Project participation">
        <a href="#avp-participation">PARTICIPATE</a>
        <a href="#avp-discussion">COMMUNITY</a>
        <button type="button" onClick={()=>{void shareProject();}}>SHARE</button>
      </nav>
    </div>
    {shareStatus&&<p className="avp-share-status" role="status">{shareStatus}</p>}
  </div>;
}

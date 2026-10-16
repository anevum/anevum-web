import {useState} from "react";
import {Link} from "react-router-dom";
import type {Project} from "../lib/api";
import {selectPlayer} from "../lib/player-registry";
import {CosmicArtwork} from "./CosmicArtwork";
import "./project-player-shell.css";

/** The public stage opens safe creator-hosted links. It never executes creator code. */
export function ProjectPlayerShell({project,demo,source}:{
  project:Project;demo:URL|null;source:URL|null;
}){
  const selection=selectPlayer(project.category,Boolean(demo),Boolean(source));
  const primary=demo||source;
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
    <section className={"avp-stage avp-stage--"+selection.kind} aria-labelledby="avp-project-title">
      <div className="avp-stage-art" aria-hidden="true"><CosmicArtwork scene={project.category} priority/></div>
      <div className="avp-stage-shade" aria-hidden="true"/>
      <div className="avp-stage-top">
        <span>ANEVUM / EXPERIENCE SYSTEMS</span>
        <span className="avp-state">{selection.status}</span>
      </div>
      <div className="avp-stage-body">
        <span className="avp-stage-kicker">{selection.format} / {project.category.toUpperCase()}</span>
        <h1 id="avp-project-title">{project.title}</h1>
        <p className="avp-stage-summary">{project.summary}</p>
        <div className="avp-stage-actions">
          {primary&&selection.primaryAction?
            <a className="avp-primary-action" href={primary.href} target="_blank" rel="noopener noreferrer"
              aria-label={selection.primaryAction+" at "+primary.hostname+" (opens in a new tab)"}>
              {selection.primaryAction}<span aria-hidden="true">↗</span>
            </a>:
            <span className="avp-no-action">NO PUBLIC EXPERIENCE LINKED</span>}
          {demo&&source&&
            <a className="avp-secondary-action" href={source.href} target="_blank" rel="noopener noreferrer"
              aria-label={"View source at "+source.hostname+" (opens in a new tab)"}>
              VIEW SOURCE <span aria-hidden="true">↗</span>
            </a>}
        </div>
        <p className="avp-stage-handoff">{selection.explanation}</p>
      </div>
      <div className="avp-stage-foot">
        <span>{primary?"DESTINATION / "+primary.hostname:"PUBLIC MEDIA / NOT AVAILABLE"}</span>
        <span>EXTERNAL LINKS OPEN IN A NEW TAB</span>
      </div>
    </section>
    <div className="avp-stage-identity">
      <Link className="avp-creator-credit" to={"/creators/"+encodeURIComponent(project.creatorHandle)}>
        <span className="avp-creator-emblem" aria-hidden="true">✳</span>
        <span><small>CREATED BY</small><strong>{project.creatorName} / @{project.creatorHandle}</strong></span>
        <span aria-hidden="true">↗</span>
      </Link>
      <nav className="avp-stage-shortcuts" aria-label="Project participation">
        <a href="#avp-participation">RATE / SAVE</a>
        <a href="#avp-discussion">COMMUNITY</a>
        <button type="button" onClick={()=>{void shareProject();}}>SHARE</button>
      </nav>
    </div>
    {shareStatus&&<p className="avp-share-status" role="status">{shareStatus}</p>}
  </div>;
}
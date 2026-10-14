import {useState} from "react";
import {Link} from "react-router-dom";
import type {Creator,PublicCreatorShowcase} from "../lib/api";
import {CelestialEmblem} from "./CelestialEmblem";
import {achievementMotif,seriesOneArtifactMotif} from "../lib/artifact-art";

type Props={
  handle:string;
  name:string;
  known?:Creator;
  showcase?:PublicCreatorShowcase|null;
  variant?:"feed"|"post";
};

/** V007 production component. Only renders verified public API fields.
 * Sample identities, forged medal counts and preview-only art are forbidden.
 * Post attachments are never interpreted as member-owned inventory.
 */
export function PublicAuthorShowcase({handle,name,known,showcase,variant="feed"}:Props){
  const [detail,setDetail]=useState<{title:string;body:string}|null>(null);
  const href="/creators/"+encodeURIComponent(handle);
  const level=showcase&&Number.isSafeInteger(showcase.level)&&showcase.level>=1?showcase.level:null;
  const currentArtifact=typeof showcase?.currentArtifact==="string"?showcase.currentArtifact:null;
  const equipped=typeof showcase?.equippedArtifact?.name==="string"?showcase.equippedArtifact.name:null;
  const artifact=equipped||currentArtifact;
  const awards=Array.isArray(showcase?.featuredAwards)?showcase.featuredAwards.slice(0,3):[];
  const toggle=(title:string,body:string)=>setDetail(old=>old?.title===title?null:{title,body});

  return <aside className={`av6-author av7-author av7-author--${variant}`} aria-label={"Public creator profile of "+name}>
    <span className="av6-author-label av7-register">ANEVUM / CREATOR DOSSIER</span>
    <Link to={href} className="av6-author-person av7-identity">
      <span className="av6-author-avatar av7-avatar" aria-hidden="true">{(name.trim()[0]||handle[0]||"A").toUpperCase()}</span>
      <span className="av6-author-identity">
        <strong>{name}</strong>
        <small>@{handle}</small>
      </span>
    </Link>
    {level!==null&&<div className="av7-level-panel">
      <span className="av7-section-name">VERIFIED LEVEL</span>
      <button type="button" className="av7-level-button" aria-label={`Level ${level}. Show level information`}
        aria-expanded={detail?.title==="LEVEL "+level} onClick={()=>toggle("LEVEL "+level,
          "Level and current artifact are derived from verified ANEVUM progression, not member-entered scores.")}>
        <span className="av7-level-crest">
          <CelestialEmblem motif={seriesOneArtifactMotif(currentArtifact)} size="small" state="earned"/>
          <b>{level}</b>
        </span>
        <span className="av7-level-copy"><strong>LEVEL {String(level).padStart(2,"0")}</strong>
          <small>Member progression</small></span>
      </button>
    </div>}
    {artifact&&<div className="av7-artifact-panel">
      <span className="av7-section-name">{equipped?"EQUIPPED ARTIFACT":"CURRENT ARTIFACT"}</span>
      <button type="button" className="av7-artifact-button" aria-expanded={detail?.title===artifact}
        onClick={()=>toggle(artifact,equipped?
          "This Series One artifact has been chosen for public display from items already earned by this member.":
          "This is the current artifact confirmed by the ANEVUM progression service. The member has not yet equipped a personal selection.")}>
        <span className="av7-item-face" aria-hidden="true"><CelestialEmblem
          motif={seriesOneArtifactMotif(artifact)} size="small" state="earned"/></span>
        <span className="av7-item-meta"><strong>{artifact}</strong><small>SERIES ONE / EARNED</small></span>
      </button>
    </div>}
    {awards.length>0&&<div className="av7-award-panel">
      <span className="av7-section-name">CHOSEN AWARDS / {String(awards.length).padStart(2,"0")}</span>
      <div className="av7-awards" role="group" aria-label="Member-selected earned awards">
        {awards.map(award=><button type="button" key={award.key} className="av7-award"
           aria-label={award.name+": "+award.description}
           aria-pressed={detail?.title===award.name}
           onClick={()=>toggle(award.name,award.description)}>
          <CelestialEmblem motif={achievementMotif(award.key)||"orbital"} size="small" state="earned"/>
          <span>{award.name}</span>
        </button>)}
      </div>
    </div>}
    {detail&&<div className="av7-detail" role="status">
      <strong>{detail.title}</strong><p>{detail.body}</p>
      <button type="button" onClick={()=>setDetail(null)} aria-label="Close showcase detail">CLOSE</button>
    </div>}
    <div className="av7-card-footer">
      {known&&<span className="av6-author-stat">{known.publishedProjects} {known.publishedProjects===1?"public work":"public works"}</span>}
      <Link to={href} className="av6-author-visit">VIEW CHANNEL <span aria-hidden="true">↗</span></Link>
    </div>
  </aside>;
}

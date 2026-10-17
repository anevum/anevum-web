import {useState} from "react";
import {Link} from "react-router-dom";
import type {Creator,PublicCreatorShowcase} from "../lib/api";
import {CelestialEmblem} from "./CelestialEmblem";
import {achievementMotif} from "../lib/artifact-art";
import {LevelEmblem,LEVEL_ARTIFACTS} from './LevelEmblem';
import {CompactMemberIdentity} from './CompactMemberIdentity';

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
  const level=showcase&&Number.isSafeInteger(showcase.level)&&showcase.level>=1&&showcase.level<=30?showcase.level:null;
  const currentArtifact=typeof showcase?.currentArtifact==="string"?showcase.currentArtifact:null;
  const desiredArtifact=showcase?.equippedArtifact?.name;
  const equipped=typeof desiredArtifact==="string"&&LEVEL_ARTIFACTS.some(a=>a.name===desiredArtifact&&a.level<=(level??0))?desiredArtifact:null;
  const artifact=level!==null&&LEVEL_ARTIFACTS[level-1]?.name===currentArtifact?equipped||currentArtifact:null;
  const awards=Array.isArray(showcase?.featuredAwards)?showcase.featuredAwards.slice(0,3):[];
  const toggle=(title:string,body:string)=>setDetail(old=>old?.title===title?null:{title,body});

  return <aside className={`av6-author av7-author av7-author--${variant}`} aria-label={"Public creator profile of "+name}>
    <span className="av6-author-label av7-register">ANEVUM / CREATOR DOSSIER</span>
    <CompactMemberIdentity member={{handle,displayName:name,avatar:false,level:null,featuredAwards:[],source:'creator-channel'}} href={href} className="av65-channel-identity" size="standard"/>
    {level!==null&&<div className="av7-level-panel">
      <span className="av7-section-name">VERIFIED LEVEL</span>
      <button type="button" className="av7-level-button" aria-label={`Level ${level}. Show level information`}
        aria-expanded={detail?.title==="LEVEL "+level} onClick={()=>toggle("LEVEL "+level,
          "Level and current artifact are derived from verified ANEVUM progression, not member-entered scores.")}>
        <span className="av7-level-crest">
          <LevelEmblem level={level} size={46}/>
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
          "This Evolution of Everything specimen was selected from levels earned by this creator.":
          "This is the current artifact confirmed by the ANEVUM progression service. The member has not yet equipped a personal selection.")}>
        <span className="av7-item-face" aria-hidden="true"><LevelEmblem level={level!} size={36}/></span>
        <span className="av7-item-meta"><strong>{artifact}</strong><small>EVOLUTION / EARNED</small></span>
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

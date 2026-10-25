import {useEffect,useRef} from 'react';
import {Link} from 'react-router-dom';
import {ProjectThumbnail} from '../components/ProjectThumbnail';
import {Icon} from '../components/Icons';
import type {Project} from '../lib/api';
import type {CreatorPackageCard} from '../lib/creator-package-gallery-v010';
import {projectDetailPath} from '../lib/navigation';
import {publicCreatorHandle} from '../lib/public-creator-handle';
import {useLivingWorld,type WorldSector} from './LivingWorldState';
import './artifact-lens-v136.css';

/** Only records already admitted to the public catalogue may be inspected.
 * All details are drawn from the same approved API response as the cards:
 * no inferred statistics, promotion, entitlements, audience or creator handle.
 */
export type ArtifactSelection=
 | {kind:'project';project:Project}
 | {kind:'package';work:CreatorPackageCard};
const packageSector:Record<string,WorldSector>={
  game:'games',app:'tools',simulation:'research',story:'creative'
};
function publicSector(selection:ArtifactSelection):WorldSector{
  return selection.kind==='project'?selection.project.category:
    packageSector[selection.work.category]||'portal';
}
function categoryLabel(category:string){
  const labels:Record<string,string>={
    games:'GAMES',tools:'APPLICATIONS & TOOLS',creative:'ART & CREATION',
    libraries:'LIBRARIES',automation:'AUTOMATION',research:'RESEARCH',
    learning:'LEARNING',other:'INDEPENDENT PROJECT',
    game:'BROWSER GAME',app:'BROWSER APPLICATION',
    simulation:'SIMULATION',story:'INTERACTIVE STORY'
  };
  return labels[category]||'APPROVED PROJECT';
}
function dateLabel(input:string|number|null){
  if(input===null)return null;
  const value=typeof input==='number'?input*1000:Date.parse(input);
  if(!Number.isFinite(value))return null;
  return new Date(value).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
}
export function ArtifactLensV136({selection,returnTo,onClose}:{
  selection:ArtifactSelection;returnTo:string;onClose:()=>void
}){
  const modal=useRef<HTMLDialogElement>(null);
  const {setPreviewSector}=useLivingWorld();
  const sector=publicSector(selection);
  const item=selection.kind==='project'?selection.project:selection.work;
  const isProject=selection.kind==='project';
  const creator=isProject?publicCreatorHandle(selection.project.creatorHandle):null;
  const detail=isProject?projectDetailPath(selection.project.id,returnTo):null;
  const published=dateLabel(item.publishedAt);
  useEffect(()=>{
    const dialog=modal.current;
    if(!dialog)return;
    if(!dialog.open)dialog.showModal();
    setPreviewSector(sector);
    return()=>{
      setPreviewSector(null);
      if(dialog.open)dialog.close();
    };
  },[sector,setPreviewSector]);
  return <dialog ref={modal} className="p136-artifact-lens" aria-labelledby="p136-artifact-title"
    aria-describedby="p136-artifact-summary"
    onCancel={event=>{event.preventDefault();onClose();}}
    onClose={onClose}
    onClick={event=>{if(event.target===modal.current)onClose();}}>
    <div className="p136-artifact-lens-shell" data-artifact-kind={selection.kind} data-artifact-sector={sector}>
      <header className="p136-artifact-lens-header">
        <span><span className="p136-artifact-lens-signal" aria-hidden="true"/> ANEVUM / ARTIFACT LENS</span>
        <button type="button" onClick={onClose} className="p136-artifact-lens-close"
          aria-label="Close artifact details"><Icon name="close" size={20}/></button>
      </header>
      <div className="p136-artifact-lens-grid">
        <div className="p136-artifact-lens-visual" aria-label="Creator thumbnail if supplied; otherwise ANEVUM default">
          <ProjectThumbnail kind={item.category} title={item.title}
            uploadedUrl={selection.kind==='package'?selection.work.coverUrl:null} priority decorative/>
          <span className="p136-artifact-lens-art-note">CREATOR IMAGE IF AVAILABLE / ANEVUM DEFAULT OTHERWISE</span>
          <span className="p136-artifact-lens-visual-lines" aria-hidden="true"/>
        </div>
        <div className="p136-artifact-lens-info">
          <span className="p136-artifact-lens-kicker">PUBLIC INDEX / {categoryLabel(item.category)}</span>
          <h2 id="p136-artifact-title">{item.title}</h2>
          <p id="p136-artifact-summary">{item.summary}</p>
          <dl className="p136-artifact-lens-facts">
            <div><dt>RELEASE</dt><dd>{isProject?'Approved public listing':'Approved browser package'}</dd></div>
            <div><dt>ACCESS</dt><dd>{isProject
              ?selection.project.freeToUse?'Creator-declared free':'No independent price verification'
              :'Price and access not independently verified'}</dd></div>
            {isProject
              ?<><div><dt>CREATOR</dt><dd>{selection.project.creatorName||'Public creator name unavailable'}</dd></div>
                {selection.project.license&&<div><dt>LICENSE</dt><dd>{selection.project.license}</dd></div>}</>
              :<div><dt>BUILD</dt><dd>{selection.work.version}</dd></div>}
            {published&&<div><dt>PUBLISHED</dt><dd>{published}</dd></div>}
          </dl>
          <div className="p136-artifact-lens-actions">
            {detail&&<Link to={detail} className="p136-artifact-lens-primary"
              onClick={onClose}>Open project record <Icon name="arrow" size={17}/></Link>}
            {!isProject&&selection.work.playUrl&&<a href={selection.work.playUrl}
              className="p136-artifact-lens-primary" onClick={onClose}>
              Open approved release <Icon name="arrow" size={17}/></a>}
            {creator&&<Link to={'/creators/'+encodeURIComponent(creator)}
              onClick={onClose} className="p136-artifact-lens-secondary">
              Creator profile <Icon name="arrow" size={16}/></Link>}
            <button type="button" onClick={onClose}
              className="p136-artifact-lens-secondary">Return to results</button>
          </div>
          <p className="p136-artifact-lens-disclosure">This inspection uses existing public catalogue information. Private drafts, unpublished assets and unverified activity are not included.</p>
        </div>
      </div>
    </div>
  </dialog>;
}

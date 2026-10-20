import {useEffect,useState} from 'react';
import {readPackageGallery,type CreatorPackageCard,type PackageGalleryMode,type PackageGalleryResult} from '../lib/creator-package-gallery-v010';
import './creator-package-gallery-v010.css';
import {nativeCreatorEnabled,nativePlayerPath,nativeBuildPath} from '../lib/native-creator-v095';

/** This flag is build-time OFF unless the backend, author binding and public
 * identity protections were separately accepted and enabled.
 * This panel only reads approved/public or authenticated-owner package APIs.
 */
export const packageGalleryUIEnabled=import.meta.env.VITE_PACKAGE_CREATOR_GALLERY_V010==='true';
type State={kind:'loading'|'ready'|'missing'|'error';data:PackageGalleryResult|null;message:string};
function statusLabel(p:CreatorPackageCard,mode:PackageGalleryMode){
 if(mode==='public')return 'APPROVED RELEASE';
 if(p.draftStatus==='ready')return p.status==='published'?'LIVE + PRIVATE UPDATE':'PRIVATE BUILD READY';
 if(p.draftStatus==='pending_review')return p.status==='published'?'LIVE + UPDATE IN REVIEW':'INDEPENDENT REVIEW';
 if(p.status==='published')return 'PUBLISHED';
 if(p.status==='rejected'||p.draftStatus==='rejected')return 'CHANGES REQUESTED';
 return 'PRIVATE DRAFT';
}
export function WorkCard({work,mode,compact=false}:{work:CreatorPackageCard;mode:PackageGalleryMode;compact?:boolean}){
 const published=mode==='public'||work.status==='published';
 const publishedLabel=work.publishedAt
   ?new Date(work.publishedAt*1000).toLocaleDateString(undefined,{month:'short',year:'numeric'})
   :null;
 return <article className={'av010-work-card'+(compact?' av010-work-card--compact':'')} aria-label={work.title} data-package-id={work.id}>
  <div className={'av010-work-cover'+(work.coverUrl?' av010-work-cover--creator':'')} aria-label={work.coverUrl?'Creator-supplied project artwork':'ANEVUM project record without uploaded artwork'}>
   {work.coverUrl?<img src={work.coverUrl} alt={'Artwork uploaded for '+work.title} loading="lazy" decoding="async" referrerPolicy="same-origin"/>:
    <span className="av010-work-emblem" aria-hidden="true"><i/><i/><i/></span>}
   <span className="av010-work-cover-label">{work.category.toUpperCase()}</span>
  </div>
  <div className="av010-work-body">
   <div className="av010-work-readout">
    <span>{statusLabel(work,mode)}</span>
    <span>BUILD {String(work.version).padStart(2,'0')}</span>
   </div>
   <h3>{work.title}</h3>
   <p>{work.summary}</p>
   <div className="av010-work-actions">
    {work.playUrl&&<a href={nativeCreatorEnabled?import.meta.env.BASE_URL.replace(/\/$/,'')+nativePlayerPath(work.id):work.playUrl} className="av010-work-primary">PLAY RELEASE <span aria-hidden="true">↗</span></a>}
    {mode==='owner'&&work.previewUrl&&<a href={nativeCreatorEnabled?import.meta.env.BASE_URL.replace(/\/$/,'')+nativePlayerPath(work.id,true):work.previewUrl}>PRIVATE PLAYTEST ↗</a>}
    {mode==='owner'&&!work.previewUrl&&<a href={nativeCreatorEnabled?import.meta.env.BASE_URL.replace(/\/$/,'')+nativeBuildPath(work.id):'/upload/v3?update='+encodeURIComponent(work.id)}>MANAGE BUILD ↗</a>}
   </div>
   {publishedLabel&&<small className="av010-work-published">APPROVED · {publishedLabel}</small>}
   {published&&!publishedLabel&&mode==='public'&&<small className="av010-work-published">INDEPENDENTLY REVIEWED</small>}
  </div>
 </article>;
}
export function CreatorPackageGallery({mode,handle=null}:{mode:PackageGalleryMode;handle?:string|null}){
 const [state,setState]=useState<State>({kind:'loading',data:null,message:''});
 useEffect(()=>{
  if(!packageGalleryUIEnabled)return;
  const controller=new AbortController();
  setState({kind:'loading',data:null,message:''});
  readPackageGallery(mode,handle,controller.signal)
   .then(data=>{if(!controller.signal.aborted)setState({
     kind:data?'ready':'missing',data,message:''
   });})
   .catch(error=>{if(!controller.signal.aborted)setState({
     kind:'error',data:null,message:error instanceof Error?error.message:'Creator projects are temporarily unavailable.'
   });});
  return()=>controller.abort();
 },[mode,handle]);
 if(!packageGalleryUIEnabled||state.kind==='missing')return null;
 const owner=mode==='owner';
 const entries=state.data?.projects||[];
 return <section className="av010-package-gallery" aria-label={owner?'Your game and app creations':'Approved creator projects'}>
  <div className="av010-gallery-heading">
   <div><span className="kicker">CONTINUANCE / {owner?'YOUR CREATION LIBRARY':'PUBLISHED CREATIONS'}</span>
    <h2>{owner?'Your work, in orbit.':'Made by this member.'}</h2>
    <p>{owner?'Finished browser games and applications, private playtests and approved releases belong in one place.':
      'Games and applications this member has published through independent review.'}</p>
   </div>
   {owner&&<a href="/upload/v3" className="av010-gallery-upload">UPLOAD A CREATION ↗</a>}
  </div>
  {state.kind==='loading'&&<p className="av010-gallery-state" role="status">Checking verified project releases…</p>}
  {state.kind==='error'&&<p className="av010-gallery-state" role="status">{state.message}</p>}
  {state.kind==='ready'&&(
   entries.length>0?
    <div className="av010-work-grid">{entries.map(work=><WorkCard key={work.id} work={work} mode={mode}/>)}</div>:
    <div className="av010-gallery-empty">
     <span className="av010-gallery-empty-symbol" aria-hidden="true">✳</span>
     <div><strong>{owner?'No browser builds uploaded yet.':'No approved browser releases yet.'}</strong>
      <p>{owner?'Upload a finished ZIP or HTML game or app, test privately, then request review.':
       'Only real, approved releases appear here. Private drafts stay with their creators.'}</p></div>
    </div>
  )}
 </section>;
}

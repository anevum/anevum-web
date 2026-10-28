import {lazy,Suspense,type DragEvent,type FormEvent,useEffect,useRef,useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {canonicalAuthClient,canonicalMe,type CanonicalProfile} from '../lib/canonical-beta';
import {
 studioHealth,studioList,studioGet,studioCreate,studioUpdate,studioSubmit,studioAssets,
 studioUpload,studioCheckFile,studioDeleteAsset,studioDownloadUrl,studioWithdraw,studioDeleteProject,studioReviewQueue,
 studioEligibleUpload,studioReviewManifest,studioReviewReceipts,
 studioReviewDecision,type StudioDraft,type StudioProject,type StudioAsset,type StudioCategory,
 type StudioReviewProject,type StudioReviewHistory,type StudioReviewManifest,type StudioReviewReceipt,type StudioLargeAsset,type StudioLargeCapacity
} from '../lib/canonical-studio';
import './canonical-studio.css';
import {StudioLargeUploader} from '../components/StudioLargeUploader';
import {readWithDeadline} from '../../../shared/read-deadline.mjs';
import {nativeCreatorEnabled} from '../lib/native-creator-v095';
import {workbenchAlphaEnabled} from '../lib/workbench-alpha';
import {NativeStudioNavigation} from './NativeCreatorStudio';
import {resolveStudioEntry} from '../lib/studio-entry-read';
const WorkbenchAlphaEntryGate=lazy(()=>import('./WorkbenchAlpha').then(m=>({default:m.WorkbenchAlphaEntryGate})));

const CATEGORY_GUIDE:Record<StudioCategory,string>={
 games:'Upload a browser-game ZIP or link an external HTTPS game. Private Studio ZIPs do not become playable automatically. An approved hosted release has a separate review and publication process.',
 tools:'Attach a web app build ZIP or an existing HTTPS application for private review. Use playable upload when preparing an in-browser release.',
 creative:'Attach original creative work, audio, images, writing or a ZIP.',
 music:'Attach MP3 or WAV audio. Files remain in private quarantine.',
 art:'Attach PNG, JPEG, WebP or GIF artwork. Images are not rendered from quarantine.',
 video:'Attach an MP4 or WebM to the private vault; the extended channel accepts media up to 1 GiB. Playback and publication require separate review.',
 writing:'Attach PDF, TXT or Markdown writing.',
 learning:'Attach a PDF, Markdown, text or interactive ZIP project.',
 research:'Attach research as PDF, TXT, Markdown or ZIP.',
 other:'Attach a supported image, audio, video, document or ZIP file.'
};
const CATEGORIES:[StudioCategory,string][]=[
 ['games','Games & interactive play'],['tools','Applications & tools'],
 ['creative','Creative experiments'],['music','Music & audio'],['art','Artwork'],
 ['video','Film & animation'],['writing','Writing & documents'],
 ['learning','Learning'],['research','Research'],['other','Other work']
];
const empty:StudioDraft={slug:'',title:'',summary:'',description:'',category:'games',freeToUse:true,
 license:'',sourceUrl:null,demoUrl:null,aiDisclosure:'',humanContribution:''};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const pretty=(value:string)=>value.replaceAll('_',' ').toUpperCase();
const size=(bytes:number)=>(bytes/1048576).toFixed(2)+' MiB';
const editable=(project:StudioProject)=>['draft','changes_requested'].includes(project.status);
const editForm=(p:StudioProject):StudioDraft=>({
 slug:p.slug,title:p.title,summary:p.summary,description:p.description,category:p.category,
 freeToUse:p.freeToUse,license:p.license,sourceUrl:p.sourceUrl,demoUrl:p.demoUrl,
 aiDisclosure:p.aiDisclosure,humanContribution:p.humanContribution
});
const showError=(e:unknown)=>e instanceof Error?e.message:'Creator Studio is temporarily unavailable.';
type Mode='list'|'new'|'edit'|'review';

export function CanonicalStudioPage({mode='list'}:{mode?:Mode}){
 const {data:session,isPending}=canonicalAuthClient.useSession();
 const {projectId}=useParams();
 const id=session?.user?.id;
 if(isPending)return <section className="st-status" role="status">VERIFYING CANONICAL MEMBER SESSION…</section>;
 if(!id||session?.user?.emailVerified!==true)return <section className="st-status">
  <span className="st-kicker">CONTINUANCE INSTITUTE / CREATOR STUDIO</span>
  <h1>SIGN IN TO CREATE.</h1><p>Private drafts belong to your verified ANEVUM account.</p>
  <Link className="st-action" to="/join">MEMBER SIGN-IN ↗</Link>
 </section>;
 // Remount before rendering another member or project. Private records,
 // file queues, review decisions and in-flight completions stay with that view.
 return <SessionStudio key={id+':'+mode+':'+(projectId||'')} id={id} mode={mode}/>;
}
function SessionStudio({id,mode}:{id:string;mode:Mode}){
 const [attempt,setAttempt]=useState(0);
 const [identity,setIdentity]=useState<CanonicalProfile|null>(null);
 const [phase,setPhase]=useState<'loading'|'ready'|'unavailable'|'incomplete'>('loading');
 const [message,setMessage]=useState('');
 const [uploads,setUploads]=useState(false);
 const [canReview,setCanReview]=useState(false);
 useEffect(()=>{
  let live=true;const controller=new AbortController();
  setPhase('loading');setMessage('');
  readWithDeadline(signal=>resolveStudioEntry(id,mode,signal,{
   profile:canonicalMe,health:studioHealth,list:studioList
  }),controller.signal).then(result=>{
   if(!live)return;
   if(result.phase!=='ready'){setPhase(result.phase);return;}
   // A list failure belongs to StudioLibrary, not to the authenticated hub.
   // Editor/reviewer capabilities remain independently server-verified.
   setIdentity(result.identity);setUploads(result.uploads);
   setCanReview(result.canReview);setPhase('ready');
  }).catch(e=>{if(live){setMessage(showError(e));setPhase('unavailable')}});
  return()=>{live=false;controller.abort();};
 },[id,attempt]);
 if(phase==='loading')return <section className="st-status" role="status">OPENING PRIVATE CREATOR STUDIO…</section>;
 if(phase==='unavailable')return <section className="st-status">
  <span className="st-kicker">CREATOR STUDIO / SERVICE STATUS</span><h1>STUDIO ACCESS UNAVAILABLE.</h1>
  <p>{message||'The Studio service is disabled or temporarily unavailable. No project information has been changed.'}</p>
  <button className="st-action" type="button" onClick={()=>setAttempt(n=>n+1)}>RETRY STUDIO ACCESS</button>
  <Link className="st-action" to="/member">RETURN TO MY SPACE ↗</Link>
 </section>;
 if(phase==='incomplete')return <section className="st-status">
  <span className="st-kicker">01 / CREATOR IDENTITY</span><h1>CLAIM YOUR HANDLE FIRST.</h1>
  <p>Complete your account profile before creating private projects.</p>
  <Link className="st-action" to="/member">OPEN MEMBER PROFILE ↗</Link>
 </section>;
 return <section className="st-root" aria-label="Creator Studio">
  <header className="st-header">
   <div><Link className="st-back" to="/member">← MEMBER ATLAS</Link>
    <p className="st-kicker">ANEVUM / CONTINUANCE INSTITUTE / CREATOR STUDIO</p>
    <h1>{mode==='review'?'SUBMISSION REVIEW.':mode==='list'?'YOUR CREATIVE ARCHIVE.':mode==='new'?'BEGIN A NEW WORK.':'PROJECT WORKSPACE.'}</h1>
    <p>Build privately, preserve versions, and prepare original work for independent review. Publication remains a separate, staff-approved step.</p>
   </div>
   <div className="st-identity"><span>VERIFIED CREATOR</span><strong>@{identity?.handle}</strong><small>PRIVATE VERIFIED WORKSPACE</small></div>
  </header>
  {nativeCreatorEnabled?<NativeStudioNavigation/>:<nav className="st-nav" aria-label="Studio navigation">
   <Link to="/studio/records" aria-current={mode==='list'?'page':undefined}>MY PROJECTS</Link>
   <Link to="/studio/new" aria-current={mode==='new'?'page':undefined}>NEW PRIVATE DRAFT</Link>
   <a href="/upload">PLAYABLE UPLOAD ↗</a>
   {canReview&&<Link to="/studio/review" aria-current={mode==='review'?'page':undefined}>REVIEW DESK</Link>}
   <Link to="/discover">DISCOVER ↗</Link>
  </nav>}
  {workbenchAlphaEnabled&&<Suspense fallback={null}><WorkbenchAlphaEntryGate/></Suspense>}
  {mode==='list'&&<section className="st-panel st-create-paths" aria-label="Choose your creation workflow">
   <div className="st-section-head"><div><p className="st-kicker">CREATOR STUDIO / START HERE</p>
    <h2>One identity. Three ways to begin.</h2></div></div>
   <div className="st-create-path-grid">
    <Link to="/studio/new"><strong>01 / PROJECT RECORD</strong><span>Describe and organize work privately. Attach eligible files when your account's upload capability is enabled.</span><small>PRIVATE DRAFT ↗</small></Link>
    {nativeCreatorEnabled?<Link to="/studio/packages"><strong>02 / PLAYABLE BUILD</strong><span>Prepare a browser-ready ZIP or standalone HTML file. Playtest the isolated build, then submit the exact revision for independent review.</span><small>OPEN PLAYABLE LIBRARY ↗</small></Link>:
     <a href="/upload/v3"><strong>02 / PLAYABLE BUILD</strong><span>Open the existing separate Creator Uplink. Native integration is not active in this release.</span><small>OPEN EXISTING UPLINK ↗</small></a>}
    <Link to="/studio/alpha"><strong>03 / LOCAL LAB</strong><span>Experiment with HTML and CSS without a cloud upload. Export one HTML file to your device when you are ready.</span><small>OPEN GUEST PLAYGROUND ↗</small></Link>
   </div>
   <p className="st-muted">These are different stages of one creation lifecycle. Neither saving a private record nor preparing a playable build publishes it automatically. Live uploads and publishing depend on server permissions and independent review.</p>
  </section>}
  {mode==='list'?<StudioLibrary onCapabilities={capabilities=>{setCanReview(capabilities.canReview===true);setUploads(capabilities.uploadsReady===true);}}/>:mode==='review'?<StudioReview/>:<StudioEditor create={mode==='new'} uploadsReady={uploads}/>}
 </section>;
}

function StudioLibrary({onCapabilities}:{onCapabilities:(value:{canReview:boolean;uploadsReady:boolean})=>void}){
 const [items,setItems]=useState<StudioProject[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const [search,setSearch]=useState('');
 const [attempt,setAttempt]=useState(0);
 const [statusFilter,setStatusFilter]=useState<'all'|'draft'|'pending_review'|'changes_requested'|'rejected'>('all');
 useEffect(()=>{
  const ac=new AbortController();setLoading(true);setError('');
  onCapabilities({canReview:false,uploadsReady:false});
  readWithDeadline(signal=>studioList(signal),ac.signal).then(r=>{if(!ac.signal.aborted){setItems(r.projects);onCapabilities(r);}}).catch(e=>{if(!ac.signal.aborted)setError(showError(e))})
   .finally(()=>{if(!ac.signal.aborted)setLoading(false)});
  return()=>ac.abort();
 },[attempt]);
 const drafts=items.filter(p=>p.status==='draft'||p.status==='changes_requested').length;
 const pending=items.filter(p=>p.status==='pending_review').length;
 const needle=search.trim().toLocaleLowerCase();
 const visible=items.filter(p=>(statusFilter==='all'||p.status===statusFilter)&&
  (!needle||[p.title,p.summary,p.slug,p.category].some(v=>v.toLocaleLowerCase().includes(needle))));
 return <>
  <section className="st-metrics" aria-label="Your projects status">
   <div><span>TOTAL WORKS</span><strong>{loading?'—':items.length}</strong></div>
   <div><span>IN PROGRESS</span><strong>{loading?'—':drafts}</strong></div>
   <div><span>AWAITING REVIEW</span><strong>{loading?'—':pending}</strong></div>
   <div><span>STUDIO PUBLICATION</span><strong>SEPARATE REVIEW</strong></div>
  </section>
  <section className="st-panel">
   <div className="st-section-head"><div><p className="st-kicker">01 / PERSONAL WORKSPACE</p><h2>PROJECT RECORDS</h2></div>
    <Link className="st-action" to="/studio/new">+ CREATE PROJECT</Link></div>
   <p className="st-muted">Your Studio projects and attachments remain private. Staff review and live publication are separate. Uploading here does not automatically make an app playable or award XP.</p>
   <div className="v091-studio-release-entry">
    <div><strong>Ready for people to play?</strong><p>Use the playable upload flow to preview your build and submit it for staff review. Publication requires approval.</p></div>
    <a className="st-action" href={nativeCreatorEnabled?"/studio/packages/new":"/upload"}>OPEN PLAYABLE UPLOAD ↗</a>
   </div>
   {items.length>0&&<div className="st-filters">
    <label className="st-field"><span>SEARCH YOUR PROJECTS</span>
     <input type="search" maxLength={100} placeholder="Title, summary, slug, category"
      value={search} onChange={e=>setSearch(e.target.value)}/></label>
    <label className="st-field"><span>STATUS</span>
     <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as typeof statusFilter)}>
      <option value="all">All projects</option>
      <option value="draft">Draft</option>
      <option value="pending_review">Pending review</option>
      <option value="changes_requested">Changes requested</option>
      <option value="rejected">Rejected</option>
     </select></label>
    <span className="st-filter-count">{visible.length} OF {items.length} WORKS</span>
   </div>}
   {loading&&<p role="status">Retrieving private projects…</p>}
   {error&&<div role="alert" className="st-error"><p>{error}</p><button className="st-action" type="button" onClick={()=>setAttempt(n=>n+1)}>RETRY PROJECTS</button></div>}
   {!loading&&!error&&items.length===0&&<div className="st-empty">
    <span aria-hidden="true" className="st-orb">◎</span><h3>NO CREATIONS IN THE ARCHIVE.</h3>
    <p>Your first draft starts here. Try SIGNAL 001 or something entirely your own.</p>
    <Link className="st-action" to="/studio/new">START A PROJECT →</Link>
   </div>}
   {!loading&&!error&&items.length>0&&visible.length===0&&<p role="status" className="st-muted">No projects match these filters. Adjust your search or status selection.</p>}
   <div className="st-project-grid">{visible.map(p=><Link className="st-project" to={'/studio/'+p.id} key={p.id}>
    <div className="st-project-art" aria-hidden="true"><span>◌</span><small>{p.category.toUpperCase()}</small></div>
    <div className="st-project-body"><span className="st-kicker">REV {String(p.revision).padStart(2,'0')} / {pretty(p.status)}</span>
     <h3>{p.title}</h3><p>{p.summary}</p><small>EDITED {new Date(p.updatedAt*1000).toLocaleDateString()}</small></div>
    <span className="st-project-arrow">↗</span>
   </Link>)}</div>
  </section>
 </>;
}

function StudioEditor({create,uploadsReady}:{create:boolean;uploadsReady:boolean}){
 const {projectId}=useParams();
 const navigate=useNavigate();
 const id=create?null:projectId||null;
 const [project,setProject]=useState<StudioProject|null>(null);
 const [history,setHistory]=useState<StudioReviewHistory[]>([]);
 const [assetSummary,setAssetSummary]=useState<StudioAsset[]|null>(null);
 const [largeSummary,setLargeSummary]=useState<StudioLargeAsset[]>([]);
 const [draft,setDraft]=useState<StudioDraft>({...empty});
 const [saved,setSaved]=useState<StudioDraft|null>(null);
 const [loading,setLoading]=useState(!create),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [mustReload,setMustReload]=useState(false);
 const createId=useRef(crypto.randomUUID());
 useEffect(()=>{
  if(create||!id)return;
  if(!uuid.test(id)){setError('Invalid project identifier');setLoading(false);return;}
  const ac=new AbortController();setLoading(true);setError('');
  readWithDeadline(signal=>studioGet(id,signal),ac.signal).then(({project:p,reviewHistory})=>{if(!ac.signal.aborted){setProject(p);setHistory(reviewHistory);const fields=editForm(p);setDraft(fields);setSaved(fields);}})
   .catch(e=>{if(!ac.signal.aborted)setError(showError(e))})
   .finally(()=>{if(!ac.signal.aborted)setLoading(false)});
  return()=>ac.abort();
 },[id,create]);
 const canEdit=!project||editable(project);
 const dirty=saved===null||JSON.stringify(saved)!==JSON.stringify(draft);
 // An untouched new form is not an unsaved revision. Never persist draft data
 // in browser storage; the server is the sole authority for saved revisions.
 const hasUnsavedEdits=JSON.stringify(saved??empty)!==JSON.stringify(draft);
 useEffect(()=>{
  if(!hasUnsavedEdits&&!busy)return;
  // BrowserRouter uses declarative routing: route blockers belong to a data
  // router. Protect real Link navigation and tab reload without changing the
  // application router, intercepting history, or interfering with edit fields.
  function onBeforeUnload(event:BeforeUnloadEvent){
   event.preventDefault();event.returnValue='';
  }
  function onLinkClick(event:MouseEvent){
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||
      event.shiftKey||event.altKey||!(event.target instanceof Element))return;
   const anchor=event.target.closest<HTMLAnchorElement>('a[href]');
   if(!anchor||anchor.hasAttribute('download')||
      (anchor.target&&anchor.target!=='_self'))return;
   const destination=new URL(anchor.href,window.location.href);
   if(destination.origin!==window.location.origin||
      destination.pathname===window.location.pathname)return;
   if(!window.confirm(busy
     ?'A private Studio action is still processing. Leave this page?'
     :'You have unsaved Studio changes. Leave without saving?')){
    event.preventDefault();event.stopImmediatePropagation();
   }
  }
  window.addEventListener('beforeunload',onBeforeUnload);
  document.addEventListener('click',onLinkClick,true);
  return()=>{
   window.removeEventListener('beforeunload',onBeforeUnload);
   document.removeEventListener('click',onLinkClick,true);
  };
 },[hasUnsavedEdits,busy]);
 const eligibleAttachment=Boolean([...(assetSummary||[]),...largeSummary].some(a=>a.status==='quarantined'&&
  studioEligibleUpload(draft.category,a.kind)));
 const ready=Boolean((draft.demoUrl||draft.sourceUrl||eligibleAttachment)&&draft.license.trim().length>=2&&
  draft.aiDisclosure.trim().length>=6&&draft.humanContribution.trim().length>=10);
 function assign<K extends keyof StudioDraft>(name:K,value:StudioDraft[K]){setDraft(p=>({...p,[name]:value}));setNotice('');setError('');}
 const locked=busy||loading||mustReload||!canEdit;
 async function save(event:FormEvent){
  event.preventDefault();if(locked)return;
  setBusy(true);setError('');setNotice('');
  try{
   const current=project
    ? (await studioUpdate(project.id,project.revision,draft)).project
    : (await studioCreate(draft,createId.current)).project;
   const fields=editForm(current);
   setProject(current);setDraft(fields);setSaved(fields);
   setNotice('Private revision saved. Nothing has been published.');
   if(create)navigate('/studio/'+current.id,{replace:true});
  }catch(e){
   if(typeof e==='object'&&e!==null&&'status' in e&&[401,403,409].includes(Number(e.status)))setMustReload(true);
   setError(showError(e));
  }finally{setBusy(false);}
 }
 async function submit(){
  if(!project||dirty||!ready||locked)return;
  if(!window.confirm('Submit this saved revision for independent staff review? It will remain private, and uploaded files are NOT approved or executable.'))return;
  setBusy(true);setError('');setNotice('');
  try{
   const r=await studioSubmit(project.id,project.revision);
   setProject(r.project);setSaved(editForm(r.project));
   setNotice('Submission recorded for staff review. No public release was created.');
  }catch(e){setError(showError(e));setMustReload(true)}finally{setBusy(false);}
 }
 async function withdraw(){
  if(!project||busy||project.status!=='pending_review')return;
  if(!window.confirm('Withdraw this project from staff review and return it to a private editable draft?'))return;
  setBusy(true);setError('');setNotice('');
  try{const result=await studioWithdraw(project.id,project.revision);setProject(result.project);
   const fields=editForm(result.project);setSaved(fields);setDraft(fields);
   setNotice('Submission withdrawn. Your work is private and editable again.');}
  catch(e){setError(showError(e));setMustReload(true);}finally{setBusy(false);}
 }
 async function deleteDraft(){
  if(!project||busy||project.status==='pending_review')return;
  if(!window.confirm('Permanently remove this private project record? Remove its private files first. This cannot be undone.'))return;
  setBusy(true);setError('');setNotice('');
  try{await studioDeleteProject(project.id,project.revision);navigate('/studio/records',{replace:true});}
  catch(e){setError(showError(e));setMustReload(true);}finally{setBusy(false);}
 }
 const input=(name:'title'|'slug'|'summary'|'description'|'license'|'aiDisclosure'|'humanContribution',
  label:string,max:number,rows=0,help='')=><label className="st-field" key={name}>
   <span>{label}</span>
   {rows?
    <textarea value={draft[name]} rows={rows} maxLength={max} disabled={locked}
      onChange={e=>assign(name,e.target.value)}/>:
    <input value={draft[name]} maxLength={max} disabled={locked} onChange={e=>assign(name,e.target.value)}/>}
   {help&&<small>{help}</small>}
  </label>;
 return <>
  {loading&&<section className="st-panel" role="status">OPENING PRIVATE DRAFT…</section>}
  {error&&<p role="alert" className="st-error">{error}</p>}
  {mustReload&&<button className="st-button" onClick={()=>window.location.reload()}>RELOAD CURRENT REVISION</button>}
  {!loading&&(!id||project)&&<div className="st-editor">
   <form className="st-panel st-editor-form" onSubmit={save}>
    <div className="st-section-head"><div><p className="st-kicker">01 / WORK IDENTITY</p><h2>{project?'REFINE THE RECORD.':'GIVE YOUR WORK A NAME.'}</h2></div>
     {project&&<span className="st-tag">{pretty(project.status)} · REV {project.revision}</span>}</div>
    {input('title','PROJECT TITLE',100,0,'3–100 characters.')}
    {input('slug','PROJECT SLUG',90,0,'Lowercase letters, numbers and hyphens; unique per creator.')}
    <label className="st-field"><span>CREATION TYPE</span>
     <select value={draft.category} disabled={locked} onChange={e=>assign('category',e.target.value as StudioCategory)}>
      {CATEGORIES.map(([key,name])=><option value={key} key={key}>{name}</option>)}
     </select>
     <small>{CATEGORY_GUIDE[draft.category]}</small>
    </label>
    {input('summary','SHORT SUMMARY',280,3,'10–280 characters; appears on the eventual project card.')}
    {input('description','ABOUT THIS CREATION',8000,6)}
    <label className="st-check"><input type="checkbox" checked={draft.freeToUse} disabled={locked}
      onChange={e=>assign('freeToUse',e.target.checked)}/> This work is listed as free to access.</label>
    <hr className="st-rule"/>
    <div className="st-section-head"><div><p className="st-kicker">02 / CONNECTIONS & RIGHTS</p><h2>PROVENANCE MATTERS.</h2></div></div>
    <label className="st-field"><span>WORKING DEMO URL (HTTPS)</span>
     <input type="url" value={draft.demoUrl||''} disabled={locked} maxLength={1500}
      onChange={e=>assign('demoUrl',e.target.value||null)}/>
     <small>Optional. For private review you may supply a matching file in the asset vault instead. Game/app builds use ZIP; they cannot play publicly yet.</small>
    </label>
    <label className="st-field"><span>PUBLIC SOURCE CODE URL (HTTPS)</span>
     <input type="url" value={draft.sourceUrl||''} disabled={locked} maxLength={1500}
      onChange={e=>assign('sourceUrl',e.target.value||null)}/></label>
    {input('license','RIGHTS OR LICENSE',80,0,'Identify your actual rights; a public repository does not automatically grant reuse.')}
    {input('aiDisclosure','AI INVOLVEMENT',1200,3,'Explain any AI assistance, or write that none was used.')}
    {input('humanContribution','HUMAN CREATION & CREDITS',1200,3,'Credit your own work and collaborators.')}
    <p id="st-save-state" className="st-save-state" role="status"
       data-unsaved={hasUnsavedEdits?"true":"false"}>
     {busy?'PRIVATE ACTION IN PROGRESS — WAIT FOR CONFIRMATION':
      hasUnsavedEdits?'UNSAVED CHANGES — SAVE BEFORE LEAVING':
      project?'CURRENT REVISION SAVED / PRIVATE':
      'NOT YET CREATED — YOUR FIRST SAVE MAKES A PRIVATE RECORD'}
    </p>
    <div className="st-actions">
     <button className="st-action" type="submit" disabled={locked||!(project?dirty:hasUnsavedEdits)}>
      {busy?'SAVING PRIVATE REVISION…':project?'SAVE CHANGES':'CREATE PRIVATE DRAFT'}</button>
     <Link className="st-link" to="/studio/records" aria-describedby="st-save-state">RETURN TO PROJECTS ↗</Link>
    </div>
    {notice&&<p role="status" className="st-success">{notice}</p>}
   </form>
   <div className="st-sidebar">
    <section className="st-panel st-passport">
     <p className="st-kicker">03 / PRIVATE PASSPORT</p><div className="st-passport-art" aria-hidden="true"><span>◎</span></div>
     <span className="st-kicker">{draft.category.toUpperCase()} / CONTINUANCE RECORD</span>
     <h2>{draft.title||'UNTITLED CREATION'}</h2>
     <p>{draft.summary||'Your description will appear here as you work.'}</p>
     <p className="st-muted">Drafts are visible only to their verified owner. Uploaded files cannot be played publicly.</p>
    </section>
    {history.length>0&&<section className="st-panel" aria-label="Your project review feedback">
     <p className="st-kicker">STAFF REVIEW / PRIVATE FEEDBACK</p><h2>REVIEW DECISIONS.</h2>
     {history.map((item,i)=><div className="st-feedback" key={i}>
      <strong>{pretty(item.action)}</strong><small>{new Date(item.createdAt*1000).toLocaleString()}</small>
      <p>{item.reason}</p>
     </div>)}
    </section>}
    {project&&<StudioReceipts projectId={project.id} revision={project.revision}/>}
    {project&&<StudioUploader project={project} uploadsReady={uploadsReady}
     onAssetsChanged={setAssetSummary} onProjectChanged={setProject}/>}
    {project&&<StudioLargeUploader project={project} onAssetsChanged={setLargeSummary} onProjectChanged={setProject}/>}
    <section className="st-panel">
     <p className="st-kicker">04 / REVIEW READINESS</p><h2>SUBMISSION CHECK.</h2>
     <ul className="st-checklist">
      <li data-ready={Boolean(project&&!dirty)}><span>{project&&!dirty?'✓':'○'}</span> Saved current revision</li>
      <li data-ready={Boolean(draft.demoUrl||draft.sourceUrl||eligibleAttachment)}><span>{draft.demoUrl||draft.sourceUrl||eligibleAttachment?'✓':'○'}</span> Public HTTPS link or matching private creation file</li>
      <li data-ready={draft.license.trim().length>=2}><span>{draft.license.trim().length>=2?'✓':'○'}</span> License / ownership stated</li>
      <li data-ready={draft.aiDisclosure.trim().length>=6}><span>{draft.aiDisclosure.trim().length>=6?'✓':'○'}</span> AI involvement disclosed</li>
      <li data-ready={draft.humanContribution.trim().length>=10}><span>{draft.humanContribution.trim().length>=10?'✓':'○'}</span> Human contributions credited</li>
     </ul>
     <p className="st-muted">A submitted project enters a private queue. There is no automated publication, game execution, or XP reward.</p>
     {project&&<button className="st-button" disabled={!ready||dirty||locked||!editable(project)}
      onClick={()=>void submit()}>SUBMIT SAVED REVISION FOR REVIEW ↗</button>}
     {project?.status==='pending_review'&&<button className="st-button" disabled={busy||mustReload}
      onClick={()=>void withdraw()}>WITHDRAW FROM REVIEW</button>}
     {project&&project.status!=='pending_review'&&<button className="st-link" disabled={busy||mustReload}
      onClick={()=>void deleteDraft()}>DELETE PRIVATE PROJECT</button>}
    </section>
   </div>
  </div>}
 </>;
}


function StudioReceipts({projectId,revision}:{projectId:string;revision:number}){
 const [history,setHistory]=useState<StudioReviewReceipt[]>([]),[error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  const ac=new AbortController();setLoading(true);setError('');
  studioReviewReceipts(projectId,ac.signal).then(({submissions})=>{
   if(!ac.signal.aborted)setHistory(submissions);
  }).catch(e=>{if(!ac.signal.aborted)setError(showError(e))})
   .finally(()=>{if(!ac.signal.aborted)setLoading(false)});
  return()=>ac.abort();
 },[projectId,revision]);
 if(!loading&&!error&&history.length===0)return null;
 return <section className="st-panel" aria-label="Immutable private submission receipts">
  <p className="st-kicker">SUBMISSION HISTORY / PRIVATE</p><h2>REVIEW RECEIPTS.</h2>
  <p className="st-muted">Each version records the submitted details and exact file hashes. It does not grant publication or allow files to run.</p>
  {loading&&<p role="status">Loading private review versions…</p>}
  {error&&<p className="st-error" role="alert">{error}</p>}
  {history.map(entry=><article className="st-feedback" key={entry.id}>
   <strong>REV {entry.revision} / {pretty(entry.status)}</strong>
   <small>SUBMITTED {new Date(entry.submittedAt*1000).toLocaleString()}</small>
   <h3>{entry.title}</h3>
   <p>{entry.summary}</p>
   <small>{entry.assets.length} ATTACHED FILE{entry.assets.length===1?'':'S'}</small>
   {entry.assets.map(asset=><div key={asset.id} className="st-manifest-file">
    <strong>{asset.name} · {size(asset.sizeBytes)}</strong>
    <code>{asset.digestType==='part-manifest'?'PART MANIFEST SHA-256':'FILE SHA-256'}: {asset.sha256}</code>
   </div>)}
  </article>)}
 </section>;
}

function StudioUploader({project,uploadsReady,onAssetsChanged,onProjectChanged}:{
 project:StudioProject;uploadsReady:boolean;onAssetsChanged:(assets:StudioAsset[])=>void;
 onProjectChanged:(project:StudioProject)=>void
}){
 const [assets,setAssets]=useState<StudioAsset[]>([]);
 const [storageReady,setStorageReady]=useState(false);
 const [memberBytes,setMemberBytes]=useState(0);
 const [projectBytes,setProjectBytes]=useState(0);
 const [globalBytes,setGlobalBytes]=useState(0);
 const [globalCap,setGlobalCap]=useState(512*1048576);
 const [completed,setCompleted]=useState(0);
 const [queue,setQueue]=useState<File[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [progress,setProgress]=useState(''),[drag,setDrag]=useState(false);
 const controller=useRef<AbortController|null>(null);
 const [preview,setPreview]=useState<string|null>(null);
 useEffect(()=>{
  const candidate=queue.find(f=>studioCheckFile(f).ok&&/\.(png|jpg|jpeg|webp|gif)$/i.test(f.name));
  if(!candidate){setPreview(null);return;}
  const url=URL.createObjectURL(candidate);setPreview(url);
  return()=>URL.revokeObjectURL(url);
 },[queue]);
 useEffect(()=>{
  let alive=true;
  // Existing assets remain visible even when new uploads are paused.
  readWithDeadline(signal=>studioAssets(project.id,signal)).then(r=>{if(alive){setAssets(r.assets);setStorageReady(r.storageReady);
   setMemberBytes(r.memberUsedBytes);setProjectBytes(r.projectUsedBytes);
   setGlobalBytes(r.globalUsedBytes);setGlobalCap(r.globalQuotaBytes);onAssetsChanged(r.assets)}}).catch(e=>{if(alive)setError(showError(e))});
  return()=>{alive=false;controller.current?.abort();};
 },[project.id,onAssetsChanged]);
 async function refresh(){const r=await readWithDeadline(signal=>studioAssets(project.id,signal));setAssets(r.assets);
  setStorageReady(r.storageReady);setMemberBytes(r.memberUsedBytes);
  setProjectBytes(r.projectUsedBytes);setGlobalBytes(r.globalUsedBytes);
   setGlobalCap(r.globalQuotaBytes);onAssetsChanged(r.assets);}
 function accept(files:FileList|null){
  if(!files||busy)return;
  setError('');setNotice('');
  const next=Array.from(files);
  if(next.length>8){setError('Choose no more than eight files at a time.');setQueue([]);return;}
  const invalid=next.map(f=>({file:f,check:studioCheckFile(f)})).filter(x=>!x.check.ok);
  if(invalid.length){setError(invalid.map(x=>x.file.name+': '+(!x.check.ok?x.check.reason:'')).join(' '));setQueue([]);return;}
  setQueue(next);
 }
 async function upload(){
  if(!uploadsReady||busy||!queue.length||!editable(project))return;
  setBusy(true);setError('');setNotice('');setCompleted(0);
  const ac=new AbortController();controller.current=ac;let completedCount=0;
  try{
   for(const file of queue){setProgress('UPLOADING '+(completedCount+1)+'/'+queue.length+' — '+file.name);
    await studioUpload(project.id,file,ac.signal);completedCount++;setCompleted(completedCount);
   }
   setQueue([]);setNotice('Files stored in private quarantine. None were published, scanned, or made playable.');
   await refresh();
  }catch(e){
   setQueue(v=>v.slice(completedCount));
   setError(ac.signal.aborted?'Upload cancelled. Any incomplete reservation remains private until cleanup.':showError(e));
   try{await refresh();}catch{/* owner can retry */}
  }finally{controller.current=null;setProgress('');setBusy(false);}
 }
 async function remove(a:StudioAsset){
  // Private file withdrawal remains available when a draft is review-locked.
  if(busy)return;
  const warning=project.status==='pending_review'?
   'Removing a file will also withdraw this project from the pending review queue. Continue?' :
   'Permanently remove the private file '+a.name+' from this project?';
  if(!window.confirm(warning))return;
  setBusy(true);setError('');setNotice('');
  try{
   const changed=await studioDeleteAsset(project.id,a.id);
   await refresh();
   if(project.status==='pending_review'){
    const latest=await studioGet(project.id);
    onProjectChanged(latest.project);
   }
   setNotice(changed.withdrawnFromReview?
    'Private file removed. This submission was automatically withdrawn from review and is editable again.':
    'Private file removed.');
  }
  catch(e){setError(showError(e));}finally{setBusy(false);}
 }
 function dropped(e:DragEvent<HTMLDivElement>){e.preventDefault();setDrag(false);accept(e.dataTransfer.files);}
 return <section className="st-panel st-assets">
  <p className="st-kicker">FILES / PRIVATE QUARANTINE</p><h2>THE ASSET VAULT.</h2>
  {!uploadsReady&&<p className="st-muted">New uploads are paused or not provisioned. Existing private file records remain available below. Private download/removal requires the original isolated R2 binding.</p>}
   <p className="st-muted">Images / PDF: 10 MiB. MP3 / WAV / MP4 / WebM / ZIP: 20 MiB. TXT / MD: 1 MiB. 20 files per project, 100 MiB per member.</p>
   <div className="st-storage-meter" aria-label="Creator Studio storage usage">
    <div><span>ACCOUNT STORAGE</span><strong>{size(memberBytes)} / 100 MiB</strong></div>
    <progress max={100*1048576} value={Math.min(memberBytes,100*1048576)}
     aria-label="Account storage used"/>
    <small>THIS PROJECT: {size(projectBytes)} · {assets.length} / 20 FILES</small>
    <div><span>PRIVATE PILOT VAULT</span><strong>{size(globalBytes)} / {size(globalCap)}</strong></div>
    <progress max={globalCap} value={Math.min(globalBytes,globalCap)} aria-label="Pilot storage used"/>
   </div>
   {uploadsReady&&editable(project)&&<div className={'st-drop'+(drag?' is-drag':'')}
    onDragOver={e=>{e.preventDefault();if(!busy)setDrag(true);}}
    onDragLeave={()=>setDrag(false)} onDrop={dropped} role="group" aria-label="Upload private project files">
    <label htmlFor="st-files">DRAG FILES HERE OR SELECT FROM DEVICE</label>
    <input id="st-files" type="file" multiple disabled={busy}
      accept=".png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.mp4,.webm,.pdf,.txt,.md,.zip"
      onChange={e=>{accept(e.target.files);e.currentTarget.value='';}}/>
    <small>ZIP and video files remain private and untrusted. They are not executed, streamed, transcoded or published.</small>
   </div>}
   {uploadsReady&&queue.length>0&&<div className="st-upload-queue"><h3>READY TO STORE / {queue.length} FILES</h3>
    {queue.map((f,i)=><p key={f.name+'-'+i}>{f.name} · {size(f.size)}</p>)}
    {preview&&<img className="st-local-preview" src={preview} alt="Local image preview before private upload"/>}
    {progress&&<><p role="status">{progress}</p>
     <progress className="st-upload-progress" value={completed} max={queue.length||1}
      aria-label="Completed file uploads"/></>}
    <div className="st-actions"><button className="st-button" disabled={busy} onClick={()=>void upload()}>
     {busy?'STORING…':'UPLOAD TO PRIVATE VAULT'}</button>
     {busy&&<button className="st-link" onClick={()=>controller.current?.abort()}>CANCEL</button>}
    </div>
   </div>}
   <div className="st-file-list">{assets.map(a=><div className="st-file" key={a.id}>
    <div><strong>{a.name}</strong><small>{a.kind.toUpperCase()} / {size(a.sizeBytes)} / {a.status.toUpperCase()}</small></div>
    <div className="st-file-actions">
     {storageReady&&a.status==='quarantined'&&<a href={studioDownloadUrl(project.id,a.id)} download={a.name}>DOWNLOAD</a>}
     {storageReady&&a.status!=='uploading'&&<button disabled={busy} onClick={()=>void remove(a)}>REMOVE</button>}
    </div>
   </div>)}</div>
   {assets.length===0&&<p className="st-muted">No private attachments yet.</p>}
   {!storageReady&&assets.length>0&&<p className="st-error" role="status">The private object store is disconnected. File records are retained; removal and download are safely disabled until storage is restored.</p>}
  {notice&&<p role="status" className="st-success">{notice}</p>}
  {error&&<p role="alert" className="st-error">{error}</p>}
 </section>;
}

function StudioReview(){
 const [storage,setStorage]=useState<StudioLargeCapacity|null>(null);
 const [projects,setProjects]=useState<StudioReviewProject[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const [reason,setReason]=useState<Record<string,string>>({}),[busy,setBusy]=useState('');
 const [manifests,setManifests]=useState<Record<string,StudioReviewManifest>>({});
 const [inspection,setInspection]=useState('');
 const [attempt,setAttempt]=useState(0);
 async function refresh(){const r=await readWithDeadline(signal=>studioReviewQueue(signal));setProjects(r.projects);setStorage(r.storage);}
 useEffect(()=>{const ac=new AbortController();setLoading(true);setError('');
  readWithDeadline(signal=>studioReviewQueue(signal),ac.signal).then(r=>{if(!ac.signal.aborted){setProjects(r.projects);setStorage(r.storage);}})
  .catch(e=>{if(!ac.signal.aborted)setError(showError(e))})
  .finally(()=>{if(!ac.signal.aborted)setLoading(false)});
  return()=>ac.abort();},[attempt]);
 async function inspect(p:StudioReviewProject){
  if(inspection)return;
  setInspection(p.id);setError('');
  try{const manifest=await readWithDeadline(signal=>studioReviewManifest(p.id,signal));setManifests(v=>({...v,[p.id]:manifest}));}
  catch(e){setError(showError(e));}finally{setInspection('');}
 }
 async function decide(p:StudioReviewProject,action:'changes_requested'|'rejected'){
  const explanation=reason[p.id]?.trim()||'';
  if(explanation.length<12){setError('Give the creator a specific explanation of at least 12 characters.');return;}
  if(!window.confirm('Record this audited '+pretty(action)+' decision for '+p.title+'?'))return;
  setBusy(p.id);setError('');
  try{await studioReviewDecision(p.id,p.revision,action,explanation);await refresh();}
  catch(e){setError(showError(e))}finally{setBusy('');}
 }
 return <section className="st-panel">
  <div className="st-section-head"><div><p className="st-kicker">STAFF-ONLY / CANONICAL REVIEW</p><h2>AWAITING A DECISION.</h2></div></div>
  <p className="st-muted">This desk can request changes or reject a private submission. Publication and approval remain intentionally disabled until file scanning and the public release pipeline exist.</p>
  {storage?.ready&&<div className="st-storage-meter" aria-label="Large creator asset capacity monitoring">
   <div><span>EXTENDED CREATOR VAULT / RESERVED</span>
    <strong>{size(storage.reservedBytes||0)} / {size(storage.capacityBytes||26843545600)}</strong></div>
   <progress max={storage.capacityBytes||26843545600} value={Math.min(storage.reservedBytes||0,storage.capacityBytes||26843545600)}
    aria-label="Extended creator vault capacity"/>
   <small>QUARANTINED FILES: {storage.quarantinedFiles||0} · ACTIVE TRANSFERS: {storage.activeUploads||0} · TOTAL RESERVATIONS: {storage.totalFiles||0}</small>
   {storage.threshold!=='normal'&&<p className="st-muted" role="status">
    {storage.threshold==='critical'?'CAPACITY CRITICAL (95%+) — pause new reservations until reviewed.':
     'CAPACITY ATTENTION (80%+) — review account budget and provision additional storage.'}
   </p>}
   <small>Database reservations, not actual Cloudflare billing. Other buckets and incomplete multipart operations affect the bill.</small>
  </div>}
  {loading&&<p role="status">Checking staff permission and review queue…</p>}
  {error&&<div role="alert" className="st-error"><p>{error}</p><button className="st-action" type="button" onClick={()=>setAttempt(n=>n+1)}>RETRY REVIEW QUEUE</button></div>}
  {!loading&&!error&&projects.length===0&&<p>No pending private project records.</p>}
  <div className="st-review-list">{projects.map(p=><article className="st-review" key={p.id}>
   <p className="st-kicker">@{p.handle} / {p.category.toUpperCase()} / REV {p.revision}</p>
   <h3>{p.title}</h3><p>{p.summary}</p>
   <dl><dt>Rights listed</dt><dd>{p.license_name||'Not provided'}</dd>
    <dt>AI contribution</dt><dd>{p.ai_disclosure}</dd>
    <dt>Human credits</dt><dd>{p.human_contribution}</dd>
    <dt>Source</dt><dd>{p.source_url||'Not supplied'}</dd>
    <dt>Demo</dt><dd>{p.demo_url||'Not supplied'}</dd>
    <dt>Private files</dt><dd>{p.attachment_count} quarantined · {size(Number(p.attachment_bytes))}</dd></dl>
   {p.attachment_count>0&&<div className="st-review-files">
    <button className="st-link" disabled={Boolean(inspection)} onClick={()=>void inspect(p)}>INSPECT FILE METADATA ↗</button>
    {manifests[p.id]&&<div className="st-manifest">
     <p className="st-muted">{manifests[p.id].note}</p>
     {manifests[p.id].assets.map(a=><div className="st-manifest-file" key={a.id}>
      <strong>{a.name}</strong><small>{a.kind.toUpperCase()} / {size(a.sizeBytes)} / {a.status.toUpperCase()}</small>
      <code>{a.digestType==='part-manifest'?'PART MANIFEST SHA-256: ':'FILE SHA-256: '}{a.sha256||'Hash pending'}</code>
     </div>)}
    </div>}
   </div>}
   <label className="st-field"><span>REVIEW REASON (REQUIRED)</span>
    <textarea maxLength={1200} rows={3} value={reason[p.id]||''}
     onChange={e=>setReason(v=>({...v,[p.id]:e.target.value}))}/></label>
   <div className="st-actions">
    <button className="st-button" disabled={busy===p.id} onClick={()=>void decide(p,'changes_requested')}>REQUEST CHANGES</button>
    <button className="st-link" disabled={busy===p.id} onClick={()=>void decide(p,'rejected')}>REJECT SUBMISSION</button>
   </div>
  </article>)}</div>
 </section>;
}

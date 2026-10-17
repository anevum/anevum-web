import {type DragEvent,type FormEvent,useEffect,useRef,useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {canonicalAuthClient,canonicalMe,type CanonicalProfile} from '../lib/canonical-beta';
import {
 studioHealth,studioList,studioGet,studioCreate,studioUpdate,studioSubmit,studioAssets,
 studioUpload,studioCheckFile,studioDeleteAsset,studioDownloadUrl,studioWithdraw,studioDeleteProject,studioReviewQueue,
 studioEligibleUpload,studioReviewManifest,studioReviewReceipts,
 studioReviewDecision,type StudioDraft,type StudioProject,type StudioAsset,type StudioCategory,
 type StudioReviewProject,type StudioReviewHistory,type StudioReviewManifest,type StudioReviewReceipt
} from '../lib/canonical-studio';
import {StudioGuestDiscovery,StudioLaunchpad} from './StudioLaunchpad';
import {StudioWorkbench} from './StudioWorkbench';
import './canonical-studio.css';

const CATEGORY_GUIDE:Record<StudioCategory,string>={
 games:'Outline a game or build a text-based interactive story. Playable ZIP hosting and public execution are not available yet.',
 tools:'Plan an application or record an existing HTTPS project. Uploaded application hosting is not active.',
 creative:'Develop a creative project using private text, scenes, choices and credits. New uploads are not active.',
 music:'Draft music or podcast notes and credits. Audio uploads are not available yet.',
 art:'Design a gallery and add original captions; new image uploads remain disabled.',
 video:'Outline a film, scene or animation and record credits. Uploads and playback are not yet available.',
 writing:'Compose a story or zine in movable private sections. Document uploads are not yet active.',
 learning:'Build a learning project in private text and sections. Executable lessons and attachments are not available.',
 research:'Organize findings privately with text, references and credits. Attachments are not yet active.',
 other:'Plan your creative work privately. Uploaded assets remain unavailable until the pilot.'
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
 const id=session?.user?.id;
 const [identity,setIdentity]=useState<CanonicalProfile|null>(null);
 const [phase,setPhase]=useState<'loading'|'ready'|'unavailable'|'incomplete'>('loading');
 const [message,setMessage]=useState('');
 const [uploads,setUploads]=useState(false);
 const [canReview,setCanReview]=useState(false);
 useEffect(()=>{
  if(!id||session?.user?.emailVerified!==true)return;
  let live=true;const controller=new AbortController();
  setPhase('loading');setMessage('');
  Promise.all([studioHealth(controller.signal),canonicalMe(controller.signal)]).then(async([health,profile])=>{
   if(!live)return;
   if(profile.memberId!==id)throw Error('Member identity changed. Sign in again.');
   if(!health.studioReady){setPhase('unavailable');return;}
   if(!profile.profile?.handle){setPhase('incomplete');return;}
   // Health reports the environment capability; only this signed-in user's
   // canonical API response can grant upload pilot access.
   const memberStudio=await studioList(controller.signal);
   if(!live)return;
   setIdentity(profile.profile);setUploads(memberStudio.uploadsReady===true);
   setCanReview(memberStudio.canReview===true);setPhase('ready');
  }).catch(e=>{if(live){setMessage(showError(e));setPhase('unavailable')}});
  return()=>{live=false;controller.abort();};
 },[id,session?.user?.emailVerified]);
 if(isPending)return <section className="st-status" role="status">VERIFYING CANONICAL MEMBER SESSION…</section>;
 if(!id||session?.user?.emailVerified!==true)return <main className="st-root" aria-label="Explore Creator Studio">
  <StudioGuestDiscovery/>
 </main>;
 if(phase==='loading')return <section className="st-status" role="status">OPENING PRIVATE CREATOR STUDIO…</section>;
 if(phase==='unavailable')return <section className="st-status">
  <span className="st-kicker">STAGING / FEATURE NOT ACTIVE</span><h1>THE STUDIO IS IN DEVELOPMENT.</h1>
  <p>{message||'Canonical drafts are not enabled in this environment. No project information has been changed.'}</p>
  <Link className="st-action" to="/member">RETURN TO MY SPACE ↗</Link>
 </section>;
 if(phase==='incomplete')return <section className="st-status">
  <span className="st-kicker">01 / CREATOR IDENTITY</span><h1>CLAIM YOUR HANDLE FIRST.</h1>
  <p>Complete your account profile before creating private projects.</p>
  <Link className="st-action" to="/member">OPEN MEMBER PROFILE ↗</Link>
 </section>;
 return <main className={'st-root'+(mode==='list'?' st-root--launchpad':'')} aria-label="Creator Studio">
  <header className="st-header">
   <div><Link className="st-back" to="/member">← MEMBER ATLAS</Link>
    <p className="st-kicker">ANEVUM / CONTINUANCE INSTITUTE / CREATOR STUDIO</p>
    <h1>{mode==='review'?'SUBMISSION REVIEW.':mode==='list'?'CREATOR STUDIO.':mode==='new'?'BEGIN A NEW WORK.':'PROJECT WORKSPACE.'}</h1>
    <p>From your first idea to your next creation. All drafts stay private until you choose to submit for review.</p>
   </div>
   <div className="st-identity"><span>VERIFIED CREATOR</span><strong>@{identity?.handle}</strong><small>PRIVATE STAGING WORKSPACE</small></div>
  </header>
  <nav className="st-nav" aria-label="Studio navigation">
   <Link to="/studio" aria-current={mode==='list'?'page':undefined}>LAUNCHPAD</Link>
   <Link to="/studio/new" aria-current={mode==='new'?'page':undefined}>ADVANCED PROJECT</Link>
   {canReview&&<Link to="/studio/review" aria-current={mode==='review'?'page':undefined}>REVIEW DESK</Link>}
   <Link to="/discover">DISCOVER ↗</Link>
  </nav>
  {mode==='list'?<StudioLaunchpad uploadsReady={uploads}/>:mode==='review'?<StudioReview/>:<StudioEditor create={mode==='new'} uploadsReady={uploads}/>}
 </main>;
}

function StudioEditor({create,uploadsReady}:{create:boolean;uploadsReady:boolean}){
 const {projectId}=useParams();
 const navigate=useNavigate();
 const id=create?null:projectId||null;
 const [project,setProject]=useState<StudioProject|null>(null);
 const [history,setHistory]=useState<StudioReviewHistory[]>([]);
 const [assetSummary,setAssetSummary]=useState<StudioAsset[]|null>(null);
 const [draft,setDraft]=useState<StudioDraft>({...empty});
 const [saved,setSaved]=useState<StudioDraft|null>(null);
 const [loading,setLoading]=useState(!create),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [mustReload,setMustReload]=useState(false);
 const [editorView,setEditorView]=useState<'simple'|'advanced'>(create?'advanced':'simple');
 const createId=useRef(crypto.randomUUID());
 useEffect(()=>{
  if(create||!id)return;
  if(!uuid.test(id)){setError('Invalid project identifier');setLoading(false);return;}
  const ac=new AbortController();setLoading(true);setError('');
  studioGet(id,ac.signal).then(({project:p,reviewHistory})=>{if(!ac.signal.aborted){setProject(p);setHistory(reviewHistory);const fields=editForm(p);setDraft(fields);setSaved(fields);}})
   .catch(e=>{if(!ac.signal.aborted)setError(showError(e))})
   .finally(()=>{if(!ac.signal.aborted)setLoading(false)});
  return()=>ac.abort();
 },[id,create]);
 const canEdit=!project||editable(project);
 const dirty=saved===null||JSON.stringify(saved)!==JSON.stringify(draft);
 // A private draft has no autosave. Protect changes from ordinary navigation
 // and browser unload; never imply a revision has persisted prematurely.
 const hasNewWork=Boolean(draft.title.trim()||draft.summary.trim()||draft.description.trim());
 const unsavedChanges=!loading&&canEdit&&dirty&&(project!==null||(create&&hasNewWork));
 useEffect(()=>{
  if(!unsavedChanges)return;
  const beforeUnload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
  const beforeNavigation=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
   if(!(event.target instanceof Element))return;
   const anchor=event.target.closest('a[href]');
   if(!(anchor instanceof HTMLAnchorElement)||anchor.hasAttribute('download')||anchor.target==='_blank')return;
   let destination:URL;
   try{destination=new URL(anchor.href,window.location.href);}catch{return;}
   if(destination.origin!==window.location.origin)return;
   if(destination.pathname===window.location.pathname&&destination.search===window.location.search)return;
   if(!window.confirm('You have unsaved changes in this private creation. Leave without saving?'))
    event.preventDefault();
  };
  window.addEventListener('beforeunload',beforeUnload);
  document.addEventListener('click',beforeNavigation,true);
  return()=>{
   window.removeEventListener('beforeunload',beforeUnload);
   document.removeEventListener('click',beforeNavigation,true);
  };
 },[unsavedChanges]);
 const eligibleAttachment=Boolean(assetSummary?.some(a=>a.status==='quarantined'&&
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
  try{await studioDeleteProject(project.id,project.revision);navigate('/studio',{replace:true});}
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
    <div className="st-section-head"><div><p className="st-kicker">01 / CREATE & REFINE</p><h2>{project?'KEEP BUILDING YOUR IDEA.':'BEGIN YOUR CREATION.'}</h2></div>
     {project&&<span className="st-tag">{pretty(project.status)} · REV {project.revision}</span>}</div>
    <div className="st-editor-modes" role="group" aria-label="Creator editing mode">
     <button type="button" aria-pressed={editorView==='simple'} onClick={()=>setEditorView('simple')}>
      SIMPLE EDITOR</button>
     <button type="button" aria-pressed={editorView==='advanced'} onClick={()=>setEditorView('advanced')}>
      ADVANCED DETAILS</button>
    </div>
    <p className="st-muted">Your creation is a private, editable draft. Focus on the idea first; attribution, external links and review preparation can come later.</p>
    <p className="st-save-state" role="status" data-unsaved={unsavedChanges}>
     {busy?'SAVING PRIVATE REVISION…':unsavedChanges?
      'UNSAVED CHANGES — SAVE BELOW BEFORE LEAVING.':
      project?'ALL CHANGES TO THIS REVISION ARE SAVED PRIVATELY.':'NEW WORK — NOT SAVED YET.'}
    </p>
    {input('title','PROJECT TITLE',100,0,'Give your work a name you can change later.')}
    {editorView==='advanced'&&input('slug','PROJECT URL IDENTIFIER',90,0,'Used internally for a future project URL. Lowercase letters, numbers and hyphens.')}
    <label className="st-field"><span>CREATION TYPE</span>
     <select value={draft.category} disabled={locked} onChange={e=>assign('category',e.target.value as StudioCategory)}>
      {CATEGORIES.map(([key,name])=><option value={key} key={key}>{name}</option>)}
     </select>
     <small>{CATEGORY_GUIDE[draft.category]}</small>
    </label>
    {input('summary','WHAT ARE YOU MAKING?',280,3,'A short description of your idea, story, sound, game or artwork.')}
    <StudioWorkbench value={draft.description} disabled={locked}
     onChange={value=>assign('description',value)}/>
    {editorView==='advanced'&&<>
    <label className="st-check"><input type="checkbox" checked={draft.freeToUse} disabled={locked}
      onChange={e=>assign('freeToUse',e.target.checked)}/> I intend this work to be free to access when publication becomes available.</label>
    <hr className="st-rule"/>
    <div className="st-section-head"><div><p className="st-kicker">02 / RELEASE PREPARATION</p><h2>CREDITS, LINKS & RIGHTS.</h2></div></div>
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
    </>}
    <div className="st-actions">
     <button className="st-action" type="submit" disabled={locked||!dirty}>
      {busy?'SAVING PRIVATE REVISION…':project?'SAVE PRIVATE CHANGES':'CREATE PRIVATE DRAFT'}</button>
     <Link className="st-link" to="/studio">RETURN TO PROJECTS ↗</Link>
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
    <section className="st-panel">
     <p className="st-kicker">04 / REVIEW READINESS</p><h2>SUBMISSION CHECK.</h2>
     <ul className="st-checklist">
      <li data-ready={Boolean(project&&!dirty)}><span>{project&&!dirty?'✓':'○'}</span> Saved current revision</li>
      <li data-ready={Boolean(draft.demoUrl||draft.sourceUrl||eligibleAttachment)}><span>{draft.demoUrl||draft.sourceUrl||eligibleAttachment?'✓':'○'}</span> Public HTTPS link or matching private creation file</li>
      <li data-ready={draft.license.trim().length>=2}><span>{draft.license.trim().length>=2?'✓':'○'}</span> License / ownership stated</li>
      <li data-ready={draft.aiDisclosure.trim().length>=6}><span>{draft.aiDisclosure.trim().length>=6?'✓':'○'}</span> AI involvement disclosed</li>
      <li data-ready={draft.humanContribution.trim().length>=10}><span>{draft.humanContribution.trim().length>=10?'✓':'○'}</span> Human contributions credited</li>
     </ul>
     <p className="st-muted">Preparing a release is optional. A submitted project enters a private queue; there is no automatic publication, gameplay or XP reward.</p>
     {editorView==='simple'&&!ready&&<button type="button" className="st-link"
      onClick={()=>setEditorView('advanced')}>OPEN RELEASE DETAILS & CREDITS ↗</button>}
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
    <code>SHA-256: {asset.sha256}</code>
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
  studioAssets(project.id).then(r=>{if(alive){setAssets(r.assets);setStorageReady(r.storageReady);
   setMemberBytes(r.memberUsedBytes);setProjectBytes(r.projectUsedBytes);
   setGlobalBytes(r.globalUsedBytes);setGlobalCap(r.globalQuotaBytes);onAssetsChanged(r.assets)}}).catch(e=>{if(alive)setError(showError(e))});
  return()=>{alive=false;controller.current?.abort();};
 },[project.id,onAssetsChanged]);
 async function refresh(){const r=await studioAssets(project.id);setAssets(r.assets);
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
 const [projects,setProjects]=useState<StudioReviewProject[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const [reason,setReason]=useState<Record<string,string>>({}),[busy,setBusy]=useState('');
 const [manifests,setManifests]=useState<Record<string,StudioReviewManifest>>({});
 const [inspection,setInspection]=useState('');
 async function refresh(){const r=await studioReviewQueue();setProjects(r.projects);}
 useEffect(()=>{const ac=new AbortController();studioReviewQueue(ac.signal).then(r=>setProjects(r.projects))
  .catch(e=>{if(!ac.signal.aborted)setError(showError(e))})
  .finally(()=>{if(!ac.signal.aborted)setLoading(false)});
  return()=>ac.abort();},[]);
 async function inspect(p:StudioReviewProject){
  if(inspection)return;
  setInspection(p.id);setError('');
  try{const manifest=await studioReviewManifest(p.id);setManifests(v=>({...v,[p.id]:manifest}));}
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
  {loading&&<p role="status">Checking staff permission and review queue…</p>}
  {error&&<p role="alert" className="st-error">{error}</p>}
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
      <code>{a.sha256||'Hash pending'}</code>
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

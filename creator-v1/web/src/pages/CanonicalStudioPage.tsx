import {type DragEvent,type FormEvent,useEffect,useRef,useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {canonicalAuthClient,canonicalMe,type CanonicalProfile} from '../lib/canonical-beta';
import {
 studioHealth,studioList,studioGet,studioCreate,studioUpdate,studioSubmit,studioAssets,
 studioUpload,studioCheckFile,studioDeleteAsset,studioDownloadUrl,studioWithdraw,studioDeleteProject,studioReviewQueue,
 studioReviewDecision,type StudioDraft,type StudioProject,type StudioAsset,type StudioCategory,
 type StudioReviewProject,type StudioReviewHistory
} from '../lib/canonical-studio';
import './canonical-studio.css';

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
 useEffect(()=>{
  if(!id||session?.user?.emailVerified!==true)return;
  let live=true;const controller=new AbortController();
  setPhase('loading');setMessage('');
  Promise.all([studioHealth(controller.signal),canonicalMe(controller.signal)]).then(([health,profile])=>{
   if(!live)return;
   if(profile.memberId!==id)throw Error('Member identity changed. Sign in again.');
   if(!health.studioReady){setPhase('unavailable');return;}
   if(!profile.profile?.handle){setPhase('incomplete');return;}
   setIdentity(profile.profile);setUploads(health.studioUploadsReady===true);setPhase('ready');
  }).catch(e=>{if(live){setMessage(showError(e));setPhase('unavailable')}});
  return()=>{live=false;controller.abort();};
 },[id,session?.user?.emailVerified]);
 if(isPending)return <section className="st-status" role="status">VERIFYING CANONICAL MEMBER SESSION…</section>;
 if(!id||session?.user?.emailVerified!==true)return <section className="st-status">
  <span className="st-kicker">CONTINUANCE INSTITUTE / CREATOR STUDIO</span>
  <h1>SIGN IN TO CREATE.</h1><p>Private drafts belong to your verified ANEVUM account.</p>
  <Link className="st-action" to="/join">MEMBER SIGN-IN ↗</Link>
 </section>;
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
 return <main className="st-root" aria-label="Creator Studio">
  <header className="st-header">
   <div><Link className="st-back" to="/member">← MEMBER ATLAS</Link>
    <p className="st-kicker">ANEVUM / CONTINUANCE INSTITUTE / CREATOR STUDIO</p>
    <h1>{mode==='review'?'SUBMISSION REVIEW.':mode==='list'?'YOUR CREATIVE ARCHIVE.':mode==='new'?'BEGIN A NEW WORK.':'PROJECT WORKSPACE.'}</h1>
    <p>Build privately, preserve versions, and prepare original work for independent review.</p>
   </div>
   <div className="st-identity"><span>VERIFIED CREATOR</span><strong>@{identity?.handle}</strong><small>PRIVATE STAGING WORKSPACE</small></div>
  </header>
  <nav className="st-nav" aria-label="Studio navigation">
   <Link to="/studio" aria-current={mode==='list'?'page':undefined}>MY PROJECTS</Link>
   <Link to="/studio/new" aria-current={mode==='new'?'page':undefined}>NEW SUBMISSION</Link>
   <Link to="/studio/review" aria-current={mode==='review'?'page':undefined}>REVIEW DESK</Link>
   <Link to="/discover">DISCOVER ↗</Link>
  </nav>
  {mode==='list'?<StudioLibrary/>:mode==='review'?<StudioReview/>:<StudioEditor create={mode==='new'} uploadsReady={uploads}/>}
 </main>;
}

function StudioLibrary(){
 const [items,setItems]=useState<StudioProject[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{
  const ac=new AbortController();
  studioList(ac.signal).then(r=>setItems(r.projects)).catch(e=>{if(!ac.signal.aborted)setError(showError(e))})
   .finally(()=>{if(!ac.signal.aborted)setLoading(false)});
  return()=>ac.abort();
 },[]);
 const drafts=items.filter(p=>p.status==='draft'||p.status==='changes_requested').length;
 const pending=items.filter(p=>p.status==='pending_review').length;
 return <>
  <section className="st-metrics" aria-label="Your projects status">
   <div><span>TOTAL WORKS</span><strong>{loading?'—':items.length}</strong></div>
   <div><span>IN PROGRESS</span><strong>{loading?'—':drafts}</strong></div>
   <div><span>AWAITING REVIEW</span><strong>{loading?'—':pending}</strong></div>
   <div><span>PUBLIC RELEASES</span><strong>NOT YET ACTIVE</strong></div>
  </section>
  <section className="st-panel">
   <div className="st-section-head"><div><p className="st-kicker">01 / PERSONAL WORKSPACE</p><h2>PROJECT RECORDS</h2></div>
    <Link className="st-action" to="/studio/new">+ CREATE PROJECT</Link></div>
   <p className="st-muted">Your project records are private. Public publication, native gameplay and XP are not enabled through Studio uploads.</p>
   {loading&&<p role="status">Retrieving private projects…</p>}
   {error&&<p role="alert" className="st-error">{error}</p>}
   {!loading&&!error&&items.length===0&&<div className="st-empty">
    <span aria-hidden="true" className="st-orb">◎</span><h3>NO CREATIONS IN THE ARCHIVE.</h3>
    <p>Your first draft starts here. Try SIGNAL 001 or something entirely your own.</p>
    <Link className="st-action" to="/studio/new">START A PROJECT →</Link>
   </div>}
   <div className="st-project-grid">{items.map(p=><Link className="st-project" to={'/studio/'+p.id} key={p.id}>
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
  studioGet(id,ac.signal).then(({project:p,reviewHistory})=>{if(!ac.signal.aborted){setProject(p);setHistory(reviewHistory);const fields=editForm(p);setDraft(fields);setSaved(fields);}})
   .catch(e=>{if(!ac.signal.aborted)setError(showError(e))})
   .finally(()=>{if(!ac.signal.aborted)setLoading(false)});
  return()=>ac.abort();
 },[id,create]);
 const canEdit=!project||editable(project);
 const dirty=saved===null||JSON.stringify(saved)!==JSON.stringify(draft);
 const ready=Boolean((draft.demoUrl||draft.sourceUrl)&&draft.license.trim().length>=2&&
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
    <div className="st-section-head"><div><p className="st-kicker">01 / WORK IDENTITY</p><h2>{project?'REFINE THE RECORD.':'GIVE YOUR WORK A NAME.'}</h2></div>
     {project&&<span className="st-tag">{pretty(project.status)} · REV {project.revision}</span>}</div>
    {input('title','PROJECT TITLE',100,0,'3–100 characters.')}
    {input('slug','PROJECT SLUG',90,0,'Lowercase letters, numbers and hyphens; unique per creator.')}
    <label className="st-field"><span>CREATION TYPE</span>
     <select value={draft.category} disabled={locked} onChange={e=>assign('category',e.target.value as StudioCategory)}>
      {CATEGORIES.map(([key,name])=><option value={key} key={key}>{name}</option>)}
     </select>
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
     <small>Optional for a draft. A real public demo OR source link is required for review until native hosting launches.</small>
    </label>
    <label className="st-field"><span>PUBLIC SOURCE CODE URL (HTTPS)</span>
     <input type="url" value={draft.sourceUrl||''} disabled={locked} maxLength={1500}
      onChange={e=>assign('sourceUrl',e.target.value||null)}/></label>
    {input('license','RIGHTS OR LICENSE',80,0,'Identify your actual rights; a public repository does not automatically grant reuse.')}
    {input('aiDisclosure','AI INVOLVEMENT',1200,3,'Explain any AI assistance, or write that none was used.')}
    {input('humanContribution','HUMAN CREATION & CREDITS',1200,3,'Credit your own work and collaborators.')}
    <div className="st-actions">
     <button className="st-action" type="submit" disabled={locked||!dirty}>
      {busy?'SAVING PRIVATE REVISION…':project?'SAVE CHANGES':'CREATE PRIVATE DRAFT'}</button>
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
    {project&&<StudioUploader project={project} uploadsReady={uploadsReady}/>}
    <section className="st-panel">
     <p className="st-kicker">04 / REVIEW READINESS</p><h2>SUBMISSION CHECK.</h2>
     <ul className="st-checklist">
      <li data-ready={Boolean(project&&!dirty)}><span>{project&&!dirty?'✓':'○'}</span> Saved current revision</li>
      <li data-ready={Boolean(draft.demoUrl||draft.sourceUrl)}><span>{draft.demoUrl||draft.sourceUrl?'✓':'○'}</span> Public demo or source link</li>
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

function StudioUploader({project,uploadsReady}:{project:StudioProject;uploadsReady:boolean}){
 const [assets,setAssets]=useState<StudioAsset[]>([]);
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
  if(!uploadsReady)return;
  let alive=true;
  studioAssets(project.id).then(r=>{if(alive)setAssets(r.assets)}).catch(e=>{if(alive)setError(showError(e))});
  return()=>{alive=false;controller.current?.abort();};
 },[project.id,uploadsReady]);
 async function refresh(){setAssets((await studioAssets(project.id)).assets);}
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
  setBusy(true);setError('');setNotice('');
  const ac=new AbortController();controller.current=ac;let completed=0;
  try{
   for(const file of queue){setProgress('UPLOADING '+(completed+1)+'/'+queue.length+' — '+file.name);
    await studioUpload(project.id,file,ac.signal);completed++;
   }
   setQueue([]);setNotice('Files stored in private quarantine. None were published, scanned, or made playable.');
   await refresh();
  }catch(e){
   setQueue(v=>v.slice(completed));
   setError(ac.signal.aborted?'Upload cancelled. Any incomplete reservation remains private until cleanup.':showError(e));
   try{await refresh();}catch{/* owner can retry */}
  }finally{controller.current=null;setProgress('');setBusy(false);}
 }
 async function remove(a:StudioAsset){
  // Private file withdrawal remains available when a draft is review-locked.
  if(busy)return;
  if(!window.confirm('Remove the private file '+a.name+' from this project?'))return;
  setBusy(true);setError('');setNotice('');
  try{await studioDeleteAsset(project.id,a.id);await refresh();setNotice('Private file removed.');}
  catch(e){setError(showError(e));}finally{setBusy(false);}
 }
 function dropped(e:DragEvent<HTMLDivElement>){e.preventDefault();setDrag(false);accept(e.dataTransfer.files);}
 return <section className="st-panel st-assets">
  <p className="st-kicker">FILES / PRIVATE QUARANTINE</p><h2>THE ASSET VAULT.</h2>
  {!uploadsReady?<p className="st-muted">Uploads are disabled until isolated Cloudflare R2 storage, a verified migration, and security checks are activated. Draft editing remains available.</p>:<>
   <p className="st-muted">Images / PDF: 10 MiB. MP3 / WAV / ZIP: 20 MiB. TXT / MD: 1 MiB. 20 files per project, 100 MiB per member.</p>
   {editable(project)&&<div className={'st-drop'+(drag?' is-drag':'')}
    onDragOver={e=>{e.preventDefault();if(!busy)setDrag(true);}}
    onDragLeave={()=>setDrag(false)} onDrop={dropped} role="group" aria-label="Upload private project files">
    <label htmlFor="st-files">DRAG FILES HERE OR SELECT FROM DEVICE</label>
    <input id="st-files" type="file" multiple disabled={busy}
      accept=".png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.pdf,.txt,.md,.zip"
      onChange={e=>{accept(e.target.files);e.currentTarget.value='';}}/>
    <small>ZIP archives are stored privately. They are not installed or executed.</small>
   </div>}
   {queue.length>0&&<div className="st-upload-queue"><h3>READY TO STORE / {queue.length} FILES</h3>
    {queue.map((f,i)=><p key={f.name+'-'+i}>{f.name} · {size(f.size)}</p>)}
    {preview&&<img className="st-local-preview" src={preview} alt="Local image preview before private upload"/>}
    {progress&&<p role="status">{progress}</p>}
    <div className="st-actions"><button className="st-button" disabled={busy} onClick={()=>void upload()}>
     {busy?'STORING…':'UPLOAD TO PRIVATE VAULT'}</button>
     {busy&&<button className="st-link" onClick={()=>controller.current?.abort()}>CANCEL</button>}
    </div>
   </div>}
   <div className="st-file-list">{assets.map(a=><div className="st-file" key={a.id}>
    <div><strong>{a.name}</strong><small>{a.kind.toUpperCase()} / {size(a.sizeBytes)} / {a.status.toUpperCase()}</small></div>
    <div className="st-file-actions">
     {a.status==='quarantined'&&<a href={studioDownloadUrl(project.id,a.id)} download={a.name}>DOWNLOAD</a>}
     {a.status!=='uploading'&&<button disabled={busy} onClick={()=>void remove(a)}>REMOVE</button>}
    </div>
   </div>)}</div>
   {assets.length===0&&<p className="st-muted">No private attachments yet.</p>}
  </>}
  {notice&&<p role="status" className="st-success">{notice}</p>}
  {error&&<p role="alert" className="st-error">{error}</p>}
 </section>;
}

function StudioReview(){
 const [projects,setProjects]=useState<StudioReviewProject[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const [reason,setReason]=useState<Record<string,string>>({}),[busy,setBusy]=useState('');
 async function refresh(){const r=await studioReviewQueue();setProjects(r.projects);}
 useEffect(()=>{const ac=new AbortController();studioReviewQueue(ac.signal).then(r=>setProjects(r.projects))
  .catch(e=>{if(!ac.signal.aborted)setError(showError(e))})
  .finally(()=>{if(!ac.signal.aborted)setLoading(false)});
  return()=>ac.abort();},[]);
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
    <dt>Demo</dt><dd>{p.demo_url||'Not supplied'}</dd></dl>
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

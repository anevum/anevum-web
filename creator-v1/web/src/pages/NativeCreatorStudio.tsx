import {useCallback,useEffect,useRef,useState,lazy,Suspense,type FormEvent,type ReactNode} from 'react';
import {Link,NavLink,useLocation,useNavigate,useParams,useSearchParams} from 'react-router-dom';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {readWithDeadline} from '../../../shared/read-deadline.mjs';
import {IsolatedProjectViewport} from '../components/IsolatedProjectViewport';
import {
 nativeCreatorEnabled,packageId,nativePlayerPath,nativeBuildPath,readNativeSession,readNativeLibrary,
 readNativeQueue,readNativePlayback,uploadNativeBuild,nativeBuildAction,checkNativeFile,
 type NativeSession,type NativeProject,type NativePlayback,type BuildAction,type PackageCategory
} from '../lib/native-creator-v095';
import {inspectLocalBrowserBuild,type LocalCompatibilityReport} from '../lib/native-compatibility-v101';
import './canonical-studio.css';
import './native-creator-v095.css';
const SourceWorkbench=import.meta.env.VITE_PARITY_V136_FULL==='true'?lazy(()=>import('../parity/ArtifactWorkbenchV136').then(m=>({default:m.ArtifactWorkbenchV136}))):null;
const message=(e:unknown)=>e instanceof Error?e.message:'Creator Studio is temporarily unavailable.';
const pretty=(value:string)=>value.replaceAll('_',' ');
const bytes=(n:number)=>(n/1048576).toFixed(1)+' MiB';
function useRead<T>(key:string,enabled:boolean,loader:(signal:AbortSignal)=>Promise<T>){
 const [revision,setRevision]=useState(0),[state,setState]=useState<{key:string;data:T|null;error:string;loading:boolean}>({key:'',data:null,error:'',loading:false});
 const load=useRef(loader);load.current=loader;
 useEffect(()=>{
  if(!enabled)return;
  const ac=new AbortController();let current=true;
  setState({key,data:null,error:'',loading:true});
  readWithDeadline(signal=>load.current(signal),ac.signal).then(data=>{if(current)setState({key,data,error:'',loading:false});})
   .catch(e=>{if(current)setState({key,data:null,error:message(e),loading:false});});
  return()=>{current=false;ac.abort();};
 },[key,enabled,revision]);
 const reload=useCallback(()=>setRevision(n=>n+1),[]);
 // Hide old-account data in the same render that observes a new session key,
 // rather than waiting for the asynchronous effect cleanup.
 return {...(enabled&&state.key===key?state:{key,data:null,error:'',loading:enabled}),reload};
}
function useIdentity(){
 const {data:session,isPending}=canonicalAuthClient.useSession();
 return {pending:isPending,id:session?.user?.emailVerified===true?session.user.id:null};
}
function Status({title,children,retry}:{title:string;children:ReactNode;retry?:()=>void}){
 return <section className="st-status av095-status"><p className="st-kicker">CONTINUANCE INSTITUTE / CREATOR STUDIO</p><h1>{title}</h1><div>{children}</div><div className="av095-actions">{retry&&<button className="st-action" type="button" onClick={retry}>Try again</button>}<Link className="st-action" to="/studio">Creator Studio</Link><Link className="st-action" to="/member">My Space</Link></div></section>;
}
export function NativeStudioNavigation({capabilities}:{capabilities?:NativeSession}){
 const identity=useIdentity(),location=useLocation();
 const navRef=useRef<HTMLElement>(null);
 const own=useRead('nav:'+identity.id,nativeCreatorEnabled&&!capabilities&&!!identity.id,signal=>readNativeSession(identity.id!,signal));
 const permissions=capabilities||own.data;
 useEffect(()=>{
  // Keep the active destination wholly visible on narrow screens, without
  // scrolling the document or stealing keyboard focus. Permissions can arrive
  // after initial render; recenter when those links become available.
  const nav=navRef.current;
  const active=nav?.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
  if(!nav||!active)return;
  const bounds=nav.getBoundingClientRect(),item=active.getBoundingClientRect();
  const x=nav.scrollLeft+(item.left-bounds.left)-(nav.clientWidth-item.width)/2;
  nav.scrollLeft=Math.max(0,Math.min(nav.scrollWidth-nav.clientWidth,x));
 },[location.pathname,permissions?.canUpload,permissions?.canReview]);
 if(!nativeCreatorEnabled)return null;
 return <nav ref={navRef} className="st-nav av095-navigation" aria-label="Creator Studio navigation">
  <NavLink to="/studio" end>Studio home</NavLink><NavLink to="/studio/packages" end>Playable builds</NavLink><NavLink to="/studio/records" end>Project records</NavLink>
  {(permissions?.canUpload)&&<NavLink to="/studio/packages/new">Upload build</NavLink>}
  {permissions?.canReview&&<NavLink to="/studio/packages/review">Package review</NavLink>}
  <NavLink to="/studio/new" end>New private record</NavLink><NavLink to="/discover">Discover</NavLink>
 </nav>;
}
interface Decision{project:NativeProject;releaseId:string;action:BuildAction;sha?:string|null}
const decisions:Record<BuildAction,{title:string;copy:string;accept:string;reason?:boolean}>={
 save:{title:'Keep this private build?',copy:'Save this exact build so the 48-hour temporary test limit no longer applies. It remains private.',accept:'Save private draft'},
 submit:{title:'Submit this build for review?',copy:'Submit the exact saved build you have playtested. This does not publish it or approve its contents.',accept:'Submit for review'},
 discard:{title:'Discard this private build?',copy:'Remove this unsubmitted revision and reclaim its files. Any approved public version stays live.',accept:'Discard private build'},
 delete:{title:'Delete this unpublished project?',copy:'Remove this unpublished project and its private files. This cannot be used to delete an approved release.',accept:'Delete unpublished project'},
 publish:{title:'Approve this exact build?',copy:'Confirm your independent review of the playable build, content rights, safety and device behavior. Approval publishes this version.',accept:'Approve and publish'},
 reject:{title:'Request changes?',copy:'Record a specific issue for the creator. Any current approved release remains available.',accept:'Request changes',reason:true},
 suspend:{title:'Suspend this release?',copy:'Temporarily hide this approved release while the recorded issue is investigated. Its files are retained.',accept:'Suspend release',reason:true},
 restore:{title:'Restore this release?',copy:'Confirm the suspension issue is resolved. This restores the previously approved release; it does not approve a pending revision.',accept:'Restore approved release'}
};
function DecisionDialog({decision,onClose,onComplete}:{decision:Decision;onClose:()=>void;onComplete:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),locked=useRef(false);
 const [checked,setChecked]=useState(false),[reason,setReason]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const detail=decisions[decision.action];
 useEffect(()=>{const opener=document.activeElement as HTMLElement|null;dialog.current?.showModal();return()=>{dialog.current?.close();opener?.focus();};},[]);
 async function confirm(event:FormEvent){
  event.preventDefault();if(!checked||locked.current)return;
  if(detail.reason&&(reason.trim().length<10||reason.length>1000)){setError('Record a specific reason of 10 to 1,000 characters.');return;}
  locked.current=true;setBusy(true);setError('');
  try{await nativeBuildAction(decision.project.id,decision.releaseId,decision.action,reason.trim());onComplete();}
  catch(e){setError(message(e));}finally{locked.current=false;setBusy(false);}
 }
 return <dialog ref={dialog} className="av095-decision" aria-labelledby="av095-decision-title" aria-describedby="av095-decision-copy" onCancel={event=>{event.preventDefault();if(!busy)onClose();}}>
  <form onSubmit={event=>void confirm(event)}><p className="st-kicker">EXACT BUILD / {pretty(decision.action)}</p><h2 id="av095-decision-title">{detail.title}</h2>
   <p id="av095-decision-copy">{detail.copy}</p><strong>{decision.project.title}</strong>
   <p className="av095-build-id">Release {decision.releaseId}</p>
   {decision.sha&&<p className="av095-build-id">SHA-256 {decision.sha}</p>}
   {detail.reason&&<label className="st-field"><span>Reason</span><textarea required minLength={10} maxLength={1000} value={reason} disabled={busy} onChange={e=>setReason(e.target.value)}/></label>}
   <label className="av095-confirm"><input type="checkbox" required checked={checked} disabled={busy} onChange={e=>setChecked(e.target.checked)}/><span>{decision.action==='publish'?'I independently reviewed this exact build and am authorized to approve it.':'I understand and confirm this action on the identified build.'}</span></label>
   {error&&<p className="st-error" role="alert">{error}</p>}
   <div className="av095-actions"><button type="button" className="st-action" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className="st-action av095-primary" disabled={!checked||busy}>{busy?'Recording action…':detail.accept}</button></div>
  </form>
 </dialog>;
}
function BuildCard({project,review=false,onDecision}:{project:NativeProject;review?:boolean;onDecision:(d:Decision)=>void}){
 const pending=project.draftStatus==='pending_review',ready=project.draftStatus==='ready';
 const expired=project.retention==='test'&&!!project.expiresAt&&project.expiresAt<=Date.now()/1000;
 const playableDraft=!!project.draftReleaseId&&(pending||ready)&&!expired;
 const label=project.status==='suspended'?'Suspended':pending?'Update in review':expired?'Private test expired':ready?'Private build ready':pretty(project.status);
 return <article className="st-panel av095-build-card" data-native-project={project.id}>
  <div className="av095-card-cover">{project.coverUrl?<img alt={'Cover for '+project.title} src={project.coverUrl} loading="lazy" referrerPolicy="no-referrer"/>:SourceWorkbench?<div className="av136032-record-blank"><small>NO COVER UPLOADED</small><strong>{pretty(project.category)}</strong></div>:<div className="av095-record-art" aria-hidden="true"><i/><i/><i/></div>}<span>{project.category} / {label}</span></div>
  <div className="av095-card-body"><p className="st-kicker">{project.version?'BUILD '+String(project.version).padStart(2,'0'):'PROJECT RECORD'}</p><h2>{project.draftTitle||project.title}</h2><p>{project.draftSummary||project.summary}</p>
   {SourceWorkbench&&<div className="av136032-release-flags" aria-label="Project revision status">
    {project.liveReleaseId?<span>{project.status==='suspended'?'Approved release suspended':'Approved public release retained'}</span>:<span>Not publicly released</span>}
    {project.draftReleaseId&&<span>{pending?'Private revision in review':expired?'Temporary private test expired':ready?'Private revision ready':'Private revision retained'}</span>}
   </div>}
   {project.liveReleaseId&&pending&&<p className="av095-live-note">The approved version remains live while this update is reviewed.</p>}
   {project.retention&&<p className="st-muted">{project.retention==='saved'?'Saved private draft':expired?'Temporary preview expired':'Temporary private test — save it to keep it'}</p>}
   {project.reviewReason&&<p className="st-error">Reviewer note: {project.reviewReason}</p>}
   <div className="av095-actions av136032-build-actions">
    {playableDraft&&<Link className="st-action av095-primary" to={nativePlayerPath(project.id,true)}>{review?'Review playable build':'Private playtest'}</Link>}
    {project.liveReleaseId&&project.status==='published'&&<Link className="st-action" to={nativePlayerPath(project.id)}>Play live version</Link>}
    {!review&&!pending&&project.status!=='suspended'&&<Link className="st-action" to={nativeBuildPath(project.id)}>{ready?'Replace private build':'Upload revision'}</Link>}
    {!review&&ready&&project.draftReleaseId&&<>
     {!expired&&project.retention==='test'&&<button className="st-action" onClick={()=>onDecision({project,releaseId:project.draftReleaseId!,action:'save'})}>Save draft</button>}
     {!expired&&<button className="st-action" onClick={()=>onDecision({project,releaseId:project.draftReleaseId!,action:'submit'})}>Submit for review</button>}
     <button className="st-action av136032-discard" onClick={()=>onDecision({project,releaseId:project.draftReleaseId!,action:'discard'})}>Discard private build</button>
    </>}
    {review&&project.liveReleaseId&&['published','suspended'].includes(project.status)&&<button className="st-action" onClick={()=>onDecision({project,releaseId:project.liveReleaseId!,action:project.status==='suspended'?'restore':'suspend'})}>{project.status==='suspended'?'Restore release':'Suspend release'}</button>}
   </div>
  </div>
 </article>;
}
function BuildLibrary({memberId}:{memberId:string}){
 const library=useRead('library:'+memberId,true,signal=>readNativeLibrary(memberId,signal));
 // Unpublished projects and review state never enter public/shareable URLs.
 const [search,setSearch]=useState(''),[decision,setDecision]=useState<Decision|null>(null);
 const [status,setStatus]=useState<'all'|'private'|'review'|'live'>('all'),[view,setView]=useState<'grid'|'list'>('grid');
 const items=library.data?.projects||[];
 const inReview=(p:NativeProject)=>p.draftStatus==='pending_review'||p.status==='pending_review';
 const privateBuild=(p:NativeProject)=>!inReview(p)&&((!!p.draftReleaseId)||(!p.liveReleaseId&&p.status!=='suspended'));
 const live=(p:NativeProject)=>!!p.liveReleaseId&&p.status==='published';
 const counts={all:items.length,private:items.filter(privateBuild).length,review:items.filter(inReview).length,live:items.filter(live).length};
 const scoped=SourceWorkbench?items.filter(p=>status==='all'||status==='private'&&privateBuild(p)||status==='review'&&inReview(p)||status==='live'&&live(p)):items;
 const term=search.trim().toLowerCase();
 const visible=scoped.filter(p=>(p.title+' '+(p.draftTitle||'')+' '+p.summary).toLowerCase().includes(term));
 return <>
  <section className="st-panel av095-library-head"><div><p className="st-kicker">YOUR PLAYABLE ARCHIVE</p><h2>Build privately. Release deliberately.</h2><p>Saved drafts, exact versions, review decisions, and live releases stay attached to the same project.</p></div><Link className="st-action av095-primary" to="/studio/packages/new">Upload a build</Link></section>
  {library.data?.usage&&<section className="av095-storage" aria-label="Private build storage"><div><strong>{bytes(library.data.usage.memberPhysicalBytes)} / {bytes(library.data.usage.memberPhysicalLimit)}</strong><span>Private storage, including files awaiting cleanup</span></div><progress max={library.data.usage.memberPhysicalLimit} value={Math.min(library.data.usage.memberPhysicalBytes,library.data.usage.memberPhysicalLimit)}/><p>Temporary tests last 48 hours. Saving retains a draft. Replacing a draft never removes the approved public version.</p></section>}
  {SourceWorkbench&&<section className="av136032-library-tools" aria-label="Build library controls">
   <div className="av136032-toolbar"><div><p className="st-kicker">REVISIONS / WORKSPACE</p><div className="av136032-filter-buttons" role="group" aria-label="Filter your build statuses">
    {([{id:'all',label:'All'},{id:'private',label:'Private'},{id:'review',label:'In review'},{id:'live',label:'Live'}] as const).map(tab=><button key={tab.id} type="button" data-native-filter={tab.id} aria-pressed={status===tab.id} onClick={()=>setStatus(tab.id)}><span>{tab.label}</span><span className="av136032-tab-count">{counts[tab.id]}</span></button>)}
   </div></div><div className="av136032-view-buttons" role="group" aria-label="Build library layout">
    <button type="button" data-library-view="grid" aria-pressed={view==='grid'} onClick={()=>setView('grid')}>Grid</button>
    <button type="button" data-library-view="list" aria-pressed={view==='list'} onClick={()=>setView('list')}>List</button>
   </div></div>
   <p className="av136032-library-explanation">A project can appear in both Live and In review while an approved release remains available. Filters do not change builds or permissions.</p>
  </section>}
  <label className="st-field av095-search"><span>Find your build</span><input type="search" maxLength={100} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search your project titles"/></label>
  {SourceWorkbench&&!library.loading&&!library.error&&<p className="av136032-library-count" role="status">{visible.length} {visible.length===1?'build':'builds'} shown · {items.length} in your archive</p>}
  {library.loading&&<p role="status">Loading your saved builds…</p>}
  {library.error&&<div role="alert" className="st-error"><p>{library.error}</p><button className="st-action" onClick={library.reload}>Reload builds</button></div>}
  {!library.loading&&!library.error&&!visible.length&&<div className="st-empty"><h2>{items.length?'No matching builds.':'Your first playable work starts here.'}</h2><p>{items.length?'Change the current view or search to see other revisions.':'Upload a browser build to make a private playtest. Nothing is published automatically.'}</p>
   {SourceWorkbench&&items.length>0&&(status!=='all'||!!term)&&<button type="button" className="st-action" onClick={()=>{setSearch('');setStatus('all')}}>Show all builds</button>}
  </div>}
  <div className={'av095-build-grid'+(SourceWorkbench?' av136032-build-grid':'')} data-layout={SourceWorkbench?view:undefined}>{!library.loading&&!library.error&&visible.map(p=><BuildCard key={p.id} project={p} onDecision={setDecision}/>)}</div>
  {decision&&<DecisionDialog decision={decision} onClose={()=>setDecision(null)} onComplete={()=>{setDecision(null);library.reload();}}/>}
 </>;
}
function BuildUpload({memberId,projectId}:{memberId:string;projectId?:string}){
 const navigate=useNavigate(),busyRef=useRef(false);
 const library=useRead('editing:'+memberId+':'+projectId,!!projectId,signal=>readNativeLibrary(memberId,signal));
 const project=library.data?.projects.find(p=>p.id===projectId);
 const [sourceOpen,setSourceOpen]=useState(false),[sourceStarted,setSourceStarted]=useState(false),[sourceDirty,setSourceDirty]=useState(false),[sourceFile,setSourceFile]=useState(false);
 const [file,setFile]=useState<File|null>(null),[cover,setCover]=useState<File|null>(null),[coverUrl,setCoverUrl]=useState<string|null>(null);
 const [title,setTitle]=useState(''),[summary,setSummary]=useState(''),[category,setCategory]=useState<PackageCategory>('game');
 const [rights,setRights]=useState(false),[replace,setReplace]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [compatibility,setCompatibility]=useState<LocalCompatibilityReport|null>(null);
 const [compatibilityError,setCompatibilityError]=useState(''),[checkingCompatibility,setCheckingCompatibility]=useState(false);
 const compatibilityVersion=useRef(0);
 const detailsTitle=useRef<HTMLInputElement>(null),buildFileInput=useRef<HTMLInputElement>(null);
 const initialized=useRef<string|null>(null);
 useEffect(()=>{if(project&&initialized.current!==project.id){initialized.current=project.id;setTitle(project.draftTitle||project.title);setSummary(project.draftSummary||project.summary);setCategory(project.draftCategory||project.category);}},[project]);
 useEffect(()=>{if(!cover){setCoverUrl(null);return;}const url=URL.createObjectURL(cover);setCoverUrl(url);return()=>URL.revokeObjectURL(url);},[cover]);
 useEffect(()=>{
  const version=++compatibilityVersion.current;
  setCompatibility(null);setCompatibilityError('');
  if(!file){setCheckingCompatibility(false);return;}
  setCheckingCompatibility(true);
  void inspectLocalBrowserBuild(file).then(result=>{
   if(version===compatibilityVersion.current)setCompatibility(result);
  }).catch(()=>{
   if(version===compatibilityVersion.current)setCompatibilityError('The local file could not be inspected. Select a new browser export and retry.');
  }).finally(()=>{if(version===compatibilityVersion.current)setCheckingCompatibility(false);});
  return()=>{compatibilityVersion.current++;};
 },[file]);
 useEffect(()=>{
  if(!sourceDirty)return;
  const guard=(event:MouseEvent)=>{
   const anchor=(event.target as Element)?.closest?.('a[href]');
   if(anchor&&!window.confirm('Your source changes have not been packaged or uploaded. Leave this workspace?')){event.preventDefault();event.stopPropagation()}
  };
  document.addEventListener('click',guard,true);return()=>document.removeEventListener('click',guard,true);
 },[sourceDirty]);
 const dirty=!!file||!!cover||rights||sourceDirty;
 const coverProblem=cover&&(!/\.png$/i.test(cover.name)||cover.size<70||cover.size>3*1048576)?'Cover artwork must be a PNG between 70 bytes and 3 MiB.':'';
 useEffect(()=>{if(!dirty)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};addEventListener('beforeunload',warn);return()=>removeEventListener('beforeunload',warn);},[dirty]);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busyRef.current)return;
  const problem=checkNativeFile(file);if(problem){setError(problem);return;}
  if(coverProblem){setError(coverProblem);return;}
  if(!rights){setError('Confirm your publication rights for this exact uploaded version.');return;}
  if(project?.draftReleaseId&&!replace){setError('Confirm replacement of the existing unsubmitted private build.');return;}
  if(checkingCompatibility||!compatibility){setError('Complete the local compatibility check before uploading.');return;}
  if(!compatibility.playableCandidate){setError('This file needs a browser-ready export before uploading. Review the local findings.');return;}
  if(!e.currentTarget.reportValidity())return;
  busyRef.current=true;setBusy(true);setError('');
  const form=new FormData();form.set('file',file!);form.set('title',title.trim());form.set('summary',summary.trim());form.set('category',category);form.set('rights_ack','yes');
  if(cover)form.set('cover',cover);
  if(project){form.set('project_id',project.id);if(project.draftReleaseId){form.set('replace_draft','1');form.set('expected_release_id',project.draftReleaseId);}}
  try{const result=await uploadNativeBuild(form);setFile(null);setCover(null);setRights(false);navigate(nativePlayerPath(result.id,result.status!=='published'));}
  catch(e){setError(message(e));}finally{busyRef.current=false;setBusy(false);}
 }
 if(projectId&&!packageId(projectId))return <Status title="Project unavailable."><p>That identifier is not a valid playable project.</p></Status>;
 if(projectId&&(library.loading||!library.data&&!library.error))return <p role="status">Loading the saved project…</p>;
 if(library.error)return <Status title="The saved project could not be loaded." retry={library.reload}><p>{library.error}</p></Status>;
 if(projectId&&!project)return <Status title="Project unavailable."><p>This project is not in the signed-in creator's archive.</p></Status>;
 if(project?.draftStatus==='pending_review'||project?.status==='suspended')return <Status title="This build is not editable."><p>{project.status==='suspended'?'A moderator must resolve the suspension.':'The submitted revision is awaiting an independent decision. Your approved release remains unchanged.'}</p></Status>;
 const preparation=checkingCompatibility?'Checking the selected build on this device.':
  !file?'Choose a browser export or prepare an archive in the source workbench.':
  !compatibility?.playableCandidate?'Resolve the local compatibility findings before uploading.':
  coverProblem?coverProblem:
  title.trim().length<3||summary.trim().length<10?'Add a project title and describe what someone can do in your creation.':
  !rights?'Confirm your rights to the files in this version.':
  project?.draftReleaseId&&!replace?'Confirm replacement of the existing unsubmitted private build.':
  'Ready for a private upload. You can test the saved build before submitting it for review.';
 return <div className={'av095-upload-grid'+(SourceWorkbench?' av136031-build-flow':'')}><section className="st-panel"><p className="st-kicker">{project?'IMMUTABLE REVISION':'NEW PLAYABLE BUILD'}</p><h2>{project?'Prepare the next version.':'Give your creation a home.'}</h2><p>Your build stays private until an independent reviewer approves it.</p>
  {SourceWorkbench&&<div className="av095-source-entry"><button type="button" className="st-action" aria-expanded={sourceOpen} onClick={()=>{setSourceStarted(true);setSourceOpen(v=>!v)}}>Artifact source workbench</button><p className="st-muted">Edit a self-contained browser build here, or upload an export from your existing tools.</p></div>}
  {SourceWorkbench&&sourceStarted&&<div hidden={!sourceOpen}><Suspense fallback={<p role="status">Opening the local source workbench…</p>}><SourceWorkbench disabled={busy}
   onDirty={()=>{setSourceDirty(true);if(sourceFile){setFile(null);setSourceFile(false)}setRights(false)}}
   onPackage={archive=>{if(buildFileInput.current)buildFileInput.current.value='';setFile(archive);setSourceFile(true);setSourceDirty(false);setRights(false);setError('')}}/></Suspense>
   {sourceFile&&file&&<div className="av136031-source-handoff">
    <div><strong>Archive prepared on this device.</strong><p>Your source stays open. Add the details for this version below.</p></div>
    <button type="button" className="st-action" disabled={busy} onClick={()=>{
     detailsTitle.current?.focus({preventScroll:true});
     detailsTitle.current?.scrollIntoView({block:'center'});
    }}>Continue to build details</button>
   </div>}
  </div>}
  <form onSubmit={e=>void submit(e)} aria-busy={busy}>
   <fieldset disabled={busy} className="av095-fields">
    <legend className="visually-hidden">Prepare a private browser build</legend>
    <section className="av136031-build-step" aria-labelledby="av136031-file-heading">
    <header><span aria-hidden="true">01</span><div><h3 id="av136031-file-heading">Browser build</h3><p>Choose your export. Compatibility checks run locally before any upload.</p></div></header>
    {SourceWorkbench?<div className="av095-drop av136033-build-picker" data-selected-source={sourceFile&&file?'workbench':file?'device':'none'}>
     <span className="st-kicker">01 / EXPORTED BROWSER BUILD</span>
     <strong>{file?file.name:'Choose a ZIP or HTML file'}</strong>
     <span>{file?bytes(file.size):'ZIP up to 20 MiB · HTML up to 5 MiB'}</span>
     {sourceFile&&file&&<p className="av136033-prepared-note" role="status">Prepared in your source workbench. This archive is already selected; no second file selection is needed.</p>}
     <details className="av136033-file-alternative" open={!sourceFile}>
      <summary>{sourceFile&&file?'Use a different browser export instead':'Select a browser export from your device'}</summary>
      <label><span className="visually-hidden">Browser ZIP or HTML export</span>
       <input ref={buildFileInput} aria-label="Browser ZIP or HTML export" type="file" accept=".zip,.html,application/zip,text/html" required={!file} onChange={e=>{
        const chosen=e.target.files?.[0];if(!chosen)return;
        setSourceFile(false);setFile(chosen);setRights(false);setError('');
       }}/>
      </label>
     </details>
    </div>:<label className="av095-drop"><span className="st-kicker">01 / EXPORTED BROWSER BUILD</span><strong>{file?file.name:'Choose a ZIP or HTML file'}</strong><span>{file?bytes(file.size):'ZIP up to 20 MiB · HTML up to 5 MiB'}</span><input type="file" accept=".zip,.html,application/zip,text/html" required={!file} onChange={e=>{setSourceFile(false);setFile(e.target.files?.[0]||null);setRights(false);setError('');}}/></label>}
    {file&&<section className="av095-preflight" aria-label="Local compatibility findings" aria-live="polite">
     <p className="st-kicker">LOCAL COMPATIBILITY / ADVISORY</p>
     {checkingCompatibility&&<p role="status">Inspecting browser package structure on this device…</p>}
     {compatibilityError&&<p role="alert" className="st-error">{compatibilityError}</p>}
     {compatibility&&<>
      <strong>{compatibility.playableCandidate?'Browser build candidate':'Not ready for playable upload'}</strong>
      <p>Detected runtime: {pretty(compatibility.runtime)} · Entry: {compatibility.entrypoint||'Not detected'}</p>
      {compatibility.issues.length>0&&<ul>{compatibility.issues.map((issue,index)=><li key={issue.code+index}>
       <strong>{issue.severity.toUpperCase()} / {issue.code}</strong><span>{issue.message}</span><small>{issue.fix}</small>
      </li>)}</ul>}
      <small>Local inspection only. No data is uploaded until you submit. This is not security review, malware scanning, mobile certification or publication approval.</small>
     </>}
    </section>}
    </section>
    <section className="av136031-build-step" aria-labelledby="av136031-details-heading">
    <header><span aria-hidden="true">02</span><div><h3 id="av136031-details-heading">Project details</h3><p>Describe this version and add your own cover if you have one.</p></div></header>
    <div className="av095-form-grid"><label className="st-field"><span>Project title</span><input ref={detailsTitle} required minLength={3} maxLength={100} value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="st-field"><span>Type</span><select value={category} onChange={e=>setCategory(e.target.value as PackageCategory)}><option value="game">Game</option><option value="app">Application</option><option value="simulation">Simulation</option><option value="story">Interactive story</option></select></label></div>
    <label className="st-field"><span>What can someone do in it?</span><textarea required minLength={10} maxLength={500} value={summary} onChange={e=>setSummary(e.target.value)}/></label>
    <label className="st-field"><span>Cover artwork — optional</span><input type="file" accept=".png,image/png" onChange={e=>{setCover(e.target.files?.[0]||null);setRights(false);}}/><small>Original PNG. Up to 3 MiB. At least 640 × 360 pixels. The server verifies image structure.</small></label>
    {coverUrl&&<img className="av095-cover-preview" src={coverUrl} alt="Your selected cover artwork"/>}
    </section>
    <section className="av136031-build-step" aria-labelledby="av136031-playtest-heading">
    <header><span aria-hidden="true">03</span><div><h3 id="av136031-playtest-heading">Private playtest</h3><p>Upload this version privately, then test it before requesting independent review.</p></div></header>
    {project?.draftReleaseId&&<label className="av095-confirm"><input type="checkbox" checked={replace} required onChange={e=>setReplace(e.target.checked)}/><span>Replace the existing unsubmitted private build. It remains available if this upload fails; the approved public version remains live.</span></label>}
    <label className="av095-confirm"><input type="checkbox" checked={rights} required onChange={e=>setRights(e.target.checked)}/><span>I own this project or have permission to publish its code, artwork, audio and other included files.</span></label>
    <p className="st-muted">Rights are confirmed separately for every version. This does not replace independent content and security review.</p>
    <p className="av136031-preparation" id="av136031-preparation">{preparation}</p>
    <button className="st-action av095-primary" type="submit" aria-describedby="av136031-preparation" disabled={!file||!rights||busy||checkingCompatibility||!compatibility?.playableCandidate}>{busy?'Uploading and validating…':checkingCompatibility?'Checking local build…':'Prepare private playtest'}</button>
    </section>
   </fieldset>
   {busy&&<p role="status">Keep this page open. The server is checking the archive and storing the complete private revision.</p>}
   {error&&<div role="alert" className="st-error"><p>{error}</p><Link to="/studio/packages">Check your existing builds before retrying</Link></div>}
  </form>
 </section><aside className="st-panel av095-guide"><p className="st-kicker">CREATOR PROTOCOL</p><h2>Make, test, release.</h2><p>Use the source workbench for a small self-contained browser build, or export from your existing tools. ZIP the contents of the build folder, with <code>index.html</code> at its root.</p><h3>Keep it self-contained.</h3><p>Use relative asset paths. Do not include server code, node_modules, API keys, external CDNs or private credentials.</p><h3>Test the exact version.</h3><p>Play privately, save the draft, then submit it. A phone-sized preview is not a real-device test or a safety certification.</p><h3>Godot and native editions.</h3><p>Godot 4 Web exports use WebAssembly, WebGL 2 and a generated .pck bundle. The current small-build uploader does not accept Godot packs; selecting one gives local guidance without uploading it. A separate, verified large-build pipeline is required for browser play.</p><p>Windows, Linux and macOS downloads will be separate signed or checksummed editions of the same project, not automatically installed by this website. The ANEVUM desktop launcher is planned, not available.</p><p className="st-muted">180 files maximum · 48 MiB expanded · 12 MiB per asset. A standalone HTML file must contain its dependencies.</p><Link className="st-action" to="/studio/new">Create a non-playable project record</Link></aside></div>;
}
function ReviewQueue({memberId}:{memberId:string}){
 const queue=useRead('queue:'+memberId,true,signal=>readNativeQueue(memberId,signal));
 const [decision,setDecision]=useState<Decision|null>(null);
 return <>
  <section className="st-panel"><p className="st-kicker">INDEPENDENT REVIEW</p><h2>Review the actual experience.</h2><p>Open the submitted build before making a decision. The creator cannot approve their own upload. Structural validation alone does not establish safety, rights, or phone compatibility.</p><Link to="/studio/review">Review non-playable project records</Link></section>
  {queue.loading&&<p role="status">Loading the authorized review queue…</p>}
  {queue.error&&<div role="alert" className="st-error"><p>{queue.error}</p><button className="st-action" onClick={queue.reload}>Reload review queue</button></div>}
  {queue.data&&<><h2 className="av095-section-title">Pending builds <span>{queue.data.pending.length}</span></h2>{!queue.data.pending.length&&<p className="st-empty">There are no package submissions awaiting review.</p>}<div className="av095-build-grid">{queue.data.pending.map(p=><BuildCard key={p.id} project={p} review onDecision={setDecision}/>)}</div>
   <h2 className="av095-section-title">Published and suspended releases</h2>{!queue.data.moderation.length&&<p className="st-empty">No approved package releases have been recorded.</p>}<div className="av095-build-grid">{queue.data.moderation.map(p=><BuildCard key={p.id} project={p} review onDecision={setDecision}/>)}</div></>}
  {decision&&<DecisionDialog decision={decision} onClose={()=>setDecision(null)} onComplete={()=>{setDecision(null);queue.reload();}}/>}
 </>;
}
export function NativeCreatorStudioPage({mode='list'}:{mode?:'list'|'new'|'edit'|'review'}){
 const identity=useIdentity(),{projectId}=useParams<{projectId:string}>();
 const access=useRead('access:'+identity.id,nativeCreatorEnabled&&!!identity.id,signal=>readNativeSession(identity.id!,signal));
 if(!nativeCreatorEnabled)return <Status title="Native Creator Studio is not active yet."><p>This environment retains the existing uploader until the integrated release is accepted.</p><a className="st-action" href="/upload/v3">Existing Creator Uplink</a></Status>;
 if(identity.pending)return <p role="status">Verifying your ANEVUM session…</p>;
 if(!identity.id)return <Status title="Sign in to create."><p>Use your existing ANEVUM account. No separate creator account is required.</p><Link className="st-action av095-primary" to="/join">Sign in</Link></Status>;
 if(access.loading)return <p role="status">Verifying Creator Studio access…</p>;
 if(access.error||!access.data)return <Status title="Creator Studio could not be opened." retry={access.reload}><p>{access.error}</p><p>Playable builds are temporarily unavailable. Your separate private project records may still be accessible with your verified member account.</p><Link className="st-action" to="/studio/records">Open private project records</Link></Status>;
 const allowed=mode==='review'?access.data.canReview:access.data.canUpload;
 return <section className="st-root av095-native" data-native-creator="v095">
  <header className="st-header"><div><Link className="st-back" to="/member">← My Space</Link><p className="st-kicker">ANEVUM / CONTINUANCE INSTITUTE / CREATOR STUDIO</p><h1>{mode==='review'?'Release review.':mode==='new'?'Transmit a creation.':mode==='edit'?'Build the next version.':'Creator Studio.'}</h1><p>One account. One Studio. Your work, from private draft to reviewed release.</p></div><div className="st-identity"><span>CANONICAL WORKSPACE</span><strong>{mode==='review'?'REVIEW DESK':'CREATOR ARCHIVE'}</strong><small>SERVER-VERIFIED ACCESS</small></div></header>
  <NativeStudioNavigation capabilities={access.data}/>
  {!allowed?<section className="st-panel"><h2>{mode==='review'?'Reviewer access required.':'Playable uploading is limited to pilot creators.'}</h2><p>Private project records remain available to your verified member account. Playable uploads require a separate creator pilot grant.</p><Link className="st-action" to="/studio/records">Open private project records</Link></section>:
   mode==='review'?<ReviewQueue key={identity.id} memberId={identity.id}/>:mode==='list'?<BuildLibrary key={identity.id} memberId={identity.id}/>:<BuildUpload key={identity.id+':'+mode+':'+(projectId||'')} memberId={identity.id} projectId={mode==='edit'?projectId:undefined}/>}
 </section>;
}
function PlaybackContent({data,reload}:{data:NativePlayback;reload:()=>void}){
 const navigate=useNavigate(),[decision,setDecision]=useState<Decision|null>(null),[share,setShare]=useState('');
 const p=data.project,r=data.release;
 async function shareRelease(){
  if(data.preview)return;
  const url=new URL(nativePlayerPath(p.id),location.origin).href;
  try{if(navigator.share)await navigator.share({title:p.title,url});else if(navigator.clipboard){await navigator.clipboard.writeText(url);setShare('Public project link copied.');}else setShare('Copy this page address to share the approved release.');}
  catch(e){if(!(e instanceof DOMException&&e.name==='AbortError'))setShare('Sharing is unavailable. Copy this page address instead.');}
 }
 const ask=(action:BuildAction)=>setDecision({project:p,releaseId:r.id,action,sha:r.archiveSha256});
 return <section className="st-root av095-native av095-play-page" data-native-player="v095">
  <header className="st-header"><div><Link className="st-back" to={data.preview?'/studio/packages':'/discover'}>← {data.preview?'Creator Studio':'Discover'}</Link><p className="st-kicker">CONTINUANCE / {p.category} / BUILD {r.version}</p><h1>{p.title}</h1><p>{p.summary}</p></div><div className="st-identity"><span>{data.preview?'PRIVATE PLAYTEST':'PUBLIC RELEASE'}</span><strong>{pretty(r.status)}</strong><small>{r.fileCount} browser files · {bytes(r.expandedBytes)}</small></div></header>
  {data.preview&&<p className="av095-privacy-note">Only the creator and authorized reviewers can access this exact private build. Its preview link expires and cannot be used as a public share link.</p>}
  <IsolatedProjectViewport title={p.title} src={data.runtimeUrl} releaseId={r.id} preview={data.preview} expiresAt={data.expiresAt} onReopen={reload}/>
  <div className="av095-actions">
   {data.canEdit&&r.status==='ready'&&<><button className="st-action" onClick={()=>ask('save')}>Save draft</button><button className="st-action av095-primary" onClick={()=>ask('submit')}>Submit for review</button><Link className="st-action" to={nativeBuildPath(p.id)}>Replace private build</Link></>}
   {data.canReview&&<><button className="st-action av095-primary" onClick={()=>ask('publish')}>Approve and publish</button><button className="st-action" onClick={()=>ask('reject')}>Request changes</button></>}
   {!data.preview&&<button className="st-action" onClick={()=>void shareRelease()}>Share project</button>}
   {data.preview&&<Link className="st-action" to="/studio/packages">Build library</Link>}
  </div>
  {share&&<p role="status">{share}</p>}
  {r.archiveSha256&&<details className="st-panel av095-provenance"><summary>Exact revision under review</summary><p>Release {r.id}</p><p className="av095-build-id">SHA-256 {r.archiveSha256}</p><p>The decision applies only to this release. A changed draft must be reopened and reviewed again.</p></details>}
  {decision&&<DecisionDialog decision={decision} onClose={()=>setDecision(null)} onComplete={()=>{setDecision(null);if(decision.action==='publish')navigate(nativePlayerPath(p.id),{replace:true});else if(decision.action==='reject')navigate('/studio/packages/review');else reload();}}/>}
 </section>;
}
export function NativePackagePlayerPage(){
 const {projectId=''}=useParams<{projectId:string}>(),[search]=useSearchParams(),identity=useIdentity();
 const preview=search.get('preview')==='1',key=projectId+':'+preview+':'+(identity.id||'guest');
 const playback=useRead(key,nativeCreatorEnabled&&packageId(projectId)&&!identity.pending&&(!preview||!!identity.id),signal=>readNativePlayback(projectId,preview,signal,identity.id));
 if(!nativeCreatorEnabled)return <Status title="Integrated playback is not active yet."><p>The existing approved player is retained during the release transition.</p>{packageId(projectId)&&<a className="st-action" href={'/upload/v3/play/'+projectId+(preview?'?preview=1':'')}>Open the existing player</a>}</Status>;
 if(!packageId(projectId))return <Status title="Project unavailable."><p>The project identifier is invalid.</p></Status>;
 if(preview&&!identity.pending&&!identity.id)return <Status title="Sign in for this private playtest."><p>A private revision requires its creator or an authorized reviewer.</p><Link className="st-action" to="/join">Sign in</Link></Status>;
 if(identity.pending||playback.loading)return <p role="status">Opening the verified release…</p>;
 if(playback.error||!playback.data)return <Status title="This build could not be opened." retry={playback.reload}><p>{playback.error}</p></Status>;
 return <PlaybackContent key={key+':'+playback.data.release.id} data={playback.data} reload={playback.reload}/>;
}

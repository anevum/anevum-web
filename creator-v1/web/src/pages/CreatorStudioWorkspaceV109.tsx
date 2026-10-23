import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {studioList,type StudioProject} from '../lib/canonical-studio';
import {
 nativeCreatorEnabled,readNativeSession,readNativeLibrary,nativeBuildPath,nativePlayerPath,
 type NativeProject
} from '../lib/native-creator-v095';
import {workbenchAlphaEnabled} from '../lib/workbench-alpha';
import {StudioNewProjectDialog} from './StudioNewProjectDialogV110';
import {AgentDockV110} from './AgentDockV110';
import {StudioFileWorkspaceV111} from './StudioFileWorkspaceV111';
import {studioFileTreeEnabled} from '../lib/studio-files-v111';
const agentDockEnabled=import.meta.env.VITE_CREATOR_AGENT_DOCK_V110==='true';
import {readWithDeadline} from '../../../shared/read-deadline.mjs';
import './creator-workspace-v109.css';
import './creator-workspace-v110.css';

// A navigation-only workspace on existing canonical resources. Project source
// folders and executable editing require separate, reviewed storage/runtime APIs.
type Kind='record'|'build';
type Tab={kind:Kind;id:string;pinned:boolean};
type WorkspaceItem={kind:Kind;id:string;title:string;summary:string;category:string;
 status:string;updatedAt:number|null;revision:number|null;record?:StudioProject;build?:NativeProject};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const MAX_TABS=12;
const KEY='anevum.creator-workspace.v109.';
const keyOf=(tab:Pick<Tab,'kind'|'id'>)=>tab.kind+':'+tab.id;
const tidy=(v:string)=>v.replaceAll('_',' ');
function validTab(value:unknown):value is Tab{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return (v.kind==='record'||v.kind==='build')&&typeof v.id==='string'&&UUID.test(v.id)&&typeof v.pinned==='boolean';
}
function restore(memberId:string):Tab[]{
 if(typeof sessionStorage==='undefined')return [];
 try{
  const raw=JSON.parse(sessionStorage.getItem(KEY+memberId)||'[]');
  return Array.isArray(raw)?raw.filter(validTab).slice(0,MAX_TABS):[];
 }catch{return [];}
}
function when(stamp:number|null):string{
 return stamp&&Number.isFinite(stamp)?new Date(stamp*1000).toLocaleDateString():'Not recorded';
}
function explain(error:unknown):string{
 return error instanceof Error?error.message:'This private inventory is unavailable. Retry from the workspace.';
}
function buildPlayable(build:NativeProject):boolean{
 const active=build.draftStatus==='ready'||build.draftStatus==='pending_review';
 const expired=build.retention==='test'&&!!build.expiresAt&&build.expiresAt<=Date.now()/1000;
 return !!build.draftReleaseId&&active&&!expired;
}

export function CreatorStudioWorkspacePage(){
 const {data:session,isPending}=canonicalAuthClient.useSession();
 const memberId=session?.user?.emailVerified===true?session.user.id:null;
 if(isPending)return <section className="csw-locked" role="status">Verifying Creator Studio identity…</section>;
 if(!memberId)return <section className="csw-locked">
  <p className="csw-eyebrow">CONTINUANCE INSTITUTE / PRIVATE WORKSPACE</p>
  <h1>Sign in to open your workspace.</h1>
  <p>Private project inventories belong only to the verified ANEVUM member who owns them.</p>
  <Link to="/join" className="csw-action">Member sign-in</Link>
 </section>;
 // Remount immediately on account change to discard opened titles and stale requests.
 return <MemberWorkspace key={memberId} memberId={memberId}/>;
}

function MemberWorkspace({memberId}:{memberId:string}){
 const [records,setRecords]=useState<StudioProject[]>([]);
 const [recordLoading,setRecordLoading]=useState(true);
 const [recordError,setRecordError]=useState('');
 const [recordAttempt,setRecordAttempt]=useState(0);
 const [builds,setBuilds]=useState<NativeProject[]>([]);
 const [buildLoading,setBuildLoading]=useState(nativeCreatorEnabled);
 const [buildError,setBuildError]=useState('');
 const [buildAttempt,setBuildAttempt]=useState(0);
 const [canUpload,setCanUpload]=useState(false);
 const [tabs,setTabs]=useState<Tab[]>(()=>restore(memberId));
 const [activeKey,setActiveKey]=useState('');
 const [query,setQuery]=useState('');
 const [notice,setNotice]=useState('');
 const [explorerOpen,setExplorerOpen]=useState(true);
 const [inspectorOpen,setInspectorOpen]=useState(true);
 const [agentOpen,setAgentOpen]=useState(false);
 const [newProjectOpen,setNewProjectOpen]=useState(false);
 const [dirtyProjectIds,setDirtyProjectIds]=useState<Set<string>>(()=>new Set());
 const [visitedRecordIds,setVisitedRecordIds]=useState<Set<string>>(()=>new Set());
 const [diagnosticsOpen,setDiagnosticsOpen]=useState(false);
 const searchRef=useRef<HTMLInputElement>(null);
 const initialDeepLink=useRef(false);

 useEffect(()=>{
  const controller=new AbortController();
  setRecordLoading(true);setRecordError('');setRecords([]);
  readWithDeadline(signal=>studioList(signal),controller.signal)
   .then(result=>{if(!controller.signal.aborted)setRecords(result.projects);})
   .catch(error=>{if(!controller.signal.aborted)setRecordError(explain(error));})
   .finally(()=>{if(!controller.signal.aborted)setRecordLoading(false);});
  return()=>controller.abort();
 },[memberId,recordAttempt]);
 useEffect(()=>{
  if(!nativeCreatorEnabled){setBuilds([]);setBuildLoading(false);return;}
  const controller=new AbortController();
  setBuildLoading(true);setBuildError('');setBuilds([]);setCanUpload(false);
  // No pilot permission is inferred from a verified login or from Studio records.
  readWithDeadline(async signal=>{
   const capability=await readNativeSession(memberId,signal);
   if(!capability.canUpload)return {allowed:false,projects:[] as NativeProject[]};
   const library=await readNativeLibrary(memberId,signal);
   return {allowed:true,projects:library.projects};
  },controller.signal)
   .then(result=>{if(!controller.signal.aborted){setCanUpload(result.allowed);setBuilds(result.projects);}})
   .catch(error=>{if(!controller.signal.aborted)setBuildError(explain(error));})
   .finally(()=>{if(!controller.signal.aborted)setBuildLoading(false);});
  return()=>controller.abort();
 },[memberId,buildAttempt]);

 // Only opaque identifiers and window state are stored in the current browser
 // tab. No private file contents, credentials or authoring data are cached.
 useEffect(()=>{
  try{sessionStorage.setItem(KEY+memberId,JSON.stringify(tabs.slice(0,MAX_TABS)));}catch{/* Storage is optional. */}
 },[memberId,tabs]);
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{
   if(event.altKey&&!event.ctrlKey&&!event.metaKey&&event.key==='/'){
    event.preventDefault();searchRef.current?.focus();
   }
  };
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 },[]);

 const items=useMemo<WorkspaceItem[]>(()=>[
  ...records.map(p=>({kind:'record' as const,id:p.id,title:p.title,summary:p.summary,
   category:p.category,status:p.status,updatedAt:p.updatedAt,revision:p.revision,record:p})),
  ...builds.map(p=>({kind:'build' as const,id:p.id,title:p.draftTitle||p.title,
   summary:p.draftSummary||p.summary,category:p.category,status:p.draftStatus||p.status,
   updatedAt:p.updatedAt,revision:p.version,build:p}))
 ],[records,builds]);
 const allowed=useMemo(()=>new Map(items.map(item=>[keyOf(item),item])),[items]);
 const visibleTabs=useMemo(()=>tabs.filter(tab=>allowed.has(keyOf(tab))),[tabs,allowed]);
 const selectedTab=visibleTabs.find(tab=>keyOf(tab)===activeKey)||visibleTabs[0]||null;
 const selected=selectedTab?allowed.get(keyOf(selectedTab))||null:null;
 const search=query.trim().toLocaleLowerCase();
 const matching=(item:WorkspaceItem)=>!search||[item.title,item.summary,item.category].some(v=>v.toLocaleLowerCase().includes(search));
 const recordItems=items.filter(item=>item.kind==='record'&&matching(item));
 const buildItems=items.filter(item=>item.kind==='build'&&matching(item));
 const trackDirty=useCallback((projectId:string,dirty:boolean)=>{
  setDirtyProjectIds(old=>{
   if(old.has(projectId)===dirty)return old;
   const next=new Set(old);if(dirty)next.add(projectId);else next.delete(projectId);
   return next;
  });
 },[]);
 useEffect(()=>{
  if(!studioFileTreeEnabled||selected?.kind!=='record')return;
  setVisitedRecordIds(old=>old.has(selected.id)?old:new Set([...old,selected.id]));
 },[selected?.kind,selected?.id]);

 useEffect(()=>{
  // No storage-restored tab can render unless it is confirmed in this
  // member's fresh server-authorized inventory.
  if(recordLoading||buildLoading||recordError||buildError)return;
  setTabs(old=>{
   const filtered=old.filter(tab=>allowed.has(keyOf(tab)));
   return filtered.length===old.length?old:filtered;
  });
 },[recordLoading,buildLoading,recordError,buildError,allowed]);
 useEffect(()=>{
  if(initialDeepLink.current||recordLoading||buildLoading)return;
  initialDeepLink.current=true;
  const requested=new URLSearchParams(window.location.search).get('open');
  const target=requested&&allowed.get(requested);
  if(!target)return;
  setTabs(previous=>previous.some(tab=>keyOf(tab)===requested)?previous:
   previous.length<MAX_TABS?[...previous,{kind:target.kind,id:target.id,pinned:false}]:previous);
  setActiveKey(requested);
 },[recordLoading,buildLoading,allowed]);

 function open(item:WorkspaceItem){
  const k=keyOf(item);
  if(!allowed.has(k))return;
  if(tabs.some(tab=>keyOf(tab)===k)){setActiveKey(k);setNotice('');return;}
  if(tabs.length>=MAX_TABS){setNotice('Close a document tab before opening another (12-tab limit).');return;}
  setTabs(old=>[...old,{kind:item.kind,id:item.id,pinned:false}]);
  setActiveKey(k);setNotice('');
 }
 function close(k:string){
  if(k.startsWith('record:')&&dirtyProjectIds.has(k.slice(7))&&
     !window.confirm('This project has unsaved source edits. Discard them and close the project tab?'))return;
  if(tabs.find(tab=>keyOf(tab)===k)?.pinned){setNotice('Unpin the document before closing it.');return;}
  const next=tabs.filter(tab=>keyOf(tab)!==k);
  setTabs(next);
  if(selectedTab&&keyOf(selectedTab)===k)setActiveKey(next.length?keyOf(next[next.length-1]):'');
  setNotice('');
 }
 function pin(k:string){
  setTabs(old=>{
   const next=old.map(tab=>keyOf(tab)===k?{...tab,pinned:!tab.pinned}:tab);
   return [...next.filter(tab=>tab.pinned),...next.filter(tab=>!tab.pinned)];
  });
  setNotice('');
 }
 function move(k:string,direction:-1|1){
  setTabs(old=>{
   const from=old.findIndex(tab=>keyOf(tab)===k),to=from+direction;
   if(from<0||to<0||to>=old.length||old[from].pinned!==old[to].pinned)return old;
   const next=[...old];[next[from],next[to]]=[next[to],next[from]];return next;
  });
 }
 function dropped(source:string,target:string){
  if(source===target)return;
  setTabs(old=>{
   const from=old.findIndex(tab=>keyOf(tab)===source),to=old.findIndex(tab=>keyOf(tab)===target);
   if(from<0||to<0||old[from].pinned!==old[to].pinned)return old;
   const next=[...old],item=next.splice(from,1)[0];next.splice(to,0,item);return next;
  });
 }

 return <section className="csw-root" aria-label="Creator Studio workspace" data-creator-workspace="v109">
  <header className="csw-top">
   <div className="csw-brand"><span className="csw-orbit" aria-hidden="true"/><div>
    <p className="csw-eyebrow">ANEVUM / CONTINUANCE INSTITUTE</p>
    <h1>Creator Studio <span>/ Workspace</span></h1>
   </div></div>
   <div className="csw-toolbar" aria-label="Workspace controls">
    <button type="button" className="csw-action csw-subtle" onClick={()=>setExplorerOpen(v=>!v)} aria-pressed={explorerOpen}>Explorer</button>
    <button type="button" className="csw-action csw-subtle" onClick={()=>{setInspectorOpen(v=>!v);setAgentOpen(false);}} aria-pressed={inspectorOpen}>Inspector</button>
    {agentDockEnabled&&<button type="button" className="csw-action csw-subtle" onClick={()=>{setAgentOpen(v=>!v);setInspectorOpen(false);}} aria-pressed={agentOpen}>OpenAI Agent</button>}
    <button type="button" className="csw-action csw-strong" disabled={recordLoading||!!recordError}
     onClick={()=>setNewProjectOpen(true)}>+ New project</button>
    <Link to="/studio" className="csw-action csw-subtle">Studio home</Link>
   </div>
  </header>
  <div className="csw-boundary"><strong>PRIVATE / VERIFIED MEMBER</strong><span>Project work is saved in its existing editor. Tabs are a workspace preference, not publication.</span></div>
  {notice&&<p role="alert" className="csw-message">{notice}</p>}
  <div className={'csw-layout'+(!explorerOpen?' csw-no-explorer':'')+(!inspectorOpen&&!agentOpen?' csw-no-inspector':'')+(agentOpen?' csw-agent-active':'')}>
   {explorerOpen&&<aside className="csw-explorer" aria-label="Project explorer">
    <div className="csw-pane-header"><h2>Explorer</h2><span>PRIVATE</span></div>
    <label className="csw-search"><span>Find your projects</span><input ref={searchRef} type="search" maxLength={100}
     value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search projects (Alt + /)"/></label>
    <section aria-label="Project records" className="csw-folder">
     <h3><span aria-hidden="true">▾</span> Project records <small>{recordLoading?'…':records.length}</small></h3>
     {recordLoading&&<p role="status" className="csw-small">Loading private projects…</p>}
     {recordError&&<div role="alert" className="csw-error"><p>{recordError}</p><button onClick={()=>setRecordAttempt(n=>n+1)}>Retry records</button></div>}
     {!recordLoading&&!recordError&&recordItems.length===0&&<p className="csw-small">{search?'No matching records.':'No project records yet.'}</p>}
     {recordItems.map(item=><button key={keyOf(item)} type="button"
      className={'csw-file'+(selected&&keyOf(selected)===keyOf(item)?' is-selected':'')}
      onClick={()=>open(item)} title={item.title}>
      <span aria-hidden="true" className="csw-file-glyph">◇</span><span className="csw-file-title">{item.title}</span>
      <span className="csw-file-status">{tidy(item.status)}</span>
     </button>)}
    </section>
    <section aria-label="Playable builds" className="csw-folder">
     <h3><span aria-hidden="true">▾</span> Playable builds <small>{buildLoading?'…':builds.length}</small></h3>
     {buildLoading&&<p role="status" className="csw-small">Checking playable access…</p>}
     {buildError&&<div role="alert" className="csw-error"><p>{buildError}</p><button onClick={()=>setBuildAttempt(n=>n+1)}>Retry builds</button></div>}
     {!nativeCreatorEnabled&&<p className="csw-small">Native playable library is not active in this build.</p>}
     {nativeCreatorEnabled&&!buildLoading&&!buildError&&!canUpload&&<p className="csw-small">Playable upload requires a separate pilot grant. Your project records remain accessible.</p>}
     {canUpload&&!buildLoading&&!buildError&&buildItems.length===0&&<p className="csw-small">{search?'No matching builds.':'No playable builds yet.'}</p>}
     {buildItems.map(item=><button key={keyOf(item)} type="button"
      className={'csw-file'+(selected&&keyOf(selected)===keyOf(item)?' is-selected':'')}
      onClick={()=>open(item)} title={item.title}>
      <span aria-hidden="true" className="csw-file-glyph">▷</span><span className="csw-file-title">{item.title}</span>
      <span className="csw-file-status">{tidy(item.status)}</span>
     </button>)}
    </section>
    <div className="csw-explorer-foot">
     <p>These are your real project inventories. Custom folders and source-file editing require the next reviewed workspace data layer.</p>
     <Link to="/studio/records">Manage project records ↗</Link>
     {canUpload&&<Link to="/studio/packages">Manage playable builds ↗</Link>}
    </div>
   </aside>}
   <main className="csw-main">
    <div className="csw-tabbar" role="tablist" aria-label="Open project tabs">
     {visibleTabs.map(tab=>{
      const k=keyOf(tab),item=allowed.get(k)!;
      return <div className={'csw-tab'+(selected&&keyOf(selected)===k?' is-active':'')}
       key={k} draggable onDragStart={e=>e.dataTransfer.setData('text/plain',k)}
       onDragOver={e=>e.preventDefault()}
       onDrop={e=>{e.preventDefault();dropped(e.dataTransfer.getData('text/plain'),k);}}>
       <button type="button" role="tab" aria-selected={!!selected&&keyOf(selected)===k}
        onClick={()=>setActiveKey(k)}
        onKeyDown={e=>{if(e.altKey&&e.key==='ArrowLeft'){e.preventDefault();move(k,-1);}
         if(e.altKey&&e.key==='ArrowRight'){e.preventDefault();move(k,1);}}}>
        <span aria-hidden="true">{tab.kind==='record'?'◇':'▷'}</span> {item.title}</button>
       <button type="button" className="csw-tab-control" aria-label={(tab.pinned?'Unpin ':'Pin ')+item.title}
        title={tab.pinned?'Unpin tab':'Pin tab'} onClick={()=>pin(k)}>{tab.pinned?'◆':'◇'}</button>
       <button type="button" className="csw-tab-control" aria-label={'Close '+item.title} onClick={()=>close(k)}>×</button>
      </div>;
     })}
     {!visibleTabs.length&&<span className="csw-no-tabs">Select a project from Explorer to open a tab.</span>}
    </div>
    <section className="csw-work" aria-label="Selected document workspace">
     {!selected?<div className="csw-welcome">
      <span className="csw-large-orbit" aria-hidden="true"/>
      <p className="csw-eyebrow">WORKSPACE / FIRST SIGNAL</p>
      <h2>Make something worth exploring.</h2>
      <p>Open existing creations, keep multiple projects ready, and move directly into their authenticated editors and playtests.</p>
      <div className="csw-welcome-actions">
       <button type="button" className="csw-action csw-strong" disabled={recordLoading||!!recordError}
        onClick={()=>setNewProjectOpen(true)}>Create a private project</button>
       {canUpload&&<Link className="csw-action" to="/studio/packages/new">Prepare playable build</Link>}
       <Link className="csw-action" to="/studio/alpha">Open local HTML lab</Link>
      </div>
      <small>{studioFileTreeEnabled?'Your private source files are available in opened project records when the server pilot is enabled. Untrusted code is never executed here.':'This first workspace slice does not yet provide persistent folders, a source-code editor or general app execution.'}</small>
     </div>:(!studioFileTreeEnabled||selected.kind==='build')?<div className="csw-document" role="tabpanel">
      <p className="csw-eyebrow">{selected.kind==='record'?'PROJECT RECORD / CANONICAL':'PLAYABLE BUILD / ISOLATED RELEASE'}</p>
      <h2>{selected.title}</h2>
      <p className="csw-summary">{selected.summary||'No description has been recorded yet.'}</p>
      <div className="csw-document-actions">
       {selected.kind==='record'?<Link className="csw-action csw-strong" to={'/studio/'+selected.id}>Open existing editor ↗</Link>:
        <Link className="csw-action csw-strong" to={nativeBuildPath(selected.id)}>Manage build and revisions ↗</Link>}
       {selected.build&&buildPlayable(selected.build)&&<Link className="csw-action" to={nativePlayerPath(selected.id,true)}>Private playtest ↗</Link>}
       {selected.build&&selected.build.status==='published'&&selected.build.liveReleaseId&&
        <Link className="csw-action" to={nativePlayerPath(selected.id)}>Play public release ↗</Link>}
       {agentDockEnabled&&<button type="button" className="csw-action" onClick={()=>{setAgentOpen(true);setInspectorOpen(false);}}>
        Prepare an OpenAI task brief
       </button>}
      </div>
      <div className="csw-document-grid">
       <div><span>Project type</span><strong>{tidy(selected.category)}</strong></div>
       <div><span>Current status</span><strong>{tidy(selected.status)}</strong></div>
       <div><span>{selected.kind==='record'?'Record revision':'Build version'}</span><strong>{selected.revision===null?'—':selected.revision}</strong></div>
       <div><span>Last updated</span><strong>{when(selected.updatedAt)}</strong></div>
      </div>
      <div className="csw-editor-boundary"><h3>Existing creation tools remain available.</h3>
       <p>The full project editor, uploader, private player and independent publication review still own their respective data and actions. This shell does not silently convert a record into an executable app.</p>
       {workbenchAlphaEnabled&&<p>Invited members can also use the <Link to="/studio/workbench">private branching-story Workbench</Link>, subject to its existing access controls.</p>}
      </div>
     </div>:null}
     {studioFileTreeEnabled&&visibleTabs.filter(t=>t.kind==='record'&&visitedRecordIds.has(t.id)).map(tab=>{
      const item=allowed.get(keyOf(tab));
      if(!item)return null;
      const show=selected?.kind==='record'&&selected.id===tab.id;
      return <div className="csw-file-host" hidden={!show} key={tab.id} aria-hidden={!show}>
       <StudioFileWorkspaceV111 projectId={tab.id} projectTitle={item.title} status={item.status}
        visible={show} onDirtyChange={dirty=>trackDirty(tab.id,dirty)}/>
      </div>;
     })}
    </section>
    <div className="csw-bottom">
     <button type="button" onClick={()=>setDiagnosticsOpen(v=>!v)} aria-expanded={diagnosticsOpen}>Workspace diagnostics {diagnosticsOpen?'▾':'▸'}</button>
     <span>{tabs.length} / {MAX_TABS} tabs · Drag to reorder · Alt + arrows on a tab{dirtyProjectIds.size?' · Unsaved project source: '+dirtyProjectIds.size:''}</span>
    </div>
    {diagnosticsOpen&&<section className="csw-diagnostics" aria-label="Workspace diagnostics">
     <p><strong>Private records:</strong> {recordLoading?'checking':recordError?'unavailable':records.length+' loaded'}</p>
     <p><strong>Playable builds:</strong> {!nativeCreatorEnabled?'feature inactive':buildLoading?'checking':buildError?'unavailable':canUpload?builds.length+' loaded':'pilot permission not granted'}</p>
     <p>Only workspace layout is remembered in this browser tab. Project edits, versions, reviews and approvals remain server-controlled.</p>
    </section>}
   </main>
   {inspectorOpen&&<aside className="csw-inspector" aria-label="Project inspector">
    <div className="csw-pane-header"><h2>Inspector</h2><span>READ ONLY</span></div>
    {!selected?<p className="csw-small">Select a project to inspect its verified status and open its editing tools.</p>:<>
     <div className="csw-inspector-block"><h3>Identity</h3><p>Type <strong>{tidy(selected.category)}</strong></p><p>Project <code>{selected.id.slice(0,8)}</code></p></div>
     <div className="csw-inspector-block"><h3>Lifecycle</h3><p>Status <strong>{tidy(selected.status)}</strong></p>
      <p>{selected.kind==='record'?'Revision':'Build'} <strong>{selected.revision??'—'}</strong></p>
      <p>Updated <strong>{when(selected.updatedAt)}</strong></p></div>
     <div className="csw-inspector-block"><h3>Next action</h3>
      <p>{selected.kind==='record'?'Use the existing record editor to edit details, upload permitted assets and submit changes.':
       'Use the existing upload/release flow to review exact builds. A private playtest is not a public release.'}</p></div>
    </>}
   </aside>}
   {agentDockEnabled&&agentOpen&&<AgentDockV110 project={selected} onClose={()=>{setAgentOpen(false);setInspectorOpen(true);}}/>}
  </div>
  {newProjectOpen&&<StudioNewProjectDialog onClose={()=>setNewProjectOpen(false)} onCreated={project=>{
    setRecords(old=>[project,...old.filter(p=>p.id!==project.id)]);
    if(tabs.length<MAX_TABS){
     const k='record:'+project.id;
     setTabs(old=>old.some(tab=>keyOf(tab)===k)?old:[...old,{kind:'record',id:project.id,pinned:false}]);
     setActiveKey(k);
     setNotice('Private project created. Continue in the existing editor when ready.');
    }else{
     setNotice('Private project created. Close a document tab to open it from Explorer.');
    }
    setNewProjectOpen(false);
   }}/>}
  <footer className="csw-statusbar"><span>CONTINUANCE INSTITUTE / STUDIO WORKSPACE V109{agentDockEnabled?' + V110':''}</span><span>Private · No automatic publication</span></footer>
 </section>;
}

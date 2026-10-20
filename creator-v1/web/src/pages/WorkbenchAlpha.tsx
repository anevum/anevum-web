import {useEffect,useRef,useState,type FormEvent,type ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {canonicalAuthClient} from '../lib/canonical-beta';
import type {StudioDraft,StudioProject} from '../lib/canonical-studio';
import {workbenchAlphaEnabled,workbenchAccess,workbenchList,workbenchGet,workbenchCreate,workbenchSave,
 workbenchRoster,workbenchFind,workbenchGrant,type Access,type Pilot,WorkbenchError} from '../lib/workbench-alpha';
import {decode,encode,starter,block,remove,visible,TYPES,LIMITS,type Document,type BlockType} from '../../../workbench-alpha/document.mjs';
import './workbench-alpha.css';
const message=(e:unknown)=>e instanceof Error?e.message:'The Workbench could not complete that action.';
function Notice({title,children}:{title:string;children:ReactNode}){
 return <section className="wb-alpha wb-notice"><p className="wb-kicker">CONTINUANCE INSTITUTE / CREATOR WORKBENCH</p><h1>{title}</h1>{children}<Link className="wb-button" to="/studio">Return to Creator Studio</Link></section>;
}
// The shortcut follows the canonical session; hiding a link is not authorization.
export function WorkbenchAlphaEntry({memberId}:{memberId:string|null|undefined}){
 const [access,setAccess]=useState<Access|null>(null);
 useEffect(()=>{if(!workbenchAlphaEnabled||!memberId)return;const ac=new AbortController();
  workbenchAccess(memberId,ac.signal).then(a=>{if(!ac.signal.aborted)setAccess(a);}).catch(()=>{if(!ac.signal.aborted)setAccess(null);});
  return()=>ac.abort();},[memberId]);
 return workbenchAlphaEnabled&&access&&access.memberId===memberId&&access.allowed?<Link className="wb-entry" to="/studio/alpha">Creator Workbench <span>PRIVATE ALPHA</span></Link>:null;
}
export function WorkbenchAlphaEntryGate(){return workbenchAlphaEnabled?<SessionEntry/>:null;}
function SessionEntry(){const {data:session}=canonicalAuthClient.useSession();return <WorkbenchAlphaEntry memberId={session?.user.emailVerified?session.user.id:null}/>;}
export function WorkbenchAlphaPage(){
 useEffect(()=>{const tag=document.createElement("meta");tag.name="robots";tag.content="noindex,nofollow,noarchive";document.head.append(tag);return()=>tag.remove();},[]);
 const {data:session,isPending}=canonicalAuthClient.useSession();
 if(!workbenchAlphaEnabled)return <Notice title="Private alpha is not active."><p>The Workbench is being prepared. Your existing Studio is unchanged.</p></Notice>;
 if(isPending)return <Notice title="Checking your session."><p role="status">Verifying ANEVUM account access.</p></Notice>;
 const user=session?.user;
 if(!user?.id||user.emailVerified!==true)return <Notice title="Sign in to enter."><p>This testing area is limited to invited ANEVUM accounts.</p><Link className="wb-button wb-primary" to="/join">Sign in</Link></Notice>;
 return <SessionWorkbench key={user.id} memberId={user.id}/>;
}
function SessionWorkbench({memberId}:{memberId:string}){
 const [access,setAccess]=useState<Access|null>(null),[error,setError]=useState(''),[nonce,setNonce]=useState(0);
 useEffect(()=>{const ac=new AbortController();setError('');setAccess(null);
  workbenchAccess(memberId,ac.signal).then(a=>{if(!ac.signal.aborted)setAccess(a);}).catch(e=>{if(!ac.signal.aborted)setError(message(e));});return()=>ac.abort();},[memberId,nonce]);
 if(error)return <Notice title="Workbench access unavailable."><p role="alert">{error}</p><button className="wb-button" onClick={()=>setNonce(n=>n+1)}>Try again</button></Notice>;
 if(!access)return <Notice title="Verifying pilot access."><p role="status">No project data is loaded until access is confirmed.</p></Notice>;
 if(!access.allowed)return <Notice title="Invitation required."><p>Your ANEVUM account is signed in, but does not have active Workbench pilot access. An owner can grant or renew access for your existing member handle.</p></Notice>;
 return <Workbench memberId={memberId} access={access}/>;
}
function PilotAccess(){
 const [roster,setRoster]=useState<Pilot[]>([]),[handle,setHandle]=useState(''),[selected,setSelected]=useState<Pilot|null>(null);
 const [days,setDays]=useState(30),[reason,setReason]=useState(''),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[note,setNote]=useState('');
 const locked=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;const ac=new AbortController();workbenchRoster(ac.signal).then(r=>{if(!ac.signal.aborted)setRoster(r.members);}).catch(e=>{if(!ac.signal.aborted)setNote(message(e));});return()=>{alive.current=false;ac.abort();};},[]);
 async function find(event:FormEvent){event.preventDefault();if(locked.current)return;locked.current=true;setBusy(true);setSelected(null);setConfirmed(false);setNote('');
  try{const r=await workbenchFind(handle.trim().replace(/^@/,''));if(alive.current)setSelected(r.member);}catch(e){if(alive.current)setNote(message(e));}finally{locked.current=false;if(alive.current)setBusy(false);}}
 async function change(action:'grant'|'revoke'){
  if(!selected||!confirmed||reason.trim().length<10||locked.current)return;locked.current=true;setBusy(true);setNote('');
  try{await workbenchGrant(selected,action,days,reason.trim());const [people,current]=await Promise.all([workbenchRoster(),workbenchFind(selected.handle)]);
   if(alive.current){setRoster(people.members);setSelected(current.member);setConfirmed(false);setReason('');setNote(action==='grant'?'Pilot access granted. No message was sent.':'Pilot access revoked. Their saved work was not deleted.');}}
  catch(e){if(alive.current){setNote(message(e));setSelected(null);setConfirmed(false);}}finally{locked.current=false;if(alive.current)setBusy(false);}}
 return <details className="wb-pilots"><summary>Pilot access / owner controls</summary><div className="wb-panel">
  <p>Grant access to an existing, verified member account. Maximum 10 active tester grants. This does not create an account, send an invitation email, or grant staff or publishing powers.</p>
  <form className="wb-access-find" onSubmit={e=>void find(e)}><label>Exact member handle<input value={handle} onChange={e=>{setHandle(e.target.value);setSelected(null);setConfirmed(false);}} maxLength={30} placeholder="member_handle" required disabled={busy}/></label><button className="wb-button" disabled={busy}>Find account</button></form>
  {selected&&<div className="wb-access-selected"><strong>{selected.displayName||selected.handle} / @{selected.handle}</strong><p>{selected.enabled===1&&selected.expiresAt&&selected.expiresAt>Date.now()/1000?'Active pilot':'No active pilot grant'} / access revision {selected.revision}</p>
   <label>Access duration<select value={days} disabled={busy} onChange={e=>setDays(Number(e.target.value))}><option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option></select></label>
   <label>Reason<input value={reason} disabled={busy} minLength={10} maxLength={240} onChange={e=>setReason(e.target.value)} placeholder="What will this member test?"/></label>
   <label className="wb-confirm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} disabled={busy}/>I confirm this is the intended account: @{selected.handle}.</label>
   <div className="wb-actions"><button className="wb-button wb-primary" disabled={!confirmed||reason.trim().length<10||busy} onClick={()=>void change('grant')}>Grant or renew access</button><button className="wb-button" disabled={!confirmed||reason.trim().length<10||busy||!selected.revision} onClick={()=>void change('revoke')}>Revoke access</button></div>
  </div>}
  {note&&<p role="status" className="wb-note">{note}</p>}
  <h3>Pilot roster</h3>{!roster.length?<p>No tester grants recorded.</p>:<ul className="wb-roster">{roster.map(p=><li key={p.memberId}><span>@{p.handle||'unavailable-profile'}</span><span>{p.enabled&&p.expiresAt&&p.expiresAt>Date.now()/1000?'Active until '+new Date(p.expiresAt*1000).toLocaleDateString():'Inactive'}</span></li>)}</ul>}
 </div></details>;
}
function Workbench({access}:{memberId:string;access:Access}){
 const [items,setItems]=useState<StudioProject[]>([]),[project,setProject]=useState<StudioProject|null>(null),[doc,setDoc]=useState<Document|null>(null);
 const [title,setTitle]=useState(''),[savedTitle,setSavedTitle]=useState(''),[savedRaw,setSavedRaw]=useState('');
 const [selected,setSelected]=useState<string|null>(null),[scene,setScene]=useState<string|null>(null),[view,setView]=useState<'edit'|'preview'|'ai'>('edit');
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[saveNote,setSaveNote]=useState(''),[blocked,setBlocked]=useState(false);
 const [undo,setUndo]=useState<Document[]>([]),[redo,setRedo]=useState<Document[]>([]),[addType,setAddType]=useState<BlockType>('paragraph');
 const requestId=useRef(crypto.randomUUID()),locked=useRef(false),alive=useRef(true);
 const raw=doc?(()=>{try{return encode(doc);}catch{return '';}})():'';
 const dirty=!!doc&&(raw!==savedRaw||title!==savedTitle);
 const editable=!blocked&&(!project||['draft','changes_requested'].includes(project.status));
 const leave=()=>!dirty||window.confirm('This draft has unsaved changes. Leave without saving?');
 const report=(e:unknown)=>{setError(message(e));if(e instanceof WorkbenchError&&[401,403].includes(e.status))setBlocked(true);};
 useEffect(()=>{alive.current=true;const ac=new AbortController();workbenchList(ac.signal).then(r=>{if(!ac.signal.aborted)setItems(r.projects);}).catch(e=>{if(!ac.signal.aborted)report(e);}).finally(()=>{if(!ac.signal.aborted)setLoading(false);});return()=>{alive.current=false;ac.abort();};},[]);
 useEffect(()=>{if(!dirty)return;
  const before=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};
  const click=(e:MouseEvent)=>{const a=(e.target as Element)?.closest?.('a[href]');if(a&&!window.confirm('This draft has unsaved changes. Leave without saving?')){e.preventDefault();e.stopPropagation();}};
  window.addEventListener('beforeunload',before);document.addEventListener('click',click,true);
  return()=>{window.removeEventListener('beforeunload',before);document.removeEventListener('click',click,true);};},[dirty]);
 function install(next:Document,p:StudioProject|null){setDoc(next);setProject(p);setTitle(p?.title||'The First Signal');setSavedTitle(p?.title||'');setSavedRaw(p?encode(next):'');setSelected(next.blocks[0]?.id||null);setScene(null);setUndo([]);setRedo([]);setError('');setSaveNote(p?'Saved revision '+p.revision:'Not saved yet');requestId.current=crypto.randomUUID();setView('edit');}
 function change(next:Document){if(!doc||!editable||busy)return;try{encode(next);setUndo(old=>[...old,doc].slice(-20));setRedo([]);setDoc(next);setError('');}catch(e){setError(message(e));}}
 async function open(p:StudioProject){if(!leave()||locked.current)return;locked.current=true;setBusy(true);setError('');
  try{const r=await workbenchGet(p.id);const next=decode(r.project.description);if(!next)throw Error('This record is not a valid Workbench document. Open the original in Creator Studio; nothing was converted.');if(alive.current)install(next,r.project);}
  catch(e){if(alive.current)report(e);}finally{locked.current=false;if(alive.current)setBusy(false);}}
 async function save(){if(!doc||!editable||locked.current)return;locked.current=true;setBusy(true);setError('');setSaveNote('Saving...');
  try{const description=encode(doc);const draft:StudioDraft={slug:project?.slug||'signal-'+requestId.current.slice(0,12),title:title.trim(),summary:project?.summary||'A private branching story created in the ANEVUM Workbench.',description,category:project?.category||'games',freeToUse:project?.freeToUse??true,license:project?.license||'',sourceUrl:project?.sourceUrl||null,demoUrl:project?.demoUrl||null,aiDisclosure:project?.aiDisclosure||'',humanContribution:project?.humanContribution||''};
   const r=project?await workbenchSave(project.id,project.revision,draft):await workbenchCreate(draft,requestId.current);
   if(alive.current){setProject(r.project);setTitle(r.project.title);setSavedTitle(r.project.title);setSavedRaw(r.project.description);setSaveNote('Saved to ANEVUM / revision '+r.project.revision);setItems(old=>[r.project,...old.filter(p=>p.id!==r.project.id)]);}}
  catch(e){if(alive.current){report(e);setSaveNote('Save not confirmed. Your edits are still here.');}}finally{locked.current=false;if(alive.current)setBusy(false);}}
 function exportDocument(){if(!doc)return;const link=document.createElement('a');const href=URL.createObjectURL(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}));link.href=href;link.download='anevum-workbench-document.json';link.click();setTimeout(()=>URL.revokeObjectURL(href),1000);}
 const focused=doc?.blocks.find(b=>b.id===selected)||null;
 return <section className="wb-alpha" aria-label="Private Creator Workbench">
  <header className="wb-header"><div className="wb-crest" aria-hidden="true"><i/><i/><b/></div><div><p className="wb-kicker">ANEVUM / CONTINUANCE INSTITUTE / PRIVATE ALPHA</p><h1>Creator Workbench</h1><p>A protected place to make, test and refine your work.</p></div><div className="wb-clearance"><span>{access.level==='owner'?'OWNER ACCESS':'INVITED TESTER'}</span>{access.expiresAt&&<small>Until {new Date(access.expiresAt*1000).toLocaleDateString()}</small>}</div></header>
  <nav className="wb-actions" aria-label="Workbench navigation"><Link className="wb-button" to="/studio">Creator Studio</Link><span className="wb-boundary">Private drafts / no automatic publication</span></nav>
  {access.canManage&&<PilotAccess/>}
  {error&&<div role="alert" className="wb-error"><strong>Action not completed.</strong> {error}{doc&&<button className="wb-button" onClick={exportDocument}>Export your current edits</button>}</div>}
  <div className="wb-layout"><aside className="wb-library wb-panel"><p className="wb-kicker">YOUR PRIVATE ARCHIVE</p><h2>Projects</h2><button className="wb-button wb-primary" disabled={busy||blocked} onClick={()=>{if(leave())install(starter(),null);}}>New signal story</button>
   {loading?<p role="status">Loading your projects...</p>:!items.length?<p>Start with two linked scenes. Your first save creates an ordinary private Studio project.</p>:<ul>{items.map(p=><li key={p.id}>{decode(p.description)?<button className={'wb-project '+(p.id===project?.id?'selected':'')} disabled={busy||blocked} onClick={()=>void open(p)}><strong>{p.title}</strong><small>Revision {p.revision} / {p.status.replaceAll('_',' ')}</small></button>:<Link to={'/studio/'+p.id} className="wb-project"><strong>{p.title}</strong><small>Open original Studio record</small></Link>}</li>)}</ul>}
   <div className="wb-scope"><strong>First working slice</strong><p>Visual text and branching stories, real private saves, and account-based pilot access. Code workspaces and connected AI are not active yet.</p></div>
  </aside>
  <main className="wb-working">{!doc?<div className="wb-empty wb-panel"><div className="wb-orbit" aria-hidden="true"/><p className="wb-kicker">AUTHOR / PLAYTEST / REFINE</p><h2>Begin with a signal.</h2><p>Create a small interactive story, move between its scenes, and save it to your existing ANEVUM account. No API key is needed.</p></div>:<>
   <header className="wb-editor-head"><label>Project title<input aria-label="Project title" value={title} disabled={busy||!editable} minLength={3} maxLength={100} onChange={e=>setTitle(e.target.value)}/></label><div className="wb-actions"><button className="wb-button wb-primary" disabled={busy||!editable||!dirty||title.trim().length<3} onClick={()=>void save()}>{busy?'Saving...':'Save draft'}</button><button className="wb-button" onClick={exportDocument}>Export document</button></div><p role="status" className="wb-save">{dirty&&!busy?'Unsaved changes / ':''}{saveNote}</p></header>
   <div className="wb-tabs" role="tablist" aria-label="Editor views">{(['edit','preview','ai'] as const).map(v=><button key={v} role="tab" aria-selected={view===v} onClick={()=>setView(v)}>{v==='edit'?'Visual editor':v==='preview'?'Playtest':'AI connection'}</button>)}</div>
   {view==='edit'&&<div className="wb-edit-grid"><div className="wb-block-list"><p className="wb-kicker">SCENES & BLOCKS / {doc.blocks.length}/{LIMITS.blocks}</p><ol>{doc.blocks.map(b=><li key={b.id}><button disabled={busy} className={b.id===selected?'selected':''} onClick={()=>setSelected(b.id)}><span>{b.type}</span><strong>{b.text.slice(0,48)||'Empty block'}</strong></button></li>)}</ol>
    <label>Add a block<select value={addType} onChange={e=>setAddType(e.target.value as BlockType)} disabled={!editable||busy}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></label><button className="wb-button" disabled={!editable||busy||doc.blocks.length>=LIMITS.blocks} onClick={()=>{const b=block(addType);change({...doc,blocks:[...doc.blocks,b]});setSelected(b.id);}}>Add block</button>
   </div><div className="wb-inspector wb-panel"><div className="wb-actions"><button className="wb-button" disabled={!undo.length||!editable||busy} onClick={()=>{const prior=undo.at(-1)!;setRedo(r=>[...r,doc].slice(-20));setUndo(u=>u.slice(0,-1));setDoc(prior);}}>Undo</button><button className="wb-button" disabled={!redo.length||!editable||busy} onClick={()=>{const next=redo.at(-1)!;setUndo(u=>[...u,doc].slice(-20));setRedo(r=>r.slice(0,-1));setDoc(next);}}>Redo</button><span className="wb-muted">Local editing history</span></div>
    {focused?<><h2>{focused.type==='scene'?'Scene inspector':'Block inspector'}</h2><label>Text<textarea aria-label="Block text" rows={8} value={focused.text} maxLength={LIMITS.text} disabled={!editable||busy} onChange={e=>change({...doc,blocks:doc.blocks.map(b=>b.id===focused.id?{...b,text:e.target.value}:b)})}/></label>
     {focused.type==='choice'&&<label>Destination scene<select value={focused.target||''} disabled={!editable||busy} onChange={e=>change({...doc,blocks:doc.blocks.map(b=>b.id===focused.id?{...b,target:e.target.value||null}:b)})}><option value="">Choose a destination</option>{doc.blocks.filter(b=>b.type==='scene').map(b=><option key={b.id} value={b.id}>{b.text||'Untitled scene'}</option>)}</select></label>}
     <div className="wb-actions">{([-1,1] as const).map(step=>{const at=doc.blocks.findIndex(b=>b.id===focused.id);return <button key={step} className="wb-button" disabled={!editable||busy||at+step<0||at+step>=doc.blocks.length} onClick={()=>{const blocks=[...doc.blocks];[blocks[at],blocks[at+step]]=[blocks[at+step],blocks[at]];change({...doc,blocks});}}>{step===-1?'Move up':'Move down'}</button>;})}<button className="wb-button" disabled={!editable||busy} onClick={()=>{change(remove(doc,focused.id));setSelected(null);}}>Remove block</button></div>
    </>:<p>Select a block to edit. Removing a scene clears choices that pointed to it.</p>}
    <p className="wb-muted">{raw.length.toLocaleString()}/{LIMITS.description.toLocaleString()} document characters. Saves use the existing private Studio record; no upload is generated on each edit.</p>
   </div></div>}
   {view==='preview'&&<div className="wb-preview-panel"><div className="wb-actions"><span className="wb-kicker">PRIVATE / DATA-ONLY PLAYTEST</span><button className="wb-button" onClick={()=>setScene(null)}>Restart story</button></div><article className="wb-preview" aria-label="Story playtest">{visible(doc,scene).map(b=>b.type==='divider'?<hr key={b.id}/>:b.type==='heading'||b.type==='scene'?<h2 key={b.id}>{b.text}</h2>:b.type==='choice'?<button className="wb-button wb-choice" key={b.id} disabled={!b.target} onClick={()=>setScene(b.target)}>{b.text||'Continue'}{!b.target?' / no destination':''}</button>:b.type==='quote'?<blockquote key={b.id}>{b.text}</blockquote>:<p key={b.id} className={b.type==='credits'?'wb-muted':undefined}>{b.text}</p>)}</article><p className="wb-muted">This trusted preview renders text and scene choices only. It is not a hosted web-app preview or proof of device compatibility.</p></div>}
   {view==='ai'&&<div className="wb-ai wb-panel"><span className="wb-kicker">AGENT CONNECTION / NOT ACTIVE</span><h2>The workspace comes first.</h2><p>This alpha does not send your work to an AI provider and does not accept API keys. Connected model access, reviewed file changes and isolated code previews follow this access-and-save foundation.</p><p>IREN guidance: use Visual editor to revise the story, Playtest to follow a choice, then Save draft to keep the changes on ANEVUM.</p></div>}
  </>}</main></div>
 </section>;
}

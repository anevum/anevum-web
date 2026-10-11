import {useCallback,useEffect,useRef,useState} from "react";
import {Link} from "react-router-dom";
import {memberAuthClient} from "../member/auth-client";
import {useMemberAvailability} from "../member/useMemberAvailability";
import {studioDraftDirty,studioDraftProblem,studioSameSavedRevision,studioMutationMatches,
 studioPublicStateMatches,type StudioSavedEntry,type StudioAction} from "../member/studio-editorial";
import StudioOperations from "./StudioOperations";

type Kind="POST"|"UPDATE"|"AHA";
type Entry=StudioSavedEntry;
type Grant={role:"owner"|"admin";contentReady:boolean;publishingEnabled:boolean};
type EditorialEvent={action:"CREATE"|"EDIT"|"PUBLISH"|"UNPUBLISH"|"ARCHIVE";
 revision:number;actorMemberId:string;createdAt:number};
const kindLabels:Record<Kind,string>={POST:"Studio post",UPDATE:"Project update",AHA:"AHA post"};
const newDraft=()=>({kind:"UPDATE" as Kind,title:"",summary:"",body:""});
function object(value:unknown):value is Record<string,unknown>{
 return value!==null&&typeof value==="object"&&!Array.isArray(value);
}
function verifiedEntry(value:unknown):value is Entry {
 if(!object(value))return false;
 if(typeof value.id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.id)||
  typeof value.slug!=="string"||value.slug.length>96||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)||
  typeof value.title!=="string"||typeof value.summary!=="string"||typeof value.body!=="string"||
  !["POST","UPDATE","AHA"].includes(String(value.kind))||
  !["DRAFT","PUBLISHED","ARCHIVED"].includes(String(value.status))||
  !Number.isSafeInteger(value.revision)||Number(value.revision)<1||
  !Number.isSafeInteger(value.createdAt)||Number(value.createdAt)<0||
  !Number.isSafeInteger(value.updatedAt)||Number(value.updatedAt)<Number(value.createdAt))return false;
 if(value.status==="PUBLISHED"?
  !Number.isSafeInteger(value.publishedAt)||Number(value.publishedAt)<Number(value.createdAt)||
    Number(value.publishedAt)>Number(value.updatedAt):value.publishedAt!==null)return false;
 return studioDraftProblem({kind:value.kind as Kind,title:value.title,summary:value.summary,body:value.body})===null&&
  value.title===value.title.trim()&&value.summary===value.summary.trim()&&value.body===value.body.trim();
}
function stamp(seconds:number|null) {
 return seconds?new Date(seconds*1000).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"}):"Not published";
}
export default function StudioDashboard(){
 const {data:session,isPending}=memberAuthClient.useSession();
 const availability=useMemberAvailability();
 const id=availability==="available"&&!isPending?session?.user?.id:undefined;
 return <StudioMember key={id||"no-member"} id={id} checking={isPending||availability==="checking"}/>;
}
function StudioMember({id,checking}:{id?:string;checking:boolean}){
 const [stage,setStage]=useState<"checking"|"denied"|"error"|"ready">("checking");
 const [grant,setGrant]=useState<Grant|null>(null);
 const [entries,setEntries]=useState<Entry[]>([]);
 const [more,setMore]=useState(false);
 const [selected,setSelected]=useState<string|null>(null);
 const [form,setForm]=useState(newDraft);
 const [busy,setBusy]=useState(false);
 const [uncertain,setUncertain]=useState(false);
 const [message,setMessage]=useState("");
 const [reload,setReload]=useState(0);
 const [operationsRefresh,setOperationsRefresh]=useState(0);
 const [preview,setPreview]=useState(false);
 const [history,setHistory]=useState<EditorialEvent[]>([]);
 const [historyStatus,setHistoryStatus]=useState<"idle"|"loading"|"ready"|"error">("idle");
 const [historyMore,setHistoryMore]=useState(false);
 const scope=useRef<AbortController|null>(null);
 const writing=useRef(false);
 const current=entries.find(x=>x.id===selected)||null;
 const dirty=studioDraftDirty(current,form);
 const load=useCallback(async(signal:AbortSignal)=>{
  if(!id||signal.aborted)return;
  const res=await fetch("/api/member/studio/status",{credentials:"same-origin",cache:"no-store",
    redirect:"manual",signal});
  if(signal.aborted)return;
  if(res.status===401||res.status===403){setStage("denied");return;}
  if(!res.ok)throw Error("Staff verification unavailable");
  const data:unknown=await res.json();
  if(!object(data)||data.schemaVersion!=="anevum.studio.v1"||
    data.viewerMemberId!==id||(data.role!=="owner"&&data.role!=="admin")||
    typeof data.contentReady!=="boolean"||typeof data.publishingEnabled!=="boolean")
    throw Error("Staff identity mismatch");
  const role=data.role as "owner"|"admin";
  const next={role,contentReady:data.contentReady,publishingEnabled:data.publishingEnabled} as Grant;
  if(signal.aborted)return;
  setGrant(next);
  if(next.contentReady){
   const list=await fetch("/api/member/studio/entries",{credentials:"same-origin",cache:"no-store",
     redirect:"manual",signal});
   if(!list.ok)throw Error("Entry listing unavailable");
   const records:unknown=await list.json();
   if(!object(records)||records.schemaVersion!=="anevum.studio.v1"||
     records.viewerMemberId!==id||!Array.isArray(records.entries)||
     !records.entries.every(verifiedEntry)||typeof records.olderEntriesMayExist!=="boolean")
     throw Error("Entry identity mismatch");
   if(signal.aborted)return;
   setEntries(records.entries);setMore(records.olderEntriesMayExist);
  }
  setStage("ready");
 },[id]);
 useEffect(()=>{
  setGrant(null);setStage("checking");setEntries([]);setMore(false);setSelected(null);
  setForm(newDraft());setPreview(false);setMessage("");setUncertain(false);setBusy(false);writing.current=false;
  if(checking)return;
  if(!id){setStage("denied");return;}
  const controller=new AbortController();scope.current=controller;
  void load(controller.signal).catch(()=>{if(!controller.signal.aborted)setStage("error");});
  return ()=>{controller.abort();if(scope.current===controller)scope.current=null;};
 },[checking,id,load,reload]);
 useEffect(()=>{
  if(current)setForm({kind:current.kind,title:current.title,summary:current.summary,body:current.body});
 },[current?.id,current?.revision]);
 useEffect(()=>{
  if(!dirty||stage!=="ready")return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",warn);
  return ()=>window.removeEventListener("beforeunload",warn);
 },[dirty,stage]);
 useEffect(()=>{
  setHistory([]);setHistoryMore(false);setHistoryStatus("idle");
  if(!id||!current||stage!=="ready"||!grant?.contentReady)return;
  const entryId=current.id,expectedRevision=current.revision;
  const controller=new AbortController();
  setHistoryStatus("loading");
  void fetch("/api/member/studio/entries/"+entryId+"/history",{
    credentials:"same-origin",cache:"no-store",redirect:"manual",signal:controller.signal
  }).then(async response=>{
    if(!response.ok)throw Error("History unavailable");
    const data:unknown=await response.json();
    if(!object(data)||data.schemaVersion!=="anevum.studio.v1"||
      data.viewerMemberId!==id||data.entryId!==entryId||data.entryRevision!==expectedRevision||
      !Array.isArray(data.events)||typeof data.olderEventsMayExist!=="boolean"||
      !data.events.every((event:unknown)=>{
       if(!object(event))return false;
       return ["CREATE","EDIT","PUBLISH","UNPUBLISH","ARCHIVE"].includes(String(event.action))&&
        Number.isSafeInteger(event.revision)&&Number(event.revision)>0&&
        typeof event.actorMemberId==="string"&&
        typeof event.createdAt==="number"&&Number.isFinite(event.createdAt);
      }))throw Error("History identity mismatch");
    if(!controller.signal.aborted){
     setHistory(data.events as EditorialEvent[]);
     setHistoryMore(data.olderEventsMayExist);
     setHistoryStatus("ready");
    }
  }).catch(()=>{if(!controller.signal.aborted)setHistoryStatus("error");});
  return ()=>controller.abort();
 },[id,current?.id,current?.revision,stage,grant?.contentReady]);
 function chooseEntry(next:string|null){
  if(dirty&&!window.confirm("Discard unsaved editorial changes?"))return;
  setSelected(next);setPreview(false);setMessage("");
  if(next===null)setForm(newDraft());
 }
 async function act(action:StudioAction){
  const controller=scope.current;
  if(!id||!controller||controller.signal.aborted||writing.current||uncertain||
    stage!=="ready"||!grant?.contentReady)return;
  if(action!=="CREATE"&&!current)return;
  if(action==="EDIT"&&current?.status!=="DRAFT")return;
  if(action==="PUBLISH"&&(!grant.publishingEnabled||current?.status!=="DRAFT"))return;
  if(action==="UNPUBLISH"&&current?.status!=="PUBLISHED")return;
  if(action==="ARCHIVE"&&current?.status!=="DRAFT")return;
  if(action==="CREATE"||action==="EDIT"){
   const problem=studioDraftProblem(form);
   if(problem){setMessage(problem);return;}
  }
  if(action==="PUBLISH"&&dirty){
   setMessage("Save your changes before publishing this revision.");return;
  }
  if(action==="ARCHIVE"&&dirty){
   setMessage("Save or discard unsaved changes before archiving this draft.");return;
  }
  if(action==="UNPUBLISH"&&!window.confirm("Remove this entry from public view?"))return;
  if(action==="ARCHIVE"&&!window.confirm("Archive this draft permanently?"))return;
  const url=action==="CREATE"?"/api/member/studio/entries":
    "/api/member/studio/entries/"+current!.id+(action==="EDIT"?"":"/"+action.toLowerCase());
  const body=action==="CREATE"?form:action==="EDIT"?{...form,expectedRevision:current!.revision}:
    {confirm:action,expectedRevision:current!.revision};
  writing.current=true;setBusy(true);setMessage("");
  try{
   if(action==="PUBLISH"){
    const preflight=await fetch("/api/member/studio/entries/"+current!.id,{
      credentials:"same-origin",cache:"no-store",redirect:"manual",signal:controller.signal,
      headers:{"X-ANEVUM-EXPECTED-MEMBER-ID":id}});
    if(controller.signal.aborted)return;
    if(!preflight.ok)throw Error("Saved revision unavailable");
    const saved:unknown=await preflight.json();
    if(controller.signal.aborted)return;
    if(!object(saved)||saved.schemaVersion!=="anevum.studio.v1"||saved.viewerMemberId!==id||
      !verifiedEntry(saved.entry)||!studioSameSavedRevision(saved.entry,current!)){
     setUncertain(true);setMessage("The saved draft changed. Reload Studio before publishing.");return;
    }
    if(!window.confirm("Publish this entry on ANEVUM now?"))return;
    if(controller.signal.aborted)return;
   }
   const result=await fetch(url,{method:action==="EDIT"?"PATCH":"POST",credentials:"same-origin",
     redirect:"manual",cache:"no-store",signal:controller.signal,
     headers:{"Content-Type":"application/json","X-ANEVUM-EXPECTED-MEMBER-ID":id},
     body:JSON.stringify(body)});
   if(controller.signal.aborted)return;
   if(result.status===400){setMessage("The server rejected these fields. Check the title, summary and body.");return;}
   if(result.status===401||result.status===403){
    setEntries([]);setGrant(null);setStage("denied");return;
   }
   if(result.status===409){
    setUncertain(true);setMessage("This entry changed or your session changed. Reload Studio before editing again.");return;
   }
   if(!result.ok)throw Error("Write failed");
   const receipt:unknown=await result.json();
   if(!object(receipt)||receipt.schemaVersion!=="anevum.studio.v1"||
     receipt.viewerMemberId!==id||receipt.saved!==true||receipt.action!==action||
     receipt.auditRecorded!==true||!verifiedEntry(receipt.entry)||
     !studioMutationMatches(receipt.entry,action,current,form))throw Error("Invalid write receipt");
   if(controller.signal.aborted)return;
   const item=receipt.entry;
   setSelected(item.id);
   setEntries(old=>[item,...old.filter(e=>e.id!==item.id)]);
   setForm({kind:item.kind,title:item.title,summary:item.summary,body:item.body});
   setOperationsRefresh(x=>x+1);
   if(action==="PUBLISH"||action==="UNPUBLISH"){
    // Verify the anonymous read path, never an authenticated preview or cache.
    const publicView=await fetch("/api/public/studio/entries/"+item.slug,{
      credentials:"omit",cache:"no-store",redirect:"manual",signal:controller.signal});
    if(controller.signal.aborted)return;
    const publicData:unknown=await publicView.json();
    if(controller.signal.aborted)return;
    if(!studioPublicStateMatches(action,publicView.status,publicData,item)){
     setUncertain(true);setMessage("The change was saved, but its public state could not be verified. Reload and reconcile; do not repeat the write.");return;
    }
   }
   setMessage(action==="PUBLISH"?"Publication recorded and public content verified.":action==="UNPUBLISH"?
     "Entry unpublished; the public endpoint now returns not found.":action==="ARCHIVE"?"Draft archived.":"Draft saved.");
  }catch{
   if(!controller.signal.aborted){setUncertain(true);setMessage(
    "The change could not be verified. Reload Studio before another action; it may already have been saved.");}
  }finally{if(scope.current===controller&&!controller.signal.aborted){writing.current=false;setBusy(false);}}
 }
 const locked=busy||uncertain;
 const draftEditable=!current||current.status==="DRAFT";
 return <section className="studio-page" aria-label="ANEVUM Studio administration">
  <header className="studio-heading">
   <p className="workshop-kicker">ANEVUM / STAFF</p>
   <h1>Studio</h1><p>Manage first-party posts, project updates, and AHA publications independently.</p>
  </header>
  {stage==="checking"&&<p role="status">Verifying staff identity…</p>}
  {stage==="denied"&&<div className="studio-panel"><h2>Access restricted</h2>
   <p>ANEVUM Studio requires a verified Google member, exact staff-member binding,
    and independently verified Cloudflare Access. Ordinary members cannot access it.</p>
   <Link to={id?"/command":"/sign-in?next=studio"}>Return to {id?"Command":"staff sign-in"}</Link></div>}
  {stage==="error"&&<div className="studio-panel"><h2>Studio unavailable</h2>
   <p>Identity or entry storage could not be verified.</p>
   <button type="button" onClick={()=>setReload(x=>x+1)}>Retry verification</button></div>}
  {stage==="ready"&&grant&&<>
   <p className="studio-info">Verified role: <strong>{grant.role}</strong> ·
    Publication: <strong>{grant.publishingEnabled?"enabled":"disabled"}</strong></p>
   <nav className="studio-nav" aria-label="Staff destinations">
    <Link to="/updates">Public updates</Link><Link to="/communities/moderation">Moderation pilot</Link>
    <Link to="/me/settings">Account</Link><Link to="/products">Projects</Link></nav>
   {grant.contentReady&&id&&<StudioOperations key={operationsRefresh} memberId={id}/>}
   {!grant.contentReady?<div className="studio-panel" role="status">
    <h2>Editorial database not yet activated</h2>
    <p>The Studio migration must pass the separate production release and data-backup gates before drafts can be saved.</p>
   </div>:<div className="studio-grid">
    <div className="studio-panel studio-records">
     <div className="studio-bar"><h2>Editorial entries</h2>
      <button type="button" disabled={locked} onClick={()=>{
       chooseEntry(null);
      }}>New draft</button></div>
     {entries.length===0?<p>No editorial drafts or published entries yet.</p>:entries.map(item=>
      <button className={"studio-entry "+(item.id===selected?"selected":"")} key={item.id}
       type="button" disabled={locked} onClick={()=>chooseEntry(item.id)}>
       <small>{kindLabels[item.kind]} · {item.status.toLowerCase()}</small>
       <strong>{item.title}</strong><small>Edited {stamp(item.updatedAt)}</small>
      </button>)}
     {more&&<p>Only 100 newest entries are loaded. Older entries remain safely stored.</p>}
    </div>
    <div className="studio-panel studio-editor">
     <div className="studio-bar"><h2>{current?"Edit entry":"Create a new draft"}</h2>
      <div className="studio-inline-actions">{current&&<span>Revision {current.revision}</span>}
       <button type="button" aria-pressed={preview} onClick={()=>setPreview(x=>!x)}>{preview?"Close preview":"Preview"}</button></div></div>
     <label>Type<select value={form.kind} disabled={locked||!draftEditable}
      onChange={e=>setForm(p=>({...p,kind:e.target.value as Kind}))}>
      {(["POST","UPDATE","AHA"] as const).map(k=><option key={k} value={k}>{kindLabels[k]}</option>)}
     </select></label>
     <label>Title<input value={form.title} maxLength={120} disabled={locked||!draftEditable}
      placeholder="What happened?" onChange={e=>setForm(p=>({...p,title:e.target.value}))}/></label>
     <label>Summary<textarea value={form.summary} rows={3} maxLength={280}
      disabled={locked||!draftEditable} placeholder="A short public summary"
      onChange={e=>setForm(p=>({...p,summary:e.target.value}))}/></label>
     <label>Body<textarea value={form.body} rows={12} maxLength={12000}
      disabled={locked||!draftEditable} placeholder="Write in plain text; paragraphs are preserved."
      onChange={e=>setForm(p=>({...p,body:e.target.value}))}/></label>
     <p className="studio-help">Entries render as safe plain text; no HTML or unapproved embeds are executed.</p>
     {preview&&<section className="studio-preview" aria-label="Private publication preview">
      <span className="c2-kicker">PRIVATE PREVIEW · NOT PUBLISHED</span>
      <p className="studio-preview-type">{kindLabels[form.kind]}</p>
      <h3>{form.title.trim()||"Untitled draft"}</h3>
      <p>{form.summary.trim()||"Add a summary to preview your post."}</p>
      <div className="studio-preview-body">{form.body.trim()||"Write the article body to see a preview."}</div>
     </section>}
     {dirty&&current?.status==="DRAFT"&&
      <p className="studio-unsaved" role="status">Unsaved changes. Save this revision before publishing.</p>}
     <div className="studio-actions">
      {!current?<button className="primary" disabled={locked} onClick={()=>void act("CREATE")}>Save draft</button>:
       current.status==="DRAFT"?<>
       <button className="primary" disabled={locked} onClick={()=>void act("EDIT")}>Save changes</button>
       <button disabled={locked||!grant.publishingEnabled||dirty} onClick={()=>void act("PUBLISH")}>Publish now</button>
       <button disabled={locked||dirty} onClick={()=>void act("ARCHIVE")}>Archive</button>
      </>:current.status==="PUBLISHED"?<>
       <Link to={"/updates/"+current.slug}>View publication</Link>
       <button disabled={locked} onClick={()=>void act("UNPUBLISH")}>Unpublish</button>
      </>:<p>Archived entries are read-only.</p>}
     </div>
     {busy&&<p role="status">Verifying the revision and applying the change…</p>}
     {message&&<p className="studio-feedback" role="status">{message}</p>}
     {uncertain&&<button type="button" onClick={()=>{
      if(dirty&&!window.confirm("Reload Studio and discard unsaved editorial changes?"))return;
      setReload(x=>x+1);
     }}>Reload and reconcile</button>}
     {current&&<section className="studio-history" aria-label="Publication audit history">
      <h3>Change history</h3>
      {historyStatus==="loading"&&<p role="status">Verifying editorial history…</p>}
      {historyStatus==="error"&&<p>Audit history unavailable; do not assume previous actions were recorded.</p>}
      {historyStatus==="ready"&&(history.length?<ol>{history.map(event=>
       <li key={event.revision}><strong>{event.action.toLowerCase()}</strong>
        <span>Revision {event.revision} · {stamp(event.createdAt)}</span>
       </li>)}</ol>:<p>No recorded changes yet.</p>)}
      {historyMore&&<p>Showing 100 most recent changes. Older records remain stored.</p>}
     </section>}
    </div>
   </div>}
  </>}
 </section>;
}

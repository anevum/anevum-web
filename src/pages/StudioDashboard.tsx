import {useCallback,useEffect,useRef,useState} from "react";
import {Link} from "react-router-dom";
import {memberAuthClient} from "../member/auth-client";
import {useMemberAvailability} from "../member/useMemberAvailability";

type Kind="POST"|"UPDATE"|"AHA";
type State="DRAFT"|"PUBLISHED"|"ARCHIVED";
type Entry={id:string;slug:string;kind:Kind;title:string;summary:string;body:string;
 status:State;revision:number;createdAt:number;updatedAt:number;publishedAt:number|null};
type Grant={role:"owner"|"admin";contentReady:boolean;publishingEnabled:boolean};
const kindLabels:Record<Kind,string>={POST:"Studio post",UPDATE:"Project update",AHA:"AHA post"};
const newDraft=()=>({kind:"UPDATE" as Kind,title:"",summary:"",body:""});
function object(value:unknown):value is Record<string,unknown>{
 return value!==null&&typeof value==="object"&&!Array.isArray(value);
}
function verifiedEntry(value:unknown):value is Entry {
 if(!object(value))return false;
 return typeof value.id==="string"&&typeof value.slug==="string"&&
  typeof value.title==="string"&&typeof value.summary==="string"&&typeof value.body==="string"&&
  ["POST","UPDATE","AHA"].includes(String(value.kind))&&
  ["DRAFT","PUBLISHED","ARCHIVED"].includes(String(value.status))&&
  Number.isSafeInteger(value.revision)&&Number(value.revision)>0&&
  typeof value.createdAt==="number"&&typeof value.updatedAt==="number"&&
  (value.publishedAt===null||typeof value.publishedAt==="number");
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
 const scope=useRef<AbortController|null>(null);
 const writing=useRef(false);
 const current=entries.find(x=>x.id===selected)||null;
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
  setForm(newDraft());setMessage("");setUncertain(false);setBusy(false);writing.current=false;
  if(checking)return;
  if(!id){setStage("denied");return;}
  const controller=new AbortController();scope.current=controller;
  void load(controller.signal).catch(()=>{if(!controller.signal.aborted)setStage("error");});
  return ()=>{controller.abort();if(scope.current===controller)scope.current=null;};
 },[checking,id,load,reload]);
 useEffect(()=>{
  if(current)setForm({kind:current.kind,title:current.title,summary:current.summary,body:current.body});
 },[current?.id,current?.revision]);
 async function act(action:"CREATE"|"EDIT"|"PUBLISH"|"UNPUBLISH"|"ARCHIVE"){
  const controller=scope.current;
  if(!id||!controller||controller.signal.aborted||writing.current||uncertain||
    stage!=="ready"||!grant?.contentReady)return;
  if(action!=="CREATE"&&!current)return;
  if(action==="EDIT"&&current?.status!=="DRAFT")return;
  if(action==="PUBLISH"&&(!grant.publishingEnabled||current?.status!=="DRAFT"))return;
  if(action==="UNPUBLISH"&&current?.status!=="PUBLISHED")return;
  if(action==="ARCHIVE"&&current?.status!=="DRAFT")return;
  if(action==="PUBLISH"&&!window.confirm("Publish this entry on ANEVUM now?"))return;
  if(action==="UNPUBLISH"&&!window.confirm("Remove this entry from public view?"))return;
  if(action==="ARCHIVE"&&!window.confirm("Archive this draft permanently?"))return;
  const url=action==="CREATE"?"/api/member/studio/entries":
    "/api/member/studio/entries/"+current!.id+(action==="EDIT"?"":"/"+action.toLowerCase());
  const body=action==="CREATE"?form:action==="EDIT"?{...form,expectedRevision:current!.revision}:
    {confirm:action,expectedRevision:current!.revision};
  writing.current=true;setBusy(true);setMessage("");
  try{
   const result=await fetch(url,{method:action==="EDIT"?"PATCH":"POST",credentials:"same-origin",
     redirect:"manual",cache:"no-store",signal:controller.signal,
     headers:{"Content-Type":"application/json","X-ANEVUM-EXPECTED-MEMBER-ID":id},
     body:JSON.stringify(body)});
   if(controller.signal.aborted)return;
   if(!result.ok)throw Error("Write failed");
   const receipt:unknown=await result.json();
   if(!object(receipt)||receipt.schemaVersion!=="anevum.studio.v1"||
     receipt.viewerMemberId!==id||receipt.saved!==true||receipt.action!==action||
     receipt.auditRecorded!==true||!verifiedEntry(receipt.entry)||
     (current&&receipt.entry.id!==current.id)||
     (current&&receipt.entry.revision!==current.revision+1)||
     (action==="CREATE"&&receipt.entry.status!=="DRAFT"))throw Error("Invalid write receipt");
   if(controller.signal.aborted)return;
   const item=receipt.entry;
   setSelected(item.id);
   setEntries(old=>[item,...old.filter(e=>e.id!==item.id)]);
   setForm({kind:item.kind,title:item.title,summary:item.summary,body:item.body});
   setMessage(action==="PUBLISH"?"Publication recorded.":action==="UNPUBLISH"?
     "Entry unpublished.":action==="ARCHIVE"?"Draft archived.":"Draft saved.");
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
   <Link to={id?"/command":"/sign-in"}>Return to {id?"Command":"sign-in"}</Link></div>}
  {stage==="error"&&<div className="studio-panel"><h2>Studio unavailable</h2>
   <p>Identity or entry storage could not be verified.</p>
   <button type="button" onClick={()=>setReload(x=>x+1)}>Retry verification</button></div>}
  {stage==="ready"&&grant&&<>
   <p className="studio-info">Verified role: <strong>{grant.role}</strong> ·
    Publication: <strong>{grant.publishingEnabled?"enabled":"disabled"}</strong></p>
   <nav className="studio-nav" aria-label="Staff destinations">
    <Link to="/updates">Public updates</Link><Link to="/communities/moderation">Moderation pilot</Link>
    <Link to="/me/settings">Account</Link><Link to="/products">Projects</Link></nav>
   {!grant.contentReady?<div className="studio-panel" role="status">
    <h2>Editorial database not yet activated</h2>
    <p>The Studio migration must pass the separate production release and data-backup gates before drafts can be saved.</p>
   </div>:<div className="studio-grid">
    <div className="studio-panel studio-records">
     <div className="studio-bar"><h2>Editorial entries</h2>
      <button type="button" disabled={locked} onClick={()=>{
       setSelected(null);setForm(newDraft());setMessage("");
      }}>New draft</button></div>
     {entries.length===0?<p>No editorial drafts or published entries yet.</p>:entries.map(item=>
      <button className={"studio-entry "+(item.id===selected?"selected":"")} key={item.id}
       type="button" disabled={locked} onClick={()=>{setSelected(item.id);setMessage("");}}>
       <small>{kindLabels[item.kind]} · {item.status.toLowerCase()}</small>
       <strong>{item.title}</strong><small>Edited {stamp(item.updatedAt)}</small>
      </button>)}
     {more&&<p>Only 100 newest entries are loaded. Older entries remain safely stored.</p>}
    </div>
    <div className="studio-panel studio-editor">
     <div className="studio-bar"><h2>{current?"Edit entry":"Create a new draft"}</h2>
      {current&&<span>Revision {current.revision}</span>}</div>
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
     <div className="studio-actions">
      {!current?<button className="primary" disabled={locked} onClick={()=>void act("CREATE")}>Save draft</button>:
       current.status==="DRAFT"?<>
       <button className="primary" disabled={locked} onClick={()=>void act("EDIT")}>Save changes</button>
       <button disabled={locked||!grant.publishingEnabled} onClick={()=>void act("PUBLISH")}>Publish now</button>
       <button disabled={locked} onClick={()=>void act("ARCHIVE")}>Archive</button>
      </>:current.status==="PUBLISHED"?<>
       <Link to={"/updates/"+current.slug}>View publication</Link>
       <button disabled={locked} onClick={()=>void act("UNPUBLISH")}>Unpublish</button>
      </>:<p>Archived entries are read-only.</p>}
     </div>
     {busy&&<p role="status">Submitting the change…</p>}
     {message&&<p className="studio-feedback" role="status">{message}</p>}
     {uncertain&&<button onClick={()=>setReload(x=>x+1)}>Reload and reconcile</button>}
    </div>
   </div>}
  </>}
 </section>;
}

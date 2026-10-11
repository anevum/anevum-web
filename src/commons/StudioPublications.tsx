import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
type Entry={slug:string;kind:"POST"|"UPDATE"|"AHA";title:string;summary:string;publishedAt:number;body?:string};
type Status="loading"|"ready"|"unavailable"|"not-found"|"error";
const label={POST:"Studio post",UPDATE:"Project update",AHA:"AHA post"} as const;
function verified(value:unknown):value is Entry {
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return typeof v.slug==="string"&&typeof v.title==="string"&&typeof v.summary==="string"&&
  typeof v.publishedAt==="number"&&["POST","UPDATE","AHA"].includes(String(v.kind));
}
function dated(value:number){return new Date(value*1000).toLocaleDateString(undefined,{dateStyle:"medium"});}
export default function StudioPublications({slug}:{slug?:string}){
 const [status,setStatus]=useState<Status>("loading");
 const [items,setItems]=useState<Entry[]>([]);
 const [single,setSingle]=useState<Entry|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  setStatus("loading");setItems([]);setSingle(null);
  const endpoint="/api/public/studio/entries"+(slug?"/"+encodeURIComponent(slug):"");
  void fetch(endpoint,{credentials:"omit",cache:"no-store",signal:controller.signal})
   .then(async r=>{
    if(controller.signal.aborted)return;
    if(r.status===503){setStatus("unavailable");return;}
    if(r.status===404){setStatus("not-found");return;}
    if(!r.ok)throw Error("Unavailable");
    const value:unknown=await r.json();
    if(!value||typeof value!=="object"||Array.isArray(value))throw Error("Invalid");
    const data=value as Record<string,unknown>;
    if(data.schemaVersion!=="anevum.studio.v1")throw Error("Unknown schema");
    if(slug){
     if(!verified(data.entry)||data.entry.slug!==slug||typeof data.entry.body!=="string")
      throw Error("Invalid publication");
     if(!controller.signal.aborted)setSingle(data.entry);
    }else{
     if(!Array.isArray(data.entries)||!data.entries.every(verified))throw Error("Invalid list");
     if(!controller.signal.aborted)setItems(data.entries);
    }
    if(!controller.signal.aborted)setStatus("ready");
   }).catch(()=>{if(!controller.signal.aborted)setStatus("error");});
  return ()=>controller.abort();
 },[slug]);
 return <div className="c2-page studio-publications">
  <header className="c2-intro"><span className="c2-kicker">ANEVUM / STUDIO</span>
   <h1>{single?single.title:"Updates from the workshop"}</h1>
   <p>Real Studio posts, project updates and AHA records published by ANEVUM.</p></header>
  {slug&&<Link className="c2-text-link" to="/updates">← All updates</Link>}
  {status==="loading"&&<p role="status">Checking publications…</p>}
  {status==="unavailable"&&<div className="c2-empty"><h2>Studio publishing is not live yet</h2>
   <p>Existing verified research remains available through Field Notes.</p>
   <Link to="/field-notes">Read Field Notes</Link></div>}
  {status==="not-found"&&<div className="c2-empty"><h2>Publication not found</h2>
   <p>The entry was unpublished or the URL is incorrect.</p></div>}
  {status==="error"&&<div className="c2-empty"><h2>Unable to verify public updates</h2>
   <p>Nothing is invented when publication data is unavailable.</p></div>}
  {status==="ready"&&single&&<article className="c2-card studio-article">
   <div className="c2-card-meta"><span>{label[single.kind]}</span>
    <time dateTime={new Date(single.publishedAt*1000).toISOString()}>{dated(single.publishedAt)}</time></div>
   <p className="studio-summary">{single.summary}</p>
   <div className="studio-article-body">{single.body}</div>
  </article>}
  {status==="ready"&&!slug&&(items.length===0?<div className="c2-empty">
    <h2>No published updates yet</h2><p>Private drafts do not appear here.</p>
    <Link to="/field-notes">Explore Field Notes</Link></div>:
   <div className="c2-stack">{items.map(item=><article key={item.slug} className="c2-card">
    <div className="c2-card-meta"><span>{label[item.kind]}</span>
     <time dateTime={new Date(item.publishedAt*1000).toISOString()}>{dated(item.publishedAt)}</time></div>
    <h2><Link to={"/updates/"+item.slug}>{item.title}</Link></h2>
    <p>{item.summary}</p><Link className="c2-text-link" to={"/updates/"+item.slug}>Read update →</Link>
   </article>)}<p className="c2-result">Latest 40 verified publications.</p></div>)}
  <div className="c2-action-row"><Link to="/field-notes">Field Notes</Link><Link to="/products">Projects</Link></div>
 </div>;
}

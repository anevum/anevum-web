import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
type Post={slug:string;kind:"POST"|"UPDATE"|"AHA";title:string;summary:string;publishedAt:number};
const labels={POST:"Studio post",UPDATE:"Project update",AHA:"AHA post"} as const;
function valid(value:unknown):value is Post {
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const item=value as Record<string,unknown>;
 return typeof item.slug==="string"&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)&&
   ["POST","UPDATE","AHA"].includes(String(item.kind))&&
   typeof item.title==="string"&&typeof item.summary==="string"&&
   typeof item.publishedAt==="number"&&Number.isFinite(item.publishedAt);
}
/** First-party Studio publications appear on the actual Commons homepage when
 * genuinely published. Disabled/unavailable service never fabricates feed items.
 */
export default function StudioRecentPosts(){
 const [items,setItems]=useState<Post[]>([]);
 useEffect(()=>{
  const controller=new AbortController();
  void fetch("/api/public/studio/entries",{cache:"no-store",credentials:"omit",signal:controller.signal})
   .then(async response=>response.ok?response.json():null)
   .then(value=>{
    if(controller.signal.aborted)return;
    if(value?.schemaVersion==="anevum.studio.v1"&&Array.isArray(value.entries)&&
      value.entries.every(valid))setItems(value.entries.slice(0,4));
    else setItems([]);
   }).catch(()=>{if(!controller.signal.aborted)setItems([]);});
  return ()=>controller.abort();
 },[]);
 if(!items.length)return null;
 return <section className="studio-home-feed" aria-label="Recent ANEVUM Studio publications">
  <header><h2>Latest from ANEVUM Studio</h2><Link to="/updates">View all updates →</Link></header>
  <div className="studio-home-items">{items.map(item=><article className="c2-card" key={item.slug}>
   <span className="c2-kicker">{labels[item.kind]} ·
    {" "+new Date(item.publishedAt*1000).toLocaleDateString(undefined,{dateStyle:"medium"})}</span>
   <h3><Link to={"/updates/"+item.slug}>{item.title}</Link></h3>
   <p>{item.summary}</p><Link className="c2-text-link" to={"/updates/"+item.slug}>Read publication →</Link>
  </article>)}</div>
 </section>;
}

import {useState} from 'react';
import {spaceRequest,type WallEntry} from '../lib/canonical-beta';
export function MemberWall({posts,owner,onChanged}:{posts:WallEntry[];owner:boolean;onChanged?:()=>Promise<void>}){
 const [body,setBody]=useState(''),[editing,setEditing]=useState<WallEntry|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[removing,setRemoving]=useState<string|null>(null);
 async function save(){if(!body.trim()||busy)return;setBusy(true);setError('');setNotice('');try{
  await spaceRequest('/api/v1/member/wall'+(editing?'/'+editing.id:''),editing?'PATCH':'POST',editing?{body,revision:editing.revision}:{body});
  await onChanged?.();setBody('');setEditing(null);setNotice(editing?'Entry updated.':'Your wall entry is saved.');
 }catch(e){setError(e instanceof Error?e.message:'Could not save entry.')}finally{setBusy(false)}}
 async function remove(id:string){setBusy(true);setError('');try{await spaceRequest('/api/v1/member/wall/'+id,'DELETE');await onChanged?.();setRemoving(null);setNotice('Entry removed.')}catch(e){setError(e instanceof Error?e.message:'Could not remove entry.')}finally{setBusy(false)}}
 return <section className="ms-wall" aria-labelledby="member-wall-title"><div className="ms-section-head"><div><span className="kicker">PERSONAL TRANSMISSIONS</span><h2 id="member-wall-title">The wall.</h2></div><span>{posts.length} {posts.length===1?'ENTRY':'ENTRIES'}</span></div>
  {owner&&<form className="ms-wall-compose" onSubmit={e=>{e.preventDefault();void save()}}><label htmlFor="wall-entry">{editing?'Edit your entry':'What are you making, exploring or thinking about?'}</label>
   <textarea id="wall-entry" maxLength={2000} rows={4} value={body} onChange={e=>setBody(e.target.value)} disabled={busy} placeholder="Send your first signal…" required/>
   <div className="ms-compose-foot"><small>{body.length}/2,000 · Follows your profile’s visibility</small><div className="ms-actions">{editing&&<button type="button" onClick={()=>{setEditing(null);setBody('')}} disabled={busy}>CANCEL EDIT</button>}<button className="ms-primary" disabled={busy||!body.trim()}>{busy?'SAVING…':editing?'SAVE ENTRY':'POST TO WALL'}</button></div></div>
  </form>}
  {error&&<p role="alert" className="ms-error">{error}</p>}{notice&&<p role="status">{notice}</p>}
  {posts.length?posts.map(post=><article className="ms-wall-entry" key={post.id}><time dateTime={new Date(post.createdAt*1000).toISOString()}>{new Date(post.createdAt*1000).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}{post.revision>1?' · Edited':''}</time><p>{post.body}</p>
   {owner&&<div className="ms-actions"><button type="button" disabled={busy} onClick={()=>{setEditing(post);setBody(post.body);setError('');document.getElementById('wall-entry')?.focus()}}>EDIT</button><button type="button" disabled={busy} onClick={()=>setRemoving(post.id)}>REMOVE</button>{removing===post.id&&<span className="ms-delete-confirm">Remove this entry? <button type="button" disabled={busy} onClick={()=>void remove(post.id)}>YES, REMOVE</button><button type="button" onClick={()=>setRemoving(null)}>KEEP</button></span>}</div>}
  </article>):<div className="ms-empty"><span aria-hidden="true">✦</span><h3>A quiet corner of the universe.</h3><p>{owner?'Start with an introduction, a work in progress, or something you want to share.':'This member has not posted a wall entry yet.'}</p></div>}
 </section>;
}

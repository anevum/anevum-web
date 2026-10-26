// ANEVUM Creator Studio / Continuance Institute — one private Studio vault.
// Large builds stay quarantined; no public publishing or untrusted execution.
import {useEffect,useRef,useState,type DragEvent} from 'react';
import {studioLargeAssets,studioCheckLargeFile,studioUploadLarge,
 studioDeleteLargeAsset,studioDownloadLargeUrl,
 type StudioProject,type StudioLargeAsset,type StudioLargeUsage} from '../lib/canonical-studio';

const fmt=(bytes:number)=>bytes>=1073741824?
 (bytes/1073741824).toFixed(2)+' GiB':(bytes/1048576).toFixed(1)+' MiB';
const canEdit=(p:StudioProject)=>p.status==='draft'||p.status==='changes_requested';
const fileCheck=(file:File)=>studioCheckLargeFile(file);
const sameFile=(asset:StudioLargeAsset,file:File)=>asset.name===file.name&&asset.sizeBytes===file.size;

export function StudioLargeUploader({project,onAssetsChanged,onProjectChanged}:{
 project:StudioProject;
 onAssetsChanged:(assets:StudioLargeAsset[])=>void;
 onProjectChanged:(project:StudioProject)=>void
}){
 const [data,setData]=useState<StudioLargeUsage|null>(null);
 const [selected,setSelected]=useState<File|null>(null);
 const [busy,setBusy]=useState(false);
 const [done,setDone]=useState(0);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [drag,setDrag]=useState(false);
 const [offline,setOffline]=useState(false);
 const cancel=useRef<AbortController|null>(null);
 useEffect(()=>{
  let alive=true;const ac=new AbortController();
  studioLargeAssets(project.id,ac.signal).then(r=>{
   if(alive){setData(r);onAssetsChanged(r.assets);setOffline(false);}
  }).catch(()=>{if(alive){setOffline(true);onAssetsChanged([]);}});
  return ()=>{alive=false;ac.abort();cancel.current?.abort();};
 },[project.id,onAssetsChanged]);
 async function reload(){
  const r=await studioLargeAssets(project.id);
  setData(r);onAssetsChanged(r.assets);setOffline(false);
 }
 function pick(file:File|null){
  if(!file||busy)return;
  const inspected=fileCheck(file);
  if(!inspected.ok){setError(inspected.reason);setSelected(null);return;}
  setSelected(file);setDone(0);setError('');setMessage('');
 }
 function drop(event:DragEvent<HTMLElement>){
  event.preventDefault();setDrag(false);
  if(event.dataTransfer.files.length!==1){
   setError('Choose one large build at a time; smaller assets can use the regular vault.');return;
  }
  pick(event.dataTransfer.files.item(0));
 }
 async function upload(resumeId?:string){
  if(!selected||busy||!data?.uploadsReady||!canEdit(project))return;
  if(resumeId&&!data.assets.some(a=>a.id===resumeId&&
   ['reserved','uploading'].includes(a.status)&&sameFile(a,selected))){
   setError('Choose the original file with the exact filename and size to resume.');return;
  }
  const ac=new AbortController();cancel.current=ac;
  setBusy(true);setError('');setMessage('');setDone(0);
  try{
   await studioUploadLarge(project.id,selected,
    (uploaded,total)=>setDone(Math.round(uploaded/total*100)),ac.signal,resumeId);
   setSelected(null);setDone(100);
   setMessage('Private upload completed. This build is quarantined, not published or executable.');
   await reload();
  }catch(e){
   setError(ac.signal.aborted?'Upload interrupted. Your completed parts are retained for a matching-file resume.':
    e instanceof Error?e.message:'Large upload failed. Your private draft was preserved.');
   try{await reload();}catch{/* retry when service recovers */}
  }finally{cancel.current=null;setBusy(false);}
 }
 async function remove(asset:StudioLargeAsset){
  if(busy||!data?.storageReady)return;
  if(!window.confirm(project.status==='pending_review'
   ?'Deleting this large file will withdraw the pending private review. Continue?'
   :'Permanently erase this private '+fmt(asset.sizeBytes)+' file?'))return;
  setBusy(true);setError('');setMessage('');
  try{
   const result=await studioDeleteLargeAsset(project.id,asset.id);
   await reload();
   if(result.withdrawnFromReview){
    // Reload authoritative project metadata before enabling another mutation.
    const {studioGet}=await import('../lib/canonical-studio');
    onProjectChanged((await studioGet(project.id)).project);
   }
   setMessage('The private file has been removed from R2 and your draft.');
  }catch(e){setError(e instanceof Error?e.message:'Deletion was not verified; try again.');}
  finally{setBusy(false);}
 }
 return <section className="st-panel st-assets st-large-uploads" aria-label="Large creator builds">
  <p className="st-kicker">CONTINUANCE INSTITUTE / LARGE CREATOR BUILDS</p>
  <h2>EXTENDED ASSET VAULT.</h2>
  <p className="st-muted">Upload a Godot Web export ZIP, another browser build ZIP, or original MP4/WebM media above 20 MiB, up to 1 GiB each. Transfers use resumable 8 MiB parts. Files stay private in quarantine, never auto-publish or execute.</p>
  {offline?<p className="st-muted" role="status">The large-file channel is not provisioned in this environment. Existing small-file uploads and project records remain available.</p>:
   <div className="st-storage-meter" aria-label="Large-build storage reservation">
    <div><span>YOUR EXTENDED VAULT</span><strong>{fmt(data?.memberUsedBytes||0)} / {fmt(data?.memberCapacityBytes||5368709120)}</strong></div>
    <progress max={data?.memberCapacityBytes||5368709120} value={Math.min(data?.memberUsedBytes||0,data?.memberCapacityBytes||5368709120)} aria-label="Member reserved bytes"/>
    <small>PROJECT: {fmt(data?.projectUsedBytes||0)} · Reserved uploads count against capacity until completed or removed.</small>
    <div><span>SHARED CREATOR RESERVE</span><strong>{fmt(data?.globalUsedBytes||0)} / {fmt(data?.globalCapacityBytes||26843545600)}</strong></div>
    <progress max={data?.globalCapacityBytes||26843545600} value={Math.min(data?.globalUsedBytes||0,data?.globalCapacityBytes||26843545600)} aria-label="Shared reserved bytes"/>
    {(data?.globalUsedBytes||0)>=(data?.globalCapacityBytes||1)*.8&&
     <p role="status" className="st-muted">Shared storage is approaching its review threshold. New reservations may be paused while capacity is expanded.</p>}
   </div>}
  {!offline&&!data?.uploadsReady&&<p className="st-muted">New large uploads are awaiting authenticated creator rollout. Existing private records remain visible.</p>}
  {!!data?.uploadsReady&&canEdit(project)&&
   <div className={'st-drop'+(drag?' is-drag':'')}
    onDragOver={e=>{e.preventDefault();setDrag(true);}}
    onDragLeave={()=>setDrag(false)} onDrop={drop} role="group" aria-label="Choose private large build">
    <label htmlFor="st-large-file">DROP A LARGE BUILD OR CHOOSE A FILE</label>
    <input id="st-large-file" type="file" accept=".zip,.mp4,.webm" disabled={busy}
     onChange={e=>{pick(e.currentTarget.files?.item(0)||null);e.currentTarget.value='';}}/>
    <small>Only verified ANEVUM creators can reserve space. No public object URLs or unreviewed game execution.</small>
   </div>}
  {selected&&<div className="st-upload-queue">
   <strong>{selected.name} · {fmt(selected.size)}</strong>
   <p className="st-muted">If this is a resumed upload, select the matching unfinished record below. Otherwise start a new reservation.</p>
   {busy&&<div><p role="status">UPLOADING / {done}%</p>
    <progress max={100} value={done} aria-label="Large upload progress"/></div>}
   <div className="st-actions">
    <button type="button" className="st-button" disabled={busy||!data?.uploadsReady}
     onClick={()=>void upload()}>START PRIVATE UPLOAD</button>
    {busy&&<button type="button" className="st-link" onClick={()=>cancel.current?.abort()}>PAUSE TRANSFER</button>}
   </div>
  </div>}
  <div className="st-file-list">{data?.assets.map(asset=><div className="st-file" key={asset.id}>
   <div><strong>{asset.name}</strong><small>{fmt(asset.sizeBytes)} · {asset.status.toUpperCase()} · {asset.completedParts}/{asset.partCount} PARTS</small></div>
   <div className="st-file-actions">
    {selected&&['uploading','reserved'].includes(asset.status)&&canEdit(project)&&sameFile(asset,selected)&&data.uploadsReady&&
     <button type="button" disabled={busy} onClick={()=>void upload(asset.id)}>RESUME THIS FILE</button>}
    {asset.status==='quarantined'&&data.storageReady&&
     <a href={studioDownloadLargeUrl(project.id,asset.id)} download={asset.name}>PRIVATE DOWNLOAD</a>}
    {data.storageReady&&<button type="button" disabled={busy} onClick={()=>void remove(asset)}>REMOVE</button>}
   </div>
  </div>)}</div>
  {data&&!data.assets.length&&<p className="st-muted">No large creator files have been reserved for this project.</p>}
  {message&&<p className="st-success" role="status">{message}</p>}
  {error&&<p className="st-error" role="alert">{error}</p>}
 </section>;
}

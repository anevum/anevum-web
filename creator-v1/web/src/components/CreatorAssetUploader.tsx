import {useEffect,useRef,useState} from "react";
import {listPrivateAssets,uploadPrivateAsset,type CreatorAsset} from "../lib/member-assets";
import {classifyFile} from "../lib/upload-policy";
type Props={projectId:string;canEdit:boolean};
export function CreatorAssetUploader({projectId,canEdit}:Props){
  const [assets,setAssets]=useState<CreatorAsset[]>([]);
  const [files,setFiles]=useState<File[]>([]);
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [available,setAvailable]=useState(false);
  const current=useRef<AbortController|null>(null);
  async function refresh(){
    try{const response=await listPrivateAssets(projectId);setAssets(response.assets);setAvailable(true);setError("");}
    catch(e){setAvailable(false);setError(e instanceof Error?e.message:"Private file service unavailable");}
  }
  useEffect(()=>{void refresh();return()=>current.current?.abort()},[projectId]);
  function select(list:FileList|null){
    if(!list)return;
    setNotice("");setError("");
    const selected=[...list].slice(0,8);
    const bad=selected.map(f=>({name:f.name,check:classifyFile(f)})).filter(x=>!x.check.ok);
    if(bad.length){setFiles([]);setError(bad.map(x=>x.name+": "+(!x.check.ok?x.check.reason:"")).join(" "));return;}
    setFiles(selected);
  }
  async function upload(){
    if(!canEdit||!available||busy||!files.length)return;
    setBusy(true);setError("");setNotice("");
    const controller=new AbortController();current.current=controller;
    try{
      for(const file of files){await uploadPrivateAsset(projectId,file,controller.signal);}
      setFiles([]);
      setNotice("File bytes stored privately for further inspection. They are not published, playable, or approved.");
      await refresh();
    }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Upload failed. Try again.");}
    finally{current.current=null;setBusy(false);}
  }
  return <section className="member-panel creator-asset-uploader" aria-label="Private project files">
    <div className="asset-uploader-heading"><div><span className="kicker">03 / PRIVATE PROJECT FILES</span><h2>UPLOAD YOUR WORK.</h2></div><span className="member-status">STAGING ONLY</span></div>
    <p className="member-caption">Files belong to this draft only. A successful upload does not publish, execute, or approve a creation. Moderators must separately review it.</p>
    {canEdit&&<div className="asset-uploader-drop">
      <label htmlFor="creator-assets-picker">CHOOSE FILES OR DROP HERE</label>
      <input id="creator-assets-picker" type="file" multiple disabled={!available||busy} accept=".png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.pdf,.txt,.md,.zip" onChange={e=>select(e.target.files)} />
      <p>Private pilot: images 10 MB, audio and ZIP 20 MB, PDF 10 MB, text 1 MB. Up to 8 files selected at once.</p>
    </div>}
    {files.length>0&&<div className="asset-uploader-queue"><strong>READY TO UPLOAD</strong>{files.map((f,i)=><p key={i}>{f.name} · {(f.size/1048576).toFixed(2)} MB</p>)}
      <button className="button primary" disabled={busy||!available} onClick={()=>void upload()}>{busy?"UPLOADING PRIVATE FILES…":"UPLOAD TO PRIVATE DRAFT"}</button>
      {busy&&<button className="button secondary" onClick={()=>current.current?.abort()}>CANCEL</button>}
    </div>}
    {assets.length>0&&<div className="asset-uploader-list"><h3>FILES ATTACHED TO THIS DRAFT</h3>{assets.map(a=><div key={a.id} className="asset-uploader-item"><strong>{a.name}</strong><span>{a.kind.toUpperCase()} · {(a.sizeBytes/1048576).toFixed(2)} MB · {a.status.toUpperCase()}</span></div>)}</div>}
    {notice&&<p role="status" className="draft-notice">{notice}</p>}
    {error&&<p role="alert" className="member-error">{error}</p>}
    {!available&&<p className="member-caption">Upload controls are disabled until the authenticated staging asset service is configured. Existing project draft and external demo links still work.</p>}
    {assets.length===0&&available&&<p className="member-caption">No private files attached yet.</p>}
  </section>;
}

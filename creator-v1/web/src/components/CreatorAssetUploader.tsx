import {useEffect,useRef,useState} from "react";
import {
  listPrivateAssets,uploadPrivateAsset,removePrivateAsset,privateAssetDownloadUrl,
  type CreatorAsset
} from "../lib/member-assets";
import {classifyFile} from "../lib/upload-policy";

type Props={projectId:string;canEdit:boolean};
type LocalPreview={name:string;url:string;kind:"image"|"audio"};
const MAX_SELECTION=8;
const sizeLabel=(n:number)=>(n/1048576).toFixed(2)+" MB";

export function CreatorAssetUploader({projectId,canEdit}:Props){
  const [assets,setAssets]=useState<CreatorAsset[]>([]);
  const [files,setFiles]=useState<File[]>([]);
  const [previews,setPreviews]=useState<LocalPreview[]>([]);
  const [dragging,setDragging]=useState(false);
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState("");
  const [available,setAvailable]=useState(false);
  const current=useRef<AbortController|null>(null);
  const input=useRef<HTMLInputElement|null>(null);

  async function refresh(){
    const res=await listPrivateAssets(projectId);
    setAssets(res.assets);
    setAvailable(true);
  }
  useEffect(()=>{
    let mounted=true;
    setAvailable(false);setAssets([]);setFiles([]);setNotice("");setError("");
    listPrivateAssets(projectId).then(res=>{
      if(mounted){setAssets(res.assets);setAvailable(true);}
    },e=>{
      if(mounted){setAvailable(false);setError(e instanceof Error?e.message:"Private files are unavailable");}
    });
    return()=>{mounted=false;current.current?.abort();};
  },[projectId]);
  useEffect(()=>{
    const generated:LocalPreview[]=files.flatMap(f=>{
      const result=classifyFile(f);
      if(!result.ok||!["image","audio"].includes(result.kind))return [];
      return [{name:f.name,kind:result.kind as "image"|"audio",url:URL.createObjectURL(f)}];
    });
    setPreviews(generated);
    return()=>generated.forEach(item=>URL.revokeObjectURL(item.url));
  },[files]);

  function select(list:FileList|null){
    if(!list||busy)return;
    setNotice("");setError("");
    if(list.length>MAX_SELECTION){
      setFiles([]);setError("Select up to eight files per upload batch.");return;
    }
    const incoming=Array.from(list);
    const invalid=incoming.map(f=>({name:f.name,result:classifyFile(f)})).filter(x=>!x.result.ok);
    if(invalid.length){
      setFiles([]);
      setError(invalid.map(x=>x.name+": "+(!x.result.ok?x.result.reason:"")).join(" "));
      return;
    }
    setFiles(incoming);
    if(input.current)input.current.value="";
  }
  async function upload(){
    if(!canEdit||!available||busy||files.length===0)return;
    setBusy(true);setError("");setNotice("");
    const controller=new AbortController();current.current=controller;
    let completed=0;
    try{
      for(const file of files){
        setProgress("Uploading "+(completed+1)+" of "+files.length+": "+file.name);
        await uploadPrivateAsset(projectId,file,controller.signal);
        completed++;
      }
      setFiles([]);setProgress("");
      setNotice("All "+completed+" file(s) stored in private quarantine. No file has been published or approved.");
      await refresh();
    }catch(e){
      if(!controller.signal.aborted){
        setError(e instanceof Error?e.message:"Private upload failed");
      }else{
        setNotice("Upload cancelled. Any incomplete reservation remains private until removed or expired.");
      }
      setFiles(files.slice(completed));
      try{await refresh();}catch{setAvailable(false);}
    }finally{current.current=null;setProgress("");setBusy(false);}
  }
  async function remove(asset:CreatorAsset){
    if(!canEdit||!available||busy||asset.status==="uploading")return;
    if(!window.confirm("Remove the private file '"+asset.name+"' from this draft?"))return;
    setBusy(true);setError("");setNotice("");
    try{
      await removePrivateAsset(projectId,asset.id);
      await refresh();
      setNotice("Private file removed.");
    }catch(e){setError(e instanceof Error?e.message:"Unable to remove private file");}
    finally{setBusy(false);}
  }
  return <section className="member-panel creator-asset-uploader" aria-label="Private project files">
    <div className="asset-uploader-heading"><div>
      <span className="kicker">03 / PRIVATE PROJECT FILES</span>
      <h2>UPLOAD YOUR WORK.</h2>
    </div><span className="member-status">STAGING ONLY</span></div>
    <p className="member-caption">
      Attach originals to a private project draft. Files are not scanned for malware, executed, published,
      playable or approved by uploading. Creator-owned files are stored in private quarantine.
    </p>
    {canEdit&&<div
      className={"asset-uploader-drop"+(dragging?" asset-uploader-dragging":"")}
      role="group" aria-label="Choose or drop files for private upload"
      onDragOver={e=>{e.preventDefault();if(available&&!busy)setDragging(true);}}
      onDragLeave={()=>setDragging(false)}
      onDrop={e=>{e.preventDefault();setDragging(false);if(available&&!busy)select(e.dataTransfer.files);}}
    >
      <label htmlFor="creator-assets-picker">DROP YOUR FILES OR CHOOSE FROM DEVICE</label>
      <input ref={input} id="creator-assets-picker" type="file" multiple
        disabled={!available||busy} accept=".png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.pdf,.txt,.md,.zip"
        onChange={e=>select(e.target.files)}/>
      <p>Private pilot: images up to 10 MB, MP3/WAV and ZIP up to 20 MB, PDF up to 10 MB, text up to 1 MB. Up to eight files at once.</p>
    </div>}
    {files.length>0&&<div className="asset-uploader-queue">
      <strong>READY TO UPLOAD ({files.length})</strong>
      {files.map((f,i)=><p key={f.name+"-"+i}>{f.name} · {sizeLabel(f.size)}</p>)}
      {previews.length>0&&<div className="asset-uploader-previews" aria-label="Local file previews">
        {previews.map(p=><div className="asset-uploader-preview" key={p.url}>
          {p.kind==="image"?<img src={p.url} alt={"Local preview of "+p.name}/>:<audio controls preload="none" src={p.url} aria-label={"Local audio preview of "+p.name}/>}
          <small>{p.name} · LOCAL PREVIEW ONLY</small>
        </div>)}
      </div>}
      {progress&&<p role="status">{progress}</p>}
      <button type="button" className="button primary" disabled={busy||!available} onClick={()=>void upload()}>
        {busy?"UPLOADING PRIVATE FILES…":"UPLOAD TO PRIVATE DRAFT"}
      </button>
      {busy&&<button type="button" className="button secondary" onClick={()=>current.current?.abort()}>CANCEL</button>}
    </div>}
    {assets.length>0&&<div className="asset-uploader-list">
      <h3>PRIVATE DRAFT ATTACHMENTS</h3>
      {assets.map(a=><div key={a.id} className="asset-uploader-item">
        <div><strong>{a.name}</strong>
          <span>{a.kind.toUpperCase()} · {sizeLabel(a.sizeBytes)} · {a.status==="quarantined"?"PRIVATE — AWAITING REVIEW":a.status.toUpperCase()}</span>
        </div>
        <div className="asset-uploader-item-actions">
          {a.status==="quarantined"&&<a className="button secondary" href={privateAssetDownloadUrl(projectId,a.id)} download={a.name}>PRIVATE DOWNLOAD</a>}
          {canEdit&&a.status!=="uploading"&&<button type="button" className="button secondary" disabled={busy} onClick={()=>void remove(a)}>
            {a.status==="deleting"?"RETRY REMOVAL":"REMOVE"}
          </button>}
        </div>
      </div>)}
    </div>}
    {notice&&<p role="status" className="draft-notice">{notice}</p>}
    {error&&<p role="alert" className="member-error">{error}</p>}
    {!available&&<p className="member-caption">Uploads remain disabled until the authenticated staging asset service and private storage are configured. Existing drafts and external demo links still work.</p>}
    {assets.length===0&&available&&<p className="member-caption">No files attached to this project yet.</p>}
  </section>;
}

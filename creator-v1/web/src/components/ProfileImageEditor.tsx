import {useEffect,useRef,useState} from 'react';
import {spaceRequest} from '../lib/canonical-beta';

export function ProfileImageEditor({slot,version,onSaved}:{slot:'avatar'|'banner';version?:number;onSaved:()=>Promise<void>}){
 const [source,setSource]=useState(''),[zoom,setZoom]=useState(1),[x,setX]=useState(50),[y,setY]=useState(50);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const canvas=useRef<HTMLCanvasElement>(null),picture=useRef<HTMLImageElement|null>(null),input=useRef<HTMLInputElement>(null);
 const width=slot==='avatar'?384:1440,height=slot==='avatar'?384:480;
 useEffect(()=>()=>{if(source)URL.revokeObjectURL(source)},[source]);
 useEffect(()=>{if(!source)return;const image=new Image();let active=true;image.onload=()=>{if(active){picture.current=image;paint(image)}};image.onerror=()=>{if(active)setError('This image could not be opened. Choose a JPEG, PNG or WebP file.')};image.src=source;return()=>{active=false}},[source]);
 function paint(image=picture.current){const el=canvas.current;if(!image||!el)return;const ctx=el.getContext('2d');if(!ctx)return;
  const scale=Math.max(width/image.width,height/image.height)*zoom,sw=width/scale,sh=height/scale;
  ctx.fillStyle='#111827';ctx.fillRect(0,0,width,height);ctx.drawImage(image,(image.width-sw)*x/100,(image.height-sh)*y/100,sw,sh,0,0,width,height);
 }
 useEffect(()=>paint(),[zoom,x,y,source]);
 function choose(file?:File){if(!file)return;setError('');setNotice('');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024){setError('Choose a JPEG, PNG or WebP image under 12 MB.');return}
  setZoom(1);setX(50);setY(50);picture.current=null;setSource(URL.createObjectURL(file));
 }
 async function upload(){if(!canvas.current||!picture.current||busy)return;setBusy(true);setError('');setNotice('');
  try{let blob:Blob|null=null;for(const quality of [.88,.76,.6,.45]){blob=await new Promise(resolve=>canvas.current!.toBlob(resolve,'image/jpeg',quality));if(blob&&blob.size<=262144)break}
   if(!blob||blob.size>262144)throw Error('This image is too detailed. Try a simpler crop or a smaller image.');
   await spaceRequest('/api/v1/member/media/'+slot,'PUT',blob);await onSaved();setSource('');setNotice(slot==='avatar'?'Profile picture saved.':'Banner saved.');if(input.current)input.current.value='';
  }catch(e){setError(e instanceof Error?e.message:'Image could not be saved.')}finally{setBusy(false)}
 }
 async function remove(){setBusy(true);setError('');try{await spaceRequest('/api/v1/member/media/'+slot,'DELETE');await onSaved();setNotice('Image removed.')}catch(e){setError(e instanceof Error?e.message:'Could not remove image.')}finally{setBusy(false)}}
 return <section className={'ms-image-editor ms-image-'+slot} aria-label={slot==='avatar'?'Edit profile picture':'Edit wall banner'}>
  <div className="ms-section-head"><div><span className="kicker">{slot==='avatar'?'01 / PORTRAIT':'02 / WALL BANNER'}</span><h3>{slot==='avatar'?'A face for your world.':'Set the atmosphere.'}</h3></div></div>
  <p>{slot==='avatar'?'Choose a picture, then adjust its crop.':'A wide image across the top of your wall. Drag the sliders to frame it.'}</p>
  {source?<div className="ms-crop"><canvas ref={canvas} width={width} height={height} aria-label="Image crop preview"/>
   <label>Zoom<input type="range" min="1" max="3" step=".05" value={zoom} onChange={e=>setZoom(Number(e.target.value))} disabled={busy}/></label>
   <label>Horizontal position<input type="range" min="0" max="100" value={x} onChange={e=>setX(Number(e.target.value))} disabled={busy}/></label>
   <label>Vertical position<input type="range" min="0" max="100" value={y} onChange={e=>setY(Number(e.target.value))} disabled={busy}/></label>
   <div className="ms-actions"><button className="ms-primary" type="button" onClick={()=>void upload()} disabled={busy}>{busy?'SAVING…':'SAVE '+(slot==='avatar'?'PICTURE':'BANNER')}</button><button type="button" onClick={()=>setSource('')} disabled={busy}>CANCEL</button></div>
  </div>:version?<img className="ms-current-image" src={'/api/v1/member/media/'+slot} key={version} alt={'Current '+slot}/>:<div className="ms-image-empty" aria-hidden="true">{slot==='avatar'?'◈':'✦ · · · ✦'}</div>}
  <label className="ms-file-button">CHOOSE {slot==='avatar'?'PICTURE':'BANNER'}<input ref={input} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>choose(e.target.files?.[0])}/></label>
  {version&&!source&&<button type="button" onClick={()=>void remove()} disabled={busy}>REMOVE IMAGE</button>}
  <small>JPEG, PNG or WebP · up to 12 MB. Your crop is resized before upload.</small>
  {error&&<p role="alert" className="ms-error">{error}</p>}{notice&&<p role="status">{notice}</p>}
 </section>;
}

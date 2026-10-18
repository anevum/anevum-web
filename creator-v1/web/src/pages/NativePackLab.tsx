import {useEffect,useMemo,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {createNativePack,openNativePack,MAX_PACK_BYTES,
 type PackKind,type PackManifest} from '../lib/anevum-native-pack';
import {getVisibleWorkbenchBlocks,type StudioBlockDocument} from '../lib/studio-blocks';
import './native-pack-lab.css';

type Choice={label:string;to:string};
type Scene={id:string;title:string;text:string;choices:Choice[];background?:string};
type GameDoc={schema:'anevum.game.v1';startScene:string;scenes:Scene[]};
type Track={id:string;title:string;file:string};
type AlbumDoc={schema:'anevum.album.v1';cover?:string;tracks:Track[]};
type SeriesDoc={schema:'anevum.series.v1';poster?:string;episodes:Track[]};
type VisualDoc={schema:'anevum.visual.v1';pages:{image:string;caption:string}[]};
export type PackDocument=GameDoc|AlbumDoc|SeriesDoc|VisualDoc|StudioBlockDocument;
type Opened={manifest:PackManifest;document:PackDocument;assets:Map<string,Uint8Array>;urls:Record<string,string>};
type LocalMedia={file:File;title:string};
const DEMO_SCENES:Scene[]=[
 {id:'arrival',title:'The Observatory',text:'A signal cuts across the quiet void. The observatory doors begin to open.',
  choices:[{label:'Follow the transmission',to:'signal'}]},
 {id:'signal',title:'The First Signal',text:'Nothing ends. It changes form. A new world is waiting beyond the aperture.',
  choices:[{label:'Return to the observatory',to:'arrival'}]}
];
const EXTENSIONS:Record<'album'|'series'|'visual',string[]> ={
 album:['mp3','wav','ogg'],series:['mp4','webm'],visual:['png','jpg','jpeg','webp','gif']
};
const NAMES:Record<PackKind,string>={
 game:'Interactive game',album:'Album / audio',series:'Animation series',
 visual:'Art / gallery',project:'Studio document'
};
const guessTitle=(name:string)=>name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').slice(0,100)||'Untitled';
const ext=(file:File)=>file.name.split('.').at(-1)?.toLowerCase()||'';
const mediaPath=(i:number,file:File)=>'assets/item-'+String(i+1).padStart(2,'0')+'.'+ext(file);
const message=(err:unknown)=>err instanceof Error?err.message:'Unable to read this file.';
function download(filename:string,bytes:Uint8Array){
 const url=URL.createObjectURL(new Blob([Uint8Array.from(bytes)],{type:'application/octet-stream'}));
 const a=window.document.createElement('a');a.href=url;a.download=filename;
 window.document.body.append(a);a.click();a.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),30000);
}
/** A validated, inert, media-only ANEVUM player. No user HTML or executable scripts. */
export function NativePackExperience({kind,document,urls}:{kind:PackKind;document:PackDocument;urls:Record<string,string>}){
 const [sceneId,setSceneId]=useState<string|null>(null);
 useEffect(()=>setSceneId(null),[document,kind]);
 if(kind==='game'){
  const game=document as GameDoc;
  const scene=game.scenes.find(s=>s.id===(sceneId||game.startScene))||game.scenes[0];
  return <article className="np-experience np-game">
   <p className="np-eyebrow">PLAY / DECLARATIVE GAME</p>
   {scene.background&&urls[scene.background]&&<img className="np-cover" src={urls[scene.background]} alt="Scene artwork"/>}
   <h4>{scene.title}</h4><p className="np-story">{scene.text}</p>
   <div className="np-choices">{scene.choices.map((choice,i)=><button type="button" key={i}
    onClick={()=>setSceneId(choice.to)}>{choice.label} <span aria-hidden="true">↗</span></button>)}</div>
   <button type="button" className="np-restart" onClick={()=>setSceneId(null)}>RESTART EXPERIENCE</button>
  </article>;
 }
 if(kind==='album'){
  const d=document as AlbumDoc;
  return <article className="np-experience"><p className="np-eyebrow">LISTEN / ALBUM</p>
   {d.cover&&urls[d.cover]&&<img className="np-cover" src={urls[d.cover]} alt="Album cover"/>}
   {d.tracks.map((t,i)=><div className="np-media-entry" key={t.id}>
    <strong>{String(i+1).padStart(2,'0')} / {t.title}</strong>
    {urls[t.file]?<audio controls preload="none" src={urls[t.file]}/>:<p>Audio not available.</p>}
   </div>)}
  </article>;
 }
 if(kind==='series'){
  const d=document as SeriesDoc;
  return <article className="np-experience"><p className="np-eyebrow">WATCH / EPISODES</p>
   {d.episodes.map((e,i)=><div className="np-media-entry" key={e.id}>
    <strong>EPISODE {String(i+1).padStart(2,'0')} / {e.title}</strong>
    {urls[e.file]?<video controls playsInline preload="metadata" src={urls[e.file]}
     poster={d.poster?urls[d.poster]:undefined}/>:<p>Video not available.</p>}
   </div>)}
  </article>;
 }
 if(kind==='visual'){
  const d=document as VisualDoc;
  return <article className="np-experience"><p className="np-eyebrow">EXPLORE / GALLERY</p>
   {d.pages.map((page,i)=><figure key={i} className="np-gallery">
    {urls[page.image]&&<img src={urls[page.image]} alt={page.caption||'Artwork '+(i+1)} loading="lazy"/>}
    <figcaption>{page.caption||'Artwork '+(i+1)}</figcaption>
   </figure>)}
  </article>;
 }
 const d=document as StudioBlockDocument;
 const visible=getVisibleWorkbenchBlocks(d,sceneId);
 return <article className="np-experience np-project"><p className="np-eyebrow">READ / PRIVATE STUDIO DOCUMENT</p>
  {visible.map(b=>b.type==='divider'?<hr key={b.id}/>:
   b.type==='choice'?<button type="button" key={b.id} disabled={!b.target} onClick={()=>setSceneId(b.target)}>
    {b.text||'Continue'} ↗</button>:
   b.type==='heading'||b.type==='scene'?<h4 key={b.id}>{b.text}</h4>:
   <p key={b.id}>{b.text}</p>)}
  <button type="button" className="np-restart" onClick={()=>setSceneId(null)}>RESTART DOCUMENT</button>
 </article>;
}

/** Folded into signed-in Studio. All pack operations stay local to this browser. */
export function NativePackLab({title,creator,document,onImportDocument,disabled}:{
 title:string;creator:string;document:StudioBlockDocument|null;
 onImportDocument:(value:StudioBlockDocument)=>void;disabled:boolean;
}){
 const [kind,setKind]=useState<PackKind>('game');
 const [scenes,setScenes]=useState<Scene[]>(DEMO_SCENES);
 const [selected,setSelected]=useState('arrival');
 const [startScene,setStartScene]=useState('arrival');
 const [gameImages,setGameImages]=useState<{path:string;file:File}[]>([]);
 const [gameImageUrls,setGameImageUrls]=useState<Record<string,string>>({});
 const liveGame=useMemo<GameDoc>(()=>({schema:'anevum.game.v1',
  startScene:scenes.some(s=>s.id===startScene)?startScene:scenes[0].id,scenes}),[scenes,startScene]);
 const [media,setMedia]=useState<LocalMedia[]>([]);
 const [mediaUrls,setMediaUrls]=useState<Record<string,string>>({});
 const [opened,setOpened]=useState<Opened|null>(null);
 const [messageText,setMessageText]=useState('');
 const [busy,setBusy]=useState(false);
 const importSeq=useRef(0);
 const ownedUrls=useRef<string[]>([]);
 const [experienceKey,setExperienceKey]=useState(0);
 useEffect(()=>{
  const urls:Record<string,string>={};
  media.forEach((entry,i)=>{urls[mediaPath(i,entry.file)]=URL.createObjectURL(entry.file);});
  setMediaUrls(urls);
  return()=>Object.values(urls).forEach(url=>URL.revokeObjectURL(url));
 },[media]);
 useEffect(()=>{
  const urls:Record<string,string>={};
  gameImages.forEach(entry=>{urls[entry.path]=URL.createObjectURL(entry.file);});
  setGameImageUrls(urls);
  return()=>Object.values(urls).forEach(url=>URL.revokeObjectURL(url));
 },[gameImages]);
 useEffect(()=>()=>{
  importSeq.current++;
  ownedUrls.current.forEach(url=>URL.revokeObjectURL(url));
 },[]);
 function switchKind(next:PackKind){
  if(busy)return;
  if(media.length&&kind!==next&&!window.confirm('Switching formats discards your local media list unless exported. Continue?'))return;
  ownedUrls.current.forEach(url=>URL.revokeObjectURL(url));ownedUrls.current=[];
  setKind(next);setMedia([]);setOpened(null);setMessageText('');setExperienceKey(n=>n+1);
 }
 function updateScene(change:Partial<Scene>){
  setScenes(previous=>previous.map(s=>s.id===selected?{...s,...change}:s));
 }
 function addScene(){
  if(scenes.length>=64)return setMessageText('The local game editor supports up to 64 scenes.');
  let id='scene-'+crypto.randomUUID().slice(0,8);
  while(scenes.some(s=>s.id===id))id='scene-'+crypto.randomUUID().slice(0,8);
  setScenes(v=>[...v,{id,title:'New scene',text:'Describe what happens next.',choices:[]}]);
  setSelected(id);setMessageText('');
 }
 function removeScene(){
  if(scenes.length<=1)return;
  const others=scenes.filter(s=>s.id!==selected);
  setScenes(others.map(s=>({...s,choices:s.choices.filter(c=>c.to!==selected)})));
  if(startScene===selected)setStartScene(others[0].id);
  setSelected(others[0].id);
 }
 function addChoice(){
  const target=scenes.find(s=>s.id!==selected);
  if(!target)return setMessageText('Create another scene before adding a choice.');
  const current=scenes.find(s=>s.id===selected)!;
  if(current.choices.length>=8)return setMessageText('A scene supports up to eight choices.');
  updateScene({choices:[...current.choices,{label:'Continue',to:target.id}]});
 }
 function setBackground(value:string){
  setScenes(previous=>previous.map(scene=>{
   if(scene.id!==selected)return scene;
   if(value)return {...scene,background:value};
   const {background:_removed,...withoutBackground}=scene;
   return withoutBackground;
  }));
 }
 function addBackgrounds(list:FileList|null){
  if(!list)return;
  const incoming=Array.from(list);
  if(incoming.some(file=>!['png','jpg','jpeg','webp','gif'].includes(ext(file))||!file.size)){
   setMessageText('Choose PNG, JPG, WebP or GIF background art.');return;
  }
  if(gameImages.length+incoming.length>16||
     incoming.reduce((sum,file)=>sum+file.size,gameImages.reduce((sum,m)=>sum+m.file.size,0))>MAX_PACK_BYTES-65536){
   setMessageText('Up to 16 background images and 20 MiB total are supported.');return;
  }
  setGameImages(previous=>[...previous,...incoming.map(file=>({
   path:'assets/background-'+crypto.randomUUID().slice(0,8)+'.'+ext(file),file
  }))]);
  setMessageText('');
 }
 function removeBackground(path:string){
  setGameImages(previous=>previous.filter(entry=>entry.path!==path));
  setScenes(previous=>previous.map(scene=>{
   if(scene.background!==path)return scene;
   const {background:_removed,...withoutBackground}=scene;
   return withoutBackground;
  }));
 }
 function pickMedia(list:FileList|null){
  if(!list||kind==='game'||kind==='project')return;
  const allowed=EXTENSIONS[kind];
  const incoming=Array.from(list).map(file=>({file,title:guessTitle(file.name)}));
  if(incoming.some(entry=>!allowed.includes(ext(entry.file))||!entry.file.size))
   return setMessageText('Choose supported local media: '+allowed.join(', ')+'.');
  const all=[...media,...incoming];
  if(all.length>31||all.reduce((sum,entry)=>sum+entry.file.size,0)>MAX_PACK_BYTES-65536)
   return setMessageText('Local packages support at most 31 media items and 20 MiB total.');
  setMedia(all);setMessageText('');
 }
 function currentDocument():PackDocument{
  if(kind==='game')return liveGame;
  if(kind==='project'){
   if(!document)throw Error('Convert your notes to Workbench blocks before exporting a .anvp document.');
   return document;
  }
  if(kind==='album')return {schema:'anevum.album.v1',tracks:media.map((m,i)=>({
   id:'track-'+(i+1),title:m.title,file:mediaPath(i,m.file)}))};
  if(kind==='series')return {schema:'anevum.series.v1',episodes:media.map((m,i)=>({
   id:'episode-'+(i+1),title:m.title,file:mediaPath(i,m.file)}))};
  return {schema:'anevum.visual.v1',pages:media.map((m,i)=>({
   image:mediaPath(i,m.file),caption:m.title}))};
 }
 const scene=scenes.find(s=>s.id===selected)||scenes[0];
 async function exportPack(){
  if(busy)return;
  setBusy(true);setMessageText('');
  try{
   const assets:Record<string,Uint8Array>={};
   for(let i=0;i<media.length;i++)
    assets[mediaPath(i,media[i].file)]=new Uint8Array(await media[i].file.arrayBuffer());
   if(kind==='game')for(const image of gameImages)
    assets[image.path]=new Uint8Array(await image.file.arrayBuffer());
   const pkg=await createNativePack({kind,title:title.trim()||'Untitled creation',
    creator:creator.trim()||'Creator',version:'0.1.0',document:currentDocument(),assets});
   download(pkg.filename,pkg.bytes);
   setMessageText('Exported '+pkg.filename+' to your device. This did not save or publish a Studio revision.');
  }catch(error){setMessageText(message(error));}
  finally{setBusy(false);}
 }
 async function importPack(file:File|undefined){
  if(!file)return;
  const seq=++importSeq.current;setBusy(true);setMessageText('');
  try{
   if(file.size>MAX_PACK_BYTES)throw Error('This native package exceeds the 20 MiB local limit.');
   const pack=await openNativePack(file.name,new Uint8Array(await file.arrayBuffer()));
   if(seq!==importSeq.current)return;
   const urls:Record<string,string>={};
   for(const [name,data] of pack.assets){
    const mime=pack.manifest.files.find(f=>f.path===name)?.mime||'application/octet-stream';
    urls[name]=URL.createObjectURL(new Blob([Uint8Array.from(data)],{type:mime}));
   }
   ownedUrls.current.forEach(url=>URL.revokeObjectURL(url));
   ownedUrls.current=Object.values(urls);
   setOpened({manifest:pack.manifest,document:pack.document as PackDocument,assets:pack.assets,urls});
   setExperienceKey(n=>n+1);
   setMessageText('Validated '+file.name+'. Preview is local only; no upload or publishing occurred.');
  }catch(error){if(seq===importSeq.current)setMessageText(message(error));}
  finally{if(seq===importSeq.current)setBusy(false);}
 }
 function resumeGame(){
  if(!opened||opened.manifest.kind!=='game'||busy)return;
  if(!window.confirm('Replace locally edited game scenes with this import? Export your existing work first.'))return;
  const game=opened.document as GameDoc;
  const images=[...opened.assets].map(([path,bytes])=>{
   const mime=opened.manifest.files.find(f=>f.path===path)?.mime||'image/png';
   return {path,file:new File([Uint8Array.from(bytes)],path.split('/').at(-1)||'background.png',{type:mime})};
  });
  if(images.some(img=>!img.file.type.startsWith('image/'))){
   setMessageText('This pack cannot be reopened as an editable game.');return;
  }
  setScenes(game.scenes.map(scene=>({...scene,choices:scene.choices.map(c=>({...c}))})));
  setStartScene(game.startScene);setSelected(game.startScene);
  setGameImages(images);setKind('game');setMedia([]);
  ownedUrls.current.forEach(url=>URL.revokeObjectURL(url));ownedUrls.current=[];
  setOpened(null);setMessageText('Loaded .anvg into the game editor. Export a new file to keep your changes.');
 }
 function restoreDocument(){
  if(!opened||opened.manifest.kind!=='project'||disabled)return;
  if(!window.confirm('Replace your current UNSAVED canvas with this imported document? The original is not automatically backed up.'))return;
  onImportDocument(opened.document as StudioBlockDocument);
  setMessageText('Imported into the unsaved Studio canvas. Use Save Changes to persist this revision.');
 }
 return <details className="np-lab" aria-label="Native file pack laboratory">
  <summary><span className="np-emblem" aria-hidden="true">◉</span><span>
   <strong>NATIVE PACK LAB</strong><small>BUILD / EXPORT / OPEN / EXPERIENCE — LOCAL ONLY</small>
  </span><span aria-hidden="true">+</span></summary>
  <div className="np-content">
   <p className="np-info">Turn creations into ANEVUM files. Packages stay in your browser until downloaded.
    Nothing here uploads media, runs user scripts, awards XP or publishes projects.</p>
   <p className="np-small">Want a larger listening or play surface? <Link to="/open">OPEN THE STANDALONE LOCAL PLAYER ↗</Link></p>
   <div className="np-two-col">
    <section className="np-console" aria-label="Native pack creator">
     <p className="np-eyebrow">01 / CREATE A NATIVE FILE</p>
     <label className="np-label">CREATION FORMAT
      <select value={kind} disabled={busy} onChange={e=>switchKind(e.target.value as PackKind)}>
       {(Object.keys(NAMES) as PackKind[]).map(k=><option key={k} value={k}>
        {NAMES[k]+' / .'+({game:'anvg',album:'anva',series:'anvs',visual:'anvw',project:'anvp'}[k])}
       </option>)}
      </select>
     </label>
     {kind==='game'&&<div className="np-composer">
      <label className="np-label">GAME BEGINS AT
       <select value={startScene} onChange={e=>setStartScene(e.target.value)}>
        {scenes.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
       </select>
      </label>
      <div className="np-scene-toolbar"><label className="np-label">EDIT SCENE
       <select value={selected} onChange={e=>setSelected(e.target.value)}>
        {scenes.map(s=><option value={s.id} key={s.id}>{s.title}</option>)}
       </select></label>
       <button type="button" onClick={addScene}>+ SCENE</button>
       <button type="button" onClick={removeScene} disabled={scenes.length<=1}>REMOVE</button>
      </div>
      <label className="np-label">SCENE TITLE
       <input value={scene.title} maxLength={120} onChange={e=>updateScene({title:e.target.value})}/>
      </label>
      <label className="np-label">SCENE DESCRIPTION
       <textarea rows={4} value={scene.text} maxLength={2500} onChange={e=>updateScene({text:e.target.value})}/>
      </label>
      <label className="np-label">SCENE BACKGROUND
       <select value={scene.background||''} onChange={e=>setBackground(e.target.value)}>
        <option value="">No background image</option>
        {gameImages.map(image=><option key={image.path} value={image.path}>{image.file.name}</option>)}
       </select>
      </label>
      <label className="np-label">ADD BACKGROUND ART (OPTIONAL)
       <input type="file" multiple accept=".png,.jpg,.jpeg,.webp,.gif"
        onChange={e=>{addBackgrounds(e.target.files);e.currentTarget.value='';}}/>
      </label>
      {gameImages.map(image=><div className="np-media-edit" key={image.path}>
       <span>{image.file.name}</span>
       <button type="button" aria-label={'Remove background '+image.file.name}
        onClick={()=>removeBackground(image.path)}>REMOVE IMAGE</button>
      </div>)}
      <div className="np-scene-toolbar"><strong>PLAYER CHOICES</strong><button type="button" onClick={addChoice}>+ CHOICE</button></div>
      {scene.choices.map((choice,i)=><div className="np-choice-editor" key={i}>
       <input aria-label={'Choice '+(i+1)+' label'} maxLength={80} value={choice.label}
        onChange={e=>updateScene({choices:scene.choices.map((c,j)=>i===j?{...c,label:e.target.value}:c)})}/>
       <select aria-label={'Choice '+(i+1)+' destination'} value={choice.to}
        onChange={e=>updateScene({choices:scene.choices.map((c,j)=>i===j?{...c,to:e.target.value}:c)})}>
        {scenes.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}
       </select>
       <button type="button" aria-label={'Remove choice '+(i+1)}
        onClick={()=>updateScene({choices:scene.choices.filter((_,j)=>j!==i)})}>×</button>
      </div>)}
     </div>}
     {(kind==='album'||kind==='series'||kind==='visual')&&<div className="np-composer">
      <label className="np-label">ADD ORIGINAL MEDIA FROM DEVICE
       <input type="file" multiple accept={EXTENSIONS[kind].map(e=>'.'+e).join(',')}
        onChange={e=>{pickMedia(e.target.files);e.currentTarget.value='';}}/>
      </label>
      <p className="np-small">Media is assembled locally into the downloaded package. 20 MiB maximum in this pilot.</p>
      {media.map((entry,i)=><div className="np-media-edit" key={i}>
       <input value={entry.title} maxLength={100} aria-label={'Title of media '+(i+1)}
        onChange={e=>setMedia(v=>v.map((m,j)=>i===j?{...m,title:e.target.value}:m))}/>
       <span>{entry.file.name}</span>
       <button type="button" aria-label={'Remove media '+(i+1)}
        onClick={()=>setMedia(v=>v.filter((_,j)=>i!==j))}>×</button>
      </div>)}
     </div>}
     {kind==='project'&&<p className="np-small">{document?'Exports your current private Workbench blocks as an':
      'Convert your notes into Workbench pieces first to export an'}
      editable .anvp file. The export includes only this document, not account records or server attachments.</p>}
     <button type="button" className="np-primary" disabled={busy}
      onClick={()=>void exportPack()}>{busy?'PROCESSING…':'EXPORT .'+
       ({game:'ANVG',album:'ANVA',series:'ANVS',visual:'ANVW',project:'ANVP'}[kind])+' FILE →'}</button>
    </section>
    <section className="np-console" aria-label="Native pack player">
     <p className="np-eyebrow">02 / OPEN IN THE ANEVUM PLAYER</p>
     <label className="np-label">OPEN EXISTING ANEVUM FILE
      <input type="file" accept=".anvg,.anva,.anvs,.anvw,.anvp" disabled={busy}
       onChange={e=>{void importPack(e.target.files?.[0]);e.currentTarget.value='';}}/>
     </label>
     {opened?<div className="np-opened">
      <p className="np-eyebrow">{opened.manifest.kind.toUpperCase()} / V{opened.manifest.version} / LOCAL</p>
      <h3>{opened.manifest.title}</h3>
      <p>Created by {opened.manifest.creator}</p>
      <NativePackExperience key={experienceKey} kind={opened.manifest.kind}
       document={opened.document} urls={opened.urls}/>
      {opened.manifest.kind==='game'&&<button type="button" className="np-secondary"
        onClick={resumeGame}>CONTINUE EDITING THIS GAME →</button>}
       {opened.manifest.kind==='project'&&<button type="button" className="np-secondary"
       disabled={disabled} onClick={restoreDocument}>IMPORT INTO UNSAVED CANVAS →</button>}
     </div>:<div className="np-placeholder"><span aria-hidden="true">◇</span>
      <p>Select an ANEVUM file to inspect its contents and experience it in the appropriate player.</p></div>}
    </section>
   </div>
   {kind==='game'&&<div className="np-playtest"><p className="np-eyebrow">03 / LIVE GAME TEST</p>
    <NativePackExperience key={experienceKey} kind="game" document={liveGame}
     urls={gameImageUrls}/></div>}
   {(kind==='album'||kind==='series'||kind==='visual')&&media.length>0&&<div className="np-playtest">
    <p className="np-eyebrow">03 / LOCAL MEDIA PREVIEW</p>
    <NativePackExperience kind={kind} document={currentDocument()} urls={mediaUrls}/>
   </div>}
   {messageText&&<p role="status" className="np-message">{messageText}</p>}
   <p className="np-disclaimer">REVIEW BUILD · Data-only formats · No code execution · No
    storage service · No signed public releases. Saved Studio revisions remain a separate action.</p>
  </div>
 </details>;
}
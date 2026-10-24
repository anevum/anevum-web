import {useEffect,useMemo,useState} from 'react';
import {block,decode,encode,starter,visible,remove,TYPES,LIMITS,PREFIX,
 type Document,type BlockType} from '../../../workbench-alpha/document.mjs';
import './studio-scene-composer-v112.css';

export const studioVisualScenesEnabled=import.meta.env.VITE_CREATOR_VISUAL_SCENE_V112==='true';
type Props={
 raw:string;
 fileName:string;
 resetToken:string;
 readOnly:boolean;
 onChange:(next:string)=>void;
 /** Safe, local-only selection from Project Doctor. */
 jumpTo?:{blockId:string;requestId:number}|null;
};

/**
 * A visual projection of the existing ANEVUM_BLOCKS_V1 document contract.
 * No alternative scene schema, arbitrary HTML, runtime execution, publication
 * or automatic persistence. The caller owns saving through the V111 file API.
 */
export function StudioSceneComposerV112({raw,fileName,resetToken,readOnly,onChange,jumpTo}:Props){
 const doc=useMemo(()=>decode(raw),[raw]);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [previewSceneId,setPreviewSceneId]=useState<string|null>(null);
 const [mode,setMode]=useState<'compose'|'preview'>('compose');
 const [addType,setAddType]=useState<BlockType>('paragraph');
 const [undo,setUndo]=useState<string[]>([]);
 const [redo,setRedo]=useState<string[]>([]);
 const [error,setError]=useState('');
 useEffect(()=>{setUndo([]);setRedo([]);setError('');setSelectedId(null);setPreviewSceneId(null);setMode('compose');},[resetToken]);
 useEffect(()=>{
  if(!doc){setSelectedId(null);setPreviewSceneId(null);return;}
  setSelectedId(old=>old&&doc.blocks.some(b=>b.id===old)?old:doc.blocks[0]?.id||null);
  setPreviewSceneId(old=>old&&doc.blocks.some(b=>b.type==='scene'&&b.id===old)?old:null);
 },[doc]);
 useEffect(()=>{
  if(!jumpTo)return;
  // Deliberately respond only to a new navigation request. Ordinary text edits
  // must not steal the creator's current selection or reset undo/redo.
  if(doc?.blocks.some(item=>item.id===jumpTo.blockId)){
   setSelectedId(jumpTo.blockId);
   setMode('compose');
  }
 },[jumpTo?.requestId]);
 const focused=doc?.blocks.find(b=>b.id===selectedId)||null;
 const sceneList=doc?.blocks.filter(b=>b.type==='scene')||[];
 const currentScene=previewSceneId&&sceneList.some(b=>b.id===previewSceneId)?
  previewSceneId:(sceneList[0]?.id||null);
 const previewBlocks=doc?visible(doc,currentScene):[];
 const canInitialize=raw.trim()===''&&fileName.toLowerCase().endsWith('.anevum');

 function commit(next:Document){
  if(readOnly||!doc)return;
  try{
   const result=encode(next);
   if(result===raw)return;
   setUndo(old=>[...old,raw].slice(-20));setRedo([]);
   setError('');onChange(result);
  }catch(e){setError(e instanceof Error?e.message:'Invalid visual scene update. Existing source preserved.');}
 }
 function initialize(){
  if(readOnly||!canInitialize)return;
  try{
   const result=encode(starter());
   setUndo(old=>[...old,raw].slice(-20));setRedo([]);setError('');onChange(result);
  }catch(e){setError(e instanceof Error?e.message:'Could not initialize the scene.');}
 }
 function changeText(text:string){
  if(!doc||!focused)return;
  commit({...doc,blocks:doc.blocks.map(item=>item.id===focused.id?{...item,text}:item)});
 }
 function updateTarget(target:string){
  if(!doc||!focused||focused.type!=='choice')return;
  commit({...doc,blocks:doc.blocks.map(item=>item.id===focused.id?{...item,target:target||null}:item)});
 }
 function addBlock(){
  if(!doc||readOnly||doc.blocks.length>=LIMITS.blocks)return;
  try{
   const item=block(addType,'');
   const index=doc.blocks.findIndex(candidate=>candidate.id===selectedId);
   const at=index<0?doc.blocks.length:index+1;
   const updated={...doc,blocks:[...doc.blocks.slice(0,at),item,...doc.blocks.slice(at)]};
   commit(updated);setSelectedId(item.id);
  }catch(e){setError(e instanceof Error?e.message:'This block could not be added.');}
 }
 function discardBlock(){
  if(!doc||!focused||readOnly)return;
  if(!window.confirm('Remove this '+focused.type+' block from the unsaved scene? Referencing choices will be unlinked.'))return;
  try{commit(remove(doc,focused.id));setSelectedId(null);}
  catch(e){setError(e instanceof Error?e.message:'This block cannot be removed.');}
 }
 function shift(direction:-1|1){
  if(!doc||!focused||readOnly)return;
  const from=doc.blocks.findIndex(b=>b.id===focused.id),to=from+direction;
  if(from<0||to<0||to>=doc.blocks.length)return;
  const blocks=[...doc.blocks];[blocks[from],blocks[to]]=[blocks[to],blocks[from]];
  commit({...doc,blocks});
 }
 function undoAction(){
  if(readOnly||undo.length===0)return;
  const prior=undo[undo.length-1];setUndo(old=>old.slice(0,-1));setRedo(old=>[...old,raw].slice(-20));setError('');onChange(prior);
 }
 function redoAction(){
  if(readOnly||redo.length===0)return;
  const next=redo[redo.length-1];setRedo(old=>old.slice(0,-1));setUndo(old=>[...old,raw].slice(-20));setError('');onChange(next);
 }
 if(!doc){
  return <section className="csx-root csx-empty" aria-label="Visual scene editor">
   <p className="csw-eyebrow">ANEVUM BLOCKS V1 / SAFE VISUAL EDITOR</p>
   <h3>{canInitialize?'Start a branching scene.':'Visual document unavailable.'}</h3>
   <p>{canInitialize?
    'Initialize a small two-scene document that can be edited and playtested here. Your private file will not be saved until you choose Save revision.':
    raw.startsWith(PREFIX)?
     'The existing source is not a valid ANEVUM_BLOCKS_V1 document. Switch to Source to repair or export the original text; nothing was converted.':
     'This source file is not an ANEVUM_BLOCKS_V1 document. Its original text has been preserved.'}</p>
   {canInitialize&&<button type="button" className="csw-action csw-strong" disabled={readOnly} onClick={initialize}>
    Initialize two-scene document
   </button>}
   {error&&<p className="csf-error" role="alert">{error}</p>}
  </section>;
 }
 return <section className="csx-root" aria-label="Visual scene editor" data-studio-scene-composer="v112">
  <header className="csx-top">
   <div><p className="csw-eyebrow">ANEVUM BLOCKS V1 / SCENE COMPOSER</p>
    <h3>Interactive scene document</h3>
    <p className="csx-muted">{doc.blocks.length}/{LIMITS.blocks} blocks · {sceneList.length} scenes · Private unsaved visual edits</p>
   </div>
   <div className="csx-actions">
    <button type="button" aria-pressed={mode==='compose'} onClick={()=>setMode('compose')}>Compose</button>
    <button type="button" aria-pressed={mode==='preview'} onClick={()=>setMode('preview')}>Playtest</button>
    <button type="button" disabled={readOnly||undo.length===0} onClick={undoAction}>Undo</button>
    <button type="button" disabled={readOnly||redo.length===0} onClick={redoAction}>Redo</button>
   </div>
  </header>
  {error&&<p className="csf-error" role="alert">{error}</p>}
  {readOnly&&<p className="csx-muted" role="status">This project is read-only. Preview remains available; changes are disabled.</p>}
  {mode==='compose'?<div className="csx-layout">
   <aside className="csx-block-tree" aria-label="Scene blocks">
    <h4>Scenes and blocks</h4>
    <ol>{doc.blocks.map((item,index)=><li key={item.id}>
     <button type="button" className={item.id===selectedId?'is-selected':''}
      aria-current={item.id===selectedId?'true':undefined} onClick={()=>setSelectedId(item.id)}>
      <span>{index+1}. {item.type}</span>
      <strong>{item.text.slice(0,64)||'(empty block)'}</strong>
     </button>
    </li>)}</ol>
    <div className="csx-add">
     <label htmlFor="csx-add-type">New block</label>
     <select id="csx-add-type" value={addType} disabled={readOnly} onChange={e=>setAddType(e.target.value as BlockType)}>
      {TYPES.map(type=><option key={type} value={type}>{type}</option>)}
     </select>
     <button type="button" disabled={readOnly||doc.blocks.length>=LIMITS.blocks} onClick={addBlock}>Add after selection</button>
    </div>
   </aside>
   <div className="csx-inspector" aria-label="Scene block Inspector">
    {!focused?<p className="csx-muted">Select a block to edit its content and interactions.</p>:<>
     <p className="csw-eyebrow">BLOCK INSPECTOR / {focused.type.toUpperCase()}</p>
     <h4>{focused.type==='scene'?'Scene definition':focused.type==='choice'?'Interactive choice':'Content block'}</h4>
     <label htmlFor={'csx-text-'+focused.id}>Block text</label>
     <textarea id={'csx-text-'+focused.id} rows={7} value={focused.text} maxLength={LIMITS.text}
      disabled={readOnly||focused.type==='divider'} onChange={e=>changeText(e.target.value)}/>
     <p className="csx-muted">{focused.text.length}/{LIMITS.text} characters</p>
     {focused.type==='choice'&&<>
      <label htmlFor={'csx-choice-target-'+focused.id}>Destination scene</label>
      <select id={'csx-choice-target-'+focused.id} value={focused.target||''} disabled={readOnly} onChange={e=>updateTarget(e.target.value)}>
       <option value="">Not connected</option>
       {sceneList.map(scene=><option key={scene.id} value={scene.id}>{scene.text||'(untitled scene)'}</option>)}
      </select>
      <p className="csx-muted">Only existing scene IDs are valid destinations.</p>
     </>}
     <div className="csx-actions csx-block-actions">
      <button type="button" disabled={readOnly||doc.blocks[0].id===focused.id} onClick={()=>shift(-1)}>Move up</button>
      <button type="button" disabled={readOnly||doc.blocks[doc.blocks.length-1].id===focused.id} onClick={()=>shift(1)}>Move down</button>
      <button type="button" className="csx-danger" disabled={readOnly} onClick={discardBlock}>Remove block</button>
     </div>
    </>}
   </div>
  </div>:<div className="csx-preview" aria-label="Private branching-scene playtest">
   <p className="csw-eyebrow">ISOLATED TEXT PREVIEW / NO CODE EXECUTION</p>
   <div className="csx-preview-nav">
    <label htmlFor="csx-preview-scene">Current scene</label>
    <select id="csx-preview-scene" value={currentScene||''} onChange={e=>setPreviewSceneId(e.target.value||null)}>
     {sceneList.length===0&&<option value="">No scenes</option>}
     {sceneList.map(scene=><option key={scene.id} value={scene.id}>{scene.text||'(untitled scene)'}</option>)}
    </select>
    <button type="button" onClick={()=>setPreviewSceneId(null)} disabled={!sceneList.length}>Restart</button>
   </div>
   <div className="csx-preview-contents">
    {previewBlocks.length===0&&<p>No blocks are available in this scene.</p>}
    {previewBlocks.map(item=>item.type==='choice'?
     <button type="button" key={item.id} className="csx-preview-choice"
      disabled={!item.target} onClick={()=>setPreviewSceneId(item.target)}>
      {item.text||'Continue'} {item.target?'→':'· Not connected'}
     </button>:
     item.type==='divider'?<hr key={item.id}/>:
     item.type==='scene'||item.type==='heading'?<h4 key={item.id}>{item.text}</h4>:
     <p key={item.id}>{item.text}</p>)}
   </div>
   <p className="csx-muted">This is a text-only preview of authorized source. It does not run scripts or publish the project.</p>
  </div>}
  <footer className="csx-foot">Visual changes update the local source buffer. Use the Studio Save revision button to persist them.</footer>
 </section>;
}

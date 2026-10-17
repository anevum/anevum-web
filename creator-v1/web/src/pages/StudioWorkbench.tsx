import {useEffect,useState} from 'react';
import {
 BLOCK_TYPES,MAX_BLOCKS,BLOCK_PREFIX,decodeStudioBlockDocument,encodeStudioBlockDocument,
 isStudioBlockDescription,newStudioBlock,createStudioBlockDocumentFromNotes,
 moveStudioBlock,removeStudioBlock,getVisibleWorkbenchBlocks,
 type StudioBlock,type StudioBlockDocument,type StudioBlockType
} from '../lib/studio-blocks';
import './studio-workbench.css';

const TYPE_NAMES:Record<StudioBlockType,string>={
 heading:'Heading',paragraph:'Text',quote:'Quotation',divider:'Section break',
 scene:'Story scene',choice:'Reader choice',caption:'Art caption',credits:'Creator credits'
};
const TYPE_HINTS:Record<StudioBlockType,string>={
 heading:'An introduction or chapter title.',
 paragraph:'A moment, idea, paragraph or description.',
 quote:'An emphasized quote or reflection.',
 divider:'Separate chapters or sections.',
 scene:'A location or moment readers can navigate to.',
 choice:'A decision that moves to a chosen scene.',
 caption:'Label a future artwork or describe a visual piece.',
 credits:'Name your contributors and their roles.'
};
const NARRATIVE=new Set<StudioBlockType>(['scene','choice']);
const MAX_TEXT=2500;
function PreviewBlock({block,onChoice,enabled}:{block:StudioBlock;onChoice:(id:string)=>void;enabled:boolean}){
 if(block.type==='heading')return <h3>{block.text||'Untitled heading'}</h3>;
 if(block.type==='paragraph')return <p>{block.text||'Add the next part of your creation.'}</p>;
 if(block.type==='quote')return <blockquote>{block.text||'Your quotation appears here.'}</blockquote>;
 if(block.type==='divider')return <hr/>;
 if(block.type==='scene')return <h3 className="wb-scene-heading">{block.text||'Untitled scene'}</h3>;
 if(block.type==='choice')return <button type="button" className="wb-choice"
  disabled={!enabled||!block.target} onClick={()=>{if(block.target)onChoice(block.target);}}>
  {block.text||'Choose your path'} <span aria-hidden="true">↗</span></button>;
 if(block.type==='caption')return <figure className="wb-gallery-caption">
  <div aria-hidden="true" className="wb-gallery-placeholder">◌</div>
  <figcaption>{block.text||'Describe a future image or visual piece.'}</figcaption>
 </figure>;
 if(block.type==='credits')return <aside className="wb-credits"><span>CREATOR CREDITS</span>
  <p>{block.text||'List contributors and their work.'}</p>
 </aside>;
 return null;
}
export function StudioWorkbench({value,onChange,disabled}:{
 value:string;onChange:(value:string)=>void;disabled:boolean;
}){
 const document=decodeStudioBlockDocument(value);
 const encoded=isStudioBlockDescription(value);
 const [mode,setMode]=useState<'edit'|'preview'>('edit');
 const [newType,setNewType]=useState<StudioBlockType>('paragraph');
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [scene,setScene]=useState<string|null>(null);
 const scenes=document?.blocks.filter(b=>b.type==='scene')||[];
 useEffect(()=>{
  if(scene!==null&&(!document||!scenes.some(x=>x.id===scene)))setScene(null);
 },[scene,value]);
 function change(next:StudioBlockDocument){
  try{
   const encoded=encodeStudioBlockDocument(next);
   onChange(encoded);setError('');setNotice('Workbench changed. Save the private revision below.');
  }catch(e){setError(e instanceof Error?e.message:'Workbench is unavailable. Your draft has not changed.');}
 }
 function makeWorkbench(){
  try{
   const doc=createStudioBlockDocumentFromNotes(value);
   change(doc);
   setMode('edit');
  }catch(e){setError(e instanceof Error?e.message:'Unable to convert notes without data loss.');}
 }
 if(!document){
  if(encoded)return <section className="wb-root wb-invalid" aria-label="Workbench document recovery">
   <span className="st-kicker">VISUAL WORKBENCH / READ-ONLY RECOVERY</span>
   <h3>THIS VERSION NEEDS RECOVERY.</h3>
   <p>The saved block document could not be verified. It has not been changed. Preserve a copy before making any edits.</p>
   <details><summary>Show exact stored project data</summary>
    <textarea readOnly value={value} rows={6} aria-label="Stored Workbench data for recovery"/></details>
  </section>;
  return <section className="wb-root wb-intro" aria-label="Creative notes or Workbench">
   <div className="wb-intro-head">
    <div><span className="st-kicker">YOUR PRIVATE NOTES / V054</span>
     <h3>IDEAS BECOME EXPERIENCES.</h3>
     <p>Keep writing in notes, or transform this text into movable sections. You will be able to preview the result without publishing it.</p></div>
    <button type="button" className="wb-convert" disabled={disabled}
     onClick={makeWorkbench}>OPEN VISUAL WORKBENCH ↗</button>
   </div>
   <label className="wb-notes-label" htmlFor="wb-existing-notes">WHAT ARE YOU CREATING?</label>
   <textarea id="wb-existing-notes" rows={7} maxLength={8000} disabled={disabled} value={value}
    placeholder="Describe the work, draft your story, outline a game, or record ideas."
    onChange={e=>{onChange(e.target.value);setError('');}}/>
   <p className="wb-help">Conversion is optional and does not upload media or create a public release. Content over 2,500 characters should be shortened or separated first.</p>
   {error&&<p className="wb-error" role="alert">{error}</p>}
  </section>;
 }
 const workDocument:StudioBlockDocument=document;
 const rows=workDocument.blocks;
 const present=getVisibleWorkbenchBlocks(document,scene);
 function updateBlock(id:string,field:'type'|'text'|'target',newValue:string){
  const next=workDocument.blocks.map(b=>{
   if(b.id!==id)return b;
   if(field==='type'){
    const type=newValue as StudioBlockType;
    return {id:b.id,type,text:type==='divider'?'':b.text,target:null};
   }
   return {...b,[field]:field==='target'?(newValue||null):newValue};
  });
  change({...workDocument,blocks:next});
 }
 function addBlock(){
  if(rows.length>=MAX_BLOCKS){setError('Maximum of '+MAX_BLOCKS+' sections reached.');return;}
  change({...workDocument,blocks:[...rows,newStudioBlock(newType)]});
 }
 function move(id:string,delta:-1|1){change(moveStudioBlock(workDocument,id,delta));}
 function remove(id:string){change(removeStudioBlock(workDocument,id));}
 function resetStory(){setScene(null);}
 return <section className="wb-root wb-builder" aria-label="Visual creative Workbench">
  <header className="wb-head">
   <div>
    <span className="st-kicker">V054 / SAFE VISUAL WORKBENCH</span>
    <h3>BUILD YOUR CREATION.</h3>
    <p>Compose writing, visual captions, scenes and choices. Everything remains private until a separate reviewed release is approved.</p>
   </div>
   <div className="wb-switch" role="group" aria-label="Workbench mode">
    <button type="button" aria-pressed={mode==='edit'} onClick={()=>setMode('edit')}>BUILD</button>
    <button type="button" aria-pressed={mode==='preview'} onClick={()=>setMode('preview')}>PREVIEW</button>
   </div>
  </header>
  <div className="wb-progress"><span>{rows.length} / {MAX_BLOCKS} SECTIONS</span>
   <span>{value.length} / 8,000 CHARACTERS</span></div>
  <p className="wb-help">Your changes are not automatically saved. Use <strong>SAVE PRIVATE CHANGES</strong> below after editing.</p>
  {error&&<p className="wb-error" role="alert">{error}</p>}
  {notice&&<p className="wb-notice" role="status">{notice}</p>}
  {mode==='edit'?<div className="wb-edit" aria-label="Reorderable creation sections">
   {rows.length===0&&<p className="wb-empty">Add a text section or a scene to begin your creation.</p>}
   {rows.map((b,index)=><article className="wb-block" key={b.id} aria-label={'Section '+(index+1)}>
    <div className="wb-block-top">
     <span className="wb-block-number">SECTION {String(index+1).padStart(2,'0')}</span>
     <div className="wb-block-actions">
      <button type="button" aria-label={'Move section '+(index+1)+' up'} disabled={disabled||index===0}
       onClick={()=>move(b.id,-1)}>↑</button>
      <button type="button" aria-label={'Move section '+(index+1)+' down'} disabled={disabled||index===rows.length-1}
       onClick={()=>move(b.id,1)}>↓</button>
      <button type="button" aria-label={'Remove section '+(index+1)} disabled={disabled}
       onClick={()=>remove(b.id)}>REMOVE</button>
     </div>
    </div>
    <label className="wb-field"><span>SECTION TYPE</span>
     <select value={b.type} disabled={disabled} onChange={e=>updateBlock(b.id,'type',e.target.value)}>
      {BLOCK_TYPES.map(type=><option value={type} key={type}>{TYPE_NAMES[type]}</option>)}
     </select>
    </label>
    {b.type!=='divider'&&<label className="wb-field"><span>{TYPE_NAMES[b.type].toUpperCase()}</span>
     <textarea value={b.text} rows={b.type==='paragraph'?4:2} maxLength={MAX_TEXT}
      disabled={disabled} onChange={e=>updateBlock(b.id,'text',e.target.value)}
      placeholder={TYPE_HINTS[b.type]} />
    </label>}
    {b.type==='choice'&&<label className="wb-field"><span>GO TO SCENE</span>
     <select disabled={disabled} value={b.target||''} onChange={e=>updateBlock(b.id,'target',e.target.value)}>
      <option value="">Choose a scene</option>
      {scenes.map(t=><option key={t.id} value={t.id}>{t.text.trim()||'Untitled scene'}</option>)}
     </select>
     <small>Choices work only inside this local preview. They cannot navigate to other sites or issue XP.</small>
    </label>}
    </article>)}
   <div className="wb-add">
    <label className="wb-field"><span>ADD A SECTION</span>
     <select value={newType} disabled={disabled||rows.length>=MAX_BLOCKS}
      onChange={e=>setNewType(e.target.value as StudioBlockType)}>
      {BLOCK_TYPES.map(type=><option key={type} value={type}>{TYPE_NAMES[type]}</option>)}
     </select>
    </label>
    <button type="button" className="wb-add-button" disabled={disabled||rows.length>=MAX_BLOCKS}
     onClick={addBlock}>+ ADD SECTION</button>
   </div>
  </div>:<div className="wb-preview" aria-label="Private creation preview" aria-live="polite">
   <div className="wb-preview-top"><span>LOCAL PREVIEW / NOT PUBLISHED</span>
    {scenes.length>0&&<button type="button" onClick={resetStory}>RESTART STORY ↶</button>}
   </div>
   <div className="wb-preview-paper">
    {present.length===0&&<p>Add some sections to see how your work could look.</p>}
    {present.map(b=><PreviewBlock key={b.id} block={b} enabled={scenes.length>0}
     onChoice={setScene}/>)}
   </div>
   <p className="wb-preview-footer">This is a private, text-only rendering. No files, external embeds, uploaded HTML, or game code are executed.</p>
  </div>}
 </section>;
}

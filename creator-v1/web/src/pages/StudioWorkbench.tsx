import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {
 BLOCK_TYPES,MAX_BLOCKS,decodeStudioBlockDocument,encodeStudioBlockDocument,
 isStudioBlockDescription,newStudioBlock,createStudioBlockDocumentFromNotes,
 moveStudioBlock,removeStudioBlock,getVisibleWorkbenchBlocks,
 type StudioBlock,type StudioBlockDocument,type StudioBlockType
} from '../lib/studio-blocks';
import './studio-workbench.css';
import {NativePackLab} from './NativePackLab';

const TYPE_NAMES:Record<StudioBlockType,string>={
 heading:'Title',paragraph:'Writing',quote:'Quote',divider:'Break',
 scene:'Scene',choice:'Choice',caption:'Artwork',credits:'Credits'
};
const TYPE_HINTS:Record<StudioBlockType,string>={
 heading:'Give this moment a name…',
 paragraph:'Start writing here…',
 quote:'A thought worth remembering…',
 divider:'',
 scene:'Where are we now? What happens here?',
 choice:'What can your reader choose?',
 caption:'Describe this piece and what it means…',
 credits:'Who helped make this?'
};
const QUICK_TOOLS:{type:StudioBlockType;name:string;symbol:string}[]=[
 {type:'paragraph',name:'Write',symbol:'≡'},
 {type:'heading',name:'Title',symbol:'T'},
 {type:'scene',name:'Scene',symbol:'◇'},
 {type:'choice',name:'Choice',symbol:'↗'},
 {type:'quote',name:'Quote',symbol:'❝'},
 {type:'caption',name:'Artwork',symbol:'▧'}
];
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

export function StudioWorkbench({value,onChange,disabled,title,creator,category}:{
 value:string;onChange:(value:string)=>void;disabled:boolean;title:string;creator:string;category?:string;
}){
 const document=decodeStudioBlockDocument(value);
 const encoded=isStudioBlockDescription(value);
 const [mode,setMode]=useState<'compose'|'experience'>('compose');
 const [newType,setNewType]=useState<StudioBlockType>('credits');
 const [error,setError]=useState('');
 const [scene,setScene]=useState<string|null>(null);
 const editRef=useRef<HTMLDivElement>(null);
 const focusTarget=useRef<string|null>(null);
 const scenes=document?.blocks.filter(b=>b.type==='scene')||[];
 useEffect(()=>{
  if(scene!==null&&(!document||!scenes.some(x=>x.id===scene)))setScene(null);
 },[scene,value]);
 useEffect(()=>{
  if(!focusTarget.current||mode!=='compose')return;
  const target=editRef.current?.querySelector<HTMLTextAreaElement>(
   '[data-block-id="'+focusTarget.current+'"]');
  if(target){target.focus();focusTarget.current=null;}
 },[value,mode]);
 // Textareas are backed by the validated private block schema but should feel
 // like live writing, not fixed-size form inputs. Measure on initial load,
 // editing, undo-like changes and return from Experience mode.
 useLayoutEffect(()=>{
  if(mode!=='compose')return;
  const fitToContent=()=>{
   editRef.current?.querySelectorAll<HTMLTextAreaElement>('.wb-inline-text').forEach(field=>{
    field.style.height='auto';
    field.style.height=field.scrollHeight+'px';
   });
  };
  fitToContent();
  window.addEventListener('resize',fitToContent);
  return()=>window.removeEventListener('resize',fitToContent);
 },[value,mode]);
 function change(next:StudioBlockDocument){
  try{
   onChange(encodeStudioBlockDocument(next));
   setError('');
  }catch(e){setError(e instanceof Error?e.message:'Cannot change this draft without losing data.');}
 }
 function makeWorkbench(){
  try{change(createStudioBlockDocumentFromNotes(value));setMode('compose');}
  catch(e){setError(e instanceof Error?e.message:'Cannot convert these notes.');}
 }
 if(!document){
  if(encoded)return <section className="wb-root wb-invalid" aria-label="Workbench document recovery">
   <span className="st-kicker">PRESERVED / READ-ONLY</span>
   <h3>THIS DOCUMENT NEEDS RECOVERY.</h3>
   <p>These blocks did not pass validation. Your stored text remains unchanged.</p>
   <details><summary>View original data for recovery</summary>
    <textarea readOnly rows={6} value={value} aria-label="Stored Workbench data for recovery"/></details>
  </section>;
  return <section className="wb-root wb-intro" aria-label="Creative notes or Workbench">
   <div className="wb-intro-head">
    <div><span className="st-kicker">CONTINUE / YOUR ORIGINAL NOTES</span>
     <h3>YOUR WORDS, YOUR WORK.</h3>
     <p>You can keep writing here, or turn these notes into pieces you can arrange and experience.</p>
    </div>
    <button type="button" className="wb-convert" disabled={disabled}
     onClick={makeWorkbench}>OPEN CREATIVE SURFACE ↗</button>
   </div>
   <label htmlFor="wb-existing-notes" className="wb-notes-label">PRIVATE WORKING NOTES</label>
   <textarea id="wb-existing-notes" rows={10} maxLength={8000} disabled={disabled}
    value={value} placeholder="What do you want to make?"
    onChange={e=>{onChange(e.target.value);setError('');}}/>
   <p className="wb-help">Notes remain editable. Converting is optional and limited to 2,500 characters; no media or executable files are involved.</p>
   {error&&<p role="alert" className="wb-error">{error}</p>}
   <NativePackLab title={title} creator={creator} category={category} document={null} disabled={disabled}
    onImportDocument={change}/>
  </section>;
 }
 const workDocument:StudioBlockDocument=document;
 const rows=workDocument.blocks;
 const present=getVisibleWorkbenchBlocks(document,scene);
 function updateBlock(id:string,field:'type'|'text'|'target',newValue:string){
  const next=rows.map(b=>{
   if(b.id!==id)return b;
   if(field==='type'){
    const type=newValue as StudioBlockType;
    return {id:b.id,type,text:type==='divider'?'':b.text,target:null};
   }
   return {...b,[field]:field==='target'?(newValue||null):newValue};
  });
  change({...workDocument,blocks:next});
 }
 function addBlock(type:StudioBlockType){
  if(disabled)return;
  if(rows.length>=MAX_BLOCKS){setError('This canvas is at its 28-piece limit.');return;}
  const piece=newStudioBlock(type);
  focusTarget.current=type==='divider'?null:piece.id;
  change({...workDocument,blocks:[...rows,piece]});
  setMode('compose');
 }
 function move(id:string,delta:-1|1){change(moveStudioBlock(workDocument,id,delta));}
 function remove(id:string){change(removeStudioBlock(workDocument,id));}
 const preview=<div className="wb-preview" aria-label="Private creation preview" aria-live="polite">
  <div className="wb-preview-top"><span>LOCAL PREVIEW / NOT PUBLISHED</span>
   {scenes.length>0&&<button type="button" onClick={()=>setScene(null)}>RESTART ↶</button>}
  </div>
  <div className="wb-preview-paper">
   {present.length===0&&<p>A blank universe. Add your first piece to see it take shape.</p>}
   {present.map(b=><PreviewBlock key={b.id} block={b} enabled={scenes.length>0}
    onChoice={setScene}/>)}
  </div>
  <p className="wb-preview-footer">This is a private text-only experience. No creator HTML, scripts, or external assets run here.</p>
 </div>;
 return <section className="wb-root wb-builder wb-canvas-first" aria-label="Visual creative Workbench">
  <div className="wb-head">
   <div><span className="st-kicker">CREATIVE SURFACE / PRIVATE</span>
    <h3>MAKE SOMETHING.</h3>
    <p>Create directly. Explore it as you go. You can deal with the details later.</p>
   </div>
   <div className="wb-switch" role="group" aria-label="Workbench mode">
    <button type="button" aria-pressed={mode==='compose'} onClick={()=>setMode('compose')}>MAKE</button>
    <button type="button" aria-pressed={mode==='experience'} onClick={()=>setMode('experience')}>EXPERIENCE ↗</button>
   </div>
  </div>
  <div className="wb-tools" role="toolbar" aria-label="Add to your creation">
   {QUICK_TOOLS.map(tool=><button type="button" key={tool.type}
    disabled={disabled||rows.length>=MAX_BLOCKS} onClick={()=>addBlock(tool.type)}>
    <span aria-hidden="true">{tool.symbol}</span>{tool.name}</button>)}
   <div className="wb-more-tools">
    <span>MORE</span>
    <select aria-label="More pieces to add" disabled={disabled||rows.length>=MAX_BLOCKS}
     value={newType} onChange={e=>setNewType(e.target.value as StudioBlockType)}>
     {BLOCK_TYPES.map(type=><option key={type} value={type}>{TYPE_NAMES[type]}</option>)}
    </select>
    <button type="button" disabled={disabled||rows.length>=MAX_BLOCKS}
     onClick={()=>addBlock(newType)}>+</button>
   </div>
  </div>
  {error&&<p role="alert" className="wb-error">{error}</p>}
  <div className={'wb-workspace'+(mode==='experience'?' is-experience':'')}>
   <div className="wb-edit" ref={editRef} aria-label="Editable creation canvas">
    {rows.length===0&&<div className="wb-blank">
     <div className="wb-blank-orbit" aria-hidden="true">◌</div>
     <h4>Nothing here yet. That is the point.</h4>
     <p>Choose Write, Title, Scene, or another tool above to begin.</p>
     <button type="button" disabled={disabled} onClick={()=>addBlock('paragraph')}>+ START WRITING</button>
    </div>}
    {rows.map((b,index)=><article className={'wb-block wb-kind-'+b.type} key={b.id}
     aria-label={'Section '+(index+1)}>
     <div className="wb-block-top">
      <span className="wb-block-number">{TYPE_NAMES[b.type]} <em>/{String(index+1).padStart(2,'0')}</em></span>
      <div className="wb-block-actions">
       <button type="button" aria-label={'Move section '+(index+1)+' up'}
        disabled={disabled||index===0} onClick={()=>move(b.id,-1)}>↑</button>
       <button type="button" aria-label={'Move section '+(index+1)+' down'}
        disabled={disabled||index===rows.length-1} onClick={()=>move(b.id,1)}>↓</button>
       <details className="wb-block-options">
        <summary>TYPE</summary>
        <label className="wb-field"><span>CHANGE PIECE</span>
         <select aria-label={'Type for section '+(index+1)} value={b.type} disabled={disabled}
          onChange={e=>updateBlock(b.id,'type',e.target.value)}>
          {BLOCK_TYPES.map(type=><option key={type} value={type}>{TYPE_NAMES[type]}</option>)}
         </select>
        </label>
       </details>
       <button type="button" className="wb-remove" aria-label={'Remove section '+(index+1)}
        disabled={disabled} onClick={()=>remove(b.id)}>×</button>
      </div>
     </div>
     {b.type==='divider'?<hr className="wb-inline-divider"/>:
      <textarea className="wb-inline-text" data-block-id={b.id}
       aria-label={TYPE_NAMES[b.type]+' section '+(index+1)}
       rows={1} maxLength={MAX_TEXT}
       value={b.text} disabled={disabled}
       onChange={e=>updateBlock(b.id,'text',e.target.value)}
       placeholder={TYPE_HINTS[b.type]}/>}
     {b.type==='choice'&&<label className="wb-choice-destination">
      <span>CONTINUE TO</span>
      <select disabled={disabled} value={b.target||''}
       onChange={e=>updateBlock(b.id,'target',e.target.value)}>
       <option value="">Choose a scene…</option>
       {scenes.map(t=><option key={t.id} value={t.id}>{t.text.trim()||'Untitled scene'}</option>)}
      </select>
     </label>}
    </article>)}
    {rows.length>0&&<div className="wb-last-action">
     <button type="button" disabled={disabled||rows.length>=MAX_BLOCKS}
      onClick={()=>addBlock('paragraph')}>+ KEEP MAKING</button>
    </div>}
   </div>
   {preview}
  </div>
  <div className="wb-canvas-footer">
   <span>{rows.length} / {MAX_BLOCKS} PIECES</span>
   <span>{value.length} / 8,000 CHARACTERS</span>
   <span>Save your private revision using the Studio toolbar.</span>
  </div>
  <NativePackLab title={title} creator={creator} category={category} document={workDocument} disabled={disabled}
   onImportDocument={change}/>
 </section>;
}

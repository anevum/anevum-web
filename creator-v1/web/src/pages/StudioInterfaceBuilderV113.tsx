import {useEffect,useMemo,useState} from 'react';
import {
 PREFIX,THEMES,KINDS,TONES,ALIGNS,WIDTHS,ACTIONS,LIMITS,
 component,page,starter,encode,decode,removeComponent,removePage,
 type Document,type Component,type Kind,type Action
} from '../../../interface-builder/document.mjs';
import './studio-interface-builder-v113.css';

export const studioInterfaceBuilderEnabled=import.meta.env.VITE_CREATOR_INTERFACE_BUILDER_V113==='true';
type Props={raw:string;fileName:string;resetToken:string;readOnly:boolean;onChange:(value:string)=>void};
type Device='desktop'|'tablet'|'phone';
type View='design'|'preview';
type PreviewState={counts:Record<string,number>;visible:Record<string,boolean>;inputs:Record<string,string>};
const initial=():PreviewState=>({counts:{},visible:{},inputs:{}});
const message=(error:unknown)=>error instanceof Error?error.message:'Document change could not be validated.';
const deviceWidths:Record<Device,number>={desktop:960,tablet:720,phone:360};

/** Declarative preview only. A user-supplied source file never enters an iframe,
 * srcdoc, script, CSS style string, external URL, or arbitrary HTML parser. */
export function StudioInterfaceBuilderV113({raw,fileName,resetToken,readOnly,onChange}:Props){
 const document=useMemo(()=>decode(raw),[raw]);
 const [pageId,setPageId]=useState<string|null>(null);
 const [componentId,setComponentId]=useState<string|null>(null);
 const [view,setView]=useState<View>('design');
 const [device,setDevice]=useState<Device>('desktop');
 const [previewPageId,setPreviewPageId]=useState<string|null>(null);
 const [preview,setPreview]=useState<PreviewState>(initial);
 const [newKind,setNewKind]=useState<Kind>('paragraph');
 const [undo,setUndo]=useState<string[]>([]);
 const [redo,setRedo]=useState<string[]>([]);
 const [error,setError]=useState('');
 useEffect(()=>{
  setPageId(null);setComponentId(null);setPreviewPageId(null);
  setView('design');setPreview(initial());setUndo([]);setRedo([]);setError('');
 },[resetToken]);
 useEffect(()=>{
  if(!document){setPageId(null);setComponentId(null);return;}
  setPageId(old=>old&&document.pages.some(p=>p.id===old)?old:document.pages[0].id);
 },[document]);
 const activePage=document?.pages.find(p=>p.id===pageId)||document?.pages[0]||null;
 const activeItem=activePage?.components.find(c=>c.id===componentId)||null;
 const previewPage=document?.pages.find(p=>p.id===previewPageId)||document?.pages[0]||null;
 const emptyCanStart=raw===''&&fileName.toLowerCase().endsWith('.ui.anevum');

 function commit(next:Document){
  if(readOnly||!document)return;
  try{
   const saved=encode(next);
   if(saved===raw)return;
   setUndo(old=>[...old,raw].slice(-20));setRedo([]);setError('');
   onChange(saved);
  }catch(e){setError(message(e));}
 }
 function initialize(){
  if(!emptyCanStart||readOnly)return;
  try{const next=encode(starter());onChange(next);setError('');}
  catch(e){setError(message(e));}
 }
 function undoAction(){
  if(readOnly||undo.length===0)return;
  const before=undo[undo.length-1];setUndo(old=>old.slice(0,-1));setRedo(old=>[...old,raw].slice(-20));onChange(before);setError('');
 }
 function redoAction(){
  if(readOnly||redo.length===0)return;
  const after=redo[redo.length-1];setRedo(old=>old.slice(0,-1));setUndo(old=>[...old,raw].slice(-20));onChange(after);setError('');
 }
 function updatePage(patch:Partial<{name:string}>){
  if(!document||!activePage)return;
  commit({...document,pages:document.pages.map(p=>p.id===activePage.id?{...p,...patch}:p)});
 }
 function updateItem(patch:Partial<Component>){
  if(!document||!activePage||!activeItem)return;
  let next={...activeItem,...patch};
  if(patch.kind!==undefined&&patch.kind!=='button')next={...next,action:'none',target:null};
  if(patch.action!==undefined&&patch.action!==activeItem.action)next={...next,target:null};
  commit({...document,pages:document.pages.map(p=>p.id!==activePage.id?p:
   {...p,components:p.components.map(c=>c.id===activeItem.id?next:c)})});
 }
 function addItem(){
  if(!document||!activePage||readOnly||activePage.components.length>=LIMITS.componentsPerPage||
   document.pages.reduce((n,p)=>n+p.components.length,0)>=LIMITS.components)return;
  try{
   const next=component(newKind,'New '+newKind,'');
   commit({...document,pages:document.pages.map(p=>p.id!==activePage.id?p:
    {...p,components:[...p.components,next]})});
   setComponentId(next.id);
  }catch(e){setError(message(e));}
 }
 function addPage(){
  if(!document||readOnly||document.pages.length>=LIMITS.pages)return;
  try{
   const next=page('Page '+(document.pages.length+1));
   commit({...document,pages:[...document.pages,next]});
   setPageId(next.id);setComponentId(null);
  }catch(e){setError(message(e));}
 }
 function removeSelected(){
  if(!document||!activePage||!activeItem||readOnly)return;
  if(!window.confirm('Remove this component? Buttons targeting it will be disconnected.'))return;
  try{commit(removeComponent(document,activePage.id,activeItem.id));setComponentId(null);}
  catch(e){setError(message(e));}
 }
 function removeSelectedPage(){
  if(!document||!activePage||readOnly||document.pages.length===1)return;
  if(!window.confirm('Remove this page? Buttons pointing to it will be disconnected.'))return;
  try{
   commit(removePage(document,activePage.id));
   setPageId(document.pages.find(p=>p.id!==activePage.id)?.id||null);setComponentId(null);
  }catch(e){setError(message(e));}
 }
 function moveItem(direction:-1|1){
  if(!document||!activePage||!activeItem||readOnly)return;
  const idx=activePage.components.findIndex(c=>c.id===activeItem.id),target=idx+direction;
  if(idx<0||target<0||target>=activePage.components.length)return;
  const components=[...activePage.components];[components[idx],components[target]]=[components[target],components[idx]];
  commit({...document,pages:document.pages.map(p=>p.id!==activePage.id?p:{...p,components})});
 }
 function runAction(item:Component){
  if(!document||!previewPage||item.kind!=='button')return;
  const target=item.target;
  switch(item.action){
   case 'navigate':
    if(target&&document.pages.some(p=>p.id===target)){setPreviewPageId(target);}
    break;
   case 'increment':
   case 'decrement':
    if(target&&previewPage.components.some(c=>c.id===target&&c.kind==='counter'))
     setPreview(old=>({...old,counts:{...old.counts,[target]:Math.max(-99999,Math.min(99999,
      (old.counts[target]??Number(previewPage.components.find(c=>c.id===target)?.text||0)||0)+(item.action==='increment'?1:-1)))}}));
    break;
   case 'toggle':
    if(target&&previewPage.components.some(c=>c.id===target&&c.kind==='notice'))
     setPreview(old=>({...old,visible:{...old.visible,[target]:!(old.visible[target]??true)}}));
    break;
   case 'reset':
    setPreview(initial());setPreviewPageId(document.pages[0].id);
    break;
  }
 }
 function renderItem(item:Component,interactive:boolean){
  const content=item.kind==='divider'?<hr/>:
   item.kind==='heading'?<h2>{item.title}</h2>:
   item.kind==='paragraph'?<p>{item.text}</p>:
   item.kind==='button'?<button type="button" className="cui-preview-button"
    disabled={!interactive||item.action==='none'}
    onClick={interactive?()=>runAction(item):undefined}>{item.title||'Button'}</button>:
   item.kind==='input'?<label>{item.title||'Input'}<input type="text" maxLength={100}
    placeholder={item.text||'Enter text'}
    value={interactive?(preview.inputs[item.id]||''):''} readOnly={!interactive}
    onChange={interactive?e=>setPreview(old=>({...old,inputs:{...old.inputs,[item.id]:e.target.value}})):undefined}/></label>:
   item.kind==='counter'?<div><strong>{item.title}</strong><output>{preview.counts[item.id]??Number(item.text||0)||0}</output></div>:
   item.kind==='notice'?<div><strong>{item.title}</strong><p>{item.text}</p></div>:
   <div><h3>{item.title}</h3><p>{item.text}</p></div>;
  if(item.kind==='notice'&&preview.visible[item.id]===false)return null;
  return <div key={item.id}
   className={'cui-component cui-'+item.kind+' cui-tone-'+item.tone+' cui-align-'+item.align+' cui-width-'+item.width}
   data-ui-component={item.kind}>{content}</div>;
 }
 if(!document)return <section className="cui-shell cui-empty" aria-label="Visual interface builder">
  <p className="csw-eyebrow">ANEVUM UI / DECLARATIVE APP DESIGN</p>
  <h3>{emptyCanStart?'Create an interactive interface.':'Unsupported visual interface source.'}</h3>
  <p>{emptyCanStart?
   'Start a private multi-page prototype with buttons, counters and a safe preview. Save explicitly to write a source revision.':
   raw.startsWith(PREFIX)?
    'This file contains an invalid ANEVUM_UI_V1 document. Its original source is unchanged; switch to Source text to repair it.':
    'Only a validated ANEVUM_UI_V1 document can open in the visual interface builder. The source text has not been changed.'}</p>
  {emptyCanStart&&<button type="button" className="csw-action csw-strong" onClick={initialize} disabled={readOnly}>Initialize interface starter</button>}
  {error&&<p className="csf-error" role="alert">{error}</p>}
 </section>;

 const targetChoices=activeItem?.action==='navigate'?document.pages.map(p=>({id:p.id,label:p.name})):
  activeItem?.action==='toggle'?activePage?.components.filter(c=>c.kind==='notice').map(c=>({id:c.id,label:c.title||c.id})):
  activeItem?.action==='increment'||activeItem?.action==='decrement'?
   activePage?.components.filter(c=>c.kind==='counter').map(c=>({id:c.id,label:c.title||c.id})):[];
 return <section className="cui-shell" data-studio-ui-builder="v113" aria-label="Visual application page builder">
  <header className="cui-header">
   <div><p className="csw-eyebrow">ANEVUM UI V1 / CONTINUANCE WORKSPACE</p>
    <h3>{document.name}</h3><p className="cui-muted">{document.pages.length} pages · Declarative UI · No script execution</p>
   </div>
   <div className="cui-actions">
    <button type="button" aria-pressed={view==='design'} onClick={()=>setView('design')}>Design</button>
    <button type="button" aria-pressed={view==='preview'} onClick={()=>setView('preview')}>Interactive preview</button>
    <button type="button" disabled={readOnly||!undo.length} onClick={undoAction}>Undo</button>
    <button type="button" disabled={readOnly||!redo.length} onClick={redoAction}>Redo</button>
   </div>
  </header>
  {readOnly&&<p className="cui-muted" role="status">Read-only: preview works, authoring is disabled.</p>}
  {error&&<p role="alert" className="csf-error">{error}</p>}
  {view==='design'?<div className="cui-workspace">
   <aside className="cui-explorer" aria-label="Interface pages and components">
    <div className="cui-panel-head"><h4>Pages</h4>
     <button type="button" disabled={readOnly||document.pages.length>=LIMITS.pages} onClick={addPage}>+ Page</button></div>
    {document.pages.map(pg=><button key={pg.id} type="button" className={'cui-page-row'+(pg.id===activePage?.id?' active':'')}
     aria-current={pg.id===activePage?.id?'page':undefined} onClick={()=>{setPageId(pg.id);setComponentId(null);}}>
     {pg.name}<small>{pg.components.length}</small></button>)}
    <div className="cui-panel-head"><h4>Components</h4><small>{activePage?.components.length||0}/{LIMITS.componentsPerPage}</small></div>
    {activePage?.components.map(item=><button type="button" key={item.id} className={'cui-item-row'+(item.id===componentId?' active':'')}
     onClick={()=>setComponentId(item.id)}><span>{item.kind}</span><strong>{item.title||item.text.slice(0,32)||'Untitled'}</strong></button>)}
    <div className="cui-create">
     <label htmlFor="cui-kind">Add component</label>
     <select id="cui-kind" value={newKind} disabled={readOnly} onChange={e=>setNewKind(e.target.value as Kind)}>
      {KINDS.map(kind=><option key={kind} value={kind}>{kind}</option>)}
     </select><button type="button" disabled={readOnly||(activePage?.components.length||0)>=LIMITS.componentsPerPage}
      onClick={addItem}>Add to page</button>
    </div>
   </aside>
   <main className="cui-design-area">
    <div className="cui-preview-shell cui-design-preview">
     <div className="cui-frame cui-frame-desktop">
      <div className="cui-page-preview" data-theme={document.theme}>
       <div className="cui-page-identity">{activePage?.name}</div>
       {activePage?.components.map(item=><div key={item.id} className={'cui-design-target'+(item.id===componentId?' selected':'')}
        onClick={()=>setComponentId(item.id)}>
        {renderItem(item,false)}
       </div>)}
      </div>
     </div>
    </div>
   </main>
   <aside className="cui-inspector" aria-label="Interface properties Inspector">
    <h4>Properties</h4>
    {!activeItem?<div className="cui-fields">
     <label>Interface name<input disabled={readOnly} value={document.name} maxLength={LIMITS.name}
      onChange={e=>commit({...document,name:e.target.value})}/></label>
     <label>Theme<select disabled={readOnly} value={document.theme}
      onChange={e=>commit({...document,theme:e.target.value as Document['theme']})}>
      {THEMES.map(theme=><option key={theme} value={theme}>{theme}</option>)}</select></label>
     <label>Page name<input disabled={readOnly} value={activePage?.name||''} maxLength={LIMITS.name}
      onChange={e=>updatePage({name:e.target.value})}/></label>
     <button type="button" disabled={readOnly||document.pages.length<=1} onClick={removeSelectedPage}>Remove page</button>
     <p className="cui-muted">Select a component to edit its text, appearance and interactions.</p>
    </div>:<div className="cui-fields">
     <p className="csw-eyebrow">{activeItem.kind.toUpperCase()} / COMPONENT</p>
     <label>Type<select disabled={readOnly} value={activeItem.kind}
      onChange={e=>updateItem({kind:e.target.value as Kind})}>
      {KINDS.map(kind=><option key={kind} value={kind}>{kind}</option>)}</select></label>
     <label>Title<input disabled={readOnly} value={activeItem.title} maxLength={LIMITS.title}
      onChange={e=>updateItem({title:e.target.value})}/></label>
     <label>Text / initial value<textarea disabled={readOnly} value={activeItem.text} maxLength={LIMITS.text}
      rows={4} onChange={e=>updateItem({text:e.target.value})}/></label>
     <div className="cui-field-grid">
      <label>Tone<select disabled={readOnly} value={activeItem.tone}
       onChange={e=>updateItem({tone:e.target.value as Component['tone']})}>{TONES.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Align<select disabled={readOnly} value={activeItem.align}
       onChange={e=>updateItem({align:e.target.value as Component['align']})}>{ALIGNS.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Width<select disabled={readOnly} value={activeItem.width}
       onChange={e=>updateItem({width:e.target.value as Component['width']})}>{WIDTHS.map(x=><option key={x}>{x}</option>)}</select></label>
     </div>
     {activeItem.kind==='button'&&<>
      <label>Interaction<select disabled={readOnly} value={activeItem.action}
       onChange={e=>updateItem({action:e.target.value as Action})}>{ACTIONS.map(x=><option key={x}>{x}</option>)}</select></label>
      {['navigate','increment','decrement','toggle'].includes(activeItem.action)&&<label>Target
       <select disabled={readOnly} value={activeItem.target||''}
        onChange={e=>updateItem({target:e.target.value||null})}>
        <option value="">Select target</option>
        {targetChoices?.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}
       </select></label>}
     </>}
     <div className="cui-actions">
      <button type="button" disabled={readOnly||activePage?.components[0]?.id===activeItem.id} onClick={()=>moveItem(-1)}>Move up</button>
      <button type="button" disabled={readOnly||activePage?.components.at(-1)?.id===activeItem.id} onClick={()=>moveItem(1)}>Move down</button>
      <button type="button" disabled={readOnly} onClick={removeSelected}>Remove</button>
     </div>
    </div>}
   </aside>
  </div>:<div className="cui-playtest">
   <div className="cui-preview-toolbar">
    <div className="cui-actions">
     {(['desktop','tablet','phone'] as const).map(target=><button key={target} type="button"
      aria-pressed={device===target} onClick={()=>setDevice(target)}>{target} · {deviceWidths[target]}px</button>)}
    </div>
    <label>Page<select value={previewPage?.id||''} onChange={e=>setPreviewPageId(e.target.value)}>
     {document.pages.map(pg=><option key={pg.id} value={pg.id}>{pg.name}</option>)}</select></label>
    <button type="button" onClick={()=>{setPreview(initial());setPreviewPageId(document.pages[0].id);}}>Restart preview</button>
   </div>
   <div className="cui-preview-shell">
    <div className={'cui-frame cui-frame-'+device} style={{width:'min(100%, '+deviceWidths[device]+'px)'}}>
     <div className="cui-page-preview" data-theme={document.theme} data-preview-page={previewPage?.id||''}>
      <div className="cui-page-identity">{previewPage?.name}</div>
      {previewPage?.components.map(item=>renderItem(item,true))}
     </div>
    </div>
   </div>
   <p className="cui-muted">Preview interactions are local to this browser view. They never invoke a server, arbitrary script, payment, or publishing action.</p>
  </div>}
  <footer className="cui-status">Local visual edits update the underlying private file buffer. Use Save revision in Studio to persist changes.</footer>
 </section>;
}

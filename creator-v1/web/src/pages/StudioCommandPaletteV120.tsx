import {useEffect,useId,useMemo,useRef,useState,type KeyboardEvent} from 'react';
import {Icon} from '../components/Icons';
import {StudioFileIconV119} from './StudioFileIconV119';
import {rankStudioItems,type StudioPaletteItem} from '../../../source-ide/commands-v120.mjs';
import './studio-command-palette-v120.css';

/** Modal action selector operating only on already-authorized file metadata
 * and explicitly supplied (allowlisted) UI callbacks.
 * No source content, hidden endpoints or arbitrary command execution.
 */
export function StudioCommandPaletteV120({items,onChoose,onClose,initialMode='files',title='Quick Open'}:{
 items:StudioPaletteItem[];
 onChoose:(item:StudioPaletteItem)=>void;onClose:()=>void;
 initialMode?:'files'|'commands';title?:string;
}){
 const [query,setQuery]=useState('');
 const [active,setActive]=useState(0);
 const [mode,setMode]=useState<'files'|'commands'>(initialMode);
 const input=useRef<HTMLInputElement|null>(null);
 const root=useRef<HTMLDivElement|null>(null);
 const id=useId().replace(/:/g,'-');
 const results=useMemo(()=>rankStudioItems(items.filter(item=>mode==='files'?
  item.kind==='file':item.kind==='command'),query,12),[items,mode,query]);
 useEffect(()=>{input.current?.focus();},[]);
 useEffect(()=>{
  const previous=window.document.activeElement instanceof HTMLElement?window.document.activeElement:null;
  const focusTimer=window.requestAnimationFrame(()=>input.current?.focus());
  const onKey=(event:globalThis.KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();onClose();}
  };
  window.document.addEventListener('keydown',onKey);
  return()=>{window.cancelAnimationFrame(focusTimer);window.document.removeEventListener('keydown',onKey);previous?.focus();};
 },[onClose]);
 function choose(item:StudioPaletteItem){
  if(item.disabled)return;
  onChoose(item);
 }
 function handleKey(event:KeyboardEvent<HTMLInputElement>){
  if(event.key==='ArrowDown'){
   event.preventDefault();setActive(a=>(a+1)%Math.max(1,results.length));
  }else if(event.key==='ArrowUp'){
   event.preventDefault();setActive(a=>(a-1+Math.max(1,results.length))%Math.max(1,results.length));
  }else if(event.key==='Enter'){
   event.preventDefault();const chosen=results[active];if(chosen)choose(chosen);
  }else if(event.key==='Tab'&&!event.shiftKey){
   // Let Tab move to mode controls/results naturally.
  }
 }
 const shown=results[Math.min(active,Math.max(0,results.length-1))];
 return <div className="csp-backdrop" ref={root} onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}
  data-studio-command-palette="v120">
  <section className="csp-modal" role="dialog" aria-modal="true" aria-label={title}>
   <div className="csp-head"><span className="csp-head-icon"><Icon name="command" size={18}/></span>
    <strong>{title}</strong><span className="csp-shortcut">ESC to close</span>
    <button type="button" aria-label="Close command palette" onClick={onClose}><Icon name="close" size={17}/></button>
   </div>
   <div className="csp-inputbar">
    <Icon name="search" size={19}/>
    <input ref={input} role="combobox" type="search" aria-label={mode==='files'?'Search project files':'Search editor commands'}
     aria-expanded="true" aria-controls={id+'-options'} aria-activedescendant={shown?id+'-result-'+Math.min(active,results.length-1):undefined}
     aria-autocomplete="list" autoComplete="off"
     placeholder={mode==='files'?'Find a file by name or path…':'Find an available command…'}
     value={query} onChange={event=>{setQuery(event.target.value);setActive(0);}} onKeyDown={handleKey}/>
   </div>
   <div className="csp-switch" role="group" aria-label="Quick Open category">
    <button type="button" aria-pressed={mode==='files'} onClick={()=>{setMode('files');setQuery('');setActive(0);input.current?.focus();}}>
     <Icon name="file-search" size={14}/> Files <span>Ctrl/Cmd+P</span></button>
    <button type="button" aria-pressed={mode==='commands'} onClick={()=>{setMode('commands');setQuery('');setActive(0);input.current?.focus();}}>
     <Icon name="command" size={14}/> Commands <span>Ctrl/Cmd+Shift+P</span></button>
   </div>
   <div className="csp-results" id={id+'-options'} role="listbox" aria-label="Matching items">
    {!results.length&&<p className="csp-empty">No matching {mode==='files'?'files':'commands'} in this workspace.</p>}
    {results.map((item,i)=><button type="button" role="option" id={id+'-result-'+i}
     key={item.id} aria-selected={i===active} className={'csp-result'+(i===active?' is-active':'')}
     disabled={item.disabled}
     onMouseEnter={()=>setActive(i)} onClick={()=>choose(item)}>
      <span className="csp-result-icon">{item.kind==='file'?<StudioFileIconV119 name={item.label} size={19}/>:
       <Icon name={item.id.startsWith('new-')?'file':'command'} size={19}/>}</span>
      <span className="csp-result-body"><strong>{item.label}</strong><small title={item.detail}>{item.detail}</small></span>
      <span className="csp-category">{item.category}</span>
    </button>)}
   </div>
   <div className="csp-footer"><span><strong>↑ ↓</strong> Navigate</span><span><strong>↵</strong> Open</span>
    <span>Only files and actions available in this workspace are shown.</span></div>
  </section>
 </div>;
}

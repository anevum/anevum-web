import {useMemo,useRef,useState,type CSSProperties,type KeyboardEvent} from 'react';
import {Icon} from '../components/Icons';
import {StudioFileIconV119} from './StudioFileIconV119';
import {editorLanguage,highlightSource,sourceCursor,editorIndent,editorEnter,
 findSource,replaceSourceAll,prettyJsonSource} from '../../../source-ide/language-v119.mjs';
import './studio-code-editor-v119.css';

type StudioCodeEditorProps={
 value:string;onChange:(value:string)=>void;fileName:string;
 id?:string;className?:string;ariaDescribedBy?:string;
 disabled?:boolean;readOnly?:boolean;onSave?:()=>void;saveDisabled?:boolean;
 status?:string;maxLength?:number;
};
export function StudioCodeEditorV119({
 value,onChange,fileName,id,className='',ariaDescribedBy,
 disabled=false,readOnly=false,onSave,saveDisabled=false,status,maxLength=32768
}:StudioCodeEditorProps){
 const textarea=useRef<HTMLTextAreaElement|null>(null);
 const searchInput=useRef<HTMLInputElement|null>(null);
 const [query,setQuery]=useState('');
 const [replace,setReplace]=useState('');
 const [searchOpen,setSearchOpen]=useState(false);
 const [replaceOpen,setReplaceOpen]=useState(false);
 const [caseSensitive,setCaseSensitive]=useState(false);
 const [settingsOpen,setSettingsOpen]=useState(false);
 const [lineNumbers,setLineNumbers]=useState(true);
 const [wordWrap,setWordWrap]=useState(false);
 const [indentWidth,setIndentWidth]=useState<2|4>(2);
 const [fontSize,setFontSize]=useState<12|14|16>(14);
 const [scroll,setScroll]=useState({top:0,left:0});
 const [selection,setSelection]=useState({start:0,end:0});
 const [notice,setNotice]=useState('');
 const language=editorLanguage(fileName);
 const syntax=useMemo(()=>highlightSource(value,fileName),[value,fileName]);
 const codeLines=value.split('\n').length;
 const plain=syntax.truncated||value.length>65536;
 const cursor=sourceCursor(value,selection.start,selection.end);
 const bytes=useMemo(()=>new TextEncoder().encode(value).length,[value]);
 const matches=useMemo(()=>{
  if(!query)return 0;
  const hay=caseSensitive?value:value.toLocaleLowerCase('en');
  const needle=caseSensitive?query:query.toLocaleLowerCase('en');
  let from=0,count=0,i=0;
  while((i=hay.indexOf(needle,from))>=0&&count<5000){count++;from=i+needle.length;}
  return count;
 },[value,query,caseSensitive]);
 const style={
  '--csi-size':fontSize+'px',
  '--csi-lineheight':(fontSize*1.65)+'px',
  '--csi-gutter-width':lineNumbers&&!wordWrap&&!plain?'49px':'0px',
  '--csi-indent':indentWidth
 } as CSSProperties;
 function syncSelection(){
  if(!textarea.current)return;
  setSelection({start:textarea.current.selectionStart,end:textarea.current.selectionEnd});
 }
 function focusEditor(start?:number,end?:number){
  const field=textarea.current;
  if(!field)return;
  field.focus();
  if(start!==undefined){
   field.setSelectionRange(start,end??start);
   setSelection({start,end:end??start});
  }
 }
 function applyPatch(patch:{text:string;start:number;end:number}){
  if(disabled||readOnly)return;
  if(patch.text.length>maxLength){setNotice('File exceeds the editor character limit.');return;}
  onChange(patch.text);
  window.requestAnimationFrame(()=>focusEditor(patch.start,patch.end));
  setSelection({start:patch.start,end:patch.end});
  setNotice('');
 }
 function jump(reverse=false){
  const match=findSource(value,query,reverse?selection.start:selection.end,caseSensitive,reverse);
  if(!match){setNotice(query?'No matches in this file.':'Enter a search term.');return;}
  focusEditor(match.start,match.end);
  setNotice(matches+' '+(matches===1?'match':'matches')+' in this file.');
 }
 function replaceCurrent(){
  if(disabled||readOnly)return;
  const a=selection.start,b=selection.end;
  const selected=value.slice(a,b);
  const same=caseSensitive?selected===query:selected.toLocaleLowerCase('en')===query.toLocaleLowerCase('en');
  const match=same&&query?{start:a,end:b}:findSource(value,query,b,caseSensitive);
  if(!match){setNotice('No matches to replace.');return;}
  applyPatch({text:value.slice(0,match.start)+replace+value.slice(match.end),
   start:match.start+replace.length,end:match.start+replace.length});
 }
 function replaceAll(){
  if(disabled||readOnly)return;
  try{
   const result=replaceSourceAll(value,query,replace,caseSensitive);
   if(!result.count){setNotice('No matches to replace.');return;}
   if(result.text.length>maxLength){setNotice('Replacement exceeds the editor character limit.');return;}
   applyPatch({text:result.text,start:Math.min(selection.start,result.text.length),end:Math.min(selection.start,result.text.length)});
   setNotice('Replaced '+result.count+' '+(result.count===1?'match':'matches')+' in this unsaved draft.');
  }catch(error){setNotice(error instanceof Error?error.message:'Replacement unavailable.');}
 }
 function openFind(withReplace=false){
  setSearchOpen(true);
  if(withReplace)setReplaceOpen(true);
  window.requestAnimationFrame(()=>searchInput.current?.focus());
 }
 function formatJson(){
  if(disabled||readOnly)return;
  try{
   const formatted=prettyJsonSource(value,indentWidth);
   if(formatted.length>maxLength){setNotice('Formatted source exceeds the editor limit.');return;}
   applyPatch({text:formatted,start:0,end:0});
   setNotice('JSON formatted locally. No code was run or saved.');
  }catch{setNotice('Invalid JSON. Nothing was changed.');}
 }
 function handleKeys(e:KeyboardEvent<HTMLTextAreaElement>){
  const field=e.currentTarget;
  const meta=e.ctrlKey||e.metaKey;
  const lower=e.key.toLowerCase();
  if(meta&&!e.altKey&&lower==='s'){
   e.preventDefault();
   if(onSave&&!disabled&&!readOnly&&!saveDisabled){onSave();}
   else setNotice('No revision was saved. Use an authorized project source editor to save.');
   return;
  }
  if(meta&&!e.altKey&&lower==='f'){e.preventDefault();openFind();return;}
  if(meta&&!e.altKey&&lower==='h'){e.preventDefault();openFind(true);return;}
  if(meta&&!e.altKey&&e.key===','){e.preventDefault();setSettingsOpen(x=>!x);return;}
  if(disabled||readOnly)return;
  if(e.key==='Tab'&&!meta&&!e.altKey){
   e.preventDefault();
   applyPatch(editorIndent(value,field.selectionStart,field.selectionEnd,indentWidth,e.shiftKey));
  }else if(e.key==='Enter'&&!meta&&!e.altKey&&!e.shiftKey){
   e.preventDefault();
   applyPatch(editorEnter(value,field.selectionStart,field.selectionEnd));
  }
 }
 const lines=syntax.lines;
 return <section className={'csi-editor'+(plain?' is-plain':'')+(wordWrap?' is-wrapped':'')+(disabled||readOnly?' is-readonly':'')}
  data-studio-code-editor="v119" aria-label={'Code editor for '+fileName} style={style}>
  <div className="csi-toolbar">
   <div className="csi-file-title"><StudioFileIconV119 name={fileName}/><strong title={fileName}>{fileName}</strong>
    <span className="csi-language">{language.toUpperCase()}</span></div>
   <div className="csi-toolbar-actions">
    <button type="button" onClick={()=>openFind()} aria-label="Find in file" title="Find · Ctrl/Cmd+F"><Icon name="search" size={16}/></button>
    <button type="button" onClick={()=>openFind(true)} aria-label="Find and replace" title="Replace · Ctrl/Cmd+H"><Icon name="replace" size={16}/></button>
    {(language==='json')&&<button type="button" onClick={formatJson} disabled={disabled||readOnly} aria-label="Format JSON" title="Format JSON"><Icon name="braces" size={16}/></button>}
    <button type="button" onClick={()=>setSettingsOpen(x=>!x)} aria-expanded={settingsOpen} aria-label="Editor settings" title="Editor preferences · Ctrl/Cmd+,"><Icon name="settings" size={16}/></button>
   </div>
  </div>
  {searchOpen&&<div className="csi-find-bar">
   <div className="csi-find-controls">
    <label><Icon name="search" size={14}/><input ref={searchInput} type="search" value={query} onChange={e=>setQuery(e.target.value)}
     onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();jump(e.shiftKey);}if(e.key==='Escape')setSearchOpen(false);}}
     aria-label="Find source text" placeholder="Find in file…"/></label>
    <span className="csi-match-count" aria-live="polite">{matches} {matches===1?'match':'matches'}</span>
    <button type="button" aria-pressed={caseSensitive} aria-label="Match case" title="Match case" onClick={()=>setCaseSensitive(x=>!x)}>Aa</button>
    <button type="button" aria-label="Previous match" title="Previous match" onClick={()=>jump(true)}>↑</button>
    <button type="button" aria-label="Next match" title="Next match" onClick={()=>jump(false)}>↓</button>
    <button type="button" aria-label="Close search" onClick={()=>{setSearchOpen(false);setReplaceOpen(false);setNotice('');}}>×</button>
   </div>
   {replaceOpen&&<div className="csi-replace-controls">
    <label><Icon name="replace" size={14}/><input type="text" value={replace} onChange={e=>setReplace(e.target.value)}
     onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();replaceCurrent();}}}
     aria-label="Replacement text" placeholder="Replace with…"/></label>
    <button type="button" disabled={disabled||readOnly||!query} onClick={replaceCurrent}>Replace</button>
    <button type="button" disabled={disabled||readOnly||!query} onClick={replaceAll}>Replace all</button>
   </div>}
  </div>}
  {settingsOpen&&<div className="csi-settings" aria-label="Editor preferences">
   <label>Font size <select aria-label="Editor font size" value={fontSize} onChange={e=>setFontSize(Number(e.target.value) as 12|14|16)}>
    <option value={12}>12 px</option><option value={14}>14 px</option><option value={16}>16 px</option></select></label>
   <label>Indentation <select aria-label="Spaces per indentation" value={indentWidth} onChange={e=>setIndentWidth(Number(e.target.value) as 2|4)}>
    <option value={2}>2 spaces</option><option value={4}>4 spaces</option></select></label>
   <label className="csi-check"><input type="checkbox" checked={lineNumbers} onChange={e=>setLineNumbers(e.target.checked)}/> Line numbers</label>
   <label className="csi-check"><input type="checkbox" checked={wordWrap} onChange={e=>setWordWrap(e.target.checked)}/> Word wrap</label>
   <small>Preferences are local to this editor view. Wrap hides the line gutter.</small>
  </div>}
  <div className="csi-surface">
   {lineNumbers&&!wordWrap&&!plain&&<div className="csi-gutter" aria-hidden="true">
    <div className="csi-line-track" style={{transform:'translateY('+-scroll.top+'px)'}}>
     {Array.from({length:codeLines},(_,i)=><div className={'csi-gutter-line'+(cursor.line===i+1?' is-active':'')} key={i}>{i+1}</div>)}
    </div>
   </div>}
   <div className="csi-code-viewport">
    {!plain&&<div className="csi-highlight-clip" aria-hidden="true">
     <pre className="csi-highlight" style={{transform:'translate('+-scroll.left+'px,'+-scroll.top+'px)'}}>
      <code>{lines.map((tokens,index)=><span className={'csi-source-line'+(cursor.line===index+1?' is-current':'')} key={index}>
       {tokens.map((t,j)=><span key={j} className={'csi-token-'+t.kind}>{t.text}</span>)}{index<lines.length-1?String.fromCharCode(10):''}
      </span>)}</code>
     </pre>
    </div>}
    <textarea id={id} className={'csi-input '+className} ref={textarea}
     value={value} onChange={e=>{onChange(e.target.value);setNotice('');}}
     onKeyDown={handleKeys} onSelect={syncSelection} onClick={syncSelection} onKeyUp={syncSelection}
     onScroll={e=>setScroll({top:e.currentTarget.scrollTop,left:e.currentTarget.scrollLeft})}
     disabled={disabled} readOnly={readOnly} spellCheck={false} autoCapitalize="off" autoCorrect="off"
     wrap={wordWrap?'soft':'off'} aria-label={'Edit source '+fileName} aria-describedby={ariaDescribedBy}
     aria-multiline="true" aria-readonly={disabled||readOnly} />
   </div>
  </div>
  <div className="csi-status">
   <span><Icon name="code" size={13}/>{language.toUpperCase()}</span>
   <span>Ln {cursor.line}, Col {cursor.column}{cursor.selection>0?' · '+cursor.selection+' selected':''}</span>
   <span>{codeLines} lines</span><span>{bytes.toLocaleString()} bytes</span>
   <span>{plain?'Large-file plain view':wordWrap?'Wrap':'No wrap'} · Spaces: {indentWidth}</span>
   <span>{status||'Local source · no execution'}</span>
  </div>
  {notice&&<p className="csi-notice" role="status">{notice}</p>}
  <p className="csi-safety">Syntax colors are a visual aid only. Source is never executed here.</p>
 </section>;
}

import {useEffect,useRef} from 'react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import 'monaco-editor/esm/vs/basic-languages/html/html.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution.js';
import 'monaco-editor/esm/vs/language/json/monaco.contribution.js';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import 'monaco-editor/esm/vs/editor/contrib/find/browser/findController.js';
import 'monaco-editor/esm/vs/editor/contrib/wordOperations/browser/wordOperations.js';
import 'monaco-editor/esm/vs/editor/contrib/bracketMatching/browser/bracketMatching.js';
import 'monaco-editor/esm/vs/editor/contrib/folding/browser/folding.js';
import {editorLanguage} from '../../../source-ide/language-v119.mjs';

/** The editor worker tokenizes text; creator source is never evaluated.
 * Models are unique to this mounted, session-bound workspace and disposed.
 * All editor and worker assets are built locally, without CDN credentials. */
(self as typeof self&{MonacoEnvironment?:{getWorker:(moduleId:string,label:string)=>Worker}}).MonacoEnvironment={getWorker:(_moduleId,label)=>label==='json'?new JsonWorker():new EditorWorker()};
export type MonacoSourceProps={files:Record<string,string>;active:string;disabled:boolean;onChange:(name:string,value:string)=>void;onCursor?:(line:number,column:number)=>void};
export default function MonacoSourceV136(props:MonacoSourceProps){
 const container=useRef<HTMLDivElement>(null),instance=useRef<monaco.editor.IStandaloneCodeEditor|null>(null);
 const models=useRef(new Map<string,monaco.editor.ITextModel>()),current=useRef(props),scope=useRef(crypto.randomUUID());
 const viewStates=useRef(new Map<string,monaco.editor.ICodeEditorViewState>()),shown=useRef(props.active);
 current.current=props;
 const modelFor=(name:string)=>{
  let model=models.current.get(name);
  if(!model){model=monaco.editor.createModel(current.current.files[name],editorLanguage(name),monaco.Uri.parse('inmemory://anevum/'+scope.current+'/'+name));models.current.set(name,model)}
  return model;
 };
 useEffect(()=>{
  if(!container.current)return;
  monaco.editor.defineTheme('continuance-v136',{base:'vs-dark',inherit:true,rules:[
   {token:'comment',foreground:'8AA5BA'},{token:'keyword',foreground:'C4A2FF'},
   {token:'string',foreground:'8FE3C0'},{token:'number',foreground:'F3C389'},
   {token:'tag',foreground:'77D8FF'}],colors:{'editor.background':'#06101D','editor.foreground':'#DEEDFA',
    'editorLineNumber.foreground':'#657D96','editorLineNumber.activeForeground':'#A2E8FF','editor.selectionBackground':'#31577E99',
    'editorCursor.foreground':'#9CE9FF','editor.lineHighlightBackground':'#15324C55','editorWidget.background':'#10253B'}});
  const editor=monaco.editor.create(container.current,{model:modelFor(current.current.active),theme:'continuance-v136',automaticLayout:true,
   fontFamily:'"Cascadia Code","SFMono-Regular",Consolas,monospace',fontSize:13,lineHeight:22,tabSize:2,
   minimap:{enabled:false},scrollBeyondLastLine:false,readOnly:current.current.disabled,accessibilitySupport:'auto',
   ariaLabel:'Source editor for '+current.current.active,wordWrap:'off',renderLineHighlight:'line',padding:{top:12},
   stickyScroll:{enabled:true},smoothScrolling:!matchMedia('(prefers-reduced-motion: reduce)').matches});
  instance.current=editor;
  const listener=editor.onDidChangeModelContent(()=>{
   const p=current.current,value=editor.getValue();if(value!==p.files[p.active])p.onChange(p.active,value);
  });
  const cursor=editor.onDidChangeCursorPosition(event=>current.current.onCursor?.(event.position.lineNumber,event.position.column));
  return()=>{cursor.dispose();listener.dispose();editor.dispose();instance.current=null;models.current.forEach(m=>m.dispose());models.current.clear();viewStates.current.clear()};
 },[]);
 useEffect(()=>{
  const editor=instance.current;if(!editor)return;
  if(shown.current!==props.active){
   const saved=editor.saveViewState();if(saved)viewStates.current.set(shown.current,saved);
  }
  const model=modelFor(props.active);if(model.getValue()!==props.files[props.active])model.setValue(props.files[props.active]);
  if(editor.getModel()!==model){
   editor.setModel(model);
   const saved=viewStates.current.get(props.active);if(saved)editor.restoreViewState(saved);
  }
  shown.current=props.active;
  editor.updateOptions({readOnly:props.disabled,ariaLabel:'Source editor for '+props.active});
  for(const [name,m] of models.current)if(!(name in props.files)){m.dispose();models.current.delete(name);viewStates.current.delete(name)}
  if(props.active.endsWith('.json')){
   try{JSON.parse(props.files[props.active]);monaco.editor.setModelMarkers(model,'continuance',[])}
   catch{monaco.editor.setModelMarkers(model,'continuance',[{message:'Invalid JSON. Check the structure before packaging.',severity:monaco.MarkerSeverity.Error,startLineNumber:1,startColumn:1,endLineNumber:1,endColumn:2}])}
  }
 },[props.active,props.files,props.disabled]);
 return <div ref={container} className="p136-source-monaco" data-source-editor="monaco"/>;
}

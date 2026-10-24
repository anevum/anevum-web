import {useMemo,useReducer,useState} from 'react';
import {Link} from 'react-router-dom';
import {OrbitalMark} from '../components/OrbitalMark';
import {Icon} from '../components/Icons';
import {apply,encode,primitive,starter,type WorldDocument,type WorldNode,
 type WorldCommand,type WorldKind,type Vec3,type WorldCamera,type WorldMaterial}
 from '../../../world-composer/document.mjs';
import {WorldCanvasV115} from './WorldCanvasV115';
import './creator-studio-visual-v115.css';
import './world-composer-v115.css';

/** Review-only P1 GPU workspace. All edits stay in React memory; explicit
 * exported document text never reaches canonical member DB or publication.
 * The existing V111 private source layer is NOT bypassed by this prototype.
 */
type ReviewState={
 document:WorldDocument;selected:string|null;past:WorldDocument[];
 future:WorldDocument[];error:string;
};
type Action=
 |{type:'COMMAND';command:WorldCommand}
 |{type:'SELECT';id:string|null}
 |{type:'UNDO'}|{type:'REDO'}|{type:'RESET'};
const first=starter();
const initial:ReviewState={document:first,selected:'spire',past:[],future:[],error:''};
function reducer(state:ReviewState,action:Action):ReviewState{
 switch(action.type){
  case 'COMMAND':
   try{
    const result=apply(state.document,action.command);
    return {document:result,selected:action.command.type==='ADD_NODE'?action.command.node.id:state.selected,
     past:[...state.past,state.document].slice(-48),future:[],error:''};
   }catch(error){return {...state,error:error instanceof Error?error.message:'Invalid world change'};}
  case 'SELECT':
   return {...state,selected:action.id&&state.document.nodes.some(n=>n.id===action.id)?action.id:null,error:''};
  case 'UNDO':{
   if(!state.past.length)return state;
   return {...state,document:state.past[state.past.length-1],
    past:state.past.slice(0,-1),future:[state.document,...state.future].slice(0,48),error:''};
  }
  case 'REDO':{
   if(!state.future.length)return state;
   return {...state,document:state.future[0],
    past:[...state.past,state.document].slice(-48),future:state.future.slice(1),error:''};
  }
  case 'RESET':return {document:starter(),selected:'spire',past:[],future:[],error:''};
 }
}
const KINDS:{kind:WorldKind;name:string}[]=[
 {kind:'cube',name:'Cube'},{kind:'sphere',name:'Sphere'},
 {kind:'spire',name:'Spire'},{kind:'island',name:'Island'},{kind:'light',name:'Light'}
];
const MATERIALS:WorldMaterial[]=['stone','grass','gold','glass','cyan','slate','violet','water'];
const AXES=['X','Y','Z'] as const;
type Panel='objects'|'inspector'|'closed';
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

export function WorldComposerReviewV115(){
 const [state,dispatch]=useReducer(reducer,initial);
 const [camera,setCamera]=useState<WorldCamera>(initial.document.camera);
 const [panel,setPanel]=useState<Panel>('closed');
 const [treeQuery,setTreeQuery]=useState('');
 const [showSource,setShowSource]=useState(false);
 const [serial,setSerial]=useState(1);
 const {document:scene,selected,past,future,error}=state;
 const node=scene.nodes.find(n=>n.id===selected)||null;
 const source=useMemo(()=>encode(scene),[scene]);
 const filtered=useMemo(()=>scene.nodes.filter(n=>(n.name+' '+n.kind).toLowerCase().includes(treeQuery.trim().toLowerCase())),[scene.nodes,treeQuery]);
 function command(next:WorldCommand){dispatch({type:'COMMAND',command:next});}
 function add(kind:WorldKind){
  let i=serial,id='sample-'+i;
  while(scene.nodes.some(n=>n.id===id)){i+=1;id='sample-'+i;}
  setSerial(i+1);
  command({type:'ADD_NODE',node:primitive(id,kind)});
  setPanel('closed');
 }
 function transform(field:'position'|'rotation'|'scale',index:0|1|2,value:number){
  if(!node||!Number.isFinite(value))return;
  const min=field==='scale'?0.1:field==='rotation'?-6.284:-40;
  const max=field==='scale'?6:field==='rotation'?6.284:40;
  const next=[...node[field]] as Vec3;
  next[index]=clamp(value,min,max);
  command({type:'SET_TRANSFORM',id:node.id,field,value:next});
 }
 function reset(){dispatch({type:'RESET'});setCamera(starter().camera);setPanel('closed');setShowSource(false);}
 return <section className="cvs-root cvw-root" data-world-composer-v115="source-only" aria-label="ANEVUM World Composer WebGL2 prototype">
  <div className="cvs-review-banner" role="status"><span className="cvs-flash"/> P1 / LIVE WEBGL2 WORLD PROTOTYPE
   <span className="cvs-banner-sep">/</span> SYNTHETIC PRIVATE SAMPLE
   <span className="cvs-banner-sep">/</span> NO DATABASE WRITES
  </div>
  <header className="cvs-head">
   <div className="cvs-head-brand"><OrbitalMark className="cvs-mark"/><div><span>ANEVUM / CONTINUANCE INSTITUTE</span><h1>World <b>Composer</b></h1></div></div>
   <div className="cvs-head-links"><span className="cvs-head-version">WORLD FORMAT <strong>V1</strong></span>
    {import.meta.env.VITE_CREATOR_VISUAL_REVIEW_V115==='true'?<Link to="/studio/visual-review" className="cvs-link">Visual overview <Icon name="arrow" size={16}/></Link>:<Link to="/studio" className="cvs-link">Studio home <Icon name="arrow" size={16}/></Link>}</div>
  </header>
  <div className="cvs-studio">
   <div className="cvs-projectbar">
    <div className="cvs-projectidentity"><span className="cvs-project-thumb"><OrbitalMark/></span><div>
     <small>DECLARATIVE WORLD / UNSAVED REVIEW</small>
     <strong>{scene.name}</strong>
    </div><span className="cvs-draft">LOCAL ONLY</span></div>
    <div className="cvs-project-actions">
     <span className="cvs-save-state">{past.length?'● UNSAVED LOCAL EDITS':'● PRIVATE SAMPLE / NOT PERSISTED'}</span>
     <button type="button" className="cvs-action" onClick={()=>dispatch({type:'UNDO'})} disabled={!past.length} aria-label="Undo scene edit">Undo</button>
     <button type="button" className="cvs-action" onClick={()=>dispatch({type:'REDO'})} disabled={!future.length} aria-label="Redo scene edit">Redo</button>
     <button type="button" className="cvs-action" onClick={reset}>Reset</button>
     <button type="button" disabled className="cvs-primary" title="Saving requires separately approved V111 private project persistence">Save revision <Icon name="save" size={14}/></button>
    </div>
   </div>
   <div className="cvw-grid">
    <aside className={'cvw-explorer cvs-pane'+(panel==='objects'?' is-mobile-open':'')} aria-label="Scene hierarchy">
     <div className="cvs-pane-title"><div><small>SCENE EXPLORER</small><h2>Objects / {scene.nodes.length}</h2></div>
      <button type="button" className="cvw-close" onClick={()=>setPanel('closed')} aria-label="Close objects panel">×</button></div>
     <label className="cvs-search"><Icon name="search" size={15}/><input type="search" value={treeQuery} onChange={event=>setTreeQuery(event.target.value)} placeholder="Find object…" aria-label="Filter world objects"/></label>
     <div className="cvw-tree">{filtered.map(item=><button key={item.id} type="button"
      aria-pressed={selected===item.id} className={'cvw-tree-node'+(selected===item.id?' is-selected':'')}
      onClick={()=>{dispatch({type:'SELECT',id:item.id});setPanel('closed')}}><span className="cvw-node-glyph" aria-hidden="true">◇</span><span>{item.name}<small>{item.kind} · {item.material}</small></span></button>)}
      {filtered.length===0&&<p className="cvs-muted">No matching objects.</p>}
     </div>
     <div className="cvw-add-panel"><span className="cvs-subheading">ADD PRIMITIVE</span><div className="cvw-primitive-grid">
      {KINDS.map(item=><button type="button" key={item.kind} onClick={()=>add(item.kind)}>+ {item.name}</button>)}
     </div></div>
     <p className="cvs-explorer-note">Owner-scoped file storage is not enabled in this preview. World operations update this tab's in-memory document only.</p>
    </aside>
    <div className="cvw-workspace">
     <div className="cvs-mode-header"><div className="cvs-mode-label"><span>SCENE COMPOSER / REAL GEOMETRY</span><strong>Sky Archipelago — editable world</strong></div><span className="cvs-chip"><i/> PRIVATE GPU REVIEW</span></div>
     <div className="cvw-toolbar"><span>ORBIT · PICK · TRANSFORM</span><div>
      <button type="button" aria-label="Zoom camera in" onClick={()=>setCamera(c=>({...c,distance:clamp(c.distance-2,4,80)}))}>Zoom +</button>
      <button type="button" aria-label="Zoom camera out" onClick={()=>setCamera(c=>({...c,distance:clamp(c.distance+2,4,80)}))}>Zoom −</button>
      <button type="button" onClick={()=>setCamera(scene.camera)}>Reset camera</button>
      <button type="button" aria-expanded={showSource} onClick={()=>setShowSource(v=>!v)}>{showSource?'Hide world document':'Inspect world document'}</button></div></div>
     <div className="cvw-stage" role="region" aria-label="Live world composer">
      <WorldCanvasV115 document={scene} camera={camera} selection={selected}
       onCamera={setCamera} onSelect={id=>dispatch({type:'SELECT',id})}/>
      <div className="cvw-selection-chip"><span>SELECTED OBJECT</span><strong>{node?.name||'None'}</strong></div>
     </div>
     <div className="cvw-world-footer"><span>ACTUAL MESH DRAW CALLS · OBJECT PICKING · CAMERA ORBIT</span>
      <span>{scene.nodes.length} OBJECTS / MAX 64</span>
      <span>{new TextEncoder().encode(source).length.toLocaleString()} / 32,768 BYTES</span></div>
     {showSource&&<section className="cvw-source"><div><strong>ANEVUM_WORLD_V1</strong><span>Read-only encoded document / no save</span></div>
      <textarea aria-label="Read-only ANEVUM world document" readOnly value={source} rows={7} onFocus={event=>event.currentTarget.select()}/></section>}
     {error&&<p role="alert" className="cvw-error">{error}</p>}
     <div className="cvw-mobile-tabs" role="group" aria-label="Mobile world editor panels">
      <button type="button" aria-pressed={panel==='objects'} onClick={()=>setPanel('objects')}>Objects</button>
      <button type="button" aria-pressed={panel==='inspector'} onClick={()=>setPanel('inspector')}>Inspector</button>
      <button type="button" onClick={()=>window.dispatchEvent(new Event('anevum:iren-open'))}>IREN</button>
     </div>
    </div>
    <aside className={'cvw-inspector cvs-pane'+(panel==='inspector'?' is-mobile-open':'')} aria-label="World object inspector">
     <div className="cvs-pane-title"><div><small>CONTEXT INSPECTOR</small><h2>{node?.name||'Select an object'}</h2></div>
      <button type="button" className="cvw-close" onClick={()=>setPanel('closed')} aria-label="Close inspector">×</button></div>
     {node?<div className="cvw-inspector-content">
      <div className="cvs-subheading">OBJECT TRANSFORM</div>
      {(['position','rotation','scale'] as const).map(field=><fieldset key={field} className="cvw-vector">
       <legend>{field}</legend><div>{AXES.map((axis,i)=><label key={axis}><span>{axis}</span><input type="number"
        value={node[field][i]} step={field==='rotation'?0.1:field==='scale'?0.1:.5}
        min={field==='scale'?0.1:field==='rotation'?-6.284:-40}
        max={field==='scale'?6:field==='rotation'?6.284:40}
        onChange={event=>transform(field,i as 0|1|2,event.target.valueAsNumber)}/></label>)}</div>
      </fieldset>)}
      <label className="cvw-select">Material <select value={node.material} onChange={e=>command({type:'SET_MATERIAL',id:node.id,material:e.target.value as WorldMaterial})}>
       {MATERIALS.map(m=><option value={m} key={m}>{m}</option>)}</select></label>
      <button type="button" className="cvw-remove" onClick={()=>command({type:'DELETE_NODE',id:node.id})}>Remove selected object</button>
     </div>:<p className="cvs-muted">Select an object from the canvas or hierarchy to edit it.</p>}
     <div className="cvw-env"><div className="cvs-subheading">ENVIRONMENT / REAL LIGHT UNIFORM</div>
      <label>Sun intensity <strong>{scene.environment.sunIntensity.toFixed(2)}</strong>
       <input type="range" min={0} max={2} step={.05} value={scene.environment.sunIntensity}
        onChange={e=>command({type:'SET_ENVIRONMENT',sky:scene.environment.sky,sunIntensity:Number(e.target.value)})}/></label>
      <label>Sky preset <select value={scene.environment.sky}
       onChange={e=>command({type:'SET_ENVIRONMENT',sky:e.target.value as 'day'|'night',sunIntensity:scene.environment.sunIntensity})}>
       <option value="day">Daylight</option><option value="night">Nebula night</option></select></label>
     </div>
     <div className="cvw-inspector-note"><span>IREN / ONE SHARED COMPANION</span><p>Studio-specific AI commands are still disconnected. Existing IREN can be opened without granting it access to this scene.</p>
      <button type="button" onClick={()=>window.dispatchEvent(new Event('anevum:iren-open'))}>Open IREN help <Icon name="arrow" size={14}/></button></div>
    </aside>
    {panel!=='closed'&&<button className="cvw-backdrop" type="button" aria-label="Close mobile panel" onClick={()=>setPanel('closed')}/>}
   </div>
   <footer className="cvs-status"><span><i/> WEBGL2 WORLD COMPOSER / REVIEW</span><span>NO AI CALLS · NO CLOUD GPU · NO DATABASE WRITES</span><span>ACTUAL 3D, SYNTHETIC ONLY</span></footer>
  </div>
 </section>;
}

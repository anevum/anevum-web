import {useMemo,useReducer,useState} from 'react';
import {Link} from 'react-router-dom';
import {OrbitalMark} from '../components/OrbitalMark';
import {Icon} from '../components/Icons';
import {apply,encode,primitive,starter,type WorldDocument,type WorldNode,
 type WorldCommand,type WorldKind,type Vec3,type WorldCamera,type WorldMaterial}
 from '../../../world-composer/document.mjs';
import {WorldCanvasV115} from './WorldCanvasV115';
import {StudioModeRailV116,StudioTopModesV116,StudioFileTreeV116,type StudioFileChoice,type StudioModeV116} from './StudioNavigationV116';
import {StudioAssetShelfV116,type StudioAsset} from './StudioAssetShelfV116';
import {StudioOtherModesV116} from './StudioOtherModesV116';
import {StudioTransformPadV117} from './StudioTransformPadV117';
import {StudioContextPanelV117} from './StudioContextPanelV117';
import './creator-studio-visual-v115.css';
import './world-composer-v115.css';
import './studio-next-v116.css';
import './studio-world-v117.css';

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
    const newSelection=action.command.type==='ADD_NODE'?action.command.node.id:
     result.nodes.some(n=>n.id===state.selected)?state.selected:result.nodes[0]?.id||null;
    return {document:result,selected:newSelection,
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
 {kind:'spire',name:'Spire'},{kind:'island',name:'Island'},{kind:'starship',name:'Starcraft'},{kind:'light',name:'Light'}
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
 const [mode,setMode]=useState<StudioModeV116>('Scene');
 const [assetShelfOpen,setAssetShelfOpen]=useState(true);
 const [lightingOpen,setLightingOpen]=useState(true);
 const [inspectorTab,setInspectorTab]=useState<'properties'|'iren'>('properties');
 const [fileNotice,setFileNotice]=useState('');
 const [sceneHierarchyOpen,setSceneHierarchyOpen]=useState(true);
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
 function addAsset(asset:StudioAsset){
  if(!asset.kind)return;
  let i=serial,id='sample-'+i;
  while(scene.nodes.some(n=>n.id===id)){i+=1;id='sample-'+i;}
  setSerial(i+1);
  const core=primitive(id,asset.kind==='bridge'||asset.kind==='waterfall'?'cube':asset.kind);
  const added:WorldNode={...core,kind:asset.kind,name:asset.title,material:asset.material||core.material};
  command({type:'ADD_NODE',node:added});
  setMode('Scene');setPanel('closed');
 }
 function openSampleFile(file:StudioFileChoice){
  const next:StudioModeV116=file.role==='world'?'Scene':file.role==='interface'?'Interface':
   file.role==='script'?'Scripts':file.role==='asset'?'Assets':
   file.role==='playtest'?'Playtest':file.role==='config'?'Scene':'Assets';
  setMode(next);
  setFileNotice(file.path+' — sample structure only; no member file opened.');
  setPanel('closed');
 }
 function nudge(delta:Vec3){
  if(!node)return;
  const position=node.position.map((value,i)=>clamp(value+delta[i],-40,40)) as Vec3;
  if(position.every((value,i)=>value===node.position[i]))return;
  command({type:'SET_TRANSFORM',id:node.id,field:'position',value:position});
 }
 function frameSelected(){
  if(!node)return;
  const height=node.kind==='spire'?2.1*node.scale[1]:
   node.kind==='waterfall'?-3.0*node.scale[1]:
   node.kind==='island'?-.7*node.scale[1]:0;
  const target:Vec3=[node.position[0],clamp(node.position[1]+height,-40,40),node.position[2]];
  const distance=node.kind==='spire'?Math.max(22,13*node.scale[1]):
   node.kind==='island'?Math.max(17,9*node.scale[0]):
   node.kind==='bridge'?Math.max(22,21*node.scale[0]):
   node.kind==='waterfall'?Math.max(17,13*node.scale[1]):
   node.kind==='starship'?16:14;
  setCamera(c=>({...c,target,distance:clamp(distance,4,80)}));
 }
 function transform(field:'position'|'rotation'|'scale',index:0|1|2,value:number){
  if(!node||!Number.isFinite(value))return;
  const min=field==='scale'?0.1:field==='rotation'?-6.284:-40;
  const max=field==='scale'?6:field==='rotation'?6.284:40;
  const next=[...node[field]] as Vec3;
  next[index]=clamp(value,min,max);
  command({type:'SET_TRANSFORM',id:node.id,field,value:next});
 }
 function reset(){dispatch({type:'RESET'});setCamera(starter().camera);setPanel('closed');setShowSource(false);setFileNotice('');}
 return <section className="cvs-root cvw-root" data-world-composer-v115="source-only" aria-label="ANEVUM World Composer WebGL2 prototype">
  <div className="cvs-review-banner" role="status"><span className="cvs-flash"/> CREATOR STUDIO / NEXT INTERACTIVE BUILD
   <span className="cvs-banner-sep">/</span> SYNTHETIC SAMPLE
   <span className="cvs-banner-sep">/</span> PRIVATE · UNSAVED
  </div>
  <header className="cvs-head">
   <div className="cvs-head-brand"><OrbitalMark className="cvs-mark"/><div><span>THE CREATIVE NETWORK / CONTINUANCE INSTITUTE</span><h1>ANEVUM <b>/ CREATOR STUDIO</b></h1></div></div>
   {/* Site-wide ANEVUM navigation already sits above the editor. */}
   <div className="cvs-head-links"><span className="cvs-head-version">WORLD FORMAT <strong>V1</strong></span><Link to="/studio" className="cvs-link">My space <Icon name="arrow" size={16}/></Link></div>
  </header>
  <div className="cvs-studio">
   <div className="cvs-projectbar">
    <div className="cvs-projectidentity"><span className="cvs-project-thumb"><OrbitalMark/></span><div>
     <small>PROJECT / ASTRA PRIME</small>
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
    <StudioModeRailV116 mode={mode} onChange={setMode}/>
    <aside className={'cvw-explorer cvs-pane'+(panel==='objects'?' is-mobile-open':'')} aria-label="Scene hierarchy">
     <div className="cvs-pane-title"><div><small>PROJECT EXPLORER</small><h2>Astra Prime</h2></div>
      <button type="button" className="cvw-close" onClick={()=>setPanel('closed')} aria-label="Close objects panel">×</button></div>
     <StudioFileTreeV116 onOpen={openSampleFile}/>
     <div className="csn-scene-heading"><button type="button" aria-expanded={sceneHierarchyOpen} onClick={()=>setSceneHierarchyOpen(x=>!x)}>SCENE OBJECTS <span>{scene.nodes.length} OBJECTS {sceneHierarchyOpen?'⌄':'›'}</span></button></div>
     <div className={sceneHierarchyOpen?'csn-scene-list':'csn-scene-list is-collapsed'}>
     <label className="cvs-search"><Icon name="search" size={15}/><input type="search" value={treeQuery} onChange={event=>setTreeQuery(event.target.value)} placeholder="Find object…" aria-label="Filter world objects"/></label>
     <div className="cvw-tree">{filtered.map(item=><button key={item.id} type="button"
      aria-pressed={selected===item.id} className={'cvw-tree-node'+(selected===item.id?' is-selected':'')}
      onClick={()=>{dispatch({type:'SELECT',id:item.id});setPanel('closed')}}><span className="cvw-node-glyph" aria-hidden="true">◇</span><span>{item.name}<small>{item.kind} · {item.material}</small></span></button>)}
      {filtered.length===0&&<p className="cvs-muted">No matching objects.</p>}
     </div>
     <div className="cvw-add-panel"><span className="cvs-subheading">ADD PRIMITIVE</span><div className="cvw-primitive-grid">
      {KINDS.map(item=><button type="button" key={item.kind} onClick={()=>add(item.kind)}>+ {item.name}</button>)}
     </div></div>
     </div>
      <p className="cvs-explorer-note">Navigation shows a local project fixture. Verified V111 files and revisions remain separate; this browser preview does not persist changes.</p>
    </aside>
    <div className="cvw-workspace">
     <StudioTopModesV116 mode={mode} onChange={setMode}/>
     <div className="cvs-mode-header"><div className="cvs-mode-label"><span>WORKSPACE / {mode.toUpperCase()}</span><strong>{mode==='Scene'||mode==='Playtest'?'Sky Archipelago':mode==='Scripts'?'Script Editor':mode==='Assets'?'Asset Foundry':mode==='Interface'?'Interface Builder':'Publish & Deploy'}</strong></div><span className="cvs-chip"><i/> LOCAL DESIGN REVIEW</span></div>
     {fileNotice&&<div className="csn-file-notice" role="status"><span>{fileNotice}</span><button type="button" onClick={()=>setFileNotice('')} aria-label="Dismiss file notice">×</button></div>}
     {(mode==='Scene'||mode==='Playtest')?<>
     <div className="cvw-toolbar"><span>{mode==='Playtest'?'3D VISUAL PLAYTEST / NO SCRIPTS':'SELECT · MOVE · ROTATE · SCALE'}</span><div>
      <button type="button" aria-label="Zoom camera in" onClick={()=>setCamera(c=>({...c,distance:clamp(c.distance-2,4,80)}))}>Zoom +</button>
      <button type="button" aria-label="Zoom camera out" onClick={()=>setCamera(c=>({...c,distance:clamp(c.distance+2,4,80)}))}>Zoom −</button>
      <button type="button" onClick={()=>setCamera(scene.camera)}>Reset camera</button>
      <button type="button" aria-expanded={showSource} onClick={()=>setShowSource(v=>!v)}>{showSource?'Hide world document':'Inspect world document'}</button></div></div>
     <div className="cvw-stage" role="region" aria-label="Live world composer">
      <WorldCanvasV115 document={scene} camera={camera} selection={selected}
       onCamera={setCamera} onSelect={id=>dispatch({type:'SELECT',id})}
       onNudge={nudge}/>
      <div className="cvw-selection-chip"><span>SELECTED OBJECT</span><strong>{node?.name||'None'}</strong></div>
      <div className="csn-scene-light">
       <button type="button" aria-expanded={lightingOpen} aria-controls="csn-floating-lighting" onClick={()=>setLightingOpen(v=>!v)}>SCENE LIGHTING <span aria-hidden="true">{lightingOpen?'⌃':'⌄'}</span></button>
       {lightingOpen&&<div id="csn-floating-lighting"><div className="csn-light-visual"><span/><span/><span/></div>
        <label>Time of day <select value={scene.environment.sky} onChange={e=>command({type:'SET_ENVIRONMENT',sky:e.target.value as 'day'|'night',sunIntensity:scene.environment.sunIntensity})}>
         <option value="day">Daylight</option><option value="night">Nebula night</option></select></label>
        <label>Sun intensity <input type="range" min={0} max={2} step={.05} value={scene.environment.sunIntensity}
         onChange={e=>command({type:'SET_ENVIRONMENT',sky:scene.environment.sky,sunIntensity:Number(e.target.value)})}/></label>
       </div>}
      </div>
     </div>
     <div className="cvw-world-footer"><span>GPU WEBGL2 / CAMERA & OBJECT EDITOR</span>
      <span>{scene.nodes.length} OBJECTS / MAX 64</span>
      <span>{new TextEncoder().encode(source).length.toLocaleString()} / 32,768 BYTES</span></div>
     {mode==='Scene'&&<StudioAssetShelfV116 onAdd={addAsset} expanded={assetShelfOpen} onToggle={()=>setAssetShelfOpen(v=>!v)}/>}
     {mode==='Playtest'&&<div className="csn-playtest-note" role="status">Visual playtest uses the live WebGL2 camera and objects. Game scripts, collision, networking and publishing are not active in this review.</div>}
     {showSource&&<section className="cvw-source"><div><strong>ANEVUM_WORLD_V1</strong><span>Read-only encoded document / no save</span></div>
      <textarea aria-label="Read-only ANEVUM world document" readOnly value={source} rows={7} onFocus={event=>event.currentTarget.select()}/></section>}
     {error&&<p role="alert" className="cvw-error">{error}</p>}
     </>:<StudioOtherModesV116 mode={mode} onAdd={addAsset}/>}
     <div className="cvw-mobile-tabs" role="group" aria-label="Mobile world editor panels">
      <button type="button" aria-pressed={panel==='objects'} onClick={()=>setPanel('objects')}>Objects</button>
      <button type="button" aria-pressed={panel==='inspector'} onClick={()=>setPanel('inspector')}>Inspector</button>
      <button type="button" onClick={()=>{setInspectorTab('iren');setPanel('inspector')}}>IREN</button>
     </div>
    </div>
    <aside className={'cvw-inspector cvs-pane'+(panel==='inspector'?' is-mobile-open':'')} aria-label="World object inspector">
     <div className="csn-inspector-tabs" role="group" aria-label="Context panels"><button type="button" aria-pressed={inspectorTab==='properties'} onClick={()=>setInspectorTab('properties')}>INSPECTOR</button><button type="button" aria-pressed={inspectorTab==='iren'} onClick={()=>setInspectorTab('iren')}>IREN</button>
      <button type="button" className="cvw-close" onClick={()=>setPanel('closed')} aria-label="Close inspector">×</button></div>
     {inspectorTab==='properties'?(mode==='Scene'||mode==='Playtest'?<><div className="cvs-pane-title csn-context-title"><div><small>SELECTED OBJECT</small><h2>{node?.name||'Select an object'}</h2></div></div>
     {node?<div className="cvw-inspector-content">
      <div className="cvs-subheading">OBJECT TRANSFORM</div>
      {(['position','rotation','scale'] as const).map(field=><fieldset key={field} className="cvw-vector">
       <legend>{field}</legend><div>{AXES.map((axis,i)=><label key={axis}><span>{axis}</span><input type="number"
        value={node[field][i]} step={field==='rotation'?0.1:field==='scale'?0.1:.5}
        min={field==='scale'?0.1:field==='rotation'?-6.284:-40}
        max={field==='scale'?6:field==='rotation'?6.284:40}
        onChange={event=>transform(field,i as 0|1|2,event.target.valueAsNumber)}/></label>)}</div>
      </fieldset>)}
      <StudioTransformPadV117 position={node.position} onMove={nudge}
       onFrame={frameSelected}/>
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
     </>:<StudioContextPanelV117 mode={mode} objects={scene.nodes.length} documentBytes={new TextEncoder().encode(source).length}
        onNavigate={setMode}/>):<div className="csn-iren-panel">
      <div className="csn-iren-identity"><div className="csn-iren-symbol"><OrbitalMark/></div><div><small>IREN / CREATIVE COPILOT</small><strong>Design intelligence</strong><span>Existing companion · no scene access</span></div></div>
      <p>IREN's future Studio integration will inspect selected objects and propose typed changes for review. This prototype does not send prompts or execute model calls.</p>
      <div className="csn-iren-suggestions"><span>FUTURE CAPABILITIES</span><div>Generate a world plan</div><div>Build an interface</div><div>Find and validate assets</div><div>Inspect scene scripts</div></div>
      <button type="button" onClick={()=>window.dispatchEvent(new Event('anevum:iren-open'))}>Open existing IREN <Icon name="arrow" size={15}/></button>
     </div>}
    </aside>
    {panel!=='closed'&&<button className="cvw-backdrop" type="button" aria-label="Close mobile panel" onClick={()=>setPanel('closed')}/>}
   </div>
   <footer className="cvs-status"><span><i/> CREATOR STUDIO / INSTRUMENT GLASS</span><span>LOCAL GPU · NO MEMBER WRITES · NO CLOUD GPU</span><span>{mode.toUpperCase()} / {scene.nodes.length} OBJECTS / UNSAVED SAMPLE</span></footer>
  </div>
 </section>;
}

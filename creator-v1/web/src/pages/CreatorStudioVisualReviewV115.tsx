import {useEffect,useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {OrbitalMark} from '../components/OrbitalMark';
import {Icon} from '../components/Icons';
import './creator-studio-visual-v115.css';

/**
 * Source-only P0 visual acceptance fixture. Every name/object/asset is synthetic.
 * No member session, private data, file save, upload, code execution, AI call,
 * GPU renderer or publication takes place here. This is NOT a real 3D editor.
 */
type Mode='World'|'Interface'|'Code'|'Assets'|'Playtest'|'Publish';
type Panel='explorer'|'inspector'|'assets'|'none';
type InspectorTab='properties'|'assistant';
type Tool='Select'|'Move'|'Rotate'|'Scale';
type SceneObject={id:string;name:string;kind:string;x:number;y:number;z:number;scale:number};
type Asset={name:string;kind:string;symbol:string;hue:string};
const STARTERS:SceneObject[]=[
 {id:'world',name:'Sky Archipelago',kind:'Environment',x:0,y:0,z:0,scale:1},
 {id:'spire',name:'Astra Spire',kind:'Architecture',x:1,y:8,z:-2,scale:1},
 {id:'bridge',name:'Horizon Bridge',kind:'Architecture',x:-5,y:2,z:2,scale:1},
 {id:'falls',name:'Cascade Falls',kind:'VFX / Water',x:7,y:-3,z:0,scale:1},
 {id:'light',name:'Sol Light Rig',kind:'Lighting',x:0,y:12,z:4,scale:1}
];
const MODES:{mode:Mode;icon:string;hint:string}[]=[
 {mode:'World',icon:'explore',hint:'World Composer'},
 {mode:'Interface',icon:'library',hint:'Interface Builder'},
 {mode:'Code',icon:'create',hint:'Source & Logic'},
 {mode:'Assets',icon:'save',hint:'Asset Foundry'},
 {mode:'Playtest',icon:'star',hint:'Playtest'},
 {mode:'Publish',icon:'arrow',hint:'Publish'}
];
const ASSETS:Asset[]=[
 {name:'Floating Island',kind:'Environment',symbol:'island',hue:'island'},
 {name:'Astra Spire',kind:'Architecture',symbol:'spire',hue:'tower'},
 {name:'Sky Bridge',kind:'Architecture',symbol:'bridge',hue:'bridge'},
 {name:'Starcraft',kind:'Vehicle',symbol:'craft',hue:'craft'},
 {name:'Lumen Bloom',kind:'Nature',symbol:'bloom',hue:'flower'},
 {name:'Energy Core',kind:'Effect',symbol:'core',hue:'core'}
];
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

function SampleScene({night,light}:{night:boolean;light:number}){
 return <svg className={'cvs-scene-art'+(night?' is-night':'')} viewBox="0 0 1180 590"
  preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" style={{filter:'brightness('+(0.62+light/175)+')'}}>
  <defs>
   <linearGradient id="cvs-sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#071b3b"/><stop offset=".42" stopColor="#225479"/><stop offset=".75" stopColor="#78a3b3"/><stop offset="1" stopColor="#e7b892"/></linearGradient>
   <radialGradient id="cvs-sun"><stop stopColor="#fff3d9" stopOpacity=".85"/><stop offset=".17" stopColor="#ead9c6" stopOpacity=".3"/><stop offset="1" stopColor="#d2e5ff" stopOpacity="0"/></radialGradient>
   <linearGradient id="cvs-rock" x1="0" y1="0" x2=".2" y2="1"><stop stopColor="#96a2a0"/><stop offset=".26" stopColor="#485b66"/><stop offset="1" stopColor="#14253b"/></linearGradient>
   <linearGradient id="cvs-crest" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b6cfb1"/><stop offset=".5" stopColor="#6f9e80"/><stop offset="1" stopColor="#37665e"/></linearGradient>
   <linearGradient id="cvs-build" x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#f1e5c9"/><stop offset=".32" stopColor="#b1ccd0"/><stop offset="1" stopColor="#5b758c"/></linearGradient>
   <linearGradient id="cvs-water" x1="0" y1="0" x2=".4" y2="1"><stop stopColor="#e9ffff" stopOpacity=".96"/><stop offset="1" stopColor="#71b9e6" stopOpacity=".09"/></linearGradient>
   <linearGradient id="cvs-planet" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#aabbd5"/><stop offset=".6" stopColor="#527a9c"/><stop offset="1" stopColor="#102544"/></linearGradient>
   <filter id="cvs-glow"><feGaussianBlur stdDeviation="9"/></filter>
   <filter id="cvs-cloudblur"><feGaussianBlur stdDeviation="16"/></filter>
  </defs>
  <rect width="1180" height="590" fill="url(#cvs-sky)"/>
  <circle cx="997" cy="92" r="240" fill="url(#cvs-sun)"/>
  <g opacity=".62" stroke="#dcecf9" strokeWidth=".6">
   <path d="M58 48h2M120 91h1M203 45h2M293 108h1M372 39h2M470 72h2M594 34h1M741 85h2M858 32h2M1090 54h1M1130 171h1M122 160h1M684 149h1"/>
  </g>
  <circle cx="870" cy="95" r="103" fill="url(#cvs-planet)" opacity=".86"/>
  <path d="M792 115c33-22 117-30 163 9 M800 80c35 12 97 5 137-18 M823 159c49-17 89-8 119-5" fill="none" stroke="#b7d3e5" strokeOpacity=".28" strokeWidth="7"/>
  <circle cx="1035" cy="147" r="26" fill="#c7d9ea" opacity=".73"/>
  <ellipse cx="1035" cy="147" rx="34" ry="10" fill="none" stroke="#e9d0ba" strokeWidth="3" opacity=".5" transform="rotate(-17 1035 147)"/>
  <g filter="url(#cvs-cloudblur)" opacity=".52" fill="#e8f9ff">
   <ellipse cx="123" cy="406" rx="224" ry="44"/><ellipse cx="904" cy="440" rx="332" ry="64"/>
   <ellipse cx="419" cy="533" rx="300" ry="70"/><ellipse cx="687" cy="325" rx="128" ry="21"/>
  </g>
  <path d="M0 418 Q135 364 260 405T556 416T1180 379V590H0Z" fill="#8db1c1" opacity=".24"/>
  <g className="cvs-back-island" opacity=".72">
   <path d="M6 349L153 291 269 321 317 367 227 407 167 483 99 418Z" fill="url(#cvs-rock)"/>
   <path d="M6 349L153 291 269 321 317 367 214 335 99 363Z" fill="url(#cvs-crest)"/>
   <path d="M90 332L114 258 141 247 160 316M185 319L203 228 226 218 237 329" fill="url(#cvs-build)"/>
  </g>
  <g className="cvs-island-right">
   <path d="M711 343 L905 266 1096 311 1180 358 1085 431 986 553 908 458 811 424Z" fill="url(#cvs-rock)"/>
   <path d="M711 343 L905 266 1096 311 1180 358 1089 363 938 321 816 369Z" fill="url(#cvs-crest)"/>
   <path d="M944 348C936 405 941 452 951 590" stroke="url(#cvs-water)" strokeWidth="17" fill="none"/>
   <path d="M963 352C952 427 965 515 981 590" stroke="url(#cvs-water)" strokeWidth="10" fill="none"/>
   <path d="M1038 354C1024 420 1032 496 1035 590" stroke="url(#cvs-water)" strokeWidth="19" fill="none"/>
  </g>
  <g className="cvs-island-center">
   <path d="M254 350 L450 269 683 307 805 372 674 433 584 558 463 462 367 451Z" fill="url(#cvs-rock)"/>
   <path d="M254 350 L450 269 683 307 805 372 678 364 534 317 367 378Z" fill="url(#cvs-crest)"/>
   <path d="M620 376C605 453 624 517 622 590" stroke="url(#cvs-water)" strokeWidth="22" fill="none"/>
   <path d="M641 379C632 445 643 512 640 590" stroke="url(#cvs-water)" strokeWidth="9" fill="none"/>
  </g>
  <g className="cvs-architecture" strokeLinejoin="round">
   <path d="M379 291L396 171 418 142 440 296Z" fill="url(#cvs-build)"/>
   <path d="M398 165L408 57 420 164" fill="#d4d9d8"/>
   <path d="M469 290L484 185 506 160 519 306Z" fill="url(#cvs-build)"/>
   <path d="M491 169L496 106 506 161" fill="#dfe4dc"/>
   <path d="M541 311L553 221 574 207 589 317Z" fill="url(#cvs-build)"/>
   <path d="M331 331L348 246 371 244 385 330Z" fill="url(#cvs-build)"/>
   <path d="M749 344L769 243 800 220 817 356Z" fill="url(#cvs-build)"/>
   <path d="M786 234L790 179 800 228" fill="#ebdbc5"/>
   <path d="M832 313L848 204 872 196 888 330Z" fill="url(#cvs-build)"/>
   <path d="M849 208L859 139 869 206" fill="#e4e3d9"/>
   <path d="M902 305L918 245 936 243 948 320Z" fill="url(#cvs-build)"/>
   <path d="M442 291Q611 91 772 325" fill="none" stroke="#dfdfcf" strokeWidth="13"/>
   <path d="M442 291Q611 137 772 325" fill="none" stroke="#4b7189" strokeWidth="6"/>
   <path d="M440 296L772 332" fill="none" stroke="#c2c6bd" strokeWidth="7"/>
   <path d="M587 221L587 312M666 217L665 317" stroke="#a9bec3" strokeWidth="5"/>
   <path d="M306 357Q371 236 451 298" fill="none" stroke="#a8c2cd" strokeWidth="11"/>
   <path d="M326 354L458 328" stroke="#dae1d3" strokeWidth="6"/>
   <g fill="#f5dfb2" opacity=".8">
    <rect x="398" y="197" width="6" height="31"/><rect x="415" y="184" width="6" height="34"/>
    <rect x="488" y="211" width="6" height="29"/><rect x="563" y="232" width="5" height="26"/>
    <rect x="775" y="270" width="6" height="34"/><rect x="855" y="235" width="5" height="29"/>
   </g>
  </g>
  <g className="cvs-craft">
   <ellipse cx="176" cy="170" rx="90" ry="23" fill="#7dd8ff" opacity=".23" filter="url(#cvs-glow)"/>
   <path d="M93 171L156 150 209 159 261 180 194 186 158 203 125 185Z" fill="#adc4cc" stroke="#ecf5e9" strokeWidth="2"/>
   <path d="M151 152L177 134 217 159 170 169Z" fill="#344f71"/>
   <path d="M107 172L151 178 146 188" fill="#73b9dc"/>
   <path d="M168 178L224 174" stroke="#eef9ff" strokeWidth="3"/>
   <path d="M100 172L67 162M102 182L68 183" stroke="#73caff" strokeWidth="4" opacity=".73"/>
  </g>
  <ellipse cx="601" cy="534" rx="430" ry="54" fill="#eefaff" opacity=".22" filter="url(#cvs-cloudblur)"/>
  <g className="cvs-scene-grain" opacity=".15"><path d="M0 580H1180 M0 510H1180 M0 440H1180" stroke="#ffffff" strokeDasharray="3 11"/></g>
 </svg>;
}
function SymbolArt({symbol}:{symbol:string}){
 return <svg viewBox="0 0 88 66" aria-hidden="true" focusable="false">
  {symbol==='island'?<><path d="M13 32L43 20 72 29 80 37 52 46 44 62 31 44Z" fill="#53768a"/><path d="M13 32L43 20 72 29 80 37 49 34 29 37Z" fill="#88b39c"/><path d="M39 20L41 7 47 7 49 22" fill="#dee3d4"/></>:
   symbol==='spire'?<><path d="M28 57L33 18 45 8 52 57" fill="#a5bfcb"/><path d="M40 9L43 0 46 9M56 57L61 25 68 20 74 57" fill="#e1d9c8"/><path d="M40 27V44M64 34V45" stroke="#fbebb7" strokeWidth="3"/></>:
   symbol==='bridge'?<><path d="M9 49Q43 2 79 49" fill="none" stroke="#a5c5d4" strokeWidth="7"/><path d="M10 48H80" stroke="#e6d5b4" strokeWidth="6"/><path d="M28 27V49M58 28V49" stroke="#688ba4" strokeWidth="4"/></>:
   symbol==='craft'?<><path d="M5 37L34 27 54 16 67 31 83 41 53 47 37 59 29 45Z" fill="#b1d5ea"/><path d="M36 26L52 21 62 34 43 36" fill="#53759d"/><path d="M10 41L0 40M72 45L85 51" stroke="#85ddff" strokeWidth="4"/></>:
   symbol==='bloom'?<><path d="M45 55V29" stroke="#65deb8" strokeWidth="4"/>{[0,60,120,180,240,300].map(angle=><ellipse key={angle} cx="44" cy="20" rx="10" ry="19" transform={'rotate('+angle+' 44 34)'} fill="#ca80ff" opacity=".8"/>)}<circle cx="44" cy="32" r="9" fill="#f9ddff"/></>:
   <><circle cx="44" cy="33" r="24" fill="#194e88" stroke="#94e3ff" strokeWidth="2"/><circle cx="44" cy="33" r="12" fill="#9eedff"/><circle cx="44" cy="33" r="6" fill="#f2faff"/><path d="M44 2V14M44 52V64M13 33H25M63 33H77" stroke="#9cdbff" strokeWidth="2"/></>}
 </svg>;
}
function PrototypeContent({mode,interfaceActive,setInterfaceActive,code,setCode}:{mode:Mode;interfaceActive:boolean;setInterfaceActive:(next:boolean)=>void;code:string;setCode:(next:string)=>void}){
 if(mode==='Interface')return <div className="cvs-alternate cvs-interface-mode">
  <div className="cvs-alternate-intro"><span>INTERFACE LAB / SYNTHETIC SAMPLE</span><h3>Design the experience.</h3><p>This frame demonstrates responsive interface hierarchy. It is not attached to V113 project files.</p></div>
  <div className="cvs-interface-preview"><div className="cvs-sample-browser"><i/><i/><i/><span>STORY / FIRST SIGNAL</span></div>
   <div className="cvs-sample-card"><div className="cvs-sample-orbit"><OrbitalMark/></div><span>CONTINUANCE / ARCHIVE 001</span><h4>A universe of things people make.</h4><p>Connect scenes, content and interactions into a shared experience.</p><button type="button" onClick={()=>setInterfaceActive(!interfaceActive)}>{interfaceActive?'Interaction confirmed · Reset':'Try sample interaction'} <Icon name="arrow" size={16}/></button>{interfaceActive&&<small role="status">The local sample responded. No changes were saved.</small>}</div>
  </div></div>;
 if(mode==='Code')return <div className="cvs-alternate cvs-code-mode">
  <div className="cvs-alternate-intro"><span>SOURCE LAB / LOCAL TEXT ONLY</span><h3>Write what the world becomes.</h3><p>Editing this sample does not execute code or change existing V111 source files.</p></div>
  <div className="cvs-code-window"><div className="cvs-code-header"><span>scene.ts</span><span>UNSAVED SAMPLE / NO RUNTIME</span></div><textarea spellCheck={false} aria-label="Synthetic local code sample" value={code} onChange={e=>setCode(e.target.value)} maxLength={2048}/></div>
 </div>;
 if(mode==='Playtest')return <div className="cvs-alternate cvs-gate">
   <Icon name="star" size={35}/><span>PLAYTEST / STAGED CAPABILITY</span><h3>Proof before publication.</h3><p>A real device preview will run an approved isolated package, with version, permissions and exit controls. This design review does not execute a game or simulate publication.</p><Link to="/studio/packages" className="cvs-link">Open existing package workflow <Icon name="arrow" size={16}/></Link>
  </div>;
 if(mode==='Publish')return <div className="cvs-alternate cvs-gate">
   <Icon name="arrow" size={35}/><span>PUBLISH / INDEPENDENT REVIEW</span><h3>A considered release.</h3><p>Creator submissions remain governed by the existing immutable revision and moderator review path. There is no public-release action in this visual review.</p><Link to="/studio/records" className="cvs-link">Existing private project records <Icon name="arrow" size={16}/></Link>
  </div>;
 return null;
}

export function CreatorStudioVisualReviewV115(){
 const [mode,setMode]=useState<Mode>('World');
 const [panel,setPanel]=useState<Panel>('none');
 const [inspectorTab,setInspectorTab]=useState<InspectorTab>('properties');
 const [tool,setTool]=useState<Tool>('Select');
 const [objects,setObjects]=useState<SceneObject[]>(STARTERS);
 const [selectedId,setSelectedId]=useState<string>('spire');
 const [filter,setFilter]=useState('');
 const [assetQuery,setAssetQuery]=useState('');
 const [assetCategory,setAssetCategory]=useState('All');
 const [trayOpen,setTrayOpen]=useState(true);
 const [light,setLight]=useState(65);
 const [night,setNight]=useState(false);
 const [dirty,setDirty]=useState(false);
 const [interfaceActive,setInterfaceActive]=useState(false);
 const [code,setCode]=useState('// Preview text only; no runtime\nconst scene = {\n  name: "Sky Archipelago",\n  lighting: "cinematic",\n  editable: true\n};');
 const [addCount,setAddCount]=useState(0);
 const selected=objects.find(o=>o.id===selectedId)||null;
 const listed=useMemo(()=>objects.filter(o=>(o.name+' '+o.kind).toLowerCase().includes(filter.trim().toLowerCase())),[objects,filter]);
 const assets=useMemo(()=>ASSETS.filter(a=>(assetCategory==='All'||a.kind===assetCategory)&&a.name.toLowerCase().includes(assetQuery.trim().toLowerCase())),[assetCategory,assetQuery]);
 useEffect(()=>{
  const onEscape=(e:KeyboardEvent)=>{if(e.key==='Escape')setPanel('none');};
  window.addEventListener('keydown',onEscape);
  return()=>window.removeEventListener('keydown',onEscape);
 },[]);
 function updateObject(field:'x'|'y'|'z'|'scale',raw:number){
  if(!Number.isFinite(raw)||!selected)return;
  const value=field==='scale'?clamp(raw,.1,6):clamp(raw,-40,40);
  setObjects(old=>old.map(o=>o.id===selected.id?{...o,[field]:value}:o));setDirty(true);
 }
 function addObject(){
  const n=addCount+1;
  const id='local-'+n;
  setAddCount(n);
  setObjects(old=>[...old,{id,name:'New Primitive '+n,kind:'Sample Object',x:0,y:0,z:0,scale:1}]);
  setSelectedId(id);setDirty(true);setPanel('none');setMode('World');
 }
 function reset(){
  setObjects(STARTERS);setSelectedId('spire');setDirty(false);setLight(65);setNight(false);setTool('Select');setAddCount(0);
 }
 function go(next:Mode){setMode(next);setPanel('none');}
 function toggle(next:Panel){setPanel(p=>p===next?'none':next);}
 return <section className="cvs-root" data-creator-visual-review="v115" aria-label="Creator Studio V115 isolated visual review">
  <div className="cvs-review-banner" role="status">
   <span className="cvs-flash"/> DESIGN REVIEW 115 <span className="cvs-banner-sep">/</span> SYNTHETIC WORKSPACE <span className="cvs-banner-sep">/</span> NO PROJECT OR SERVER WRITES
  </div>
  <header className="cvs-head">
   <div className="cvs-head-brand"><OrbitalMark className="cvs-mark"/><div><span>ANEVUM / CONTINUANCE INSTITUTE</span><h1>Creator <b>Studio</b></h1></div></div>
   <div className="cvs-head-links"><span className="cvs-head-version">VISUAL SYSTEM <strong>V115</strong></span><Link to="/studio" className="cvs-link">Return to Studio <Icon name="arrow" size={16}/></Link></div>
  </header>
  <div className="cvs-studio">
   <div className="cvs-projectbar">
    <div className="cvs-projectidentity"><span className="cvs-project-thumb"><OrbitalMark/></span><div><small>DEMONSTRATION PROJECT</small><strong>Astra Prime <span className="cvs-project-caret">⌄</span></strong></div><span className="cvs-draft">LOCAL SAMPLE</span></div>
    <div className="cvs-project-actions">
     <span className="cvs-save-state">{dirty?'● LOCAL CHANGES · NOT SAVED':'● SAMPLE STATE · NOT PERSISTED'}</span>
     <button type="button" className="cvs-action" onClick={reset}>Reset sample</button>
     <button type="button" className="cvs-primary" disabled title="Saving is not connected in the isolated visual review">Save revision <Icon name="save" size={15}/></button>
    </div>
   </div>
   <div className="cvs-grid">
    <nav className="cvs-rail" aria-label="Creator Studio mode navigation">
     <span className="cvs-rail-heading">CREATE</span>
     {MODES.map(item=><button type="button" key={item.mode} className={'cvs-rail-item'+(mode===item.mode?' is-selected':'')} aria-current={mode===item.mode?'page':undefined} aria-label={item.hint} title={item.hint} onClick={()=>go(item.mode)}><Icon name={item.icon} size={19}/><span>{item.mode}</span></button>)}
     <div className="cvs-rail-bottom"><button type="button" className="cvs-rail-item" title="Open existing IREN companion" onClick={()=>window.dispatchEvent(new Event('anevum:iren-open'))}><Icon name="star" size={19}/><span>IREN</span></button></div>
    </nav>
    {panel!=='none'&&<button type="button" className="cvs-backdrop" aria-label="Close open panel" onClick={()=>setPanel('none')}/>}
    <aside className={'cvs-explorer cvs-pane'+(panel==='explorer'?' is-open':'')} aria-label="Demonstration scene hierarchy">
     <div className="cvs-pane-title"><div><small>PROJECT EXPLORER</small><h2>Astra Prime</h2></div><button className="cvs-mobile-close" type="button" onClick={()=>setPanel('none')} aria-label="Close Explorer"><Icon name="close"/></button></div>
     <label className="cvs-search"><Icon name="search" size={15}/><input type="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Find an object…" aria-label="Filter demo hierarchy"/></label>
     <div className="cvs-pane-section"><div className="cvs-subheading"><span>SCENES</span><small>{objects.length}</small></div>
      <button type="button" className="cvs-tree-root"><Icon name="explore" size={16}/> Astra Prime / Main World</button>
      <div className="cvs-object-list">{listed.map(o=><button key={o.id} type="button" className={'cvs-object'+(selectedId===o.id?' is-active':'')} aria-pressed={selectedId===o.id} onClick={()=>{setSelectedId(o.id);setMode('World');setPanel('none')}}><span className="cvs-tree-node"/><span className="cvs-object-copy">{o.name}<small>{o.kind}</small></span></button>)}
       {listed.length===0&&<p className="cvs-muted">No scene objects match.</p>}
      </div>
      <button type="button" className="cvs-explorer-add" onClick={addObject}>+ Add local primitive</button>
     </div>
     <div className="cvs-pane-section cvs-pane-bottom"><div className="cvs-subheading"><span>LIBRARIES</span></div>
      <div className="cvs-folder"><Icon name="library" size={16}/> Assets <small>6 sample items</small></div>
      <div className="cvs-folder"><Icon name="create" size={16}/> Interfaces <small>V113 separate</small></div>
      <div className="cvs-folder"><Icon name="save" size={16}/> Scripts <small>V111 separate</small></div>
     </div>
     <p className="cvs-explorer-note">Demo hierarchy only. Actual project files remain in the gated V111 workspace.</p>
    </aside>
    <main className="cvs-main" aria-label="Creator Studio visual workspace">
     <nav className="cvs-mobile-tabs" aria-label="Creation modes">{MODES.map(item=><button type="button" key={item.mode} aria-current={mode===item.mode?'page':undefined} onClick={()=>go(item.mode)}>{item.mode}</button>)}</nav>
     <div className="cvs-mode-header"><div className="cvs-mode-label"><span>WORKSPACE / {mode.toUpperCase()}</span><strong>{mode==='World'?'Sky Archipelago':mode+' Studio'}</strong></div><div className="cvs-mode-indicators"><span className="cvs-chip"><i/> SAMPLE DOCUMENT</span><span className="cvs-chip cvs-chip--secondary">NO SERVER ACTIONS</span></div></div>
     {mode==='World'?<>
      <div className="cvs-toolbar" aria-label="Scene preview controls"><div className="cvs-tools">{(['Select','Move','Rotate','Scale'] as Tool[]).map(t=><button key={t} type="button" className={tool===t?'is-active':''} aria-pressed={tool===t} onClick={()=>setTool(t)}>{t}</button>)}</div><div className="cvs-tools-secondary"><button type="button" onClick={()=>setNight(v=>!v)} aria-pressed={night}>{night?'Nebula light':'Daylight'}</button><span>CAMERA / CONCEPT</span></div></div>
      <div className="cvs-stage" role="region" aria-label="Static layered world illustration with selectable synthetic object state">
       <SampleScene night={night} light={light}/>
       <div className="cvs-stage-top"><span className="cvs-stage-caption">WORLD PREVIEW / PROCEDURAL 2D CONCEPT</span><span className="cvs-stage-coordinate">X {selected?.x.toFixed(1)||'0.0'} / Y {selected?.y.toFixed(1)||'0.0'} / Z {selected?.z.toFixed(1)||'0.0'}</span></div>
       {selected&&<div className="cvs-gizmo" style={{left:clamp(51+selected.x*1.4,15,83)+'%',top:clamp(58-selected.y*1.5,20,83)+'%'}} aria-hidden="true"><span className="cvs-gizmo-y"/><span className="cvs-gizmo-x"/><span className="cvs-gizmo-z"/><span className="cvs-gizmo-center"/></div>}
       <div className="cvs-stage-tag">{selected?<><span>SELECTED OBJECT</span><strong>{selected.name}</strong></>:'Select an object from Explorer'}</div>
       <div className="cvs-stage-badge"><Icon name="star" size={14}/> NO GPU RENDERER YET</div>
       <div className="cvs-stage-reticle" aria-hidden="true"/>
      </div>
     </>:mode==='Assets'?<div className="cvs-full-assets"><div className="cvs-alternate-intro"><span>ASSET FOUNDRY / VISUAL REVIEW</span><h3>Everything for the worlds ahead.</h3><p>Catalog artwork is synthetic, not a verified uploaded asset.</p></div><div className="cvs-asset-grid">{assets.map(a=><div className="cvs-asset-card" key={a.name}><span className={'cvs-asset-illustration cvs-asset-'+a.hue}><SymbolArt symbol={a.symbol}/></span><strong>{a.name}</strong><small>{a.kind}</small></div>)}</div></div>:
      <PrototypeContent mode={mode} interfaceActive={interfaceActive} setInterfaceActive={setInterfaceActive} code={code} setCode={setCode}/>}
     {mode==='World'&&<div className={'cvs-asset-shelf'+(trayOpen?'':' is-collapsed')}>
      <div className="cvs-shelf-head"><div className="cvs-shelf-heading"><strong>ASSET FOUNDRY</strong><span>LOCAL PROTOTYPE LIBRARY</span></div><button type="button" onClick={()=>setTrayOpen(v=>!v)} aria-expanded={trayOpen}>{trayOpen?'Collapse assets':'Expand assets'} <span aria-hidden="true">{trayOpen?'⌄':'⌃'}</span></button></div>
      {trayOpen&&<><div className="cvs-shelf-filters"><div role="group" aria-label="Filter asset categories">{['All','Environment','Architecture','Vehicle','Nature','Effect'].map(a=><button type="button" key={a} aria-pressed={assetCategory===a} onClick={()=>setAssetCategory(a)}>{a}</button>)}</div><label className="cvs-search cvs-asset-search"><Icon name="search" size={14}/><input aria-label="Search example assets" type="search" value={assetQuery} onChange={e=>setAssetQuery(e.target.value)} placeholder="Search assets…"/></label></div>
      <div className="cvs-asset-strip">{assets.map(a=><button key={a.name} type="button" className="cvs-asset-tile" onClick={addObject} title={'Add synthetic primitive inspired by '+a.name}><span className={'cvs-asset-illustration cvs-asset-'+a.hue}><SymbolArt symbol={a.symbol}/></span><strong>{a.name}</strong><small>{a.kind}</small></button>)}{assets.length===0&&<p className="cvs-muted">No matching demo assets.</p>}</div></>}
     </div>}
     <div className="cvs-mobile-actionbar" role="group" aria-label="Mobile workspace panels"><button type="button" aria-pressed={panel==='explorer'} onClick={()=>toggle('explorer')}>Objects</button><button type="button" aria-pressed={panel==='inspector'} onClick={()=>toggle('inspector')}>Inspector</button><button type="button" onClick={()=>{setMode('World');toggle('assets')}} aria-pressed={panel==='assets'}>Assets</button><button type="button" onClick={()=>window.dispatchEvent(new Event('anevum:iren-open'))}>IREN</button></div>
    </main>
    <aside className={'cvs-inspector cvs-pane'+(panel==='inspector'?' is-open':'')} aria-label="Studio context inspector">
     <div className="cvs-inspector-tabs"><button type="button" className={inspectorTab==='properties'?'is-active':''} aria-pressed={inspectorTab==='properties'} onClick={()=>setInspectorTab('properties')}>INSPECTOR</button><button type="button" aria-pressed={inspectorTab==='assistant'} className={inspectorTab==='assistant'?'is-active':''} onClick={()=>setInspectorTab('assistant')}>IREN</button><button className="cvs-mobile-close" type="button" aria-label="Close Inspector" onClick={()=>setPanel('none')}><Icon name="close"/></button></div>
     {inspectorTab==='assistant'?<div className="cvs-iren"><div className="cvs-iren-orb"><OrbitalMark/></div><small>ONE COMPANION / EXISTING SITE RIG</small><h3>IREN / Creative guidance</h3><p>Future Studio context will connect to the existing IREN identity with reviewed, undoable commands. This sample contains no model connection or project access.</p><button type="button" onClick={()=>window.dispatchEvent(new Event('anevum:iren-open'))}>Open existing IREN <Icon name="arrow" size={16}/></button></div>:
     <div className="cvs-inspector-content"><div className="cvs-inspector-object"><span className="cvs-inspector-icon"><Icon name="explore" size={22}/></span><div><small>LOCAL SELECTION</small><h3>{selected?.name||'Nothing selected'}</h3><span>{selected?.kind||'Select an object'}</span></div></div>
      <div className="cvs-inspector-section"><div className="cvs-subheading"><span>TRANSFORM</span><span>LOCAL PREVIEW</span></div>
       {(['x','y','z','scale'] as const).map(field=><label className="cvs-field" key={field}><span>{field==='scale'?'Scale':field.toUpperCase()+' Position'}</span><input type="number" disabled={!selected} min={field==='scale'?.1:-40} max={field==='scale'?6:40} step={field==='scale'?.1:1} value={selected?.[field]??0} onChange={e=>updateObject(field,e.target.valueAsNumber)}/></label>)}
      </div>
      <div className="cvs-inspector-section"><div className="cvs-subheading"><span>SCENE LIGHTING</span></div><label className="cvs-slider"><span>Intensity <b>{light}%</b></span><input type="range" min={10} max={100} step={5} value={light} onChange={e=>{setLight(Number(e.target.value));setDirty(true)}}/></label>
       <label className="cvs-switch"><span>Nebula mode</span><input type="checkbox" checked={night} onChange={e=>{setNight(e.target.checked);setDirty(true)}}/></label>
      </div>
      <div className="cvs-inspector-section cvs-inspector-foot"><div className="cvs-subheading"><span>INSPECTION STATUS</span></div><p>Use the hierarchy and numeric inputs to change sample selection and transforms. These are local prototype values, not 3D rendering or saved world assets.</p></div>
     </div>}
    </aside>
   </div>
   <footer className="cvs-status"><span><i/> DESIGN PROTOTYPE V115</span><span>ILLUSTRATED VIEW · WEBGL2 ENGINE NOT CONNECTED</span><span>{dirty?'LOCAL CHANGES — RESET AVAILABLE':'NO PRIVATE DATA LOADED'}</span></footer>
  </div>
 </section>;
}

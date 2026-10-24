import {useMemo,useState} from 'react';
import type {WorldKind,WorldMaterial} from '../../../world-composer/document.mjs';
import {Icon} from '../components/Icons';

export type StudioAsset={
 id:string;title:string;category:string;subtitle:string;kind:WorldKind|null;
 material:WorldMaterial|null;thumb:'island'|'spire'|'bridge'|'falls'|'core'|'craft'|'plant'|'block'|'light';
};
const ASSET_CATALOG:StudioAsset[]=[
 {id:'floating-island',title:'Floating Island',category:'Environments',subtitle:'Editable island',kind:'island',material:'grass',thumb:'island'},
 {id:'astra-spire',title:'Astra Spire',category:'Architecture',subtitle:'Editable tower',kind:'spire',material:'gold',thumb:'spire'},
 {id:'sky-bridge',title:'Horizon Bridge',category:'Architecture',subtitle:'Editable bridge',kind:'bridge',material:'gold',thumb:'bridge'},
 {id:'cascade-falls',title:'Cascade Falls',category:'Environments',subtitle:'Editable water',kind:'waterfall',material:'water',thumb:'falls'},
 {id:'energy-core',title:'Energy Core',category:'Effects',subtitle:'Editable sphere',kind:'sphere',material:'cyan',thumb:'core'},
 {id:'sky-lantern',title:'Sky Lantern',category:'Effects',subtitle:'Editable light',kind:'light',material:'cyan',thumb:'light'},
 {id:'stone-block',title:'Stone Block',category:'Props',subtitle:'Editable cube',kind:'cube',material:'stone',thumb:'block'},
 {id:'starcraft',title:'Starcraft',category:'Vehicles',subtitle:'Editable procedural GPU craft',kind:'starship',material:'glass',thumb:'craft'},
 {id:'neon-bloom',title:'Neon Bloom',category:'Nature',subtitle:'Preview only · GLB later',kind:null,material:null,thumb:'plant'}
];
const CATEGORIES=['All','Environments','Architecture','Props','Effects','Vehicles','Nature'] as const;
function Miniature({type}:{type:StudioAsset['thumb']}){
 return <svg aria-hidden="true" focusable="false" className="csn-asset-art" viewBox="0 0 120 82">
  <defs>
   <linearGradient id={'csn-blue-'+type} x1="0" x2=".9" y1="0" y2="1">
    <stop stopColor="#bbecff"/><stop offset=".55" stopColor="#557eaa"/><stop offset="1" stopColor="#172945"/>
   </linearGradient>
   <linearGradient id={'csn-gold-'+type} x1="0" y1="0" x2=".7" y2="1">
    <stop stopColor="#ffefd0"/><stop offset=".57" stopColor="#a6a6a7"/><stop offset="1" stopColor="#4a6384"/>
   </linearGradient>
  </defs>
  {type==='island'&&<g>
   <path d="M8 39 55 21 106 38 116 51 71 62 58 80 40 57Z" fill="#4e6681"/>
   <path d="M8 39 55 21 106 38 116 51 70 44 39 51Z" fill="#78bd9b"/>
   <path d="M49 25 52 5 61 5 66 25" fill={'url(#csn-gold-'+type+')'}/>
   <path d="M72 32 75 16 82 16 84 35" fill="#d9e3d5"/>
   <circle cx="34" cy="33" r="9" fill="#91bea8"/><circle cx="90" cy="41" r="9" fill="#8fb7a5"/>
  </g>}
  {type==='spire'&&<g>
   <path d="M27 70 34 21 46 8 54 70Z" fill={'url(#csn-gold-'+type+')'}/>
   <path d="M58 71 62 31 75 15 85 71Z" fill={'url(#csn-blue-'+type+')'}/>
   <path d="M42 10 44 0 46 10 M70 16 74 3 76 16" stroke="#fae1ab" strokeWidth="3"/>
   <path d="M39 31v29M47 34v25M69 36v24M77 32v28" stroke="#f5d89c" strokeWidth="3"/>
   <path d="M21 71H93" stroke="#92bcd1" strokeWidth="6"/>
  </g>}
  {type==='bridge'&&<g>
   <path d="M9 62Q59-14 110 62" stroke="#d0d6d0" strokeWidth="9" fill="none"/>
   <path d="M6 61 113 61" stroke="#89b4c7" strokeWidth="7"/>
   <path d="M26 37v25M40 19v43M60 13v49M80 22v40M97 40v22" stroke="#aec9d3" strokeWidth="4"/>
   <path d="M13 67h94" stroke="#6a819a" strokeWidth="5"/>
  </g>}
  {type==='falls'&&<g>
   <path d="M11 25 56 12 105 27 111 35 67 39 36 36Z" fill="#83b8a5"/>
   <path d="M12 31 67 39 49 76 35 39Z" fill="#496982"/>
   <path d="M62 39Q48 57 60 81M72 39Q65 59 76 81M83 37Q75 62 85 80" stroke="#b6f5ff" strokeWidth="7" opacity=".82" fill="none"/>
  </g>}
  {type==='core'&&<g>
   <circle cx="60" cy="41" r="29" fill="#1d4b7d" stroke="#87eaff" strokeWidth="2"/>
   <circle cx="60" cy="41" r="17" fill="#69c3f7" opacity=".85"/>
   <circle cx="60" cy="41" r="8" fill="#e6faff"/>
   <path d="M60 4v18M60 60v18M23 41h18M78 41h18" stroke="#a5ebff" strokeWidth="2"/>
   <ellipse cx="60" cy="41" rx="41" ry="13" stroke="#7bc4ff" strokeWidth="2" fill="none" transform="rotate(-27 60 41)"/>
  </g>}
  {type==='light'&&<g>
   <circle cx="60" cy="41" r="24" fill="#319ac4" opacity=".32"/>
   <circle cx="60" cy="41" r="13" fill="#7adfff"/>
   <circle cx="60" cy="41" r="6" fill="#fffaf2"/>
   <path d="M60 2V25M60 57V80M21 41h23M76 41h23" stroke="#a5eaff" strokeWidth="2"/>
  </g>}
  {type==='block'&&<g>
   <path d="M25 28 62 11 102 29 65 48Z" fill="#a9c3c9"/>
   <path d="M25 28v36l40 17V48Z" fill="#5b8392"/>
   <path d="M65 48v33l37-18V29Z" fill="#3c617b"/>
   <path d="M25 28 62 11 102 29 65 48Z" stroke="#e3e4d1" strokeWidth="2" fill="none"/>
  </g>}
  {type==='craft'&&<g>
   <path d="M5 43 38 28 69 22 116 51 72 58 52 75 30 53Z" fill="#bdd5dd"/>
   <path d="M42 30 64 18 85 42 52 45Z" fill="#4c6b91"/>
   <path d="M13 46 2 39M21 56 2 59" stroke="#69d5ff" strokeWidth="5"/>
   <path d="M56 53 87 49" stroke="#eaf9ff" strokeWidth="3"/>
  </g>}
  {type==='plant'&&<g>
   <path d="M60 78V32" stroke="#65d8b1" strokeWidth="5"/>
   {[0,60,120,180,240,300].map(t=><ellipse key={t} cx="60" cy="30" rx="12" ry="25" transform={'rotate('+t+' 60 43)'} fill="#b66fee" opacity=".7"/>)}
   <circle cx="60" cy="42" r="11" fill="#f4dbff"/>
  </g>}
 </svg>;
}
export function StudioAssetShelfV116({onAdd,expanded,onToggle,large=false}:{
 onAdd:(asset:StudioAsset)=>void;expanded:boolean;onToggle:()=>void;large?:boolean
}){
 const [category,setCategory]=useState('All');
 const [query,setQuery]=useState('');
 const assets=useMemo(()=>ASSET_CATALOG.filter(a=>(category==='All'||a.category===category)&&
  (a.title+' '+a.subtitle).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),[category,query]);
 const [previewId,setPreviewId]=useState<string|null>(null);
 const preview=assets.find(a=>a.id===previewId);
 return <section className={'csn-shelf'+(large?' csn-shelf--large':'')+(expanded?'':' is-collapsed')} aria-label="Creator Studio asset foundry">
  <div className="csn-shelf-head">
   <div><strong>ASSET FOUNDRY</strong><span>PROCEDURAL STARTERS / {ASSET_CATALOG.filter(a=>a.kind).length} EDITABLE</span></div>
   {!large&&<button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls="csn-asset-content">{expanded?'Hide assets':'Show assets'} <span aria-hidden="true">{expanded?'⌄':'⌃'}</span></button>}
  </div>
  {(expanded||large)&&<div id="csn-asset-content">
   <div className="csn-asset-filters">
    <div role="group" aria-label="Asset categories">{CATEGORIES.map(c=><button type="button" key={c} aria-pressed={c===category} onClick={()=>{setCategory(c);setPreviewId(null)}}>{c}</button>)}</div>
    <label className="csn-search-asset"><Icon name="search" size={15}/><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search assets…" aria-label="Search Studio starter assets"/></label>
   </div>
   <div className="csn-asset-track">
    {assets.map(a=><button type="button" key={a.id} className={'csn-asset-card'+(a.kind?' is-addable':' is-preview')+(previewId===a.id?' is-previewing':'')}
     onClick={()=>{if(a.kind)onAdd(a);else setPreviewId(a.id)}}
     title={a.kind?'Add an editable '+a.title+' to the in-memory scene':'Preview only — no model available'}>
     <span className={'csn-asset-thumbnail csn-thumb-'+a.thumb}><Miniature type={a.thumb}/>
      <span className={'csn-asset-availability'+(a.kind?' is-real':' is-concept')}>{a.kind?'3D':'CONCEPT'}</span></span>
     <strong>{a.title}</strong><small>{a.subtitle}</small>
    </button>)}
    {assets.length===0&&<p className="csn-shelf-empty">No matching assets. Try another category or search term.</p>}
   </div>
   {preview&&<p className="csn-preview-note" role="status">{preview.title} is concept artwork only. A validated 3D model must be imported before it can enter a real world.</p>}
  </div>}
 </section>;
}

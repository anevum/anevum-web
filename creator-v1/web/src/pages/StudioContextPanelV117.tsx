import type {StudioModeV116} from './StudioNavigationV116';

type ContextMode=Exclude<StudioModeV116,'Scene'|'Playtest'>;
type ModeData={title:string;summary:string;kind:string;status:string;detail:string;next:StudioModeV116;nextLabel:string};
const MODES:Record<ContextMode,ModeData>={
 Interface:{
  title:'Interface Builder',summary:'Arrange a responsive experience in the local visual editor.',
  kind:'Component preview',status:'Local sample · not saved',
  detail:'Change the heading, action and visual preset in the adjacent component-properties panel. Desktop and phone preview states are independent of the World Composer document.',
  next:'Scripts',nextLabel:'Inspect source tools'
 },
 Scripts:{
  title:'Script Editor',summary:'Work with readable source before connecting an execution sandbox.',
  kind:'Text source',status:'No execution or persistence',
  detail:'The sample editor supports source tabs and text changes only. A real project must use the existing verified member-owned V111 revision workflow.',
  next:'Interface',nextLabel:'Return to Interface Builder'
 },
 Assets:{
  title:'Asset Foundry',summary:'Choose real geometric starters or inspect future asset concepts.',
  kind:'Procedural object catalog',status:'8 editable · 1 preview-only',
  detail:'A starter creates an undoable World Composer node. Starcraft is now real editable geometry. Neon Bloom remains a nonfunctional concept preview until a validated model exists.',
  next:'Scene',nextLabel:'Return to 3D world'
 },
 Publish:{
  title:'Release Inspector',summary:'Separate an editable local world from a verified, publishable project.',
  kind:'Release-readiness review',status:'Publication unavailable',
  detail:'This document has not been saved to a verified member project. Owner authorization, private file revision, package validation, playtesting and moderation must succeed before publication.',
  next:'Playtest',nextLabel:'Open visual playtest'
 }
};
export function StudioContextPanelV117({mode,objects,documentBytes,onNavigate}:{
 mode:ContextMode;objects:number;documentBytes:number;
 onNavigate:(mode:StudioModeV116)=>void;
}){
 const item=MODES[mode];
 return <section className="csn-context-panel" aria-label={item.title+' context'} data-studio-context-mode={mode}>
  <header className="csn-context-mode-head">
   <span>ACTIVE WORKSPACE / {mode.toUpperCase()}</span>
   <h2>{item.title}</h2>
   <p>{item.summary}</p>
  </header>
  <div className="csn-context-metadata">
   <div><span>Editor type</span><strong>{item.kind}</strong></div>
   <div><span>Persistence state</span><strong>{item.status}</strong></div>
   <div><span>Local 3D document</span><strong>{objects} scene objects</strong></div>
   <div><span>World source</span><strong>{documentBytes.toLocaleString()} UTF-8 bytes</strong></div>
  </div>
  <div className="csn-context-guidance">
   <strong>{mode==='Publish'?'RELEASE BOUNDARY':'HOW THIS MODE WORKS'}</strong>
   <p>{item.detail}</p>
  </div>
  <button className="csn-context-next" type="button" onClick={()=>onNavigate(item.next)}>
   {item.nextLabel} <span aria-hidden="true">→</span>
  </button>
  <p className="csn-context-footer">ANEVUM / CONTINUANCE INSTITUTE · SYNTHETIC WORKSPACE</p>
 </section>;
}

import {Icon} from '../components/Icons';
import {OrbitalMark} from '../components/OrbitalMark';
import type {StudioModeV116} from './StudioNavigationV116';

/**
 * ANEVUM V122: the existing IREN entrypoint and REAL local Studio actions.
 * This is not a second AI/chat provider. Suggested actions are deterministic
 * browser editor operations, and the Open IREN button delegates to the
 * existing registered ANEVUM companion.
 */
export function StudioIrenAssistantV122({
 projectName,selectedObject,objectCount,onOpenIren,onInspect,onFrame,onLighting,onMode
}:{
 projectName:string;selectedObject:string|null;objectCount:number;
 onOpenIren:()=>void;onInspect:()=>void;onFrame:()=>void;onLighting:()=>void;
 onMode:(mode:StudioModeV116)=>void;
}){
 const actions=[
  {id:'scene',title:'Work with your world',caption:'Return to the editable WebGL2 scene',icon:'box',
   tone:'violet',run:()=>onMode('Scene')},
  {id:'interface',title:'Build an interface',caption:'Open the responsive UI builder',icon:'layout-dashboard',
   tone:'blue',run:()=>onMode('Interface')},
  {id:'assets',title:'Explore real assets',caption:'Add procedural objects to the scene',icon:'layers',
   tone:'gold',run:()=>onMode('Assets')},
  {id:'scripts',title:'Edit source code',caption:'Open the local code editor',icon:'file-code',
   tone:'cyan',run:()=>onMode('Scripts')},
  {id:'lighting',title:'Adjust scene lighting',caption:'Open the working daylight and sun controls',icon:'sun',
   tone:'green',run:onLighting},
 ] as const;
 return <section className="cvs-iren-v122" aria-label="IREN Studio assistant" data-studio-iren-v122="local-controls">
  <div className="cvs-iren-profile">
   <div className="cvs-iren-orb" aria-hidden="true"><div className="cvs-iren-orbit-ring"/>
    <OrbitalMark/>
    <span className="cvs-iren-orb-core"/>
   </div>
   <div className="cvs-iren-profile-copy">
    <span className="cvs-iren-eyebrow">CREATIVE INTELLIGENCE / ANEVUM</span>
    <div><strong>IREN</strong><small>STUDIO</small></div>
    <p>Your existing creative companion</p>
   </div>
  </div>
  <button type="button" className="cvs-iren-ask" onClick={onOpenIren}
   aria-label="Open existing IREN companion">
   <span><strong>Ask IREN about your project</strong>
    <small>Opens the existing companion · no prompt is sent</small></span>
   <Icon name="arrow" size={17}/>
  </button>
  <div className="cvs-iren-context">
   <div className="cvs-iren-context-heading"><Icon name="box" size={15}/>
    <span>ACTIVE WORKSPACE</span><small>LOCAL</small></div>
   <strong>{projectName}</strong>
   <p>{objectCount} editable scene objects</p>
   {selectedObject&&<div className="cvs-iren-selected"><span>SELECTED</span><strong>{selectedObject}</strong>
    <div><button type="button" onClick={onInspect}>Properties</button>
     <button type="button" onClick={onFrame}>Frame object</button></div></div>}
  </div>
  <div className="cvs-iren-actions">
   <span>STUDIO ACTIONS <small>WORKING TOOLS</small></span>
   {actions.map(action=><button type="button" key={action.id}
    className={'cvs-iren-action is-'+action.tone}
    onClick={action.run} aria-label={action.title}>
    <span className="cvs-iren-action-icon"><Icon name={action.icon} size={18}/></span>
    <span className="cvs-iren-action-label"><strong>{action.title}</strong><small>{action.caption}</small></span>
    <Icon name="chevron-right" size={15}/>
   </button>)}
  </div>
  <div className="cvs-iren-connector">
   <span className="cvs-iren-status-dot"/>
   <div><strong>Local editor actions ready</strong>
    <small>AI suggestions and cloud operations are not connected to this review scene.</small></div>
  </div>
 </section>;
}

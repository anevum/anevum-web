import {useState} from 'react';
import type {Vec3} from '../../../world-composer/document.mjs';

/** Accessible transform pad for touch, mouse and keyboard-only creators.
 * Emits canonical coordinate deltas. The host runs them through the same
 * typed undoable SET_TRANSFORM operation as the WebGL keyboard viewport.
 */
export function StudioTransformPadV117({position,onMove,onFrame}:{
 position:Vec3;onMove:(delta:Vec3)=>void;onFrame:()=>void
}){
 const [step,setStep]=useState(.5);
 const AXES=['X','Y','Z'] as const;
 const direction=(axis:0|1|2,sign:-1|1)=>{
  const delta:Vec3=[0,0,0];delta[axis]=sign*step;onMove(delta);
 };
 return <div className="csn-transform-pad" aria-label="Position tools for selected object">
  <div className="csn-transform-heading"><strong>QUICK MOVE</strong>
   <button type="button" title="Center the camera on the selected object" onClick={onFrame}>Frame selection</button></div>
  <div className="csn-transform-step"><span>Move distance</span><div role="group" aria-label="Movement step">
   {[.25,.5,1].map(n=><button type="button" key={n} aria-pressed={step===n} onClick={()=>setStep(n)}>{n} m</button>)}
  </div></div>
  <div className="csn-axis-stack">
   {AXES.map((axis,i)=><div key={axis} className={'csn-axis csn-axis-'+axis.toLowerCase()}>
    <span className="csn-axis-name">{axis}</span>
    <button type="button" onClick={()=>direction(i as 0|1|2,-1)}
     aria-label={'Move '+axis+' negative '+step+' meters'}>−</button>
    <output aria-label={axis+' position'}>{position[i].toFixed(2)}</output>
    <button type="button" onClick={()=>direction(i as 0|1|2,1)}
     aria-label={'Move '+axis+' positive '+step+' meters'}>+</button>
   </div>)}
  </div>
  <p>Each move is an undoable world edit. Numeric transforms remain available above.</p>
 </div>;
}

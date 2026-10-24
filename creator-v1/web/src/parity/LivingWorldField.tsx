import {useEffect,useRef,useState} from 'react';
import {sceneProfile} from './SceneDirectorV136';
import {useLivingWorld,worldDensity,type WorldSector} from './LivingWorldState';
import type {InstituteInput,InstituteMetrics} from './InstituteRendererV136';
import './living-world-v136.css';
import './scene-materials-v136.css';
import './institute-optics-v136.css';

/** One persistent GPU context. All essential controls stay in semantic DOM. */
export function LivingWorldField({sector='hero',enabled}:{sector?:WorldSector;enabled:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const engine=useRef<ReturnType<typeof import('./InstituteRendererV136').createInstituteRenderer>|null>(null);
 const {signal,paused,previewSector}=useLivingWorld();
 const [renderer,setRenderer]=useState<'vector'|'webgl'>('vector');
 const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [visible,setVisible]=useState(document.visibilityState==='visible');
 const [saveData,setSaveData]=useState(false);
 const [epoch,setEpoch]=useState(0);
 const activeSector=enabled?(previewSector||sector):sector;
 const density=worldDensity(signal,activeSector),scene=sceneProfile(activeSector);
 const motionAllowed=enabled&&!paused&&!reduced&&!saveData&&visible;
 const active=motionAllowed&&renderer==='webgl';
 const input=useRef<InstituteInput>({sector:activeSector,density,verified:signal.source==='verified',animated:motionAllowed,saveData});
 input.current={sector:activeSector,density,verified:signal.source==='verified',animated:motionAllowed,saveData};
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection=(navigator as Navigator&{connection?:{saveData?:boolean;addEventListener?:(e:string,f:()=>void)=>void;removeEventListener?:(e:string,f:()=>void)=>void}}).connection;
  const sync=()=>{setReduced(media.matches);setSaveData(Boolean(connection?.saveData))};
  const visibility=()=>setVisible(document.visibilityState==='visible');
  sync();media.addEventListener('change',sync);connection?.addEventListener?.('change',sync);document.addEventListener('visibilitychange',visibility);
  return()=>{media.removeEventListener('change',sync);connection?.removeEventListener?.('change',sync);document.removeEventListener('visibilitychange',visibility)};
 },[]);
 useEffect(()=>{
  if(!enabled||saveData)return;
  let disposed=false;const element=canvas.current;if(!element)return;
  const state=(ready:boolean,_metrics:InstituteMetrics)=>{if(!disposed)setRenderer(ready?'webgl':'vector')};
  void import('./InstituteRendererV136').then(({createInstituteRenderer})=>{
   if(disposed)return;
   try{engine.current=createInstituteRenderer(element,input.current,state)}catch{setRenderer('vector')}
  }).catch(()=>{if(!disposed)setRenderer('vector')});
  const lost=(event:Event)=>{event.preventDefault();setRenderer('vector')};
  const restored=()=>setEpoch(value=>value+1);
  element.addEventListener('webglcontextlost',lost);element.addEventListener('webglcontextrestored',restored);
  return()=>{disposed=true;element.removeEventListener('webglcontextlost',lost);element.removeEventListener('webglcontextrestored',restored);engine.current?.dispose();engine.current=null;setRenderer('vector')};
 },[enabled,saveData,epoch]);
 useEffect(()=>{engine.current?.update(input.current)},[activeSector,density,signal.source,motionAllowed,saveData]);
 const anchorCount=signal.source==='verified'?Math.max(2,Math.min(15,Math.floor(2+density*12))):3;
 return <div className="p136-living-world" data-enabled={enabled} data-active={active} data-motion={motionAllowed}
  data-renderer={renderer} data-sector={activeSector} data-geometry={scene.geometry} data-source={signal.source} data-anchors={anchorCount} aria-hidden="true">
  <canvas ref={canvas} className="p136-living-canvas"/>
    <svg className="p136-living-vector" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="p136-living-nebula"><stop stopColor="#243e80"/><stop offset=".58" stopColor="#0b1a3b"/><stop offset="1" stopColor="#040b19"/></radialGradient>
        <radialGradient id="p136-living-core"><stop stopColor="#8ae6ff"/><stop offset=".18" stopColor="#3a8cbe"/><stop offset=".77" stopColor="#132b59"/><stop offset="1" stopColor="#060e28"/></radialGradient>
        <linearGradient id="p136-living-orbit"><stop stopColor="#4ce9ff" stopOpacity=".04"/><stop offset=".5" stopColor="#b1e9ff"/><stop offset="1" stopColor="#a787ff" stopOpacity=".12"/></linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#p136-living-nebula)"/>
      <g className="p136-living-orbitals">
        <ellipse cx="1080" cy="410" rx={315+density*60} ry="132" transform="rotate(-28 1080 410)" fill="none" stroke="url(#p136-living-orbit)" strokeWidth="6"/>
        <ellipse cx="1080" cy="410" rx={260+density*42} ry="193" transform="rotate(37 1080 410)" fill="none" stroke="url(#p136-living-orbit)" strokeWidth="2"/>
        <circle cx="1080" cy="410" r="152" fill="url(#p136-living-core)" stroke="#69c9ee" strokeOpacity=".38" strokeWidth="3"/>
        <circle cx="1080" cy="410" r="171" fill="none" stroke="#75dbff" strokeOpacity=".25" strokeWidth="18"/>
      </g>
      <g stroke="#60b8e6" strokeOpacity=".20" fill="none">
        {Array.from({length:13},(_,i)=><path key={'floor'+i} d={'M'+(i*160-260)+' 900L'+(680+(i-6)*25)+' 555'} strokeWidth="1"/>)}
        {Array.from({length:6},(_,i)=><path key={'lane'+i} d={'M0 '+(625+i*i*11)+'H1600'}/>)}
      </g>
      <g fill="#a7e8ff">
        {Array.from({length:anchorCount},(_,i)=>{
          const a=i*2.399963;
          const x=1080+Math.cos(a)*330,y=410+Math.sin(a)*210;
          return <circle key={'signal'+i} cx={x} cy={y} r={i%4===0?4:2} opacity={.4+(i%3)*.18}/>;
        })}
      </g>
    </svg>
    <div className="p136-living-shade"/>
 </div>;
}

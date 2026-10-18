import {useEffect,useRef,useState,type PointerEvent} from 'react';
import {BadgeInsignia} from './BadgeInsignia';
import {HonorInsignia} from './HonorInsignia';
import {DISTINCTION_CATALOG} from '../lib/player-recognition';
import type {RewardModelRenderer} from '../lib/reward-model-renderer';

export type InspectedReward=
 |{kind:'level';level:number;name:string;detail:string}
 |{kind:'badge'|'medal'|'ribbon';id:string;name:string;detail:string};

export function RewardInspector({reward,onClose,handle}:{
 reward:InspectedReward|null;onClose:()=>void;handle?:string|null;
}){
 const dialog=useRef<HTMLDialogElement>(null);
 const canvas=useRef<HTMLCanvasElement>(null);
 const native=useRef<RewardModelRenderer|null>(null);
 const pointer=useRef<{id:number;x:number;y:number}|null>(null);
 const [modelState,setModelState]=useState<'loading'|'ready'|'fallback'>('loading');
 const [posterFailed,setPosterFailed]=useState(false);
 const [playing,setPlaying]=useState(true);
 const [zoom,setZoom]=useState(1);
 useEffect(()=>{
  const target=dialog.current;if(!target)return;
  if(reward&&!target.open)target.showModal();
  if(!reward&&target.open)target.close();
 },[reward]);
 useEffect(()=>{
  native.current?.destroy();native.current=null;
  setModelState('loading');setPosterFailed(false);setPlaying(true);setZoom(1);
  if(!reward||reward.kind!=='level')return;
  let cancelled=false;
  const controller=new AbortController();
  void (async()=>{
   try{
    const {RewardModelRenderer,rewardModelBase}=await import('../lib/reward-model-renderer');
    if(cancelled||controller.signal.aborted)return;
    const element=canvas.current;if(!element)throw Error('Viewer not mounted');
    const model=new RewardModelRenderer(element);
    native.current=model;
    await model.load(rewardModelBase(reward.level,handle),reward.level,controller.signal);
    if(cancelled||controller.signal.aborted)return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
     model.pause();setPlaying(false);
    }
    setModelState('ready');
   }catch{
    if(!cancelled)setModelState('fallback');
   }
  })();
  return()=>{
   cancelled=true;controller.abort();
   native.current?.destroy();native.current=null;
  };
 },[reward?.kind,reward?.kind==='level'?reward.level:null,handle]);
 if(!reward)return <dialog ref={dialog} className="av75-reward-dialog"
  onClose={onClose} aria-label="Reward inspection"/>;
 const isModel=reward.kind==='level';
 const level=isModel?reward.level:null;
 const asset=level!==null?(handle?
  '/api/v1/members/'+encodeURIComponent(handle)+'/rewards/levels/'+level:
  '/api/v1/member/rewards/levels/'+level):'';
 function startDrag(event:PointerEvent<HTMLCanvasElement>){
  if(modelState!=='ready')return;
  pointer.current={id:event.pointerId,x:event.clientX,y:event.clientY};
  event.currentTarget.setPointerCapture(event.pointerId);
 }
 function moveDrag(event:PointerEvent<HTMLCanvasElement>){
  if(!pointer.current||pointer.current.id!==event.pointerId)return;
  const x=event.clientX,y=event.clientY;
  native.current?.rotate(x-pointer.current.x,y-pointer.current.y);
  pointer.current={id:event.pointerId,x,y};
 }
 function finishDrag(event:PointerEvent<HTMLCanvasElement>){
  if(pointer.current?.id!==event.pointerId)return;
  pointer.current=null;
  if(event.currentTarget.hasPointerCapture(event.pointerId))
   event.currentTarget.releasePointerCapture(event.pointerId);
 }
 return <dialog ref={dialog} className="av75-reward-dialog"
  aria-label={reward.name+' · earned reward inspection'}
  onCancel={onClose} onClose={onClose}
  onClick={event=>{if(event.target===dialog.current)onClose()}}>
  <div className="av75-reward-inspector">
   <header className="av75-reward-header">
    <div><span className="av75-reward-eyebrow">CONTINUANCE INSTITUTE / EARNED REWARD</span>
     <h2>{reward.name}</h2>
     <p>{isModel?'EVOLUTION · LEVEL '+String(level).padStart(2,'0'):reward.kind.toUpperCase()+' · VERIFIED RECOGNITION'}</p></div>
    <button type="button" className="av75-reward-dismiss" onClick={onClose} aria-label="Close reward inspector">Close ×</button>
   </header>
   <div className="av75-reward-stage" aria-label={isModel?'Full earned native Evolution model':'Earned insignia'}>
    {isModel?<div className="av75-model-stage">
      <canvas ref={canvas} className="av75-model-canvas" role="img"
       aria-label={reward.name+' · interactive full 3D model'}
       onPointerDown={startDrag} onPointerMove={moveDrag}
       onPointerUp={finishDrag} onPointerCancel={finishDrag}/>
      {modelState!=='ready'&&<div className="av75-model-poster" role="status">
       {!posterFailed&&<img src={asset+'/poster'} alt={reward.name+' · earned original artwork'}
        decoding="async" onError={()=>setPosterFailed(true)}/>}
       <span>{modelState==='loading'?'Preparing your earned model…':
         posterFailed?'This model is temporarily unavailable.':'Interactive 3D is unavailable on this device.'}</span>
      </div>}
    </div>:<div className="av75-insignia-stage">
       {reward.kind==='badge'?<BadgeInsignia badge={reward.id} size="large" state="earned"/>:
        DISTINCTION_CATALOG[reward.id]&&
          <HonorInsignia distinction={DISTINCTION_CATALOG[reward.id]}/>}
      </div>}
   </div>
   <p className="av75-reward-description">{reward.detail}</p>
   {isModel&&<div className="av75-reward-controls" aria-label="Model inspection controls">
    <button type="button" disabled={modelState!=='ready'} onClick={()=>native.current?.rotate(-22,0)} aria-label="Rotate model left">Rotate left</button>
    <button type="button" disabled={modelState!=='ready'} onClick={()=>native.current?.rotate(22,0)} aria-label="Rotate model right">Rotate right</button>
    <label>Zoom <input type="range" min=".7" max="1.5" step=".05" value={zoom}
      disabled={modelState!=='ready'} onChange={e=>{const next=Number(e.target.value);setZoom(next);native.current?.setZoom(next)}}/></label>
    <button type="button" disabled={modelState!=='ready'} onClick={()=>{if(playing){native.current?.pause()}else{native.current?.play()}setPlaying(v=>!v)}}>{playing?'Pause':'Play'}</button>
    <button type="button" disabled={modelState!=='ready'} onClick={()=>{native.current?.reset();setZoom(1)}}>Reset view</button>
   </div>}
   <footer className="av75-reward-footer">Award ownership comes from verified ANEVUM progression. Inspecting never grants XP, badges or additional access.</footer>
  </div>
 </dialog>;
}

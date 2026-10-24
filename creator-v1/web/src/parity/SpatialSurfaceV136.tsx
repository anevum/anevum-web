import {useCallback,type PointerEvent,type ReactNode} from 'react';
import './spatial-surface-v136.css';

/** Presentation-only pointer parallax for real interactive DOM cards.
 * No canvas controls, persistent tracking, account access or user telemetry.
 */
export function SpatialSurfaceV136({children,className='',label}:{children:ReactNode;className?:string;label?:string}){
 const onMove=useCallback((event:PointerEvent<HTMLDivElement>)=>{
  if(event.pointerType==='touch'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const rect=event.currentTarget.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const x=Math.max(-1,Math.min(1,((event.clientX-rect.left)/rect.width-.5)*2));
  const y=Math.max(-1,Math.min(1,((event.clientY-rect.top)/rect.height-.5)*2));
  event.currentTarget.style.setProperty('--spatial-x',String(x));
  event.currentTarget.style.setProperty('--spatial-y',String(y));
 },[]);
 const reset=useCallback((event:PointerEvent<HTMLDivElement>)=>{
  event.currentTarget.style.removeProperty('--spatial-x');
  event.currentTarget.style.removeProperty('--spatial-y');
 },[]);
 return <div className={'p136-spatial-surface '+className} aria-label={label}
  onPointerMove={onMove} onPointerLeave={reset} data-spatial-surface="v136.008">{children}</div>;
}

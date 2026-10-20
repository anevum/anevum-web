import type {PointerEvent} from "react";

/**
 * A purely presentational enhancement. Mouse and pen movement move the visual
 * layer a few degrees; touch, keyboard and reduced-motion users get the same
 * content and links without needing this effect.
 */
export function applyPointerDepth(event:PointerEvent<HTMLElement>,strength=6){
  if(event.pointerType!=="mouse"&&event.pointerType!=="pen")return;
  const node=event.currentTarget;
  const rect=node.getBoundingClientRect();
  if(rect.width<=0||rect.height<=0)return;
  const x=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
  const y=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
  node.style.setProperty("--depth-rotate-x",((0.5-y)*strength).toFixed(2)+"deg");
  node.style.setProperty("--depth-rotate-y",((x-0.5)*strength).toFixed(2)+"deg");
  node.style.setProperty("--depth-light-x",(x*100).toFixed(1)+"%");
  node.style.setProperty("--depth-light-y",(y*100).toFixed(1)+"%");
}
export function clearPointerDepth(event:PointerEvent<HTMLElement>){
  const node=event.currentTarget;
  node.style.removeProperty("--depth-rotate-x");
  node.style.removeProperty("--depth-rotate-y");
  node.style.removeProperty("--depth-light-x");
  node.style.removeProperty("--depth-light-y");
}

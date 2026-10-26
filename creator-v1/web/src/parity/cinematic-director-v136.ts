/** PARITY V136.013. Presentation math only: no network, private state, timers or alternate navigation. */
export type CinematicInput = {
  enabled: boolean;
  reducedMotion: boolean;
  forcedColors: boolean;
  saveData: boolean;
  paused: boolean;
  visible: boolean;
  hasApprovedSequence: boolean;
};
export type CinematicMode = 'off' | 'poster' | 'sequence';
export function cinematicMode(input:CinematicInput):CinematicMode {
  if (!input.enabled || input.forcedColors) return 'off';
  if (input.reducedMotion || input.saveData || input.paused || !input.visible) return 'poster';
  return input.hasApprovedSequence ? 'sequence' : 'poster';
}
export const unit=(value:number)=>Number.isFinite(value)?Math.max(0,Math.min(1,value)):0;
/** The hero progresses only when it leaves the viewport; page and search scroll remain native. */
export function cinematicScrollProgress(top:number,height:number):number {
  if (!Number.isFinite(top) || !Number.isFinite(height) || height<=0) return 0;
  return unit(-top/(height*.85));
}
/** Smoothly reveal the already-mounted real WebGL world. Never alter focus or the router. */
export function cinematicReveal(progress:number,start=.12,end=.74):number {
  if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>1||end<=start) return 1;
  const x=unit((unit(progress)-start)/(end-start));
  return 1-(x*x*(3-2*x));
}
export function cinematicFrameIndex(progress:number,count:number):number {
  if (!Number.isSafeInteger(count)||count<1||count>180) return 0;
  return Math.min(count-1,Math.floor(unit(progress)*count));
}


/** A prerendered layer must never disappear into partially loaded WebGL geometry.
 * Fallback deliberately includes the accessible vector and shader-only variants.
 * Focus and page routing remain independent of this decorative handoff.
 */
export function cinematicWorldReadiness(
 renderer:'webgl'|'vector'|null, assetState:string|null
):'ready'|'fallback'|'hold'{
 if(renderer===null||renderer==='vector')return 'fallback';
 if(assetState==='ready')return 'ready';
 if(assetState==='unavailable')return 'fallback';
 return 'hold';
}
export function cinematicRevealWhenReady(
 progress:number,readiness:'ready'|'fallback'|'hold',start:number,end:number
):number{
 return readiness==='hold'?1:cinematicReveal(progress,start,end);
}

/** Explicit visual inspection never reveals incompletely loaded geometry.
 * The visitor may return to the cinematic composition without navigation.
 */
export function cinematicInspectionOpacity(
 inspecting:boolean,readiness:'ready'|'fallback'|'hold',scrollOpacity:number
):number{
 return inspecting&&readiness==='ready'?0:unit(scrollOpacity);
}

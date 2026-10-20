import {OrbitalMark} from "./OrbitalMark";
import {applyPointerDepth,clearPointerDepth} from "../lib/pointer-depth";

/**
 * ANEVUM's existing mark remains unchanged. The surround is a decorative,
 * CSS-only dimensional arcade object, not a video/canvas or fake live widget.
 */
export function OrbitalStage({variant="hero"}:{variant?:"hero"|"heading"|"monument"}){
  return <div
    className={"orbital-depth-stage orbital-depth-stage--"+variant}
    aria-hidden="true"
    onPointerMove={e=>applyPointerDepth(e,11)}
    onPointerLeave={clearPointerDepth}
    >
    <div className="depth-stage-grid"/>
    <div className="depth-stage-glow"/>
    <div className="depth-stage-base"/>
    <div className="depth-stage-scene">
      <div className="depth-stage-halo depth-stage-halo-a"/>
      <div className="depth-stage-halo depth-stage-halo-b"/>
      <div className="depth-stage-backplate"/>
      <div className="depth-stage-rim"/>
      <div className="depth-stage-emblem">
        <div className="depth-stage-reflection"/>
        <OrbitalMark className="depth-stage-mark"/>
      </div>
      <span className="depth-stage-beacon"/>
      <span className="depth-stage-tick depth-stage-tick-a"/>
      <span className="depth-stage-tick depth-stage-tick-b"/>
    </div>
    <span className="depth-stage-serial">ANEVUM // CREATOR NETWORK</span>
  </div>;
}

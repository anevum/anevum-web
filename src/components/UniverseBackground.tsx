import type { CSSProperties } from "react";
import Mark from "./Mark";

const spokes = Array.from({ length: 12 });
const nodes = Array.from({ length: 10 });
const ticks = Array.from({ length: 24 });

export default function UniverseBackground() {
  return (
    <div className="universe-background launch-universe-background" aria-hidden="true">
      <div className="launch-universe-glow launch-universe-glow-a" />
      <div className="launch-universe-glow launch-universe-glow-b" />
      <div className="launch-universe-grid" />

      <div className="universe-engine launch-universe-engine">
        <div className="engine-halo" />
        <div className="engine-field engine-field-a" />
        <div className="engine-field engine-field-b" />

        <span className="engine-ring engine-ring-outer" />
        <span className="engine-ring engine-ring-major" />
        <span className="engine-ring engine-ring-mid" />
        <span className="engine-ring engine-ring-inner" />

        <span className="engine-orbit engine-orbit-a" />
        <span className="engine-orbit engine-orbit-b" />
        <span className="engine-orbit engine-orbit-c" />

        <div className="engine-spokes">
          {spokes.map((_, index) => (
            <span
              className="engine-spoke"
              key={"spoke-" + index}
              style={{ "--angle": index * 30 + "deg" } as CSSProperties}
            />
          ))}
        </div>

        <div className="engine-ticks">
          {ticks.map((_, index) => (
            <span
              className="engine-tick"
              key={"tick-" + index}
              style={{ "--angle": index * 15 + "deg" } as CSSProperties}
            />
          ))}
        </div>

        <div className="engine-nodes">
          {nodes.map((_, index) => (
            <span
              className="engine-node"
              key={"node-" + index}
              style={{
                "--angle": index * 36 + "deg",
                "--delay": -(index * 0.42) + "s"
              } as CSSProperties}
            />
          ))}
        </div>

        <div className="engine-core">
          <span className="engine-core-ring" />
          <span className="engine-core-light" />
          <span className="engine-core-mark"><Mark /></span>
        </div>
      </div>

      <div className="universe-vignette" />
    </div>
  );
}

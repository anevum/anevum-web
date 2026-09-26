import type { CSSProperties } from "react";

const spokes = Array.from({ length: 16 });
const nodes = Array.from({ length: 12 });
const ticks = Array.from({ length: 24 });

export default function UniverseBackground() {
  return (
    <div className="universe-background" aria-hidden="true">
      <div className="universe-nebula universe-nebula-a" />
      <div className="universe-nebula universe-nebula-b" />
      <div className="universe-nebula universe-nebula-c" />

      <div className="universe-stars universe-stars-far" />
      <div className="universe-stars universe-stars-mid" />
      <div className="universe-stars universe-stars-near" />
      <div className="universe-stars universe-stars-cross" />

      <div className="universe-engine">
        <div className="engine-halo" />
        <div className="engine-field engine-field-a" />
        <div className="engine-field engine-field-b" />

        <span className="engine-ring engine-ring-outer" />
        <span className="engine-ring engine-ring-major" />
        <span className="engine-ring engine-ring-mid" />
        <span className="engine-ring engine-ring-inner" />

        <span className="engine-polygon engine-polygon-outer" />
        <span className="engine-polygon engine-polygon-inner" />

        <span className="engine-orbit engine-orbit-a" />
        <span className="engine-orbit engine-orbit-b" />
        <span className="engine-orbit engine-orbit-c" />
        <span className="engine-orbit engine-orbit-d" />

        <div className="engine-spokes">
          {spokes.map((_, index) => (
            <span
              className="engine-spoke"
              key={"spoke-" + index}
              style={{ "--angle": index * 22.5 + "deg" } as CSSProperties}
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
                "--angle": index * 30 + "deg",
                "--delay": -(index * 0.37) + "s"
              } as CSSProperties}
            />
          ))}
        </div>

        <div className="engine-core">
          <span className="engine-core-ring" />
          <span className="engine-core-light" />
          <span className="engine-core-mark" />
        </div>

        <span className="engine-beacon engine-beacon-a" />
        <span className="engine-beacon engine-beacon-b" />
        <span className="engine-beacon engine-beacon-c" />
      </div>

      <div className="universe-vignette" />
    </div>
  );
}

import { useState } from "react";
import { CelestialEmblem } from "./CelestialEmblem";
import {RelicRaster,hasApprovedRelicRaster} from "./RelicRaster";
import {relicRasterAssets} from "../lib/relic-raster-assets";
import { seriesOneStudies } from "../lib/artifact-art";
import { seriesOneArtifacts, type SeriesOneArtifact } from "../lib/series-one";

function ArtifactPreview({ artifact, large = false }: { artifact: SeriesOneArtifact; large?: boolean }) {
  if(hasApprovedRelicRaster(artifact.level,artifact.name))
    return <RelicRaster level={artifact.level} name={artifact.name} large={large}/>;
  const study = seriesOneStudies.find(item => item.level === artifact.level && item.name === artifact.name);
  if (study) return <CelestialEmblem motif={study.motif} size={large ? "large" : "medium"} state="preview" />;
  return <div className={"series-artwork-pending" + (large ? " series-artwork-pending--large" : "")}
    aria-label={artifact.name + ": original artwork pending"}>
    <span className="series-artwork-numeral">{String(artifact.level).padStart(2, "0")}</span>
  </div>;
}

/**
 * Pure art-direction gallery: these cards are catalogue slots, NEVER user
 * inventory and NEVER award claims. A future approved illustration may replace
 * a pending numeral independently of server-verified member progression.
 */
export function ArtifactAtlas() {
  const [selected, setSelected] = useState(1);
  const [filter, setFilter] = useState<"all" | "illustrated">("all");
  const ready = (item:SeriesOneArtifact) => hasApprovedRelicRaster(item.level,item.name);
  const illustrated = (item:SeriesOneArtifact) => ready(item)||item.artStatus==="illustrated-study";
  const count = Object.keys(relicRasterAssets).length;
  const items = filter === "illustrated"
    ? seriesOneArtifacts.filter(illustrated)
    : seriesOneArtifacts;
  const focused = seriesOneArtifacts[selected - 1];
  return <section className="portal-box series-atlas" aria-labelledby="series-atlas-heading">
    <header className="portal-box-header">
      <div><span className="kicker">SERIES ONE / SIXTY NAMED RELICS</span>
        <h2 id="series-atlas-heading">THE ARTIFACT ATLAS</h2></div>
      <span className="portal-box-aside">{"60 NAMES · "+count+" APPROVED RENDERS · 4 DESIGN STUDIES"}</span>
    </header>
    <p className="artifact-section-note">
      Every name below comes from the existing level catalogue. Four original art studies
      exist and {count} fully reviewed raster renders are installed. Numbered slots are
      <strong> illustration pending, not finished icons or earned collectibles.</strong>
      New art cannot change member XP or progression rules.
    </p>
    <div className="series-atlas-controls" role="group" aria-label="Artwork gallery filter">
      <button type="button" aria-pressed={filter === "all"}
        className={filter === "all" ? "is-active" : ""}
        onClick={() => setFilter("all")}>ALL SIXTY</button>
      <button type="button" aria-pressed={filter === "illustrated"}
        className={filter === "illustrated" ? "is-active" : ""}
        onClick={() => { setFilter("illustrated"); if (!illustrated(seriesOneArtifacts[selected-1])) setSelected(1); }}>
        RENDERED / ART STUDIES
      </button>
      <span>PERSONAL INVENTORY IS SEPARATE</span>
    </div>
    <div className="series-atlas-grid">
      {items.map(item => <button type="button" key={item.level}
        className={"series-atlas-card" + (selected === item.level ? " is-selected" : "")}
        onClick={() => setSelected(item.level)}
        aria-pressed={selected === item.level}
        aria-label={"Level " + item.level + ", " + item.name + ". " + (ready(item)?"Approved raster illustration.":item.artStatus === "illustrated-study" ? "Illustrated artwork study." : "Artwork in development.")}>
        <span className="series-atlas-card-top">I · {String(item.level).padStart(2,"0")}</span>
        <span className="series-atlas-card-visual"><ArtifactPreview artifact={item}/></span>
        <strong>{item.name}</strong>
        <small>{ready(item)?"RENDERED RELIC":item.artStatus === "illustrated-study" ? "ART STUDY" : "ILLUSTRATION PENDING"}</small>
      </button>)}
    </div>
    <div className="series-atlas-inspector" aria-live="polite" aria-atomic="true">
      <div className="series-atlas-inspector-art"><ArtifactPreview artifact={focused} large /></div>
      <div>
        <span className="kicker">SERIES I / LEVEL {String(focused.level).padStart(2, "0")}</span>
        <h3>{focused.name}</h3>
        <p>{ready(focused) ? "An approved full-resolution raster master is installed for this original named relic. The catalogue view alone never awards it." :
          focused.artStatus === "illustrated-study"
          ? "A concept study currently exists for this named level. Materials, proportions and final 3D illustration remain subject to visual acceptance."
          : "Its name is defined by the existing progression service. A distinct, high-detail illustrated relic has not yet been produced."}</p>
        <small>Preview only. A member's earned level and artifact must be verified by the server.</small>
      </div>
    </div>
  </section>;
}

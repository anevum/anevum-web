import { Link } from "react-router-dom";
import PageIntro from "../components/PageIntro";

const archiveItems = [
  ["REPLY", "The former intended first commercial Transcosmic novel and its revision history."],
  ["THE TRANSCOSMIC", "The shared fictional universe, cosmology, worlds, institutions, and long-term narrative structure."],
  ["CONTINUANCE", "The institution, iconography, locations, and worldbuilding developed around the earlier public site."],
  ["WIKI + LATTICE", "Earlier reader-reference and relationship-exploration concepts attached to the fiction."],
  ["PUBLISHING", "The publisher-first ANEVUM identity, distribution work, edition planning, and release systems."],
  ["STORE + MERCH", "Earlier commerce experiments and physical-product directions."]
];

export default function Archive() {
  return (
    <>
      <PageIntro
        kicker="WIKI / ARCHIVE / TRANSCOSMIC"
        title="Transcosmic Archive"
        aside={<Link className="text-link" to="/wiki">Return to Wiki <span>→</span></Link>}
      >
        <p>
          This archive preserves ANEVUM's earlier publishing identity and the creative systems
          built around The Transcosmic. It is historical material, not the current definition of
          ANEVUM.
        </p>
      </PageIntro>

      <section className="content-section archive-grid">
        {archiveItems.map(([title, copy], index) => (
          <article key={title}>
            <span>A{String(index + 1).padStart(2, "0")}</span>
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="archive-rule">
        <div><span>PRESERVATION</span><h2>Archived does not mean erased.</h2></div>
        <p>
          The material remains part of Devon Akins's creative history and intellectual property.
          Separating it from the active ANEVUM system keeps the present coherent while preserving
          the option to return to publishing under a distinct identity later.
        </p>
      </section>
    </>
  );
}

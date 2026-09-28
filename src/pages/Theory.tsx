import { useEffect, useState } from "react";
import { fetchTheoryProgram, type TheoryProblem, type TheoryProgramFeed } from "../lib/data";

type TheoryTab = "problem" | "conjectures" | "workstreams" | "standards";

const tabs: [TheoryTab, string, string][] = [
  ["problem", "Problem", "Formal object"],
  ["conjectures", "Conjectures", "Falsifiable claims"],
  ["workstreams", "Workstreams", "Active mathematics"],
  ["standards", "Standards", "How claims are made"]
];

function pretty(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function activeProblem(feed: TheoryProgramFeed | null): TheoryProblem | null {
  return feed?.problems.find((problem) => problem.status === "ACTIVE") || feed?.problems[0] || null;
}

export default function Theory() {
  const [tab, setTab] = useState<TheoryTab>("problem");
  const [data, setData] = useState<TheoryProgramFeed | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchTheoryProgram()
      .then((next) => {
        if (!active) return;
        setData(next);
        setError("");
      })
      .catch((reason) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Theory program unavailable.");
      });
    return () => { active = false; };
  }, []);

  const problem = activeProblem(data);
  const conjectures = problem?.conjectures || [];
  const workstreams = problem?.workstreams || [];
  const standards = data?.program.standards || [];
  const tracks = data?.program.tracks || [];
  const openConjectures = conjectures.filter((row) => row.status === "OPEN").length;
  const domainLine = (problem?.domains || []).map(pretty).join(" · ");
  const baselineResults = problem?.results || [];

  return (
    <section className="compact-page theory-page">
      <header className="theory-heading">
        <div>
          <span className="theory-kicker">ANEVUM / MATHEMATICS &amp; THEORY</span>
          <h1>Mathematics as operating research.</h1>
          <p>
            Formal problems, assumptions, conjectures, counterexamples, derivations, and experiments are kept in one auditable chain. RHEN is the first applied laboratory; mathematical claims remain separate from production authority.
          </p>
        </div>
        <div className="theory-heading-status">
          <div><small>PROGRAM</small><strong>{data?.program.status || (error ? "UNAVAILABLE" : "LOADING")}</strong></div>
          <div><small>ACTIVE PROBLEM</small><strong>{problem?.problem_id || "—"}</strong></div>
          <div><small>OPEN CONJECTURES</small><strong>{openConjectures}</strong></div>
          <div><small>REGISTRY</small><strong>{data?.registry_hash ? data.registry_hash.slice(0, 12) : "—"}</strong></div>
        </div>
      </header>

      <div className="theory-workspace">
        <aside className="theory-tabs" aria-label="Theory sections">
          {tabs.map(([id, label, hint], index) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{label}</strong><small>{hint}</small></div>
            </button>
          ))}
        </aside>

        <div className="theory-content">
          {error ? <div className="theory-error">{error}</div> : null}

          {tab === "problem" && (
            <div className="theory-view">
              <div className="theory-title-row">
                <div>
                  <span>{problem?.problem_id || "ATP-001"} / FLAGSHIP PROBLEM</span>
                  <h2>{problem?.title || "Adaptive Inference Under Nonstationarity"}</h2>
                </div>
                <b>{problem?.status || "LOADING"}</b>
              </div>

              <p className="theory-question">{problem?.question || "Loading canonical problem definition…"}</p>

              <div className="theory-equations" aria-label="ATP-001 formalization">
                <article>
                  <span>OBJECTIVE</span>
                  <code>max<sub>π</sub> E[Σ r(a<sub>t</sub>,z<sub>t</sub>) − c(a<sub>t</sub>,a<sub>t−1</sub>) − λR<sub>t</sub>]</code>
                  <p>Maximize useful decisions while charging explicitly for switching, execution, and risk.</p>
                </article>
                <article>
                  <span>ENVIRONMENTAL VARIATION</span>
                  <code>V<sub>T</sub> = Σ ||θ<sub>t</sub> − θ<sub>t−1</sub>||</code>
                  <p>The environment may move; its total variation is generally unknown beforehand.</p>
                </article>
                <article>
                  <span>DYNAMIC REGRET</span>
                  <code>R<sub>T</sub> = Σ L<sub>t</sub>(a<sub>t</sub>) − Σ L<sub>t</sub>(a<sub>t</sub><sup>*</sup>)</code>
                  <p>Compare the system against a changing comparator rather than pretending one policy is optimal forever.</p>
                </article>
              </div>

              <div className="theory-two-column">
                <article>
                  <span>ASSUMPTIONS</span>
                  {(problem?.assumptions || []).map((item, index) => <p key={item}><b>{index + 1}</b>{item}</p>)}
                </article>
                <article>
                  <span>BOUNDARIES</span>
                  {(problem?.non_claims || []).map((item, index) => <p key={item}><b>{index + 1}</b>{item}</p>)}
                </article>
              </div>

              {baselineResults.length ? (
                <div className="theory-results">
                  <span>DERIVED BASELINES</span>
                  {baselineResults.map((row) => (
                    <article key={row.result_id}>
                      <header><b>{row.result_id}</b><strong>{row.title}</strong><i>{row.claim_class}</i></header>
                      <p>{row.statement}</p>
                      <footer>{row.scope}</footer>
                    </article>
                  ))}
                </div>
              ) : null}

              <div className="theory-domain-line">
                <span>DOMAINS</span><p>{domainLine || "Loading…"}</p>
              </div>
            </div>
          )}

          {tab === "conjectures" && (
            <div className="theory-view">
              <div className="theory-title-row">
                <div><span>ATP-001 / OPEN CLAIMS</span><h2>Conjectures are written to fail.</h2></div>
                <b>{openConjectures} OPEN</b>
              </div>
              <p className="theory-intro">No conjecture below is presented as a theorem or an original result. Novelty remains unassessed until literature review and independent verification say otherwise.</p>
              <div className="theory-conjecture-list">
                {conjectures.map((row) => (
                  <article key={row.conjecture_id}>
                    <header>
                      <div><span>{row.conjecture_id}</span><strong>{row.title}</strong></div>
                      <div><b>{row.status}</b><i>{row.novelty_state}</i></div>
                    </header>
                    <p>{row.statement}</p>
                    <footer><span>FALSIFICATION</span><p>{row.falsification}</p></footer>
                  </article>
                ))}
              </div>
            </div>
          )}

          {tab === "workstreams" && (
            <div className="theory-view">
              <div className="theory-title-row">
                <div><span>RESEARCH PROGRAM</span><h2>Parallel mathematical work, one evidence standard.</h2></div>
                <b>{workstreams.length} WORKSTREAMS</b>
              </div>
              <div className="theory-track-grid">
                {tracks.map((track) => (
                  <article key={track.track_id}>
                    <span>{track.track_id}</span><strong>{track.name}</strong><p>{track.scope}</p><b>{track.status}</b>
                  </article>
                ))}
              </div>
              <div className="theory-workstream-list">
                {workstreams.map((row) => (
                  <article key={row.workstream_id}>
                    <span>{row.workstream_id}</span>
                    <div><strong>{row.title}</strong><p>{row.objective}</p></div>
                    <b>{row.status}</b>
                  </article>
                ))}
              </div>
              <div className="theory-target">
                <span>TARGET BOUND</span>
                <p>{problem?.formalization.target_bound || "Loading canonical target…"}</p>
              </div>
            </div>
          )}

          {tab === "standards" && (
            <div className="theory-view">
              <div className="theory-title-row">
                <div><span>CLAIM DISCIPLINE</span><h2>The standard is part of the product.</h2></div>
                <b>{standards.length} RULES</b>
              </div>
              <div className="theory-standards">
                {standards.map((row) => (
                  <article key={row.standard_id}>
                    <span>{row.standard_id}</span><div><strong>{row.name}</strong><p>{row.rule}</p></div>
                  </article>
                ))}
              </div>
              <div className="theory-provenance">
                <span>PROVENANCE LADDER</span>
                <div>
                  <b>KNOWN</b><i>→</i><b>APPLICATION</b><i>→</i><b>POTENTIALLY NOVEL</b><i>→</i><b>ORIGINAL VERIFIED</b>
                </div>
                <p>Agents may propose mathematics. They cannot certify novelty. Failed proofs, rejected conjectures, null results, and counterexamples remain durable research artifacts.</p>
              </div>
              <div className="theory-boundary">
                <strong>THEORY ≠ PRODUCTION AUTHORITY</strong>
                <p>
                  The theory program can motivate a frozen RHEN experiment. It cannot change the live strategy, risk, sizing, execution, protected research stages, holdout access, or production promotion.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

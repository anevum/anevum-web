import { useEffect, useState } from "react";
import { fetchTheoryProgram, type TheoryProblem, type TheoryProgramFeed } from "../lib/data";

type TheoryTab = "problem" | "conjectures" | "workstreams" | "standards";
type ProblemFocus = "model" | "assumptions" | "results" | "scope";

const tabs: [TheoryTab, string, string][] = [
  ["problem", "Problem", "Formal object"],
  ["conjectures", "Conjectures", "Falsifiable claims"],
  ["workstreams", "Workstreams", "Active mathematics"],
  ["standards", "Standards", "Claim discipline"]
];

const problemFocusTabs: [ProblemFocus, string][] = [
  ["model", "Model"],
  ["assumptions", "Assumptions"],
  ["results", "Results"],
  ["scope", "Scope"]
];

function pretty(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formulaDisplay(value?: string) {
  return String(value || "—")
    .replaceAll("\\mathbb{E}", "E")
    .replaceAll("\\mathcal{R}", "R")
    .replaceAll("\\max", "max")
    .replaceAll("\\sum", "Σ")
    .replaceAll("\\lambda", "λ")
    .replaceAll("\\theta", "θ")
    .replaceAll("\\pi", "π")
    .replaceAll("\\lVert", "‖")
    .replaceAll("\\rVert", "‖")
    .replaceAll("\\left", "")
    .replaceAll("\\right", "")
    .replaceAll("\\;", " ")
    .replaceAll("\\,", " ")
    .replaceAll("{", "")
    .replaceAll("}", "");
}

function activeProblem(feed: TheoryProgramFeed | null): TheoryProblem | null {
  return feed?.problems.find((problem) => problem.status === "ACTIVE") || feed?.problems[0] || null;
}

export default function Theory() {
  const [tab, setTab] = useState<TheoryTab>("problem");
  const [problemFocus, setProblemFocus] = useState<ProblemFocus>("model");
  const [selectedConjectureId, setSelectedConjectureId] = useState("");
  const [selectedWorkstreamId, setSelectedWorkstreamId] = useState("");
  const [selectedStandardId, setSelectedStandardId] = useState("");
  const [selectedResultId, setSelectedResultId] = useState("");
  const [data, setData] = useState<TheoryProgramFeed | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      try {
        const next = await fetchTheoryProgram();
        if (!active) return;
        setData(next);
        setError("");
      } catch (reason) {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Theory program unavailable.");
      }
    };

    void refresh();
    const timer = window.setInterval(refresh, 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const problem = activeProblem(data);
  const conjectures = problem?.conjectures || [];
  const workstreams = problem?.workstreams || [];
  const standards = data?.program.standards || [];
  const tracks = data?.program.tracks || [];
  const results = problem?.results || [];
  const openConjectures = conjectures.filter((row) => row.status === "OPEN").length;

  const selectedConjecture =
    conjectures.find((row) => row.conjecture_id === selectedConjectureId) || conjectures[0];
  const selectedWorkstream =
    workstreams.find((row) => row.workstream_id === selectedWorkstreamId) || workstreams[0];
  const selectedStandard =
    standards.find((row) => row.standard_id === selectedStandardId) || standards[0];
  const selectedResult =
    results.find((row) => row.result_id === selectedResultId) || results[0];

  const authorityBounded =
    data?.authority
      ? Object.values(data.authority).every((value) => value === false)
      : false;

  return (
    <section className="compact-page workspace-screen story-workspace theory-page">
      <header className="workspace-heading story-heading theory-heading">
        <div>
          <span className="story-kicker theory-kicker">ANEVUM / MATHEMATICS &amp; THEORY</span>
          <h1>{data?.program.name || "Mathematics & Theory"}</h1>
          <p className="story-heading-copy theory-heading-copy">
            {data?.program.purpose || "Formal mathematical research connected to bounded RHEN experimentation."}
          </p>
        </div>
        <div className="workspace-heading-status story-status theory-heading-status">
          <div><small>ACTIVE PROBLEM</small><strong>{problem?.problem_id || "—"}</strong></div>
          <div><small>PROGRAM</small><strong>{data?.program.status || (error ? "UNAVAILABLE" : "LOADING")}</strong></div>
          <div><small>OPEN CONJECTURES</small><strong>{openConjectures}</strong></div>
          <div><small>REGISTRY</small><strong>{data?.registry_hash ? data.registry_hash.slice(0, 12) : "—"}</strong></div>
        </div>
      </header>

      <div className="workspace-layout story-layout theory-layout">
        <aside className="workspace-tabs story-tabs theory-tabs" aria-label="Theory sections">
          {tabs.map(([id, label, hint], index) => (
            <button
              key={id}
              type="button"
              className={tab === id ? "active" : ""}
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{label}</strong><small>{hint}</small></div>
            </button>
          ))}
        </aside>

        <div className="workspace-content story-content theory-content">
          {error ? <div className="theory-error">{error}</div> : null}

          {tab === "problem" ? (
            <div className="workspace-view story-view theory-view">
              <div className="theory-title-row">
                <div>
                  <span>{problem?.problem_id || "—"} / FLAGSHIP PROBLEM</span>
                  <h2>{problem?.title || "Loading canonical problem…"}</h2>
                </div>
                <b>{problem?.status || "LOADING"}</b>
              </div>

              <div className="theory-subnav" aria-label="Problem views">
                {problemFocusTabs.map(([id, label]) => (
                  <button
                    type="button"
                    key={id}
                    className={problemFocus === id ? "active" : ""}
                    aria-pressed={problemFocus === id}
                    onClick={() => setProblemFocus(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="theory-panel-body">
                {problemFocus === "model" ? (
                  <div className="theory-model-panel">
                    <p className="theory-question">{problem?.question || "Loading canonical problem definition…"}</p>
                    <div className="theory-equations" aria-label="Canonical problem formalization">
                      <article>
                        <span>OBJECTIVE</span>
                        <code>{formulaDisplay(problem?.formalization.objective_latex)}</code>
                        <p>Decision value net of switching, execution, and risk costs.</p>
                      </article>
                      <article>
                        <span>ENVIRONMENTAL VARIATION</span>
                        <code>{formulaDisplay(problem?.formalization.variation_latex)}</code>
                        <p>Movement in the latent environment without assuming its variation budget is known.</p>
                      </article>
                      <article>
                        <span>DYNAMIC REGRET</span>
                        <code>{formulaDisplay(problem?.formalization.dynamic_regret_latex)}</code>
                        <p>Performance against a changing comparator rather than a permanently fixed policy.</p>
                      </article>
                    </div>
                  </div>
                ) : null}

                {problemFocus === "assumptions" ? (
                  <div className="theory-two-column theory-assumption-grid">
                    <article>
                      <span>ASSUMPTIONS</span>
                      {(problem?.assumptions || []).map((item, index) => (
                        <p key={item}><b>{index + 1}</b>{item}</p>
                      ))}
                    </article>
                    <article>
                      <span>BOUNDARIES</span>
                      {(problem?.non_claims || []).map((item, index) => (
                        <p key={item}><b>{index + 1}</b>{item}</p>
                      ))}
                    </article>
                  </div>
                ) : null}

                {problemFocus === "results" ? (
                  <div className="theory-result-panel">
                    <div className="theory-index-grid theory-result-index" aria-label="Derived results">
                      {results.length ? results.map((row) => (
                        <button
                          type="button"
                          key={row.result_id}
                          className={selectedResult?.result_id === row.result_id ? "active" : ""}
                          aria-pressed={selectedResult?.result_id === row.result_id}
                          onClick={() => setSelectedResultId(row.result_id)}
                        >
                          <span>{row.result_id}</span><strong>{row.claim_class}</strong>
                        </button>
                      )) : <span className="theory-empty-inline">NO DERIVED RESULTS</span>}
                    </div>
                    {selectedResult ? (
                      <article className="theory-focus-card">
                        <header>
                          <div><span>{selectedResult.result_id}</span><strong>{selectedResult.title}</strong></div>
                          <b>{selectedResult.claim_class}</b>
                        </header>
                        <p>{selectedResult.statement}</p>
                        <footer><span>SCOPE</span><p>{selectedResult.scope}</p></footer>
                      </article>
                    ) : (
                      <div className="theory-empty">No canonical result is registered yet.</div>
                    )}
                    <div className="theory-target">
                      <span>TARGET BOUND</span>
                      <p>{problem?.formalization.target_bound || "No target bound is recorded."}</p>
                    </div>
                  </div>
                ) : null}

                {problemFocus === "scope" ? (
                  <div className="theory-scope-panel">
                    <section>
                      <span>DOMAINS</span>
                      <div className="theory-domain-chips">
                        {(problem?.domains || []).map((domain) => <b key={domain}>{pretty(domain)}</b>)}
                      </div>
                    </section>
                    <section>
                      <span>SUCCESS CRITERIA</span>
                      <div className="theory-criteria-grid">
                        {(problem?.success_criteria || []).map((criterion, index) => (
                          <p key={criterion}><b>{String(index + 1).padStart(2, "0")}</b>{criterion}</p>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {tab === "conjectures" ? (
            <div className="workspace-view story-view theory-view">
              <div className="theory-title-row">
                <div><span>{problem?.problem_id || "—"} / OPEN CLAIMS</span><h2>Conjectures are written to fail.</h2></div>
                <b>{openConjectures} OPEN</b>
              </div>

              <div className="theory-index-grid theory-conjecture-index" aria-label="Conjectures">
                {conjectures.map((row) => (
                  <button
                    type="button"
                    key={row.conjecture_id}
                    className={selectedConjecture?.conjecture_id === row.conjecture_id ? "active" : ""}
                    aria-pressed={selectedConjecture?.conjecture_id === row.conjecture_id}
                    onClick={() => setSelectedConjectureId(row.conjecture_id)}
                  >
                    <span>{row.conjecture_id}</span><strong>{row.status}</strong>
                  </button>
                ))}
              </div>

              <div className="theory-panel-body">
                {selectedConjecture ? (
                  <article className="theory-focus-card theory-conjecture-card">
                    <header>
                      <div><span>{selectedConjecture.conjecture_id}</span><strong>{selectedConjecture.title}</strong></div>
                      <div><b>{selectedConjecture.status}</b><i>{selectedConjecture.novelty_state}</i></div>
                    </header>
                    <div className="theory-claim-grid">
                      <section><span>STATEMENT</span><p>{selectedConjecture.statement}</p></section>
                      <section><span>FALSIFICATION</span><p>{selectedConjecture.falsification}</p></section>
                    </div>
                    <footer>
                      <span>CLAIM BOUNDARY</span>
                      <p>A conjecture remains unproved and carries no production authority until the canonical registry records otherwise.</p>
                    </footer>
                  </article>
                ) : <div className="theory-empty">No conjecture is currently registered.</div>}
              </div>
            </div>
          ) : null}

          {tab === "workstreams" ? (
            <div className="workspace-view story-view theory-view">
              <div className="theory-title-row">
                <div><span>RESEARCH PROGRAM</span><h2>Parallel mathematical work, one evidence standard.</h2></div>
                <b>{workstreams.length} ACTIVE</b>
              </div>

              <div className="theory-index-grid theory-workstream-index" aria-label="Workstreams">
                {workstreams.map((row) => (
                  <button
                    type="button"
                    key={row.workstream_id}
                    className={selectedWorkstream?.workstream_id === row.workstream_id ? "active" : ""}
                    aria-pressed={selectedWorkstream?.workstream_id === row.workstream_id}
                    onClick={() => setSelectedWorkstreamId(row.workstream_id)}
                  >
                    <span>{row.workstream_id}</span><strong>{row.title}</strong>
                  </button>
                ))}
              </div>

              <div className="theory-panel-body theory-workstream-panel">
                <div className="theory-track-grid">
                  {tracks.map((track) => (
                    <article key={track.track_id}>
                      <span>{track.track_id}</span>
                      <strong>{track.name}</strong>
                      <b>{track.status}</b>
                    </article>
                  ))}
                </div>
                {selectedWorkstream ? (
                  <article className="theory-focus-card">
                    <header>
                      <div><span>{selectedWorkstream.workstream_id}</span><strong>{selectedWorkstream.title}</strong></div>
                      <b>{selectedWorkstream.status}</b>
                    </header>
                    <p>{selectedWorkstream.objective}</p>
                    <footer><span>TARGET</span><p>{problem?.formalization.target_bound || "No canonical target is recorded."}</p></footer>
                  </article>
                ) : <div className="theory-empty">No workstream is currently registered.</div>}
              </div>
            </div>
          ) : null}

          {tab === "standards" ? (
            <div className="workspace-view story-view theory-view">
              <div className="theory-title-row">
                <div><span>CLAIM DISCIPLINE</span><h2>The standard is part of the product.</h2></div>
                <b>{authorityBounded ? "BOUNDED" : "CHECK"}</b>
              </div>

              <div className="theory-index-grid theory-standard-index" aria-label="Research standards">
                {standards.map((row) => (
                  <button
                    type="button"
                    key={row.standard_id}
                    className={selectedStandard?.standard_id === row.standard_id ? "active" : ""}
                    aria-pressed={selectedStandard?.standard_id === row.standard_id}
                    onClick={() => setSelectedStandardId(row.standard_id)}
                  >
                    <span>{row.standard_id}</span><strong>{row.name}</strong>
                  </button>
                ))}
              </div>

              <div className="theory-panel-body theory-standard-panel">
                {selectedStandard ? (
                  <article className="theory-focus-card theory-standard-card">
                    <header>
                      <div><span>{selectedStandard.standard_id}</span><strong>{selectedStandard.name}</strong></div>
                      <b>{data?.program.status || "—"}</b>
                    </header>
                    <p>{selectedStandard.rule}</p>
                  </article>
                ) : null}
                <div className="theory-provenance">
                  <span>PROVENANCE LADDER</span>
                  <div><b>KNOWN</b><i>→</i><b>APPLICATION</b><i>→</i><b>POTENTIALLY NOVEL</b><i>→</i><b>ORIGINAL VERIFIED</b></div>
                </div>
                <div className="theory-boundary">
                  <strong>THEORY ≠ PRODUCTION AUTHORITY</strong>
                  <p>{authorityBounded
                    ? "All public theory authority flags are false. Theory can motivate bounded research, not alter live trading or protected research stages."
                    : "Authority state is unavailable or requires inspection."}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

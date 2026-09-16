import { useEffect, useMemo, useState } from "react";
import { Grid3X3, Link2, Orbit } from "lucide-react";
import { Button } from "./ui";
import { BrandArt } from "./BrandArt";
import { displayIdentity, loadSession, type MemberSession } from "./memberClient";
import { loadMemberProgress, memberLevel, memberXP, onMemberProgressChange, type MemberProgress } from "./memberState";
import {
  loadPublishedWikiLinks,
  loadPublishedWikiPages,
  wikiCanonState,
  WikiBackendUnavailable,
  type WikiLink,
  type WikiPage,
} from "./wikiClient";

function blankProgress(): MemberProgress {
  return { version: 1, savedRecordIds: [], visitedRoutes: [], achievements: [], updatedAt: new Date(0).toISOString() };
}

function useMemberState() {
  const [session, setSession] = useState<MemberSession | null>(() => loadSession());
  const [progress, setProgress] = useState<MemberProgress>(() => {
    const current = loadSession();
    return current ? loadMemberProgress(current) : blankProgress();
  });

  useEffect(() => {
    const sync = () => {
      const next = loadSession();
      setSession(next);
      setProgress(next ? loadMemberProgress(next) : blankProgress());
    };
    const removeProgress = onMemberProgressChange(setProgress);
    window.addEventListener("anevum-member-session", sync);
    return () => {
      removeProgress();
      window.removeEventListener("anevum-member-session", sync);
    };
  }, []);

  return { session, progress };
}

const nodePositions = [
  [50, 49],
  [50, 18],
  [75, 30],
  [81, 58],
  [65, 77],
  [35, 77],
  [19, 58],
  [25, 30],
  [50, 84],
] as const;

function categoryLabel(page: WikiPage) {
  return page.category_id.replace(/[-_]/g, " ").toUpperCase();
}

export function Lattice() {
  const { session, progress } = useMemberState();
  const identity = displayIdentity(session);
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [links, setLinks] = useState<WikiLink[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadPublishedWikiPages(), loadPublishedWikiLinks()])
      .then(([nextPages, nextLinks]) => {
        if (cancelled) return;
        const visible = nextPages.slice(0, 9);
        const visibleIds = new Set(visible.map((page) => page.id));
        setPages(visible);
        setLinks(nextLinks.filter((link) => visibleIds.has(link.from_page_id) && visibleIds.has(link.to_page_id)));
        setSelectedId((current) => current && visibleIds.has(current) ? current : visible[0]?.id || null);
        setBackendReady(true);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof WikiBackendUnavailable) setBackendReady(false);
        else console.error(error);
        setPages([]);
        setLinks([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const selected = useMemo(() => pages.find((page) => page.id === selectedId) || pages[0] || null, [pages, selectedId]);
  const positionById = useMemo(() => new Map(pages.map((page, index) => [page.id, nodePositions[index] || nodePositions[nodePositions.length - 1]])), [pages]);

  return (
    <main className="lattice-page production-lattice lattice-v2">
      <section className="lattice-intro production-lattice-intro">
        <BrandArt variant="relations" />
        <div>
          <p className="eyebrow">LATTICE.ANEVUM</p>
          <h1>The universe as a place.</h1>
          <p>Lattice is a relational view of the live ANEVUM Wiki. Every visible node and connection resolves from Wiki-authorized records; Working and Superseded material never becomes current product truth here.</p>
          <div className="actions">
            {session ? <Button href="/rhenlink">OPEN @{identity.handle || "RHENLINK"}</Button> : <Button href="/rhenlink">CLAIM YOUR RHENLINK</Button>}
            <Button href="https://wiki.anevum.com/" quiet>OPEN THE CANONICAL RECORD</Button>
          </div>
        </div>
      </section>

      <section className={`lattice-workspace production-lattice-workspace ${pages.length ? "has-nodes" : "is-empty"}`}>
        <div className="graph-panel production-graph-panel">
          <div className="graph-orbit orbit-a" aria-hidden="true" />
          <div className="graph-orbit orbit-b" aria-hidden="true" />

          {links.length ? (
            <svg className="lattice-link-layer" aria-hidden="true" preserveAspectRatio="none">
              {links.map((link) => {
                const from = positionById.get(link.from_page_id);
                const to = positionById.get(link.to_page_id);
                if (!from || !to) return null;
                const focused = Boolean(selectedId && (link.from_page_id === selectedId || link.to_page_id === selectedId));
                return <line key={link.id} className={focused ? "is-focused" : ""} x1={`${from[0]}%`} y1={`${from[1]}%`} x2={`${to[0]}%`} y2={`${to[1]}%`} />;
              })}
            </svg>
          ) : null}

          {pages.map((page, index) => {
            const [left, top] = nodePositions[index] || nodePositions[nodePositions.length - 1];
            return (
              <button
                key={page.id}
                type="button"
                className={`graph-node ${selected?.id === page.id ? "selected" : ""}`}
                style={{ left: `${left}%`, top: `${top}%`, transform: "translate(-50%, -50%)" }}
                onClick={() => setSelectedId(page.id)}
              >
                <i />
                <strong>{page.title}</strong>
                <small>{categoryLabel(page)} · {wikiCanonState(page).toUpperCase()}</small>
              </button>
            );
          })}

          {!loading && pages.length === 0 ? (
            <div className="lattice-empty-core">
              <Orbit size={30} strokeWidth={1.1} />
              <span>WIKI RELATION SPACE / 000</span>
              <strong>{backendReady ? "No product-visible nodes yet." : "Canonical database unavailable."}</strong>
              <p>{backendReady ? "Lattice will populate only when the live Wiki exposes records in a product-visible lifecycle state." : "Lattice is withholding universe material because it cannot resolve the Wiki authority. It will not fall back to another lore source."}</p>
              <Button href="https://wiki.anevum.com/" quiet>OPEN WIKI</Button>
            </div>
          ) : null}

          {loading ? (
            <div className="lattice-empty-core loading"><Grid3X3 size={25} strokeWidth={1.15} /><span>RESOLVING WIKI GRAPH</span><strong>Loading canonical records and relations.</strong></div>
          ) : null}

          <div className="graph-legend"><Grid3X3 size={15} /><span>WIKI-AUTHORIZED NODES / {pages.length}</span></div>
          <div className="lattice-link-count">RELATIONS / {links.length}</div>
          <div className="graph-caption">RELATION IS THE NAVIGATION.</div>
        </div>

        <aside className="graph-inspector production-inspector">
          {selected ? (
            <>
              <BrandArt variant="relations" />
              <span className="meta">FOCUS / {categoryLabel(selected)}</span>
              <h2>{selected.title}</h2>
              <p>{selected.summary}</p>
              <Button href={`https://wiki.anevum.com/${encodeURIComponent(selected.slug)}`}>OPEN CANONICAL RECORD</Button>
              <div className="lattice-join connected">
                <span>WIKI LIFECYCLE STATE</span>
                <strong>{wikiCanonState(selected).toUpperCase()}</strong>
                <p>Lattice preserves the state returned by the live Wiki. It does not promote, rewrite, or independently canonize this record.</p>
              </div>
            </>
          ) : (
            <div className="lattice-inspector-empty">
              <Link2 size={24} strokeWidth={1.15} />
              <span className="meta">NO FOCUS</span>
              <h2>A graph earns its nodes.</h2>
              <p>ANEVUM does not preload parallel lore into Lattice. The live Wiki creates the relational layer.</p>
              <Button href="https://wiki.anevum.com/" quiet>VIEW WIKI</Button>
            </div>
          )}

          <div className={`lattice-join ${session ? "connected" : ""}`}>
            <span>{session ? `RHENLINK ACTIVE / LEVEL ${memberLevel(progress)}` : "RHENLINK / OPTIONAL IDENTITY"}</span>
            {session ? <strong>@{identity.handle || "member"}</strong> : <strong>EXPLORE AS GUEST</strong>}
            <p>{session ? `${memberXP(progress)} XP · ${progress.savedRecordIds.length} saved · ${progress.achievements.length} achievements` : "Sign in when you want saves, progress, and achievements to persist with you."}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}

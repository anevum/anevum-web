import { useEffect, useMemo, useState } from "react";
import { Grid3X3, Link2, Orbit } from "lucide-react";
import { Button, VisualArt } from "./ui";
import { displayIdentity, loadSession, type MemberSession } from "./memberClient";
import { loadMemberProgress, memberLevel, memberXP, onMemberProgressChange, type MemberProgress } from "./memberState";
import { loadPublishedWikiPages, WikiBackendUnavailable, type WikiPage } from "./wikiClient";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadPublishedWikiPages()
      .then((next) => {
        if (cancelled) return;
        setPages(next.slice(0, 9));
        setSelectedId((current) => current || next[0]?.id || null);
        setBackendReady(true);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof WikiBackendUnavailable) setBackendReady(false);
        else console.error(error);
        setPages([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const selected = useMemo(() => pages.find((page) => page.id === selectedId) || pages[0] || null, [pages, selectedId]);

  return (
    <main className="lattice-page production-lattice lattice-v2">
      <section className="lattice-intro production-lattice-intro">
        <VisualArt visualKey="connected" />
        <div>
          <p className="eyebrow">LATTICE.ANEVUM</p>
          <h1>The universe as a place.</h1>
          <p>Explore only what ANEVUM has actually published. Every visible node originates in the moderated public Wiki; private canon and rejected drafts never become LATTICE content.</p>
          <div className="actions">
            {session ? <Button href="/rhenlink">OPEN @{identity.handle || "RHENLINK"}</Button> : <Button href="/rhenlink">CLAIM YOUR RHENLINK</Button>}
            <Button href="/wiki" quiet>OPEN THE PUBLIC RECORD</Button>
          </div>
        </div>
      </section>

      <section className={`lattice-workspace production-lattice-workspace ${pages.length ? "has-nodes" : "is-empty"}`}>
        <div className="graph-panel production-graph-panel">
          <div className="graph-orbit orbit-a" aria-hidden="true" />
          <div className="graph-orbit orbit-b" aria-hidden="true" />

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
                <small>{categoryLabel(page)}</small>
              </button>
            );
          })}

          {!loading && pages.length === 0 ? (
            <div className="lattice-empty-core">
              <Orbit size={30} strokeWidth={1.1} />
              <span>PUBLIC RELATION SPACE / 000</span>
              <strong>{backendReady ? "No published nodes yet." : "Publication database pending."}</strong>
              <p>{backendReady ? "LATTICE will populate as administrator-approved Wiki pages become public." : "The interface is ready, but the checked-in public Wiki migration still needs to be applied before published records can exist."}</p>
              <Button href="/wiki" quiet>OPEN WIKI</Button>
            </div>
          ) : null}

          {loading ? (
            <div className="lattice-empty-core loading"><Grid3X3 size={25} strokeWidth={1.15} /><span>RESOLVING PUBLIC GRAPH</span><strong>Loading approved records.</strong></div>
          ) : null}

          <div className="graph-legend"><Grid3X3 size={15} /><span>APPROVED PUBLIC NODES / {pages.length}</span></div>
          <div className="graph-caption">RELATION IS THE NAVIGATION.</div>
        </div>

        <aside className="graph-inspector production-inspector">
          {selected ? (
            <>
              <VisualArt visualKey="connected" />
              <span className="meta">FOCUS / {categoryLabel(selected)}</span>
              <h2>{selected.title}</h2>
              <p>{selected.summary}</p>
              <Button href={`/wiki/${encodeURIComponent(selected.slug)}`}>OPEN RECORD</Button>
              <div className="lattice-join connected">
                <span>PUBLICATION STATE</span>
                <strong>ADMIN APPROVED</strong>
                <p>This node exists because its current Wiki revision has passed publication review.</p>
              </div>
            </>
          ) : (
            <div className="lattice-inspector-empty">
              <Link2 size={24} strokeWidth={1.15} />
              <span className="meta">NO FOCUS</span>
              <h2>A graph earns its nodes.</h2>
              <p>ANEVUM does not preload private canon into LATTICE. Approved Wiki publication creates the public relational layer.</p>
              <Button href="/wiki" quiet>VIEW WIKI</Button>
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

import { readRepository, safeExternal, type PublicRepositoryMetadata } from "../lib/api";
import { useResource } from "../lib/useResource";

function supportedGithubLink(source: string | null): boolean {
  const url = safeExternal(source);
  if (!url || url.hostname !== "github.com" || url.search || url.hash) return false;
  const parts = url.pathname.split("/").filter(Boolean);
  return parts.length === 2 && /^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/.test(parts[0]) &&
    /^[A-Za-z0-9_.-]{1,100}$/.test(parts[1]);
}

export function RepositoryPanel({projectId,sourceUrl}:{projectId:string;sourceUrl:string|null}) {
  const eligible=supportedGithubLink(sourceUrl);
  const meta=useResource<PublicRepositoryMetadata|null>(
    async signal=>eligible?(await readRepository(projectId,signal)).repository:null,
    [projectId,sourceUrl,eligible]
  );
  if (!eligible) return null;
  return <section className="repo-panel" aria-label="Published GitHub repository metadata">
    <div className="repo-heading"><span className="kicker">SOURCE SIGNAL / GITHUB</span><span className="repo-origin">PUBLIC METADATA ONLY</span></div>
    {meta.state==="loading"&&<p className="repo-note" role="status">Checking published repository details…</p>}
    {meta.state==="error"&&<p className="repo-note" role="status">GitHub details are unavailable right now. The source link above still works.</p>}
    {meta.state==="ready"&&meta.data&&<>
      <h3>{meta.data.fullName}</h3>
      {meta.data.description&&<p className="repo-description">{meta.data.description}</p>}
      <div className="repo-facts">
        <div><span>LANGUAGE</span><strong>{meta.data.language||"NOT LISTED"}</strong></div>
        <div><span>REPOSITORY LICENSE</span><strong>{meta.data.license||"NOT STATED"}</strong></div>
        <div><span>GITHUB STATUS</span><strong>{meta.data.archived?"ARCHIVED":"PUBLIC"}</strong></div>
      </div>
      <p className="repo-note">{meta.data.notice}</p>
    </>}
    <p className="repo-footnote">Repository metadata does not verify authorship, safety, licensing rights or permission to redistribute.</p>
  </section>;
}

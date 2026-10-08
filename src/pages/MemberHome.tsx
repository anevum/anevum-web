import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { memberAuthClient } from "../member/auth-client";
import { publicProducts } from "../data/products";
import { fieldNotes } from "../data/fieldNotes";
import { useMemberAvailability } from "../member/useMemberAvailability";

type MemberData = {
  user: { name?: string; email?: string };
  profile: { displayName: string; theme: string };
  savedApps: string[];
  follows: string[];
  entitlements: { app: string; capability: string }[];
};

export default function MemberHome() {
  const availability = useMemberAvailability();
  const { data: session, isPending } = memberAuthClient.useSession();
  const [data, setData] = useState<MemberData | null>(null);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState("");
  const products = publicProducts();

  const load = useCallback(async () => {
    const response = await fetch("/api/member/me", { cache: "no-store" });
    if (!response.ok) throw new Error("Personal library is unavailable.");
    setData(await response.json() as MemberData);
  }, []);

  useEffect(() => {
    if (!session?.user || availability !== "available") return;
    let active = true;
    void load().catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load personal library.");
    });
    return () => { active = false; };
  }, [session?.user, availability, load]);

  const toggle = async (kind: "saved-apps" | "follows", slug: string, selected: boolean) => {
    setUpdating(kind + slug);
    try {
      const response = await fetch("/api/member/" + kind + "/" + slug, {
        method: selected ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Could not save that change.");
      await load();
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Update failed.");
    } finally { setUpdating(""); }
  };

  if (availability === "checking" || isPending) return <section className="member-page"><p role="status">Loading account…</p></section>;
  if (availability !== "available") return <section className="member-page"><h1>Member accounts are not open yet.</h1><Link to="/products">Browse projects</Link></section>;
  if (!session?.user) return <section className="member-page"><h1>My Space</h1><p>Sign in to access your personal library.</p><Link to="/sign-in">Sign in</Link></section>;

  const notes = fieldNotes
    .filter((note) => data?.follows.includes("rhen") && (note.systems.includes("RHEN")))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  return (
    <div className="member-page">
      <header className="member-page-heading">
        <div><p className="workshop-kicker">My Space</p><h1>{data?.profile.displayName || session.user.name || "Your projects"}</h1><p>A small place to keep track of what you're using and following.</p></div>
        <Link to="/me/settings">Account settings</Link>
      </header>
      {error && <p role="alert" className="member-alert">{error}</p>}
      <section className="member-section">
        <h2>My applications</h2>
        {!data ? <p>Loading library…</p> : data.savedApps.length ? (
          <div className="member-library">
            {products.filter((product) => data.savedApps.includes(product.slug)).map((product) => (
              <Link key={product.slug} to={product.slug === "rhen" ? "/apps/rhen" : product.routes.home}>
                <strong>{product.name}</strong><span>{product.oneLine}</span><b>Open →</b>
              </Link>
            ))}
          </div>
        ) : <p>No saved applications yet. Browse below to save your first one.</p>}
      </section>
      <section className="member-section">
        <h2>Explore projects</h2>
        <div className="member-library">
          {products.map((product) => {
            const saved = data?.savedApps.includes(product.slug) || false;
            const following = data?.follows.includes(product.slug) || false;
            return (
              <article key={product.slug}>
                <div><strong>{product.name}</strong><p>{product.oneLine}</p></div>
                <div className="member-card-actions">
                  <Link to={product.slug === "rhen" ? "/apps/rhen" : product.routes.home}>Open</Link>
                  <button type="button" disabled={!data || Boolean(updating)} onClick={() => void toggle("saved-apps", product.slug, saved)}>{saved ? "Unsave" : "Save"}</button>
                  <button type="button" disabled={!data || Boolean(updating)} onClick={() => void toggle("follows", product.slug, following)}>{following ? "Unfollow" : "Follow"}</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      {notes.length > 0 && (
        <section className="member-section">
          <h2>Updates from projects you follow</h2>
          <div className="member-notes">{notes.map((note) => <Link key={note.slug} to={"/field-notes/" + note.slug}><time>{note.date}</time><strong>{note.title}</strong></Link>)}</div>
        </section>
      )}
    </div>
  );
}

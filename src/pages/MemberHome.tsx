import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { memberAuthClient } from "../member/auth-client";
import { publicProducts } from "../data/products";
import { fieldNotes } from "../data/fieldNotes";
import SystemIcon from "../components/company/SystemIcon";
import { useMemberAvailability } from "../member/useMemberAvailability";

type MemberData = {
  user: { name?: string; email?: string };
  profile: { displayName: string; theme: string };
  savedApps: string[];
  follows: string[];
  entitlements: { app: string; capability: string }[];
};
type MemberIdentity = { name?: string | null; email?: string | null };

export default function MemberHome() {
  const availability = useMemberAvailability();
  if (availability === "available") return <SignedInCommand />;
  return <CommandHome checking={availability === "checking"} />;
}

function SignedInCommand() {
  const { data: session, isPending } = memberAuthClient.useSession();
  return <CommandHome enabled checking={isPending} identity={session?.user} />;
}

function CommandHome({ enabled = false, checking = false, identity }: {
  enabled?: boolean; checking?: boolean; identity?: MemberIdentity;
}) {
  const [data, setData] = useState<MemberData | null>(null);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState("");
  const [operator, setOperator] = useState(false);
  const products = publicProducts();
  const signedIn = enabled && Boolean(identity);
  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch("/api/member/me", { cache: "no-store", signal });
    if (!response.ok) throw new Error("Could not load your Command. Please try again.");
    const next = await response.json() as MemberData;
    if (!signal?.aborted) setData(next);
  }, []);

  useEffect(() => {
    setData(null); setError("");
    if (!signedIn) return;
    const controller = new AbortController();
    void load(controller.signal).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not load your account.");
    });
    return () => controller.abort();
  }, [signedIn, identity?.email, load]);

  useEffect(() => {
    // Google member identity is never enough for an owner terminal link.
    // The owner-only Cloudflare Access JWT must also be accepted by the Worker.
    setOperator(false);
    if (!signedIn) return;
    const controller = new AbortController();
    void fetch("/api/command/session", { cache: "no-store", signal: controller.signal })
      .then(async response => response.ok ? response.json() : null)
      .then((value: { command_admin?: boolean } | null) => {
        if (!controller.signal.aborted) setOperator(value?.command_admin === true);
      })
      .catch(() => { if (!controller.signal.aborted) setOperator(false); });
    return () => controller.abort();
  }, [signedIn, identity?.email]);

  const toggle = async (kind: "saved-apps" | "follows", slug: string, selected: boolean) => {
    setUpdating(kind + slug);
    try {
      const response = await fetch("/api/member/" + kind + "/" + slug, {
        method: selected ? "DELETE" : "PUT", headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error("Could not save that change. Please try again.");
      await load(); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Update failed."); }
    finally { setUpdating(""); }
  };
  const name = data?.profile.displayName || identity?.name || "Your account";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  const notes = [...fieldNotes].filter(note => products.some(product =>
    data?.follows.includes(product.slug) && product.system && note.systems.includes(product.system)))
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const saved = products.filter(product => data?.savedApps.includes(product.slug));

  return (
    <div className="member-command">
      <aside className="member-command-sidebar">
        <p className="workshop-kicker">ANEVUM</p><strong className="member-command-title">Command</strong>
        <p>Your home for the things you use.</p>
        <nav aria-label="Member navigation">
          <Link to="/command" aria-current="page" className="active">My Command</Link>
          <Link to="/commons">Commons research</Link>
          {signedIn ? <a href="#command-following">Following</a> : <Link to="/feed">Updates</Link>}
          <Link to={signedIn ? "/me/settings" : "/sign-in"}>Profile &amp; account</Link>
          <Link to="/me/rewards">Member rewards</Link>
          <Link to="/products">All projects</Link>
        </nav>
        <div className="member-command-account">
          {signedIn ? <><span className="member-avatar" aria-hidden="true">{initials}</span><strong>{name}</strong><span>{identity?.email}</span><Link to="/me/settings">Manage account</Link></> : <><strong>Your personal space</strong><p>Save programs and follow their development when member accounts open.</p>{enabled && !checking && <Link to="/sign-in">Sign in</Link>}</>}
        </div>
      </aside>
      <main className="member-command-content">
        <header className="member-command-heading">
          <div><p className="workshop-kicker">Your private workspace</p><h1>{signedIn ? name : "Your Command, in one place."}</h1><p>Manage your personal programs and account here. Shared research and discussions happen separately in Commons.</p></div>
          {signedIn && <Link to="/me/settings">Edit profile</Link>}
        </header>
        {checking ? <p className="member-command-notice" role="status">Checking your account…</p> : !signedIn ? <div className="member-command-notice" role="status"><strong>{enabled ? "Sign in to make this your Command." : "Member accounts are not open yet."}</strong><p>{enabled ? "Your saved programs, follows, and profile belong to your account." : "You can explore the projects and their public records now. Saving programs and profile changes will open with registration."}</p>{enabled && <Link to="/sign-in">Continue with Google</Link>}</div> : null}
        {error && <div className="member-command-notice member-alert" role="alert"><p>{error}</p><button type="button" onClick={() => void load().then(() => setError("")).catch(reason => setError(String(reason.message)))}>Retry</button></div>}
        <section className="member-command-section member-command-rewards" aria-labelledby="command-commons-title"><div><h2 id="command-commons-title">Commons</h2><p>Research, questions and contributions across the ANEVUM community. A small invitation-only beta is in development.</p></div><Link to="/commons">Enter Commons</Link></section>
        {signedIn && operator && <section className="member-command-section" aria-labelledby="command-operator">
          <div className="member-command-rewards">
            <div>
              <h2 id="command-operator">Private RHEN operator workspace</h2>
              <p>Access to the existing restricted terminal is independently verified by Cloudflare Access. This is separate from ordinary member accounts and bot drafts.</p>
            </div>
            <Link to="/command/rhen/operate">Open RHEN Terminal</Link>
          </div>
        </section>}
        {signedIn && <section className="member-command-section" aria-labelledby="command-saved"><h2 id="command-saved">Saved programs</h2>{!data ? <p role="status">Loading your programs…</p> : saved.length ? <div className="member-command-saved">{saved.map(product => <Link key={product.slug} to={product.routes.app || product.routes.home}><strong>{product.name}</strong><span>{product.category}</span><b>Open program</b></Link>)}</div> : <p>Nothing saved yet. Save a program below to keep it here.</p>}</section>}
        <section className="member-command-section" aria-labelledby="command-programs">
          <div className="member-command-section-heading"><h2 id="command-programs">Programs</h2><Link to="/products">Project directory</Link></div>
          {products.map(product => {
            const isSaved = data?.savedApps.includes(product.slug) || false;
            const following = data?.follows.includes(product.slug) || false;
            return <article className="member-program" key={product.slug}>
              <header><div className="member-program-identity">{product.system && <SystemIcon system={product.system} size="md" />}<div><h3>{product.name}</h3><span>{product.category}</span></div></div><span className="member-program-access">{signedIn ? "Member workspace" : "Public records available"}</span></header>
              <p>{product.oneLine}</p>
              <div className="member-program-features">{product.memberFeatures?.map(feature => signedIn ? <Link key={feature.id} to={feature.route}><strong>{feature.name}</strong><span>{feature.description}</span></Link> : <div key={feature.id}><strong>{feature.name}</strong><span>{feature.description}</span></div>)}</div>
              <footer><Link className="member-program-open" to={signedIn && product.routes.app ? product.routes.app : product.routes.home}>{signedIn ? "Open " + product.name : "Explore " + product.name}</Link>{signedIn && <div className="member-card-actions"><button type="button" aria-pressed={isSaved} disabled={!data || Boolean(updating)} onClick={() => void toggle("saved-apps", product.slug, isSaved)}>{isSaved ? "Saved" : "Save program"}</button><button type="button" aria-pressed={following} disabled={!data || Boolean(updating)} onClick={() => void toggle("follows", product.slug, following)}>{following ? "Following" : "Follow updates"}</button></div>}</footer>
            </article>;
          })}
        </section>
        <section className="member-command-section member-command-rewards" aria-labelledby="command-rewards-title"><div><h2 id="command-rewards-title">Member rewards</h2><p>We are exploring ways to return genuine business surplus to people who support ANEVUM. Rewards are not active; no credits accrue.</p></div><Link to="/me/rewards">How rewards may work</Link></section>
        {signedIn && <section id="command-following" className="member-command-section" aria-labelledby="command-following-title"><h2 id="command-following-title">Following</h2>{notes.length ? <div className="member-notes">{notes.map(note => <Link key={note.slug} to={"/field-notes/" + note.slug}><time>{note.date}</time><strong>{note.title}</strong></Link>)}</div> : <p>Follow a program to see its published notes and updates here.</p>}</section>}
      </main>
    </div>
  );
}

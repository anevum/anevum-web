import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { memberAuthClient } from "../member/auth-client";
import { publicProducts } from "../data/products";
import { fieldNotes } from "../data/fieldNotes";
import SystemIcon from "../components/company/SystemIcon";
import { useMemberAvailability } from "../member/useMemberAvailability";
import { parseMemberCommandResponse, verifiedPreferenceAcknowledgement, type MemberCommandData } from "../member/member-command-contract";

type MemberIdentity = { id?: string | null; name?: string | null; email?: string | null };

export default function MemberHome() {
  const availability = useMemberAvailability();
  if (availability === "available") return <SignedInCommand />;
  return <CommandHome checking={availability === "checking"} />;
}

function SignedInCommand() {
  const { data: session, isPending } = memberAuthClient.useSession();
  return <CommandHome key={session?.user?.id || "signed-out"} enabled checking={isPending} identity={session?.user} />;
}

function CommandHome({ enabled = false, checking = false, identity }: {
  enabled?: boolean; checking?: boolean; identity?: MemberIdentity;
}) {
  const [data, setData] = useState<MemberCommandData | null>(null);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState("");
  const [operator, setOperator] = useState(false);
  const scope = useRef<AbortController | null>(null);
  const mutationInProgress = useRef(false);
  const products = publicProducts();
  const signedIn = enabled && !checking && Boolean(identity?.id);
  const load = useCallback(async (signal: AbortSignal) => {
    if (signal.aborted || !identity?.id) return;
    const response = await fetch("/api/member/me", {
      method: "GET", cache: "no-store", credentials: "same-origin",
      redirect: "manual", signal
    });
    if (signal.aborted) return;
    if (!response.ok) throw new Error("Could not verify your current Command session.");
    const body: unknown = await response.json();
    if (signal.aborted) return;
    const next = parseMemberCommandResponse(body, identity.id);
    if (!signal.aborted) setData(next);
  }, [identity?.id]);

  useEffect(() => {
    setData(null); setError(""); setUpdating("");
    mutationInProgress.current = false;
    if (!signedIn) {
      scope.current = null;
      return;
    }
    const controller = new AbortController();
    scope.current = controller;
    void load(controller.signal).catch(() => {
      if (!controller.signal.aborted) {
        setData(null);
        setError("Could not verify your current Command account. Sign in again or retry.");
      }
    });
    return () => {
      controller.abort();
      if (scope.current === controller) scope.current = null;
    };
  }, [signedIn, identity?.id, load]);

  useEffect(() => {
    // Google member identity is never enough for an owner terminal link.
    // The owner-only Cloudflare Access JWT must also be accepted by the Worker.
    setOperator(false);
    if (!signedIn) return;
    const controller = new AbortController();
    void fetch("/api/command/session", { cache: "no-store", signal: controller.signal })
      .then(async response => response.ok ? response.json() : null)
      .then((value: { command_admin?: boolean; owner_member_bound?: boolean; auth_source?: string } | null) => {
        if (!controller.signal.aborted) setOperator(value?.command_admin === true &&
          value?.owner_member_bound === true && value?.auth_source === "cloudflare_access");
      })
      .catch(() => { if (!controller.signal.aborted) setOperator(false); });
    return () => controller.abort();
  }, [signedIn, identity?.id]);

  const retry = async () => {
    const controller = scope.current;
    if (!controller || controller.signal.aborted || mutationInProgress.current || !signedIn) return;
    setData(null); setError("");
    try {
      await load(controller.signal);
    } catch {
      if (!controller.signal.aborted) {
        setData(null);
        setError("Could not verify your current Command account. Sign in again or retry.");
      }
    }
  };

  const toggle = async (kind: "saved-apps" | "follows", slug: string, selected: boolean) => {
    const controller = scope.current;
    const expectedMemberId = identity?.id;
    if (!signedIn || !data || !expectedMemberId || data.user.id !== expectedMemberId ||
        !controller || controller.signal.aborted || mutationInProgress.current) return;
    mutationInProgress.current = true;
    setUpdating(kind + slug); setError("");
    try {
      const response = await fetch("/api/member/" + kind + "/" + slug, {
        method: selected ? "DELETE" : "PUT", credentials: "same-origin",
        cache: "no-store", redirect: "manual", signal: controller.signal,
        headers: { "X-ANEVUM-EXPECTED-MEMBER-ID": expectedMemberId }
      });
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error("Member preference was not accepted.");
      const confirmation: unknown = await response.json();
      if (controller.signal.aborted) return;
      if (!verifiedPreferenceAcknowledgement(confirmation, slug, !selected))
        throw new Error("Member preference could not be verified.");
      await load(controller.signal);
      if (!controller.signal.aborted) setError("");
    } catch {
      if (!controller.signal.aborted) {
        setData(null);
        setError("Could not verify that preference for your current account. Reload Command.");
      }
    } finally {
      mutationInProgress.current = false;
      if (!controller.signal.aborted) setUpdating("");
    }
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
          <Link to="/command" aria-current="page" className="active">My programs</Link>
          {signedIn ? <a href="#command-following">Following</a> : <Link to="/feed">Updates</Link>}
          {signedIn && <Link to="/me/beta">Beta testing</Link>}
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
          <div><p className="workshop-kicker">Command</p><h1>{signedIn ? name : "Your programs, in one place."}</h1><p>Open a program, keep track of its progress, and manage your ANEVUM account.</p></div>
          {signedIn && <Link to="/me/settings">Edit profile</Link>}
        </header>
        {checking ? <p className="member-command-notice" role="status">Checking your account…</p> : !signedIn ? <div className="member-command-notice" role="status"><strong>{enabled ? "Sign in to make this your Command." : "Member accounts are not open yet."}</strong><p>{enabled ? "Your saved programs, follows, and profile belong to your account." : "You can explore the projects and their public records now. Saving programs and profile changes will open with registration."}</p>{enabled && <Link to="/sign-in">Continue with Google</Link>}</div> : null}
        {error && <div className="member-command-notice member-alert" role="alert"><p>{error}</p><button type="button" onClick={() => void retry()}>Retry</button></div>}
        {signedIn && <section className="member-command-notice" aria-labelledby="member-beta-entry">
          <strong id="member-beta-entry">Test ANEVUM</strong>
          <p>Verify your profile and saved projects, then explore independent RHEN workspace tools when available. Brokerage and public posting remain separate.</p>
          <Link to="/me/beta">Open member beta checklist →</Link>
        </section>}
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

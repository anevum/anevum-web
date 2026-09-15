import { useEffect, useState } from "react";
import { BookOpenText, CheckCircle2, CircleUserRound, Database, GitBranch, LockKeyhole, Orbit, RadioTower } from "lucide-react";
import { loadSession, syncCurrentUser, type MemberSession } from "./memberClient";
import { isWikiAdmin } from "./wikiClient";

function useCommandSession() {
  const [session, setSession] = useState<MemberSession | null>(() => loadSession());
  useEffect(() => {
    const sync = () => setSession(loadSession());
    window.addEventListener("anevum-member-session", sync);
    if (session) syncCurrentUser(session).then((next) => next && setSession(next)).catch(() => undefined);
    return () => window.removeEventListener("anevum-member-session", sync);
  }, [session?.user.id]);
  return session;
}

const modules = [
  { code: "WIKI", title: "Publication Control", detail: "Review contributor submissions and control what becomes public record.", href: "/wiki", icon: BookOpenText },
  { code: "LATTICE", title: "Relation Runtime", detail: "Inspect the public relational surface and its RHENLINK-aware state.", href: "https://anevum.com/lattice", icon: Orbit },
  { code: "RHENLINK", title: "Identity Layer", detail: "Resolve your own member identity and verify authenticated product behavior.", href: "https://anevum.com/rhenlink", icon: CircleUserRound },
  { code: "GITHUB", title: "Production Source", detail: "The current permanent implementation is built from the ANEVUM GitHub main branch.", href: "https://github.com/anevum/anevum-web", icon: GitBranch },
] as const;

export function CommandHome() {
  const session = useCommandSession();
  const admin = isWikiAdmin(session);

  if (!session) {
    return (
      <section className="command-gate">
        <LockKeyhole size={30} />
        <span>COMMAND / AUTHORIZATION REQUIRED</span>
        <h1>Private control plane.</h1>
        <p>COMMAND is part of the same ANEVUM interface, but operational controls only resolve after RHENLINK authentication.</p>
        <a href="https://anevum.com/rhenlink">RESOLVE RHENLINK →</a>
      </section>
    );
  }

  if (!admin) {
    return (
      <section className="command-gate">
        <RadioTower size={30} />
        <span>COMMAND / IDENTITY RESOLVED</span>
        <h1>Administrative claim required.</h1>
        <p>Your RHENLINK is active, but this account does not currently carry the protected administrator claim used by COMMAND.</p>
        <div className="command-gate-meta"><strong>{session.user.email}</strong><small>AUTHENTICATED / NOT AUTHORIZED</small></div>
      </section>
    );
  }

  return (
    <section className="command-home">
      <header className="command-home-header">
        <div><span>ANEVUM COMMAND</span><h1>Control plane.</h1><p>One authenticated operational surface for publication, identity, relation state and production infrastructure.</p></div>
        <div className="command-health"><i /><strong>ADMIN LINK RESOLVED</strong><small>{session.user.email}</small></div>
      </header>

      <div className="command-metrics">
        <div><Database size={16} /><span>MEMBER BACKEND</span><strong>CONNECTED</strong><small>Supabase / RHENLINK</small></div>
        <div><BookOpenText size={16} /><span>WIKI MODE</span><strong>MODERATED</strong><small>Admin publication gate</small></div>
        <div><Orbit size={16} /><span>LATTICE MODE</span><strong>RELATIONAL</strong><small>Public release state</small></div>
        <div><CheckCircle2 size={16} /><span>SOURCE</span><strong>GITHUB MAIN</strong><small>Cloudflare deployment pipeline</small></div>
      </div>

      <div className="command-module-grid">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <a key={module.code} href={module.href} className="command-module-card">
              <span className="command-module-code">{module.code}</span>
              <Icon size={22} strokeWidth={1.35} />
              <h2>{module.title}</h2>
              <p>{module.detail}</p>
              <b>OPEN MODULE ↗</b>
            </a>
          );
        })}
      </div>

      <div className="command-event-stream">
        <div className="command-event-head"><span>OPERATING MODEL</span><strong>ONE SYSTEM / STABLE ENTRY POINTS</strong></div>
        <div><time>01</time><span>anevum.com</span><p>Public root and story surface.</p></div>
        <div><time>02</time><span>wiki.anevum.com</span><p>Moderated public knowledge surface.</p></div>
        <div><time>03</time><span>anevum.com/lattice</span><p>Relational spatial surface.</p></div>
        <div><time>04</time><span>anevum.com/rhenlink</span><p>Persistent identity across the system.</p></div>
        <div><time>05</time><span>anevum.com/command</span><p>Private control and moderation surface.</p></div>
      </div>
    </section>
  );
}

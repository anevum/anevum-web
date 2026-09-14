import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, CircleUserRound, Grid3X3, LogIn, LogOut } from "lucide-react";
import { featuredPublicObjects } from "./publicObjects";
import { Button, VisualArt } from "./ui";
import {
  displayIdentity,
  loadSession,
  memberBackend,
  signIn,
  signOut,
  signUp,
  type MemberSession,
} from "./memberClient";

function useMemberSession() {
  const [session, setSession] = useState<MemberSession | null>(() => loadSession());
  useEffect(() => {
    const sync = () => setSession(loadSession());
    window.addEventListener("anevum-member-session", sync);
    return () => window.removeEventListener("anevum-member-session", sync);
  }, []);
  return [session, setSession] as const;
}

function RhenMark() {
  return (
    <svg className="rhen-mark" viewBox="0 0 96 96" aria-hidden="true">
      <path d="M20 16H49L64 31V65L49 80H20L35 65V31Z" fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
      <path d="M38 31H76L60 48L76 65H38" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="60" cy="48" r="5" fill="currentColor" />
    </svg>
  );
}

export function Lattice() {
  const nodes = featuredPublicObjects.slice(0, 9);
  const [selected, setSelected] = useState(nodes[0]);
  const [session] = useMemberSession();
  const identity = displayIdentity(session);

  return (
    <main className="lattice-page production-lattice">
      <section className="lattice-intro production-lattice-intro">
        <VisualArt visualKey="connected" />
        <div className="lattice-intro-grid" aria-hidden="true" />
        <div>
          <p className="eyebrow">LATTICE.ANEVUM</p>
          <h1>The universe as a place.</h1>
          <p>Move through the released universe relationally instead of reading it as a flat index. RHENLINK gives that movement a persistent identity.</p>
          <div className="actions">{session ? <Button href="/rhenlink">OPEN @{identity.handle || "RHENLINK"}</Button> : <Button href="/rhenlink">CLAIM YOUR RHENLINK</Button>}<Button href="/wiki" quiet>READ THE WIKI</Button></div>
        </div>
      </section>

      <section className="lattice-workspace production-lattice-workspace">
        <div className="graph-panel production-graph-panel">
          <div className="graph-orbit orbit-a" aria-hidden="true" /><div className="graph-orbit orbit-b" aria-hidden="true" />
          <div className="graph-lines" aria-hidden="true"><span /><span /><span /><span /><span /></div>
          {nodes.map((record, index) => (
            <button key={record.id} type="button" className={`graph-node node-${index} ${selected.id === record.id ? "selected" : ""}`} onClick={() => setSelected(record)}>
              <i /><strong>{record.title}</strong><small>{record.type}</small>
            </button>
          ))}
          <div className="graph-legend"><Grid3X3 size={15} /><span>PUBLIC RELATION SPACE / {nodes.length} VISIBLE NODES</span></div>
          <div className="graph-caption">RELATION IS THE NAVIGATION.</div>
        </div>
        <aside className="graph-inspector production-inspector">
          <VisualArt visualKey={selected.visualKey} />
          <span className="meta">FOCUS / {selected.type}</span>
          <h2>{selected.title}</h2>
          <p>{selected.summary}</p>
          <Button href={selected.route}>OPEN RECORD</Button>
          {!session ? (
            <div className="lattice-join">
              <span>MAKE THE CONNECTION YOURS</span>
              <p>Create a RHENLINK to establish a persistent member identity for LATTICE.</p>
              <Button href="/rhenlink">CREATE RHENLINK</Button>
            </div>
          ) : (
            <div className="lattice-join connected"><span>RHENLINK ACTIVE</span><strong>@{identity.handle || "member"}</strong><p>Your authenticated identity is active in this browser.</p></div>
          )}
        </aside>
      </section>
    </main>
  );
}

export function Rhenlink() {
  const [mode, setMode] = useState<"create" | "signin">("create");
  const [session, setSession] = useMemberSession();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const identity = displayIdentity(session);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const handle = String(form.get("handle") || "").trim().toLowerCase();
    const displayName = String(form.get("displayName") || "").trim();
    if (!/^[a-z0-9][a-z0-9_]{2,20}$/.test(handle)) {
      setStatus("RHENLINK handles use 3–21 lowercase letters, numbers, or underscores.");
      setBusy(false);
      return;
    }
    try {
      const result = await signUp({ email, password, handle, displayName });
      if (result.status === "signed-in") {
        setSession(result.session);
        setStatus("RHENLINK established. Your member session is active.");
      } else {
        setStatus("Account created. Confirm your email, then return here to sign in.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create RHENLINK.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const next = await signIn(String(form.get("email") || ""), String(form.get("password") || ""));
      setSession(next);
      setStatus("RHENLINK resolved. Session restored.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    setSession(null);
    setStatus("Signed out.");
    setBusy(false);
  }

  return (
    <main className="rhenlink-page production-rhenlink">
      <section className="rhenlink-hero production-rhenlink-hero">
        <VisualArt visualKey="connected" />
        <div className="rhenlink-network-texture" aria-hidden="true" />
        <div>
          <div className="rhen-brand-lockup"><RhenMark /><span><strong>RHENLINK</strong><small>YOUR PLACE IN THE NETWORK.</small></span></div>
          <h1>Your persistent identity.</h1>
          <p>One identity across ANEVUM. A handle can represent you publicly; the underlying account remains the stable member link for LATTICE and future member systems.</p>
        </div>
      </section>

      <section className="rhenlink-shell section production-rhenlink-shell">
        {session ? (
          <div className="identity-dashboard production-identity-dashboard">
            <div className="identity-badge"><RhenMark /><span>RHENLINK / RESOLVED</span></div>
            <h2>{identity.displayName || "Member"}</h2>
            <p className="handle">@{identity.handle || "member"}</p>
            <p className="identity-email">{session.user.email}</p>
            <div className="identity-modules">
              <div><span>SAVED</span><strong>—</strong><small>persistence activates after member schema verification</small></div>
              <div><span>COLLECTIONS</span><strong>—</strong><small>persistence activates after member schema verification</small></div>
              <div><span>ACHIEVEMENTS</span><strong>—</strong><small>persistence activates after member schema verification</small></div>
            </div>
            <div className="actions"><Button href="/lattice">ENTER LATTICE</Button><button type="button" className="button quiet native" onClick={handleSignOut} disabled={busy}><LogOut size={14} /> SIGN OUT</button></div>
          </div>
        ) : (
          <div className="auth-layout production-auth-layout">
            <div className="auth-intro">
              <span className="meta">ACCOUNT → RHENLINK → LATTICE</span>
              <h2>Claim your place in the network.</h2>
              <p>RHENLINK is the member identity layer of ANEVUM. The account system uses the existing ANEVUM member Supabase project; privileged credentials never belong in the browser.</p>
              <div className="rhen-flow"><span>01</span><strong>CREATE</strong><i /><span>02</span><strong>CONFIRM</strong><i /><span>03</span><strong>ENTER LATTICE</strong></div>
              <div className={`backend-state ${memberBackend.configured ? "ready" : "blocked"}`}><i />{memberBackend.configured ? "MEMBER AUTH READY" : "MEMBER AUTH CONNECTION REQUIRED"}</div>
            </div>
            <div className="auth-card production-auth-card">
              <div className="auth-tabs"><button type="button" className={mode === "create" ? "active" : ""} onClick={() => setMode("create")}>CREATE RHENLINK</button><button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>SIGN IN</button></div>
              {mode === "create" ? (
                <form onSubmit={handleCreate}>
                  <label>DISPLAY NAME<input name="displayName" required autoComplete="name" /></label>
                  <label>RHENLINK HANDLE<div className="handle-input"><span>@</span><input name="handle" required autoCapitalize="none" autoCorrect="off" placeholder="yourname" /></div></label>
                  <label>EMAIL<input name="email" type="email" required autoComplete="email" /></label>
                  <label>PASSWORD<input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
                  <button className="auth-submit" type="submit" disabled={busy || !memberBackend.configured}>{busy ? "CONNECTING..." : "CREATE RHENLINK"}<ArrowRight size={14} /></button>
                </form>
              ) : (
                <form onSubmit={handleSignIn}>
                  <label>EMAIL<input name="email" type="email" required autoComplete="email" /></label>
                  <label>PASSWORD<input name="password" type="password" required autoComplete="current-password" /></label>
                  <button className="auth-submit" type="submit" disabled={busy || !memberBackend.configured}>{busy ? "CONNECTING..." : "SIGN IN"}<LogIn size={14} /></button>
                </form>
              )}
              {status ? <p className="auth-status" role="status">{status}</p> : null}
              {!memberBackend.configured ? <p className="auth-config-note">The member interface is ready, but registration remains disabled until the existing Supabase project's public publishable key is restored to the production build.</p> : null}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

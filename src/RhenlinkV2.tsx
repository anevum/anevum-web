import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Bookmark, Layers3, LogIn, LogOut, Trophy } from "lucide-react";
import { BrandArt } from "./BrandArt";
import { Button } from "./ui";
import {
  displayIdentity,
  loadSession,
  memberBackend,
  signIn,
  signOut,
  signUp,
  type MemberSession,
} from "./memberClient";
import { ACHIEVEMENTS, loadMemberProgress, memberLevel, memberXP, onMemberProgressChange, type MemberProgress } from "./memberState";
import { ProfileProgressSummary } from "./MemberChrome";

function blankProgress(): MemberProgress {
  return { version: 1, savedRecordIds: [], visitedRoutes: [], achievements: [], updatedAt: new Date(0).toISOString() };
}

function useRhenlinkState() {
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
    const remove = onMemberProgressChange(setProgress);
    window.addEventListener("anevum-member-session", sync);
    return () => {
      remove();
      window.removeEventListener("anevum-member-session", sync);
    };
  }, []);

  return { session, setSession, progress };
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

export function Rhenlink() {
  const [mode, setMode] = useState<"create" | "signin">("create");
  const { session, setSession, progress } = useRhenlinkState();
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
    <main className="rhenlink-page production-rhenlink rhenlink-v2">
      <section className="rhenlink-hero production-rhenlink-hero">
        <BrandArt variant="identity" />
        <div>
          <div className="rhen-brand-lockup"><RhenMark /><span><strong>RHENLINK</strong><small>YOUR PERSISTENT IDENTITY</small></span></div>
          <h1>One identity.<br />Many worlds.</h1>
          <p>Keep your ANEVUM identity, progress, and achievements together as the universe expands.</p>
          <div className="actions"><Button href="/" quiet>RETURN TO REPLY</Button></div>
        </div>
      </section>

      <section className="rhenlink-shell section production-rhenlink-shell">
        {session ? (
          <div className="identity-dashboard production-identity-dashboard rhenlink-profile-card">
            <div className="rhenlink-profile-head">
              <div className="rhenlink-orb"><BrandArt variant="identity" /></div>
              <div className="rhenlink-profile-copy">
                <span className="meta">RHENLINK / RESOLVED</span>
                <h2>{identity.displayName || "Member"}</h2>
                <p className="handle">@{identity.handle || "member"}</p>
                <p className="identity-email">{session.user.email}</p>
              </div>
              <button type="button" className="button quiet native rhenlink-signout" onClick={handleSignOut} disabled={busy}><LogOut size={14} /> SIGN OUT</button>
            </div>

            <div className="identity-modules">
              <div><Bookmark size={16} /><span>SAVED</span><strong>{progress.savedRecordIds.length}</strong><small>items connected to your identity</small></div>
              <div><Layers3 size={16} /><span>LEVEL</span><strong>{String(memberLevel(progress)).padStart(2, "0")}</strong><small>{memberXP(progress)} accumulated XP</small></div>
              <div><Trophy size={16} /><span>ACHIEVEMENTS</span><strong>{progress.achievements.length}/{ACHIEVEMENTS.length}</strong><small>earned through exploration</small></div>
            </div>

            <div className="rhenlink-destination-grid">
              <Button href="/#top">RETURN TO REPLY</Button>
              <Button href="/#world" quiet>OPEN THE STORY</Button>
            </div>

            <ProfileProgressSummary progress={progress} />

            <div className="rhenlink-manifesto-card">
              <BrandArt variant="horizon" />
              <div><span>YOUR PLACE IN ANEVUM</span><h3>Your identity travels with you.</h3><p>RHENLINK is the first persistent layer of ANEVUM. Your profile and progress can grow without turning the book launch into a dashboard.</p><Button href="/" quiet>RETURN TO REPLY</Button></div>
            </div>
          </div>
        ) : (
          <div className="auth-layout production-auth-layout">
            <div className="auth-intro">
              <span className="meta">ACCOUNT → RHENLINK → ANEVUM</span>
              <h2>Claim your place in the network.</h2>
              <p>RHENLINK is ANEVUM’s persistent member identity. Create one profile for your progress and achievements as new parts of ANEVUM become available.</p>
              <div className="rhen-flow"><span>01</span><strong>CREATE</strong><i /><span>02</span><strong>CONFIRM</strong><i /><span>03</span><strong>EXPLORE</strong></div>
              <div className={`backend-state ${memberBackend.configured ? "ready" : "blocked"}`}><i />{memberBackend.configured ? "RHENLINK READY" : "RHENLINK TEMPORARILY UNAVAILABLE"}</div>
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
              {!memberBackend.configured ? <p className="auth-config-note">Account creation is temporarily unavailable. The rest of the REPLY launch site remains available.</p> : null}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

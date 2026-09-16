import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Award, Bookmark, Edit3, Layers3, LockKeyhole, LogIn, LogOut, Save, Trophy, X } from "lucide-react";
import { BrandArt } from "./BrandArt";
import { LaunchTerminal } from "./LaunchTerminal";
import { Button } from "./ui";
import {
  consumeAuthRedirect,
  displayIdentity,
  loadSession,
  memberBackend,
  signIn,
  signOut,
  signUp,
  updateMemberMetadata,
  type MemberSession,
} from "./memberClient";
import { CURRENT_ACHIEVEMENTS, loadMemberProgress, onMemberProgressChange, type MemberProgress } from "./memberState";
import { networkLevelDetails } from "./networkProgress";

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
    let cancelled = false;
    consumeAuthRedirect().then((result) => {
      if (cancelled || !result || result.status !== "signed-in") return;
      setSession(result.session);
      setProgress(loadMemberProgress(result.session));
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

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

function profileCopy(session: MemberSession | null) {
  const metadata = session?.user.user_metadata || {};
  return {
    title: String(metadata.rhenlink_title || ""),
    statusLine: String(metadata.rhenlink_status || ""),
    bio: String(metadata.rhenlink_bio || ""),
  };
}

export function Rhenlink() {
  const [mode, setMode] = useState<"create" | "signin">("create");
  const { session, setSession, progress } = useRhenlinkState();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const identity = displayIdentity(session);
  const profile = profileCopy(session);
  const level = networkLevelDetails(progress);
  const unlocked = useMemo(() => new Map(progress.achievements.map((achievement) => [achievement.id, achievement])), [progress.achievements]);
  const currentUnlockedCount = useMemo(() => CURRENT_ACHIEVEMENTS.filter((achievement) => unlocked.has(achievement.id)).length, [unlocked]);

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

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setBusy(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const handle = String(form.get("handle") || "").trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_]{2,20}$/.test(handle)) {
      setStatus("RHENLINK handles use 3–21 lowercase letters, numbers, or underscores.");
      setBusy(false);
      return;
    }
    try {
      const next = await updateMemberMetadata({
        rhenlink_handle: handle,
        display_name: String(form.get("displayName") || "").trim(),
        rhenlink_title: String(form.get("title") || "").trim().slice(0, 60),
        rhenlink_status: String(form.get("statusLine") || "").trim().slice(0, 100),
        rhenlink_bio: String(form.get("bio") || "").trim().slice(0, 320),
      });
      setSession(next);
      setEditing(false);
      setStatus("Profile updated across RHENLINK.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update RHENLINK profile.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    setSession(null);
    setEditing(false);
    setStatus("Signed out.");
    setBusy(false);
  }

  return (
    <main className="rhenlink-page production-rhenlink rhenlink-v2">
      <LaunchTerminal />
      <section className="rhenlink-hero production-rhenlink-hero">
        <BrandArt variant="identity" />
        <div>
          <div className="rhen-brand-lockup"><RhenMark /><span><strong>RHENLINK</strong><small>YOUR PERSISTENT IDENTITY</small></span></div>
          <h1>{session ? "Your place in ANEVUM." : "One identity.\nMany worlds."}</h1>
          <p>{session ? "Your profile, Network Level, XP, achievements, and saved progress travel together with your RHENLINK." : "Create one persistent ANEVUM identity for your progress and achievements as the universe expands."}</p>
          <div className="actions"><Button href="/" quiet>RETURN TO REPLY</Button></div>
        </div>
      </section>

      <section className="rhenlink-shell section production-rhenlink-shell">
        {session ? (
          <div className="identity-dashboard production-identity-dashboard rhenlink-profile-card">
            <div className="rhenlink-profile-head">
              <div className="rhenlink-level-artifact" aria-label={`Network Level ${level.level}, rank ${level.rankMark}`}>
                <BrandArt variant="identity" />
                <i className="artifact-ring ring-a" /><i className="artifact-ring ring-b" />
                <span className="artifact-rank">{level.rankMark}</span>
                <small>LEVEL {String(level.level).padStart(2, "0")}</small>
              </div>
              <div className="rhenlink-profile-copy">
                <span className="meta">RHENLINK / RESOLVED</span>
                <h2>{identity.displayName || "Member"}</h2>
                <p className="handle">@{identity.handle || "member"}</p>
                {profile.title ? <p className="rhenlink-title">{profile.title}</p> : null}
                {profile.statusLine ? <p className="rhenlink-status-line">“{profile.statusLine}”</p> : null}
                {profile.bio ? <p className="rhenlink-bio">{profile.bio}</p> : <p className="rhenlink-bio empty">Add a short profile note to make this identity yours.</p>}
                <p className="identity-email">{session.user.email}</p>
              </div>
              <div className="rhenlink-profile-actions">
                <button type="button" className="button quiet native" onClick={() => setEditing((value) => !value)}><Edit3 size={14} /> {editing ? "CLOSE" : "EDIT PROFILE"}</button>
                <button type="button" className="button quiet native" onClick={handleSignOut} disabled={busy}><LogOut size={14} /> SIGN OUT</button>
              </div>
            </div>

            {editing ? (
              <form className="rhenlink-profile-editor" onSubmit={handleProfileSave}>
                <header><div><span className="meta">IDENTITY PROFILE</span><h3>Edit RHENLINK</h3></div><button type="button" onClick={() => setEditing(false)} aria-label="Close profile editor"><X size={16} /></button></header>
                <div className="profile-editor-grid">
                  <label>DISPLAY NAME<input name="displayName" defaultValue={identity.displayName} maxLength={80} required /></label>
                  <label>HANDLE<div className="handle-input"><span>@</span><input name="handle" defaultValue={identity.handle} autoCapitalize="none" autoCorrect="off" required /></div></label>
                  <label>TITLE<input name="title" defaultValue={profile.title} maxLength={60} placeholder="Reader, founder, explorer…" /></label>
                  <label>STATUS LINE<input name="statusLine" defaultValue={profile.statusLine} maxLength={100} placeholder="A line that follows your identity." /></label>
                  <label className="editor-bio">BIO<textarea name="bio" defaultValue={profile.bio} maxLength={320} rows={4} placeholder="A short public-facing note about you." /></label>
                </div>
                <div className="profile-editor-actions"><button className="auth-submit" type="submit" disabled={busy}><Save size={14} /> {busy ? "SAVING..." : "SAVE PROFILE"}</button></div>
              </form>
            ) : null}

            <div className="identity-modules rhenlink-stat-grid">
              <div><Bookmark size={16} /><span>SAVED</span><strong>{progress.savedRecordIds.length}</strong><small>items connected to your identity</small></div>
              <div><Layers3 size={16} /><span>NETWORK LEVEL</span><strong>{String(level.level).padStart(2, "0")}</strong><small>{level.rankMark} · participation rank</small></div>
              <div><Trophy size={16} /><span>LAUNCH ARTIFACTS</span><strong>{currentUnlockedCount}/{CURRENT_ACHIEVEMENTS.length}</strong><small>earned through current release activity</small></div>
              <div><Award size={16} /><span>XP</span><strong>{level.xp}</strong><small>{level.remaining} XP to Level {Math.min(100, level.level + 1)}</small></div>
            </div>

            <section className="rhenlink-progression-showcase" aria-labelledby="network-level-title">
              <div className="network-level-copy">
                <span className="meta">NETWORK LEVEL / LONG-TERM PARTICIPATION</span>
                <h3 id="network-level-title">Level {String(level.level).padStart(2, "0")} <em>{level.rankMark}</em></h3>
                <p>Level reflects participation across ANEVUM. It does not represent authority, status, popularity, skill, or purchase value.</p>
                <div className="network-xp-line"><span>{level.xp} XP</span><span>{level.nextThreshold} XP / NEXT LEVEL</span></div>
                <div className="network-xp-track" role="progressbar" aria-label="XP progress to next level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level.percent)}><i style={{ width: `${level.percent}%` }} /></div>
                {level.nextArtifact ? <div className="network-next-artifact"><LockKeyhole size={14} /><span><small>NEXT ARTIFACT</small><strong>{level.nextArtifact.title}</strong><em>+{level.nextArtifact.xp} XP</em></span></div> : <div className="network-next-artifact"><Award size={14} /><span><small>BOOK ONE PATH</small><strong>ALL CURRENT ARTIFACTS ACQUIRED</strong><em>{currentUnlockedCount}/{CURRENT_ACHIEVEMENTS.length}</em></span></div>}
              </div>
              <div className="network-level-object" aria-hidden="true"><BrandArt variant="identity" /><i /><b>{level.rankMark}</b><small>{String(level.level).padStart(2, "0")}</small></div>
            </section>

            <section className="rhenlink-achievement-section" aria-labelledby="achievement-title">
              <header><div><span className="meta">BOOK ONE ARTIFACT RECORD</span><h3 id="achievement-title">Milestones with a memory.</h3></div><small>{currentUnlockedCount}/{CURRENT_ACHIEVEMENTS.length} EARNED</small></header>
              <div className="rhenlink-achievement-grid">
                {CURRENT_ACHIEVEMENTS.map((achievement) => {
                  const earned = unlocked.get(achievement.id);
                  return (
                    <article key={achievement.id} className={earned ? "earned" : "locked"}>
                      <div className="achievement-artifact-icon">{earned ? <Award size={20} /> : <LockKeyhole size={18} />}</div>
                      <span>{achievement.tier}</span>
                      <strong>{achievement.title}</strong>
                      <p>{achievement.description}</p>
                      <footer><b>+{achievement.xp} XP</b><small>{earned ? new Date(earned.unlockedAt).toLocaleDateString() : "LOCKED"}</small></footer>
                    </article>
                  );
                })}
              </div>
            </section>

            <div className="rhenlink-destination-grid">
              <Button href="/the-book">OPEN THE BOOK</Button>
              <Button href="/the-story" quiet>OPEN THE STORY</Button>
            </div>

            <div className="rhenlink-manifesto-card">
              <BrandArt variant="horizon" />
              <div><span>YOUR PLACE IN ANEVUM</span><h3>Your identity travels with you.</h3><p>RHENLINK keeps one member identity while the public universe grows around the books.</p></div>
            </div>
          </div>
        ) : (
          <div className="auth-layout production-auth-layout">
            <div className="auth-intro">
              <span className="meta">ACCOUNT → RHENLINK → ANEVUM</span>
              <h2>Claim your place in the network.</h2>
              <p>RHENLINK is ANEVUM’s persistent member identity. Create one profile for your progress and achievements as new parts of ANEVUM become available.</p>
              <div className="rhen-flow"><span>01</span><strong>CREATE</strong><i /><span>02</span><strong>CONFIRM</strong><i /><span>03</span><strong>RETURN</strong></div>
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

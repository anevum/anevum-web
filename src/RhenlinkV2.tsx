import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Award, Bell, Bookmark, CircleUserRound, Edit3, Layers3, LockKeyhole, LogIn, LogOut, Save, Trophy, X } from "lucide-react";
import { capture } from "./analytics";
import { BrandArt } from "./BrandArt";
import { LaunchTerminal } from "./LaunchTerminal";
import { Button } from "./ui";
import {
  consumeAuthRedirect,
  createRhenlinkHandoffUrl,
  displayIdentity,
  fetchPublicationClaims,
  loadSession,
  memberBackend,
  redeemPublicationCode,
  resolveRhenlinkReturnTarget,
  signIn,
  signOut,
  signUp,
  updateMemberMetadata,
  type MemberSession,
  type PublicationClaim,
} from "./memberClient";
import { CURRENT_ACHIEVEMENTS, loadMemberProgress, onMemberProgressChange, type MemberProgress } from "./memberState";
import { networkLevelDetails } from "./networkProgress";

const replyReleaseIntentKey = "anevum.reply.release-intent.v1";

function blankProgress(): MemberProgress {
  return { version: 1, savedRecordIds: [], visitedRoutes: [], achievements: [], updatedAt: new Date(0).toISOString() };
}

function releaseIntentRequested() {
  if (typeof window === "undefined") return false;
  const queryIntent = new URLSearchParams(window.location.search).get("intent") === "reply-release";
  if (queryIntent) {
    try { localStorage.setItem(replyReleaseIntentKey, "1"); } catch { /* local persistence is optional */ }
    return true;
  }
  try { return localStorage.getItem(replyReleaseIntentKey) === "1"; } catch { return false; }
}

function releaseIntentSource() {
  if (typeof window === "undefined") return "direct";
  const value = new URLSearchParams(window.location.search).get("source") || "direct";
  return /^[a-z0-9-]{1,48}$/i.test(value) ? value.toLowerCase() : "other";
}

function verifiedClaimXP(claims: PublicationClaim[]) {
  return claims.reduce((total, claim) => total + Math.max(0, Number(claim.xp_awarded) || 0), 0);
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

function profileCopy(session: MemberSession | null) {
  const metadata = session?.user.user_metadata || {};
  return {
    title: String(metadata.rhenlink_title || ""),
    statusLine: String(metadata.rhenlink_status || ""),
    bio: String(metadata.rhenlink_bio || ""),
  };
}

export function Rhenlink() {
  const returnTarget = useMemo(() => resolveRhenlinkReturnTarget(), []);
  const requestedMode = useMemo(() => new URLSearchParams(window.location.search).get("mode"), []);
  const [mode, setMode] = useState<"create" | "signin">(() => returnTarget || requestedMode === "signin" ? "signin" : "create");
  const { session, setSession, progress } = useRhenlinkState();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [releaseIntent, setReleaseIntent] = useState(() => releaseIntentRequested());
  const [releaseSource] = useState(() => releaseIntentSource());
  const [claims, setClaims] = useState<PublicationClaim[]>([]);
  const [ownershipBackendAvailable, setOwnershipBackendAvailable] = useState<boolean | null>(null);
  const identity = displayIdentity(session);
  const profile = profileCopy(session);
  const ownershipXP = verifiedClaimXP(claims);
  const level = networkLevelDetails(progress, ownershipXP);
  const replyClaim = claims.find((claim) => claim.publication_id === "reply-book-1") || null;
  const releaseUpdatesEnabled = session?.user.user_metadata?.reply_release_updates === true;
  const unlocked = useMemo(() => new Map(progress.achievements.map((achievement) => [achievement.id, achievement])), [progress.achievements]);
  const currentUnlockedCount = useMemo(() => CURRENT_ACHIEVEMENTS.filter((achievement) => unlocked.has(achievement.id)).length, [unlocked]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("intent") === "reply-release") {
      setReleaseIntent(true);
      capture("reply release interest opened", { source: releaseSource }, "rhenlink");
    }
  }, [releaseSource]);

  useEffect(() => {
    if (session || requestedMode !== "signin") return;

    // The RHENLINK page is lazy-loaded. Browser hash scrolling can fire before
    // this component mounts, leaving mobile users at the hero and making the
    // SIGN IN action appear to loop back to the same page. Scroll only after
    // the auth section has actually been committed to the DOM.
    const frame = window.requestAnimationFrame(() => {
      const auth = document.getElementById("rhenlink-auth");
      if (!auth) return;
      auth.scrollIntoView({ block: "start", behavior: "auto" });
      const email = auth.querySelector<HTMLInputElement>('input[name="email"]');
      window.setTimeout(() => email?.focus({ preventScroll: true }), 80);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [requestedMode, session]);

  useEffect(() => {
    if (!session || !returnTarget) return;
    const targetUrl = createRhenlinkHandoffUrl(returnTarget, session);
    if (!targetUrl) return;
    setStatus("RHENLINK resolved. Returning to COMMAND.");
    const timer = window.setTimeout(() => window.location.replace(targetUrl), 80);
    return () => window.clearTimeout(timer);
  }, [returnTarget, session?.access_token]);

  useEffect(() => {
    let cancelled = false;
    if (!session) {
      setClaims([]);
      setOwnershipBackendAvailable(null);
      return;
    }
    fetchPublicationClaims(session)
      .then((next) => {
        if (cancelled) return;
        setClaims(next);
        setOwnershipBackendAvailable(true);
      })
      .catch(() => {
        if (cancelled) return;
        setClaims([]);
        setOwnershipBackendAvailable(false);
      });
    return () => { cancelled = true; };
  }, [session?.user.id]);

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
        setStatus(releaseIntent ? "RHENLINK established. Choose below whether to attach REPLY release updates." : "RHENLINK established. Your member session is active.");
      } else {
        setStatus(releaseIntent ? "Account created. Confirm your email, return to RHENLINK, then choose whether to attach REPLY release updates." : "Account created. Confirm your email, then return here to sign in.");
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
      setStatus(releaseIntent ? "RHENLINK resolved. Choose below whether to attach REPLY release updates." : "RHENLINK resolved. Session restored.");
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

  async function toggleReplyReleaseUpdates() {
    if (!session) return;
    setBusy(true);
    setStatus("");
    const enable = !releaseUpdatesEnabled;
    try {
      const next = await updateMemberMetadata({
        reply_release_updates: enable,
        reply_release_updates_at: enable ? new Date().toISOString() : null,
        reply_release_updates_source: enable ? releaseSource : null,
      });
      setSession(next);
      capture(enable ? "reply release updates enabled" : "reply release updates disabled", { source: releaseSource }, "rhenlink");
      if (enable) {
        try { localStorage.removeItem(replyReleaseIntentKey); } catch { /* local persistence is optional */ }
        setReleaseIntent(false);
        setStatus("REPLY release-update preference saved to RHENLINK.");
      } else {
        setStatus("REPLY release-update preference removed from RHENLINK.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update REPLY release preference.");
    } finally {
      setBusy(false);
    }
  }

  async function handleOwnershipClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || replyClaim) return;
    setBusy(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    try {
      const claim = await redeemPublicationCode(String(form.get("ownershipCode") || ""), session);
      setClaims((current) => [claim, ...current.filter((item) => item.publication_id !== claim.publication_id)]);
      setOwnershipBackendAvailable(true);
      window.dispatchEvent(new Event("anevum-publication-claim"));
      capture("reply ownership verified", { edition: claim.edition, xp: claim.xp_awarded }, "rhenlink");
      setStatus(`REPLY ownership verified. +${claim.xp_awarded} XP added to this RHENLINK.`);
      event.currentTarget.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not verify this REPLY ownership code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    setSession(null);
    setClaims([]);
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
          <div className="rhen-brand-lockup"><CircleUserRound size={42} strokeWidth={1.1} aria-hidden="true" /><span><strong>RHENLINK</strong><small>YOUR PERSISTENT IDENTITY</small></span></div>
          <h1>{session ? "Your place in ANEVUM." : releaseIntent ? "Keep REPLY connected." : "One identity.\nMany worlds."}</h1>
          <p>{session ? "Your profile, Network Level, XP, achievements, verified publications, and saved progress travel together with your RHENLINK." : releaseIntent ? "Create or resolve your RHENLINK, then explicitly choose whether you want REPLY release updates attached to this identity." : "Create one persistent ANEVUM identity for your progress and achievements as the universe expands."}</p>
          <div className="actions"><Button href="/" quiet>RETURN TO REPLY</Button></div>
        </div>
      </section>

      <section id="rhenlink-auth" className="rhenlink-shell section production-rhenlink-shell">
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

            {releaseIntent || releaseUpdatesEnabled ? (
              <section className={`rhenlink-release-interest ${releaseUpdatesEnabled ? "enabled" : "pending"}`} aria-labelledby="reply-release-interest-title">
                <Bell size={22} strokeWidth={1.25} aria-hidden="true" />
                <div>
                  <span className="meta">REPLY / RELEASE UPDATES</span>
                  <h3 id="reply-release-interest-title">{releaseUpdatesEnabled ? "Release updates are attached to this RHENLINK." : "Keep REPLY attached to this RHENLINK."}</h3>
                  <p>{releaseUpdatesEnabled ? "Your preference is saved on this identity. Release notices can use the email attached to your RHENLINK when notification delivery is active." : "This does not happen automatically. Choose below if you want your RHENLINK marked for REPLY release notices."}</p>
                </div>
                <button type="button" className="button native" onClick={toggleReplyReleaseUpdates} disabled={busy}>{releaseUpdatesEnabled ? "REMOVE RELEASE UPDATES" : "ADD RELEASE UPDATES"}</button>
              </section>
            ) : null}

            <section className={`rhenlink-ownership-verification ${replyClaim ? "verified" : ownershipBackendAvailable ? "ready" : "staged"}`} aria-labelledby="reply-ownership-title">
              <div className="rhenlink-ownership-mark"><Award size={23} strokeWidth={1.25} aria-hidden="true" /></div>
              <div className="rhenlink-ownership-copy">
                <span className="meta">REPLY / VERIFIED OWNERSHIP</span>
                <h3 id="reply-ownership-title">{replyClaim ? "This RHENLINK holds a verified copy of REPLY." : "Attach verified REPLY ownership to this identity."}</h3>
                {replyClaim ? (
                  <p>{replyClaim.edition} · verified {new Date(replyClaim.claimed_at).toLocaleDateString()} · +{replyClaim.xp_awarded} XP. This record is server-verified and cannot be created by self-claiming ownership.</p>
                ) : ownershipBackendAvailable ? (
                  <p>Enter the ownership code supplied through an approved REPLY purchase or edition flow. A valid code can be redeemed once and binds the verified publication record to this RHENLINK.</p>
                ) : (
                  <p>The ownership verifier is staged but not active on the current backend yet. No ownership XP is awarded until the server verification service is live.</p>
                )}
              </div>
              {!replyClaim && ownershipBackendAvailable ? (
                <form className="rhenlink-ownership-form" onSubmit={handleOwnershipClaim}>
                  <label htmlFor="reply-ownership-code">VERIFICATION CODE</label>
                  <div><input id="reply-ownership-code" name="ownershipCode" minLength={8} maxLength={80} autoCapitalize="characters" autoCorrect="off" spellCheck={false} required placeholder="REPLY-XXXX-XXXX" /><button type="submit" disabled={busy}>{busy ? "VERIFYING..." : "VERIFY COPY"}</button></div>
                </form>
              ) : null}
            </section>

            {status ? <p className="rhenlink-inline-status" role="status">{status}</p> : null}

            <div className="identity-modules rhenlink-stat-grid">
              <div><Bookmark size={16} /><span>SAVED</span><strong>{progress.savedRecordIds.length}</strong><small>items connected to your identity</small></div>
              <div><Layers3 size={16} /><span>NETWORK LEVEL</span><strong>{String(level.level).padStart(2, "0")}</strong><small>{level.rankMark} · participation rank</small></div>
              <div><Trophy size={16} /><span>LAUNCH ARTIFACTS</span><strong>{currentUnlockedCount}/{CURRENT_ACHIEVEMENTS.length}</strong><small>earned through current release activity</small></div>
              <div><Award size={16} /><span>XP</span><strong>{level.xp}</strong><small>{ownershipXP ? `${ownershipXP} verified-publication XP · ` : ""}{level.remaining} XP to Level {Math.min(100, level.level + 1)}</small></div>
            </div>

            <section className="rhenlink-progression-showcase" aria-labelledby="network-level-title">
              <div className="network-level-copy">
                <span className="meta">NETWORK LEVEL / LONG-TERM PARTICIPATION</span>
                <h3 id="network-level-title">Level {String(level.level).padStart(2, "0")} <em>{level.rankMark}</em></h3>
                <p>Level reflects participation across ANEVUM. Verified publication XP is added only after server-side ownership verification. Network Level does not represent authority, status, popularity, skill, or purchase value.</p>
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
              <Button href="/store" quiet>OPEN THE STORE</Button>
            </div>

            <div className="rhenlink-manifesto-card">
              <BrandArt variant="horizon" />
              <div><span>YOUR PLACE IN ANEVUM</span><h3>Your identity travels with you.</h3><p>RHENLINK keeps one member identity while the public universe grows around the books.</p></div>
            </div>
          </div>
        ) : (
          <div className="auth-layout production-auth-layout">
            <div className="auth-intro">
              <span className="meta">{releaseIntent ? "REPLY → RHENLINK → RELEASE UPDATES" : "ACCOUNT → RHENLINK → ANEVUM"}</span>
              <h2>{releaseIntent ? "Keep REPLY connected to your identity." : "Claim your place in the network."}</h2>
              <p>{releaseIntent ? "Create or sign in to RHENLINK first. Release updates are opt-in: once your identity is resolved, you can explicitly add or remove the REPLY release preference." : "RHENLINK is ANEVUM’s persistent member identity. Create one profile for your progress and achievements as new parts of ANEVUM become available."}</p>
              <div className="rhen-flow"><span>01</span><strong>{releaseIntent ? "RESOLVE" : "CREATE"}</strong><i /><span>02</span><strong>{releaseIntent ? "CHOOSE" : "CONFIRM"}</strong><i /><span>03</span><strong>{releaseIntent ? "CONNECT" : "RETURN"}</strong></div>
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

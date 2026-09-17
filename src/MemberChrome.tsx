import { useEffect, useMemo, useRef, useState } from "react";
import { Award, Bookmark, ChevronRight, CircleUserRound, Sparkles, X } from "lucide-react";
import { Link } from "./ui";
import { displayIdentity, fetchPublicationClaims, loadSession, loadSharedIdentity, type MemberSession, type PublicationClaim, type SharedIdentity } from "./memberClient";
import {
  CURRENT_ACHIEVEMENTS,
  hydrateMemberProgress,
  loadMemberProgress,
  onAchievementUnlocked,
  onMemberProgressChange,
  type AchievementDefinition,
  type MemberProgress,
} from "./memberState";
import { networkLevelDetails } from "./networkProgress";

function emptyProgress(): MemberProgress {
  return { version: 1, savedRecordIds: [], visitedRoutes: [], achievements: [], updatedAt: new Date(0).toISOString() };
}

function verifiedClaimXP(claims: PublicationClaim[]) {
  return claims.reduce((total, claim) => total + Math.max(0, Number(claim.xp_awarded) || 0), 0);
}

function useMemberChromeState() {
  const [session, setSession] = useState<MemberSession | null>(() => loadSession());
  const [sharedIdentity, setSharedIdentity] = useState<SharedIdentity | null>(() => loadSharedIdentity());
  const [progress, setProgress] = useState<MemberProgress>(() => loadMemberProgress(loadSession()));
  const [claims, setClaims] = useState<PublicationClaim[]>([]);

  useEffect(() => {
    const syncSession = () => {
      const next = loadSession();
      setSession(next);
      setSharedIdentity(loadSharedIdentity());
      setProgress(next ? loadMemberProgress(next) : emptyProgress());
      if (!next) setClaims([]);
    };
    const removeProgress = onMemberProgressChange(setProgress);
    window.addEventListener("anevum-member-session", syncSession);
    return () => {
      removeProgress();
      window.removeEventListener("anevum-member-session", syncSession);
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    hydrateMemberProgress(session).then(setProgress).catch(() => undefined);
  }, [session?.user.id]);

  useEffect(() => {
    let cancelled = false;
    const refreshClaims = () => {
      const active = loadSession();
      if (!active) {
        if (!cancelled) setClaims([]);
        return;
      }
      fetchPublicationClaims(active)
        .then((next) => { if (!cancelled) setClaims(next); })
        .catch(() => { if (!cancelled) setClaims([]); });
    };
    refreshClaims();
    window.addEventListener("anevum-publication-claim", refreshClaims);
    return () => {
      cancelled = true;
      window.removeEventListener("anevum-publication-claim", refreshClaims);
    };
  }, [session?.user.id]);

  return { session, sharedIdentity, progress, claims };
}

function identityLabel(session: MemberSession | null, sharedIdentity: SharedIdentity | null) {
  if (session) return displayIdentity(session);
  return {
    handle: sharedIdentity?.handle || "",
    displayName: sharedIdentity?.displayName || "",
  };
}

function currentUnlockedCount(progress: MemberProgress) {
  const currentIds = new Set(CURRENT_ACHIEVEMENTS.map((achievement) => achievement.id));
  return progress.achievements.filter((achievement) => currentIds.has(achievement.id)).length;
}

export function RhenlinkIdentityCard() {
  const { session, sharedIdentity, progress, claims } = useMemberChromeState();
  const identity = identityLabel(session, sharedIdentity);
  const authenticated = Boolean(session);
  const ownershipXP = verifiedClaimXP(claims);
  const level = networkLevelDetails(progress, ownershipXP);
  const currentUnlocked = currentUnlockedCount(progress);
  const replyVerified = claims.some((claim) => claim.publication_id === "reply-book-1");

  if (!session && !sharedIdentity) {
    return (
      <Link href="/rhenlink" className="rhenlink-follower rhenlink-follower-offline" ariaLabel="Create a RHENLINK">
        <span className="rhenlink-follower-mark"><CircleUserRound size={19} /></span>
        <span className="rhenlink-follower-copy"><small>RHENLINK</small><strong>CLAIM YOUR ID</strong></span>
        <ChevronRight size={15} />
      </Link>
    );
  }

  return (
    <Link href="/rhenlink" className={`rhenlink-follower ${authenticated ? "online" : "linked"}`} ariaLabel="Open your RHENLINK profile">
      <span className="rhenlink-follower-mark"><CircleUserRound size={19} /></span>
      <span className="rhenlink-follower-copy">
        <small>{authenticated ? `RHENLINK / ${level.rankMark}` : "RHENLINK / LINKED"}</small>
        <strong>@{identity.handle || "member"}</strong>
        <em>{authenticated ? `${level.xp} XP · ${Math.round(level.percent)}% TO LEVEL ${Math.min(100, level.level + 1)} · ${currentUnlocked}/${CURRENT_ACHIEVEMENTS.length} LAUNCH ARTIFACTS${replyVerified ? " · REPLY VERIFIED" : ""}` : identity.displayName}</em>
      </span>
      <span className="rhenlink-follower-pulse" aria-hidden="true" />
      <ChevronRight size={15} />
    </Link>
  );
}

export function AchievementLayer() {
  const [queue, setQueue] = useState<AchievementDefinition[]>([]);
  const [active, setActive] = useState<AchievementDefinition | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => onAchievementUnlocked((achievement) => {
    if (achievement.availableNow === false) return;
    setQueue((current) => current.some((item) => item.id === achievement.id) || active?.id === achievement.id ? current : [...current, achievement]);
  }), [active?.id]);

  useEffect(() => {
    if (active || queue.length === 0) return;
    const [next, ...rest] = queue;
    setActive(next);
    setQueue(rest);
  }, [active, queue]);

  useEffect(() => {
    if (!active) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setActive(null), 4600);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="achievement-layer" role="status" aria-live="polite">
      <div className="achievement-burst" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <div className="achievement-panel">
        <button type="button" onClick={() => setActive(null)} aria-label="Dismiss achievement"><X size={15} /></button>
        <div className="achievement-emblem"><Sparkles size={22} /><Award size={35} /></div>
        <span className="achievement-kicker">RHENLINK ARTIFACT ACQUIRED / {active.tier}</span>
        <strong>{active.title}</strong>
        <p>{active.description}</p>
        <div className="achievement-xp"><span>NETWORK PROGRESS RECORDED</span><b>+{active.xp} XP</b></div>
      </div>
    </div>
  );
}

export function ProfileProgressSummary({ progress, verifiedBonusXP = 0 }: { progress: MemberProgress; verifiedBonusXP?: number }) {
  const level = networkLevelDetails(progress, verifiedBonusXP);
  const unlocked = useMemo(() => new Set(progress.achievements.map((item) => item.id)), [progress.achievements]);

  return (
    <div className="profile-progress-summary">
      <div className="profile-level-row"><span>NETWORK LEVEL</span><strong>{String(level.level).padStart(2, "0")}</strong><small>{level.rankMark} · {level.xp} XP</small></div>
      <div className="profile-xp-track"><i style={{ width: `${level.percent}%` }} /></div>
      <div className="profile-achievement-grid">
        {CURRENT_ACHIEVEMENTS.map((achievement) => (
          <div key={achievement.id} className={unlocked.has(achievement.id) ? "unlocked" : "locked"} title={achievement.description}>
            <Award size={15} />
            <span>{achievement.title}</span>
            <small>{unlocked.has(achievement.id) ? `+${achievement.xp} XP` : "LOCKED"}</small>
          </div>
        ))}
      </div>
      <div className="profile-saved-line"><Bookmark size={14} /><span>{progress.savedRecordIds.length} saved canon {progress.savedRecordIds.length === 1 ? "record" : "records"}</span></div>
    </div>
  );
}

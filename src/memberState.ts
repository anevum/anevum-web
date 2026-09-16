import { loadSession, syncCurrentUser, updateMemberMetadata, type MemberSession } from "./memberClient";

export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  xp: number;
  tier: "SIGNAL" | "PATH" | "DISCOVERY" | "CONSTELLATION";
  availableNow?: boolean;
};

export type UnlockedAchievement = {
  id: string;
  unlockedAt: string;
};

export type MemberProgress = {
  version: 1;
  savedRecordIds: string[];
  visitedRoutes: string[];
  achievements: UnlockedAchievement[];
  updatedAt: string;
};

const metadataKey = "anevum_member_v1";
const localPrefix = "anevum.rhenlink.member-state.v1";
const changeEvent = "anevum-member-progress";
const achievementEvent = "anevum-achievement-unlocked";
const xpPerLevel = 150;
const rankRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"] as const;

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: "signal-acquired", title: "SIGNAL ACQUIRED", description: "Establish a RHENLINK identity inside ANEVUM.", xp: 50, tier: "SIGNAL", availableNow: true },
  { id: "first-reply", title: "FIRST REPLY", description: "Enter REPLY through the public ANEVUM launch.", xp: 30, tier: "PATH", availableNow: true },
  { id: "open-the-book", title: "OPEN THE BOOK", description: "Open the publication page for REPLY.", xp: 35, tier: "DISCOVERY", availableNow: true },
  { id: "enter-the-story", title: "ENTER THE STORY", description: "Open the spoiler-light story doorway for REPLY.", xp: 40, tier: "PATH", availableNow: true },
  { id: "publication-001", title: "PUBLICATION 001", description: "Enter the ANEVUM Store and inspect the first publication surface.", xp: 30, tier: "DISCOVERY", availableNow: true },
  { id: "launch-path", title: "COMPLETE THE SIGNAL", description: "Move through REPLY, the book, the story, and your RHENLINK identity.", xp: 95, tier: "CONSTELLATION", availableNow: true },
  { id: "open-the-record", title: "OPEN THE RECORD", description: "Enter a released WIKI record.", xp: 35, tier: "DISCOVERY", availableNow: true },
  { id: "enter-the-lattice", title: "ENTER THE LATTICE", description: "Enter the relational universe for the first time.", xp: 50, tier: "PATH", availableNow: true },
  { id: "hold-the-thread", title: "HOLD THE THREAD", description: "Save your first released canon record.", xp: 40, tier: "DISCOVERY", availableNow: true },
  { id: "constellation", title: "CONSTELLATION", description: "Build a personal constellation of five saved records.", xp: 100, tier: "CONSTELLATION", availableNow: true },
  { id: "transcosmic-path", title: "TRANSCOSMIC PATH", description: "Move through story, knowledge and place with one RHENLINK.", xp: 120, tier: "CONSTELLATION", availableNow: true },
  { id: "wayfinder", title: "WAYFINDER", description: "Visit ten distinct ANEVUM routes.", xp: 100, tier: "CONSTELLATION", availableNow: true },
];

export const CURRENT_ACHIEVEMENTS = ACHIEVEMENTS.filter((achievement) => achievement.availableNow !== false);

function defaultProgress(): MemberProgress {
  return {
    version: 1,
    savedRecordIds: [],
    visitedRoutes: [],
    achievements: [],
    updatedAt: new Date().toISOString(),
  };
}

function uniqueStrings(value: unknown): string[] {
  return Array.isArray(value) ? Array.from(new Set(value.filter((item): item is string => typeof item === "string"))) : [];
}

function normalizeProgress(value: unknown): MemberProgress {
  if (!value || typeof value !== "object") return defaultProgress();
  const input = value as Partial<MemberProgress>;
  const achievements = Array.isArray(input.achievements)
    ? input.achievements.filter((item): item is UnlockedAchievement => Boolean(item && typeof item.id === "string" && typeof item.unlockedAt === "string"))
    : [];
  return {
    version: 1,
    savedRecordIds: uniqueStrings(input.savedRecordIds),
    visitedRoutes: uniqueStrings(input.visitedRoutes),
    achievements: Array.from(new Map(achievements.map((item) => [item.id, item])).values()),
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : new Date().toISOString(),
  };
}

function localKey(session: MemberSession) {
  return `${localPrefix}:${session.user.id}`;
}

function cloudProgress(session: MemberSession): MemberProgress {
  return normalizeProgress(session.user.user_metadata?.[metadataKey]);
}

function localProgress(session: MemberSession): MemberProgress {
  try {
    const value = localStorage.getItem(localKey(session));
    return value ? normalizeProgress(JSON.parse(value)) : defaultProgress();
  } catch {
    return defaultProgress();
  }
}

function mergedProgress(session: MemberSession): MemberProgress {
  const local = localProgress(session);
  const cloud = cloudProgress(session);
  const achievementMap = new Map<string, UnlockedAchievement>();
  [...cloud.achievements, ...local.achievements].forEach((item) => {
    const current = achievementMap.get(item.id);
    if (!current || item.unlockedAt < current.unlockedAt) achievementMap.set(item.id, item);
  });
  return {
    version: 1,
    savedRecordIds: Array.from(new Set([...cloud.savedRecordIds, ...local.savedRecordIds])),
    visitedRoutes: Array.from(new Set([...cloud.visitedRoutes, ...local.visitedRoutes])),
    achievements: Array.from(achievementMap.values()),
    updatedAt: cloud.updatedAt > local.updatedAt ? cloud.updatedAt : local.updatedAt,
  };
}

function qualifies(definition: AchievementDefinition, progress: MemberProgress) {
  const routes = progress.visitedRoutes;
  switch (definition.id) {
    case "signal-acquired": return true;
    case "first-reply": return routes.includes("/") || routes.includes("/stories/reply");
    case "open-the-book": return routes.includes("/the-book");
    case "enter-the-story": return routes.includes("/the-story");
    case "publication-001": return routes.includes("/store");
    case "launch-path": return routes.includes("/") && routes.includes("/the-book") && routes.includes("/the-story") && routes.includes("/rhenlink");
    case "open-the-record": return routes.some((route) => route.startsWith("/wiki/") && route.length > 6);
    case "enter-the-lattice": return routes.includes("/lattice");
    case "hold-the-thread": return progress.savedRecordIds.length >= 1;
    case "constellation": return progress.savedRecordIds.length >= 5;
    case "transcosmic-path": return (routes.includes("/") || routes.includes("/stories/reply")) && routes.some((route) => route === "/wiki" || route.startsWith("/wiki/")) && routes.includes("/lattice");
    case "wayfinder": return routes.length >= 10;
    default: return false;
  }
}

function evaluateAchievements(progress: MemberProgress) {
  const unlocked = new Set(progress.achievements.map((item) => item.id));
  const newlyUnlocked: AchievementDefinition[] = [];
  for (const definition of ACHIEVEMENTS) {
    if (!unlocked.has(definition.id) && qualifies(definition, progress)) {
      progress.achievements.push({ id: definition.id, unlockedAt: new Date().toISOString() });
      unlocked.add(definition.id);
      newlyUnlocked.push(definition);
    }
  }
  return newlyUnlocked;
}

function emitProgress(progress: MemberProgress) {
  window.dispatchEvent(new CustomEvent<MemberProgress>(changeEvent, { detail: progress }));
}

function emitAchievements(definitions: AchievementDefinition[]) {
  definitions.forEach((definition, index) => {
    window.setTimeout(() => window.dispatchEvent(new CustomEvent<AchievementDefinition>(achievementEvent, { detail: definition })), index * 650);
  });
}

function storeLocal(session: MemberSession, progress: MemberProgress) {
  localStorage.setItem(localKey(session), JSON.stringify(progress));
  emitProgress(progress);
}

function persistCloud(progress: MemberProgress) {
  updateMemberMetadata({ [metadataKey]: progress }).catch(() => undefined);
}

export function loadMemberProgress(session = loadSession()): MemberProgress {
  return session ? mergedProgress(session) : defaultProgress();
}

export function updateMemberProgress(session: MemberSession, mutate: (draft: MemberProgress) => void, sync = true) {
  const progress = mergedProgress(session);
  const before = JSON.stringify(progress);
  mutate(progress);
  progress.savedRecordIds = Array.from(new Set(progress.savedRecordIds));
  progress.visitedRoutes = Array.from(new Set(progress.visitedRoutes));
  const unlocked = evaluateAchievements(progress);
  progress.updatedAt = new Date().toISOString();
  const after = JSON.stringify(progress);
  if (before !== after || unlocked.length) {
    storeLocal(session, progress);
    if (sync) persistCloud(progress);
    if (unlocked.length) emitAchievements(unlocked);
  }
  return progress;
}

export async function hydrateMemberProgress(session = loadSession()) {
  if (!session) return defaultProgress();
  let current = session;
  try {
    current = (await syncCurrentUser(session)) || session;
  } catch {
    // The local member state stays usable if a refresh request is temporarily unavailable.
  }
  const progress = mergedProgress(current);
  const unlocked = evaluateAchievements(progress);
  progress.updatedAt = new Date().toISOString();
  storeLocal(current, progress);
  persistCloud(progress);
  if (unlocked.length) emitAchievements(unlocked);
  return progress;
}

export function trackMemberRoute(pathname: string) {
  const session = loadSession();
  if (!session) return null;
  const normalized = pathname || "/";
  const existing = mergedProgress(session);
  if (existing.visitedRoutes.includes(normalized)) {
    const unlocked = evaluateAchievements(existing);
    if (!unlocked.length) return existing;
  }
  return updateMemberProgress(session, (draft) => {
    if (!draft.visitedRoutes.includes(normalized)) draft.visitedRoutes.push(normalized);
  });
}

export function toggleMemberSave(session: MemberSession, recordId: string) {
  const progress = updateMemberProgress(session, (draft) => {
    if (draft.savedRecordIds.includes(recordId)) draft.savedRecordIds = draft.savedRecordIds.filter((id) => id !== recordId);
    else draft.savedRecordIds.push(recordId);
  });
  return progress.savedRecordIds;
}

export function memberXP(progress: MemberProgress) {
  const unlocked = new Set(progress.achievements.map((item) => item.id));
  return ACHIEVEMENTS.reduce((total, item) => total + (unlocked.has(item.id) ? item.xp : 0), 0);
}

function rankMarkForLevel(level: number) {
  if (level <= 0) return "Ø";
  const clamped = Math.max(1, Math.min(100, level));
  const tier = rankRoman[Math.ceil(clamped / 10) - 1] || "X";
  const index = ((clamped - 1) % 10) + 1;
  return `${tier}·${String(index).padStart(2, "0")}`;
}

export function memberLevel(progress: MemberProgress) {
  return Math.min(100, Math.floor(memberXP(progress) / xpPerLevel));
}

export function memberLevelDetails(progress: MemberProgress) {
  const xp = memberXP(progress);
  const level = Math.min(100, Math.floor(xp / xpPerLevel));
  const levelBase = level * xpPerLevel;
  const percent = level >= 100 ? 100 : Math.min(100, Math.max(0, ((xp - levelBase) / xpPerLevel) * 100));
  return {
    level,
    xp,
    percent,
    rankMark: rankMarkForLevel(level),
  };
}

export function getAchievement(id: string) {
  return ACHIEVEMENTS.find((item) => item.id === id);
}

export function onMemberProgressChange(listener: (progress: MemberProgress) => void) {
  const handler = (event: Event) => listener((event as CustomEvent<MemberProgress>).detail);
  window.addEventListener(changeEvent, handler);
  return () => window.removeEventListener(changeEvent, handler);
}

export function onAchievementUnlocked(listener: (achievement: AchievementDefinition) => void) {
  const handler = (event: Event) => listener((event as CustomEvent<AchievementDefinition>).detail);
  window.addEventListener(achievementEvent, handler);
  return () => window.removeEventListener(achievementEvent, handler);
}

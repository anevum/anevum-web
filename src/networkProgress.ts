import { CURRENT_ACHIEVEMENTS, memberXP, type AchievementDefinition, type MemberProgress } from "./memberState";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"] as const;
const XP_PER_LEVEL = 150;

export type NetworkLevelDetails = {
  level: number;
  xp: number;
  rankMark: string;
  currentFloor: number;
  nextThreshold: number;
  intoLevel: number;
  neededForLevel: number;
  remaining: number;
  percent: number;
  nextArtifact: AchievementDefinition | null;
};

export function rankMarkForLevel(level: number) {
  if (level <= 0) return "Ø";
  const clamped = Math.max(1, Math.min(100, level));
  const tier = ROMAN[Math.ceil(clamped / 10) - 1] || "X";
  const index = ((clamped - 1) % 10) + 1;
  return `${tier}·${String(index).padStart(2, "0")}`;
}

export function networkLevelDetails(progress: MemberProgress, verifiedBonusXP = 0): NetworkLevelDetails {
  const bonusXP = Number.isFinite(verifiedBonusXP) ? Math.max(0, Math.floor(verifiedBonusXP)) : 0;
  const xp = memberXP(progress) + bonusXP;
  const level = Math.min(100, Math.floor(xp / XP_PER_LEVEL));
  const currentFloor = level * XP_PER_LEVEL;
  const nextThreshold = level >= 100 ? currentFloor : (level + 1) * XP_PER_LEVEL;
  const intoLevel = level >= 100 ? XP_PER_LEVEL : Math.max(0, xp - currentFloor);
  const neededForLevel = XP_PER_LEVEL;
  const remaining = level >= 100 ? 0 : Math.max(0, nextThreshold - xp);
  const unlocked = new Set(progress.achievements.map((achievement) => achievement.id));
  const nextArtifact = CURRENT_ACHIEVEMENTS.find((achievement) => !unlocked.has(achievement.id)) || null;

  return {
    level,
    xp,
    rankMark: rankMarkForLevel(level),
    currentFloor,
    nextThreshold,
    intoLevel,
    neededForLevel,
    remaining,
    percent: level >= 100 ? 100 : Math.min(100, Math.max(0, (intoLevel / neededForLevel) * 100)),
    nextArtifact,
  };
}

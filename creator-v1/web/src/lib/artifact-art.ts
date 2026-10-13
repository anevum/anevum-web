/**
 * Pure, presentation-only mapping for the verified six achievement keys and
 * four illustrated milestone references from Series One. No client-side awards.
 */
export const achievementArt = [
  { key: "first-signal", name: "FIRST SIGNAL", description: "Rate a published project for the first time.", art: "beacon" },
  { key: "keen-eye", name: "KEEN EYE", description: "Rate five published projects.", art: "lens" },
  { key: "portal-guide", name: "PORTAL GUIDE", description: "Rate twenty-five published projects.", art: "compass" },
  { key: "first-launch", name: "FIRST LAUNCH", description: "Publish your first staff-approved project.", art: "launch" },
  { key: "three-builds", name: "THREE BUILDS", description: "Publish three approved projects.", art: "trinity" },
  { key: "release-steward", name: "RELEASE STEWARD", description: "Ship a versioned update to published work.", art: "chronometer" }
] as const;

export type AchievementArtKey = (typeof achievementArt)[number]["key"];
export type EmblemMotif =
  | "beacon" | "lens" | "compass" | "launch" | "trinity" | "chronometer"
  | "spark" | "key" | "atlas" | "light" | "orbital";

export const seriesOneStudies: readonly {level:number;name:string;motif:EmblemMotif;finish:string}[] = [
  { level: 1, name: "Foundry Spark", motif: "spark", finish: "copper / first light" },
  { level: 2, name: "Copper Key", motif: "key", finish: "etched copper / sapphire" },
  { level: 30, name: "Midnight Atlas", motif: "atlas", finish: "astral blue / platinum" },
  { level: 60, name: "The First Light", motif: "light", finish: "stellar gold / aurora glass" }
];

const validKeys = new Map<string, EmblemMotif>(achievementArt.map(item => [item.key, item.art]));

export function achievementMotif(key:string):EmblemMotif|null {
  return validKeys.get(key) || null;
}

export function seriesOneMotif(level:number, artifact:string|null):EmblemMotif {
  if(!Number.isSafeInteger(level) || level < 1 || !artifact || level > 60) return "orbital";
  return seriesOneStudies.find(item => item.level === level && item.name === artifact)?.motif || "orbital";
}

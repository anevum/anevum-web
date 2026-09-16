import { publicObjects, type PublicObject } from "./publicObjects";

export type CanonLifecycleState =
  | "Source-Locked"
  | "Locked"
  | "Canonical"
  | "Working"
  | "Unresolved"
  | "Exploratory"
  | "Superseded"
  | "Archived";

export type FreezeState = "Ready" | "Intentional Open" | "Blocking" | "Superseded";

export type CanonProjectionRecord = PublicObject & {
  canonState: CanonLifecycleState;
  freezeState: FreezeState;
};

export type CanonProjectionRelation = {
  id: string;
  fromSlug: string;
  toSlug: string;
  relation: "located-in" | "member-of" | "connected-to" | "contains" | "operates-through";
};

export const CANON_PROJECTION_SYNC = {
  source: "Live Notion Transcosmic Canon Wiki + Website Publishing Queue",
  syncedAt: "2026-09-16",
  queueCount: 22,
  policy: "Public=true + Window=Now + Full/Curated/Teaser + Safe/Light",
} as const;

// Counts are a control-plane snapshot of EXPLORE — Canon Encyclopedia at the
// projection sync above. They are intentionally separate from the 22 public
// records so COMMAND can distinguish canon lifecycle from website release state.
export const CANON_LIFECYCLE_COUNTS: Record<CanonLifecycleState, number> = {
  "Source-Locked": 140,
  Locked: 0,
  Canonical: 98,
  Working: 135,
  Unresolved: 1,
  Exploratory: 0,
  Superseded: 34,
  Archived: 0,
};

const stateBySlug: Record<string, CanonLifecycleState> = {
  "merva": "Source-Locked",
  "nali-solan": "Source-Locked",
  "neral": "Source-Locked",
  "ovara": "Source-Locked",
  "rena-sol": "Source-Locked",
  "connected-worlds": "Canonical",
  "grainit": "Canonical",
  "iren": "Canonical",
  "lio-sol": "Source-Locked",
  "serein-skygate": "Canonical",
  "talin-vel": "Source-Locked",
  "continuance-institute": "Canonical",
  "open-road": "Canonical",
  "skygate-megastructure": "Canonical",
  "d3-17": "Canonical",
  "neral-skygate": "Canonical",
  "deep-three": "Source-Locked",
  "ione": "Source-Locked",
  "cape-serein": "Source-Locked",
  "greater-serein": "Source-Locked",
  "veyra": "Source-Locked",
  "elias-venn": "Source-Locked",
};

const freezeBySlug: Record<string, FreezeState> = {
  "merva": "Ready",
  "nali-solan": "Ready",
  "neral": "Ready",
  "ovara": "Ready",
  "rena-sol": "Ready",
  "connected-worlds": "Ready",
  "grainit": "Ready",
  "iren": "Intentional Open",
  "lio-sol": "Ready",
  "serein-skygate": "Ready",
  "talin-vel": "Ready",
  "continuance-institute": "Ready",
  "open-road": "Intentional Open",
  "skygate-megastructure": "Ready",
  "d3-17": "Ready",
  "neral-skygate": "Intentional Open",
  "deep-three": "Ready",
  "ione": "Ready",
  "cape-serein": "Ready",
  "greater-serein": "Intentional Open",
  "veyra": "Ready",
  "elias-venn": "Ready",
};

export const canonProjectionRecords: CanonProjectionRecord[] = publicObjects.map((record) => ({
  ...record,
  canonState: stateBySlug[record.slug] || "Unresolved",
  freezeState: freezeBySlug[record.slug] || "Blocking",
}));

// These edges are intentionally publication-safe. They use relationships that
// are already explicit in the released record summaries/metadata. Classified or
// spoiler-gated relationships are not inferred merely because the private Wiki
// contains them.
export const canonProjectionRelations: CanonProjectionRelation[] = [
  { id: "merva-ovara", fromSlug: "merva", toSlug: "ovara", relation: "located-in" },
  { id: "nali-merva", fromSlug: "nali-solan", toSlug: "merva", relation: "located-in" },
  { id: "nali-ovara", fromSlug: "nali-solan", toSlug: "ovara", relation: "located-in" },
  { id: "rena-serein", fromSlug: "rena-sol", toSlug: "greater-serein", relation: "located-in" },
  { id: "lio-serein", fromSlug: "lio-sol", toSlug: "greater-serein", relation: "located-in" },
  { id: "cape-serein-region", fromSlug: "cape-serein", toSlug: "greater-serein", relation: "located-in" },
  { id: "cape-continuance", fromSlug: "continuance-institute", toSlug: "cape-serein", relation: "located-in" },
  { id: "serein-gate-veyra", fromSlug: "serein-skygate", toSlug: "veyra", relation: "located-in" },
  { id: "serein-gate-region", fromSlug: "serein-skygate", toSlug: "greater-serein", relation: "connected-to" },
  { id: "neral-gate-world", fromSlug: "neral-skygate", toSlug: "neral", relation: "located-in" },
  { id: "open-road-serein", fromSlug: "open-road", toSlug: "serein-skygate", relation: "operates-through" },
  { id: "open-road-neral", fromSlug: "open-road", toSlug: "neral-skygate", relation: "operates-through" },
  { id: "connected-road", fromSlug: "connected-worlds", toSlug: "open-road", relation: "connected-to" },
  { id: "connected-veyra", fromSlug: "connected-worlds", toSlug: "veyra", relation: "connected-to" },
  { id: "connected-neral", fromSlug: "connected-worlds", toSlug: "neral", relation: "connected-to" },
  { id: "skygate-serein", fromSlug: "skygate-megastructure", toSlug: "serein-skygate", relation: "contains" },
  { id: "skygate-neral", fromSlug: "skygate-megastructure", toSlug: "neral-skygate", relation: "contains" },
  { id: "ione-veyra", fromSlug: "ione", toSlug: "veyra", relation: "located-in" },
  { id: "deep-three-ione", fromSlug: "deep-three", toSlug: "ione", relation: "located-in" },
  { id: "greater-serein-veyra", fromSlug: "greater-serein", toSlug: "veyra", relation: "located-in" },
];

export function getCanonProjectionRecord(slug: string) {
  return canonProjectionRecords.find((record) => record.slug === slug) || null;
}

import releaseRegistry from "./releases.json";

export type ReleaseStatus = "current" | "archived";

export type RhenRelease = {
  slug: string;
  version: string;
  codename: string;
  lifecycle: string;
  releaseClass: string;
  date: string;
  status: ReleaseStatus;
  headline: string;
  abstract: string;
  thesis: string;
  sourceCommit: string;
  productionDeployment?: string;
  shadowDeployment?: string;
  preopenDeployment?: string;
  activeStrategy: string;
  pdfPath: string;
  badges: string[];
  capabilities: { label: string; title: string; body: string }[];
  architecture: { label: string; title: string; body: string }[];
  verification: { label: string; value: string; body: string }[];
  limitations: { title: string; body: string }[];
  changelog: { pr: number; title: string }[];
  next: string;
};

type RhenReleaseRegistry = {
  schemaVersion: number;
  currentSlug: string;
  releases: RhenRelease[];
};

export const rhenReleaseRegistry = releaseRegistry as RhenReleaseRegistry;
export const rhenReleases = rhenReleaseRegistry.releases;

export function currentRhenRelease() {
  const release = rhenReleases.find((item) => item.slug === rhenReleaseRegistry.currentSlug);
  if (!release) throw new Error("RHEN current release pointer is invalid.");
  return release;
}

export const latestRhenRelease = currentRhenRelease;

export function archivedRhenReleases() {
  const current = currentRhenRelease();
  return rhenReleases.filter((release) => release.slug !== current.slug);
}

export function rhenReleaseBySlug(slug?: string) {
  return rhenReleases.find((release) => release.slug === slug);
}

export function nextPatchVersion(version: string) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) return version + " + patch";
  return [match[1], match[2], String(Number(match[3]) + 1)].join(".");
}

export function nextMinorVersion(version: string) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) return "next minor";
  return [match[1], String(Number(match[2]) + 1), "0"].join(".");
}

export function nextMajorVersion(version: string) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) return "next major";
  return [String(Number(match[1]) + 1), "0", "0"].join(".");
}

import releaseRegistry from "./releases.json";

export type RhenRelease = {
  slug: string;
  version: string;
  codename: string;
  lifecycle: string;
  releaseClass: string;
  date: string;
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
  schemaVersion: 2;
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

function semverParts(version: string) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

export function nextPatchVersion(version: string) {
  const parts = semverParts(version);
  return parts ? [parts[0], parts[1], parts[2] + 1].join(".") : version + " + patch";
}

export function nextMinorVersion(version: string) {
  const parts = semverParts(version);
  return parts ? [parts[0], parts[1] + 1, 0].join(".") : "next minor";
}

export function nextMajorVersion(version: string) {
  const parts = semverParts(version);
  return parts ? [parts[0] + 1, 0, 0].join(".") : "next major";
}

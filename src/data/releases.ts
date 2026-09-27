import releaseData from "./releases.json";

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

export const rhenReleases = releaseData as RhenRelease[];

export function latestRhenRelease() {
  return rhenReleases[0];
}

export function rhenReleaseBySlug(slug?: string) {
  return rhenReleases.find((release) => release.slug === slug);
}

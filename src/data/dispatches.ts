import raw from "./dispatches.json";

export type DispatchKind = "PROGRESS REPORT" | "RESEARCH NOTE" | "SYSTEM UPDATE" | "FIELD NOTE";

export type DispatchEntry = {
  slug: string;
  publishedAt: string;
  kind: DispatchKind;
  system: string;
  status: string;
  title: string;
  dek: string;
  body: string[];
  tags: string[];
  links: string[];
};

export const dispatches = raw.entries as DispatchEntry[];

export function dispatchBySlug(slug?: string) {
  return dispatches.find((entry) => entry.slug === slug);
}

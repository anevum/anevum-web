import readerPreview from "./transcosmic-reader-preview.json";

/**
 * This typed surface contains only explicitly curated, review-only reader data.
 * The JSON is validated by scripts/verify-transcosmic-reader-preview.mjs
 * before any preview build. No private Notion canon or publication queue is
 * fetched at runtime. A successful build is NOT publication permission.
 */
export type ReaderCategory = "World" | "Person" | "Place" | "Infrastructure";
export interface ReaderEntry {
  id: string;
  slug: string;
  title: string;
  category: ReaderCategory;
  subtitle: string;
  summary: string;
  detail: string;
  keywords: string;
}
export interface ReaderRelationship {
  slug: string;
  label: string;
  relation: string;
}
export const entries: ReadonlyArray<ReaderEntry> = readerPreview.entries as ReaderEntry[];
export const relationships: Readonly<Record<string, ReadonlyArray<ReaderRelationship>>> =
  readerPreview.relationships as Record<string, ReaderRelationship[]>;

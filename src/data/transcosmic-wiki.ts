/**
 * Transcosmic reader encyclopedia projection, not the private Canon Wiki.
 *
 * The original eight curated REPLY-opening articles and their original
 * relationship allowlist remain untouched and separately validated.
 * Fourteen additional Now-window subjects are held in review-only data files.
 * All importable data is checked before bundling, and this entire module is
 * excluded from the default production build.
 */
import { entries as originalEntries, relationships as originalRelations, type ReaderEntry, type ReaderCategory } from "./transcosmic-reader-preview";
import expansionA from "./transcosmic-wiki-expansion-a.json";
import expansionB from "./transcosmic-wiki-expansion-b.json";
import additionalLinks from "./transcosmic-wiki-relations.json";

export const wikiCategories = ["World", "Person", "Place", "Infrastructure", "Institution", "Science", "History"] as const;
export type WikiCategory = ReaderCategory | "Institution" | "Science" | "History";
export type WikiEntry = Omit<ReaderEntry, "category"> & {category:WikiCategory};
export type WikiRelation = {slug:string;relation:string};
export type WikiArticle = WikiEntry & {
  href: string;
  related: ReadonlyArray<{slug:string; label:string; relation:string; href:string}>;
  backlinks: ReadonlyArray<{slug:string; title:string; href:string; context:string}>;
};

const BASE = "/design/original-works/wiki";
const pathFor = (slug:string) => BASE + "/" + slug;
const entries: ReadonlyArray<WikiEntry> = [
  ...originalEntries, ...expansionA.entries, ...expansionB.entries
].map(entry => ({...entry,category:entry.category as WikiCategory}));
const entriesBySlug = new Map<string,WikiEntry>(entries.map(entry => [entry.slug,entry]));

// All relationships are explicit and editorially reviewed. A path through
// Veyra and Neral never implies that Ovara is connected to their Road.
const relationMap = new Map<string,ReadonlyArray<WikiRelation>>(entries.map(entry => {
  const base = originalRelations[entry.slug] || [];
  const expansion = (additionalLinks.relationships as Record<string,WikiRelation[]>)[entry.slug] || [];
  const bridges = (additionalLinks.bridges as Record<string,WikiRelation[]>)[entry.slug] || [];
  return [entry.slug,[...base.map(link => ({slug:link.slug,relation:link.relation})),...expansion,...bridges]];
}));

export function getWikiArticle(slug:string): WikiArticle | undefined {
  const record=entriesBySlug.get(slug);
  if(!record) return undefined;
  const related=(relationMap.get(slug)||[])
    .filter(edge=>entriesBySlug.has(edge.slug))
    .map(edge=>({...edge,label:entriesBySlug.get(edge.slug)!.title,href:pathFor(edge.slug)}));
  const backlinks=entries.flatMap(entry=>
    (relationMap.get(entry.slug)||[]).filter(edge=>edge.slug===slug)
      .map(edge=>({slug:entry.slug,title:entry.title,href:pathFor(entry.slug),context:edge.relation}))
  );
  return {...record,href:pathFor(slug),related,backlinks};
}

export function wikiAllPages(): WikiArticle[] {
  return entries.map(entry=>getWikiArticle(entry.slug)!)
    .sort((a,b)=>a.title.localeCompare(b.title,"en"));
}

export function wikiCategoryPages(category:string): WikiArticle[] {
  if(!wikiCategories.some(allowed=>allowed===category)) return [];
  return wikiAllPages().filter(entry=>entry.category===category);
}

export function wikiSearch(query:string,category:WikiCategory|"All"="All"): WikiArticle[] {
  const normalized=query.trim().slice(0,80).toLocaleLowerCase("en");
  const pages=wikiAllPages();
  if(!normalized) return pages.filter(article=>category==="All"||article.category===category);
  // Search title first; cross-references should not bury the canonical entry.
  const titleMatches=pages.filter(article=>article.title.toLocaleLowerCase("en").includes(normalized));
  const matching=titleMatches.length?titleMatches:pages.filter(article=>[
    article.subtitle,article.summary,article.detail,
    article.keywords,article.category,...article.related.map(link=>link.label)
  ].join(" ").toLocaleLowerCase("en").includes(normalized));
  return matching.filter(article=>category==="All"||article.category===category);
}

export const wikiHome = BASE;
export const wikiCategoryPath=(category:string)=>BASE+"/category/"+category.toLowerCase();
export const wikiSpecialPath=(page:"all-pages"|"about")=>BASE+"/special/"+page;

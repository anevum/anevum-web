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

/**
 * Search only the curated, client-bundled reader edition.
 *
 * An exact title match comes first, but it never suppresses relevant results
 * from summaries, curated context or explicit public-queue relationships.
 * Search terms can be entered in any order; no private canon source is queried.
 */
export function wikiSearch(query:string,category:WikiCategory|"All"="All"): WikiArticle[] {
  const normalized=query.trim().slice(0,80).toLocaleLowerCase("en");
  const terms=normalized.split(/\s+/).filter(Boolean);
  const pages=wikiAllPages().filter(article=>category==="All"||article.category===category);
  if(!terms.length) return pages;

  const ranked=pages.map(article=>{
    const title=article.title.toLocaleLowerCase("en");
    const fields=[
      title,article.subtitle,article.summary,article.detail,article.keywords,article.category,
      ...article.related.map(link=>link.label)
    ].map(value=>String(value).toLocaleLowerCase("en"));
    if(!terms.every(term=>fields.some(field=>field.includes(term)))) return null;

    const allTitleTerms=terms.every(term=>title.includes(term));
    const rank=title===normalized?0:
      title.startsWith(normalized)?1:
      title.includes(normalized)?2:
      allTitleTerms?3:4;
    return {article,rank};
  }).filter((entry):entry is {article:WikiArticle;rank:number}=>entry!==null);
  ranked.sort((a,b)=>a.rank-b.rank||a.article.title.localeCompare(b.article.title,"en"));
  return ranked.map(entry=>entry.article);
}

export const wikiHome = BASE;
export const wikiCategoryPath=(category:string)=>BASE+"/category/"+category.toLowerCase();
export const wikiSpecialPath=(page:"all-pages"|"about")=>BASE+"/special/"+page;

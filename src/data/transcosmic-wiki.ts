/**
 * Transcosmic Reader Wiki model.
 *
 * Versioned in Git, editorially curated, and strictly projected from the
 * existing eight-item opening-state manifest. This is a wiki foundation, not
 * a mirror of the private Canon Wiki or a publication approval.
 *
 * No runtime fetch(), untrusted HTML, or internal Notion source identifiers.
 * A future editor must pass the existing release/audit validator before a
 * new reader article or changed relationship can enter this projection.
 */
import { entries, relationships, type ReaderEntry, type ReaderCategory } from "./transcosmic-reader-preview";

export const wikiCategories = ["World", "Person", "Place", "Infrastructure"] as const;
export type WikiCategory = ReaderCategory;

export type WikiArticle = ReaderEntry & {
  href: string;
  related: ReadonlyArray<{slug:string; label:string; relation:string; href:string}>;
  backlinks: ReadonlyArray<{slug:string; title:string; href:string; context:string}>;
};

const BASE = "/design/original-works/wiki";
const pathFor = (slug:string) => BASE + "/" + slug;
const entriesBySlug = new Map<string,ReaderEntry>(entries.map(entry => [entry.slug,entry]));

export function getWikiArticle(slug:string): WikiArticle | undefined {
  const record=entriesBySlug.get(slug);
  if(!record) return undefined;
  const related=(relationships[slug]||[])
    .filter(edge=>entriesBySlug.has(edge.slug))
    .map(edge=>({...edge,href:pathFor(edge.slug)}));
  const backlinks=entries.flatMap(entry=>
    (relationships[entry.slug]||[]).filter(edge=>edge.slug===slug)
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
  return wikiAllPages().filter(article=>
    (category==="All"||article.category===category)&&
    (!normalized||[
      article.title,article.subtitle,article.summary,article.detail,
      article.keywords,article.category,
      ...article.related.map(link=>link.label)
    ].join(" ").toLocaleLowerCase("en").includes(normalized))
  );
}

export const wikiHome = BASE;
export const wikiCategoryPath=(category:string)=>BASE+"/category/"+category.toLowerCase();
export const wikiSpecialPath=(page:"all-pages"|"about")=>BASE+"/special/"+page;

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");
const manifest=JSON.parse(read("src/data/transcosmic-reader-preview.json"));
const expansionA=JSON.parse(read("src/data/transcosmic-wiki-expansion-a.json"));
const expansionB=JSON.parse(read("src/data/transcosmic-wiki-expansion-b.json"));
const additions=JSON.parse(read("src/data/transcosmic-wiki-relations.json"));
const wiki=read("src/pages/TranscosmicWiki.tsx");
const model=read("src/data/transcosmic-wiki.ts");
const styles=read("src/styles/transcosmic-wiki.css");
const studio=read("src/pages/OriginalWorksStudio.tsx");
const app=read("src/App.tsx");

test("wiki is a navigable encyclopedia, not an index pretending to be a wiki",()=>{
  for(const part of [
    "WikiIndex","WikiArticlePage","WikiCategoryPage","WikiAllPages",
    "WikiAbout","WikiMissing","WikiContents","WikiSidebar",
    "WikiBreadcrumb","WikiArticlePage slug={route}"
  ])assert.ok(wiki.includes(part),"missing wiki experience "+part);
  assert.match(wiki,/function WikiArticlePage/);
  assert.match(wiki,/article\.related\.map/);
  assert.match(wiki,/article\.backlinks\.map/);
  assert.match(wiki,/id="wiki-overview"/);
  assert.match(wiki,/id="wiki-context"/);
  assert.match(wiki,/id="wiki-connections"/);
  assert.match(wiki,/id="wiki-linked"/);
  assert.match(wiki,/href=\{"#"\+section\.id\}/);
  assert.match(wiki,/aria-label="Article contents"/);
  assert.match(wiki,/aria-label="Wiki categories"/);
  assert.match(wiki,/aria-label=\{"Facts about "\+article\.title\}/);
  assert.match(wiki,/aria-current=\{active===category\?"page":undefined\}/);
  assert.match(wiki,/useSearchParams\(\)/);
  assert.match(wiki,/role="status" aria-live="polite"/);
});

test("wiki routes are reachable ONLY from the explicit gated studio review",()=>{
  assert.match(studio,/wiki: ROOT \+ "\/wiki"/);
  assert.match(studio,/import TranscosmicWiki from "\.\/TranscosmicWiki"/);
  assert.match(studio,/page === "wiki" && <TranscosmicWiki \/>/);
  assert.match(studio,/page === "wiki-detail" && <TranscosmicWiki path=/);
  assert.match(studio,/if \(pathname\.startsWith\(PATH\.wiki \+ "\/"\)\) return "wiki-detail"/);
  assert.match(app,/const OriginalWorksStudio = originalWorksPreviewEnabled\s*\? lazy\(\(\) => import\("\.\/pages\/OriginalWorksStudio"\)\)\s*: null/);
  assert.match(app,/<Route path="\/wiki" element=\{<Navigate to="\/products\/rhen" replace \/>/);
  assert.doesNotMatch(app,/path="\/wiki\/\*"/);
});

test("twenty-two reader pages and backlinks derive from the frozen eight-entry core and curated expansions",()=>{
  assert.match(model,/from "\.\/transcosmic-reader-preview"/);
  assert.match(model,/new Map<string,WikiEntry>\(entries\.map/);
  assert.match(model,/const backlinks=entries\.flatMap/);
  assert.match(model,/relationMap\.get\(entry\.slug\)/);
  assert.match(model,/if\(!record\) return undefined/);
  assert.match(model,/wikiCategories = \["World", "Person", "Place", "Infrastructure", "Institution", "Science", "History"\]/);
  assert.match(model,/normalized=query\.trim\(\)\.slice\(0,80\)/);
  const ids=new Set(manifest.entries.map(article=>article.slug));
  assert.equal(ids.size,8);
  const added=[...expansionA.entries,...expansionB.entries];
  const allIds=new Set([...ids,...added.map(x=>x.slug)]);
  assert.equal(added.length,14);
  assert.equal(allIds.size,22);
  assert.equal(Object.keys(additions.relationships).length,14);
  assert.equal(Object.keys(additions.bridges).length,5);
  for(const edges of Object.values({...additions.relationships,...additions.bridges}))
    for(const edge of edges)assert.ok(allIds.has(edge.slug),"unresolved wiki link "+edge.slug);
  for(const [source,related] of Object.entries(manifest.relationships)){
    assert.ok(ids.has(source),"unknown source "+source);
    for(const link of related)assert.ok(ids.has(link.slug),"unknown related article "+link.slug);
  }
  assert.ok(!manifest.relationships.ovara.some(x=>["open-road","neral","veyra"].includes(x.slug)));
});

test("wiki search ranks every matching public article, with exact and prefix titles first",()=>{
  assert.match(model,/const terms=normalized\.split\(\/\\s\+\/\)\.filter\(Boolean\)/);
  assert.match(model,/terms\.every\(term=>fields\.some\(field=>field\.includes\(term\)\)\)/);
  assert.match(model,/title===normalized\?0:/);
  assert.match(model,/title\.startsWith\(normalized\)\?1:/);
  assert.match(model,/allTitleTerms\?3:4/);
  assert.match(model,/ranked\.sort\(\(a,b\)=>a\.rank-b\.rank/);
  assert.match(model,/return ranked\.map\(entry=>entry\.article\)/);
  assert.doesNotMatch(model,/titleMatches\.length\?titleMatches:/);
  assert.doesNotMatch(model,/fetch\(|notion\.so|app\.notion\.com/);
});

test("wiki remains fail-closed and contains no private canon, editing or external source calls",()=>{
  assert.match(wiki,/route\.startsWith\("category\/"\)/);
  assert.match(wiki,/<WikiMissing\/>/);
  assert.match(wiki,/Guessing a URL never reveals private or unpublished canon/);
  assert.match(wiki,/There is not yet a public editing form/);
  assert.match(wiki,/does not establish book availability/);
  assert.match(wiki,/Public-source cleared/);
  assert.match(wiki,/Source: Now \/ Public queue/);
  for(const s of [wiki,model]) {
    assert.doesNotMatch(s,/dangerouslySetInnerHTML|fetch\(|XMLHttpRequest|axios|eval\(|window\.localStorage|api\/command|api\/member|notion\.so|app\.notion\.com/);
    assert.doesNotMatch(s,/Ovaran Contact Forum|first physical visitor|Chapter 43|Part IV|REPLY \+90/);
  }
});

test("wiki uses Wikipedia-like information hierarchy and seven consistent category accents",()=>{
  assert.match(wiki,/className="ow-wiki-layout ow-wiki-article"/);
  assert.match(wiki,/<WikiContents\/>/);
  assert.match(wiki,/data-wiki-category=\{article\.category\}/);
  assert.match(wiki,/data-wiki-category=\{option\}/);
  assert.match(wiki,/className="ow-wiki-mobile-contents"/);
  assert.match(styles,/grid-template-columns:clamp\(160px,12\.5vw,195px\) minmax\(0,1fr\) clamp\(205px,17vw,270px\)/);
  assert.match(styles,/font-size:14px/);
  assert.match(styles,/font-size:14\.5px/);
  assert.match(styles,/\.ow-wiki-article h1/);
  assert.match(styles,/\.ow-wiki-contents/);
  assert.match(styles,/\.ow-wiki-infobox/);
  assert.match(styles,/@media\(max-width:740px\)/);
  assert.match(styles,/@media\(forced-colors:active\)/);
  assert.match(styles,/@media\(prefers-reduced-motion:reduce\)/);
  const expectedColor={World:"#87bfff",Person:"#e7b777",Place:"#80d6c4",Infrastructure:"#c3adf9",Institution:"#f0a5b1",Science:"#88d9ed",History:"#d5c69c"};
  for(const [category,color] of Object.entries(expectedColor)) {
    assert.ok(styles.includes('[data-wiki-category="'+category+'"]'),"missing semantic color "+category);
    assert.ok(styles.includes("--wk-accent:"+color),"incorrect accent "+category);
  }
  assert.match(styles,/\.ow-wiki \.ow-wiki-filter-row button\[aria-pressed=true\]/);
  assert.match(styles,/\.ow-wiki \.ow-wiki-result/);
  assert.doesNotMatch(styles,/(?:^|\n)\s*(?:html|body|:root)\s*\{/m);
});

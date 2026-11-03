import test from "node:test";
import assert from "node:assert/strict";
import { WIKI_DIRECTORY_ALPHABET, wikiInitial, wikiDirectoryGroups, wikiDirectoryAnchor } from "../src/data/wiki-directory.ts";

test("alphabet remains complete and navigation IDs are distinct", () => {
  assert.equal(WIKI_DIRECTORY_ALPHABET.join(""), "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  assert.equal(new Set([...WIKI_DIRECTORY_ALPHABET, "#"].map(wikiDirectoryAnchor)).size, 27);
  assert.equal(wikiDirectoryAnchor("A"), "ow-wiki-letter-a");
  assert.equal(wikiDirectoryAnchor("#"), "ow-wiki-letter-other");
});

test("reader directory groups accented initials, keeps unknowns, and preserves input records", () => {
  const entries = [
    { title: "Anevum", slug: "a" }, { title: "Nali Solan", slug: "n" },
    { title: "Skygate Age", slug: "s" }, { title: "2nd Era", slug: "2" },
    { title: "\u00c9poque", slug: "e" }, { title: "", slug: "empty" },
  ];
  const copy = structuredClone(entries);
  const groups = wikiDirectoryGroups(entries);
  assert.deepEqual(groups.map(g => g.letter), ["A", "E", "N", "S", "#"]);
  assert.deepEqual(groups.map(g => g.articles.length), [1, 1, 1, 1, 2]);
  assert.deepEqual(groups.flatMap(g => g.articles).map(e => e.slug).sort(), entries.map(e => e.slug).sort());
  assert.deepEqual(entries, copy, "source array must not be modified");
  assert.equal(wikiInitial("  nali Solan  "), "N");
  assert.equal(wikiInitial("  \u00c9poque "), "E");
  assert.equal(wikiInitial("3 Rivers"), "#");
});

test("empty edition and unsorted input get predictable alphabetical ordering", () => {
  assert.deepEqual(wikiDirectoryGroups([]), []);
  const original=[{title:"Zulu"},{title:"Neral"},{title:"Nali"},{title:"Zeta"}];
  const groups = wikiDirectoryGroups(original);
  assert.deepEqual(groups.map(x=>x.letter), ["N","Z"]);
  assert.deepEqual(groups[0].articles.map(x=>x.title), ["Nali","Neral"]);
  assert.deepEqual(groups[1].articles.map(x=>x.title), ["Zeta","Zulu"]);
  assert.deepEqual(original.map(x=>x.title), ["Zulu","Neral","Nali","Zeta"], "caller order unchanged");
});

test("letter grouping is complete and stable for the entire 22-article reader fixture", () => {
  const titles=["Ovara","Nali Solan","Neral","Veyra","Merva","Serein Skygate","Neral Skygate","Open Road",
    "Cape Serein","Continuance Institute","D3-17","Deep Three","Elias Venn","GRAINIT","Greater Serein",
    "Ione","IREN","Lio Sol","Rena Sol","Skygate Age","Skygate Megastructure","Talin Vel"];
  const articles=titles.map((title,id)=>({title,id}));
  const groups=wikiDirectoryGroups(articles);
  assert.equal(groups.length,13);
  assert.equal(groups.map(g=>g.letter).join(""),"CDEGILMNORSTV");
  assert.equal(groups.reduce((sum,g)=>sum+g.articles.length,0),22);
  assert.equal(new Set(groups.flatMap(g=>g.articles).map(a=>a.id)).size,22);
  for (const group of groups) {
    assert.deepEqual(group.articles.map(a=>a.title),group.articles.map(a=>a.title).sort((a,b)=>a.localeCompare(b,"en")));
  }
});

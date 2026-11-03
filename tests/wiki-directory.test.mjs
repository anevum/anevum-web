import test from "node:test";
import assert from "node:assert/strict";
import { WIKI_DIRECTORY_ALPHABET, wikiInitial, wikiDirectoryGroups, wikiDirectoryAnchor } from "../src/data/wiki-directory.ts";

test("alphabet remains complete and navigation IDs are distinct", () => {
  assert.equal(WIKI_DIRECTORY_ALPHABET.join(""), "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  assert.equal(new Set([...WIKI_DIRECTORY_ALPHABET, "#"].map(wikiDirectoryAnchor)).size, 27);
  assert.equal(wikiDirectoryAnchor("A"), "ow-wiki-letter-a");
  assert.equal(wikiDirectoryAnchor("#"), "ow-wiki-letter-other");
});

test("known and unusual titles all remain in the reader index", () => {
  const entries = [
    { title: "Anevum", slug: "a" }, { title: "Nali Solan", slug: "n" },
    { title: "Skygate Age", slug: "s" }, { title: "2nd Era", slug: "2" },
    { title: "Époque", slug: "e" }, { title: "", slug: "empty" },
  ];
  const copy = structuredClone(entries);
  const groups = wikiDirectoryGroups(entries);
  assert.deepEqual(groups.map(g => g.letter), ["A", "N", "S", "#"]);
  assert.deepEqual(groups.map(g => g.articles.length), [1, 1, 1, 3]);
  assert.deepEqual(groups.flatMap(g => g.articles).map(e => e.slug).sort(), entries.map(e => e.slug).sort());
  assert.deepEqual(entries, copy, "source array must not be modified");
  assert.equal(wikiInitial("  nali Solan  "), "N");
  assert.equal(wikiInitial("3 Rivers"), "#");
});

test("empty curated edition yields no groups, and each letter remains ordered", () => {
  assert.deepEqual(wikiDirectoryGroups([]), []);
  const groups = wikiDirectoryGroups([{title:"Zulu"},{title:"Neral"},{title:"Nali"},{title:"Zeta"}]);
  assert.deepEqual(groups.map(x=>x.letter), ["N","Z"]);
  assert.deepEqual(groups[0].articles.map(x=>x.title), ["Neral","Nali"]);
  assert.deepEqual(groups[1].articles.map(x=>x.title), ["Zulu","Zeta"]);
});

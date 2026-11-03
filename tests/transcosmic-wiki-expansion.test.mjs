import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {readWikiFiles,validateWikiExpansion,gitBlobSha} from "../scripts/verify-transcosmic-wiki-expansion.mjs";

const source=readWikiFiles();
const copy=()=>structuredClone(source);
function rejects(edit,label){
  const state=copy();
  edit(state);
  const errors=validateWikiExpansion(state);
  assert.ok(errors.length,label+" should be rejected");
  return errors.join(" / ");
}

test("twenty-two review-only subjects are pinned: eight existing plus fourteen Now-window candidates",()=>{
  assert.deepEqual(validateWikiExpansion(copy()),[]);
  const {a,b,original}=source;
  assert.equal(original.entries.length,8);
  assert.equal(a.entries.length,7);
  assert.equal(b.entries.length,7);
  assert.equal(a.releaseState,"review_only");
  assert.equal(b.releaseState,"review_only");
  assert.equal(a.publicationApproved,false);
  assert.equal(b.publicQueueEnabled,false);
  const categories=Object.fromEntries(
    ["World","Person","Place","Infrastructure","Institution","Science","History"].map(category=>
      [category,[...original.entries,...a.entries,...b.entries].filter(e=>e.category===category).length])
  );
  assert.deepEqual(categories,{World:4,Person:5,Place:4,Infrastructure:4,Institution:1,Science:2,History:2});
});

test("content is frozen to deliberately reviewed Git blobs",()=>{
  const sha=path=>gitBlobSha(readFileSync(new URL("../src/data/"+path,import.meta.url)));
  assert.equal(sha("transcosmic-wiki-expansion-a.json"),"ac7afac1ed1830f98f501ba2e894a292400dad1e");
  assert.equal(sha("transcosmic-wiki-expansion-b.json"),"ffd2b8acdc13f3af1c12d43e330a23371df15646");
  assert.equal(sha("transcosmic-wiki-relations.json"),"045a55980cea09d50f0312fa8202fd9e73940710");
});

test("later-window subjects remain entirely absent from this reader dataset",()=>{
  const slugs=[...source.original.entries,...source.a.entries,...source.b.entries].map(e=>e.slug);
  for(const forbidden of [
    "anel-varo","kalen-tor","kerin-solan","selian-ort",
    "north-works","ovaran-contact-forum","first-visit"
  ]) assert.ok(!slugs.includes(forbidden));
  for(const marker of ["Ovaran Contact Forum","North Works","Chapter 43","first physical visitor","Jon Zero"]){
    const content=JSON.stringify([source.a.entries,source.b.entries]);
    assert.ok(!content.includes(marker),"staged/private canon in reader copy: "+marker);
  }
});

test("published or queued records fail even if Website Ready/Now are true",()=>{
  for(const field of ["publicationApproved","publicQueueEnabled"]){
    assert.match(rejects(state=>{state.a[field]=true;},field),/publication is not authorized/);
    assert.match(rejects(state=>{state.b[field]=true;},field),/publication is not authorized/);
  }
  assert.match(rejects(state=>{state.links.publicationApproved=true;},"link release"),/not a publishing feed/);
  assert.match(rejects(state=>{state.a.releaseState="public";},"release state"),/publication/);
  assert.match(rejects(state=>{state.b.publishAfter="2026-11-17";},"date shortcut"),/schema/);
});

test("new entries, renamed topics and category drifts fail closed",()=>{
  assert.match(rejects(state=>{state.a.entries.push({...state.a.entries[0],id:"23",slug:"future",title:"Future"});},"extra entry"),/expected seven/);
  assert.match(rejects(state=>{state.b.entries[0].slug="ovara";},"duplicate term"),/title, id, slug or category|22 unique/);
  assert.match(rejects(state=>{state.a.entries[2].category="Public Event";},"unknown category"),/unreviewed/);
  assert.match(rejects(state=>{state.b.entries[4].sourceUrl="https://app.notion.com/private";},"private field"),/unexpected article field/);
});

test("unapproved private source URLs, future-book spoilers and markup fail closed",()=>{
  assert.match(rejects(state=>{state.a.entries[0].detail="https://app.notion.com/private";},"private URL"),/invalid or restricted/);
  assert.match(rejects(state=>{state.b.entries[6].detail+="\n\nChapter 43";},"late chapter"),/invalid or restricted/);
  assert.match(rejects(state=>{state.b.entries[3].summary="<script>bad</script>";},"untrusted HTML"),/invalid or restricted/);
  assert.match(rejects(state=>{state.b.entries[6].detail+="\n\nfirst physical visitor";},"visitor spoiler"),/invalid or restricted/);
});

test("relations cannot introduce fabricated links, unknown pages or Road links to Ovara",()=>{
  assert.match(rejects(state=>{state.links.relationships["ione"].push({slug:"unknown-world",relation:"unverified"});},"unknown article"),/unknown/);
  assert.match(rejects(state=>{state.links.relationships["skygate-age"].push({slug:"ovara",relation:"Mature Road endpoint"});},"fabricated Road connection"),/unreviewed|source|wiki/i);
  assert.match(rejects(state=>{state.links.bridges.ovara=[{slug:"open-road",relation:"connected"}];},"Ovara link"),/unexpected|Ovara/);
  assert.match(rejects(state=>{state.links.bridges["serein-skygate"].push({slug:"serein-skygate",relation:"Self"});},"self"),/self/);
  assert.match(rejects(state=>{state.links.relationships["deep-three"][0].relation="<b>bad</b>";},"markup"),/restricted/);
});

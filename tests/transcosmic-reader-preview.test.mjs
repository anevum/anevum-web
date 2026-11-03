import test from "node:test";
import assert from "node:assert/strict";
import {
  readCurrentPreviewFiles,
  validateReaderPreview
} from "../scripts/verify-transcosmic-reader-preview.mjs";

const source = readCurrentPreviewFiles();
const clone = () => structuredClone(source);

function mustReject(mutator, reason) {
  const {manifest, baseline} = clone();
  mutator(manifest, baseline);
  const errors = validateReaderPreview(manifest, baseline);
  assert.ok(errors.length > 0, "expected fail-closed rejection: " + reason);
  return errors;
}

test("exact curated reader manifest and frozen preview snapshot are valid, not published", () => {
  const {manifest, baseline} = clone();
  assert.deepEqual(validateReaderPreview(manifest, baseline), []);
  assert.equal(manifest.releaseState, "review_only");
  assert.equal(manifest.authorApprovedForPublication, false);
  assert.equal(manifest.publishingQueuePublic, false);
  assert.equal(manifest.storyPhase, "opening-state");
  assert.equal(manifest.entries.length, 8);
  assert.deepEqual(manifest.entries.map(record => record.slug), [
    "ovara", "nali-solan", "neral", "veyra", "merva",
    "serein-skygate", "neral-skygate", "open-road"
  ]);
});

test("publication flags and release windows cannot accidentally go live", () => {
  for (const [name, update] of [
    ["release state", input => { input.releaseState = "public"; }],
    ["approval", input => { input.authorApprovedForPublication = true; }],
    ["queue public", input => { input.publishingQueuePublic = true; }],
    ["extra date", input => { input.publishAfter = "2026-11-17"; }],
    ["story phase", input => { input.storyPhase = "epilogue"; }]
  ]) {
    assert.match(mustReject(update, name).join(" "), /publication|schema|fields/i);
  }
});

test("unknown, missing or duplicate records never become visible through a manifest change", () => {
  assert.match(mustReject(manifest => {
    manifest.entries.push({...manifest.entries[0], id:"09", slug:"unreviewed",title:"Unreviewed"});
  }, "unknown slug").join(" "), /exactly eight/);
  assert.match(mustReject(manifest => {
    manifest.entries[2].slug = "ovara";
  }, "duplicate slug").join(" "), /unreviewed identity|duplicate/);
  assert.match(mustReject(manifest => {
    manifest.entries[0].category = "Future Book";
  }, "unapproved category").join(" "), /identity|category/);
  assert.match(mustReject(manifest => {
    manifest.entries[4].privateCanonPage = "notion-file-block://private";
  }, "unexpected fields").join(" "), /unexpected|missing field/);
});

test("the Road never becomes a transitive connection to Ovara", () => {
  assert.match(mustReject(manifest => {
    manifest.relationships.ovara.push({
      slug: "open-road", label:"Open Road", relation:"Imaginary road"
    });
  }, "invented Ovara Road").join(" "), /topology/);
  assert.match(mustReject(manifest => {
    manifest.relationships["open-road"][0].slug = "ovara";
  }, "retargeted endpoint").join(" "), /topology/);
  assert.match(mustReject(manifest => {
    manifest.relationships["serein-skygate"][0].label = "False destination";
  }, "wrong related title").join(" "), /invalid destination|baseline/);
  assert.match(mustReject(manifest => {
    manifest.relationships["neral-skygate"].push({
      slug:"nonexistent-world", label:"Nonexistent World", relation:"Unknown"
    });
  }, "unknown endpoint").join(" "), /topology/);
});

test("editorial baseline detects alterations to seemingly harmless prose", () => {
  const errors = mustReject(manifest => {
    manifest.entries[0].summary += " Another unreviewed statement.";
  }, "unreviewed summary");
  assert.match(errors.join(" "), /baseline/);
});

test("future-book spoilers and raw private-page references are rejected", () => {
  assert.match(mustReject(manifest => {
    manifest.entries[1].detail += " First physical visitor.";
  }, "spoiler text").join(" "), /restricted/);
  assert.match(mustReject(manifest => {
    manifest.entries[2].detail = "https://app.notion.com/some-private-page";
  }, "private source URL").join(" "), /transport|restricted/);
  assert.match(mustReject(manifest => {
    manifest.entries[3].summary = "<script>unsafe</script>";
  }, "markup injection").join(" "), /restricted/);
});

test("snapshot is an independent non-public review gate, not publication proof", () => {
  assert.match(mustReject((manifest, baseline) => {
    baseline.status = "public";
  }, "baseline publication state").join(" "), /baseline/);
  assert.match(mustReject((manifest, baseline) => {
    baseline.entries[0].summary = "Changed separately";
  }, "unreviewed baseline").join(" "), /baseline/);
});

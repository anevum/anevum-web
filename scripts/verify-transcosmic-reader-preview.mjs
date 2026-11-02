/**
 * Fail-closed guard for the read-only Transcosmic studio preview manifest.
 *
 * This checks reviewed content shape, the explicit relationship topology and
 * an independent editorial snapshot. It is not an authorization to publish:
 * the only permitted release state here is "review_only".
 *
 * This module reads local repository files only. It never contacts Notion,
 * queues public records, updates dates, or changes provider configuration.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const here = path.dirname(fileURLToPath(import.meta.url));
const previewFile = path.join(here, "../src/data/transcosmic-reader-preview.json");
const snapshotFile = path.join(here, "../tests/fixtures/transcosmic-reader-preview-baseline.json");

const EXPECTED_ENTRIES = [
  ["01", "ovara", "Ovara", "World"],
  ["02", "nali-solan", "Nali Solan", "Person"],
  ["03", "neral", "Neral", "World"],
  ["04", "veyra", "Veyra", "World"],
  ["05", "merva", "Merva", "Place"],
  ["06", "serein-skygate", "Serein Skygate", "Infrastructure"],
  ["07", "neral-skygate", "Neral Skygate", "Infrastructure"],
  ["08", "open-road", "Open Road", "Infrastructure"]
];
const EXPECTED_CONNECTIONS = {
  ovara: ["nali-solan", "merva"],
  "nali-solan": ["ovara", "merva"],
  neral: ["veyra", "neral-skygate"],
  veyra: ["neral", "serein-skygate"],
  merva: ["ovara", "nali-solan"],
  "serein-skygate": ["veyra", "open-road", "neral-skygate"],
  "neral-skygate": ["neral", "open-road", "serein-skygate"],
  "open-road": ["serein-skygate", "neral-skygate"]
};
const EXPECTED_ROOT_KEYS = [
  "schema", "edition", "storyPhase", "releaseState",
  "authorApprovedForPublication", "publishingQueuePublic",
  "entries", "relationships"
];
const EXPECTED_ENTRY_KEYS = [
  "id", "slug", "title", "category", "subtitle", "summary", "detail", "keywords"
];
const EXPECTED_RELATION_KEYS = ["slug", "label", "relation"];
const forbiddenDisclosure = /(?:Talin Vel|Kerin Solan|Ovaran Contact Forum|selected first visitor|first physical visitor|Chapter\s*\d+|Part\s*(?:III|IV)|REPLY\s*\+\s*(?:7|30|90)|epilogue|post[- ]contact|sequel[- ]specific|internal[- ]only|retailer pre.?order)/i;
const forbiddenTransport = /(?:https?:\/\/|notion:|notion-file-block:|file_[0-9a-f]{12,}|\/api\/|<[^>]{1,100}>|[\u0000-\u0008\u000B\u000C\u000E-\u001F])/i;

function hasExactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort());
}

function validateText(value, name, maxLength, errors) {
  if (typeof value !== "string" || value !== value.trim() || !value || value.length > maxLength) {
    errors.push(name + ": must be non-empty, trimmed, within length limit");
    return;
  }
  if (forbiddenDisclosure.test(value) || forbiddenTransport.test(value))
    errors.push(name + ": requires editorial review; restricted content or transport marker");
}

export function validateReaderPreview(input, baseline) {
  const errors = [];
  if (!hasExactKeys(input, EXPECTED_ROOT_KEYS)) {
    errors.push("manifest: invalid root schema or unexpected fields");
    return errors;
  }

  // No manifest author, source, edit timestamp or release window can override
  // these fields. A PUBLIC change requires an independently designed workflow.
  if (input.schema !== "transcosmic.reader-preview.v1" ||
      input.edition !== "REPLY" ||
      input.storyPhase !== "opening-state" ||
      input.releaseState !== "review_only" ||
      input.authorApprovedForPublication !== false ||
      input.publishingQueuePublic !== false)
    errors.push("manifest: publication must remain explicitly disallowed");

  if (!Array.isArray(input.entries) || input.entries.length !== EXPECTED_ENTRIES.length) {
    errors.push("entries: must contain exactly eight curated review records");
    return errors;
  }
  const slugs = new Set();
  const titleBySlug = new Map(EXPECTED_ENTRIES.map(([,slug,title]) => [slug,title]));
  for (let i = 0; i < input.entries.length; i++) {
    const record = input.entries[i];
    const [id, slug, title, category] = EXPECTED_ENTRIES[i];
    if (!hasExactKeys(record, EXPECTED_ENTRY_KEYS)) {
      errors.push("entries[" + i + "]: unexpected or missing field");
      continue;
    }
    if (record.id !== id || record.slug !== slug || record.title !== title || record.category !== category)
      errors.push("entries[" + i + "]: unreviewed identity/category change");
    if (slugs.has(record.slug)) errors.push("entries[" + i + "]: duplicate slug");
    slugs.add(record.slug);
    validateText(record.subtitle, "entries[" + i + "].subtitle", 120, errors);
    validateText(record.summary, "entries[" + i + "].summary", 520, errors);
    validateText(record.detail, "entries[" + i + "].detail", 1000, errors);
    validateText(record.keywords, "entries[" + i + "].keywords", 200, errors);
  }

  if (!input.relationships || !hasExactKeys(input.relationships, Object.keys(EXPECTED_CONNECTIONS))) {
    errors.push("relationships: unexpected or missing record topology");
  } else {
    for (const [source, targets] of Object.entries(EXPECTED_CONNECTIONS)) {
      const edges = input.relationships[source];
      if (!Array.isArray(edges) || !isDeepStrictEqual(edges.map(e => e?.slug), targets)) {
        errors.push("relationships." + source + ": unreviewed topology change");
        continue;
      }
      const seen = new Set();
      for (const [i, edge] of edges.entries()) {
        if (!hasExactKeys(edge, EXPECTED_RELATION_KEYS)) {
          errors.push("relationships." + source + "[" + i + "]: malformed edge");
          continue;
        }
        if (!titleBySlug.has(edge.slug) || edge.slug === source || seen.has(edge.slug) ||
            edge.label !== titleBySlug.get(edge.slug))
          errors.push("relationships." + source + "[" + i + "]: invalid destination, title or duplicate");
        seen.add(edge.slug);
        validateText(edge.relation, "relationships." + source + "[" + i + "].relation", 90, errors);
      }
    }
  }

  if (!hasExactKeys(baseline, ["snapshotType", "status", "note", "entries", "relationships"]) ||
      baseline.snapshotType !== "anevum.transcosmic.preview-editorial-baseline.v1" ||
      baseline.status !== "review_only" ||
      typeof baseline.note !== "string") {
    errors.push("baseline: immutable editorial-review snapshot is missing or malformed");
  } else if (!isDeepStrictEqual(
    { entries: input.entries, relationships: input.relationships },
    { entries: baseline.entries, relationships: baseline.relationships }
  )) {
    errors.push("baseline: content differs from separately frozen review snapshot");
  }

  return errors;
}

export function readCurrentPreviewFiles() {
  return {
    manifest: JSON.parse(readFileSync(previewFile, "utf8")),
    baseline: JSON.parse(readFileSync(snapshotFile, "utf8"))
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { manifest, baseline } = readCurrentPreviewFiles();
    const failures = validateReaderPreview(manifest, baseline);
    if (failures.length) {
      for (const failure of failures) console.error("Reader preview rejected:", failure);
      process.exitCode = 1;
    } else {
      console.log("Reader preview validated: 8 editorial-baseline records, 8 guarded relationship sets; review only.");
    }
  } catch (error) {
    console.error("Reader preview rejected: unable to read or parse manifest/baseline", error?.code || "invalid-json");
    process.exitCode = 1;
  }
}

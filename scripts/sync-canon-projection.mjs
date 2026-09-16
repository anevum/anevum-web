import { readFile, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const CONFIG_PATH = resolve(ROOT, "config/canon-projection-overrides.json");
const PUBLIC_OBJECTS_PATH = resolve(ROOT, "src/publicObjects.ts");
const CANON_PROJECTION_PATH = resolve(ROOT, "src/canonProjection.ts");
const WIKI_SITEMAP_PATH = resolve(ROOT, "public/wiki-sitemap.xml");

const NOTION_VERSION = "2025-09-03";
const PUBLISHING_QUEUE_DATA_SOURCE_ID = process.env.NOTION_PUBLISHING_QUEUE_DATA_SOURCE_ID || "11bead82-0bfa-45cd-bccb-53b35dacdfdf";
const CANON_DATA_SOURCE_ID = process.env.NOTION_CANON_DATA_SOURCE_ID || "8486408d-b9d6-436f-9669-bb92a5a51e9b";
const SOURCE_LABEL = "Live Notion Transcosmic Canon Wiki + Website Publishing Queue";
const POLICY_LABEL = "Public=true + Window=Now + Wiki section + approved public prose + Source-Locked/Locked/Canonical";
const ALLOWED_SECTIONS = new Set(["Universe", "Atlas", "Archive"]);
const ALLOWED_RENDER_MODES = new Set(["Full", "Curated", "Teaser"]);
const ALLOWED_SPOILER_LEVELS = new Set(["Safe", "Light"]);
const ALLOWED_CANON_STATES = new Set(["Source-Locked", "Locked", "Canonical"]);
const VISUAL_KEYS = ["merva", "person", "neral", "ovara", "connected", "grainit", "iren", "skygate", "continuance", "road", "event", "deep-three", "ione", "cape", "serein", "veyra"];
const RELATION_TYPES = new Set(["located-in", "member-of", "connected-to", "contains", "operates-through"]);

const args = new Set(process.argv.slice(2));
const validateOnly = args.has("--validate-config");
const checkOnly = args.has("--check");
const writeMode = args.has("--write");

function fail(message) {
  throw new Error(message);
}

function textValue(property) {
  if (!property || typeof property !== "object") return "";
  if (property.type === "title") return (property.title || []).map((item) => item.plain_text || item.text?.content || "").join("").trim();
  if (property.type === "rich_text") return (property.rich_text || []).map((item) => item.plain_text || item.text?.content || "").join("").trim();
  if (property.type === "select") return property.select?.name || "";
  if (property.type === "status") return property.status?.name || "";
  if (property.type === "url") return property.url || "";
  if (property.type === "email") return property.email || "";
  if (property.type === "phone_number") return property.phone_number || "";
  if (property.type === "formula") {
    const formula = property.formula || {};
    return formula.string ?? formula.number ?? formula.boolean ?? "";
  }
  return "";
}

function numberValue(property) {
  if (!property || typeof property !== "object") return null;
  if (property.type === "number") return property.number;
  if (property.type === "formula" && property.formula?.type === "number") return property.formula.number;
  return null;
}

function checkboxValue(property) {
  return Boolean(property && property.type === "checkbox" && property.checkbox === true);
}

function property(page, name) {
  return page?.properties?.[name];
}

function normalizeId(value) {
  return String(value || "").toLowerCase().replace(/[^a-f0-9]/g, "");
}

function pageIdFromUrl(value) {
  const compact = String(value || "").match(/([a-f0-9]{32})(?:[?#/]|$)/i)?.[1];
  if (compact) return compact.toLowerCase();
  const uuid = String(value || "").match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i)?.[1];
  return uuid ? normalizeId(uuid) : "";
}

function normalizeCanonState(value) {
  const raw = String(value || "").trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (raw === "source-locked" || raw === "sourcelocked") return "Source-Locked";
  if (raw === "locked") return "Locked";
  if (raw === "canonical" || raw === "canon") return "Canonical";
  if (raw === "working" || raw === "working-canon" || raw === "draft" || raw === "work-in-progress" || raw === "wip") return "Working";
  if (raw === "unresolved") return "Unresolved";
  if (raw === "exploratory") return "Exploratory";
  if (raw === "superseded") return "Superseded";
  if (raw === "archived" || raw === "archive") return "Archived";
  return "Unresolved";
}

function normalizeFreezeState(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "ready") return "Ready";
  if (raw === "intentional open") return "Intentional Open";
  if (raw === "superseded") return "Superseded";
  return "Blocking";
}

function normalizeVisualStatus(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (raw === "LOCKED" || raw === "PROVISIONAL" || raw === "PLANNED" || raw === "ILLUSTRATIVE") return raw;
  return "UNSPECIFIED";
}

function normalizeReplyGate(value) {
  return String(value || "").trim().toUpperCase();
}

function validateConfig(config) {
  if (!config || typeof config !== "object" || !config.records || !config.relations) fail("Projection config must contain records and relations.");
  const ids = new Set();
  const slugs = new Set();
  for (const [route, record] of Object.entries(config.records)) {
    if (!route.startsWith("/")) fail(`Presentation route must begin with '/': ${route}`);
    for (const key of ["id", "slug", "visualKey", "summary", "publicNote"]) {
      if (!record?.[key] || typeof record[key] !== "string") fail(`Presentation entry ${route} is missing ${key}.`);
    }
    if (!VISUAL_KEYS.includes(record.visualKey)) fail(`Presentation entry ${route} uses unknown visualKey ${record.visualKey}.`);
    if (ids.has(record.id)) fail(`Duplicate public record id: ${record.id}`);
    if (slugs.has(record.slug)) fail(`Duplicate public slug: ${record.slug}`);
    ids.add(record.id);
    slugs.add(record.slug);
    if (record.facts !== undefined) {
      if (!Array.isArray(record.facts) || record.facts.some((pair) => !Array.isArray(pair) || pair.length !== 2 || pair.some((part) => typeof part !== "string"))) {
        fail(`Presentation facts must be [label,value] string pairs for ${route}.`);
      }
    }
  }
  if (!Array.isArray(config.relations)) fail("relations must be an array.");
  for (const relation of config.relations) {
    if (!relation?.id || !relation?.fromSlug || !relation?.toSlug || !RELATION_TYPES.has(relation?.relation)) fail(`Invalid relation entry: ${JSON.stringify(relation)}`);
    if (!slugs.has(relation.fromSlug) || !slugs.has(relation.toSlug)) fail(`Relation ${relation.id} references a slug without an approved presentation entry.`);
  }
}

let lastRequestAt = 0;
async function notion(path, init = {}) {
  const token = process.env.NOTION_API_TOKEN;
  if (!token) fail("NOTION_API_TOKEN is required for live canon projection sync.");

  const wait = Math.max(0, 350 - (Date.now() - lastRequestAt));
  if (wait) await new Promise((resolveWait) => setTimeout(resolveWait, wait));
  lastRequestAt = Date.now();

  const response = await fetch(`https://api.notion.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.message || payload?.code || `HTTP ${response.status}`;
    fail(`Notion request failed for ${path}: ${message}`);
  }
  return payload;
}

async function queryDataSource(id) {
  const rows = [];
  let cursor = null;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const payload = await notion(`/v1/data_sources/${id}/query`, { method: "POST", body: JSON.stringify(body) });
    rows.push(...(payload.results || []));
    cursor = payload.has_more ? payload.next_cursor : null;
  } while (cursor);
  return rows;
}

function eligibleQueueRow(page) {
  const props = page.properties || {};
  return checkboxValue(props.Public)
    && textValue(props["Public Window"]) === "Now"
    && ALLOWED_SECTIONS.has(textValue(props.Section))
    && ALLOWED_RENDER_MODES.has(textValue(props["Render Mode"]))
    && ALLOWED_SPOILER_LEVELS.has(textValue(props["Spoiler Level"]));
}

function lifecycleCounts(canonRows) {
  const counts = {
    "Source-Locked": 0,
    Locked: 0,
    Canonical: 0,
    Working: 0,
    Unresolved: 0,
    Exploratory: 0,
    Superseded: 0,
    Archived: 0,
  };
  for (const row of canonRows) {
    const state = normalizeCanonState(textValue(property(row, "Canon Status")));
    counts[state] += 1;
  }
  return counts;
}

function buildRecords(queueRows, canonRows, config) {
  const canonById = new Map(canonRows.map((row) => [normalizeId(row.id), row]));
  const records = [];
  const blocked = [];

  for (const queuePage of queueRows.filter(eligibleQueueRow)) {
    const siteRoute = textValue(property(queuePage, "Site Route"));
    const sourceUrl = textValue(property(queuePage, "Source URL"));
    const override = config.records[siteRoute];
    if (!override) {
      blocked.push(`${siteRoute || "<missing route>"}: no approved public presentation entry`);
      continue;
    }

    const sourceId = pageIdFromUrl(sourceUrl);
    const source = sourceId ? canonById.get(sourceId) : null;
    if (!source) {
      blocked.push(`${siteRoute}: source page is not resolvable inside the Canon Encyclopedia data source`);
      continue;
    }

    const canonState = normalizeCanonState(textValue(property(source, "Canon Status")));
    const freezeState = normalizeFreezeState(textValue(property(source, "Freeze Status")));
    const websiteReady = checkboxValue(property(source, "Website Ready"));
    const sourceWindow = textValue(property(source, "Public Window"));

    if (!ALLOWED_CANON_STATES.has(canonState)) {
      blocked.push(`${siteRoute}: source lifecycle is ${canonState}, which is not product-visible`);
      continue;
    }
    if (!websiteReady || sourceWindow !== "Now") {
      blocked.push(`${siteRoute}: source page has not passed Website Ready + Public Window Now`);
      continue;
    }

    const section = textValue(property(queuePage, "Section")).toUpperCase();
    const renderMode = textValue(property(queuePage, "Render Mode")).toUpperCase();
    const spoilerLevel = textValue(property(queuePage, "Spoiler Level")).toUpperCase();
    const priority = numberValue(property(queuePage, "Priority"));
    const entryType = textValue(property(source, "Entry Type")).toUpperCase() || "OTHER";
    const title = textValue(property(queuePage, "Name")) || textValue(property(source, "Name"));

    records.push({
      id: override.id,
      slug: override.slug,
      title,
      type: entryType,
      section,
      route: `/wiki/${override.slug}`,
      sourceRoute: siteRoute,
      sourceUrl,
      summary: override.summary,
      renderMode,
      spoilerLevel,
      publicWindow: "NOW",
      replyGate: normalizeReplyGate(textValue(property(queuePage, "REPLY Gate"))),
      priority: typeof priority === "number" ? priority : 0,
      visualKey: override.visualKey,
      visualStatus: normalizeVisualStatus(textValue(property(source, "Visual Status"))),
      publicNote: override.publicNote,
      ...(override.facts ? { facts: override.facts } : {}),
      canonState,
      freezeState,
    });
  }

  records.sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title));
  return { records, blocked };
}

function renderPublicObjects(records, syncedAt) {
  const publicRecords = records.map(({ canonState: _canonState, freezeState: _freezeState, ...record }) => record);
  return `export type VisualKey =\n${VISUAL_KEYS.map((key) => `  | ${JSON.stringify(key)}`).join("\n")};\n\nexport type PublicObject = {\n  id: string;\n  slug: string;\n  title: string;\n  type: string;\n  section: \"UNIVERSE\" | \"ATLAS\" | \"ARCHIVE\";\n  route: string;\n  sourceRoute: string;\n  sourceUrl: string;\n  summary: string;\n  renderMode: \"FULL\" | \"CURATED\" | \"TEASER\";\n  spoilerLevel: \"SAFE\" | \"LIGHT\";\n  publicWindow: \"NOW\";\n  replyGate: string;\n  priority: number;\n  visualKey: VisualKey;\n  visualStatus: \"LOCKED\" | \"PROVISIONAL\" | \"PLANNED\" | \"ILLUSTRATIVE\" | \"UNSPECIFIED\";\n  publicNote: string;\n  facts?: Array<[string, string]>;\n};\n\nexport const PUBLIC_SYNC = ${JSON.stringify({ source: SOURCE_LABEL, syncedAt, count: publicRecords.length }, null, 2)} as const;\n\n// GENERATED by scripts/sync-canon-projection.mjs. Do not hand-edit release state here.\n// Public prose remains separately approved in config/canon-projection-overrides.json.\nexport const publicObjects: PublicObject[] = ${JSON.stringify(publicRecords, null, 2)} as PublicObject[];\n\nexport const featuredPublicObjects = publicObjects.slice(0, 10);\n\nexport function getPublicObjectBySlug(slug: string) {\n  return publicObjects.find((record) => record.slug === slug);\n}\n\nexport function searchPublicObjects(query: string, section: string = \"ALL\") {\n  const normalized = query.trim().toLowerCase();\n  return publicObjects.filter((record) => {\n    const sectionMatch = section === \"ALL\" || record.section === section;\n    const queryMatch = !normalized || [record.title, record.type, record.section, record.summary].join(\" \" ).toLowerCase().includes(normalized);\n    return sectionMatch && queryMatch;\n  });\n}\n`;
}

function renderCanonProjection(records, counts, relations, syncedAt) {
  const stateBySlug = Object.fromEntries(records.map((record) => [record.slug, record.canonState]));
  const freezeBySlug = Object.fromEntries(records.map((record) => [record.slug, record.freezeState]));
  const visibleSlugs = new Set(records.map((record) => record.slug));
  const safeRelations = relations.filter((relation) => visibleSlugs.has(relation.fromSlug) && visibleSlugs.has(relation.toSlug));

  return `import { publicObjects, type PublicObject } from \"./publicObjects\";\n\nexport type CanonLifecycleState =\n  | \"Source-Locked\"\n  | \"Locked\"\n  | \"Canonical\"\n  | \"Working\"\n  | \"Unresolved\"\n  | \"Exploratory\"\n  | \"Superseded\"\n  | \"Archived\";\n\nexport type FreezeState = \"Ready\" | \"Intentional Open\" | \"Blocking\" | \"Superseded\";\n\nexport type CanonProjectionRecord = PublicObject & {\n  canonState: CanonLifecycleState;\n  freezeState: FreezeState;\n};\n\nexport type CanonProjectionRelation = {\n  id: string;\n  fromSlug: string;\n  toSlug: string;\n  relation: \"located-in\" | \"member-of\" | \"connected-to\" | \"contains\" | \"operates-through\";\n};\n\nexport const CANON_PROJECTION_SYNC = ${JSON.stringify({ source: SOURCE_LABEL, syncedAt, queueCount: records.length, policy: POLICY_LABEL }, null, 2)} as const;\n\nexport const CANON_LIFECYCLE_COUNTS: Record<CanonLifecycleState, number> = ${JSON.stringify(counts, null, 2)};\n\nconst stateBySlug: Record<string, CanonLifecycleState> = ${JSON.stringify(stateBySlug, null, 2)};\n\nconst freezeBySlug: Record<string, FreezeState> = ${JSON.stringify(freezeBySlug, null, 2)};\n\nexport const canonProjectionRecords: CanonProjectionRecord[] = publicObjects.map((record) => ({\n  ...record,\n  canonState: stateBySlug[record.slug] || \"Unresolved\",\n  freezeState: freezeBySlug[record.slug] || \"Blocking\",\n}));\n\n// Relations are separately publication-approved and filtered to the current released record set.\nexport const canonProjectionRelations: CanonProjectionRelation[] = ${JSON.stringify(safeRelations, null, 2)} as CanonProjectionRelation[];\n\nexport function getCanonProjectionRecord(slug: string) {\n  return canonProjectionRecords.find((record) => record.slug === slug) || null;\n}\n`;
}

function renderWikiSitemap(records, syncedAt) {
  const entries = [
    `  <url>\n    <loc>https://wiki.anevum.com/</loc>\n    <lastmod>${syncedAt}</lastmod>\n  </url>`,
    ...records.map((record) => `  <url>\n    <loc>https://wiki.anevum.com/${record.slug}</loc>\n    <lastmod>${syncedAt}</lastmod>\n  </url>`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

async function writeAtomically(path, content) {
  const temporary = `${path}.tmp`;
  await writeFile(temporary, content, "utf8");
  await rename(temporary, path);
}

async function main() {
  const config = JSON.parse(await readFile(CONFIG_PATH, "utf8"));
  validateConfig(config);
  if (validateOnly) {
    console.log(`Canon projection config valid: ${Object.keys(config.records).length} approved records, ${config.relations.length} approved relations.`);
    return;
  }
  if (!writeMode && !checkOnly) fail("Choose --write, --check, or --validate-config.");

  const [queueRows, canonRows] = await Promise.all([
    queryDataSource(PUBLISHING_QUEUE_DATA_SOURCE_ID),
    queryDataSource(CANON_DATA_SOURCE_ID),
  ]);
  const { records, blocked } = buildRecords(queueRows, canonRows, config);
  if (blocked.length) fail(`Canon projection blocked; production was not changed:\n- ${blocked.join("\n- ")}`);
  if (!records.length) fail("Canon projection resolved zero release-safe records; refusing to replace production.");

  const counts = lifecycleCounts(canonRows);
  const syncedAt = new Date().toISOString().slice(0, 10);
  const publicSource = renderPublicObjects(records, syncedAt);
  const canonSource = renderCanonProjection(records, counts, config.relations, syncedAt);
  const wikiSitemap = renderWikiSitemap(records, syncedAt);
  const currentPublic = await readFile(PUBLIC_OBJECTS_PATH, "utf8");
  const currentCanon = await readFile(CANON_PROJECTION_PATH, "utf8");
  const currentWikiSitemap = await readFile(WIKI_SITEMAP_PATH, "utf8").catch(() => "");
  const changed = currentPublic !== publicSource || currentCanon !== canonSource || currentWikiSitemap !== wikiSitemap;

  console.log(`Resolved ${records.length} release-safe Wiki records from ${queueRows.length} queue rows and ${canonRows.length} canon rows.`);
  console.log(`Lifecycle counts: ${JSON.stringify(counts)}`);

  if (checkOnly) {
    if (changed) fail("Live Notion projection differs from the checked-in production projection or Wiki sitemap.");
    console.log("Checked-in projection and Wiki sitemap match live Notion state.");
    return;
  }

  if (!changed) {
    console.log("Projection already current; no files changed.");
    return;
  }

  await writeAtomically(PUBLIC_OBJECTS_PATH, publicSource);
  await writeAtomically(CANON_PROJECTION_PATH, canonSource);
  await writeAtomically(WIKI_SITEMAP_PATH, wikiSitemap);
  console.log("Updated src/publicObjects.ts, src/canonProjection.ts and public/wiki-sitemap.xml.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

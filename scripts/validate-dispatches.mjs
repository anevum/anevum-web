import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const sourcePath = path.join(ROOT, "src", "data", "dispatches.json");
const sitemapPath = path.join(ROOT, "public", "sitemap.xml");
const registry = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const entries = Array.isArray(registry.entries) ? registry.entries : [];
const errors = [];
const kinds = new Set(["PROGRESS REPORT", "RESEARCH NOTE", "SYSTEM UPDATE", "FIELD NOTE"]);
const statuses = new Set(["SHIPPED", "ACTIVE", "RECORDED"]);
const slugs = new Set();

if (registry.schemaVersion !== 1) errors.push("Unsupported Dispatches schemaVersion.");
if (!entries.length) errors.push("Dispatches must contain at least one public entry.");

for (const entry of entries) {
  for (const key of ["slug", "publishedAt", "kind", "system", "status", "title", "dek", "body", "tags", "links"]) {
    if (entry[key] == null) errors.push((entry.slug || "<unknown>") + ": missing " + key);
  }

  if (!/^[a-z0-9-]+$/.test(String(entry.slug || ""))) errors.push(String(entry.slug) + ": invalid slug");
  if (slugs.has(entry.slug)) errors.push("Duplicate Dispatch slug: " + entry.slug);
  slugs.add(entry.slug);

  if (!kinds.has(entry.kind)) errors.push(entry.slug + ": unsupported kind " + entry.kind);
  if (!statuses.has(entry.status)) errors.push(entry.slug + ": unsupported status " + entry.status);
  if (Number.isNaN(Date.parse(entry.publishedAt))) errors.push(entry.slug + ": publishedAt is not a valid date");
  if (!Array.isArray(entry.body) || entry.body.length < 1) errors.push(entry.slug + ": body must contain at least one paragraph");
  if (!Array.isArray(entry.tags)) errors.push(entry.slug + ": tags must be an array");
  if (!Array.isArray(entry.links) || entry.links.some((href) => typeof href !== "string" || !href.startsWith("/") || href.startsWith("//"))) {
    errors.push(entry.slug + ": links must be local absolute paths");
  }
}

const ordered = [...entries].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
if (JSON.stringify(ordered.map((entry) => entry.slug)) !== JSON.stringify(entries.map((entry) => entry.slug))) {
  errors.push("Dispatches must be stored newest-first.");
}

if (!fs.existsSync(sitemapPath)) {
  errors.push("Generated sitemap is missing.");
} else {
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  for (const entry of entries) {
    const url = "https://anevum.com/dispatches/" + entry.slug;
    if (!sitemap.includes(url)) errors.push("Sitemap missing " + url);
  }
}

if (errors.length) {
  console.error(errors.map((error) => "- " + error).join("\n"));
  process.exit(1);
}

console.log("Dispatches invariants passed for " + entries.length + " public entries.");

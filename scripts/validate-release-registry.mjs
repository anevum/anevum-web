import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { currentRelease, loadReleaseRegistry } from "./release-registry.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const registry = loadReleaseRegistry();
const errors = [];
const required = [
  "slug","version","codename","lifecycle","releaseClass","date","headline","abstract","thesis",
  "sourceCommit","activeStrategy","pdfPath","badges","capabilities","architecture","verification","limitations","changelog","next"
];

if (registry.schemaVersion !== 2) errors.push("Unsupported release registry schemaVersion.");
if (!registry.releases.length) errors.push("Release registry must contain at least one release.");

const slugs = new Set();
const versions = new Set();
let currentCount = 0;

for (const release of registry.releases) {
  for (const key of required) if (release[key] == null) errors.push(release.slug + ": missing " + key);
  if (slugs.has(release.slug)) errors.push("Duplicate release slug: " + release.slug);
  slugs.add(release.slug);
  if (versions.has(release.version)) errors.push("Duplicate release version: " + release.version);
  versions.add(release.version);
  if (!/^\d+\.\d+\.\d+$/.test(release.version)) errors.push(release.slug + ": version must be semver x.y.z");
  if (release.status === "current") currentCount += 1;
  const expectedPdf = "/releases/RHEN-" + release.version + "-" + release.codename.toUpperCase().replace(/[^A-Z0-9_-]/g, "-") + ".pdf";
  if (release.pdfPath !== expectedPdf) errors.push(release.slug + ": pdfPath does not match version/codename-derived path");
  if (!release.sourceCommit || release.sourceCommit.length !== 40) errors.push(release.slug + ": sourceCommit must be a full SHA");
}

const current = currentRelease(registry);
if (currentCount !== 1) errors.push("Exactly one snapshot must retain status=current for historical readability.");
if (current.status !== "current") errors.push("currentSlug must point at the snapshot whose status is current.");

const generated = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "release-registry.json"), "utf8"));
if (generated.currentSlug !== registry.currentSlug) errors.push("Generated release-registry.json currentSlug drifted.");
if (generated.currentPdfPath !== current.pdfPath) errors.push("Generated release-registry.json currentPdfPath drifted.");
for (const release of registry.releases) {
  if (!generated.releaseRoutes.includes("/releases/" + release.slug)) errors.push("Generated route missing for " + release.slug);
  const packet = path.join(ROOT, "public", release.pdfPath.replace(/^\//, ""));
  if (!fs.existsSync(packet) || fs.statSync(packet).size === 0) errors.push("Generated PDF missing or empty: " + release.pdfPath);
}

const sitemap = fs.readFileSync(path.join(ROOT, "public", "sitemap.xml"), "utf8");
for (const release of registry.releases) {
  const url = "https://anevum.com/releases/" + release.slug;
  if (!sitemap.includes(url)) errors.push("Sitemap missing " + url);
}

const forbiddenValues = [];
for (const release of registry.releases) {
  forbiddenValues.push(
    release.version,
    release.codename,
    release.lifecycle,
    release.sourceCommit,
    release.productionDeployment,
    release.shadowDeployment,
    release.preopenDeployment,
    release.activeStrategy,
    release.slug,
    release.pdfPath
  );
}
const allowPaths = new Set([
  "src/data/releases.json",
  "docs/RHEN_RELEASE_PROGRAM.md"
]);
const scanRoots = ["src","scripts",".github","worker.mjs","index.html","public"];
const files = [];
function walk(target) {
  const full = path.join(ROOT, target);
  if (!fs.existsSync(full)) return;
  const stat = fs.statSync(full);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(full)) walk(path.join(target, name));
  } else {
    files.push(target);
  }
}
for (const root of scanRoots) walk(root);

for (const file of files) {
  if (allowPaths.has(file)) continue;
  if (file === "public/release-registry.json" || file === "public/sitemap.xml") continue;
  if (/\.(png|jpg|jpeg|ico|pdf|map)$/.test(file)) continue;
  const text = fs.readFileSync(path.join(ROOT, file), "utf8");
  for (const value of forbiddenValues.filter(Boolean)) {
    if (text.includes(String(value))) errors.push("Release identity literal duplicated outside registry: " + value + " in " + file);
  }
}

if (process.env.GITHUB_EVENT_NAME === "push" && process.env.GITHUB_REF_NAME?.startsWith("rhen-v")) {
  const tagVersion = process.env.GITHUB_REF_NAME.slice("rhen-v".length);
  if (tagVersion !== current.version && !versions.has(tagVersion)) errors.push("Publication tag has no matching release version.");
}

if (process.env.GITHUB_BASE_REF) {
  try {
    const baseRef = "origin/" + process.env.GITHUB_BASE_REF;\n    const baseText = execFileSync("git", ["show", baseRef + ":src/data/releases.json"], { cwd: ROOT, encoding: "utf8" });
    const base = JSON.parse(baseText);
    const baseReleases = Array.isArray(base) ? base : base.releases;
    const bySlug = new Map(registry.releases.map((r) => [r.slug, r]));
    for (const prior of baseReleases || []) {
      const now = bySlug.get(prior.slug);
      if (!now) {
        errors.push("Published release snapshot removed: " + prior.slug);
        continue;
      }
      const normalize = (value) => {
        const copy = structuredClone(value);
        delete copy.status;
        return copy;
      };
      if (JSON.stringify(normalize(prior)) !== JSON.stringify(normalize(now))) {
        errors.push("Published release snapshot mutated: " + prior.slug + ". Historical snapshots are immutable.");
      }
    }
  } catch (error) {
    errors.push("Could not compare historical release snapshots against base: " + error.message);
  }
}

if (errors.length) {
  console.error(errors.map((error) => "- " + error).join("\n"));
  process.exit(1);
}
console.log("RHEN release registry invariants passed for " + current.version + " " + current.codename + ".");

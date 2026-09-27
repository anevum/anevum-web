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

for (const release of registry.releases) {
  for (const key of required) {
    if (release[key] == null) errors.push((release.slug || "<unknown>") + ": missing " + key);
  }
  if (slugs.has(release.slug)) errors.push("Duplicate release slug: " + release.slug);
  slugs.add(release.slug);
  if (versions.has(release.version)) errors.push("Duplicate release version: " + release.version);
  versions.add(release.version);
  if (!/^\d+\.\d+\.\d+$/.test(release.version)) errors.push(release.slug + ": version must be semver x.y.z");
  if (!/^[a-z0-9-]+$/.test(release.slug)) errors.push(release.slug + ": slug must be lowercase kebab-case");
  if (!release.sourceCommit || !/^[0-9a-f]{40}$/i.test(release.sourceCommit)) errors.push(release.slug + ": sourceCommit must be a full SHA");
  const expectedPdf = "/releases/RHEN-" + release.version + "-" + release.codename.toUpperCase().replace(/[^A-Z0-9_-]/g, "-") + ".pdf";
  if (release.pdfPath !== expectedPdf) errors.push(release.slug + ": pdfPath does not match version/codename-derived path");
}

const current = currentRelease(registry);
if (!slugs.has(registry.currentSlug)) errors.push("currentSlug does not resolve to a registered release.");

const generatedRegistryPath = path.join(ROOT, "public", "release-registry.json");
const sitemapPath = path.join(ROOT, "public", "sitemap.xml");
if (!fs.existsSync(generatedRegistryPath)) errors.push("Generated public/release-registry.json is missing.");
if (!fs.existsSync(sitemapPath)) errors.push("Generated public/sitemap.xml is missing.");

if (fs.existsSync(generatedRegistryPath)) {
  const generated = JSON.parse(fs.readFileSync(generatedRegistryPath, "utf8"));
  if (generated.schemaVersion !== registry.schemaVersion) errors.push("Generated registry schemaVersion drifted.");
  if (generated.currentSlug !== registry.currentSlug) errors.push("Generated registry currentSlug drifted.");
  if (generated.currentVersion !== current.version) errors.push("Generated registry currentVersion drifted.");
  if (generated.currentCodename !== current.codename) errors.push("Generated registry currentCodename drifted.");
  if (generated.currentLifecycle !== current.lifecycle) errors.push("Generated registry currentLifecycle drifted.");
  if (generated.currentReleaseClass !== current.releaseClass) errors.push("Generated registry currentReleaseClass drifted.");
  if (generated.currentPdfPath !== current.pdfPath) errors.push("Generated registry currentPdfPath drifted.");

  for (const release of registry.releases) {
    const route = "/releases/" + release.slug;
    if (!generated.releaseRoutes.includes(route)) errors.push("Generated route missing for " + release.slug);
  }
}

for (const release of registry.releases) {
  const packet = path.join(ROOT, "public", release.pdfPath.replace(/^\//, ""));
  if (!fs.existsSync(packet) || fs.statSync(packet).size === 0) errors.push("Generated PDF missing or empty: " + release.pdfPath);
}

if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  for (const release of registry.releases) {
    const url = "https://anevum.com/releases/" + release.slug;
    if (!sitemap.includes(url)) errors.push("Sitemap missing " + url);
  }
}

const forbiddenValues = new Set();
for (const release of registry.releases) {
  [
    release.version,
    release.codename,
    release.lifecycle,
    release.releaseClass,
    release.sourceCommit,
    release.sourceCommit?.slice(0, 8),
    release.productionDeployment,
    release.shadowDeployment,
    release.preopenDeployment,
    release.activeStrategy,
    release.activeStrategy?.split(" / ")[0],
    release.slug,
    release.pdfPath
  ].filter(Boolean).forEach((value) => forbiddenValues.add(String(value)));
}

const allowPaths = new Set([
  "src/data/releases.json",
  "docs/RHEN_RELEASE_PROGRAM.md"
]);
const generatedPaths = new Set([
  "public/release-registry.json",
  "public/sitemap.xml"
]);
const scanRoots = ["src", "scripts", ".github", "worker.mjs", "index.html", "public"];
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
  if (allowPaths.has(file) || generatedPaths.has(file)) continue;
  if (/\.(png|jpg|jpeg|ico|pdf|map)$/.test(file)) continue;
  const text = fs.readFileSync(path.join(ROOT, file), "utf8");
  for (const value of forbiddenValues) {
    if (text.includes(value)) {
      errors.push("Release identity literal duplicated outside canonical registry: " + value + " in " + file);
    }
  }
}

const liveStateSurfaces = [
  "src/pages/Home.tsx",
  "src/pages/Live.tsx",
  "src/pages/Performance.tsx",
  "src/pages/System.tsx",
  "src/pages/Research.tsx",
  "src/pages/Command.tsx"
];
for (const file of liveStateSurfaces) {
  const source = fs.readFileSync(path.join(ROOT, file), "utf8");
  if (/from\s+["'][^"']*data\/releases["']/.test(source)) {
    errors.push("Live current-state surface must use telemetry, not frozen release snapshots: " + file);
  }
}

if (process.env.GITHUB_EVENT_NAME === "push" && process.env.GITHUB_REF_NAME?.startsWith("rhen-v")) {
  const tagVersion = process.env.GITHUB_REF_NAME.slice("rhen-v".length);
  if (!versions.has(tagVersion)) errors.push("Publication tag has no matching registered release version.");
}

if (process.env.GITHUB_BASE_REF) {
  try {
    const baseRef = "origin/" + process.env.GITHUB_BASE_REF;
    const baseText = execFileSync("git", ["show", baseRef + ":src/data/releases.json"], { cwd: ROOT, encoding: "utf8" });
    const baseRegistry = JSON.parse(baseText);
    const baseReleases = Array.isArray(baseRegistry) ? baseRegistry : baseRegistry.releases;
    const bySlug = new Map(registry.releases.map((release) => [release.slug, release]));

    const normalize = (value) => {
      const copy = structuredClone(value);
      delete copy.status;
      return copy;
    };

    for (const prior of baseReleases || []) {
      const now = bySlug.get(prior.slug);
      if (!now) {
        errors.push("Published release snapshot removed: " + prior.slug);
        continue;
      }
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

console.log(
  "RHEN release registry invariants passed for current pointer " +
  current.version + " " + current.codename + " with " + registry.releases.length + " immutable snapshot(s)."
);

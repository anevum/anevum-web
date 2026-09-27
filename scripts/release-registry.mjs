import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
export const RELEASE_REGISTRY_PATH = path.join(ROOT, "src", "data", "releases.json");

export function loadReleaseRegistry() {
  const registry = JSON.parse(fs.readFileSync(RELEASE_REGISTRY_PATH, "utf8"));
  if (!registry || !Array.isArray(registry.releases) || typeof registry.currentSlug !== "string") {
    throw new Error("Invalid RHEN release registry.");
  }
  return registry;
}

export function currentRelease(registry = loadReleaseRegistry()) {
  const release = registry.releases.find((item) => item.slug === registry.currentSlug);
  if (!release) throw new Error("currentSlug does not resolve to a RHEN release.");
  return release;
}

export function releaseBySlug(slug, registry = loadReleaseRegistry()) {
  const release = registry.releases.find((item) => item.slug === slug);
  if (!release) throw new Error("Unknown RHEN release slug: " + slug);
  return release;
}

export function releaseByVersion(version, registry = loadReleaseRegistry()) {
  const matches = registry.releases.filter((item) => item.version === version);
  if (matches.length !== 1) throw new Error("Expected exactly one RHEN release for version " + version + ".");
  return matches[0];
}

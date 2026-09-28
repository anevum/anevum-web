import fs from "node:fs";
import path from "node:path";
import { currentRelease, loadReleaseRegistry } from "./release-registry.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const registry = loadReleaseRegistry();
const current = currentRelease(registry);

const staticRoutes = ["/", "/live", "/performance", "/system", "/research", "/theory", "/record", "/releases"];
const releaseRoutes = registry.releases.map((release) => "/releases/" + release.slug);
const routes = [...staticRoutes, ...releaseRoutes];

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map((route) => "  <url><loc>https://anevum.com" + (route === "/" ? "/" : route) + "</loc></url>"),
  "</urlset>",
  ""
].join("\n");

fs.mkdirSync(path.join(ROOT, "public"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "public", "sitemap.xml"), sitemap);

const generated = {
  schemaVersion: registry.schemaVersion,
  currentSlug: registry.currentSlug,
  currentVersion: current.version,
  currentCodename: current.codename,
  currentLifecycle: current.lifecycle,
  currentReleaseClass: current.releaseClass,
  currentPdfPath: current.pdfPath,
  releaseRoutes
};

fs.writeFileSync(
  path.join(ROOT, "public", "release-registry.json"),
  JSON.stringify(generated, null, 2) + "\n"
);

console.log("Synchronized RHEN release artifacts for " + current.version + " " + current.codename + ".");

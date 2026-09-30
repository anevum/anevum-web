import fs from "node:fs";
import path from "node:path";
import { currentRelease, loadReleaseRegistry } from "./release-registry.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const registry = loadReleaseRegistry();
const current = currentRelease(registry);

const publicRoutes = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "public-routes.json"), "utf8"));
const dispatchRegistry = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "dispatches.json"), "utf8"));
const staticRoutes = publicRoutes.filter((route) => route.sitemap).map((route) => route.path);
const releaseRoutes = registry.releases.map((release) => "/releases/" + release.slug);
const dispatchRoutes = (dispatchRegistry.entries || []).map((entry) => "/dispatches/" + entry.slug);
const routes = [...staticRoutes, ...releaseRoutes, ...dispatchRoutes];

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
  releaseRoutes,
  dispatchRoutes
};

fs.writeFileSync(
  path.join(ROOT, "public", "release-registry.json"),
  JSON.stringify(generated, null, 2) + "\n"
);

console.log("Synchronized RHEN release artifacts for " + current.version + " " + current.codename + ".");

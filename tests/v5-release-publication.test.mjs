import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import os from "node:os";

const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("canonical release artifacts retain aliases and reject status, sitemap and registry regressions", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "v5-publication-"));
  const put = (file, value) => {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), value);
  };
  const run = script => {
    const env = { ...process.env };
    delete env.GITHUB_BASE_REF;
    delete env.GITHUB_EVENT_NAME;
    delete env.GITHUB_REF_NAME;
    return spawnSync(process.execPath, ["scripts/" + script], { cwd: root, env, encoding: "utf8" });
  };
  try {
    for (const file of ["scripts/validate-release-registry.mjs", "scripts/public-lesson-route-coverage.mjs", "scripts/sync-release-artifacts.mjs", "scripts/release-registry.mjs", "src/data/releases.json", "src/data/public-routes.json", "src/data/rhen-learning.ts"]) put(file, read(file));
    const routes = JSON.parse(read("src/data/public-routes.json"));
    // Match the real app: concrete lessons resolve through one dynamic route.
    const app = routes.filter(route => !route.path.startsWith("/products/rhen/learn/"))
      .map(route => `<Route path="${route.path}" />`).join("\n") + '\n<Route path="/products/rhen/learn/:slug" />';
    put("src/App.tsx", app);
    const currentSurfaces = ["src/commons/CommonsPages.tsx", "src/commons/CommonsV5.tsx", "src/pages/Command.tsx", "src/hooks/useLiveTrading.ts"];
    currentSurfaces.forEach(file => put(file, "export default null;"));
    put("scripts/render-release-packets.py", "# Fixture packet renderer\n");
    const registry = JSON.parse(read("src/data/releases.json"));
    registry.releases.forEach(release => put("public" + release.pdfPath, "%PDF-fixture"));
    const synced = run("sync-release-artifacts.mjs");
    assert.equal(synced.status, 0, synced.stderr);
    // No retired public pages exist in the fixture: the validator must not read them.
    const initial = run("validate-release-registry.mjs");
    assert.equal(initial.status, 0, initial.stderr);
    const generated = JSON.parse(readFileSync(path.join(root, "public/release-registry.json"), "utf8"));
    assert.deepEqual(generated.releaseRoutes, registry.releases.map(release => "/releases/" + release.slug));
    assert.deepEqual(generated.canonicalReleaseRoutes, registry.releases.map(release => "/products/rhen/releases/" + release.slug));
    for (const file of currentSurfaces) {
      put(file, "import { currentRhenRelease } from '../data/releases';");
      const result = run("validate-release-registry.mjs");
      assert.equal(result.status, 1);
      assert.ok(result.stderr.includes("Current-state surface must not use frozen release snapshots: " + file));
      put(file, "export default null;");
    }
    put("src/App.tsx", app.replace('<Route path="/products/rhen/learn/:slug" />', ""));
    const missingRouter = run("validate-release-registry.mjs");
    assert.equal(missingRouter.status, 1);
    assert.match(missingRouter.stderr, /Canonical public route missing from React router: \/products\/rhen\/learn\//);
    put("src/App.tsx", app);
    put("src/data/rhen-learning.ts", "export const rhenLessons = [];\n");
    const missingContent = run("validate-release-registry.mjs");
    assert.equal(missingContent.status, 1);
    assert.match(missingContent.stderr, /Canonical public route missing from React router: \/products\/rhen\/learn\//);
    put("src/data/rhen-learning.ts", read("src/data/rhen-learning.ts"));
    put("public/release-registry.json", JSON.stringify({ ...generated, canonicalReleaseRoutes: [] }));
    assert.match(run("validate-release-registry.mjs").stderr, /Generated canonical route missing/);
    put("public/release-registry.json", JSON.stringify(generated));
    const sitemap = readFileSync(path.join(root, "public/sitemap.xml"), "utf8");
    put("public/sitemap.xml", sitemap.replaceAll("https://anevum.com/products/rhen/releases/", "https://anevum.com/releases/"));
    const result = run("validate-release-registry.mjs");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Sitemap missing https:\/\/anevum.com\/products\/rhen\/releases\//);
    assert.match(result.stderr, /Sitemap contains redirect-only legacy release route/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

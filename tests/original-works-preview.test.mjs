import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const app = read("src/App.tsx");
const studio = read("src/pages/OriginalWorksStudio.tsx");
const atlas = read("src/pages/AtlasExplorer.tsx");
const atlasStyle = read("src/styles/atlas-explorer.css");
const styles = read("src/styles/original-works-preview.css");
const worker = read("worker.mjs");

test("new studio has a distinct, non-indexed review route; public homepage remains unchanged", () => {
  assert.match(app, /<Route path="\/design\/original-works\/\*" element=\{<Suspense fallback=\{<Loader \/>/);
  assert.match(app, /const isOriginalWorksPreview = path === "\/design\/original-works" \|\| path\.startsWith\("\/design\/original-works\/"\)/);
  assert.match(app, /const protectedRoute = isOriginalWorksPreview \|\|/);
  assert.match(app, /setRouteMeta\(path, title, description, !protectedRoute && !missingRoute\)/);
  assert.match(app, /<Route path="\/" element=\{<Suspense fallback=\{<Loader \/>}><CommonsV5 \/><\/Suspense>\} \/>/);
  assert.match(worker, /if \(privateOrArchived \|\| !publicRouteMetadata\(pathname\)/);
  assert.doesNotMatch(worker.slice(worker.indexOf("function publicRouteMetadata"), worker.indexOf("async function withPublicRouteMetadata")), /design\/original-works/);
});

test("existing Command, Studio, RHEN, member and Account routes are not replaced or remapped", () => {
  for (const path of ["/command", "/command/rhen/*", "/me", "/me/settings", "/studio", "/apps/rhen/*", "/products/rhen", "/beta"]) {
    assert.ok(app.includes('<Route path="' + path + '"'), "missing retained route " + path);
  }
  assert.match(app, /<Route path="\/command\/rhen\/\*" element=\{<Suspense fallback=\{<Loader \/>}><RhenTerminal \/><\/Suspense>\} \/>/);
  assert.match(app, /<Route path="\/me\/settings" element=\{<Suspense fallback=\{<Loader \/>}><CommonsV5 content=\{<MemberSettings \/>} \/><\/Suspense>\} \/>/);
});

test("preview offers meaningful internal navigation with accessible structure", () => {
  assert.match(studio, /const ROOT = "\/design\/original-works"/);
  for (const fragment of ['works: ROOT + "/works"', 'reply: ROOT + "/reply"', 'atlas: ROOT + "/atlas"', 'transcosmic: ROOT + "/transcosmic"', 'journal: ROOT + "/journal"', 'about: ROOT + "/about"']) {
    assert.ok(studio.includes(fragment), "missing preview path " + fragment);
  }
  assert.match(studio, /<a className="ow-skip" href="#ow-main">Skip to content<\/a>/);
  assert.match(studio, /<nav aria-label="Studio preview navigation"/);
  assert.match(studio, /aria-current=\{\(page === item\.page \|\| \(page === "atlas-detail" && item\.page === "atlas"\)\) \? "page" : undefined\}/);
  assert.match(studio, /<main id="ow-main" tabIndex=\{-1\}>/);
  assert.match(studio, /data-anevum-original-works-preview="true"/);
});

test("editorial content is truthful and restricted to opening-state canon", () => {
  for (const term of ["REPLY", "The Transcosmic", "Ovara", "Devon Akins", "Author revision in progress", "not a published announcement"]) {
    assert.ok(studio.includes(term), "missing factual or boundary signal: " + term);
  }
  assert.doesNotMatch(studio, /Talin Vel|Chapter 43|Part IV|REPLY \+90d|purchase now|buy now|on sale now|preorder now|Nov(?:ember)? 17/ig);
  assert.doesNotMatch(studio, /api\/command|api\/member|notion\.so|app\.notion\.com|DATABASE_URL|broker_secret|alpaca_secret|window\.fetch|fetch\(/ig);
  assert.match(studio, /does not fetch/);
  assert.match(atlas, /curated reader preview, not an unrestricted mirror/);
});

test("new visual presentation is scoped, mobile responsive and respects reduced motion", () => {
  assert.match(styles, /(?:^|\n)\.ow-site\s*\{/);
  assert.match(styles, /@media\(max-width:620px\)/);
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(styles, /@media\(forced-colors:active\)/);
  assert.match(styles, /\.ow-skip:focus/);
  assert.doesNotMatch(styles, /(^|\n)(html|body|:root|a|button)\s*\{/m);
  assert.match(studio, /not a literal Skygate or cover/);
});


test("Atlas is a curated, locally searchable directory with closed unknown states", () => {
  assert.match(studio, /<AtlasExplorer \/>/);
  assert.match(studio, /page === "atlas-detail"/);
  for (const term of ["Ovara", "Nali Solan", "Neral", "Veyra", "Merva", "Serein Skygate", "Neral Skygate", "Open Road"]) assert.ok(atlas.includes(term));
  assert.match(atlas, /useMemo\(/);
  assert.match(atlas, /type="search"/);
  assert.match(atlas, /role="status" aria-live="polite"/);
  assert.match(atlas, /aria-pressed=\{category === option\}/);
  assert.match(atlas, /No matching records\./);
  assert.match(atlas, /Record unavailable\./);
  assert.match(atlas, /type Category = "All" \| "World" \| "Person" \| "Place" \| "Infrastructure"/);
  for (const category of ["Place", "Infrastructure"]) assert.ok(atlas.includes(`category: "${category}"`));
  assert.match(atlas, /Never fetch private wiki records/);
  assert.doesNotMatch(atlas, /fetch\(|app\.notion\.com|api\/command|api\/member|Talin Vel|Chapter 43|Part IV|REPLY \+90d/);
  assert.match(atlasStyle, /@media\(max-width:620px\)/);
  assert.match(atlasStyle, /\.ow-atlas-search input:focus-visible/);
  assert.match(atlasStyle, /@media\(prefers-reduced-motion:reduce\)/);
});


test("Atlas network view links only explicitly cleared opening-state relationships", () => {
  assert.match(atlas, /function NetworkOverview\(\)/);
  assert.match(atlas, /<NetworkOverview \/>/);
  assert.match(atlas, /Opening-state orientation/);
  assert.match(atlas, /Ovara \/ Independent context/);
  assert.match(atlas, /Veyra – Neral \/ Mature network/);
  assert.match(atlas, /Established Road connection/);
  assert.match(atlas, /Ovara is not part of the Veyra–Neral Road connection/);
  assert.match(atlas, /Related records/);
  assert.match(atlas, /relationships\[record\.slug\]\.map/);
  assert.match(atlas, /to=\{ATLAS \+ "\/" \+ related\.slug\}/);
  const block = atlas.split("const relationships = {")[1]?.split("} as const;")[0];
  assert.ok(block, "explicit relationship allowlist missing");
  const links = [...block.matchAll(/^\s*"?([a-z-]+)"?:\s*\[\s*\{\s*slug:\s*"([a-z-]+)"/gm)];
  assert.deepEqual(links.map(match => [match[1], match[2]]), [
    ["ovara", "nali-solan"],
    ["nali-solan", "ovara"],
    ["neral", "veyra"],
    ["veyra", "neral"],
    ["merva", "ovara"],
    ["serein-skygate", "veyra"],
    ["neral-skygate", "neral"],
    ["open-road", "serein-skygate"]
  ], "curated edges must not imply Ovara has a Road connection");
  const ovaraLinks = block.split("  ovara: [")[1]?.split("  ],")[0] || "";
  const mervaLinks = block.split("  merva: [")[1]?.split("  ],")[0] || "";
  assert.doesNotMatch(ovaraLinks + mervaLinks, /slug: "(?:veyra|neral|open-road|serein-skygate|neral-skygate)"/);
  assert.match(block, /"serein-skygate":\s*\[[\s\S]*?slug: "neral-skygate"/);
  assert.match(block, /"neral-skygate":\s*\[[\s\S]*?slug: "serein-skygate"/);
  assert.match(atlasStyle, /\.ow-atlas-relations-grid/);
  assert.match(atlasStyle, /\.ow-atlas-related-link:focus-visible/);
  assert.match(atlasStyle, /@media\(max-width:340px\)/);
});


test("Eight review records are explicitly curated and later book content remains gated", () => {
  const names = ["ovara", "nali-solan", "neral", "veyra", "merva", "serein-skygate", "neral-skygate", "open-road"];
  const slugs = [...atlas.matchAll(/id: "\d\d", slug: "([a-z-]+)"/g)].map(match => match[1]);
  assert.deepEqual(slugs, names, "reader preview should not silently add or remove records");
  for (const name of names) assert.match(atlas, new RegExp("slug: \\"" + name + "\\""));
  assert.doesNotMatch(atlas, /(?:Kerin Solan|Ovaran Contact Forum|first physical visitor|Chapter 43|Part IV)/);
  assert.match(atlas, /Never fetch private wiki records/);
  assert.match(atlas, /no public-reader record exists|No public-reader record exists/);
});

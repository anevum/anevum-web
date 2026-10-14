import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { Script } from "node:vm";

const read = path => readFileSync(new URL("../web/public/portfolio/" + path, import.meta.url), "utf8");
const html = read("index.html");
const css = read("styles.css");
const js = read("app.js");

test("portfolio introduces the actual person and independently developed work", () => {
  assert.match(html, /I build what <em>I wish existed/);
  for (const phrase of ["A dad.", "A writer.", "A builder.", "ANEVUM", "The Fold", "RHEN", "Transcosmic"]) {
    assert.ok(html.includes(phrase), phrase);
  }
  assert.match(html, /Independent projects, not invented client commissions/);
  assert.match(html, /devon@anevum.com/);
  assert.match(html, /https:\/\/anevum.com\/portfolio\//);
});

test("remove the irrelevant WebGL sculpture and material playground entirely", () => {
  assert.doesNotMatch(html, /<canvas\b|id="play-scene"|id="sculpture"|data-material=/i);
  assert.doesNotMatch(js, /createShader|vertexShader|fragmentShader|getContext\(['"]webgl|new Sculpture|setMaterial/);
  assert.doesNotMatch(css, /\.orbital-fallback\{|\.playground\{/);
});

test("selectable feature previews use local, real development images with accurate context", () => {
  for (const key of ["anevum", "fold", "rhen"]) {
    assert.match(html, new RegExp('data-feature="' + key + '"'));
    assert.match(js, new RegExp('\\b' + key + ': \\{'));
  }
  for (const asset of ["anevum-interface.webp", "fold-interface.webp", "rhen-interface.webp"]) {
    assert.ok(existsSync(new URL("../web/public/portfolio/assets/" + asset, import.meta.url)), asset);
    assert.ok(js.includes(asset), asset);
  }
  assert.match(js, /function showFeature\(key\)/);
  assert.match(js, /button\.setAttribute\('aria-pressed', String\(selected\)\)/);
  assert.match(js, /openProject\(currentFeature, trigger\)/);
  assert.match(html, /Each project story explains what is working, private or still a prototype/);
  assert.match(html, /id="feature-open"/);
});

test("responsive design retains touch targets, keyboard focus and motion controls", () => {
  for (const needle of ["max-width:920px", "max-width:580px", "max-width:350px", "prefers-reduced-motion:reduce", "focus-visible", "min-height:44px"]) {
    assert.ok(css.includes(needle), needle);
  }
  assert.match(html, /id="motion-toggle"/);
  assert.match(html, /id="project-dialog"/);
  assert.match(html, /id="brief-form"/);
  assert.match(js, /motionPreference\.matches/);
  assert.match(js, /dialog\.showModal\(\)/);
  assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|localStorage|sendBeacon/);
});

test("portfolio script parses and stays self-contained", () => {
  assert.doesNotThrow(() => new Script(js, { filename: "portfolio/app.js" }));
  assert.match(html, /src="\/portfolio\/app\.js"/);
  assert.match(html, /href="\/portfolio\/styles\.css"/);
  assert.doesNotMatch(html, /https:\/\/portfolio\.anevum\.com|(?:src|href)="\/assets\//);
});

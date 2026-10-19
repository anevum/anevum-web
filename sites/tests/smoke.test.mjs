import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker.mjs";

const base = "https://web.anevum.com";
const env = {
  SITES_DB: {
    prepare(sql) {
      assert.match(sql, /SELECT/);
      return {
        bind(slug) {
          return {
            async first() {
              if (slug !== "tobacco-vapor-time") return null;
              return { slug, title: "Tobacco Vapor Time", kind: "retail", status: "concept", payload: JSON.stringify({ headline: "A local example" }) };
            }
          };
        }
      };
    }
  }
};
const get = (path, options={}) => worker.fetch(new Request(base + path, options), env);

test("public studio is readable, complete, and strictly unindexed during pilot", async () => {
  const response = await get("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
  const html = await response.text();
  for (const label of ["ANEVUM / SITES", "$49", "$99", "$199", "mailto:devon@anevum.com", 'id="packages"', 'id="process"']) {
    assert.ok(html.includes(label), "Expected " + label);
  }
});

test("curated concept is visually available, unofficial, and age-aware", async () => {
  const response = await get("/preview/tobacco-vapor-time");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /UNCOMMISSIONED DESIGN CONCEPT/);
  assert.match(html, /NOT THE OFFICIAL BUSINESS WEBSITE/);
  assert.match(html, /Not affiliated with or endorsed/);
  assert.match(html, /Contact the store|confirm current hours/i);
  assert.match(html, /Adults 21\+ only/);
});

test("site assets use correct types, responsive breakpoints and reduced-motion", async () => {
  const css = await get("/assets/sites.css");
  assert.match(css.headers.get("content-type"), /text\/css/);
  const sheet = await css.text();
  assert.match(sheet, /@media\(max-width:620px\)/);
  assert.match(sheet, /prefers-reduced-motion/);
  const js = await get("/assets/sites.js");
  assert.match(js.headers.get("content-type"), /javascript/);
});

test("health report contains no private data", async () => {
  const response = await get("/health");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, version: "sites-v001-20261019", stage: "review" });
});

test("unknown paths, incorrect methods and unrelated hosts fail closed", async () => {
  assert.equal((await get("/absent")).status, 404);
  assert.equal((await get("/api/customer-details")).status, 404);
  assert.equal((await get("/", {method:"POST"})).status, 405);
  assert.equal((await worker.fetch(new Request("https://anevum.com/"))).status, 421);
  assert.equal((await worker.fetch(new Request("https://lab.anevum.com/"))).status, 421);
});

test("HEAD and CSP prohibit unintended content", async () => {
  const response = await get("/", {method:"HEAD"});
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  assert.match(response.headers.get("content-security-policy"), /form-action 'none'/);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

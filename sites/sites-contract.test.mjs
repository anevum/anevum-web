import test from "node:test";
import assert from "node:assert/strict";
import publicWorker from "./worker.mjs";
import privateWorker from "./workshop.mjs";

const makeRequest = (path, method = "GET", host = "web.anevum.com") =>
  new Request("https://" + host + path, { method });

function fakeDb(site) {
  return {
    prepare(sql) {
      assert.match(sql, /SELECT/);
      return {
        bind(slug) {
          return {
            async first() {
              if (slug !== site.slug) return null;
              return { ...site };
            }
          };
        }
      };
    }
  };
}

function siteRecord(status = "pitched") {
  return {
    slug: "example-cafe",
    title: '<script>alert("unsafe")</script> Example Café',
    kind: "food",
    status,
    payload: JSON.stringify({
      name: "Example Café",
      eyebrow: "LOCAL / FLORIDA",
      headline: "<img src=x onerror=alert(1)> Great coffee locally.",
      description: "Locally served & made.",
      about: "A community café.",
      address: "123 Example St, Florida",
      phone: "(407) 555-0145",
      hours: "Weekdays 7AM – 4PM",
      email: "hello@example.com",
      notes: "PRIVATE_NOTE_SENTINEL_DO_NOT_PUBLISH",
      package: "199"
    })
  };
}

test("public studio landing, package pricing, and security headers", async () => {
  const response = await publicWorker.fetch(makeRequest("/"), {});
  assert.equal(response.status, 200);
  const text = await response.text();
  for (const label of ["ANEVUM", "$49", "$99", "$199", "No mandatory subscription"])
    assert.ok(text.includes(label), "missing " + label);
  assert.match(response.headers.get("Content-Security-Policy"), /default-src 'none'/);
  assert.match(response.headers.get("X-Content-Type-Options"), /nosniff/);
  assert.match(text, /name="consent"/);
});

test("dynamic preview escapes all untrusted strings and never shows private notes", async () => {
  const site = siteRecord();
  const response = await publicWorker.fetch(
    makeRequest("/preview/example-cafe"),
    { SITES_DB: fakeDb(site) }
  );
  assert.equal(response.status, 200);
  const text = await response.text();
  assert.match(text, /&lt;script&gt;alert/);
  assert.match(text, /&lt;img src=x onerror=alert/);
  assert.ok(!text.includes("<script>alert"), "unescaped script found");
  assert.ok(!text.includes("PRIVATE_NOTE_SENTINEL"), "private notes leaked");
  assert.ok(!text.includes('"package":"199"'), "private quote leaked");
  assert.match(text, /UNOFFICIAL|INDEPENDENT DESIGN CONCEPT/);
});

test("archived previews return 404 and previews require the correct database", async () => {
  const archived = await publicWorker.fetch(
    makeRequest("/preview/example-cafe"),
    { SITES_DB: fakeDb(siteRecord("archived")) }
  );
  assert.equal(archived.status, 404);
  const missing = await publicWorker.fetch(makeRequest("/preview/example-cafe"), {});
  assert.equal(missing.status, 503);
});

test("the curated showcase can be archived; draft renders editable content", async () => {
  const original = { ...siteRecord("concept"), slug: "tobacco-vapor-time" };
  const archived = await publicWorker.fetch(
    makeRequest("/preview/tobacco-vapor-time"),
    { SITES_DB: fakeDb({ ...original, status: "archived" }) }
  );
  assert.equal(archived.status, 404);
  const draft = await publicWorker.fetch(
    makeRequest("/preview/tobacco-vapor-time?draft=1"),
    { SITES_DB: fakeDb(original) }
  );
  assert.equal(draft.status, 200);
  assert.match(await draft.text(), /Example Café/);
});

test("non-public methods and unrelated hosts fail closed", async () => {
  const badHost = await publicWorker.fetch(makeRequest("/", "GET", "anevum.com"), {});
  assert.equal(badHost.status, 421);
  const post = await publicWorker.fetch(makeRequest("/", "POST"), {});
  assert.equal(post.status, 405);
  const head = await publicWorker.fetch(makeRequest("/", "HEAD"), {});
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "", "HEAD response must not have a body");
});

test("protected workbench rejects unauthenticated requests and workers.dev", async () => {
  const denied = await privateWorker.fetch(makeRequest("/", "GET", "sites.anevum.com"), {});
  assert.equal(denied.status, 401);
  assert.match(await denied.text(), /Owner access required/);
  const deniedHost = await privateWorker.fetch(makeRequest("/", "GET", "example.workers.dev"), {});
  assert.equal(deniedHost.status, 421);
});

test("site assets and health endpoints remain strictly read-only", async () => {
  for (const endpoint of ["/assets/sites.css", "/assets/sites.js", "/health"]) {
    const response = await publicWorker.fetch(makeRequest(endpoint), {});
    assert.equal(response.status, 200, endpoint);
  }
  const forbidden = await publicWorker.fetch(makeRequest("/preview/example-cafe", "POST"), {});
  assert.equal(forbidden.status, 405);
});

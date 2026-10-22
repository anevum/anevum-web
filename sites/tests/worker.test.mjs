import test from "node:test";
import assert from "node:assert/strict";
import studio from "../worker.mjs";
import workshop from "../workshop.mjs";

const HOST_PUBLIC = "https://web.anevum.com";
const HOST_PRIVATE = "https://sites.anevum.com";
const TEAM = "https://wispy-tooth-095a.cloudflareaccess.com";
const AUD = "49d01711c88699db02ba1bc203588dc4b43d4d262b84b964dcf2230b60f7161c";

function fakeDb() {
  const data = new Map();
  const revisions = [];
  const upsert = row => data.set(row.id, { ...row });
  upsert({
    id: "tvt-st-cloud", slug: "tobacco-vapor-time",
    title: "Tobacco Vapor Time", kind: "retail", status: "concept",
    payload: JSON.stringify({ name: "Tobacco Vapor Time", phone: "407-593-6515", notes: "PRIVATE_ONLY" }),
    created_at: "2026-10-19", updated_at: "2026-10-19"
  });
  upsert({
    id: "synthetic-id", slug: "synthetic-business",
    title: "<script>Untrusted</script>", kind: "local", status: "pitched",
    payload: JSON.stringify({ headline: "<img src=x onerror=alert(1)>", description: "A safe test.", address: "Example & Main", notes: "DO_NOT_SHOW_NOTES" }),
    created_at: "2026-10-19", updated_at: "2026-10-19"
  });
  upsert({
    id: "archived-id", slug: "archived-business",
    title: "Archived", kind: "local", status: "archived", payload: "{}",
    created_at: "2026-10-19", updated_at: "2026-10-19"
  });
  return {
    revisions, data,
    prepare(sql) {
      const stmt = {
        args: [],
        bind(...args) { this.args = args; return this; },
        async first() {
          if (sql.includes("WHERE slug")) return [...data.values()].find(row => row.slug === this.args[0]) || null;
          if (sql.includes("WHERE id")) return data.get(this.args[0]) || null;
          return null;
        },
        async all() { return { results: [...data.values()] }; },
        async run() {
          const args = this.args;
          if (sql.startsWith("INSERT INTO site_revisions")) {
            revisions.push({ id: args[0], before: args[1] }); return { success: true };
          }
          if (sql.startsWith("INSERT INTO sites")) {
            const [id, slug, title, kind, status, payload] = args;
            if ([...data.values()].some(x => x.slug === slug)) throw new Error("UNIQUE constraint failed: sites.slug");
            upsert({ id, slug, title, kind, status, payload, updated_at: "2026-10-19" });
            return { success: true };
          }
          if (sql.startsWith("UPDATE sites")) {
            const [title, kind, status, payload, id] = args;
            upsert({ ...data.get(id), title, kind, status, payload });
            return { success: true };
          }
          throw Error("Unexpected SQL: " + sql);
        }
      };
      return stmt;
    }
  };
}

test("public studio, curated sample and valid health return successfully", async () => {
  const env = { SITES_DB: fakeDb() };
  for (const url of ["/", "/health", "/privacy", "/thanks", "/assets/sites.css", "/assets/sites-v005.css", "/assets/sites-v005.js", "/assets/sites-v005-immersive.js", "/site.webmanifest", "/sw.js"]) {
    const r = await studio.fetch(new Request(HOST_PUBLIC + url), env);
    assert.equal(r.status, 200, url);
    assert.match(r.headers.get("X-Content-Type-Options"), /nosniff/);
  }
  const landing = await (await studio.fetch(new Request(HOST_PUBLIC), env)).text();
  assert.match(landing, /ANEVUM/);
  assert.match(landing, /ANEVUM.*?SITES/s);
  assert.match(landing, /\$49/);
  assert.match(landing, /THE INTERNET/);
  assert.match(landing, /uncommissioned, independent informational concept/i);
  assert.match(landing, /id="site-inquiry"/);
  assert.match(landing, /action="\/api\/inquiries"/);
  assert.match(landing, /name="consent"/);
  assert.match(landing, /<meta name="robots" content="index,follow">/);
  assert.match(landing, /sites-v005-immersive.js/);
  assert.match(landing, /id="experience-react-root"/);
  const sample = await studio.fetch(new Request(HOST_PUBLIC + "/preview/tobacco-vapor-time"), env);
  assert.equal(sample.status, 302);
  assert.equal(sample.headers.get("Location"), "https://preview.anevum.com/tobacco-vapor-time/");
});

test("public preview never leaks notes or renders user-supplied markup", async () => {
  const env = { SITES_DB: fakeDb() };
  const r = await studio.fetch(new Request(HOST_PUBLIC + "/preview/synthetic-business"), env);
  assert.equal(r.status, 200);
  const text = await r.text();
  assert.doesNotMatch(text, /DO_NOT_SHOW_NOTES/);
  assert.doesNotMatch(text, /<script>Untrusted<\/script>/);
  assert.doesNotMatch(text, /<img src=x onerror=alert\(1\)>/);
  assert.match(text, /&lt;script&gt;Untrusted&lt;\/script&gt;/);
  assert.match(text, /NOT AN OFFICIAL BUSINESS WEBSITE/);
});

test("archived and missing sites stay unavailable", async () => {
  const env = { SITES_DB: fakeDb() };
  for (const path of ["/preview/archived-business", "/preview/missing", "/does-not-exist"]) {
    const r = await studio.fetch(new Request(HOST_PUBLIC + path), env);
    assert.equal(r.status, 404, path);
  }
  env.SITES_DB.data.get("tvt-st-cloud").status = "archived";
  const r = await studio.fetch(new Request(HOST_PUBLIC + "/preview/tobacco-vapor-time"), env);
  assert.equal(r.status, 404);
});

test("public worker rejects mismatched host and unsafe method", async () => {
  const env = { SITES_DB: fakeDb() };
  assert.equal((await studio.fetch(new Request("https://unrelated.example.com/"), env)).status, 421);
  assert.equal((await studio.fetch(new Request(HOST_PUBLIC, { method: "POST" }), env)).status, 405);
  const head = await studio.fetch(new Request(HOST_PUBLIC, { method: "HEAD" }), env);
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
});

test("private workbench refuses unauthorized and mismatched hosts", async () => {
  assert.equal((await workshop.fetch(new Request(HOST_PRIVATE))).status, 401);
  for (const path of ["/concepts", "/concepts/auto-detail", "/concepts/pet-grooming", "/concepts/home-services", "/assets/local-concepts.js"]) {
    assert.equal((await workshop.fetch(new Request(HOST_PRIVATE + path))).status, 401, path);
    assert.equal((await studio.fetch(new Request(HOST_PUBLIC + path), { SITES_DB: fakeDb() })).status, 404, path);
  }
  assert.equal((await workshop.fetch(new Request("https://web.anevum.com/"))).status, 421);
});

test("private workbench validates real RS256-style JWT, scopes origin, and records revisions", async () => {
  const db = fakeDb();
  const pair = await crypto.subtle.generateKey({
    name: "RSASSA-PKCS1-v1_5", modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256"
  }, true, ["sign", "verify"]);
  const pub = await crypto.subtle.exportKey("jwk", pair.publicKey);
  pub.kid = "local-unit-test-key";
  const actualFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    assert.equal(String(url), TEAM + "/cdn-cgi/access/certs");
    return new Response(JSON.stringify({ keys: [pub] }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const issue = async overrides => {
    const now = Math.floor(Date.now() / 1000);
    const header = encode({ alg: "RS256", kid: pub.kid });
    const payload = encode({ iss: TEAM, aud: [AUD], email: "devon@anevum.com", iat: now - 50, exp: now + 1800, ...overrides });
    const bytes = new TextEncoder().encode(header + "." + payload);
    const signature = Buffer.from(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, bytes)).toString("base64url");
    return header + "." + payload + "." + signature;
  };
  try {
    const jwt = await issue({});
    const headers = {
      "Cf-Access-Jwt-Assertion": jwt, Origin: HOST_PRIVATE,
      "Sec-Fetch-Site": "same-origin", "Content-Type": "application/json"
    };
    const page = await workshop.fetch(new Request(HOST_PRIVATE, { headers }), { SITES_DB: db });
    assert.equal(page.status, 200);
    const privatePreview = await workshop.fetch(new Request(HOST_PRIVATE + "/preview/smokebreak-st-cloud", { headers }), { SITES_DB: db });
    assert.equal(privatePreview.status, 200);
    assert.match(privatePreview.headers.get("X-Robots-Tag"), /noindex/);
    const privateMarkup = await privatePreview.text();
    assert.match(privateMarkup, /PRIVATE ANEVUM DESIGN REVIEW/);
    assert.match(privateMarkup, /3316 Canoe Creek Road/);
    assert.match(privateMarkup, /NOT AN OFFICIAL SHOP WEBSITE/);
    assert.doesNotMatch(privateMarkup, /buy now|checkout|product catalogue/i);
    const index = await workshop.fetch(new Request(HOST_PRIVATE + "/concepts", { headers }), { SITES_DB: db });
    assert.equal(index.status, 200);
    assert.match(index.headers.get("X-Robots-Tag"), /noindex/);
    const indexHtml = await index.text();
    assert.match(indexHtml, /Three industries/);
    for (const slug of ["auto-detail", "pet-grooming", "home-services"]) {
      const preview = await workshop.fetch(new Request(HOST_PRIVATE + "/concepts/" + slug, { headers }), { SITES_DB: db });
      assert.equal(preview.status, 200, slug);
      assert.match(preview.headers.get("X-Robots-Tag"), /noindex/);
      assert.match(preview.headers.get("Content-Security-Policy"), /script-src 'self'/);
      const markup = await preview.text();
      assert.match(markup, /PRIVATE DESIGN STUDY/);
      assert.match(markup, /NOT COMMISSIONED/);
      assert.match(markup, /NO REAL CONTACT, BOOKING OR TRANSACTION/);
      assert.doesNotMatch(markup, /<form\b|checkout|tel:|mailto:/i);
    }
    assert.equal((await workshop.fetch(new Request(HOST_PRIVATE + "/concepts/nonexistent", { headers }), { SITES_DB: db })).status, 404);
    const conceptAsset = await workshop.fetch(new Request(HOST_PRIVATE + "/assets/local-concepts.js", { headers }), { SITES_DB: db });
    assert.equal(conceptAsset.status, 200);
    assert.match(await conceptAsset.text(), /data-choice/);
    assert.match((await page.text()), /Local study library/);

    const previewHead = await workshop.fetch(new Request(HOST_PRIVATE + "/preview/smokebreak-st-cloud", { method: "HEAD", headers }), { SITES_DB: db });
    assert.equal(previewHead.status, 200);
    assert.equal(await previewHead.text(), "");
    const list = await workshop.fetch(new Request(HOST_PRIVATE + "/api/sites", { headers }), { SITES_DB: db });
    assert.equal(list.status, 200);
    assert.equal((await list.json()).sites.length, 3);
    const altered = await issue({ email: "other@example.com" });
    const notOwner = await workshop.fetch(new Request(HOST_PRIVATE, { headers: { ...headers, "Cf-Access-Jwt-Assertion": altered } }), { SITES_DB: db });
    assert.equal(notOwner.status, 401);
    const body = {
      name: "Tobacco Vapor Time", slug: "tobacco-vapor-time", kind: "retail",
      status: "pitched", eyebrow: "LOCAL / 01", headline: "New headline", description: "New description", about: "About", phone: "407-593-6515", email: "", address: "Example Rd", hours: "Contact first", notes: "OWNER ONLY NOTES", package: "49"
    };
    const denied = await workshop.fetch(new Request(HOST_PRIVATE + "/api/sites/tvt-st-cloud", {
      method: "PUT", headers: { ...headers, Origin: "https://evil.example.com" }, body: JSON.stringify(body)
    }), { SITES_DB: db });
    assert.equal(denied.status, 403);
    const updated = await workshop.fetch(new Request(HOST_PRIVATE + "/api/sites/tvt-st-cloud", {
      method: "PUT", headers, body: JSON.stringify(body)
    }), { SITES_DB: db });
    assert.equal(updated.status, 200, await updated.text().catch(() => ""));
    assert.equal(db.data.get("tvt-st-cloud").status, "pitched");
    assert.equal(db.revisions.length, 1);
    const finalPreview = await studio.fetch(new Request(HOST_PUBLIC + "/preview/tobacco-vapor-time?draft=1"), { SITES_DB: db });
    assert.equal(finalPreview.status, 200);
    assert.match(await finalPreview.text(), /New headline/);
  } finally {
    globalThis.fetch = actualFetch;
  }
});


test("Smokebreak staging stays private and never appears on public Worker", async () => {
  const db = fakeDb();
  db.data.set("unofficial-smokebreak", { id:"unofficial-smokebreak",slug:"smokebreak-st-cloud",title:"Smokebreak St Cloud",kind:"retail",status:"concept",payload:JSON.stringify({headline:"Private draft",notes:"PRIVATE_REFERRAL_DETAILS"})});
  const publicPreview = await studio.fetch(new Request(HOST_PUBLIC + "/preview/smokebreak-st-cloud"), { SITES_DB: db });
  assert.equal(publicPreview.status, 404);
  assert.doesNotMatch(await publicPreview.text(), /PRIVATE_REFERRAL_DETAILS/);
  const guestPreview = await workshop.fetch(new Request(HOST_PRIVATE + "/preview/smokebreak-st-cloud"), { SITES_DB: db });
  assert.equal(guestPreview.status, 401);
  assert.doesNotMatch(await guestPreview.text(), /3316 Canoe Creek/);
});

test("V005.1 styling, shader and inquiry boundaries honor accessibility and privacy", async () => {
  const env={SITES_DB:fakeDb()};
  const response=await studio.fetch(new Request(HOST_PUBLIC+"/assets/sites-v005.css"),env);
  assert.equal(response.status,200);
  const css=await response.text();
  assert.match(css,/Full-bleed Continuance Vault/);
  assert.match(css,/cinematic-fallback/);
  assert.match(css,/prefers-reduced-motion/);
  const script=await (await studio.fetch(new Request(HOST_PUBLIC+"/assets/sites-v005.js"),env)).text();
  assert.match(script,/new URLSearchParams/);
  assert.doesNotMatch(script,/localStorage|sessionStorage/);
  const immersive=await (await studio.fetch(new Request(HOST_PUBLIC+"/assets/sites-v005-immersive.js"),env)).text();
  assert.match(immersive,/getContext\('webgl2'/);
  assert.match(immersive,/ambientOcclusion|softShadow/);
  const home=await (await studio.fetch(new Request(HOST_PUBLIC),env)).text();
  assert.match(home,/name="consent"/);
  assert.match(home,/<form[^>]+action="\/api\/inquiries"/);
  assert.match(home,/No mandatory subscription/);
  const privateRoute=await studio.fetch(new Request(HOST_PUBLIC+"/preview/smokebreak-st-cloud"),env);
  assert.equal(privateRoute.status,404);
});

test("public inquiry endpoint is consent-gated, form encoded and same-origin", async () => {
  const origin=HOST_PUBLIC;
  const request=(headers,body)=>new Request(origin+"/api/inquiries",{
    method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",...headers},
    body:new URLSearchParams(body)
  });
  const valid={name:"Prospect",business:"Sample Shop",email:"contact@example.com",goal:"We need a clear phone-first business website.",package:"undecided",consent:"yes"};
  const cross=await studio.fetch(request({Origin:"https://evil.example.com"},valid),{SITES_DB:fakeDb()});
  assert.equal(cross.status,403);
  const noConsent=await studio.fetch(request({Origin:origin},{...valid,consent:"no"}),{SITES_DB:fakeDb()});
  assert.equal(noConsent.status,400);
  const noDatabase=await studio.fetch(request({Origin:origin},valid),{});
  assert.equal(noDatabase.status,503);
});

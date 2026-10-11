import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const source = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const app = source("src/App.tsx");
const commons = source("src/commons/CommonsV5.tsx");
const pages = source("src/commons/CommonsPages.tsx");

test("Stage 2 public routes reuse the V5 shell rather than reentering the legacy studio shell", () => {
  for (const path of ["/products", "/feed", "/field-notes", "/field-notes/:slug", "/about", "/products/rhen", "/products/rhen/evidence", "/products/rhen/architecture", "/products/rhen/releases", "/products/rhen/releases/:slug", "/communities", "/learn", "/privacy", "/terms", "/sign-in", "/resume"]) {
    assert.ok(app.includes('<Route path="' + path + '" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />'), "not using public Commons shell: " + path);
  }
  assert.match(commons, /<CommonsPublicPage pathname=\{pathname\}\s*\/>/);
  assert.match(commons, /pagesCss/);
});

test("Private owner and member routes retain existing separate routing and permissions", () => {
  assert.match(app, /<Route path="\/apps\/rhen\/\*" element=\{<Suspense fallback=\{<Loader \/>\}><CommonsV5 content=\{<RhenApp \/>\} \/><\/Suspense>\} \/>/);
  assert.match(app, /<Route path="\/command\/rhen\/\*" element=\{<Suspense fallback=\{<Loader \/>\}><RhenTerminal \/><\/Suspense>\} \/>/);
  assert.match(app, /<Route path="\/me\/settings" element=\{<Suspense fallback=\{<Loader \/>\}><CommonsV5 content=\{<MemberSettings \/>\} \/><\/Suspense>\} \/>/);
  assert.doesNotMatch(pages, /\/api\/command\/|\/api\/member\/rhen\/workspace|broker_secret|alpaca_secret/);
});

test("V5 public content is real source-backed data with no fake member feeds", () => {
  assert.match(pages, /import \{ fieldNotes, type FieldNote \} from "\.\.\/data\/fieldNotes"/);
  assert.match(pages, /import \{ publicProducts, publishedSourceRecords \} from "\.\.\/data\/products"/);
  assert.match(pages, /import \{ rhenReleases, rhenReleaseBySlug \} from "\.\.\/data\/releases"/);
  assert.match(pages, /Legacy live trading is suspended/);
  assert.match(pages, /No fictional communities/);
  assert.match(pages, /Historical publication/);
  assert.match(pages, /SUSPENDED_FOR_REBUILD/);
  assert.match(pages, /data-evidence-state="SUSPENDED_FOR_REBUILD"/);
  assert.doesNotMatch(pages, /useLiveTrading|account_return_pct|broker_secret/);
  assert.doesNotMatch(pages, /Math\.random|setInterval|simulatedResults|fakeUsers/);
});

test("public RHEN product registry reflects suspended runtime and V5 redevelopment", () => {
  const registry = source("src/data/products.ts");
  assert.match(registry, /lifecycle: "development"/);
  assert.match(registry, /separately gated execution/);
});

test("pre-Vite client and duplicate static build helpers are retired, archive retained", () => {
  for (const oldPath of ["site/index.html", "site/app.js", "site/styles.css",
    "site/_headers", "site/robots.txt", "site/sitemap.xml",
    "scripts/build.mjs", "scripts/serve.mjs"]) {
    assert.equal(existsSync(new URL("../" + oldPath, import.meta.url)), false, "obsolete static path remains: " + oldPath);
  }
  assert.equal(existsSync(new URL("../site/wiki/archive/transcosmic/README.md", import.meta.url)), true);
});

test("browser QA validates the actual V5 ShadowRoot public routes without legacy studio selectors", () => {
  const qa = source("scripts/visual-ops-browser-qa.mjs");
  assert.match(qa, /c2-project/);
  assert.match(qa, /Architecture and authority/);
  assert.match(qa, /No fictional communities/);
  assert.match(qa, /shadowRoot/);
  assert.doesNotMatch(qa, /document\.querySelector\("\.truth-products-page"\)/);
  assert.doesNotMatch(qa, /document\.querySelector\("\.studio-notes-page"\)/);
});

test("member/account screens reuse V5 presentation without moving owner/private RHEN APIs", () => {
  const app = source("src/App.tsx");
  const wrapper = source("src/commons/CommonsV5.tsx");
  for (const path of ["/command", "/me", "/me/settings", "/me/rewards"]) {
    assert.match(app, new RegExp('<Route path="' + path.replaceAll("/", "\\/") + '" element=\\{<Suspense fallback='));
  }
  assert.match(wrapper, /content\?:ReactNode/);
  assert.match(wrapper, /accountCss/);
  assert.match(wrapper, /Private member account presentation/);
  assert.doesNotMatch(wrapper, /fetch\("\/api\/member|fetch\("\/api\/command\/session"/);
  assert.match(app, /<Route path="\/command\/rhen\/\*" element=\{<Suspense fallback=\{<Loader \/>/);
  assert.match(app, /<Route path="\/apps\/rhen\/\*" element=\{<Suspense fallback=\{<Loader \/>/);
});


test("private RHEN uses scoped draft styles, historical evidence and member-keyed state", () => {
  const ui = source("src/pages/RhenApp.tsx");
  assert.match(commons, /member-rhen-draft\.css\?inline/);
  assert.match(commons, /commons-v5-private-rhen\.css\?inline/);
  assert.match(ui, /RhenMemberWorkspace key=\{session\.user\.id\}/);
  assert.match(ui, /data-evidence-state="SUSPENDED_FOR_REBUILD"/);
  assert.doesNotMatch(ui, /PublicEvidenceSnapshot|useLiveTrading|<main/);
  assert.match(ui, /value\.paperTradingEnabled !== false/);
  assert.match(ui, /value\.liveTradingEnabled !== false/);
  assert.match(ui, /value\.account\?\.environment !== "paper"/);
});

test("unknown public URLs remain on a truthful not-found page without a false home redirect", () => {
  assert.match(app, /<Route path="\*" element=\{<Suspense fallback=\{<Loader \/>\}><CommonsV5 \/><\/Suspense>\} \/>/);
  assert.match(pages, /data-page-state="not-found"/);
  assert.match(pages, /Page not found/);
  assert.match(app, /const missingRoute = !protectedRoute && !isPublishedPublicPath\(path\)/);
  assert.match(app, /setRouteMeta\(path, title, description, !protectedRoute && !missingRoute\)/);
  assert.match(app, /canonical\?\.remove\(\)/);
});
test("server and client do not advertise suspended RHEN or private moderator URLs as indexable", () => {
  const worker = source("worker.mjs");
  assert.match(worker, /pathname === "\/communities\/moderation"/);
  assert.match(app, /path === "\/communities\/moderation"/);
  assert.match(worker, /!publicRouteMetadata\(pathname\)/);
  assert.match(worker, /SUSPENDED_FOR_REBUILD/);
  assert.doesNotMatch(worker.slice(worker.indexOf('function publicRouteMetadata'),worker.indexOf('async function withPublicRouteMetadata')),/RHEN is ANEVUM's live trading and research system/);
  assert.match(worker, /import \{ fieldNotes \} from "\.\/src\/data\/fieldNotes"/);
  for (const path of ["/communities","/learn","/privacy","/terms"])
    assert.ok(worker.includes('"' + path + '": {'),"missing public server metadata "+path);
});

test("moderator browser QA waits for React security metadata rather than the initial HTML head", () => {
  const qa = source("scripts/visual-ops-browser-qa.mjs");
  assert.equal((qa.match(/const moderationReady =/g) || []).length, 2,
    "both initial and fallback navigation must wait for the private route");
  assert.equal((qa.match(/extraReady && missingReady && moderationReady/g) || []).length, 2);
  assert.match(qa, /root\?\.querySelector\("#commons-moderation-title"\)/);
  assert.match(qa, /document\.documentElement\.dataset\.route === "communities\/moderation"/);
  assert.match(qa, /document\.querySelector\('meta\[name="robots"\]'\)\?\.content\?\.startsWith\("noindex"\)/);
  assert.match(qa, /!document\.querySelector\('link\[rel="canonical"\]'\)/);
});

test("Commons sidebar destinations are real, authenticated member and publication routes",()=>{
  const sidebar=commons.slice(commons.indexOf("function Sidebar("), commons.indexOf("function GraphArtwork("));
  assert.ok(sidebar.includes('to={session?.user ? "/command" : "/sign-in"} className="side-link" title="Saved programs"'));
  assert.ok(sidebar.includes('to={session?.user ? "/me/settings" : "/sign-in"} className="side-link" title="My profile"'));
  for(const category of ["systems","engineering","research","release"])
    assert.ok(sidebar.includes('to="/field-notes?category='+category+'"'), "unrouted topic: "+category);
  assert.doesNotMatch(sidebar, /<button type="button" className="side-link" onClick=\{onNotice\}><Icon name="bookmark"/);
  const browser = source("scripts/member-command-browser-qa.mjs");
  assert.match(browser, /navSaved/);
  assert.match(browser, /navProfile/);
  assert.match(browser, /info\.navSaved !== \(signedIn\?"\/command":"\/sign-in"\)/);
});

test("Field Note search is URL-backed and does not inherit stale Commons typing",()=>{
  assert.match(pages, /const query = \(params\.get\("q"\) \|\| ""\)\.trim\(\)\.toLowerCase\(\)/);
  assert.doesNotMatch(pages, /search \|\| params\.get\("q"\)/);
  assert.match(commons, /new URLSearchParams\(location\.search\)\.get\("q"\)/);
  assert.match(commons, /navigate\(term \? "\/field-notes\?q=" \+ encodeURIComponent\(term\) : "\/field-notes"\)/);
});

test("posting affordances truthfully disclose gated Commons features",()=>{
  assert.match(commons, /Posting soon/);
  assert.match(commons, /Community posting is not open yet/);
  assert.match(commons, /signing in does not unlock posting/);
  assert.match(commons, /Explore topics/);
  assert.doesNotMatch(commons, /Sign in to share your work or ask a question/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const app = source("src/App.tsx");
const commons = source("src/commons/CommonsV5.tsx");
const pages = source("src/commons/CommonsPages.tsx");

test("Stage 2 public routes reuse the V5 shell rather than reentering the legacy studio shell", () => {
  for (const path of ["/products", "/feed", "/field-notes", "/field-notes/:slug", "/about", "/products/rhen", "/products/rhen/architecture", "/products/rhen/releases", "/products/rhen/releases/:slug", "/communities", "/learn", "/privacy", "/terms", "/sign-in"]) {
    assert.ok(app.includes('<Route path="' + path + '" element={<Suspense fallback={<Loader />}><CommonsV5 /></Suspense>} />'), "not using public Commons shell: " + path);
  }
  assert.match(commons, /<CommonsPublicPage pathname=\{pathname\} search=\{search\}\s*\/>/);
  assert.match(commons, /pagesCss/);
});

test("Private owner and member routes retain existing separate routing and permissions", () => {
  assert.match(app, /<Route path="\/apps\/rhen\/\*" element=\{<Suspense fallback=\{<Loader \/>\}><RhenApp \/><\/Suspense>\} \/>/);
  assert.match(app, /<Route path="\/command\/rhen\/\*" element=\{<Suspense fallback=\{<Loader \/>\}><RhenTerminal \/><\/Suspense>\} \/>/);
  assert.match(app, /<Route path="\/me\/settings" element=\{<PublicExperience><MemberSettings \/><\/PublicExperience>\} \/>/);
  assert.doesNotMatch(pages, /\/api\/command\/|\/api\/member\/rhen\/workspace|broker_secret|alpaca_secret/);
});

test("V5 public content is real source-backed data with no fake member feeds", () => {
  assert.match(pages, /import \{ fieldNotes, type FieldNote \} from "\.\.\/data\/fieldNotes"/);
  assert.match(pages, /import \{ publicProducts \} from "\.\.\/data\/products"/);
  assert.match(pages, /import \{ rhenReleases, rhenReleaseBySlug \} from "\.\.\/data\/releases"/);
  assert.match(pages, /Legacy live trading is suspended/);
  assert.match(pages, /No fictional communities/);
  assert.match(pages, /Historical publication/);
  assert.doesNotMatch(pages, /Math\.random|setInterval|simulatedResults|fakeUsers/);
});

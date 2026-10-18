/**
 * Build one standalone, offline, synthetic Porchlight HTML review file.
 * This uses the real public UI, all data is fictional, all network blocked.
 * node safety/porchlight/review/build-preview.mjs [output.html]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import assert from "node:assert/strict";

const read = relative => readFileSync(new URL(relative, import.meta.url), "utf8");
const target = resolve(process.argv[2] || "evidence/porchlight-v001/porchlight-offline-review.html");
const original = read("../public/index.html");
const stylesheet = read("../public/app.css");
const client = read("../public/app.js");
const mock = read("./offline-api.js");

assert.match(original, /<script type="module" src="\/app\.js"><\/script>/);
assert.match(original, /<link rel="stylesheet" href="\/app\.css">/);
assert.match(original, /<body>/);
assert.match(original, /<\/body>/);
assert.match(mock, /window\.fetch = async/);
assert.doesNotMatch(stylesheet, /@import\b|url\s*\(/i);
for (const [name, value] of [["style", stylesheet], ["client", client], ["mock", mock]]) {
  assert.doesNotMatch(value, /<\/script>|<\/style>/i, name + " must not break inline blocks");
}
assert.doesNotMatch(original, /https?:\/\/[^"\s]+\.(?:js|css)/i);

const toolkit = [
  '<aside class="demo-toolbar" aria-label="Offline interactive demonstration controls">',
  ' <div class="demo-banner"><strong>PORCHLIGHT / OFFLINE REVIEW</strong>',
  '  <span>FICTIONAL EVENT · NO LIVE HOUSEHOLDS · NO EXTERNAL CONNECTION</span>',
  ' </div>',
  ' <div class="demo-actions">',
  '  <button type="button" id="demo-fill">1 · Insert fictional host</button>',
  '  <button type="button" id="demo-approve">2 · Simulate approval</button>',
  '  <button type="button" id="demo-close">3 · Emergency close</button>',
  '  <button type="button" id="demo-reset">Reset demo</button>',
  ' </div>',
  ' <p id="demo-feedback" aria-live="polite" role="status">This is a temporary, in-memory simulation. Use only the provided fictional example data.</p>',
  '</aside>'
].join("\n");
const demoStyles = [
  '.demo-toolbar{position:relative;z-index:15;background:linear-gradient(105deg,#233943,#241f38);border-bottom:2px solid #e6a28c;color:#f9f1e9;padding:12px clamp(16px,4vw,56px);font-family:system-ui,sans-serif}',
  '.demo-banner{display:flex;justify-content:space-between;gap:9px;flex-wrap:wrap;letter-spacing:.08em;font-size:10px}',
  '.demo-banner strong{color:#ffb9a0}.demo-banner span{color:#cbd8da}',
  '.demo-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 5px}',
  '.demo-actions button{background:#102635;border:1px solid #8f9ba0;color:#f4f4f4;border-radius:8px;padding:10px 12px;min-height:44px;font-size:12px;font-weight:700}',
  '.demo-actions button:hover{background:#334c5b}.demo-actions button:focus-visible{outline:3px solid #ffbfac;outline-offset:2px}',
  '#demo-feedback{font-size:11px;color:#e6d3c8;margin:8px 0 0}',
  '@media(max-width:400px){.demo-actions{display:grid;grid-template-columns:1fr 1fr}.demo-actions button{font-size:11px;padding:9px 7px}}',
  '@media(prefers-reduced-motion:reduce){.demo-toolbar *{transition:none!important}}'
].join("\n");
const csp = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
const meta = '<meta name="robots" content="noindex,nofollow">\n <meta http-equiv="Content-Security-Policy" content="' + csp + '">';
const html = original
 .replace("<head>", "<head>\n " + meta)
 .replace("<title>Porchlight | ANEVUM Community Safety Pilot</title>",
          "<title>Porchlight — FICTIONAL OFFLINE REVIEW | ANEVUM</title>")
 .replace('<link rel="stylesheet" href="/app.css">', "<style>\n" + stylesheet + "\n" + demoStyles + "\n</style>")
 .replace('<script type="module" src="/app.js"></script>', "")
 .replace("<body>", "<body>\n" + toolkit)
 .replaceAll('href="/"','href="#hero-heading"')
 .replace("</body>", "<script>\n" + mock + "\n</script>\n<script>\n" + client + "\n</script>\n</body>");
assert.doesNotMatch(html, /<script[^>]+src=/);
assert.doesNotMatch(html, /<link[^>]+rel="stylesheet"/);
assert.match(html, /connect-src 'none'/);
assert.match(html, /NO LIVE HOUSEHOLDS/);
assert.match(html, /FICTIONAL OFFLINE REVIEW/);
assert.ok(html.length > 30000);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, html);
console.log(JSON.stringify({ok:true,path:target,bytes:Buffer.byteLength(html),isolation:"OFFLINE_SYNTHETIC_ONLY",network:"BLOCKED"}));

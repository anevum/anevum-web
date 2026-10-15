import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Creator V1 offers a scoped install manifest without changing the public launch route",()=>{
  const manifest=JSON.parse(read("web/public/site.webmanifest"));
  const html=read("web/index.html");
  const vite=read("web/vite.config.ts");
  assert.equal(manifest.display,"standalone");
  assert.equal(manifest.scope,"./");
  assert.equal(manifest.start_url,"./");
  assert.equal(manifest.icons[0].src,"./favicon.svg");
  assert.match(html,/href="%BASE_URL%site\.webmanifest"/);
  assert.match(html,/apple-mobile-web-app-title/);
  assert.match(vite,/mode === "staging-path" \? "\/creator\/" : "\/"/);
});

test("Home Screen help is a browser-based informational page, never a native app claim",()=>{
  const app=read("web/src/App.tsx");
  const install=read("web/src/pages/InstallPage.tsx");
  assert.match(app,/path="install" element={<InstallPage\/>}/);
  assert.match(install,/Add to Home Screen/);
  assert.match(install,/Open as Web App/);
  assert.match(install,/Install app/);
  assert.match(install,/matchMedia\("\(display-mode: standalone\)"\)/);
  assert.doesNotMatch(install,/serviceWorker\.register|beforeinstallprompt|window\.location\.assign/);
  assert.match(install,/Individual games and applications may still be hosted by their creators/);
});

test("Responsive install page respects small phone screens and reduced motion",()=>{
  const css=read("web/src/install-page.css");
  assert.match(css,/@media\(max-width:390px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/min-height:44px/);
});

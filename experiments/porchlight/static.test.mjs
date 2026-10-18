import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root = new URL("./",import.meta.url);
const files = {
  html:readFileSync(new URL("index.html",root),"utf8"),
  app:readFileSync(new URL("app.js",root),"utf8"),
  css:readFileSync(new URL("styles.css",root),"utf8"),
  model:readFileSync(new URL("model.mjs",root),"utf8")
};
test("no third-party scripts, fonts, tiles, geolocation or local storage",()=>{
  assert.ok(files.html.includes('type="module" src="./app.js"'));
  assert.equal(/<script[^>]*src="https?:/i.test(files.html),false);
  assert.equal(/@import|url\(https?:/i.test(files.css),false);
  assert.equal(/navigator\.geolocation|localStorage|sessionStorage|fetch\(/.test(files.app),false);
  assert.equal(/childLocation|busStop|streetAddress/i.test(files.html),false);
});
test("accessible map controls and directory listing present",()=>{
  ["zoom-in","zoom-out","turn-left","turn-right","reset-map","scene","canvas-area","house-list","selected-panel"].forEach(id=>{
    assert.ok(files.html.includes('id="'+id+'"'),id);
  });
  assert.ok(files.html.includes('aria-live="polite"'));
  assert.ok(files.css.includes("touch-action:none"));
});
test("simulator never sends a request and supports pending, approval and withdrawal",()=>{
  assert.ok(files.app.includes('mock.status="pending"'));
  assert.ok(files.app.includes('mock.status="approved"'));
  assert.ok(files.app.includes('mock.status="withdrawn"'));
  assert.ok(files.app.includes("mock.consentToPublish=false"));
  assert.ok(files.app.includes("mock.verifiedByOrganizer=false"));
  assert.equal(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/.test(files.app),false);
});
test("mandatory privacy and no-affiliation disclosures",()=>{
  assert.match(files.html,/PRIVATE CONCEPT/);
  assert.match(files.html,/NOT AFFILIATED WITH THE CITY OR SCHOOL DISTRICT/);
  assert.match(files.html,/NO REAL PROPERTY DATA/);
  assert.match(files.html,/NOT AN EMERGENCY SERVICE/);
  assert.match(files.model,/EVENT_END/);
  assert.match(files.app,/lastClosedState=isClosed/);
});

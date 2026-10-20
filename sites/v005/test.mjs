import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {resolve,dirname} from "node:path";
import {SITE_V005_HTML as html,SITE_V005_CSS as css,SITE_V005_JS as js,SITE_V005_SW as sw,SITE_V005_MANIFEST as manifest,SITE_V005_ICON as icon} from "../site-v005.mjs";
const dir=dirname(new URL(import.meta.url).pathname);
for(const[name,data,source]of[["html",html,"site.html"],["css",css,"site.css"],["js",js,"site.js"],["sw",sw,"sw.js"],["manifest",manifest,"site.webmanifest"],["icon",icon,"icon.svg"]]){assert.equal(data,await readFile(resolve(dir,source),"utf8"),name+" bundle drift");}
for(const route of["/assets/sites-v005.css","/assets/sites-v005.js","/site.webmanifest","/sw.js","/assets/sites-v005-icon.svg"]){assert.ok(html.includes(route)||js.includes(route),"Missing asset "+route);}
assert.ok(html.includes('action="/api/inquiries"'));
assert.ok(js.includes("application/x-www-form-urlencoded"),"Preserve inquiry API media type");
assert.ok(js.includes("new URLSearchParams({name:"),"Preserve inquiry field contract");
assert.ok(html.includes("independent")&&html.includes("uncommissioned"),"Honest prototype disclaimer");
assert.ok(sw.includes('u.pathname.startsWith("/preview/")'),"No cache for private previews");
assert.ok(sw.includes('u.pathname.startsWith("/api/")'),"No cache for inquiries");
assert.ok(!sw.includes("cache.addAll(['*'])"),"No unbounded cache");
assert.ok(js.includes('getContext("webgl"')&&js.includes('getContext("2d"'),"Real browser rendering");
assert.ok(js.includes("beforeinstallprompt")&&js.includes("serviceWorker"),"PWA support");
assert.ok(JSON.parse(manifest).display==="standalone");
assert.ok(!html.includes("React-powered"),"Do not claim a React runtime for vanilla prototype");
console.log("V005 Experience Lab asset, API, safety and feature checks passed");

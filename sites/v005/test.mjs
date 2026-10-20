import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {resolve,dirname} from "node:path";
import {SITE_V005_HTML as html,SITE_V005_CSS as css,SITE_V005_JS as js,SITE_V005_SW as sw,SITE_V005_MANIFEST as manifest,SITE_V005_ICON as icon,SITE_V005_IMMERSIVE as immersive} from "../site-v005.mjs";
const dir=dirname(new URL(import.meta.url).pathname);
for(const[name,data,source]of[["html",html,"site.html"],["css",css,"site.css"],["js",js,"site.js"],["sw",sw,"sw.js"],["manifest",manifest,"site.webmanifest"],["icon",icon,"icon.svg"],["immersive",immersive,"immersive-engine.js"]]){assert.equal(data,await readFile(resolve(dir,source),"utf8"),name+" bundle drift");}
for(const route of["/assets/sites-v005.css","/assets/sites-v005.js","/site.webmanifest","/sw.js","/assets/sites-v005-icon.svg","/assets/sites-v005-immersive.js"]){assert.ok(html.includes(route)||js.includes(route),"Missing asset "+route);}
assert.ok(html.includes('action="/api/inquiries"'));
assert.ok(js.includes("application/x-www-form-urlencoded"),"Preserve inquiry API media type");
assert.ok(js.includes("new URLSearchParams({name:"),"Preserve inquiry field contract");
assert.ok(html.includes("independent")&&html.includes("uncommissioned"),"Honest prototype disclaimer");
assert.ok(sw.includes('u.pathname.startsWith("/preview/")'),"No cache for private previews");
assert.ok(sw.includes('u.pathname.startsWith("/api/")'),"No cache for inquiries");
assert.ok(!sw.includes("cache.addAll(['*'])"),"No unbounded cache");
assert.ok(immersive.includes("getContext('webgl2'")&&js.includes('getContext("2d"'),"Real WebGL2 and Canvas rendering");
assert.ok(immersive.includes("softShadow")&&immersive.includes("ambientOcclusion")&&immersive.includes("ggx(")&&immersive.includes("materialColor"),"Material and lighting renderer");
assert.ok(immersive.includes("config.maxDpr")&&immersive.includes("MAX_STEPS")&&immersive.includes("IntersectionObserver"),"Adaptive GPU costs and offscreen pause");
assert.ok(css.includes("cinematic-fallback")&&css.includes("Full-bleed Continuance Vault"),"Render-independent fallback");
assert.ok(js.includes("beforeinstallprompt")&&js.includes("serviceWorker"),"PWA support");
assert.ok(JSON.parse(manifest).display==="standalone");
assert.ok(!html.includes("React-powered"),"Do not claim a React runtime for vanilla prototype");
console.log("V005 Experience Lab asset, API, safety and feature checks passed");

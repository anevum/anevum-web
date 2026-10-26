import { test } from "node:test";
import assert from "node:assert/strict";
import { detectCompatibility } from "../package-alpha-v004/compatibility.mjs";
import { inspectGodotWebExport } from "../package-alpha-v004/godot-web.mjs";

const files = (...entries) => entries.map(([path,unpacked]) => ({path,unpacked}));
test("complete compact Godot export is browser candidate but never certified", () => {
 const r=detectCompatibility(files(["index.html",200],["game.pck",1024],["game.wasm",1024],["game.js",600]));
 assert.equal(r.runtime,"godot-web");
 assert.equal(r.playableCandidate,true);
 assert.equal(r.godot.assets.wasm,1);
 assert.equal(r.securityReviewed,false);
 assert.equal(r.mobileVerified,false);
 assert.equal(r.publicationApproved,false);
});
test("Godot source is not executable in the browser",()=>{
 const r=detectCompatibility(files(["project.godot",20],["scenes/main.tscn",120]));
 assert.equal(r.playableCandidate,false);
 assert.equal(r.delivery,"native-or-web-export-required");
 assert.ok(r.issues.some(x=>x.code==="AEP_GODOT_WEB_EXPORT_REQUIRED"));
});
test("partial Godot exports fail closed",()=>{
 const r=detectCompatibility(files(["index.html",50],["game.pck",60]));
 assert.equal(r.playableCandidate,false);
 assert.ok(r.issues.some(x=>x.code==="AEP_GODOT_WASM_MISSING"));
 assert.ok(r.issues.some(x=>x.code==="AEP_GODOT_LOADER_MISSING"));
});
test("large Godot engine requires separate large-build path",()=>{
 const r=detectCompatibility(files(["index.html",500],["game.pck",1024],["game.wasm",13*1048576],["game.js",600]));
 assert.equal(r.playableCandidate,false);
 assert.equal(r.godot.needsLargeBuild,true);
 assert.equal(r.delivery,"large-build-required");
 assert.ok(r.issues.some(x=>x.code==="AEP_GODOT_LARGE_FILE"));
});
test("metadata-only check never invents Godot when input is ordinary HTML",()=>{
 const r=inspectGodotWebExport(files(["index.html",50],["app.js",20]));
 assert.equal(r,null);
});

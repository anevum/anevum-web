import {test} from "node:test";
import assert from "node:assert/strict";
import {detectCompatibility} from "../package-alpha-v004/compatibility.mjs";
const entries=(...paths)=>paths.map(path=>({path,unpacked:100}));
test("detects browser-ready static projects without certifying safety",()=>{
 const r=detectCompatibility(entries("index.html","assets/game.js"));
 assert.equal(r.runtime,"web-static");assert.equal(r.playableCandidate,true);
 assert.equal(r.securityReviewed,false);assert.equal(r.publicationApproved,false);
});
test("recognizes WebAssembly and refuses to infer mobile support",()=>{
 const r=detectCompatibility(entries("index.html","game.wasm"));
 assert.equal(r.runtime,"web-wasm");assert.equal(r.mobileVerified,false);
 assert.ok(r.issues.some(x=>x.code==="AEP_WASM_MOBILE"));
});
test("detects missing root entry and nested dist output",()=>{
 const r=detectCompatibility(entries("dist/index.html","dist/assets/app.js"));
 assert.equal(r.playableCandidate,false);
 assert.ok(r.issues.some(x=>x.code==="AEP_NESTED_BUILD"));
});
test("recognizes Python and source-only JavaScript without pretending they are playable",()=>{
 const py=detectCompatibility(entries("main.py","requirements.txt"));
 assert.equal(py.runtime,"python-source");assert.equal(py.playableCandidate,false);
 const js=detectCompatibility(entries("package.json","src/main.tsx"));
 assert.equal(js.runtime,"web-source");assert.equal(js.playableCandidate,false);
});
test("blocks packages with apparent credentials and flags development dependencies",()=>{
 const r=detectCompatibility(entries("index.html",".env","node_modules/foo.js"));
 assert.equal(r.playableCandidate,false);
 assert.ok(r.issues.some(x=>x.code==="AEP_POSSIBLE_SECRET"));
 assert.ok(r.issues.some(x=>x.code==="AEP_DEPENDENCIES_INCLUDED"));
});
test("recognizes Godot and Unity web build signatures",()=>{
 assert.equal(detectCompatibility(entries("index.html","game.pck")).runtime,"godot-web");
 assert.equal(detectCompatibility(entries("index.html","Build/game.wasm")).runtime,"unity-web");
});

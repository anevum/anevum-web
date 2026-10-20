import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
const filepath=process.argv[2];
if(!filepath)throw Error("Usage: node preview.test.mjs <interactive-preview.html>");
const html=await readFile(filepath,"utf8");
const blocks=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>match[1]);
assert.ok(blocks.length>=3,"Expected engine, application and QA scripts");
for(const script of blocks){new vm.Script(script,{filename:"V005-preview-inline-script.js"});}
assert.ok(html.includes("const $$=(s,root=document)=>Array.from"),"Preserve literal $$ selector helper");
assert.ok(!html.includes("const $=(s,root=document)=>Array.from"),"Prevent replacement-string $$ collapse");
assert.ok(html.includes("ANEVUMImmersive"),"Renderer must be embedded");
assert.ok(html.includes("cinematic-fallback"),"Offline fallback must be present");
assert.ok(html.includes("noindex,nofollow"),"Preview must not be indexed");
assert.ok(html.includes("does not submit inquiries"),"Preview cannot submit contact details");
console.log("V005 integrated preview script parsing and fidelity verified");

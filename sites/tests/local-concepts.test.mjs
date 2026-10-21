import assert from "node:assert/strict";
import {LOCAL_CONCEPTS,LOCAL_CONCEPT_JS,localConceptIndex,localConceptPage} from "../local-concepts.mjs";
assert.equal(LOCAL_CONCEPTS.length,3);
assert.equal(new Set(LOCAL_CONCEPTS.map(x=>x.slug)).size,3);
const list=localConceptIndex();assert.match(list,/noindex,nofollow/);assert.match(list,/Internal demonstration sites/);
for(const x of LOCAL_CONCEPTS){const html=localConceptPage(x.slug);assert.ok(html.includes(x.brand.replaceAll("&","&amp;")),x.slug);assert.match(html,/NOT COMMISSIONED/);assert.match(html,/NO REAL CONTACT, BOOKING OR TRANSACTION/);assert.match(html,/PRIVATE DESIGN STUDY/);assert.match(html,/prefers-reduced-motion/);assert.match(html,/name="viewport"/);assert.match(html,/No customer information or business affiliation/);assert.match(html,/local-concepts.js/);assert.doesNotMatch(html,/<form\b|<iframe\b|<img\b|tel:|mailto:|http:\/\//);}
assert.equal(localConceptPage("invalid"),null);assert.match(LOCAL_CONCEPT_JS,/aria-pressed/);
console.log("ANEVUM Sites local concept content contracts passed");
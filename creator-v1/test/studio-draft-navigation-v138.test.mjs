/** Pure source boundary tests: navigation guard does not mutate private Studio. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const page=read('web/src/pages/CanonicalStudioPage.tsx');
const css=read('web/src/pages/canonical-studio.css');
test('private Studio editor preserves source shape and marks only changed work unsaved',()=>{
 assert.doesNotThrow(()=>parse(page,{sourceType:'module',plugins:['typescript','jsx']}));
 assert.match(page,/const hasUnsavedEdits=JSON\.stringify\(saved\?\?empty\)!==JSON\.stringify\(draft\)/);
 assert.match(page,/data-unsaved=\{hasUnsavedEdits\?"true":"false"\}/);
 assert.match(page,/CURRENT REVISION SAVED \/ PRIVATE/);
 assert.match(page,/UNSAVED CHANGES — SAVE BEFORE LEAVING/);
 assert.match(page,/setProject\(current\);setDraft\(fields\);setSaved\(fields\)/);
 assert.match(page,/studioCreate\(draft,createId\.current\)/);
 assert.match(page,/studioUpdate\(project\.id,project\.revision,draft\)/);
 assert.match(page,/if\(create\)navigate\('\/studio\/'\+current\.id,\{replace:true\}\)/);
});
test('navigation protection is scoped to real links and browser unload without storing unpublished work',()=>{
 assert.match(page,/window\.addEventListener\('beforeunload',onBeforeUnload\)/);
 assert.match(page,/document\.addEventListener\('click',onLinkClick,true\)/);
 assert.match(page,/document\.removeEventListener\('click',onLinkClick,true\)/);
 assert.match(page,/destination\.pathname===window\.location\.pathname/);
 assert.match(page,/anchor\.hasAttribute\('download'\)/);
 assert.match(page,/event\.metaKey\|\|event\.ctrlKey/);
 assert.match(page,/event\.preventDefault\(\);event\.stopImmediatePropagation\(\)/);
 assert.match(page,/You have unsaved Studio changes\. Leave without saving\?/);
 const guard=page.split('const hasUnsavedEdits=')[1].split('const eligibleAttachment=')[0];
 assert.doesNotMatch(guard,/localStorage|sessionStorage|fetch\(|POST|indexedDB|history\.pushState/);
});
test('responsive Studio status is not a public-saving or authority claim',()=>{
 assert.match(css,/V138 \/ canonical private drafting/);
 assert.match(css,/\.st-save-state\[data-unsaved="true"\]/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/@media\(forced-colors:active\)/);
 assert.doesNotMatch(page,/draftRevisionIsPublished|localStorage\.setItem/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {
 SCHEMA,PREFIX,KINDS,ACTIONS,LIMITS,THEMES,starter,encode,decode,validate,
 component,page,removePage,removeComponent
} from '../interface-builder/document.mjs';

const ui=readFileSync(new URL('../web/src/pages/StudioInterfaceBuilderV113.tsx',import.meta.url),'utf8');
const workspace=readFileSync(new URL('../web/src/pages/StudioFileWorkspaceV111.tsx',import.meta.url),'utf8');

test('V113 starter serializes as a strict versioned text-source document',()=>{
 const doc=starter();
 assert.equal(doc.schema,SCHEMA);
 assert.equal(SCHEMA,'anevum.ui.v1');
 assert.ok(doc.pages.length>=2);
 assert.ok(doc.pages.some(p=>p.components.some(c=>c.kind==='counter')));
 assert.ok(doc.pages.some(p=>p.components.some(c=>c.action==='navigate')));
 const raw=encode(doc);
 assert.ok(raw.startsWith(PREFIX));
 assert.ok(new TextEncoder().encode(raw).length<LIMITS.bytes);
 assert.deepEqual(decode(raw),doc);
 assert.equal(decode(''),null);
 assert.equal(decode(PREFIX+'bad JSON'),null);
 assert.ok(THEMES.includes('continuance'));
 assert.ok(KINDS.includes('input')&&KINDS.includes('card'));
 assert.ok(ACTIONS.includes('increment')&&ACTIONS.includes('toggle'));
});
test('V113 strict IDs, exact fields and target types protect interactions',()=>{
 const doc=starter(),home=doc.pages[0],navigate=home.components.find(c=>c.action==='navigate');
 assert.ok(navigate);
 assert.throws(()=>validate({...doc,extra:'injected'}),/Unsupported interface/);
 assert.throws(()=>validate({...doc,pages:[{...home,id:'not-a-uuid'},...doc.pages.slice(1)]}),/Invalid page/);
 assert.throws(()=>validate({...doc,pages:[home,home]}),/Invalid page/);
 const badTarget={...navigate,target:'ffffffff-ffff-4fff-8fff-ffffffffffff'};
 assert.throws(()=>validate({...doc,pages:[{...home,components:home.components.map(c=>c.id===navigate.id?badTarget:c)},...doc.pages.slice(1)]}),/missing page/);
 const badAction={...home.components.find(c=>c.kind==='heading'),action:'navigate',target:doc.pages[1].id};
 assert.throws(()=>validate({...doc,pages:[{...home,components:home.components.map(c=>c.id===badAction.id?badAction:c)},...doc.pages.slice(1)]}),/Invalid component/);
 const script=component('card','<script>alert("x")</script>','<img src=x onerror=alert(1)>');
 const safe=validate({...doc,pages:[{...home,components:[...home.components,script]},...doc.pages.slice(1)]});
 assert.deepEqual(decode(encode(safe)),safe,'Untrusted markup remains literal text, never executed');
 assert.throws(()=>encode({...doc,pages:[{...home,components:[...home.components,component('paragraph','a','X'.repeat(LIMITS.text+1))]},...doc.pages.slice(1)]}),/Invalid component/);
 assert.throws(()=>validate({...doc,theme:'url(https://example.invalid)'}),/Unsupported interface/);
});
test('V113 delete operations unlink targets and keep at least one page',()=>{
 const doc=starter(),first=doc.pages[0],second=doc.pages[1];
 const removed=removePage(doc,second.id);
 assert.equal(removed.pages.length,1);
 assert.equal(removed.pages[0].components.find(c=>c.kind==='button'&&c.title==='Explore archive').action,'none');
 assert.throws(()=>removePage(removed,first.id),/At least one page/);
 const count=first.components.find(c=>c.kind==='counter');
 const without=removeComponent(doc,first.id,count.id);
 const related=without.pages[0].components.find(c=>c.title==='Record signal');
 assert.equal(related.action,'none');
 assert.equal(related.target,null);
 const copy=page('Copied page');
 assert.ok(copy.id!==first.id);
});
test('V113 component capacity and aggregate byte cap fail before saving',()=>{
 const doc=starter(),home=doc.pages[0];
 const tooMany=[...home.components];
 while(tooMany.length<=LIMITS.componentsPerPage)tooMany.push(component('paragraph','n',''));
 assert.throws(()=>validate({...doc,pages:[{...home,components:tooMany},...doc.pages.slice(1)]}),/Invalid page/);
 const pages=[...doc.pages];
 while(pages.length<=LIMITS.pages)pages.push(page('More pages'));
 assert.throws(()=>validate({...doc,pages}),/Unsupported interface/);
 const mutated=JSON.parse(JSON.stringify(doc));
 for(const pg of mutated.pages)for(const c of pg.components)c.text='X'.repeat(790);
 while(mutated.pages[0].components.length<24){const item=component('paragraph','Full component','X'.repeat(790));mutated.pages[0].components.push(item);}
 while(mutated.pages[1].components.length<24){const item=component('paragraph','Full component','X'.repeat(790));mutated.pages[1].components.push(item);}
 assert.throws(()=>encode(mutated),/28 KiB/);
});
test('V113 is a default-off document projection of the existing V111 save API',()=>{
 assert.ok(parse(ui,{sourceType:'module',plugins:['typescript','jsx']}).program.body.length>4);
 assert.ok(parse(workspace,{sourceType:'module',plugins:['typescript','jsx']}).program.body.length>4);
 assert.match(ui,/VITE_CREATOR_INTERFACE_BUILDER_V113==='true'/);
 assert.match(ui,/encode\(starter\(\)\)/);
 assert.match(ui,/data-studio-ui-builder="v113"/);
 assert.match(ui,/Preview interactions are local to this browser view/);
 assert.match(workspace,/StudioInterfaceBuilderV113/);
 assert.match(workspace,/studioFileUpdate\(projectId,nodeId/);
 assert.match(workspace,/Save revision/);
 assert.doesNotMatch(ui,/fetch\(|new WebSocket|EventSource|dangerouslySetInnerHTML|eval\(|srcdoc|iframe/i);
});

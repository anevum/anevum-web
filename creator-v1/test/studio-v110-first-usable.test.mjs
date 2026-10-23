import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from '@babel/parser';
import {STARTER_PRESETS,starterDraft} from '../web/src/lib/studio-starters-v110.ts';

const project=readFileSync('creator-v1/web/src/pages/CreatorStudioWorkspaceV109.tsx','utf8');
const dialog=readFileSync('creator-v1/web/src/pages/StudioNewProjectDialogV110.tsx','utf8');
const agent=readFileSync('creator-v1/web/src/pages/AgentDockV110.tsx','utf8');
const css=readFileSync('creator-v1/web/src/pages/creator-workspace-v110.css','utf8');
const id='4b5f6217-2d52-4ab4-8641-9683782eaf6f';
test('canonical record starters preserve the exact existing server-side form contract',()=>{
 assert.deepEqual(STARTER_PRESETS.map(x=>x.id),['game','app','story','creative']);
 for(const preset of STARTER_PRESETS){
  const draft=starterDraft(preset.id,'The First Signal',preset.suggestedSummary,id);
  assert.deepEqual(Object.keys(draft).sort(),[
   'slug','title','summary','description','category','freeToUse','license',
   'sourceUrl','demoUrl','aiDisclosure','humanContribution'
  ].sort());
  assert.match(draft.slug,/^[a-z0-9](?:[a-z0-9-]{1,88}[a-z0-9])$/);
  assert.equal(draft.category,preset.category);
  assert.equal(draft.sourceUrl,null);assert.equal(draft.demoUrl,null);
  assert.equal(draft.license,'');assert.equal(draft.aiDisclosure,'');
  assert.equal(draft.freeToUse,true);
  assert.match(draft.description,/No runnable source, playable build or publication/);
 }
});
test('starter input validation rejects short/broken/unsafe values',()=>{
 const summary=STARTER_PRESETS[0].suggestedSummary;
 assert.throws(()=>starterDraft('game','',summary,id),/title/i);
 assert.throws(()=>starterDraft('game','Test','short',id),/summary/i);
 assert.throws(()=>starterDraft('game','A\u0000B',summary,id),/title/i);
 assert.throws(()=>starterDraft('game','Test',summary,'bad-id'),/request identifier/i);
 assert.throws(()=>starterDraft('unlisted','Test',summary,id),/starter/i);
 assert.equal(starterDraft('app','Project Name',summary,id).slug,'project-name-4b5f6217');
});
test('V110 new components parse as TSX and remain isolated in the existing V109 workspace',()=>{
 for(const src of [project,dialog,agent]){
  const tree=parse(src,{sourceType:'module',plugins:['typescript','jsx']});
  assert.ok(tree.program.body.length>4);
 }
 assert.match(project,/VITE_CREATOR_AGENT_DOCK_V110==='true'/);
 assert.match(project,/newProjectOpen&&<StudioNewProjectDialog/);
 assert.match(project,/agentDockEnabled&&agentOpen&&<AgentDockV110/);
 assert.match(project,/setRecords\(old=>\[project/);
 assert.match(project,/setNewProjectOpen\(false\)/);
 assert.match(project,/import '\.\/creator-workspace-v110\.css'/);
});
test('project creation is an actual canonical private record mutation with a preserved retry id',()=>{
 assert.match(dialog,/studioCreate\(draft,requestId\.current\)/);
 assert.match(dialog,/submitted\.current=draft/);
 assert.match(dialog,/submitted\.current\|\|starterDraft/);
 assert.match(dialog,/onCreated\(response\.project\)/);
 assert.match(dialog,/No new project has been confirmed/);
 assert.match(dialog,/does not generate runnable code, publish a creation or grant upload permission/);
 assert.doesNotMatch(dialog,/fetch\(/);
});
test('OpenAI planning dock cannot impersonate a connected agent or call a model',()=>{
 assert.match(agent,/OpenAI not connected/);
 assert.match(agent,/No model access or account linking is active/);
 assert.match(agent,/navigator\.clipboard\.writeText\(brief\)/);
 assert.match(agent,/private files have not been attached or transmitted/);
 assert.match(agent,/does not grant access to ANEVUM private files|not an ANEVUM\/OpenAI account connection/i);
 assert.doesNotMatch(agent,/fetch\(|new WebSocket|EventSource|openai\.com\/v1|Responses API/);
 assert.match(agent,/Story Architect/);
 assert.match(agent,/QA Observer/);
});
test('V110 responsive modal and focused mobile dock preserve reduced-motion conventions',()=>{
 assert.match(css,/\.csw-create-dialog::backdrop/);
 assert.match(css,/@media\(max-width:730px\)/);
 assert.match(css,/\.csw-layout\.csw-agent-active \.csw-main/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

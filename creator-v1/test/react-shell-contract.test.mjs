import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('component frontend exists independently of the legacy cinematic extraction pipeline',()=>{
  for(const path of ['web/index.html','web/vite.config.ts','web/worker.mjs','web/src/App.tsx','web/src/components/Shell.tsx','web/src/components/OrbitalMark.tsx','web/src/pages/HomePage.tsx','web/src/styles.css'])
    assert.equal(existsSync(new URL('../'+path,import.meta.url)),true,path);
  const vite=read('web/vite.config.ts');
  const app=read('web/src/App.tsx');
  assert.doesNotMatch(vite,/community-preview\/worker\.js/);
  assert.doesNotMatch(app,/community-preview|generated\.mjs|dangerouslySetInnerHTML/);
});

test('new shell is real-data first and keeps public feature boundaries explicit',()=>{
  const api=read('web/src/lib/api.ts');
  const home=read('web/src/pages/HomePage.tsx');
  const coming=read('web/src/pages/ComingPage.tsx');
  for(const endpoint of ['/api/v1/status','/api/v1/categories','/api/v1/projects','/api/v1/creators']) assert.ok(api.includes(endpoint),endpoint);
  assert.match(api,/credentials:\s*"omit"/);
  assert.match(api,/cache:\s*"no-store"/);
  assert.match(home,/No fake projects, ratings or activity/);
  assert.match(coming,/Public submission is not open yet/);
  assert.doesNotMatch(home,/stellarfox|sampleRatings|fakeVotes/);
});

test('Orbital Underground identity and responsive review widths are encoded in components',()=>{
  const mark=read('web/src/components/OrbitalMark.tsx');
  const css=read('web/src/styles.css');
  const home=read('web/src/pages/HomePage.tsx');
  assert.match(mark,/ellipse cx="256" cy="256" rx="188" ry="76"/);
  assert.match(mark,/circle cx="391" cy="132"/);
  for(const word of ['MAKE','SHARE','PLAY','BELONG']) assert.ok(home.includes(word),word);
  for(const token of ['--bone:#eee7dd','--coral:#ff6554','--violet:#a855ff']) assert.ok(css.includes(token),token);
  for(const width of ['1180px','900px','640px']) assert.ok(css.includes(width),width);
});

test('preview Worker delegates APIs to the existing Creator V1 backend and assets to ASSETS',()=>{
  const worker=read('web/worker.mjs');
  const config=read('wrangler.react-preview.jsonc');
  assert.match(worker,/import api from "\.\.\/api\/worker\.mjs"/);
  assert.match(worker,/env\.ASSETS\.fetch\(request\)/);
  assert.match(config,/"binding": "COMMUNITY_DB"/);
  assert.match(config,/"not_found_handling": "single-page-application"/);
  assert.match(config,/"workers_dev": true/);
  assert.doesNotMatch(config,/anevum\.com\/\*/);
});


test("public React discovery, creator and project screens expose real pagination and metadata",()=>{
  const api=read("web/src/lib/api.ts");
  const discover=read("web/src/pages/DiscoverPage.tsx");
  const creators=read("web/src/pages/CreatorsPage.tsx");
  const project=read("web/src/pages/ProjectPage.tsx");
  const repository=read("web/src/components/RepositoryPanel.tsx");
  for(const component of [discover,creators])assert.match(component,/PageNav/);
  assert.match(discover,/cursor:cursor\|\|undefined/);
  assert.match(creators,/cursor:cursor\|\|undefined/);
  assert.match(project,/safeReturnPath/);
  assert.match(project,/RepositoryPanel/);
  assert.match(repository,/PUBLIC METADATA ONLY/);
  assert.match(api,/\/repository/);
});

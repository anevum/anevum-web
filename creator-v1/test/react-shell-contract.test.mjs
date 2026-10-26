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
  assert.match(api,/PUBLIC_API_ROOT = import\.meta\.env\.BASE_URL === "\/creator\/" \? "\/creator\/api\/v1" : "\/api\/v1"/);
  for(const endpoint of ['publicPath("/status")','publicPath("/categories")','publicPath("/projects?")','publicPath("/creators?")']) assert.ok(api.includes(endpoint),endpoint);
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


test("creator and project searches expose native searchbox semantics",()=>{
  assert.match(read("web/src/pages/CreatorsPage.tsx"),/type="search" aria-label="Search published creators"/);
  assert.match(read("web/src/pages/DiscoverPage.tsx"),/type="search"/);
});


test("private project editor reuses staged member API with separate moderation submission",()=>{
  const editor=read("web/src/pages/ProjectEditorPage.tsx");
  const app=read("web/src/App.tsx");
  assert.match(app,/path="create\/new"/);
  assert.match(app,/path="create\/:projectId"/);
  assert.match(editor,/memberCreateProject/);
  assert.match(editor,/memberUpdateProject/);
  assert.match(editor,/memberSubmitProject/);
  assert.match(editor,/window\.confirm/);
  assert.match(editor,/remains private until separately approved/);
});


test("public project never enables member saves or ratings without invited staging identity",()=>{
  const component=read("web/src/components/MemberEngagementPanel.tsx");
  const project=read("web/src/pages/ProjectPage.tsx");
  assert.match(project,/MemberEngagementPanel/);
  assert.match(component,/memberHealth/);
  assert.match(component,/memberMe/);
  assert.match(component,/memberVote/);
  assert.match(component,/memberSetSaved/);
  assert.match(component,/kind:"closed"/);
  assert.match(component,/Public voting is not open/);
});


test("isolated next.anevum.com Creator V1 staging path is separate from member auth and production",()=>{
  const vite=read("web/vite.config.ts");
  const main=read("web/src/main.tsx");
  const api=read("web/src/lib/api.ts");
  const worker=read("web/staging-path-worker.mjs");
  const cfg=read("wrangler.react-staging-path.jsonc");
  assert.match(vite,/base: mode === "staging-path" \? "\/creator\/"/);
  assert.match(main,/basename=/);
  assert.match(api,/PUBLIC_API_ROOT/);
  assert.match(worker,/PUBLISHED/);
  assert.match(worker,/env\.ASSETS\.fetch/);
  assert.match(cfg,/"next\.anevum\.com\/creator\/\*"/);
  assert.doesNotMatch(worker,/AUTH_PEPPER|RESEND_API_KEY|set-cookie/i);
});


test("staging preview carries restrictive HTML headers and strips member cookies from public fetches",()=>{
 const w=read("web/staging-path-worker.mjs");
 const vite=read("web/vite.config.ts");
 assert.match(w,/content-security-policy/);
 assert.match(w,/Authorization/);
 assert.match(w,/new Request\(target.href/);
 assert.match(w,/new Request\(forwarded.href/);
 assert.match(vite,/sourcemap: false/);
});


test("Evolution routes preserve canonical XP with signed-in earned-only reward access",()=>{
  const shell=read("web/src/components/Shell.tsx");
  const app=read("web/src/App.tsx");
  const panel=read("web/src/components/LevelPanel.tsx");
  const levels=read("web/src/pages/LevelsPage.tsx");
  assert.match(shell,/menuDestinations/);
  assert.match(shell,/menuCategories/);
  assert.match(shell,/\/levels/);
  assert.match(app,/path="levels"/);
  assert.match(panel,/useMemberProgression/);
  assert.match(panel,/30 CURRENT LEVELS/);
  assert.match(levels,/canonicalAuthClient\.useSession/);
  assert.match(levels,/signedIn/);
  assert.match(levels,/EarnedRewardVault/);
  assert.match(levels,/moderation authority/);
  assert.doesNotMatch(levels,/LevelCollection|30 LIVING SPECIMENS|<LevelCollection/);
  assert.match(levels,/verified server records/);
});

test("mobile has no fixed bottom tab bar and header drawer exposes every member route",()=>{
  const shell=read("web/src/components/Shell.tsx");
  const css=read("web/src/styles.css");
  assert.doesNotMatch(shell,/mobile-bottom-nav|const mobileNav/);
  assert.doesNotMatch(css,/\.mobile-bottom-nav/);
  assert.match(shell,/aria-label=\{menuOpen \? "Close site navigation" : "Open site navigation"\}/);
  // Canonical visible Create destination is /studio; keep /create only
  // as a historical inbound redirect, never as a primary menu shortcut.
  assert.doesNotMatch(shell,/to:"\/create",label:"Create"/);
  for(const route of ["/discover","/levels","/community","/studio","/library","/member","/join","/status"])
    assert.ok(shell.includes('"'+route+'"'),"Missing top menu route: "+route);
  assert.match(css,/\.site-main\{padding:10px 10px 32px\}/);
  assert.match(css,/\.site-footer\{padding:18px 12px 24px/);
  assert.match(css,/\.mobile-drawer\{top:59px/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {rhenLessons} from '../src/data/rhen-learning.ts';
import {RHEN_LESSON_VERSIONS} from '../src/data/rhen-lesson-registry.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('server allowlist and current public lesson versions remain exactly aligned',()=>{
 assert.deepEqual({...RHEN_LESSON_VERSIONS},Object.fromEntries(rhenLessons.map(x=>[x.slug,x.version])));
});
test('learning dispatcher follows real Better Auth and same-origin checks; export and deletion are wired',()=>{
 const server=read('src/server/member.mjs');
 const route=server.indexOf('return learningProgressEndpoint(request, env, user, verifiedOrigin, pathname)');
 assert.ok(route>server.indexOf('if (!user?.id)') && route>server.indexOf('!safeMutation(request, verifiedOrigin)'));
 assert.match(server,/learningProgress: await exportLearningProgress\(db, user\.id\)/);
 assert.match(server,/await deleteLearningProgress\(env\.MEMBER_DB, user\.id\)/);
 assert.match(server,/afterDelete: async \(user\)/);
});
test('private learning route and discoverability use the existing shell without public sitemap entry',()=>{
 const app=read('src/App.tsx'),nav=read('src/commons/site-navigation.ts');
 assert.match(app,/<Route path="\/me\/learning" element=\{<Suspense fallback=\{<Loader \/>\}><CommonsV5 content=\{<MemberLearning \/>\} \/><\/Suspense>\} \/>/);
 assert.match(app,/path\.startsWith\("\/me"\)/);
 assert.match(nav,/path:"\/me\/learning"/);
 assert.match(read('src/commons/RhenLearning.tsx'),/to="\/me\/learning"/);
 assert.ok(!JSON.parse(read('src/data/public-routes.json')).some(route=>route.path==='/me/learning'));
});
test('UI clears pending identity, aborts old work, rechecks durable save and never automatically retries a write',()=>{
 const page=read('src/pages/MemberLearning.tsx');
 assert.match(page,/key=\{memberId \|\| "signed-out"\}/);
 assert.match(page,/!checking \? session\?\.user\?\.id/);
 assert.match(page,/controller\.abort\(\)/);
 assert.match(page,/JSON\.stringify\(confirmed\)!==JSON\.stringify\(saved\)/);
 assert.match(page,/X-ANEVUM-EXPECTED-MEMBER-ID/);
 assert.match(page,/data\.memberId!==memberId/);
 assert.match(page,/available&&<button/);
 assert.doesNotMatch(page,/localStorage|sessionStorage|setInterval|Math\.random/);
});
test('migration remains isolated from all existing core migration and activation configs',()=>{
 assert.match(read('migrations-learning/0009_member_learning_progress.sql'),/ON DELETE CASCADE/);
 const root=new URL('../',import.meta.url);
 for(const name of readdirSync(root).filter(name=>name.startsWith('wrangler')&&/jsonc?$/.test(name))){
  const source=read(name);
  assert.doesNotMatch(source,/migrations-learning/);
  assert.doesNotMatch(source,/"ANEVUM_MEMBER_LEARNING_ENABLED"\s*:\s*"true"/);
 }
});

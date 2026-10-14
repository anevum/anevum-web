import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {INITIAL_ORBITS,initialOrbitState,orbitReducer} from "../web/src/lib/orbit-align-logic.ts";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Orbit Align is a deterministic, genuinely completable puzzle",()=>{
  const initial=initialOrbitState();
  assert.deepEqual(initial.slots,[6,3,5]);
  assert.equal(initial.phase,"ready");
  assert.equal(initial.moves,0);
  assert.notEqual(initial.slots,INITIAL_ORBITS); // A new mutable copy, not shared data.
  assert.deepEqual(orbitReducer(initial,{type:"rotate",ring:0}),initial);
  let state=orbitReducer(initial,{type:"start"});
  assert.equal(state.phase,"playing");
  for(const [ring,turns] of [[0,2],[1,5],[2,3]]){
    for(let i=0;i<turns;i++)state=orbitReducer(state,{type:"rotate",ring});
  }
  assert.deepEqual(state.slots,[0,0,0]);
  assert.equal(state.moves,10);
  assert.equal(state.phase,"complete");
  assert.deepEqual(orbitReducer(state,{type:"rotate",ring:2}),state);
  assert.deepEqual(orbitReducer(state,{type:"start"}),state);
  assert.deepEqual(orbitReducer(state,{type:"reset"}),initial);
});
test("Pause gates all controls; resume preserves progress and resets clear state",()=>{
  let state=orbitReducer(initialOrbitState(),{type:"start"});
  state=orbitReducer(state,{type:"rotate",ring:0});
  assert.equal(state.moves,1);
  state=orbitReducer(state,{type:"pause"});
  const paused=state;
  assert.equal(state.phase,"paused");
  assert.deepEqual(orbitReducer(state,{type:"rotate",ring:1}),paused);
  assert.deepEqual(orbitReducer(state,{type:"start"}),paused);
  state=orbitReducer(state,{type:"resume"});
  assert.equal(state.phase,"playing");
  assert.equal(state.moves,1);
  assert.deepEqual(orbitReducer(state,{type:"rotate",ring:-1}),state);
  assert.deepEqual(orbitReducer(state,{type:"rotate",ring:3}),state);
  assert.deepEqual(orbitReducer(state,{type:"rotate",ring:0.5}),state);
  state=orbitReducer(state,{type:"rotate",ring:1});
  assert.equal(state.moves,2);
  assert.equal(orbitReducer(state,{type:"reset"}).phase,"ready");
});
test("Homepage featured route expands genuine approved releases and a separate prototype",()=>{
  const home=read("web/src/pages/MorphHomeConsole.tsx");
  const app=read("web/src/App.tsx");
  assert.match(home,/function featureLink\(project:Project\)\{return "\/atlas\/experience\/"/);
  assert.match(home,/lead\?featureLink\(lead\):"\/atlas\/lab\/orbit-align"/);
  assert.match(home,/FIRST-PARTY PLAYER LAB \/ NOT A CREATOR RELEASE/);
  assert.match(home,/NO ACCOUNT REQUIRED · NO XP GRANTED/);
  assert.match(home,/lead\?lead\.title:<>ORBIT <em>ALIGN\.<\/em><\/>/);
  assert.match(app,/path="experience\/:id"/);
  assert.match(app,/path="lab\/orbit-align"/);
  assert.match(app,/FeaturedExperiencePage/);
  assert.match(app,/OrbitAlignPage/);
});
test("Cinematic focus safely treats creator demos as external, never arbitrary embedded code",()=>{
  const focus=read("web/src/pages/FeaturedExperiencePage.tsx");
  const shell=read("web/src/pages/AtlasMorphPage.tsx");
  assert.match(focus,/readProject\(id,signal\)/);
  assert.match(focus,/safeExternal\(p\.demoUrl\)/);
  assert.match(focus,/href={demo\.href} target="_blank" rel="noopener noreferrer"/);
  assert.match(focus,/This creator experience is hosted independently/);
  assert.match(focus,/separate from this creator's project/);
  assert.match(focus,/to="\/atlas\/lab\/orbit-align"/);
  assert.doesNotMatch(focus,/<iframe|dangerouslySetInnerHTML|allow-same-origin|allow-scripts|document\.write/);
  assert.match(shell,/pathname\.startsWith\("\/atlas\/experience\/"\)/);
  assert.match(shell,/pathname\.startsWith\("\/atlas\/lab\/orbit-align"\)/);
  assert.match(shell,/className="fx-home-preserved" hidden={focused}/);
  assert.match(shell,/homeScroll\.current/);
});
test("Playable UI uses actual reducer and never awards synthetic achievements",()=>{
  const game=read("web/src/pages/OrbitAlignDemo.tsx");
  const css=read("web/src/pages/featured-play-experience.css");
  assert.match(game,/useReducer\(orbitReducer,undefined,initialOrbitState\)/);
  assert.match(game,/dispatch\(\{type:"rotate",ring:index\}\)/);
  assert.match(game,/dispatch\(\{type:"pause"\}\)/);
  assert.match(game,/dispatch\(\{type:"resume"\}\)/);
  assert.match(game,/dispatch\(\{type:"start"\}\)/);
  assert.match(game,/dispatch\(\{type:"reset"\}\)/);
  assert.match(game,/no account XP or public score has been awarded/i);
  assert.match(game,/ANEVUM \/ INTERACTIVE PROTOTYPE/);
  assert.match(css,/@media\(max-width:640px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/\.atm-content--page:has\(\.fx-game\)/);
  assert.doesNotMatch(game,/fetch\(|localStorage|sessionStorage|awardXp\(|grantXp\(|<iframe/);
});

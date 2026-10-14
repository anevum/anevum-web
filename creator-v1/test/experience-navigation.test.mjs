import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read = path => readFileSync(new URL("../"+path,import.meta.url),"utf8");
const shell=read("web/src/components/Shell.tsx");
const home=read("web/src/pages/HomePage.tsx");
const navigator=read("web/src/components/WorldNavigator.tsx");
const css=read("web/src/experience-navigation.css");
const main=read("web/src/main.tsx");
const account=read("web/src/pages/MemberAccountPage.tsx");

test("the public header prioritizes Explore, Community and Creators",()=>{
  const part=shell.slice(shell.indexOf("const primaryNavigation = ["),shell.indexOf("] as const;"));
  assert.ok(part.startsWith("const primaryNavigation = ["));
  const links=[...part.matchAll(/\["([^"]+)", "([^"]+)"\]/g)].map(x=>[x[1],x[2]]);
  assert.deepEqual(links,[["/discover","Explore"],["/community","Community"],["/creators","Creators"]]);
  assert.ok(shell.includes('className="brand-lockup"'));
  assert.ok(shell.includes('aria-label="Open quick navigation"'));
  assert.ok(shell.includes('to="/account"'));
  assert.ok(shell.includes('const drawerNavigation = [["/", "Home"], ...primaryNavigation]'));
  assert.doesNotMatch(shell,/portalCategories|className="portal-navigation"|className="signal-strip"|mobile-bottom-nav/);
  assert.ok(!shell.includes("Saved library"));
});

test("contextual pages keep all secondary destinations reachable",()=>{
  for(const path of ["/guide","/levels","/status","/workspace","/start"])
    assert.ok(shell.includes('to="'+path+'"'),path);
  assert.ok(shell.includes('href="/portfolio/"'));
  assert.ok(account.includes('to="/create"'));
  assert.ok(account.includes('to="/library"'));
  assert.ok(account.includes('to="/account/edit"'));
  assert.ok(shell.includes('to="/account"'));
});

test("world navigator reaches every real catalogue category without pretending to list projects",()=>{
  for(const id of ["games","tools","creative","libraries","automation","research","learning","other"])
    assert.ok(home.includes('id:"'+id+'"'),id);
  assert.ok(home.includes("<WorldNavigator worlds={worlds} counts={counts}"));
  assert.ok(navigator.includes('encodeURIComponent(id)'));
  assert.ok(navigator.includes('"/discover?category="'));
  assert.ok(navigator.includes('role="group"'));
  assert.ok(navigator.includes('aria-pressed={index===active}'));
  assert.ok(navigator.includes('aria-live="polite"'));
  assert.ok(navigator.includes('event.key==="ArrowRight"'));
  assert.ok(navigator.includes('event.key==="ArrowLeft"'));
  assert.ok(navigator.includes('event.key==="Enter"'));
  assert.ok(navigator.includes('onTouchStart={touchStart}'));
  assert.ok(navigator.includes('onTouchEnd={touchEnd}'));
  assert.ok(navigator.includes('onPointerMove={move}'));
  assert.ok(navigator.includes('event.pointerType!=="mouse"'));
  assert.ok(navigator.includes('ready?(counts.get(world.id)||0)'));
  assert.doesNotMatch(navigator,/fetch\(|localStorage|sessionStorage|setTimeout|Math.random|memberSetSaved|memberVote|memberProgress|Award XP/);
});

test("new homepage is a discovery path without repeated category slabs or fabricated launch content",()=>{
  assert.ok(home.includes('readStatus(signal)'));
  assert.ok(home.includes('readProjects({limit:"10"},signal)'));
  assert.ok(home.includes('readCreators({limit:"5"},signal)'));
  assert.ok(home.includes('readCategories(signal)'));
  assert.ok(home.includes('projects.slice(0,5).map'));
  assert.ok(home.includes('creators.map'));
  assert.ok(home.includes('No fake projects, ratings or activity'));
  assert.ok(home.includes('FIRST RELEASES')||home.includes('First releases are still ahead.'));
  assert.ok(home.includes("FIRST RELEASE PENDING")||navigator.includes("FIRST RELEASE PENDING"));
  assert.ok(home.includes('to="/guide"'));
  assert.ok(home.includes('to="/community"'));
  assert.ok(home.includes('to="/levels"'));
  assert.doesNotMatch(home,/cw-world-strip|cw-small-world-grid|cw-world-gallery|sampleVotes|fakeProjects|Math.random/);
});

test("mobile, desktop, reduced-motion and keyboard surfaces share one visual system",()=>{
  assert.ok(main.includes('import "./experience-navigation.css"'));
  for(const selector of [".site-header .header-utilities",".mobile-drawer-heading",".cw-atlas-stage",".cw-atlas-node",".cw-atlas-core",".cw-atlas-enter",".cw-publishing-empty",".cw-home-heading"])assert.ok(css.includes(selector),selector);
  for(const width of ["max-width:1380px","max-width:1020px","max-width:820px","max-width:640px","max-width:360px"])assert.ok(css.includes(width),width);
  for(const behavior of ["prefers-reduced-motion:reduce","forced-colors:active","focus-visible","touch-action:pan-y","--cw-orbit-rx","--cw-orbit-ry"])assert.ok(css.includes(behavior),behavior);
  assert.ok(css.includes(".site-header .header-launcher{display:inline-flex"));
  assert.ok(css.includes(".site-header .menu-button{display:flex"));
  assert.ok(shell.includes('menuPanel.current?.querySelector'));
  assert.ok(shell.includes('menuButton.current?.focus()'));
  assert.ok(shell.includes('document.addEventListener("pointerdown", outside)'));
  assert.ok(shell.includes('window.removeEventListener("keydown", dismiss)'));
  assert.doesNotMatch(css,/\.mobile-bottom-nav|position:fixed\s*;\s*bottom:0/);
});

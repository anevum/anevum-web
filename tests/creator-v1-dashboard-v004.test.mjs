import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";

const require=createRequire(import.meta.url);
const {parse}=require("@babel/parser");
const root=fileURLToPath(new URL("../",import.meta.url));
const read=path=>readFileSync(root+"creator-v1/web/src/"+path,"utf8");

const shell=read("components/Shell.tsx");
const bar=read("components/DashboardContextBar.tsx");
const rail=read("components/DashboardRails.tsx");
const home=read("pages/HomePage.tsx");
const discover=read("pages/DiscoverPage.tsx");
const creators=read("pages/CreatorsPage.tsx");
const community=read("pages/CommunityPage.tsx");
const members=read("components/MemberGate.tsx");
const router=read("App.tsx");
const css=read("dashboard-sitewide-v004.css");
const entry=read("main.tsx");

test("sitewide components compile as TSX syntax",()=>{
  for(const [name,text] of [["Shell",shell],["DashboardContextBar",bar],["DashboardRails",rail]]){
    assert.doesNotThrow(()=>parse(text,{sourceType:"module",plugins:["typescript","jsx"]}),name+" syntax invalid");
  }
});

test("sitewide presentation owns no sensitive routes or member authentication",()=>{
  assert.ok(shell.includes('dashboardSectionForPath(location.pathname)'));
  assert.ok(shell.includes('<DashboardLeftRail/>'));
  assert.ok(shell.includes('<DashboardContextBar section={dashboardSection}/>'));
  assert.ok(shell.includes('<Outlet/>'));
  assert.ok(shell.includes('id="main" tabIndex={-1}'));
  assert.ok(router.includes('element={<MemberGate/>}'));
  assert.ok(members.includes('memberMe(signal)'));
  assert.ok(members.includes('memberHealth(signal)'));
  assert.ok(members.includes('Outlet context='));
  assert.ok(bar.includes('MemberGate and its existing Member Worker'));
  assert.doesNotMatch(bar,/fetch\(|localStorage|document\.cookie|setInterval|window\.location|signupEnabled/);
});

test("public and private pages use an explicit route allowlist",()=>{
  for(const s of ['pathname==="/discover"','pathname==="/creators"','pathname.startsWith("/creators/")',
    'pathname==="/community"','pathname==="/levels"','pathname==="/account"',
    'pathname.startsWith("/account/")','pathname==="/create"','pathname.startsWith("/create/")',
    'pathname==="/library"','pathname.startsWith("/library/")']){
      assert.ok(bar.includes(s),"Missing allowed dashboard route: "+s);
  }
  assert.ok(bar.includes('return null'));
  assert.ok(bar.includes('Section shortcuts'));
  for(const route of ['/discover','/creators','/community','/levels','/account','/create','/library','/account/edit']){
    assert.ok(bar.includes('to:"'+route+'"')||bar.includes('to:"'+route+'?'),"Missing existing section link: "+route);
  }
});

test("existing real public data queries and creator privacy remain in place",()=>{
  assert.ok(home.includes('readStatus(signal)'));
  assert.ok(discover.includes('readProjects({q:q||undefined'));
  assert.ok(creators.includes('readCreators({q:q||undefined'));
  assert.ok(creators.includes('readCreator(handle,signal)'));
  assert.ok(creators.includes('Only currently approved published projects'));
  assert.ok(community.includes('readStatus(signal)'));
  assert.ok(community.includes('PLANNED'));
  assert.ok(community.includes('NO')||community.includes('not live'));
  assert.ok(rail.includes('counts.publishedProjects'));
  assert.doesNotMatch(bar,/24\.7K|12\.4K|4\.2K|fake.*data/i);
});

test("shared dashboard styles respect responsive breakpoints and accessibility",()=>{
  assert.ok(entry.includes('import "./dashboard-sitewide-v004.css"'));
  assert.ok(entry.indexOf('dashboard-sitewide-v004.css')>entry.indexOf('dashboard-home-v003.css'));
  assert.ok(css.includes('.site-shell--dashboard .site-main'));
  assert.ok(css.includes('.av4-page-frame .av3-navrail'));
  assert.ok(css.includes('.av4-page-content .member-header'));
  assert.match(css,/@media\(max-width:880px\)/);
  assert.match(css,/@media\(max-width:600px\)/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/forced-colors:active/);
  assert.match(css,/:focus-visible/);
});

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const navigation=read("src/commons/site-navigation.ts");
const app=read("src/App.tsx");
const commons=read("src/commons/CommonsV5.tsx");
const css=read("src/styles/commons-v5-live-system.css");
const publicRoutes=JSON.parse(read("src/data/public-routes.json"));

test("all V5 navigation destinations are published or authenticated app routes",()=>{
  for(const path of ["/","/products","/communities","/learn","/field-notes","/beta"]){
    assert.ok(publicRoutes.some(r=>r.path===path),"Missing public registry route "+path);
    assert.ok(app.includes('<Route path="'+path+'"'),"Missing React router "+path);
  }
  for(const path of ["/command","/me/settings","/me/beta"]){
    assert.ok(app.includes('<Route path="'+path+'"'),"Missing private route "+path);
  }
  assert.match(app,/<Route path="\/apps\/rhen\/\*" element=/);
  assert.match(navigation,/export const primaryNavigation/);
  assert.match(navigation,/export const accountNavigation/);
  assert.match(navigation,/export const mobileNavigation/);
  assert.match(navigation,/export function isSiteNavigationActive/);
  assert.match(navigation,/export function safeAccountDestination/);
  assert.doesNotMatch(navigation,/\/api\/command\/|\/v2\/orders|brokerageConnected|executionEnabled/);
});

test("Commons header, desktop sidebar and mobile tabs reuse one route registry",()=>{
  assert.match(commons,/primaryNavigation\.filter\(item=>/);
  assert.match(commons,/primaryNavigation\.map\(item=><Link/);
  assert.match(commons,/accountNavigation\.map\(item=><Link/);
  assert.match(commons,/mobileNavigation\.map\(item=><Link/);
  assert.match(commons,/isSiteNavigationActive\(pathname,item\.path\)/);
  assert.match(commons,/safeAccountDestination\(Boolean\(session\?\.user\)\)/);
  assert.match(commons,/onClick=\{\(\)=>setDrawerOpen\(false\)\}/);
  assert.match(commons,/setDrawerOpen\(false\);setDesignOpen\(false\)/);
  assert.doesNotMatch(commons,/aria-label="Posting is not available yet; learn more" onClick=\{onNotice\}/);
  assert.doesNotMatch(commons,/className="icon-btn header-bell"/);
});

test("forest visual tokens are shared and fully isolated in the V5 shadow root",()=>{
  assert.match(commons,/type Palette = "forest"/);
  assert.match(commons,/theme: "forest", layout: "social"/);
  assert.match(commons,/theme: \["forest", "midnight", "carbon", "paper", "plum"\]/);
  assert.match(commons,/\{key:"forest",label:"Forest"\}/);
  assert.match(commons,/import liveCss from "\.\.\/styles\/commons-v5-live-system\.css\?inline"/);
  assert.match(commons,/betaCss\+"\\n"\+memberVerifierCss\+"\\n"\+liveCss/);
  assert.match(css,/:host\(\[data-theme="forest"\]\)/);
  for(const token of ["--canvas:","--nav:","--panel:","--line:","--text:","--accent:","--accent-contrast:"]){
    assert.ok(css.includes(token),"Missing design token "+token);
  }
  assert.match(css,/@media\(max-width:720px\)/);
  assert.match(css,/prefers-reduced-motion/);
  assert.doesNotMatch(css,/\bbackground:url\(\s*http|@import\s+url\(/);
  assert.doesNotMatch(read("src/main.tsx"),/commons-v5-live-system\.css/);
});

test("member verification and account routes share the real V5 navigation",()=>{
  assert.match(app,/<Route path="\/me\/verify" element=\{<Suspense fallback=\{<Loader \/>\}><CommonsV5 content=\{<MemberStagingVerify \/>\}/);
  assert.match(commons,/import memberVerifierCss from "\.\.\/styles\/member-staging-qa\.css\?inline"/);
  assert.doesNotMatch(app,/PublicExperience><MemberStagingVerify/);
  assert.match(commons,/session\?\.user\?item\.path:"\/sign-in"/);
  assert.match(commons,/onDesign=\{\(\)=>setDesignOpen\(x=>!x\)\}/);
});

test("site visualization is derived from real Field Notes, not fake broker results",()=>{
  assert.match(commons,/fieldNotes\.filter\(note=>note\.type===type\)\.length/);
  assert.match(commons,/Published Field Notes/);
  assert.match(commons,/Counts come from the published ANEVUM Field Notes registry/);
  assert.match(commons,/className="v5-site-pathway"/);
  for(const path of ["/products","/field-notes","/learn","/beta"]){
    assert.ok(commons.includes('path:"'+path+'"'),"Missing functional homepage path "+path);
  }
  assert.match(commons,/Community posting is still in development/);
  assert.doesNotMatch(css,/fake-[a-z-]+-stats|simulated-performance/);
});

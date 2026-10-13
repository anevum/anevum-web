import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const css=read("web/src/cosmic-observatory.css");
const horizon=read("web/src/components/CosmicHorizon.tsx");
const home=read("web/src/pages/HomePage.tsx");
const shell=read("web/src/components/Shell.tsx");
const worlds=read("web/src/components/CosmicIllustration.tsx");
const heading=read("web/src/components/PortalHeading.tsx");
const levels=read("web/src/pages/LevelsPage.tsx");
const styles=read("web/src/main.tsx");
const html=read("web/index.html");

function srgb(hex){
  const channels=hex.replace("#","").match(/../g)?.map(x=>parseInt(x,16)/255);
  if(!channels||channels.length!==3)throw new Error("Invalid 24-bit color "+hex);
  return channels.map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
}
function contrast(a,b){
  const lum=(hex)=>{const v=srgb(hex);return v[0]*.2126+v[1]*.7152+v[2]*.0722};
  const x=lum(a),y=lum(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
function token(name){
  const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const value=css.match(new RegExp(escaped+":(#[0-9a-fA-F]{6})"));
  assert.ok(value,"Missing literal token "+name);
  return value[1];
}

test("cosmic design overrides old coral skin last without deleting existing pages",()=>{
  assert.match(html, /name="theme-color" content="#040811"/);
  assert.match(styles,/import "\.\/portal-overhaul\.css"/);
  assert.match(styles,/import "\.\/depth-system\.css"/);
  assert.match(styles,/import "\.\/cosmic-observatory\.css"/);
  assert.ok(styles.lastIndexOf("cosmic-observatory.css")>styles.lastIndexOf("portal-launcher.css"));
  for(const [name,hex] of Object.entries({
    "--cosmos-void":"#080a12",
    "--cosmos-deep":"#0e1424",
    "--cosmos-panel":"#131c31",
    "--cosmos-rise":"#1a253b",
    "--cosmos-white":"#f4f7ff",
    "--cosmos-cyan":"#7de7e8",
    "--cosmos-blue":"#80b1ff",
    "--cosmos-violet":"#a89cff",
    "--cosmos-gold":"#e8c26e",
    "--cosmos-copper":"#c98b5f"
  }))assert.equal(token(name).toLowerCase(),hex);
  assert.match(css,/--coral:var\(--cosmos-cyan\)/);
  assert.match(css,/--portal-buzz:var\(--cosmos-cyan\)/);
  assert.match(css,/--depth-shell:#14213c/);
});

test("primary text, quiet text and neon action surfaces meet AA non-large contrast",()=>{
  for(const [foreground,background,min] of [
    ["#f4f7ff","#0e1424",7],
    ["#c5d1e7","#131c31",7],
    ["#9aabc9","#131c31",4.5],
    ["#7de7e8","#131c31",4.5],
    ["#071723","#a1f3ed",7],
    ["#081221","#92f1ec",7],
    ["#0b1a2e","#a9f2ed",7]
  ])assert.ok(contrast(foreground,background)>=min,foreground+" on "+background+" contrast "+contrast(foreground,background).toFixed(2));
});

test("original orbit identity is unchanged and the star map is decorative",()=>{
  assert.match(home,/<CosmicArtwork scene="hero" priority\/>/);
  assert.match(shell,/<OrbitalMark className="brand-mark"/);
  assert.match(worlds,/aria-hidden=\{title\?undefined:true\}/);
  assert.match(heading,/<CosmicHorizon\/>/);
  assert.match(heading,/<OrbitalStage variant="heading"\/>/);
  assert.match(levels,/<CosmicHorizon\/>/);
  assert.match(levels,/<OrbitalStage variant="monument"\/>/);
  assert.match(horizon,/className="cosmic-horizon" aria-hidden="true"/);
  assert.match(horizon,/focusable="false"/);
  assert.doesNotMatch(horizon,/useEffect|fetch\(|<canvas|<video|<img|src=|data-live|Date\.now|Math\.random/);
  assert.doesNotMatch(css,/@import|url\(/i);
});

test("the visual layer styles all public journeys and keeps important accessibility states",()=>{
  for(const selector of [
    ".portal-welcome",".portal-page-heading",".levels-masthead",
    ".cosmic-horizon__chart",".site-header",".portal-navigation",
    ".project-card",".portal-channel-filters button",
    ".start-journey",".start-portal",".guide-training",
    ".guide-answer",".portal-launcher",".portal-launcher::backdrop",
    ".member-profile-art",".project-readiness",
    ".portal-shelf-empty",".portal-availability-filter"
  ])assert.ok(css.includes(selector),selector);
  assert.match(css,/:focus-visible/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/prefers-reduced-transparency:reduce/);
  assert.match(css,/max-width:900px/);
  assert.match(css,/max-width:640px/);
  assert.match(css,/max-width:360px/);
  assert.match(css,/overflow-wrap:anywhere/);
  assert.match(css,/\.cosmic-horizon__nebula,.cosmic-horizon__chart\{animation:none!important/);
  assert.match(css, /@media \(hover:hover\) and \(pointer:fine\)/);
});

test("cosmic art adds no data claims, public submissions, or account/XP side effects",()=>{
  for(const content of [css,horizon]){
    for(const phrase of ["memberSave","awardXp","memberCreateProject","memberVote","publishedProjects:999","demoCreator","fakeCount","localStorage","sessionStorage"])
      assert.ok(!content.includes(phrase),phrase);
  }
  assert.match(home,/readStatus\(signal\)/);
  assert.match(home,/readProjects\(\{limit:"10"\}/);
  assert.match(home,/No fake projects, ratings or activity/);
});

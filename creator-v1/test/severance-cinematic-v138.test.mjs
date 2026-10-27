import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const home=read("web/src/parity/StageFocusedHomeV137.tsx");
const scene=read("web/src/parity/SeveranceWorldSceneV138.tsx");
const game=read("web/src/pages/SeverancePage.tsx");
const header=read("web/src/parity/ParityHeaderV136.tsx");
const shell=read("web/src/components/Shell.tsx");
const style=read("web/src/severance-cinematic-v138.css");
const main=read("web/src/main.tsx");
const config=read("web/vite.config.ts");
const app=read("web/src/App.tsx");

test("V138 cinematic art is authored first-party UI, not fake gameplay or an extra GPU renderer",()=>{
 assert.match(scene,/export function SeveranceWorldSceneV138/);
 assert.match(scene,/export function SeverancePlateArtV138/);
 assert.match(scene,/useId\(\)/);
 assert.match(scene,/av138-world-scene/);
 for(const kind of ["perimeter","containment","outpost","signal"])
  assert.ok(scene.includes('kind==="'+kind+'"'),"Distinct scene "+kind);
 assert.doesNotMatch(scene,/fetch\s*\(|WebGLRenderer|<canvas\b|<iframe\b|localStorage|sessionStorage|Math\.random\(|XMLHttpRequest|new Worker|https?:\/\//);
});
test("approved landing has cinematic scene, four plates and verified original catalogue",()=>{
 assert.match(home,/data-visual-pass="v138-hushwire"/);
 assert.match(home,/<SeveranceWorldSceneV138\/>/);
 assert.match(home,/<SeverancePlateArtV138 kind=\{item\.kind\}\/>/);
 assert.match(home,/No public multiplayer game or open beta is available yet/);
 assert.match(home,/ILLUSTRATIVE ART DIRECTION/);
 assert.match(home,/projects\.slice\(0,3\)/);
 assert.match(home,/<ProjectThumbnail/);
 assert.match(home,/to="\/status"/);
 assert.match(home,/to="\/studio"/);
 assert.match(home,/to="\/community"/);
 assert.doesNotMatch(home,/PLAY NOW|WATCH TRAILER|JOIN SERVER|fakeProjects|fabricatedPlayers|sampleProjects|Math\.random\(/);
});
test("Severance dossier is honest and every primary homepage destination has an anchor",()=>{
 for(const id of ["av138-sev-world","av138-sev-threats","av138-sev-people","av138-sev-archive"])
  assert.ok(game.includes('anchor:"'+id+'"'),"Missing game anchor "+id);
 assert.match(game,/data-public-playable="false"/);
 assert.match(game,/No public server, playable beta or release date is announced/);
 assert.match(game,/No public leaderboard exists before the actual game servers/);
 assert.match(game,/ILLUSTRATIVE ART DIRECTION/);
 assert.doesNotMatch(game,/PLAY NOW|startMatch\(|fakeLeaderboard|pretendServerStatus/);
 assert.match(app,/path="severance"/);
});
test("black slate red presentation is loaded above archived CSS only for intended public surfaces",()=>{
 assert.match(main,/await import\("\.\/severance-cinematic-v138\.css"\)/);
 assert.match(config,/!id\.includes\("\/src\/severance-cinematic-v138\.css"\)/);
 for(const selector of [
  ".av138-hero",".av138-gallery",".av138-plate-grid",".av138-development",
  ".av138-sev-hero",".av138-sev-mechanic-grid",".p136-header",".p136-console-wayfinder"
 ])assert.ok(style.includes(selector),selector);
 assert.doesNotMatch(style,/@import\s+url|@font-face|url\(\s*['"]?https?:/);
 for(const breakpoint of ["max-width:1240px","max-width:820px","max-width:600px","max-width:350px","prefers-reduced-motion:reduce","forced-colors:active"])
  assert.ok(style.includes(breakpoint),breakpoint);
 assert.match(header,/INDEPENDENT SOFTWARE STUDIO/);
 assert.match(header,/className="av138-header-status"/);
 assert.match(shell,/scrollIntoView\(\{block:"start",behavior:"instant"\}\)/);
});

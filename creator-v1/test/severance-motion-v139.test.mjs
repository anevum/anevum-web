import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const media=read("web/src/parity/SeveranceCinematicV139.tsx");
const scroll=read("web/src/parity/SeveranceScrollSequenceV139.tsx");
const home=read("web/src/parity/StageFocusedHomeV137.tsx");
const game=read("web/src/pages/SeverancePage.tsx");
const css=read("web/src/severance-motion-v139.css");
const main=read("web/src/main.tsx");
const vite=read("web/vite.config.ts");
const encoder=read("graphics/encode-severance-v139.py");

test("V139 cinematic loop is first-party and never blocks usable React controls",()=>{
 assert.match(media,/export function SeveranceCinematicV139/);
 assert.match(media,/SEVERANCE_MEDIA_V139/);
 for(const file of ["hero-poster-v139.webp","hero-motion-v139-1080p.mp4","hero-motion-v139-720p.mp4"])
  assert.ok(media.includes(file),"Local media path "+file);
 assert.match(media,/muted playsInline loop/);
 assert.match(media,/document\.visibilityState/);
 assert.match(media,/IntersectionObserver/);
 assert.match(media,/prefers-reduced-motion: reduce/);
 assert.match(media,/saveData/);
 assert.match(media,/slow-2g/);
 assert.match(media,/<SeveranceWorldSceneV138\/>/);
 assert.match(media,/onError=\{\(\)=>\{setFailed\(true\)/);
 assert.doesNotMatch(media,/https?:\/\/|fetch\(|localStorage|sessionStorage|createObjectURL|AudioContext|WebGLRenderer|<canvas/);
 assert.match(home,/<SeveranceCinematicV139\/>/);
 assert.match(game,/<SeveranceCinematicV139/);
 assert.match(home,/data-glitch-title="SEVERANCE"/);
 assert.match(game,/data-glitch-title="SEVERANCE"/);
 assert.match(game,/data-public-playable="false"/);
});
test("native scroll-scrub is bounded, progressive and never fabricates data",()=>{
 assert.match(scroll,/export function SeveranceScrollSequenceV139/);
 assert.match(scroll,/const FRAMES=48/);
 assert.match(scroll,/frames-.*mobile.*desktop/);
 assert.match(scroll,/cacheRef\.size>6/);
 assert.match(scroll,/IntersectionObserver/);
 assert.match(scroll,/prefers-reduced-motion: reduce/);
 assert.match(scroll,/saveData/);
 assert.match(scroll,/getContext\("2d"/);
 assert.match(scroll,/data-av139-scroll-sequence="cinematic"/);
 assert.match(scroll,/design concept/i);
 assert.match(home,/<SeveranceScrollSequenceV139\/>/);
 assert.doesNotMatch(scroll,/WebGLRenderer|webgl2|fetch\(|XMLHttpRequest|https?:\/\//);
});
test("First-party V139 media is derived from pinned concept image before immutable build review",()=>{
 assert.match(encoder,/PINNED_SOURCE_SHA256 = "71c1bb6ca774841386857a1e8b344420d7c95fa5e1e96a6fb23dc656df005ba5"/);
 assert.match(encoder,/ffmpeg/);
 assert.match(encoder,/libx264/);
 assert.match(encoder,/hero-motion-v139-1080p\.mp4/);
 assert.match(encoder,/hero-motion-v139-720p\.mp4/);
 assert.match(encoder,/hero-poster-v139\.webp/);
 assert.match(encoder,/runtimeThirdPartyRequests":False/);
 assert.doesNotMatch(encoder,/cloudflare|wrangler deploy|AWS_ACCESS_KEY|git push/);
});
test("V139 motion style is additive to the existing responsive interface",()=>{
 assert.match(main,/await import\("\.\/severance-motion-v139\.css"\)/);
 assert.match(vite,/!id\.includes\("\/src\/severance-motion-v139\.css"\)/);
 for(const token of [
  ".av139-cinematic",".av139-film",".av139-poster",".av139-bloodlight",
  ".av139-glitch-title",".av138-plate",".p136-header",".p136-console-wayfinder",
  "prefers-reduced-motion:reduce","forced-colors:active"
 ])assert.ok(css.includes(token),"Missing V139 style token "+token);
 assert.match(css,/pointer-events:none/);
 assert.doesNotMatch(css,/@import\s+url|@font-face|url\(\s*["']?https?:/);
 assert.doesNotMatch(css,/\.p136-studio-console|\.studio-workspace-editor|button\s*\{\s*display:none/);
});

const director=read("web/src/parity/PublicDepthDirectorV140.tsx");
const shell=read("web/src/components/Shell.tsx");
test("V140 public depth is mounted and excludes private account and Studio routes",()=>{
 assert.match(shell,/PublicDepthDirectorV140 pathname=/);
 assert.match(director,/const PUBLIC_ROUTES=new Set/);
 for(const route of ['"/member"','"/studio"','"/staff"'])assert.ok(!director.includes(route));
 assert.match(director,/IntersectionObserver/);
 assert.match(director,/!paused&&motionAllowed/);
 assert.match(css,/data-av140-public="true"/);
 assert.match(css,/av140-reveal-pending/);
 assert.doesNotMatch(director,/XMLHttpRequest|localStorage|sessionStorage/);
});

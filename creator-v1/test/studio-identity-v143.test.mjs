import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const home=read("web/src/parity/StudioHomeV143.tsx");
const pages=read("web/src/pages/StudioCollectionV143.tsx");
const about=read("web/src/pages/AboutStudioPage.tsx");
const app=read("web/src/App.tsx");
const shell=read("web/src/components/Shell.tsx");
const meta=read("web/src/lib/public-page-metadata.ts");
const css=read("web/src/studio-identity-v143.css");
const main=read("web/src/main.tsx");
const vite=read("web/vite.config.ts");
const manifest=JSON.parse(read("web/public/anevum-studio-v143.webmanifest"));

test("V143 presents ANEVUM as a real independent studio",()=>{
 assert.match(home,/Original worlds/);
 assert.match(home,/family-rooted studio/);
 assert.match(home,/data-studio-identity/);
 assert.match(home,/SEVERANCE/);
 assert.match(home,/one working release at a time/);
 assert.doesNotMatch(home,/No fictional studio metrics/);
 assert.match(home,/No public play access|NO PUBLIC PLAY ACCESS/i);
 assert.doesNotMatch(home,/fakePlayers|fakeProjects|Math\.random\(|PLAY NOW|JOIN SERVER/);
 assert.match(about,/Devon Akins/);
 assert.match(about,/open-source/i);
});
test("V143 public world, game and journal routes are independently navigable",()=>{
 for(const r of ["worlds","games","journal"])assert.ok(app.includes('path="'+r+'"'),r);
 for(const r of ['to="/worlds"','to="/games"','to="/journal"'])assert.ok(home.includes(r),r);
 for(const r of ["'/worlds'","'/games'","'/journal'"])assert.ok(meta.includes(r),r);
 for(const r of ["WorldsPageV143","GamesPageV143","JournalPageV143"])assert.ok(pages.includes("function "+r),r);
 assert.match(shell,/VITE_ANEVUM_STUDIO_V143/);
});
test("V143 preserves non-public implementation boundaries",()=>{
 for(const r of ['path="member"','path="studio"','path="community"','path="library"','path="support"','path="severance"'])assert.ok(app.includes(r),r);
 assert.match(home,/ProjectThumbnail/);
 assert.match(home,/approved/);
 assert.match(home,/catalogueState/);
 assert.match(main,/studio-identity-v143\.css/);
 assert.match(home,/SeveranceCinematicV139/);
 assert.match(pages,/NOT GAMEPLAY/);
 assert.doesNotMatch(pages,/startMatch\(|connectToGame\(|fakeLeaderboard/);
});
test("V143 CSS offers mobile, motion and high-contrast variants",()=>{
 for(const v of ["max-width:800px","max-width:560px","prefers-reduced-motion:reduce","forced-colors:active"])assert.ok(css.includes(v),v);
 assert.doesNotMatch(css,/@import\s+url|@font-face|url\(\s*['"]?https?:/);
});

test("V143 authoring is reversible; site shell, brand icons and metadata are studio aware",()=>{
 assert.match(main,/dataset\.avStudio="v143"/);
 assert.match(vite,/anevum-studio-v143-build-metadata/);
 assert.match(vite,/studio-identity-v143\.css/);
 assert.match(manifest.name,/ANEVUM/);
 assert.equal(manifest.icons[0].src,"/icon-192.png");
 assert.match(shell,/activeMenuDestinations/);
 assert.match(shell,/const desktopNav = HEADER_NAV\.filter/);
});

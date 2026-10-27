import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const home=read("web/src/parity/StageFocusedHomeV137.tsx");
const game=read("web/src/pages/SeverancePage.tsx");
const about=read("web/src/pages/AboutStudioPage.tsx");
const app=read("web/src/App.tsx");
const shell=read("web/src/components/Shell.tsx");
const nav=read("web/src/lib/site-navigation.ts");
const dock=read("web/src/parity/ConsoleWayfinderV136.tsx");
const status=read("web/src/pages/StatusPage.tsx");
const metadata=read("web/src/lib/public-page-metadata.ts");
const styles=read("web/src/stage-focus-v137.css");
const vite=read("web/vite.config.ts");
const main=read("web/src/main.tsx");
const arrival=read("web/src/pages/CinematicLandingPage.tsx");

test("V137 leads with an honest first-party game and independent-studio identity",()=>{
 assert.match(home,/data-stage-focus="severance-development"/);
 assert.match(home,/INDEPENDENT SOFTWARE STUDIO/);
 assert.match(home,/TRANSCOSMIC/);
 assert.match(home,/SEVERANCE/);
 assert.match(home,/No public multiplayer game or open beta is available yet/);
 assert.match(home,/projects\.slice\(0,3\)/);
 assert.match(home,/<ProjectThumbnail/);
 assert.doesNotMatch(home,/fakeProject|fakeRatings|Math\.random\(|samplePlayers|dangerouslySetInnerHTML/);
 assert.match(arrival,/StageFocusedHomeV137/);
 assert.match(about,/independent software|independent studio/i);
});
test("Severance is represented as a development concept, not a playable release",()=>{
 assert.match(game,/data-public-playable="false"/);
 assert.match(game,/No public server, playable beta or release date is announced/);
 assert.match(game,/server|technical prototype/i);
 assert.doesNotMatch(game,/startMatch\(|connectToGame\(|fabricatedLeaderboard|Math\.random\(/);
});
test("Navigation is smaller but original accounts, Studio and public records still exist",()=>{
 const header=nav.split("export const HEADER_NAV:readonly HeaderDestination[]=[")[1]?.split("];")[0]||"";
 assert.deepEqual([...header.matchAll(/\{to:"([^"]+)",label:"([^"]+)",parityOnly:(true|false)\}/g)].map(m=>m[1]),
  ["/","/severance","/discover","/status"]);
 const dockLinks=dock.split("const stations=[")[1]?.split("] as const")[0]||"";
 assert.deepEqual([...dockLinks.matchAll(/to:'([^']+)'/g)].map(m=>m[1]),
  ["/","/severance","/discover","/status"]);
 for(const p of ['path="severance"','path="about"','path="studio"','path="studio/packages"','path="community"','path="library"','path="member"','path="levels"','path="recognition"','path="support"'])
  assert.ok(app.includes(p),"Existing route preserved: "+p);
 for(const link of ['to:"/community"','to:"/studio"','to:"/library"','to:"/about"','to:"/creators"'])
  assert.ok(shell.includes(link),"Drawer utility preserved: "+link);
 assert.ok(shell.includes('"/severance","/about"'));
});
test("Status remains genuine, presentation is responsive and build-layer-safe",()=>{
 assert.match(status,/readStatus\(signal\)/);
 assert.match(status,/Prove Severance multiplayer/);
 assert.match(metadata,/'\/severance'/);
 assert.match(metadata,/'\/about'/);
 assert.match(main,/stage-focus-v137\.css/);
 assert.match(vite,/!id\.includes\("\/src\/stage-focus-v137\.css"\)/);
 for(const token of ["@media(max-width:760px)","@media(max-width:420px)","prefers-reduced-motion:reduce","forced-colors:active"])
  assert.ok(styles.includes(token),token);
 assert.doesNotMatch(styles,/@import\s+url|@font-face|url\(https?:/);
 assert.match(styles,/\.p136-hero\.av137-stage-hero/);
});

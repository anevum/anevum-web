import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const home=read("web/src/pages/CinematicLandingPage.tsx");
const css=read("web/src/first-load-experience-v114.css");
const entry=read("web/src/main.tsx");
const app=read("web/src/App.tsx");

test("V114 is the existing canonical homepage, not an alternate first-load application",()=>{
 assert.doesNotThrow(()=>parse(home,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(app,/<Route index element={<CinematicLandingPage\/>}\/>/);
 // Preserve the canonical hero while allowing additive classes and motion state.
 assert.match(home,/<section\b[^>]*className=\{?"av79-hero av114-arrival av115-arrival(?:\s|")/);
 assert.match(home,/className="av114-arrival-scene"/);
 assert.match(home,/THE CONTINUANCE INSTITUTE/);
 assert.match(home,/Find something <em>worth trying\.<\/em>/);
 assert.match(home,/className="av79-gateways av115-gateways"/);
 assert.match(home,/className="av115-iren-console"/);
 assert.match(home,/className="av79-now av115-public-index"/);
 assert.doesNotMatch(home,/className="av111-onramp"|Play a game/);
 assert.match(entry,/import "\.\/home-first-contact-v111\.css"/);
 assert.match(entry,/import "\.\/first-load-experience-v114\.css"/);
 assert.match(entry,/import "\.\/first-contact-wayfinder-v115\.css"/);
 assert.ok(entry.lastIndexOf("first-load-experience-v114.css")>entry.lastIndexOf("home-first-contact-v111.css"));
 assert.doesNotMatch(home,/setTimeout|setInterval\([^)]*navigate|fullScreenIntro|<video|autoplay/);
});

test("V115 first load opens the ANEVUM universe and real IREN, not the alpha game",()=>{
 assert.match(home,/to="\/discover"/);
 assert.match(home,/Explore real projects/);
 assert.match(home,/MEET IREN/);
 assert.equal((home.match(/MEET IREN/g)||[]).length,1);
 assert.match(home,/new Event\("anevum:iren-intro"\)/);
 assert.match(home,/Free to explore\. No account required\./);
 assert.match(home,/Studio publishing is still in testing\./);
 assert.match(home,/to=\{signedIn\?"\/member":"\/join"\}/);
 assert.match(home,/readProjects\(\{limit:"32"\},signal\)/);
 assert.match(home,/const firstLook=projects\[0\]\|\|null/);
 assert.doesNotMatch(home,/Play a game|FEATURED RELEASE|const firstGame=/);
 assert.doesNotMatch(home,/sampleProject|sampleUser|Math\.random|fakeActivity|fakeRatings|placeholderUsers|dangerouslySetInnerHTML/);
});

test("V114 paints the catalogue without waiting for optional metadata requests",()=>{
 assert.match(home,/const portal=useResource\(async signal=>/);
 assert.match(home,/const projectResponse=await readProjects\({limit:"32"},signal\)/);
 assert.match(home,/const metadata=useResource\(async signal=>/);
 assert.match(home,/Promise\.allSettled\(/);
 assert.match(home,/readStatus\(signal\)/);
 assert.match(home,/readCreators\({limit:"8"},signal\)/);
 assert.match(home,/status:statusResult\.status==="fulfilled"\?statusResult\.value:null/);
 assert.match(home,/creators:creatorResult\.status==="fulfilled"\?creatorResult\.value\.items:\[\]/);
 assert.match(home,/metadata\.state==="ready"\?metadata\.data\.creators/);
 assert.match(home,/verified&&status\?String\(status\.counts\.publishedProjects\)/);
 assert.match(home,/const firstLook=projects\[0\]\|\|null/);
});

test("V114 is responsive, motion-conscious, accessible and asset-free for fast first paint",()=>{
 for(const token of [
  ".av114-arrival-scene",".av114-arrival-planet",".av114-arrival-ring",
  ".av114-arrival-clarity","@media(max-width:900px)",
  "@media(max-width:650px)","@media(max-width:380px)",
  "@media(prefers-reduced-motion:reduce)","@media(forced-colors:active)"
 ])assert.ok(css.includes(token),token);
 assert.match(home,/aria-labelledby="av79-home-heading"/);
 assert.match(home,/aria-hidden="true"/);
 assert.match(home,/aria-label="Visitor access and creator publishing status"/);
 assert.doesNotMatch(css,/@import|url\(|https?:\/\/|background-image:\s*url/);
 assert.doesNotMatch(home,/localStorage|sessionStorage|staffGrant|grantReward|publishProject|memberCreate/);
});

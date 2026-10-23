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
 assert.match(home,/className="av79-hero av114-arrival"/);
 assert.match(home,/className="av114-arrival-scene"/);
 assert.match(home,/THE CONTINUANCE INSTITUTE/);
 assert.match(home,/Create beyond <em>worlds\.<\/em>/);
 assert.match(home,/className="av79-gateways"/);
 assert.match(home,/className="av111-onramp"/);
 assert.match(home,/className="av79-feature"/);
 assert.match(entry,/import "\.\/home-first-contact-v111\.css"/);
 assert.match(entry,/import "\.\/first-load-experience-v114\.css"/);
 assert.ok(entry.lastIndexOf("first-load-experience-v114.css")>entry.lastIndexOf("home-first-contact-v111.css"));
 assert.doesNotMatch(home,/setTimeout|setInterval\([^)]*navigate|fullScreenIntro|<video|autoplay/);
});

test("V114 keeps immediate user actions and never represents testing as public publishing",()=>{
 assert.match(home,/to={firstGame\|\|"\/discover\?category=games"}/);
 assert.match(home,/to="\/discover"/);
 assert.match(home,/Explore freely\. No account required\./);
 assert.match(home,/Creator publishing is still in testing\./);
 assert.match(home,/to={signedIn\?"\/member":"\/join"}/);
 assert.match(home,/new Event\("anevum:iren-tour"\)/);
 assert.match(home,/readProjects\({limit:"32"},signal\)/);
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
 assert.match(home,/const featured=games\[0\]\|\|projects\[0\]\|\|null/);
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

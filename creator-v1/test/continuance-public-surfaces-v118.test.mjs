import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "@babel/parser";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const switcher=read("web/src/components/ContinuanceWorkspaceSwitchV118.tsx");
const css=read("web/src/continuance-public-surfaces-v118.css");
const discover=read("web/src/pages/DiscoverPage.tsx");
const community=read("web/src/pages/CommunityPage.tsx");
const app=read("web/src/App.tsx");
const iren=read("web/src/components/IrenGuidedContinuance.tsx");

test("V118 shares one typed, real-route workspace component across Discover and Community",()=>{
 for(const src of [switcher,discover,community])
  assert.doesNotThrow(()=>parse(src,{sourceType:"module",plugins:["typescript","jsx"]}));
 assert.match(switcher,/export function ContinuanceWorkspaceSwitch/);
 assert.match(switcher,/type PublicWorkspace="discover"\|"community"/);
 assert.match(switcher,/to:"\/discover"/);
 assert.match(switcher,/to:"\/community"/);
 assert.match(switcher,/to:"\/studio"/);
 assert.match(switcher,/aria-current=\{item\.id===current\?"page":undefined\}/);
 assert.match(switcher,/aria-label="Switch public workspaces"/);
 assert.match(discover,/ContinuanceWorkspaceSwitch current="discover"/);
 assert.match(community,/ContinuanceWorkspaceSwitch current="community"/);
 assert.equal((discover.match(/<ContinuanceWorkspaceSwitch /g)||[]).length,1);
 assert.equal((community.match(/<ContinuanceWorkspaceSwitch /g)||[]).length,1);
 assert.match(app,/path="discover" element={<DiscoverPage\/>}/);
 assert.match(app,/path="community" element={<CommunityPage\/>}/);
});

test("V118 preserves verified public data sources and all existing search and feed controls",()=>{
 assert.match(discover,/readProjects\(/);
 assert.match(discover,/readCategories\(/);
 assert.match(discover,/setParams\(next\)/);
 assert.match(discover,/new URLSearchParams\(params\)/);
 assert.match(discover,/presentation="editorial"/);
 assert.match(discover,/const emptyVerified=/);
 assert.match(community,/readCommunityPosts/);
 assert.match(community,/readCreators/);
 assert.match(community,/readStatus/);
 assert.match(community,/aria-pressed=\{view === item\.id\}/);
 assert.match(community,/PublicMemberDirectory/);
 assert.match(community,/CommunityForums/);
 assert.doesNotMatch(switcher,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|memberCreate|publishProject|grantXP|dangerouslySetInnerHTML|Math\.random/);
});

test("V118 IREN assistance reuses the current single companion without privileged services",()=>{
 assert.match(switcher,/window\.dispatchEvent\(new Event\("anevum:iren-open"\)\)/);
 assert.match(iren,/window\.addEventListener\("anevum:iren-open",onOpen\)/);
 assert.equal((switcher.match(/anevum:iren-open/g)||[]).length,1);
 assert.doesNotMatch(switcher,/IrenGuidedContinuance|IrenLivingCanvas|createPortal|useSession|api\/v1|fetch\(/);
});

test("V118 scoped tokens and surfaces support motion, forced colors and narrow-screen accessibility",()=>{
 assert.match(switcher,/import "\.\.\/continuance-public-surfaces-v118\.css"/);
 assert.match(discover,/portal-search-hall av118-surface/);
 assert.match(community,/ch7-status av118-surface/);
 for(const token of ["--av118-ink","--av118-muted","--av118-surface","--av118-focus",
    ".av118-workspace-switch",".av118-workspace-link",".av118-workspace-iren",
    "[aria-current=\"page\"]",":focus-visible","min-height:45px",
    "@media(max-width:740px)","@media(max-width:480px)","@media(max-width:350px)",
    "@media(prefers-reduced-motion:reduce)","@media(forced-colors:active)"])
  assert.ok(css.includes(token),"Missing "+token);
 assert.doesNotMatch(css,/@import|https?:\/\/|background-image:\s*url\(|@font-face|position:\s*fixed/);
 assert.match(switcher,/aria-label="ANEVUM workspaces"/);
 assert.match(switcher,/aria-label="Open the existing IREN companion for site guidance"/);
 assert.match(switcher,/Creator Studio/);
});

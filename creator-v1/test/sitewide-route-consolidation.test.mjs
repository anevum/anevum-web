import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../../",import.meta.url));
const read=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const report=JSON.parse(execFileSync(process.execPath,["scripts/audit-sitewide-navigation.mjs","--json"],{
  cwd:root,encoding:"utf8",maxBuffer:16*1024*1024
}));

test("sitewide scanner inventories both existing applications, not just the cinematic shell",()=>{
  assert.equal(report.schema,"ANEVUM.SITEWIDE.ROUTE_AUDIT.V1");
  assert.deepEqual(report.apps.map(x=>x.name),["apex-v5","creator-v1"]);
  for (const app of report.apps) {
    assert.ok(app.sourceFiles>=35,app.name+" sources");
    assert.ok(app.routes.length>=30,app.name+" routes");
    assert.ok(app.links>0,app.name+" link references");
    assert.ok(Array.isArray(app.aliasLinks));
    assert.ok(Array.isArray(app.unresolvedLinks));
  }
  assert.ok(report.totals.staticLinks>=report.totals.canonicalLinks);
  assert.ok(report.scope.includes("Not a live link crawl"));
});

test("the Creator V1 launch, Studio, member and community routes remain registered",()=>{
  const routes=new Set(report.apps[1].routes.map(x=>x.path));
  for(const path of ["/","/severance","/about","/start","/discover","/creators","/creators/:handle",
      "/projects/:id","/community","/boards","/studio","/studio/packages",
      "/studio/:projectId","/member","/library","/join","/status"]){
    assert.ok(routes.has(path),"Missing canonical Creator destination: "+path);
  }
});

test("historic URL aliases remain navigable while visible actions go directly to Studio",()=>{
  const routes=new Set(report.apps[1].routes.map(x=>x.path));
  for(const path of ["/create","/create/:projectId","/account/studio","/atlas/*"]){
    assert.ok(routes.has(path),"Missing backwards-compatible route: "+path);
  }
  const shell=read("creator-v1/web/src/components/Shell.tsx");
  const navigation=read("creator-v1/web/src/lib/site-navigation.ts");
  const launcher=read("creator-v1/web/src/lib/portal-destinations.ts");
  assert.ok(shell.includes('{to:"/studio",label:"Creator Studio"'));
  assert.doesNotMatch(shell,/to:"\/create",label:"Create"/);
  assert.ok(navigation.includes('{key:"studio",label:"Creator Studio",to:"/studio"'));
  assert.doesNotMatch(navigation,/key:"atlas",label:"Atlas",to:"\/atlas"/);
  assert.ok(launcher.includes('id:"create",title:"Creator Workspace"'));
  assert.ok(launcher.includes('path:"/studio",category:"Account",icon:"create"'));
});

test("existing V5 public records, member privacy and legacy RHEN routes remain registered",()=>{
  const routes=new Set(report.apps[0].routes.map(x=>x.path));
  for(const path of ["/","/products","/updates","/field-notes",
     "/privacy","/terms","/me/settings","/command/rhen/*",
     "/products/rhen/releases","/live","/research"]){
    assert.ok(routes.has(path),"Missing V5 route: "+path);
  }
});

test("static scanner does not mistake catch-all fallback or Worker-owned paths for missing React pages",()=>{
  for(const app of report.apps){
    assert.ok(app.routes.some(x=>x.path==="/*"),app.name+" must retain explicit fallback");
    assert.ok(app.unresolvedLinks.every(x=>x.file&&x.line>=0&&x.target.startsWith("/")));
    assert.ok(app.alternateOwnerLinks.every(x=>x.verification==="HOSTED_CHECK_REQUIRED"&&x.evidence));
  }
  assert.equal(report.totals.unresolvedLinks,0,"All previously seen source targets must be classified or triaged");
  assert.equal(report.totals.alternateOwnerLinks,11,"Keep explicit off-app Worker/static ownership accountable");
  const ownerPaths=new Set(report.apps.flatMap(x=>x.alternateOwnerLinks.map(y=>y.target)));
  for(const path of ["/devon-akins-resume.pdf","/upload","/upload/v3","/staff","/portfolio/"]){
    assert.ok(ownerPaths.has(path),"Missing external-owner coverage: "+path);
  }
});

test("creator entry points and profile-completion links open their real destination screens",()=>{
  const creators=read("creator-v1/web/src/pages/CreatorsPage.tsx");
  const memberGate=read("creator-v1/web/src/components/MemberGate.tsx");
  const composer=read("creator-v1/web/src/pages/CommunityPostEditorPage.tsx");
  const dashboard=read("creator-v1/web/src/components/MemberSpaceDashboard.tsx");
  assert.ok(creators.includes('action={{to:"/studio",label:"MAKE YOUR FIRST PROJECT"}}'));
  assert.ok(creators.includes('<Link to="/studio" className="portal-sidebox-link">'));
  assert.ok(memberGate.includes('<NavLink to="/studio">CREATOR STUDIO</NavLink>'));
  assert.ok(memberGate.includes('<NavLink to="/member?tab=profile">EDIT PROFILE</NavLink>'));
  assert.ok(composer.includes('<Link to="/member?tab=profile">EDIT CREATOR PROFILE'));
  assert.ok(dashboard.includes("'profile'"));
  assert.ok(dashboard.includes("const [params,setParams]=useSearchParams()"));
});

test("both headers share the same canonical destinations; member profile opens its real editor tab",()=>{
 const nav=read("creator-v1/web/src/lib/site-navigation.ts");
 const shell=read("creator-v1/web/src/components/Shell.tsx");
 const header=read("creator-v1/web/src/parity/ParityHeaderV136.tsx");
 const list=nav.split("export const HEADER_NAV:readonly HeaderDestination[]=[")[1]
   ?.split("];")[0]||"";
 const entries=[...list.matchAll(/\{to:"([^"]+)",label:"([^"]+)",parityOnly:(true|false)\}/g)]
   .map(match=>({to:match[1],label:match[2],parityOnly:match[3]==="true"}));
 assert.deepEqual(entries,[
  {to:"/",label:"Home",parityOnly:false},
  {to:"/severance",label:"Severance",parityOnly:false},
  {to:"/discover",label:"Discover",parityOnly:false},
  {to:"/status",label:"Status",parityOnly:false}
 ]);
 assert.match(shell,/const desktopNav = HEADER_NAV\.filter\(item=>!item\.parityOnly\)/);
 assert.match(header,/HEADER_NAV\.map\(\(\{to,label\}\)=>/);
 assert.match(nav,/key:"profile",label:"Profile Settings",to:"\/member\?tab=profile"/);
 assert.match(nav,/to==="\/member\?tab=profile"/);
});

import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,rmSync,readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {spawnSync} from "node:child_process";
import api from "../api/worker.mjs";
import {database,helper} from "./db.mjs";

const dir=mkdtempSync(tmpdir()+"/anevum-boards-"),dbPath=dir+"/fixture.db";
const init=spawnSync("python",[helper,dbPath,"init"],{encoding:"utf8"});
assert.equal(init.status,0,init.stderr);
const env={COMMUNITY_DB:database(dbPath)};
test.after(()=>rmSync(dir,{recursive:true,force:true}));
const call=(path,method="GET",e=env)=>api.fetch(new Request("https://next.anevum.com"+path,{method}),e);
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("public boards expose ONLY approved, active-creator, already published work",async()=>{
  const response=await call("/api/v1/boards");
  assert.equal(response.status,200);
  const board=await response.json();
  assert.equal(board.source,"approved-public-projects");
  assert.equal(board.qualityRankingAvailable,false);
  assert.deepEqual(board.latestReleases.map(x=>x.id),["i","h","g","a"]);
  assert.deepEqual(board.firstLooks,[]);
  assert.deepEqual(board.publishingCreators,[{handle:"fixture",displayName:"Fixture Creator",publishedProjects:4}]);
  for(const item of board.latestReleases){
    for(const privateColumn of ["owner_member_id","member_id","is_staff","status","email"])
      assert.equal(Object.hasOwn(item,privateColumn),false,privateColumn);
    assert.equal(item.demoUrl,null);
  }
  for(const title of ["Private draft","Suspended owner","Future release","Missing timestamp","Archived release"])
    assert.ok(!JSON.stringify(board).includes(title),title);
  assert.doesNotMatch(JSON.stringify(board),/member-private-1|member-private-2/);
});

test("first-look exposure is limited to a creator with ONE currently approved release",async()=>{
  const mutate=`import sqlite3,sys
db=sqlite3.connect(sys.argv[1])
db.execute("INSERT INTO creator_profiles VALUES (?,?,?,?,?)", ("new-maker","fresh_one","Fresh One","active",0))
db.execute("INSERT INTO projects VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", ("new1","new-maker","new1","First Authentic Test Release","Original test release.","Reviewable content.","creative","published",None,"https://example.com",1,None,"2026-10-01",None,None))
db.execute("INSERT INTO projects VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", ("new2","new-maker","new2","Private Second Draft","Not public.","Private content.","tools","draft",None,None,1,None,"2026-10-01",None,None))
db.commit()`;
  const result=spawnSync("python",["-c",mutate,dbPath],{encoding:"utf8"});
  assert.equal(result.status,0,result.stderr);
  const res=await call("/api/v1/boards"),data=await res.json();
  assert.equal(res.status,200);
  assert.deepEqual(data.firstLooks.map(x=>x.id),["new1"]);
  assert.ok(!JSON.stringify(data).includes("Private Second Draft"));
  assert.equal(data.publishingCreators[0].handle,"fixture");
  assert.equal(data.publishingCreators[1].handle,"fresh_one");
});

test("boards are read-only, reject parameters, preserve HEAD and fail closed without D1",async()=>{
  assert.equal((await call("/api/v1/boards?limit=200")).status,400);
  assert.equal((await call("/api/v1/boards?quality=true")).status,400);
  const head=await call("/api/v1/boards","HEAD");
  assert.equal(head.status,200);
  assert.equal(await head.text(),"");
  assert.equal((await call("/api/v1/boards","POST")).status,405);
  assert.equal((await call("/api/v1/boards","GET",{})).status,503);
  const broken={COMMUNITY_DB:{prepare(){throw Error("private database secret")}}};
  const failed=await call("/api/v1/boards","GET",broken);
  assert.equal(failed.status,503);
  assert.ok(!(await failed.text()).includes("secret"));
});

test("React includes genuine board and approved-post routes, no fake ranking signals",()=>{
  const app=read("web/src/App.tsx");
  const api=read("web/src/lib/api.ts");
  const page=read("web/src/pages/PublicBoardsPage.tsx");
  const thread=read("web/src/pages/CommunityPostPage.tsx");
  const shell=read("web/src/pages/AtlasMorphPage.tsx");
  const home=read("web/src/pages/MorphHomeConsole.tsx");
  const forum=read("web/src/pages/HotCommunityPosts.tsx");
  const css=read("web/src/pages/community-network.css");
  const community=read("web/src/pages/CommunityPage.tsx");
  assert.match(app,/path="boards" element={<Suspense/);
  assert.match(app,/path="community\/posts\/:id" element={<CommunityPostPage\/>}/);
  assert.match(shell,/pathname\.startsWith\("\/atlas\/boards"\)/);
  assert.match(shell,/"community","boards","create"/);
  assert.match(home,/to="\/atlas\/boards"/);
  assert.match(community,/HotCommunityPosts/);
  assert.match(community,/OPEN BOARDS/);
  assert.match(forum,/\/community\/posts\//);
  assert.match(api,/readPublicBoards/);
  assert.match(api,/readCommunityPost/);
  assert.match(page,/readPublicBoards\(signal\)/);
  assert.match(page,/QUALITY MUST BE/);
  assert.match(page,/quality or popularity leaderboards/);
  assert.match(thread,/readCommunityPost\(id,signal\)/);
  assert.match(thread,/item\.body/);
  assert.match(thread,/replies\.map/);
  assert.match(css,/@media\(max-width:640px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(page+thread,/Math\.random|localStorage|grantXp\(|dangerouslySetInnerHTML|fakeUsers|fakeReviews/);
  assert.doesNotMatch(page,/likesCount|playCount|popularityScore|trustScore/);
});

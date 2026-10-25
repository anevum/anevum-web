import test from "node:test";
import assert from "node:assert/strict";
import {safeReturnPath,projectDetailPath,cursorRoute,creatorChannelPath,creatorDirectoryReturnPath} from "../web/src/lib/navigation.ts";

test("only whitelisted public routes survive return-path sanitization",()=>{
  assert.equal(safeReturnPath("/"),"/");
  assert.equal(safeReturnPath("/community"),"/community");
  assert.equal(safeReturnPath("/start"),"/start");
  assert.equal(safeReturnPath("/discover?q=forest&free=1"),"/discover?q=forest&free=1");
  assert.equal(safeReturnPath("/discover?category=games&free=0"),"/discover?category=games");
  assert.equal(safeReturnPath("/discover?q=tree&category=games&cursor=abc_99"),"/discover?q=tree&category=games&cursor=abc_99");
  assert.equal(safeReturnPath("/creators?q=nova&cursor=nova"),"/creators?q=nova&cursor=nova");
  assert.equal(safeReturnPath("/creators/nova?cursor=project-1"),"/creators/nova?cursor=project-1");
  for (const attempt of ["https://evil.example","//evil.example","/\\evil.example","/api/v1/member/library","/account","/projects/hidden","/%2f%2fevil.example","/discover#fragment","/discover\r\nLocation:evil"])
    assert.equal(safeReturnPath(attempt),"/discover",attempt);
});
test("invalid cursors and unsupported query fields are stripped",()=>{
  assert.equal(safeReturnPath("/discover?q=craft&script=alert&category=tools"),"/discover?q=craft&category=tools");
  assert.equal(safeReturnPath("/creators/nova?q=someone&category=games"),"/creators/nova");
  assert.equal(safeReturnPath("/discover?cursor=bad%0Acursor"),"/discover");
  assert.equal(safeReturnPath("/discover?q=hello+world"),"/discover?q=hello+world");
  assert.equal(safeReturnPath("/discover?free=1&cursor=abc"),"/discover?free=1&cursor=abc");
  assert.equal(safeReturnPath("/discover?free=1&free=1"),"/discover?free=1");
});
test("project deep-links recover prior filtered results safely",()=>{
  const path=projectDetailPath("project_one","/discover?q=arcade&category=games&cursor=a_27");
  assert.equal(path,"/projects/project_one?from=%2Fdiscover%3Fq%3Darcade%26category%3Dgames%26cursor%3Da_27");
  assert.equal(safeReturnPath(new URL(path,"https://anevum.invalid").searchParams.get("from")),"/discover?q=arcade&category=games&cursor=a_27");
});
test("cursor controls preserve search and category context",()=>{
  const current=new URLSearchParams("q=forest&category=games&cursor=a");
  assert.equal(cursorRoute("/discover",current,"b"),"/discover?q=forest&category=games&cursor=b");
  assert.equal(cursorRoute("/discover",current,null),"/discover?q=forest&category=games");
  assert.equal(cursorRoute("/creators",new URLSearchParams("q=nov"),"nova"),"/creators?q=nov&cursor=nova");
  assert.equal(cursorRoute("/discover",new URLSearchParams("category=tools&free=1&cursor=a"),"h"),"/discover?category=tools&free=1&cursor=h");
});

test("new public browse layouts and Commons filters survive project round trips",()=>{
  for (const route of [
    "/discover?q=orbit&category=games&free=1&view=list&cursor=page_2",
    "/creators?q=nova&view=list&cursor=nova",
    "/community?view=projects&category=games",
    "/community?view=conversations&sort=hot",
    "/community?view=people&q=Nova"
  ]) {
    const path=projectDetailPath("published_project",route);
    assert.equal(safeReturnPath(new URL(path,"https://anevum.invalid").searchParams.get("from")),route);
  }
});

test("return context remains route-scoped and cannot forward private or arbitrary queries",()=>{
  assert.equal(safeReturnPath("/discover?view=private&sort=hot&token=secret"),"/discover");
  assert.equal(safeReturnPath("/creators/nova?view=list&q=secret"),"/creators/nova");
  assert.equal(safeReturnPath("/community?view=projects&category=private&sort=hot&q=secret&token=secret"),"/community?view=projects");
  assert.equal(safeReturnPath("/community?view=people&q=bad%0Aquery&category=games"),"/community?view=people");
  assert.equal(safeReturnPath("/community?view=people&q="+"x".repeat(73)),"/community?view=people");
  assert.equal(safeReturnPath("/community?view=conversations&sort=private"),"/community?view=conversations");
  assert.equal(safeReturnPath("/community?view=unknown&q=secret"),"/community");
});

test("directory context survives channel and project return without accepting nested/private targets",()=>{
  const directory="/creators?q=Nova&view=list&cursor=page_2";
  const channel=creatorChannelPath("nova",directory);
  assert.equal(creatorDirectoryReturnPath(new URL(channel,"https://anevum.invalid").searchParams.get("from")),directory);
  const project=projectDetailPath("published_project",channel);
  assert.equal(safeReturnPath(new URL(project,"https://anevum.invalid").searchParams.get("from")),channel);
  for(const unsafe of ["https://evil.example/creators","//evil.example/creators","/account","/creators/nova?from=/account","/creators#private"])
    assert.equal(creatorDirectoryReturnPath(unsafe),"/creators");
  assert.equal(safeReturnPath("/creators/nova?from=%2Faccount"),"/creators/nova");
  assert.equal(creatorDirectoryReturnPath("/creators?token=secret&view=list"),"/creators?view=list");
});

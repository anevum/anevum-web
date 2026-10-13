import test from "node:test";
import assert from "node:assert/strict";
import {safeReturnPath,projectDetailPath,cursorRoute} from "../web/src/lib/navigation.ts";

test("only whitelisted public routes survive return-path sanitization",()=>{
  assert.equal(safeReturnPath("/"),"/");
  assert.equal(safeReturnPath("/community"),"/community");
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
});

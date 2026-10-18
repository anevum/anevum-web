import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {publicCreatorHandle} from "../web/src/lib/public-creator-handle.ts";

test("approved alpha project without a creator channel cannot crash a public feed", () => {
  const singleDrift={title:"Single Drift",creatorHandle:null,creatorName:"ANEVUM member"};
  assert.equal(publicCreatorHandle(singleDrift.creatorHandle),null);
  assert.equal(singleDrift.creatorName,"ANEVUM member");
});

test("public creator identity never invents a channel from unavailable or malformed handles", () => {
  for(const value of [null,undefined,0,{},[],false,"","null","undefined","ab","%2F","test space","/creators/devon","@devon"])
    assert.equal(publicCreatorHandle(value),null,String(value));
  assert.equal(publicCreatorHandle("devon"),"devon");
  assert.equal(publicCreatorHandle(" Devon_Akins "),"devon_akins");
});

test("homepage cannot lowercase a nullable creator handle before validation", () => {
  const source=readFileSync(new URL("../web/src/components/CommunityHomeFeed.tsx",import.meta.url),"utf8");
  assert.ok(source.includes("publicCreatorHandle(project.creatorHandle)"));
  assert.ok(source.includes("Public creator channel not linked."));
  assert.ok(!source.includes("item.value.creatorHandle).toLowerCase()"));
  assert.ok(!source.includes("project.creatorHandle.toLowerCase()"));
});

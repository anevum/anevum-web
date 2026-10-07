import test from "node:test";
import assert from "node:assert/strict";
import {shadowRead} from "../shadow-transport.mjs";

test("shadow reads preserve authenticated upstream status without returning provider bodies", async()=>{
  const result=await shadowRead("https://observer.example","/snapshot","secret",async(url,init)=>{
    assert.equal(url,"https://observer.example/snapshot");
    assert.equal(init.headers.Authorization,"Bearer secret");
    assert.equal(init.redirect,"error");
    return new Response("private provider error",{status:503});
  });
  assert.equal(result.status,503);
  assert.equal(result.payload.error_code,"SHADOW_UPSTREAM_503");
  assert.ok(!JSON.stringify(result).includes("private provider"));
});
test("failed connection and invalid JSON are distinct frozen snapshot errors",async()=>{
  const failed=await shadowRead("https://observer.example","/snapshot","secret",async()=>{throw new Error("secret");});
  assert.equal(failed.payload.error_code,"SHADOW_FETCH_FAILED");
  const malformed=await shadowRead("https://observer.example","/snapshot","secret",async()=>new Response("<html>"));
  assert.equal(malformed.payload.error_code,"SHADOW_INVALID_JSON");
  const valid=await shadowRead("https://observer.example","/snapshot","secret",async()=>Response.json({sequence:1}));
  assert.deepEqual(valid,{status:200,payload:{sequence:1}});
});

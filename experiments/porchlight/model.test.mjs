import {test} from "node:test";
import assert from "node:assert/strict";
import {SAMPLE_HOMES, EVENT_END, isEligible, publicHost, publicDirectory} from "./model.mjs";
const before = new Date("2026-10-24T20:00:00Z");
test("only consented verified adult-approved synthetic demo listings go public", () => {
  const listed = publicDirectory(SAMPLE_HOMES, before);
  assert.deepEqual(listed.map(h=>h.id), ["S01","S02","S03","S06"]);
  assert.ok(listed.every(h=>h.synthetic===true));
});
test("private data is not in the public allowlist", () => {
  const h = {...SAMPLE_HOMES[0], residentName:"Private person", childLocation:"never", address:"42 Redacted Lane"};
  const published = publicHost(h, before);
  for(const key of ["residentName","childLocation","address","privateNote","status","verifiedByOrganizer"]){
    assert.equal(Object.hasOwn(published,key),false,key);
  }
});
test("consent withdrawal immediately removes the listing", () => {
  const revoked = {...SAMPLE_HOMES[0],consentToPublish:false};
  assert.equal(isEligible(revoked,before),false);
  assert.equal(publicHost(revoked,before),null);
});
test("organizer approval and adult attestation both required", () => {
  for(const patch of [{status:"pending"},{verifiedByOrganizer:false},{adultAttested:false},{synthetic:false}]){
    assert.equal(isEligible({...SAMPLE_HOMES[0],...patch},before),false);
  }
});
test("expiration is exact at event end", () => {
  assert.equal(isEligible(SAMPLE_HOMES[0],Date.parse(EVENT_END)-1),true);
  assert.equal(isEligible(SAMPLE_HOMES[0],Date.parse(EVENT_END)),false);
  assert.equal(publicDirectory(SAMPLE_HOMES,Date.parse(EVENT_END)+1).length,0);
});
test("malformed timestamps fail closed", () => {
  assert.equal(isEligible(SAMPLE_HOMES[0],"not-a-date"),false);
});

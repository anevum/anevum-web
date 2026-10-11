import test from "node:test";
import assert from "node:assert/strict";
import { verifiedProfileName } from "../src/member/profile-settings.ts";

const profile = (id, displayName) => ({ user: { id }, profile: { displayName, theme: "system" } });

test("settings project only the editable name for the authenticated member", () => {
  assert.equal(verifiedProfileName(profile("alpha", "Alpha member"), "alpha"), "Alpha member");
  assert.equal(verifiedProfileName(profile("beta", "Beta member"), "beta"), "Beta member");
  const value = { ...profile("alpha", "Alpha member"), unrelated: { secret: "discarded" } };
  assert.equal(verifiedProfileName(value, "alpha"), "Alpha member");
});

test("settings reject cross-member, missing and malformed profile data without echoing it", () => {
  for (const value of [null, [], {}, profile("beta", "Other member private name"), profile("alpha", null),
    profile("alpha", 7), profile("alpha", { name: "Private" }), profile("alpha", "  "), { user: { id: "alpha" } }]) {
    assert.throws(() => verifiedProfileName(value, "alpha"), error => {
      assert.equal(error.message, "The member identity could not be verified. Sign in again.");
      return true;
    });
  }
  assert.throws(() => verifiedProfileName(profile("", "Empty member ID"), ""));
});

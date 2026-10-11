import test from "node:test";
import assert from "node:assert/strict";
import { memberSignInMethods, memberGithubConfigured, memberEmailOtpConfigured, sendMemberEmailOtp } from "../src/server/member-auth-methods.mjs";
import { memberEndpoint } from "../src/server/member.mjs";
import { REQUIRED_MEMBER_TABLES } from "../src/server/member-preflight.mjs";

const emailConfig = {
  ANEVUM_EMAIL_OTP_ENABLED: "true",
  ANEVUM_AUTH_RESEND_API_KEY: "example-test-only-key",
  ANEVUM_AUTH_EMAIL_FROM: "ANEVUM <login@anevum.com>"
};
const githubConfig = {
  ANEVUM_GITHUB_OAUTH_ENABLED: "true",
  GITHUB_CLIENT_ID: "sample-id",
  GITHUB_CLIENT_SECRET: "sample-secret"
};

test("optional methods fail closed without flag and both credentials", () => {
  assert.deepEqual(memberSignInMethods({}), ["google"]);
  assert.equal(memberGithubConfigured({ ANEVUM_GITHUB_OAUTH_ENABLED: "true" }), false);
  assert.equal(memberEmailOtpConfigured({ ANEVUM_EMAIL_OTP_ENABLED: "true" }), false);
  assert.deepEqual(memberSignInMethods({ ...githubConfig, ...emailConfig }), ["google", "github", "email"]);
});

test("OTP delivery validates code format and mail provider success", async () => {
  let count = 0;
  await sendMemberEmailOtp(emailConfig, {
    email: "tester@example.org", otp: "12345678", type: "sign-in"
  }, async (_url, request) => {
    count++;
    assert.deepEqual(JSON.parse(request.body).to, ["tester@example.org"]);
    return new Response(null, { status: 202 });
  });
  assert.equal(count, 1);
  await assert.rejects(sendMemberEmailOtp(emailConfig, {
    email: "tester@example.org", otp: "bad", type: "sign-in"
  }, async () => { count++; return new Response(); }));
  assert.equal(count, 1);
});

test("login method list is server-controlled and independent of user accounts", async () => {
  const env = {
    ANEVUM_MEMBERS_ENABLED: "true",
    BETTER_AUTH_SECRET: "x".repeat(40),
    GOOGLE_CLIENT_ID: "test",
    GOOGLE_CLIENT_SECRET: "test",
    ...githubConfig, ...emailConfig,
    MEMBER_DB: { prepare: () => ({
      all: async () => ({ results: REQUIRED_MEMBER_TABLES.map(name => ({ name })) })
    }) }
  };
  const response = await memberEndpoint(new Request("https://anevum.com/api/member/auth-methods"),
    env, "/api/member/auth-methods");
  assert.deepEqual(await response.json(), { available: true, methods: ["google", "github", "email"] });
  const disabled = await memberEndpoint(new Request("https://anevum.com/api/member/auth-methods"),
    { ...env, ANEVUM_MEMBERS_ENABLED: "false" }, "/api/member/auth-methods");
  assert.deepEqual(await disabled.json(), { available: false, methods: [] });
});

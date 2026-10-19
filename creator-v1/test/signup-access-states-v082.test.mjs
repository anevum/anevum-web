import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createCanonicalStageWorker} from "../canonical-auth/worker.mjs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const worker=createCanonicalStageWorker({
 authFactory:()=>{throw new Error("Auth must stay closed while schema is unavailable");}
});
const failingDatabase=()=>({
 prepare(){throw new Error("D1 quota exceeded (7500)");},
 async batch(){return [];}
});
const env=(publicSignup="true")=>({
 ANEVUM_CANONICAL_STAGE_ENABLED:"true",
 CANONICAL_SCHEMA_APPROVED:"true",
 CANONICAL_PUBLIC_SIGNUP_ENABLED:publicSignup,
 CANONICAL_INVITED_SIGNUP_ENABLED:"false",
 CANONICAL_EMAIL_ENABLED:"true",
 CANONICAL_BETTER_AUTH_SECRET:"s".repeat(48),
 CANONICAL_RESEND_API_KEY:"r".repeat(48),
 CANONICAL_PROTECTED_EMAILS:"owner@fixture.invalid",
 MEMBER_DB:failingDatabase()
});
async function endpoint(path,settings){
 const result=await worker.fetch(new Request("https://a.anevum.com"+path),settings);
 assert.equal(result.status,200);
 return result.json();
}

test("D1 quota failure is accurately labeled unavailable while account creation remains blocked",async()=>{
 const settings=env();
 const methods=await endpoint("/api/v1/member/auth-methods",settings);
 assert.equal(methods.registration,"closed");
 assert.equal(methods.availability,"unavailable");
 assert.equal(methods.methods.email.available,false);
 assert.equal(methods.methods.passkey.available,false);
 assert.equal(methods.linking,"disabled");
 const health=await endpoint("/api/v1/member/health",settings);
 assert.equal(health.status,"closed");
 assert.equal(health.registration,"closed");
 assert.equal(health.availability,"unavailable");
});

test("intentional signup pause is distinct from a public signup outage",async()=>{
 const methods=await endpoint("/api/v1/member/auth-methods",env("false"));
 assert.equal(methods.registration,"closed");
 assert.equal(methods.availability,"closed");
 assert.equal(methods.methods.email.available,false);
});

test("V052 HD onboarding is restored and a manual retry does not bypass real OTP",()=>{
 const page=read("web/src/pages/Phase1JoinPage.tsx");
 const client=read("web/src/lib/canonical-beta.ts");
 const entry=read("web/src/main.tsx");
 assert.match(page,/ContinuanceEntryArtwork/);
 assert.doesNotMatch(page,/skyward-city\.webp/);
 assert.doesNotMatch(page,/REGISTRATION CLOSED/);
 assert.match(page,/SERVICE UNAVAILABLE/);
 assert.match(page,/REGISTRATION PAUSED/);
 assert.match(page,/setAvailabilityAttempt\(value=>value\+1\)/);
 assert.doesNotMatch(page,/setInterval\(/);
 assert.match(page,/canonicalAuthClient\.emailOtp\.sendVerificationOtp/);
 assert.match(page,/canonicalAuthClient\.signIn\.emailOtp/);
 assert.match(client,/availability\?:"ready"\|"unavailable"\|"closed"/);
 assert.match(entry,/continuance-entry-v052\.css/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { signInReturnPath } from "../src/member/beta-auth-redirect.ts";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("the only beta signup return is a hard-coded private same-site route",()=>{
  for(const query of ["?next=beta","?campaign=invite&next=beta","?next=beta&next=https://evil.example"])
    assert.equal(signInReturnPath(query),"/me/beta");
  for(const query of ["?next=studio", "?next=studio&next=https://evil.example"])
    assert.equal(signInReturnPath(query),"/studio");
  for(const query of [
    "", "?foo=bar", "?next=/me/beta", "?next=%2Fme%2Fbeta",
    "?next=https://evil.example", "?next=//evil.example",
    "?next=javascript:alert(1)", "?next=%2Fcommand%2Frhen%2Foperate",
    "?next=beta%2F..", "?next=admin", "?next=BETA", "?next=beta%20",
    "?next=https://evil.example&next=beta"
  ]) assert.equal(signInReturnPath(query),"/command");
});

test("public beta sign-in returns to the private beta checklist, standard login to Command",()=>{
  const signIn=source("src/pages/SignIn.tsx");
  const publicPage=source("src/commons/CommonsPages.tsx");
  const memberPage=source("src/pages/MemberBeta.tsx");
  assert.match(signIn,/const destination = signInReturnPath\(location\.search\)/);
  assert.match(signIn,/callbackURL: destination/);
  assert.match(signIn,/to=\{destination\}/);
  assert.match(signIn,/destination === "\/me\/beta" \? "Open beta checklist" : "Open Command"/);
  assert.match(publicPage,/to="\/sign-in\?next=beta" className="c2-text-link">Continue with Google/);
  assert.match(memberPage,/to="\/sign-in\?next=beta"/);
  assert.doesNotMatch(signIn,/callbackURL:\s*(?:location\.search|window\.location|new URLSearchParams)/);
  assert.doesNotMatch(source("src/member/beta-auth-redirect.ts"),/window\.location|new URL\(|https?:|redirectTo|returnTo/);
});

test("Google onboarding never implicitly authorizes social or brokerage access",()=>{
  const prod=JSON.parse(source("wrangler.jsonc")).vars;
  const staging=JSON.parse(source("wrangler.member-staging.jsonc")).vars;
  assert.equal(prod.ANEVUM_ALPACA_REVIEW_CONNECT_ENABLED,"false");
  assert.equal(prod.ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED,"false");
  assert.equal(staging.ANEVUM_COMMONS_SOCIAL_PILOT_ENABLED,"false");
  assert.equal(prod.ANEVUM_OWNER_PAPER_OBSERVER_ENABLED,"false");
});

test("staff sign-in returns only to fixed same-origin Studio and never grants authorization",()=>{
 const login=source("src/pages/SignIn.tsx");
 const studio=source("src/pages/StudioDashboard.tsx");
 assert.equal(signInReturnPath("?next=studio"),"/studio");
 assert.equal(signInReturnPath("?next=/studio"),"/command");
 assert.equal(signInReturnPath("?next=https://evil.example/studio"),"/command");
 assert.match(login,/destination === "\/studio" \? "Open Studio"/);
 assert.match(studio,/\/sign-in\?next=studio/);
 assert.match(studio,/viewerMemberId!==id/);
});

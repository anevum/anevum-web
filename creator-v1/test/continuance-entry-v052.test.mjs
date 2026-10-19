import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const source=read("web/src/pages/Phase1JoinPage.tsx");
const image=read("web/src/components/ContinuanceEntryArtwork.tsx");
const css=read("web/src/continuance-entry-v052.css");
const entry=read("web/src/main.tsx");

test("signup art uses crisp scalable SVG rather than magnified existing small raster",()=>{
 assert.match(source,/ContinuanceEntryArtwork/);
 assert.match(source,/av52-celestial-stage/);
 assert.doesNotMatch(source,/skyward-city\.webp/);
 assert.match(image,/viewBox="0 0 1000 1080"/);
 assert.match(image,/<radialGradient/);
 assert.match(image,/<linearGradient/);
 assert.match(image,/av52-satellite/);
 assert.match(image,/av52-planet-clip/);
 assert.match(css,/av52-universe-art/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test("sign up remains real server-driven OTP authentication, not just a visual mockup",()=>{
 assert.match(source,/useResource\(canonicalMethods,\[availabilityAttempt\]\)/);
 assert.match(source,/emailReady&&\(!requiresEmailVerification\|\|Boolean\(sessionEmail\)\)&&<form/);
 assert.match(source,/canonicalAuthClient\.emailOtp\.sendVerificationOtp/);
 assert.match(source,/canonicalAuthClient\.signIn\.emailOtp/);
 assert.match(source,/canonicalAuthClient\.signIn\.social/);
 assert.match(source,/socialReady\(method\.key\)/);
 assert.match(source,/async function requestReplacementCode\(\)/);
 assert.match(source,/requiresEmailVerification/);
 assert.match(source,/member\?\.emailVerified===true/);
 assert.doesNotMatch(source,/dangerouslySetInnerHTML/);
});
test("responsive onboarding respects 320px/mobile readability and accessible interactions",()=>{
 assert.match(css,/@media\(max-width:540px\)/);
 assert.match(css,/@media\(max-width:850px\)/);
 assert.match(css,/font-size:16px/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(source,/type="email"/);
 assert.match(source,/autoComplete="one-time-code"/);
 assert.match(source,/inputMode="numeric"/);
 assert.match(source,/aria-busy=\{busy\}/);
 assert.match(source,/role="alert"/);
 assert.match(entry,/continuance-entry-v052\.css/);
});

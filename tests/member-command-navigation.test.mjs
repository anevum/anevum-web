import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("canonical member entry is /command and /me stays as compatibility route", () => {
  const app = source("src/App.tsx");
  assert.match(app, /<Route path="\/command" element=\{<PublicExperience><Command \/><\/PublicExperience>\} \/>/);
  assert.match(app, /<Route path="\/me" element=\{<PublicExperience><MemberHome \/><\/PublicExperience>\} \/>/);
  assert.match(app, /<Route path="\/command\/rhen\/\*" element=\{<Suspense fallback=\{<Loader \/>\}><RhenTerminal \/><\/Suspense>\} \/>/);
});

test("Google callback, header and account links return members to Command", () => {
  const signIn = source("src/pages/SignIn.tsx");
  const shell = source("src/components/Shell.tsx");
  const home = source("src/pages/MemberHome.tsx");
  const settings = source("src/pages/MemberSettings.tsx");
  const rhen = source("src/pages/RhenApp.tsx");
  assert.match(signIn, /callbackURL:\s*"\/command"/);
  assert.match(signIn, /to="\/command">Open Command/);
  assert.match(shell, /session\?\.user \? "\/command" : "\/sign-in"/);
  assert.match(home, /to="\/command" aria-current="page"/);
  assert.match(home, /value\?\.command_admin === true/);
  assert.match(home, /signedIn && operator &&/);
  assert.match(home, /to="\/command\/rhen\/operate">Open RHEN Terminal/);
  assert.match(settings, /to="\/command">Back to Command/);
  assert.match(rhen, /<Link to="\/command">Command<\/Link>/);
  assert.match(rhen, /<Link to="\/command\/rhen\/operate">RHEN Terminal<\/Link>/);
  assert.doesNotMatch(rhen, /to="\/apps\/rhen\/terminal\/operate"/);
});

test("new canonical member links never change Access operator API or trading authority", () => {
  const prod = JSON.parse(source("wrangler.jsonc"));
  const stage = JSON.parse(source("wrangler.member-staging.jsonc"));
  const worker = source("worker.mjs");
  assert.equal(prod.vars.ANEVUM_MEMBERS_ENABLED, "true");
  assert.equal(prod.vars.ANEVUM_MEMBER_PREVIEW_ENABLED, "false");
  assert.equal(stage.vars.ANEVUM_MEMBERS_ENABLED, "true");
  assert.equal(stage.vars.COMMAND_LIVE_STREAM_ENABLED, "false");
  assert.match(worker, /commandCredential\(request, env\)/);
  assert.match(worker, /pathname\.startsWith\("\/api\/command\/trader\/"\)/);
});

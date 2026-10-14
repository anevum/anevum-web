import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const {parse} = require("@babel/parser");
const root = fileURLToPath(new URL("../", import.meta.url));
const get = name => readFileSync(root + "creator-v1/web/src/" + name, "utf8");
const home = get("pages/HomePage.tsx");
const rails = get("components/DashboardRails.tsx");
const css = get("dashboard-home-v003.css");
const entry = get("main.tsx");
const router = get("App.tsx");

test("Creator dashboard components are syntactically valid TSX", () => {
  for (const [path,contents] of [
    ["HomePage.tsx",home],["DashboardRails.tsx",rails]
  ]) {
    assert.doesNotThrow(
      () => parse(contents,{sourceType:"module",plugins:["typescript","jsx"]}),
      path + " failed TSX parsing"
    );
  }
});

test("site shell and member access stay authoritative", () => {
  assert.match(router,/element=\{<Shell\/>\}/);
  assert.match(router,/element=\{<MemberGate\/>\}/);
  assert.match(home,/className="cw-home av3-home"/);
  assert.match(home,/<DashboardLeftRail\/>/);
  assert.match(home,/<DashboardRightRail/);
  assert.doesNotMatch(home,/<AnevumDashboardFrame/);
  assert.doesNotMatch(rails,/fetch\(|localStorage|setInterval|submit.*post/i);
});

test("dashboard reads real published data and does not simulate community", () => {
  assert.match(home,/readStatus\(signal\)/);
  assert.match(home,/readProjects\(\{limit:"10"\},signal\)/);
  assert.match(home,/readCreators\(\{limit:"5"\},signal\)/);
  assert.match(rails,/counts\.publishedProjects/);
  assert.match(rails,/counts\.publishedCreators/);
  assert.match(rails,/loading\s*\?/);
  assert.match(rails,/Unavailable/);
  assert.doesNotMatch(rails,/12\.4K|24\.7K|1\.2K|fake|dummy.*count/i);
});

test("every dashboard route belongs to the current Creator V1 site", () => {
  for (const route of ["/","/discover","/creators","/community","/levels","/create","/start","/status","/guide","/account"]) {
    assert.ok(rails.includes('"' + route + '"'), "missing destination " + route);
  }
  assert.doesNotMatch(rails,/href="https:\/\//);
});

test("dashboard style is scoped, responsive and accessible", () => {
  assert.match(entry,/import "\.\/dashboard-home-v003\.css"/);
  assert.match(css,/\.site-shell--home \.cw-home\.av3-home/);
  assert.match(css,/@media\(max-width:880px\)/);
  assert.match(css,/@media\(max-width:600px\)/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/forced-colors:active/);
});

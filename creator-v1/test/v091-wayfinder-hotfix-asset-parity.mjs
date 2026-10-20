import assert from "node:assert/strict";
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {createHash} from "node:crypto";

const [baselineDir,candidateDir,evidenceDir]=process.argv.slice(2);
assert.ok(baselineDir&&candidateDir&&evidenceDir,"REFERENCE_CANDIDATE_EVIDENCE_REQUIRED");
const beforeHtml=readFileSync(join(baselineDir,"index.html"),"utf8");
const afterHtml=readFileSync(join(candidateDir,"index.html"),"utf8");
const liveCss="index-DU9BE5mP.css",liveJs="index-AsGe25lN.js";
assert.ok(beforeHtml.includes("/assets/"+liveCss)&&beforeHtml.includes("/assets/"+liveJs),"REFERENCE_IS_NOT_LIVE_MATCHING");
const cssNames=readdirSync(join(candidateDir,"assets")).filter(n=>/^index-[A-Za-z0-9_-]+\.css$/.test(n));
assert.equal(cssNames.length,1,"REBUILD_MUST_HAVE_ONE_CSS_ENTRY");
const candidateCss=cssNames[0];
assert.notEqual(candidateCss,liveCss,"CSS_FIX_NOT_REFLECTED_IN_HASH");
assert.ok(afterHtml.includes("/assets/"+candidateCss),"CANDIDATE_CSS_NOT_LINKED");
const jsNames=readdirSync(join(candidateDir,"assets")).filter(n=>/^index-[A-Za-z0-9_-]+\.js$/.test(n));
assert.equal(jsNames.length,1,"EXPECTED_ONE_APP_JAVASCRIPT_ENTRY");
const candidateJs=jsNames[0];
assert.ok(afterHtml.includes("/assets/"+candidateJs),"CANDIDATE_JS_NOT_LINKED");
const beforeJs=readFileSync(join(baselineDir,"assets",liveJs));
const afterJs=readFileSync(join(candidateDir,"assets",candidateJs));
const originalJsSource=beforeJs.toString("utf8");
const candidateJsSource=afterJs.toString("utf8");
const normalizedJs=candidateJsSource.replaceAll(candidateCss,liveCss);
if(normalizedJs!==originalJsSource){
  let i=0;while(i<originalJsSource.length&&i<normalizedJs.length&&originalJsSource[i]===normalizedJs[i])i++;
  console.error("JS_CHUNK_DIAGNOSTIC",JSON.stringify({
    originalName:liveJs,candidateName:candidateJs,
    oldBytes:beforeJs.length,newBytes:afterJs.length,firstMismatch:i,
    oldExcerpt:originalJsSource.slice(Math.max(0,i-100),i+180),
    newExcerpt:normalizedJs.slice(Math.max(0,i-100),i+180),
    expectedOldCss:liveCss,actualNewCss:candidateCss,
    occurrences:(candidateJsSource.split(candidateCss).length-1)
  }));
}
assert.equal(normalizedJs,originalJsSource,"APPLICATION_JS_CHANGED_BEYOND_CSS_ASSET_REFERENCE");
const oldCss=readFileSync(join(baselineDir,"assets",liveCss),"utf8");
const newCss=readFileSync(join(candidateDir,"assets",candidateCss),"utf8");
const first=".av79-navigation .ir80-wayfinder-entry";
const last=".ir87-companion{";
const firstOld=oldCss.indexOf(first),firstNew=newCss.indexOf(first);
const lastOld=oldCss.indexOf(last,firstOld),lastNew=newCss.indexOf(last,firstNew);
assert.ok(firstOld>0&&firstNew>0&&lastOld>firstOld&&lastNew>firstNew,"HELP_BLOCK_BOUNDS_NOT_FOUND");
assert.equal(newCss.slice(0,firstNew),oldCss.slice(0,firstOld),"UNRELATED_STYLES_BEFORE_HELP_CHANGED");
assert.equal(newCss.slice(lastNew),oldCss.slice(lastOld),"UNRELATED_STYLES_AFTER_HELP_CHANGED");
const help=newCss.slice(firstNew,lastNew);
assert.match(help,/grid-column:1\/-1/,"HELP_TILE_NOT_FULL_WIDTH");
assert.match(help,/@media\s*\(max-width:650px\)[\s\S]*?grid-column:2/,"PHONE_ACTION_NOT_STACKED");
assert.doesNotMatch(help,/\.ir80-wayfinder-action\{display:none/,"HELP_CTA_HIDDEN");
const hash=x=>createHash("sha256").update(x).digest("hex");
mkdirSync(evidenceDir,{recursive:true});
const result={session:"ANEVUM.WEB.PATCH.2026-10-19.004.IREN-WAYFINDER-LIVE-CSS",
 base:"2938f8d387cf08ee3de4abc32c4fabf737556597",
 referenceRun:39339804557,productionCss:liveCss,productionJs:liveJs,
 candidateCss,candidateJs,jsCssHashReferenceOnly:beforeJs.equals(afterJs)||normalizedJs===originalJsSource,jsSha256:hash(afterJs),beforeCssSha256:hash(oldCss),
 afterCssSha256:hash(newCss),cssDelta:"Only the IREN Wayfinder section; app JavaScript is unchanged except its CSS asset reference",
 accepted:true};
writeFileSync(join(evidenceDir,"asset-parity.json"),JSON.stringify(result,null,2)+"\n");
console.log("V091_IREN_HOTFIX_LIVE_BINARY_PARITY=PASS",JSON.stringify(result));

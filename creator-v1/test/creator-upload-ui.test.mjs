import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("uploader is mounted only after private project creation",()=>{
 const editor=read("web/src/pages/ProjectEditorPage.tsx");
 assert.match(editor,/project&&<CreatorAssetUploader projectId=\{project\.id\}/);
 assert.match(editor,/canEdit=\{canEdit&&!busy\}/);
});
test("uploads do not expose storage secrets, public URLs, or pretend to be published",()=>{
 const api=read("web/src/lib/member-assets.ts"),ui=read("web/src/components/CreatorAssetUploader.tsx");
 assert.match(api,/credentials:"same-origin"/);assert.match(api,/mode:"same-origin"/);
 assert.match(api,/redirect:"error"/);assert.match(api,/application\/octet-stream/);
 assert.doesNotMatch(api,/r2\.cloudflarestorage\.com|apiKey|localStorage|Bearer/);
 assert.match(ui,/They are not published, playable, or approved/);
 assert.match(ui,/!available/);
});
test("format allowlist and quotas are client preflight only",()=>{
 const policy=read("web/src/lib/upload-policy.ts");
 assert.match(policy,/png:/);assert.match(policy,/mp3:/);assert.match(policy,/pdf:/);assert.match(policy,/zip:/);
 assert.doesNotMatch(policy,/exe:|sh:|ps1:|svg:/);
});

test("private uploader drag-drop, local preview, removal, and signed-in private downloads remain gated",()=>{
  const ui=read("web/src/components/CreatorAssetUploader.tsx");
  const api=read("web/src/lib/member-assets.ts");
  assert.match(ui,/onDrop=/);
  assert.match(ui,/LOCAL PREVIEW ONLY/);
  assert.match(ui,/privateAssetDownloadUrl/);
  assert.match(ui,/removePrivateAsset/);
  assert.match(ui,/window.confirm/);
  assert.match(api,/method:"DELETE"/);
  assert.match(api,/credentials:"same-origin"/);
});

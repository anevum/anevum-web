import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("creator uploads use additive 0014 migration; existing 0007 community context retained",()=>{
  assert.match(source("auth/migrations/0014_private_creator_assets.sql"),/0014_private_creator_assets/);
  assert.equal(existsSync(new URL("../auth/migrations/0007_private_creator_assets.sql",import.meta.url)),false);
  assert.match(source("auth/migrations/0007_community_post_stream.sql"),/community_posts/);
  assert.match(source("auth/migrations/0008_community_reply_reviews.sql"),/community_reply_review_events/);
  assert.match(source("auth/migrations/0013_community_post_projects.sql"),/community_post_projects/);
});
test("private asset writes require original same-origin member security and do not intercept community routes",()=>{
  const worker=source("auth/worker.mjs");
  assert.match(worker,/creatorAssets\(req,env,member,limit,clock\(\)\)/);
  assert.match(worker,/\['POST','PUT','DELETE'\]\.includes\(req.method\)&&!checkWrite\(req\)/);
  assert.match(worker,/communityPostRoutes\(req,db,member,limit,clock\(\)\)/);
  assert.match(worker,/creatorProjects\(req,db,member,limit,clock\(\)\)/);
  assert.match(worker,/CREATOR_UPLOADS_ENABLED==='true'/);
  assert.doesNotMatch(source("web/main-worker.mjs"),/CREATOR_ASSETS|CREATOR_UPLOADS_ENABLED/);
});
test("staging preview is read-only and local previews revoke blob URLs",()=>{
  const worker=source("web/staging-path-worker.mjs");
  assert.match(worker,/Read-only staging preview/);
  assert.match(worker,/media-src blob:/);
  assert.match(worker,/frame-ancestors 'none'/);
  assert.match(source("web/src/components/CreatorAssetUploader.tsx"),/URL\.revokeObjectURL/);
});

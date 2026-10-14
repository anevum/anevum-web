import test from "node:test";
import assert from "node:assert/strict";
import {declaration,signature} from "../auth/assets-policy.mjs";
import {creatorAssets} from "../auth/assets.mjs";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("private format policy accepts four representative classes and rejects unsafe types",()=>{
 for(const x of [["a.png","image/png"],["a.mp3","audio/mpeg"],["a.pdf","application/pdf"],["a.zip","application/zip"]])
  assert.equal(declaration({name:x[0],sizeBytes:200,contentType:x[1]}).name,x[0]);
 for(const x of ["bad.svg","script.js","binary.exe","../a.pdf","a..pdf"]){
  assert.throws(()=>declaration({name:x,sizeBytes:200,contentType:"application/pdf"}));
 }
 assert.throws(()=>declaration({name:"a.zip",sizeBytes:21000000,contentType:"application/zip"}));
});
test("signature tests refuse mislabeled content",()=>{
 const rule=declaration({name:"art.png",sizeBytes:100,contentType:"image/png"});
 assert.equal(signature(new Uint8Array([137,80,78,71,13,10,26,10]),rule),true);
 assert.equal(signature(new TextEncoder().encode("<script>"),rule),false);
});
test("private upload route denies anonymous and disables unconfigured R2",async()=>{
 const id="a".repeat(32);
 const req=new Request("https://next.anevum.com/api/v1/member/projects/"+id+"/assets");
 const env={COMMUNITY_DB:{},CREATOR_UPLOADS_ENABLED:"false"};
 assert.equal((await creatorAssets(req,env,null,async()=>true,0)).status,401);
 assert.equal((await creatorAssets(req,env,{id:"x",handle:"alice"},async()=>true,0)).status,503);
});
test("staging Worker enforces authenticated owner route and same-origin writes",()=>{
 const worker=read("auth/worker.mjs"),assets=read("auth/assets.mjs"),editor=read("web/src/pages/ProjectEditorPage.tsx");
 assert.match(worker,/import \{creatorAssets\}/);
 assert.match(worker,/checkWrite\(req\)/);
 assert.match(assets,/owner_member_id=\?/);
 assert.match(assets,/private-quarantine/);
 assert.doesNotMatch(assets,/public-read|PUBLIC_BUCKET|frame-ancestors/);
 assert.match(editor,/CreatorAssetUploader/);
});

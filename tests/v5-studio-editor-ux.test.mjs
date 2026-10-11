import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {studioDraftDirty,studioDraftProblem,studioSameSavedRevision,studioMutationMatches,studioPublicStateMatches} from "../src/member/studio-editorial.ts";
import {readEditorialJson,STUDIO_BODY_BYTE_LIMIT,validSavedEditorialRow,verifiedEditorialWrite} from "../src/server/studio-integrity.mjs";
import {studioEndpoint,studioPublicEndpoint} from "../src/server/studio-content.mjs";
const ui=readFileSync(new URL("../src/pages/StudioDashboard.tsx",import.meta.url),"utf8");
const api=readFileSync(new URL("../src/server/studio-content.mjs",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/styles/commons-v5-studio.css",import.meta.url),"utf8");
const draft={kind:"UPDATE",title:"Verified development note",summary:"A detailed, honest project status update.",
 body:"A first-party update documenting what changed, why, and what remains."};
test("new editor drafts and modified entries are explicitly marked unsaved",()=>{
 assert.equal(studioDraftDirty(null,{kind:"UPDATE",title:"",summary:"",body:""}),false);
 assert.equal(studioDraftDirty(null,{...draft,title:""}),true);
 assert.equal(studioDraftDirty(draft,{...draft}),false);
 assert.equal(studioDraftDirty(draft,{...draft,body:draft.body+" Revised."}),true);
 assert.equal(studioDraftDirty(draft,{...draft,kind:"AHA"}),true);
});
test("invalid Studio drafts explain problems without submitting uncertain writes",()=>{
 assert.equal(studioDraftProblem(draft),null);
 assert.match(studioDraftProblem({...draft,title:"No"})||"",/title/);
 assert.match(studioDraftProblem({...draft,summary:"Short"})||"",/summary/);
 assert.match(studioDraftProblem({...draft,body:"Short"})||"",/body/);
 assert.match(studioDraftProblem({...draft,title:"unsafe\u0000char"})||"",/control characters/);
});
test("publish requires a saved revision and explicit consent",()=>{
 assert.match(ui,/action==="PUBLISH"&&dirty/);
 assert.match(ui,/locked\|\|!grant\.publishingEnabled\|\|dirty/);
 assert.match(ui,/window\.confirm\("Publish this entry on ANEVUM now\?"\)/);
 assert.match(ui,/studioDraftProblem\(form\)/);
 assert.match(ui,/Discard unsaved editorial changes/);
 assert.match(ui,/result\.status===400/);
 assert.match(ui,/result\.status===409/);
});
test("staff-only history validates identity and revision before rendering",()=>{
 assert.match(api,/\/history/);
 assert.match(api,/viewerMemberId:user\.id,entryId:row\.id/);
 assert.match(api,/ORDER BY revision DESC LIMIT 101/);
 assert.match(ui,/data\.viewerMemberId!==id\|\|data\.entryId!==entryId\|\|data\.entryRevision!==expectedRevision/);
 assert.match(ui,/studio-history/);
 assert.match(ui,/Publication audit history/);
 assert.match(ui,/controller\.abort\(\)/);
});
test("private preview preserves readable paragraphs without HTML injection",()=>{
 assert.match(ui,/PRIVATE PREVIEW/);
 assert.match(ui,/studio-preview-body/);
 assert.match(css,/white-space:pre-wrap/);
 assert.doesNotMatch(ui,/dangerouslySetInnerHTML/);
});

const text={kind:"UPDATE",title:"A saved development update",summary:"An accurate summary of the changes being tested.",body:"This is the complete saved article body, not a stale or partial acknowledgement."};
const entry={...text,id:"11111111-2222-4333-8444-555555555555",slug:"a-saved-development-update-11111111",status:"DRAFT",revision:1,createdAt:1000,updatedAt:1000,publishedAt:null};
const row={...text,id:entry.id,slug:entry.slug,status:"DRAFT",revision:1,created_at:1000,updated_at:1000,published_at:null,created_by_member_id:"studio-owner-0001",updated_by_member_id:"studio-owner-0001"};
const expected={action:"CREATE",id:row.id,slug:row.slug,revision:1,memberId:row.updated_by_member_id,now:1000,draft:text};
const post=(body,headers={})=>new Request("https://anevum.com/api/member/studio/entries",{method:"POST",headers:{"Content-Type":"application/json",...headers},body});

test("bounded reader accepts UTF-8 split across stream chunks",async()=>{
 const encoded=new TextEncoder().encode(JSON.stringify({body:"\u96ea\ud83c\udf32"}));
 let i=0;
 const body=new ReadableStream({pull(controller){if(i===encoded.length)controller.close();else controller.enqueue(encoded.slice(i,i+=1));}});
 const request=new Request("https://anevum.com/",{method:"POST",headers:{"Content-Type":"application/json; charset=utf-8"},body,duplex:"half"});
 assert.deepEqual(await readEditorialJson(request),{body:"\u96ea\ud83c\udf32"});
});
test("valid maximum-size Unicode and JSON escaping fit the wire bound",async()=>{
 for(const value of ["\u96ea".repeat(12000),"\\".repeat(12000),"\t".repeat(12000),"\ud800".repeat(12000)]){
  const data={...text,body:value},raw=JSON.stringify(data);
  assert.ok(new TextEncoder().encode(raw).byteLength<STUDIO_BODY_BYTE_LIMIT);
  assert.deepEqual(await readEditorialJson(post(raw)),data);
 }
});
test("wire bound measures actual bytes even when content length lies",async()=>{
 const raw=JSON.stringify({body:"\u96ea".repeat(20)});
 assert.ok(raw.length<50);assert.ok(new TextEncoder().encode(raw).byteLength>50);
 assert.equal(await readEditorialJson(post(raw,{"Content-Length":"1"}),50),null);
});
test("oversized chunked streams are cancelled without consuming the rest",async()=>{
 let cancelled=false,reads=0;
 const stream=new ReadableStream({pull(controller){reads++;controller.enqueue(new Uint8Array(16));},cancel(){cancelled=true;}},{highWaterMark:0});
 const request=new Request("https://anevum.com/",{method:"POST",headers:{"Content-Type":"application/json"},body:stream,duplex:"half"});
 assert.equal(await readEditorialJson(request,8),null);
 assert.equal(cancelled,true);assert.equal(reads,1);
});
test("malformed JSON, MIME, UTF-8, lengths and reader failures reject without throwing",async()=>{
 for(const body of ["", "[]", "null", "4", "\"text\"", "{bad"])
  assert.equal(await readEditorialJson(post(body)),null);
 assert.equal(await readEditorialJson(post("{}",{"Content-Type":"text/plain"})),null);
 for(const length of ["-1","NaN",String(STUDIO_BODY_BYTE_LIMIT+1)])
  assert.equal(await readEditorialJson(post("{}",{"Content-Length":length})),null);
 assert.equal(await readEditorialJson(post(new Uint8Array([0xc3,0x28]))),null);
 assert.equal(await readEditorialJson(post("{}"),0),null);
 const broken=new ReadableStream({start(controller){controller.error(Error("interrupted"));}});
 assert.equal(await readEditorialJson(new Request("https://anevum.com/",{method:"POST",headers:{"Content-Type":"application/json"},body:broken,duplex:"half"})),null);
 const consumed=post("{}");await consumed.text();assert.equal(await readEditorialJson(consumed),null);
});
test("persisted record validation rejects malformed identity, times and publication state",()=>{
 assert.equal(validSavedEditorialRow(row),true);
 for(const mutation of [{id:"bad-id"},{slug:"../draft"},{body:"short"},{kind:"BROKER"},{status:"UNKNOWN"},{revision:0},{revision:1.5},{created_at:-1},{updated_at:999},{published_at:1000},{status:"PUBLISHED",published_at:null},{status:"PUBLISHED",published_at:999},{status:"PUBLISHED",published_at:1001}])
  assert.equal(validSavedEditorialRow({...row,...mutation}),false,JSON.stringify(mutation));
});
test("CREATE acknowledgement requires exact persisted actor, content, identity and revision",()=>{
 assert.equal(verifiedEditorialWrite(row,expected),true);
 for(const mutation of [{id:"11111111-2222-4333-8444-666666666666"},{slug:"another-slug"},{title:"A different stored title"},{summary:text.summary+" Changed."},{body:text.body+" Changed."},{revision:2},{created_by_member_id:"different-owner"},{updated_by_member_id:"different-owner"},{updated_at:1001},{created_at:999},{status:"ARCHIVED"}])
  assert.equal(verifiedEditorialWrite({...row,...mutation},expected),false,JSON.stringify(mutation));
 assert.equal(verifiedEditorialWrite(null,expected),false);
 assert.equal(verifiedEditorialWrite(row,{...expected,action:"DELETE"}),false);
});
test("EDIT and state transitions acknowledge only the exact resulting version",()=>{
 for(const [action,status] of [["EDIT","DRAFT"],["PUBLISH","PUBLISHED"],["UNPUBLISH","DRAFT"],["ARCHIVE","ARCHIVED"]]){
  const next={...row,revision:2,status,updated_at:1001,published_at:action==="PUBLISH"?1001:null};
  const expectation={...expected,action,revision:2,now:1001};
  assert.equal(verifiedEditorialWrite(next,expectation),true,action);
  assert.equal(verifiedEditorialWrite({...next,revision:3},expectation),false,action);
  assert.equal(verifiedEditorialWrite({...next,updated_by_member_id:"another-staff"},expectation),false,action);
 }
});
test("publish preflight compares every saved field, not only the revision",()=>{
 assert.equal(studioSameSavedRevision(entry,{...entry}),true);
 for(const key of Object.keys(entry)){
  const altered={...entry,[key]:typeof entry[key]==="number"?entry[key]+1:String(entry[key])+"changed"};
  assert.equal(studioSameSavedRevision(entry,altered),false,key);
 }
});
test("client CREATE and EDIT receipts match normalized submitted content",()=>{
 assert.equal(studioMutationMatches(entry,"CREATE",null,{...text,title:"  "+text.title+"  "}),true);
 assert.equal(studioMutationMatches({...entry,body:text.body+" Wrong."},"CREATE",null,text),false);
 assert.equal(studioMutationMatches({...entry,revision:2},"CREATE",null,text),false);
 const next={...entry,revision:2,updatedAt:1001,title:"A revised saved development update"};
 assert.equal(studioMutationMatches(next,"EDIT",entry,{...text,title:next.title}),true);
 assert.equal(studioMutationMatches(next,"EDIT",entry,text),false);
});
test("client state-transition receipts preserve the original article and immutable fields",()=>{
 for(const action of ["PUBLISH","UNPUBLISH","ARCHIVE"]){
  const current=action==="UNPUBLISH"?{...entry,status:"PUBLISHED",publishedAt:1000}:entry;
  const next={...entry,revision:2,updatedAt:1001,status:action==="PUBLISH"?"PUBLISHED":action==="ARCHIVE"?"ARCHIVED":"DRAFT",publishedAt:action==="PUBLISH"?1001:null};
  assert.equal(studioMutationMatches(next,action,current,text),true,action);
  for(const mutation of [{revision:3},{slug:"changed-slug"},{createdAt:999},{body:text.body+" Changed."},{publishedAt:1002},{updatedAt:999}])
   assert.equal(studioMutationMatches({...next,...mutation},action,current,text),false,action+JSON.stringify(mutation));
 }
});
test("publish success requires exact anonymous article content",()=>{
 const published={...entry,status:"PUBLISHED",revision:2,publishedAt:1001,updatedAt:1001};
 const publicEntry={slug:published.slug,kind:published.kind,title:published.title,summary:published.summary,body:published.body,publishedAt:published.publishedAt};
 const response={schemaVersion:"anevum.studio.v1",entry:publicEntry};
 assert.equal(studioPublicStateMatches("PUBLISH",200,response,published),true);
 for(const field of Object.keys(publicEntry))
  assert.equal(studioPublicStateMatches("PUBLISH",200,{...response,entry:{...publicEntry,[field]:null}},published),false,field);
 for(const status of [302,403,404,503])assert.equal(studioPublicStateMatches("PUBLISH",status,response,published),false);
});
test("unpublish success requires the specific not-found response, not an outage or denial",()=>{
 assert.equal(studioPublicStateMatches("UNPUBLISH",404,{message:"Publication not found."},entry),true);
 for(const [status,data] of [[403,{message:"Forbidden"}],[503,{message:"Publication unavailable."}],[404,{message:"Route missing"}],[200,{entry}],[404,null],[404,"Not found"]])
  assert.equal(studioPublicStateMatches("UNPUBLISH",status,data,entry),false);
});

const owner={id:"studio-owner-0001",email:"anevum.studio@gmail.com",emailVerified:true};
const environment={ANEVUM_STUDIO_ENABLED:"true",ANEVUM_STUDIO_PUBLISH_ENABLED:"false",
 ANEVUM_STUDIO_OWNER_MEMBER_ID:owner.id,ANEVUM_STUDIO_ACCESS_EMAILS:owner.email};
function integrityStore(initial=row,corrupt=value=>value){
 let saved=initial,batches=0;
 const statement=(sql,args=[])=>({sql,args,bind(...values){return statement(sql,values);},
  async all(){if(sql.includes("sqlite_master"))return {results:[{name:"studio_entries"},{name:"studio_entry_events"}]};throw Error("Unexpected read");},
  async first(){if(sql.startsWith("SELECT * FROM studio_entries WHERE id=?"))return saved;
   if(sql.startsWith("SELECT slug,kind,title,summary,body,published_at"))return saved?.status==="PUBLISHED"?saved:null;
   throw Error("Unexpected row read");}});
 return {get batches(){return batches;},db:{prepare:sql=>statement(sql),async batch(statements){
  batches++;
  assert.match(statements[0].sql,/^INSERT INTO studio_entries/);
  const [id,slug,kind,title,summary,body,created_by_member_id,updated_by_member_id,created_at,updated_at]=statements[0].args;
  saved=corrupt({id,slug,kind,title,summary,body,created_by_member_id,updated_by_member_id,created_at,updated_at,status:"DRAFT",revision:1,published_at:null});
  return [{meta:{changes:1}},{meta:{changes:1}}];}}};
}
test("saved-revision GET requires staff binding and a matching active member",async()=>{
 const store=integrityStore(),path="/api/member/studio/entries/"+entry.id;
 const get=(member=owner,header=owner.id)=>studioEndpoint(new Request("https://anevum.com"+path,{headers:{"X-ANEVUM-EXPECTED-MEMBER-ID":header}}),
  {...environment,MEMBER_DB:store.db},member,"https://anevum.com",path,member.email);
 const allowed=await get();assert.equal(allowed.status,200);
 const body=await allowed.json();assert.equal(body.viewerMemberId,owner.id);assert.deepEqual(body.entry,entry);
 assert.ok(!JSON.stringify(body).includes("created_by_member_id"));
 assert.equal((await get({...owner,id:"ordinary-member-0002",email:"member@example.net"})).status,403);
 assert.equal((await get(owner,"ordinary-member-0002")).status,409);
 assert.equal(store.batches,0);
});
test("saved-revision GET rejects missing and malformed persistence results",async()=>{
 const path="/api/member/studio/entries/"+entry.id;
 for(const [value,status] of [[null,404],[{...row,revision:0},503],[{...row,published_at:1000},503]]){
  const result=await studioEndpoint(new Request("https://anevum.com"+path),{...environment,MEMBER_DB:integrityStore(value).db},owner,"https://anevum.com",path,owner.email);
  assert.equal(result.status,status);
 }
});
test("server never declares a raced or corrupted persisted CREATE successful",async()=>{
 for(const corrupt of [value=>({...value,revision:2}),value=>({...value,body:value.body+" Interleaved edit."}),value=>({...value,updated_by_member_id:"different-staff"}),()=>null]){
  const store=integrityStore(null,corrupt);
  const result=await studioEndpoint(post(JSON.stringify(text)),{...environment,MEMBER_DB:store.db},owner,"https://anevum.com","/api/member/studio/entries",owner.email);
  assert.equal(result.status,503);const body=await result.json();assert.notEqual(body.saved,true);assert.equal(body.entry,undefined);assert.equal(store.batches,1);
 }
});
test("wire-level rejection cannot reach a database write",async()=>{
 const store=integrityStore();
 const result=await studioEndpoint(post("x".repeat(STUDIO_BODY_BYTE_LIMIT+1)),{...environment,MEMBER_DB:store.db},owner,"https://anevum.com","/api/member/studio/entries",owner.email);
 assert.equal(result.status,400);assert.equal(store.batches,0);
});
test("public success, absence and error responses all prohibit reusable caches",async()=>{
 const path="/api/public/studio/entries/"+entry.slug;
 for(const [value,enabled,status] of [[{...row,status:"PUBLISHED",published_at:1000},"true",200],[row,"true",404],[row,"false",503]]){
  const result=await studioPublicEndpoint(new Request("https://anevum.com"+path),{...environment,ANEVUM_STUDIO_ENABLED:enabled,MEMBER_DB:integrityStore(value).db},path);
  assert.equal(result.status,status);
  for(const header of ["Cache-Control","CDN-Cache-Control","Cloudflare-CDN-Cache-Control"])
   assert.match(result.headers.get(header)||"",/no-store/);
 }
});
test("UI verifies before confirmation, uses anonymous reads, and preserves uncertainty",()=>{
 assert.ok(ui.indexOf("studioSameSavedRevision(saved.entry,current!)")<ui.indexOf('window.confirm("Publish this entry on ANEVUM now?"'));
 assert.match(ui,/studioMutationMatches\(receipt\.entry,action,current,form\)/);
 assert.match(ui,/credentials:"omit",cache:"no-store",redirect:"manual",signal:controller\.signal/);
 assert.match(ui,/studioPublicStateMatches\(action,publicView\.status,publicData,item\)/);
 assert.match(ui,/action==="ARCHIVE"&&dirty/);
 assert.match(ui,/beforeunload/);
 assert.match(ui,/do not repeat the write/);
 assert.match(ui,/Reload Studio and discard unsaved editorial changes/);
 assert.match(ui,/StudioOperations key=\{operationsRefresh\}/);
});

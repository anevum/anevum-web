import test from "node:test";
import assert from "node:assert/strict";
import {parsePostPage,parseReplyPage,mergeDiscussionPage,verifiedDiscussionAction,validDiscussionText} from "../src/commons/discussion-contract.ts";
const id=n=>"223e4567-e89b-12d3-a456-"+String(n).padStart(12,"0");
const envelope={schemaVersion:"anevum.commons-discussions.v1",viewerMemberId:"alpha"};
const post=n=>({id:id(n),topic:"research",title:"Reproducible research question",body:"Detailed question with independent methodological evidence.",createdAt:100,updatedAt:100,ownedByMe:true,authorLabel:"Commons member",email:"excluded@example.test"});
const feed=()=>({...envelope,available:true,pilot:true,moderationStatus:"PILOT_REVIEW_REQUIRED",posts:[post(2),post(1)],pageCap:30,hasMore:false,nextCursor:null,olderPostsMayExist:false});
const reply=n=>({id:id(n),postId:id(99),body:"Independent methodological evidence.",createdAt:100,ownedByMe:false,authorLabel:"Commons member"});
const replies=()=>({...envelope,postId:id(99),replies:[reply(1),reply(2)],pageCap:50,hasMore:false,nextCursor:null});
const cursor=(kind,scope,row)=>btoa(JSON.stringify({v:1,kind,scope,at:row.createdAt,id:row.id})).replaceAll("+","-").replaceAll("/","_").replace(/=+$/,"");
test("discussion projections reject crossed identity, forged ownership shapes and invalid content",()=>{
  assert.equal(parsePostPage(feed(),"alpha","research").items.length,2);assert.doesNotMatch(JSON.stringify(parsePostPage(feed(),"alpha","all")),/Email|email|excluded|viewerMemberId/);
  for(const mutate of [value=>value.viewerMemberId="beta",value=>delete value.schemaVersion,value=>value.posts[0].ownedByMe="true",value=>value.posts[0].authorLabel="staff",value=>value.posts[0].body={},value=>value.posts[0].createdAt=-1,value=>value.posts[0].updatedAt=99,value=>value.posts[0].id="invalid",value=>value.posts.push(post(1)),value=>value.posts.reverse(),value=>value.hasMore=true,value=>value.nextCursor="garbage"]){const value=feed();mutate(value);assert.throws(()=>parsePostPage(value,"alpha","all"),/could not be verified/);}
  assert.throws(()=>parsePostPage(feed(),"alpha","systems"));assert.throws(()=>parsePostPage(feed(),"","all"));
});
test("pagination verifies exact terminal cursor, scope, order and disjoint page boundaries",()=>{
  const value=feed();value.posts=Array.from({length:30},(_,n)=>post(30-n));value.hasMore=true;value.olderPostsMayExist=true;value.nextCursor=cursor("posts","all",value.posts.at(-1));assert.equal(parsePostPage(value,"alpha","all").items.length,30);
  for(const c of [cursor("posts","research",value.posts.at(-1)),cursor("replies","all",value.posts.at(-1)),cursor("posts","all",post(2))])assert.throws(()=>parsePostPage({...value,nextCursor:c},"alpha","all"));
  assert.equal(mergeDiscussionPage([post(5)],[post(4),post(3)],"posts").length,3);
  assert.throws(()=>mergeDiscussionPage([post(5)],[post(5)],"posts"));assert.throws(()=>mergeDiscussionPage([post(5)],[post(6)],"posts"));
  assert.equal(parseReplyPage(replies(),"alpha",id(99)).items.length,2);
  assert.throws(()=>parseReplyPage(replies(),"alpha",id(98)));assert.throws(()=>parseReplyPage({...replies(),replies:[reply(2),reply(1)]},"alpha",id(99)));
});
test("all social mutation acknowledgements are bound to identity, content and target",()=>{
  const expected={topic:"research",title:post(1).title,body:post(1).body};
  assert.doesNotThrow(()=>verifiedDiscussionAction({...envelope,created:true,post:post(1)},"alpha","post",expected));
  assert.throws(()=>verifiedDiscussionAction({...envelope,created:true,post:{...post(1),ownedByMe:false}},"alpha","post",expected));
  assert.throws(()=>verifiedDiscussionAction({...envelope,created:true,post:post(1)},"alpha","post",{...expected,body:"Wrong content"}));
  for(const [action,payload] of [["remove-post",{removed:true,postId:id(99)}],["remove-reply",{removed:true,postId:id(99),replyId:id(1)}],["report",{reported:true,postId:id(99),reviewStatus:"PENDING"}],["reply",{created:true,reply:{...reply(1),ownedByMe:true}}]]){
    const target={postId:id(99),replyId:id(1),body:reply(1).body};assert.doesNotThrow(()=>verifiedDiscussionAction({...envelope,...payload},"alpha",action,target));
    assert.throws(()=>verifiedDiscussionAction({...envelope,...payload,viewerMemberId:"beta"},"alpha",action,target));
    assert.throws(()=>verifiedDiscussionAction({...envelope,...payload},"alpha",action,{...target,postId:id(98)}));
  }
  assert.throws(()=>verifiedDiscussionAction({...envelope,removed:true,postId:id(99),replyId:id(2)},"alpha","remove-reply",{postId:id(99),replyId:id(1)}));
});
test("discussion text preserves ordinary newlines while rejecting invalid bounds and controls",()=>{
  assert.equal(validDiscussionText("A meaningful\nreply",2,1000),true);for(const text of ["a"," ","x".repeat(1001),"reply\u0000unsafe","reply\u007funsafe"])assert.equal(validDiscussionText(text,2,1000),false);
});

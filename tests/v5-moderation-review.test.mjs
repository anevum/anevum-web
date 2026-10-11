import test from "node:test";
import assert from "node:assert/strict";
import {MODERATION_SCHEMA,parseReviewQueue,reviewedDecision,validReviewReason} from "../src/commons/moderation-contract.ts";
const id = "223e4567-e89b-12d3-a456-426614174001";
const report = () => ({id,reason:"privacy",createdAt:77,reporterEmail:"excluded@example.test",
  post:{id:"223e4567-e89b-12d3-a456-426614174000",title:"Evidence provenance",body:"Research question with methodological evidence.",status:"PUBLISHED",authorEmail:"excluded@example.test"}});
const queue = () => ({schemaVersion:MODERATION_SCHEMA,reviewerMemberId:"alpha",pending:[report()],pageCap:30,olderPendingMayExist:false});
const ack = () => ({schemaVersion:MODERATION_SCHEMA,reviewerMemberId:"alpha",reportId:id,decision:"HIDE",resolved:true,moderationAuditRecorded:true,executionEnabled:false});

test("review queue verifies identity and projects only bounded review fields",()=>{
  const result=parseReviewQueue(queue(),"alpha");
  assert.equal(result.pending[0].id,id);
  assert.doesNotMatch(JSON.stringify(result),/Email|excluded|reviewerMemberId/);
  for(const status of ["PUBLISHED","HIDDEN","REMOVED"]){const value=queue();value.pending[0].post.status=status;assert.equal(parseReviewQueue(value,"alpha").pending[0].post.status,status);}
  for(const mutate of [
    value=>value.reviewerMemberId="beta",value=>delete value.schemaVersion,value=>value.pageCap=31,
    value=>value.pending=null,value=>value.olderPendingMayExist=true,value=>value.pending.push(report()),
    value=>value.pending[0].id="not-a-report",value=>value.pending[0].reason="BAN",
    value=>value.pending[0].createdAt=-1,value=>value.pending[0].createdAt=0.5,
    value=>value.pending[0].post.id="not-a-post",value=>value.pending[0].post.title=" ",
    value=>value.pending[0].post.title="x".repeat(121),value=>value.pending[0].post.body={},
    value=>value.pending[0].post.body="x".repeat(3001),value=>value.pending[0].post.status="DELETED"
  ]){const value=queue();mutate(value);assert.throws(()=>parseReviewQueue(value,"alpha"),/could not be verified/);}
  assert.throws(()=>parseReviewQueue(queue(),""));
});
test("capped queues preserve the explicit incomplete-page signal",()=>{
  const value=queue();value.pending=Array.from({length:30},(_,index)=>({...report(),id:`223e4567-e89b-12d3-a456-${String(index).padStart(12,"0")}`}));value.olderPendingMayExist=true;
  assert.equal(parseReviewQueue(value,"alpha").pending.length,30);
  value.olderPendingMayExist=false;assert.throws(()=>parseReviewQueue(value,"alpha"));
  value.olderPendingMayExist=true;value.pending.push({...report(),id:"223e4567-e89b-12d3-a456-426614174999"});assert.throws(()=>parseReviewQueue(value,"alpha"));
});
test("audit acknowledgement must bind reviewer, report, decision and nonexecution",()=>{
  assert.equal(reviewedDecision(ack(),"alpha",id,"HIDE"),true);
  for(const [key,value] of Object.entries({schemaVersion:"old",reviewerMemberId:"beta",reportId:"223e4567-e89b-12d3-a456-426614174002",decision:"DISMISS",resolved:false,moderationAuditRecorded:false,executionEnabled:true})){
    assert.equal(reviewedDecision({...ack(),[key]:value},"alpha",id,"HIDE"),false,key);
    const missing=ack();delete missing[key];assert.equal(reviewedDecision(missing,"alpha",id,"HIDE"),false,key);
  }
  assert.equal(reviewedDecision(null,"alpha",id,"HIDE"),false);
  assert.equal(reviewedDecision(ack(),"",id,"HIDE"),false);
});
test("documented reasons accept bounded text and reject control characters",()=>{
  assert.equal(validReviewReason(" Evidence confirms policy violation. "),true);
  for(const value of ["short","        ","x".repeat(501),"reason\nunsafe","reason\u0000unsafe","reason\u007funsafe"])assert.equal(validReviewReason(value),false);
  assert.equal(validReviewReason("x".repeat(500)),true);
});

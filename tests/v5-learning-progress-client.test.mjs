import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLearningSnapshot,parseLearningAcknowledgement,isCurrentLessonRead} from '../src/member/learning-progress.ts';
const slug='market-orders-and-quotes';
const catalog={[slug]:'1.0.0'};
const row={lessonSlug:slug,lessonVersion:'1.0.0',completed:true,revision:1,updatedAt:1000};
const envelope={schema:'anevum.learning-progress.v1',available:true,memberId:'member-a',lessonVersions:catalog,progress:[row]};
test('verified snapshot accepts only the exact active member and current authored catalog',()=>{
 assert.equal(parseLearningSnapshot(envelope,'member-a',catalog).progress.length,1);
 for(const body of [null,[],{...envelope,memberId:'member-b'},{...envelope,available:false},
  {...envelope,lessonVersions:{[slug]:'2.0.0'}},{...envelope,lessonVersions:{...catalog,extra:'1.0.0'}},
  {...envelope,progress:[row,row]},{...envelope,progress:[{...row,completed:1}]},
  {...envelope,progress:[{...row,revision:0}]},{...envelope,progress:[{...row,brokerEnabled:true}]}])
  assert.throws(()=>parseLearningSnapshot(body,'member-a',catalog));
});
test('mutation acknowledgement must match member, lesson, action, version and next revision',()=>{
 const ack={...envelope,progress:row};
 assert.equal(parseLearningAcknowledgement(ack,'member-a',slug,'1.0.0',true,0).revision,1);
 for(const patch of [{lessonSlug:'wrong-lesson'},{lessonVersion:'2.0.0'},{completed:false},{revision:2}])
  assert.throws(()=>parseLearningAcknowledgement({...ack,progress:{...row,...patch}},'member-a',slug,'1.0.0',true,0));
 assert.throws(()=>parseLearningAcknowledgement(ack,'member-b',slug,'1.0.0',true,0));
});
test('an older saved version is not counted as current completion and absent state is not fabricated',()=>{
 assert.equal(isCurrentLessonRead(row,'1.0.0'),true);
 assert.equal(isCurrentLessonRead(row,'2.0.0'),false);
 assert.equal(isCurrentLessonRead(undefined,'1.0.0'),false);
 assert.equal(isCurrentLessonRead({...row,completed:false},'1.0.0'),false);
});

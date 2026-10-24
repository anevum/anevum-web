import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseStudioSource} from './project-doctor-v001.mjs';
import {projectDoctorBrief} from './project-doctor-brief-v001.mjs';
import * as blocks from '../workbench-alpha/document.mjs';
import * as ui from '../interface-builder/document.mjs';

test('clean source produces a bounded no-warning brief without project contents',()=>{
 const source=blocks.encode(blocks.starter());
 const brief=projectDoctorBrief(diagnoseStudioSource(source));
 assert.equal(brief.schema,'anevum.project-doctor.brief.v001');
 assert.equal(brief.status,'no_structural_warnings');
 assert.deepEqual(brief.counts,{error:0,warning:0,info:0});
 assert.deepEqual(brief.recommendations,[]);
 assert.ok(!JSON.stringify(brief).includes(source));
});

test('severities are ordered and capped while preserving curated recommendations',()=>{
 const doc=ui.starter();
 const page=ui.page('Private project text not echoed');
 for(let i=0;i<12;i++)page.components.push(ui.component('input','','secret input '+i));
 doc.pages.push(page);
 const source=ui.encode(doc);
 const inspected=diagnoseStudioSource(source);
 const brief=projectDoctorBrief(inspected);
 assert.equal(brief.status,'review');
 assert.equal(brief.counts.warning,13); // unreachable page plus unlabeled inputs
 assert.equal(brief.recommendations.length,4);
 assert.ok(brief.recommendations.every(item=>item.nextStep.length>10));
 assert.ok(brief.recommendations.every(item=>!item.message.includes('Private project text')));
 assert.ok(!JSON.stringify(brief).includes('secret input'));
 assert.ok(brief.disclaimer.includes('not a successful build'));
});

test('unsupported documents never receive a publication-ready designation',()=>{
 const brief=projectDoctorBrief(diagnoseStudioSource('INVALID RAW JAVASCRIPT'));
 assert.equal(brief.status,'invalid');
 assert.equal(brief.counts.error,1);
 assert.equal(brief.recommendations[0].code,'source.unsupported');
});

test('brief rejects untrusted finding shapes rather than echoing arbitrary messages',()=>{
 assert.throws(()=>projectDoctorBrief({findings:[{severity:'critical',code:'a',path:'b',message:'c',nextStep:'d'}]}),/Unexpected/);
 assert.throws(()=>projectDoctorBrief(null),/Expected/);
});

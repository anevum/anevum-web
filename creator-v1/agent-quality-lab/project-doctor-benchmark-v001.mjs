// Synthetic, consent-free benchmark for deterministic Project Doctor diagnostics.
// Generates valid ANEVUM documents with known defects; no member data or models.
import * as blocks from '../workbench-alpha/document.mjs';
import * as ui from '../interface-builder/document.mjs';
import {diagnoseStudioSource} from './project-doctor-v001.mjs';

const STORY_DEFECTS=['scene.unnamed','choice.unlabeled','choice.unlinked','scene.unreachable','scene.missing'];
const UI_DEFECTS=['page.unreachable','page.empty','button.unlabeled','button.inert','input.unlabeled'];
const stableId = n => '00000000-0000-4000-8000-' + n.toString(16).padStart(12,'0');

function canonicalStory(doc) {
 const ids=new Map(doc.blocks.map((item,index)=>[item.id,stableId(index+1)]));
 return {...doc,blocks:doc.blocks.map(item=>({
  ...item,id:ids.get(item.id),target:item.target===null?null:ids.get(item.target)
 }))};
}

function canonicalInterface(doc) {
 const ids=new Map();
 let count=1;
 for (const page of doc.pages) {
  ids.set(page.id,stableId(count++));
  for (const component of page.components) ids.set(component.id,stableId(count++));
 }
 return {...doc,pages:doc.pages.map(page=>({
  ...page,id:ids.get(page.id),
  components:page.components.map(component=>({
   ...component,id:ids.get(component.id),
   target:component.target===null?null:ids.get(component.target)
  }))
 }))};
}

function storyFixture(defect,round) {
 const doc=blocks.starter();
 switch(defect){
  case 'scene.unnamed': doc.blocks[0].text=''; break;
  case 'choice.unlabeled': doc.blocks.find(item=>item.type==='choice').text=''; break;
  case 'choice.unlinked': doc.blocks.find(item=>item.type==='choice').target=null; break;
  case 'scene.unreachable': doc.blocks.push(blocks.block('scene','Disconnected '+round)); break;
  case 'scene.missing': doc.blocks=[blocks.block('paragraph','Story prologue '+round)]; break;
  case null: doc.blocks[1].text+=' Fixture '+round; break;
  default: throw Error('Unknown story defect fixture.');
 }
 return blocks.encode(canonicalStory(doc));
}

function interfaceFixture(defect,round) {
 const doc=ui.starter();
 switch(defect){
  case 'page.unreachable': {
   const page=ui.page('Unreachable '+round);
   page.components.push(ui.component('paragraph','','Unlinked fixture'));
   doc.pages.push(page);
   break;
  }
  case 'page.empty': {
   const page=ui.page('Empty '+round);
   const button=ui.component('button','Open empty page','');
   button.action='navigate';button.target=page.id;
   doc.pages[0].components.push(button);
   doc.pages.push(page);
   break;
  }
  case 'button.unlabeled': {
   const button=ui.component('button','','');
   button.action='navigate';button.target=doc.pages[1].id;
   doc.pages[0].components.push(button);
   break;
  }
  case 'button.inert':
   doc.pages[0].components.push(ui.component('button','Inspect me',''));break;
  case 'input.unlabeled':
   doc.pages[0].components.push(ui.component('input','',''));break;
  case null: doc.name='Signal Interface '+round;break;
  default: throw Error('Unknown interface defect fixture.');
 }
 return ui.encode(canonicalInterface(doc));
}

export function syntheticFixtures() {
 const cases=[];
 for(let round=0;round<30;round++){
  const clean=round%6===0;
  const storyDefect=clean?null:STORY_DEFECTS[(round-1)%STORY_DEFECTS.length];
  const uiDefect=clean?null:UI_DEFECTS[(round-1)%UI_DEFECTS.length];
  cases.push({id:'story-'+round,format:blocks.SCHEMA,
   expected:storyDefect?[storyDefect]:[],source:storyFixture(storyDefect,round)});
  cases.push({id:'ui-'+round,format:ui.SCHEMA,
   expected:uiDefect?[uiDefect]:[],source:interfaceFixture(uiDefect,round)});
 }
 return cases;
}

export function evaluateBenchmark(fixtures=syntheticFixtures()) {
 const started=performance.now();
 let truePositives=0,falsePositives=0,falseNegatives=0,exactMatches=0;
 let clean=0,defectCases=0;
 const mismatches=[];
 for(const fixture of fixtures) {
  const expected=new Set(fixture.expected);
  const response=diagnoseStudioSource(fixture.source);
  const observed=new Set(response.findings.map(f=>f.code));
  if(!response.valid||response.format!==fixture.format) {
   mismatches.push({id:fixture.id,reason:'invalid_response'});
   continue;
  }
  if(expected.size===0)clean++;else defectCases++;
  for(const code of expected) {
   if(observed.has(code))truePositives++;else falseNegatives++;
  }
  for(const code of observed)if(!expected.has(code))falsePositives++;
  if(expected.size===observed.size && [...expected].every(code=>observed.has(code))) exactMatches++;
  else mismatches.push({id:fixture.id,expected:[...expected],observed:[...observed]});
 }
 const precision=truePositives+falsePositives===0?1:truePositives/(truePositives+falsePositives);
 const recall=truePositives+falseNegatives===0?1:truePositives/(truePositives+falseNegatives);
 return {
  benchmark:'continuance-project-doctor-synthetic-v001',
  fixtures:fixtures.length,clean,defectCases,exactMatches,
  truePositives,falsePositives,falseNegatives,
  precision:Number(precision.toFixed(4)),recall:Number(recall.toFixed(4)),
  durationMs:Number((performance.now()-started).toFixed(2)),
  mismatches
 };
}

if(process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll('\\','/'))) {
 const result=evaluateBenchmark();
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
 if(result.mismatches.length)process.exitCode=1;
}

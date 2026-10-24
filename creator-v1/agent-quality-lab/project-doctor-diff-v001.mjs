// Read-only, content-minimized comparison of saved and unsaved Studio source.
// The comparison key uses canonical stable block/page/component IDs, not array positions.
// Reported resolution means the finding is no longer present, NOT that a fix was verified.
import * as blocks from '../workbench-alpha/document.mjs';
import * as ui from '../interface-builder/document.mjs';
import {diagnoseStudioSource} from './project-doctor-v001.mjs';

function documentFor(source,format) {
  if(format===blocks.SCHEMA)return blocks.decode(source);
  if(format===ui.SCHEMA)return ui.decode(source);
  return null;
}

function identity(doc,format,path,code) {
  let nodeId = null;
  if(format===blocks.SCHEMA) {
    const match=/^blocks\/(\d+)$/.exec(path);
    if(match)nodeId=doc.blocks[Number(match[1])]?.id;
    else if(path==='blocks')nodeId='document';
  } else if(format===ui.SCHEMA) {
    const component=/^pages\/(\d+)\/components\/(\d+)$/.exec(path);
    const page=/^pages\/(\d+)$/.exec(path);
    if(component)nodeId=doc.pages[Number(component[1])]?.components[Number(component[2])]?.id;
    else if(page)nodeId=doc.pages[Number(page[1])]?.id;
  }
  // Keep both category and canonical identifier to avoid array-position false changes.
  return code+'@'+(nodeId || 'location:'+path);
}

function withKeys(source,inspection) {
  const doc=documentFor(source,inspection.format);
  if(!doc)return null;
  return inspection.findings.map(f=>({
    key:identity(doc,inspection.format,f.path,f.code),
    finding:f
  }));
}

export function compareProjectDoctorSources(savedSource,draftSource) {
  const before=diagnoseStudioSource(savedSource);
  const after=diagnoseStudioSource(draftSource);
  const empty=(reason)=>({
    schema:'anevum.project-doctor.diff.v001',
    comparable:false,reason,
    introduced:[],noLongerReported:[],stillReported:[],
    counts:{introduced:0,noLongerReported:0,stillReported:0},
    disclaimer:'Comparison unavailable. No automatic edits or repair claims were made.'
  });
  if(!before.valid || !after.valid)return empty('One or both documents fail canonical validation.');
  if(before.format!==after.format)return empty('The saved and draft documents use different formats.');
  if(before.truncated || after.truncated)return empty('The diagnostic findings exceed the comparison limit.');
  const previous=withKeys(savedSource,before);
  const current=withKeys(draftSource,after);
  if(!previous||!current)return empty('The canonical source could not be inspected.');
  const previousSet=new Map(previous.map(x=>[x.key,x.finding]));
  const currentSet=new Map(current.map(x=>[x.key,x.finding]));
  const introduced=current.filter(x=>!previousSet.has(x.key)).map(x=>x.finding);
  const noLongerReported=previous.filter(x=>!currentSet.has(x.key)).map(x=>x.finding);
  const stillReported=current.filter(x=>previousSet.has(x.key)).map(x=>x.finding);
  return {
    schema:'anevum.project-doctor.diff.v001',
    comparable:true,
    format:before.format,
    introduced,noLongerReported,stillReported,
    counts:{
      introduced:introduced.length,
      noLongerReported:noLongerReported.length,
      stillReported:stillReported.length
    },
    disclaimer:'Issues no longer reported may reflect deletions or changed navigation, not necessarily verified repairs. No source was edited.'
  };
}

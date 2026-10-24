/**
 * ANEVUM V120 local source diagnostics.
 *
 * Exact checks: JSON parsing and native ANEVUM_WORLD_V1 validation.
 * Lightweight advisory checks: CSS brace matching, explicit TODO markers.
 * No source execution, remote compiler, file mutation or false TypeScript
 * language-server claims. Diagnostics never leave the current browser.
 */
import {editorLanguage,sourceCursor} from './language-v119.mjs';
import {PREFIX,validate,LIMITS} from '../world-composer/document.mjs';

function makeDiagnostic(source,offset,severity,code,message){
 const loc=sourceCursor(source,offset);
 return {severity,code,message,line:loc.line,column:loc.column,offset};
}
function jsonErrorOffset(text,error){
 const message=String(error?.message||'');
 const pos=message.match(/\bposition\s+(\d+)/i);
 if(pos)return Math.min(text.length,Number(pos[1]));
 const line=message.match(/\bline\s+(\d+)\s+column\s+(\d+)/i);
 if(line)return sourceOffsetForLine(text,Number(line[1]),Number(line[2]));
 return 0;
}
export function sourceOffsetForLine(source,line,column=1){
 const text=typeof source==='string'?source:'';
 const targetLine=Math.max(1,Math.min(100000,Math.floor(Number.isFinite(line)?line:1)));
 const targetColumn=Math.max(1,Math.floor(Number.isFinite(column)?column:1));
 let start=0;
 for(let i=1;i<targetLine;i++){
  const end=text.indexOf('\n',start);
  if(end<0)return text.length;
  start=end+1;
 }
 const end=text.indexOf('\n',start);
 return Math.min(end<0?text.length:end,start+targetColumn-1);
}
function addJsonProblem(out,source,fragment,offset,code){
 try{return JSON.parse(fragment);}
 catch(error){
  out.push(makeDiagnostic(source,offset+jsonErrorOffset(fragment,error),'error',code,
   'JSON syntax: '+(error instanceof Error?error.message:'Invalid JSON')));
  return null;
 }
}
function cssProblems(source,out){
 let inComment=false,quote='',escape=false,lineComment=false;
 const stack=[];
 for(let i=0;i<source.length&&out.length<16;i++){
  const c=source[i],next=source[i+1]||'';
  if(lineComment){if(c==='\n')lineComment=false;continue;}
  if(inComment){if(c==='*'&&next==='/'){inComment=false;i++;}continue;}
  if(quote){if(escape){escape=false;continue;}if(c==='\\'){escape=true;continue;}if(c===quote)quote='';continue;}
  if(c==='/'&&next==='*'){inComment=true;i++;continue;}
  if(c==='"'||c==="'"){quote=c;continue;}
  if(c==='{')stack.push(i);
  else if(c==='}'){
   if(stack.length)stack.pop();
   else out.push(makeDiagnostic(source,i,'error','css-unmatched-close','Unexpected CSS closing brace.'));
  }
 }
 for(const index of stack.slice(0,Math.max(0,16-out.length)))
  out.push(makeDiagnostic(source,index,'error','css-unclosed-block','CSS block is missing a closing brace.'));
}
export function diagnoseSource(source,filename,maxProblems=30){
 const text=typeof source==='string'?source:'';
 const language=editorLanguage(filename);
 const problems=[],cap=Math.min(50,Math.max(1,Number.isFinite(maxProblems)?Math.floor(maxProblems):30));
 if(language==='json'){
  addJsonProblem(problems,text,text,0,'json-syntax');
 }else if(language==='world'){
  if(!text.startsWith(PREFIX)){
   problems.push(makeDiagnostic(text,0,'error','world-header','Missing ANEVUM_WORLD_V1 version header.'));
  }else{
   const parsed=addJsonProblem(problems,text,text.slice(PREFIX.length),PREFIX.length,'world-json');
   if(parsed!==null){
    try{validate(parsed);}
    catch(error){
     problems.push(makeDiagnostic(text,0,'error','world-schema',
      'World schema: '+(error instanceof Error?error.message:'Invalid ANEVUM world document')));
    }
   }
  }
  if(new TextEncoder().encode(text).length>LIMITS.bytes){
   problems.push(makeDiagnostic(text,0,'error','world-size','World document exceeds the 32 KiB format limit.'));
  }
 }else if(language==='css')cssProblems(text,problems);
 // TODO/FIXME markers are annotations, not compile errors; scan bounded source.
 if(['typescript','javascript','css','html'].includes(language)){
  let cursor=0;
  for(const line of text.split('\n')){
   if(problems.length>=cap)break;
   const marker=line.match(/(?:\/\/|\/\*|<!--)\s*(TODO|FIXME)\b/i);
   if(marker)problems.push(makeDiagnostic(text,cursor+marker.index,'info','author-note',
    marker[1].toUpperCase()+' note for the creator (not a compiler error).'));
   cursor+=line.length+1;
  }
 }
 return {language,checked:language==='json'||language==='world'||language==='css',
  note:language==='typescript'||language==='javascript'?'Source notes only · no TypeScript compiler or language server attached.':
   language==='json'||language==='world'?'Local document syntax and format validation.':
   language==='css'?'Local CSS brace validation only, not full CSS parsing.':
   'No language-specific validator attached.',
  diagnostics:problems.slice(0,cap)};
}

/**
 * ANEVUM V121: deterministic, non-executing document outline.
 *
 * Bounded navigation aid, NOT a language server, full parser,
 * build step or trusted validator. Operates only on open source text.
 */
import {editorLanguage,sourceCursor} from './language-v119.mjs';
import {decode,PREFIX} from '../world-composer/document.mjs';
const MAX_LINES=3000,MAX_SYMBOLS=100;
const identifier='[A-Za-z_$][\\w$]*';
const declaration=new RegExp('^\\s*(?:(?:export|default|declare|abstract|async)\\s+)*(class|interface|enum|type|function|namespace)\\s+('+identifier+')\\b');
const variable=new RegExp('^\\s*(?:(?:export|declare)\\s+)*(const|let|var)\\s+('+identifier+')\\b');
function symbol(kind,name,line,column,depth=0){
 return {kind,name:String(name).slice(0,100),line,column,depth:Math.max(0,Math.min(depth,6))};
}
function jsonKeys(text){
 try{
  const parsed=JSON.parse(text);
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return [];
  return Object.keys(parsed).slice(0,MAX_SYMBOLS).map(name=>{
   const needle=JSON.stringify(name)+':';
   let at=text.indexOf(needle);
   if(at<0)at=text.indexOf(JSON.stringify(name));
   const before=text.slice(0,Math.max(0,at));
   return symbol('property',name,before.split('\n').length,before.length-before.lastIndexOf('\n'),0);
  });
 }catch{return [];}
}
export function sourceOutline(source,filename){
 const text=typeof source==='string'?source:'',lang=editorLanguage(filename);
 const lines=text.split('\n'),bounded=lines.slice(0,MAX_LINES),symbols=[];
 const append=(kind,name,line,column,depth=0)=>{
  if(symbols.length<MAX_SYMBOLS&&name&&String(name).trim())
   symbols.push(symbol(kind,name,line,column,depth));
 };
 if(lang==='json'){
  symbols.push(...jsonKeys(text.slice(0,65536)));
 }else if(lang==='world'){
  const value=text.startsWith(PREFIX)?decode(text):null;
  if(value){
   append('world',value.name,1,1);
   let from=PREFIX.length;
   for(const node of value.nodes||[]){
    const exact=JSON.stringify(node.id),at=text.indexOf(exact,from);
    const coordinate=sourceCursor(text,at<0?from:at);
    append('node',node.name||node.id,coordinate.line,coordinate.column,node.parentId?1:0);
    if(at>=0)from=at+exact.length;
   }
  }
 }else{
  let inComment=false,inFence=false;
  for(let i=0;i<bounded.length&&symbols.length<MAX_SYMBOLS;i++){
   const line=bounded[i],trim=line.trim(),row=i+1;
   if(lang==='markdown'){
    if(new RegExp('^'+String.fromCharCode(96)+'{3,}').test(trim)){inFence=!inFence;continue;}
    if(inFence)continue;
    const heading=line.match(/^\s{0,3}(#{1,6})\s+(.{1,140}?)(?:\s+#+)?\s*$/);
    if(heading)append('heading',heading[2],row,line.indexOf('#')+1,heading[1].length-1);
    continue;
   }
   if(lang==='html'){
    const heading=line.match(/<h([1-6])\b[^>]*>([^<]{1,140})<\/h\1>/i);
    if(heading)append('heading',heading[2],row,Math.max(1,line.indexOf(heading[0])+1),Number(heading[1])-1);
    continue;
   }
   if(inComment){
    const close=line.indexOf('*/');
    if(close<0)continue;
    inComment=false;
    if(!line.slice(close+2).trim())continue;
   }
   if(trim.startsWith('/*')){
    if(!trim.includes('*/'))inComment=true;
    continue;
   }
   if(trim.startsWith('//')||trim.startsWith('*'))continue;
   if(lang==='css'){
    if(trim.startsWith('@')){
     const atRule=trim.match(/^(@(?:media|supports|container|keyframes|layer|font-face))\b\s*([^{]{0,100})/);
     if(atRule)append('rule',(atRule[1]+' '+atRule[2]).trim(),row,line.indexOf('@')+1);
    }else if(trim.includes('{')){
     const candidate=trim.slice(0,trim.indexOf('{')).trim();
     if(candidate&&!candidate.includes(';')&&!candidate.startsWith('--')&&
      !candidate.startsWith('/*')&&!candidate.endsWith(':')&&candidate.length<=110)
      append('selector',candidate,row,Math.max(1,line.indexOf(candidate)+1));
    }
    continue;
   }
   if(lang==='javascript'||lang==='typescript'){
    const match=line.match(declaration);
    if(match){
     const kind=match[1]==='function'?'function':match[1];
     append(kind,match[2],row,Math.max(1,line.indexOf(match[2])+1));
     continue;
    }
    const local=line.match(variable);
    if(local&&(!trim.startsWith('const {')&&!trim.startsWith('const ['))){
     append('variable',local[2],row,Math.max(1,line.indexOf(local[2])+1));
    }
   }
  }
 }
 return {
  language:lang,symbols:symbols.slice(0,MAX_SYMBOLS),
  approximate:lang==='typescript'||lang==='javascript'||lang==='css'||lang==='html',
  truncated:lines.length>MAX_LINES||symbols.length>=MAX_SYMBOLS,
  note:lang==='world'?'Canonical ANEVUM world objects, when document validates.':
   lang==='json'?'Top-level JSON keys, when document parses.':
   lang==='markdown'?'Headings from the current document.':
   lang==='text'?'No document outline for plain text.':
   'Structural text outline only; a full language server is not attached.'
 };
}

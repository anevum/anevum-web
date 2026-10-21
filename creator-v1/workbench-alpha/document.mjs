// Reconciles PR #466's ANEVUM_BLOCKS_V1 wire contract; no new creation format.
// Text/data only. Never interpret user text as HTML, JavaScript, CSS or URLs.
export const PREFIX = 'ANEVUM_BLOCKS_V1\n';
export const SCHEMA = 'anevum.blocks.v1';
export const TYPES = Object.freeze(['heading','paragraph','quote','divider','scene','choice','caption','credits']);
export const LIMITS = Object.freeze({blocks:28,text:2500,description:8000});
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CONTROL=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')===keys.sort().join(',');
export function validate(value){
 if(!exact(value,['schema','blocks'])||value.schema!==SCHEMA||!Array.isArray(value.blocks)||value.blocks.length>LIMITS.blocks)
  throw Error('Unsupported Workbench document. The original has not been changed.');
 const used=new Set();
 const blocks=value.blocks.map(b=>{
  if(!exact(b,['id','type','text','target'])||typeof b.id!=='string'||!UUID.test(b.id)||used.has(b.id)||
    !TYPES.includes(b.type)||typeof b.text!=='string'||b.text.length>LIMITS.text||CONTROL.test(b.text)||
    (b.target!==null&&(typeof b.target!=='string'||!UUID.test(b.target)))||(b.type!=='choice'&&b.target!==null))
   throw Error('Invalid block or reference. Keep the original draft and repair it first.');
  used.add(b.id);return {id:b.id,type:b.type,text:b.text,target:b.target};
 });
 for(const b of blocks)if(b.target!==null&&!blocks.some(s=>s.id===b.target&&s.type==='scene'))
  throw Error('A choice refers to a missing scene.');
 return {schema:SCHEMA,blocks};
}
export function encode(value){
 const raw=PREFIX+JSON.stringify(validate(value));
 if(raw.length>LIMITS.description)throw Error('This pilot uses the existing 8,000-character Studio document limit. Shorten this draft before saving.');
 return raw;
}
export function decode(raw){
 if(typeof raw!=='string'||!raw.startsWith(PREFIX)||raw.length>LIMITS.description)return null;
 try{const doc=validate(JSON.parse(raw.slice(PREFIX.length)));return encode(doc)===raw?doc:null;}catch{return null;}
}
export function block(type,text=''){
 const item={id:crypto.randomUUID(),type,text,target:null};
 validate({schema:SCHEMA,blocks:[item]});return item;
}
export function starter(){
 const opening=block('scene','The First Signal');const archive=block('scene','The Archive');
 const forward={...block('choice','Follow the signal'),target:archive.id};
 const back={...block('choice','Return to the observatory'),target:opening.id};
 return {schema:SCHEMA,blocks:[opening,block('paragraph','A faint transmission reaches your observatory. What lies beyond it?'),forward,
  archive,block('paragraph','The archive opens. Add the next part of your story here.'),back]};
}
export function visible(doc,sceneId){
 const first=doc.blocks.find(b=>b.type==='scene');if(!first)return doc.blocks;
 const start=doc.blocks.findIndex(b=>b.type==='scene'&&b.id===(sceneId||first.id));
 const at=start<0?doc.blocks.indexOf(first):start;
 const next=doc.blocks.findIndex((b,i)=>i>at&&b.type==='scene');return doc.blocks.slice(at,next<0?undefined:next);
}
export function remove(doc,id){
 return validate({...doc,blocks:doc.blocks.filter(b=>b.id!==id).map(b=>b.target===id?{...b,target:null}:b)});
}

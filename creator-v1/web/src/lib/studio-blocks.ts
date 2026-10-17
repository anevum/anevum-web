// ANEVUM V054: versioned, declarative, text-only creative blocks.
// Stored in the existing private Studio description field (8,000 characters)
// until a dedicated document model is independently reviewed and migrated.
// No uploaded HTML, JavaScript, SVG, CSS, media bytes or external resources.
export const BLOCK_PREFIX='ANEVUM_BLOCKS_V1\n';
export const BLOCK_SCHEMA='anevum.blocks.v1';
export const MAX_BLOCKS=28;
export const MAX_BLOCK_TEXT=2500;
export const MAX_DESCRIPTION=8000;
export const BLOCK_TYPES=[
 'heading','paragraph','quote','divider','scene','choice','caption','credits'
] as const;
export type StudioBlockType=typeof BLOCK_TYPES[number];
export type StudioBlock={id:string;type:StudioBlockType;text:string;target:string|null};
export type StudioBlockDocument={schema:typeof BLOCK_SCHEMA;blocks:StudioBlock[]};

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const C0=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const typeSet=new Set<string>(BLOCK_TYPES);
const err=(message:string):never=>{throw Error(message);};

export function newStudioBlock(type:StudioBlockType,id:string=crypto.randomUUID(),text=''):StudioBlock{
 if(!typeSet.has(type)||!UUID.test(id)||C0.test(text)||text.length>MAX_BLOCK_TEXT)
  return err('Invalid Workbench block');
 return {id,type,text:typeof text==='string'?text:'',target:null};
}
export function isStudioBlockDescription(description:string):boolean{
 return typeof description==='string'&&description.startsWith(BLOCK_PREFIX);
}
export function validateStudioBlockDocument(candidate:unknown):StudioBlockDocument{
 if(!candidate||typeof candidate!=='object'||Array.isArray(candidate))return err('Invalid Workbench document');
 const input=candidate as Record<string,unknown>;
 if(Object.keys(input).sort().join(',')!=='blocks,schema'||input.schema!==BLOCK_SCHEMA||
   !Array.isArray(input.blocks)||input.blocks.length>MAX_BLOCKS)return err('Unsupported Workbench document');
 const used=new Set<string>();const blocks:StudioBlock[]=[];
 for(const raw of input.blocks){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return err('Invalid block');
  const b=raw as Record<string,unknown>;
  if(Object.keys(b).sort().join(',')!=='id,target,text,type'||typeof b.id!=='string'||!UUID.test(b.id)||
    used.has(b.id)||typeof b.type!=='string'||!typeSet.has(b.type)||
    typeof b.text!=='string'||b.text.length>MAX_BLOCK_TEXT||C0.test(b.text)||
    (b.target!==null&&(typeof b.target!=='string'||!UUID.test(b.target)))||
    (b.type!=='choice'&&b.target!==null))
   return err('Invalid Workbench block');
  used.add(b.id);
  blocks.push({id:b.id,type:b.type as StudioBlockType,text:b.text,target:b.target as string|null});
 }
 for(const b of blocks){
  if(b.type==='choice'&&b.target!==null&&
    !blocks.some(x=>x.id===b.target&&x.type==='scene'))
   return err('This choice points to a scene that does not exist');
 }
 return {schema:BLOCK_SCHEMA,blocks};
}
export function encodeStudioBlockDocument(document:StudioBlockDocument):string{
 const checked=validateStudioBlockDocument(document);
 const raw=BLOCK_PREFIX+JSON.stringify(checked);
 if(raw.length>MAX_DESCRIPTION)return err('Creation is too large for the private draft limit. Shorten or split your content.');
 return raw;
}
export function decodeStudioBlockDocument(description:string):StudioBlockDocument|null{
 if(!isStudioBlockDescription(description)||description.length>MAX_DESCRIPTION)return null;
 try{
  const raw=JSON.parse(description.slice(BLOCK_PREFIX.length));
  const doc=validateStudioBlockDocument(raw);
  if(encodeStudioBlockDocument(doc)!==description)return null; // Strict canonical encoding.
  return doc;
 }catch{return null;}
}
export function createStudioBlockDocumentFromNotes(notes:string):StudioBlockDocument{
 if(typeof notes!=='string'||C0.test(notes))return err('Invalid private notes');
 if(notes.length>MAX_BLOCK_TEXT)return err('Shorten notes to 2,500 characters before converting to blocks.');
 const blocks=notes.trim()?[newStudioBlock('paragraph',crypto.randomUUID(),notes.trim())]:[
  newStudioBlock('heading',crypto.randomUUID(),'Untitled creation'),
  newStudioBlock('paragraph',crypto.randomUUID(),'')
 ];
 const doc:StudioBlockDocument={schema:BLOCK_SCHEMA,blocks};
 encodeStudioBlockDocument(doc);
 return doc;
}
export function createStudioStarterDocument(type:'story'|'gallery'|'choices'):StudioBlockDocument{
 const block=(kind:StudioBlockType,value:string)=>newStudioBlock(kind,crypto.randomUUID(),value);
 let blocks:StudioBlock[];
 if(type==='story')blocks=[
  block('heading','Your story title'),
  block('paragraph','Begin with the moment that changes everything.'),
  block('heading','The next chapter'),
  block('paragraph','Develop the story in your own words.'),
  block('credits','Your name and collaborators'),
 ];
 else if(type==='gallery')blocks=[
  block('heading','Your exhibition title'),
  block('caption','Piece 01 — Describe the artwork and its story.'),
  block('caption','Piece 02 — What connects this piece to the first?'),
  block('quote','A short artist statement.'),
  block('credits','Artists and permissions'),
 ];
 else if(type==='choices'){
  const opening=block('scene','The Beginning');
  const archive=block('scene','The Archive');
  const choice=block('choice','Follow the signal');
  choice.target=archive.id;
  blocks=[opening,block('paragraph','A message arrives from somewhere unknown.'),
   choice,archive,block('paragraph','You arrive at a room full of unanswered questions.'),
   block('credits','Written by you')];
 }else return err('Unsupported starter');
 const doc:StudioBlockDocument={schema:BLOCK_SCHEMA,blocks};
 encodeStudioBlockDocument(doc);
 return doc;
}
export function getVisibleWorkbenchBlocks(doc:StudioBlockDocument,sceneId:string|null):StudioBlock[]{
 const scenes=doc.blocks.filter(b=>b.type==='scene');
 if(!scenes.length)return doc.blocks;
 const target=sceneId&&scenes.some(s=>s.id===sceneId)?sceneId:scenes[0].id;
 const start=doc.blocks.findIndex(b=>b.id===target);
 const next=doc.blocks.findIndex((b,i)=>i>start&&b.type==='scene');
 return doc.blocks.slice(start,next===-1?doc.blocks.length:next);
}
export function moveStudioBlock(doc:StudioBlockDocument,id:string,step:-1|1):StudioBlockDocument{
 const idx=doc.blocks.findIndex(x=>x.id===id),to=idx+step;
 if(idx<0||to<0||to>=doc.blocks.length)return doc;
 const next=doc.blocks.slice();[next[idx],next[to]]=[next[to],next[idx]];
 return validateStudioBlockDocument({...doc,blocks:next});
}
export function removeStudioBlock(doc:StudioBlockDocument,id:string):StudioBlockDocument{
 const next=doc.blocks.filter(b=>b.id!==id).map(b=>
  b.type==='choice'&&b.target===id?{...b,target:null}:b);
 return validateStudioBlockDocument({...doc,blocks:next});
}

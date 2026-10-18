/**
 * ANEVUM Native Pack V001 -- preview-only, data-driven creative files.
 * ZIP-store container, SHA-256 file integrity, strict schemas and asset allowlist.
 * This is NOT a malware scanner, trusted publisher signature, public upload
 * endpoint, or general-purpose HTML/JavaScript game runtime.
 */
import {validateStudioBlockDocument} from './studio-blocks.ts';

export const ANEVUM_PACK_SCHEMA='anevum.pack.v1';
export const MAX_PACK_BYTES=20*1024*1024;
const MAX_FILES=32;
const MAX_MANIFEST_BYTES=65536;
const MAX_DOCUMENT_BYTES=131072;
const TEXT=new TextEncoder();
const DECODER=new TextDecoder('utf-8',{fatal:true});
const TITLE=/^[^\u0000-\u001f\u007f]{1,120}$/u;
const SLUG=/^[a-z][a-z0-9-]{0,39}$/;
const VERSION=/^(0|[1-9]\d{0,3})\.(0|[1-9]\d{0,3})\.(0|[1-9]\d{0,3})$/;
const PATH=/^[a-z0-9][a-z0-9._/-]{0,159}$/;
const MIME:Readonly<Record<string,string>>=Object.freeze({
 png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',
 mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',mp4:'video/mp4',webm:'video/webm'
});
export const PACK_KINDS=Object.freeze({
 game:{extension:'anvg',entry:'content/game.json'},
 album:{extension:'anva',entry:'content/album.json'},
 series:{extension:'anvs',entry:'content/series.json'},
 visual:{extension:'anvw',entry:'content/visual.json'},
 project:{extension:'anvp',entry:'content/project.json'}
});
export type PackKind=keyof typeof PACK_KINDS;
export type PackFile={path:string;mime:string;size:number;sha256:string};
export type PackManifest={
 schema:typeof ANEVUM_PACK_SCHEMA;kind:PackKind;title:string;creator:string;
 version:string;entry:string;files:PackFile[];
};
export type NativePackInput={kind:PackKind;title:string;creator:string;version:string;
 document:unknown;assets?:Record<string,Uint8Array>};
const fail=(reason:string):never=>{throw new Error('Invalid ANEVUM pack: '+reason);};
function record(value:unknown,keys:string[],required:string[]=keys):Record<string,unknown>{
 if(value===null||typeof value!=='object'||Array.isArray(value))return fail('expected object');
 const obj=value as Record<string,unknown>;
 const names=Object.keys(obj);
 if(names.some(k=>!keys.includes(k))||required.some(k=>!Object.prototype.hasOwnProperty.call(obj,k)))
  return fail('unsupported or missing field');
 return obj;
}
function string(value:unknown,max=120):string{
 if(typeof value!=='string'||value.length>max||!TITLE.test(value))return fail('invalid text');
 return value;
}
function path(value:unknown,root:'assets/'|'content/'='assets/'):string{
 if(typeof value!=='string'||!PATH.test(value)||!value.startsWith(root)||
   value.split('/').some(s=>!s||s==='.'||s==='..')||value.includes('..'))return fail('unsafe path');
 return value;
}
function mediaType(filePath:string):string{
 const ext=filePath.slice(filePath.lastIndexOf('.')+1);
 return MIME[ext]||fail('unsupported asset extension');
}
/** Minimal binary-signature gate; not a substitute for transcoding or scanning. */
function hasMediaSignature(filePath:string,bytes:Uint8Array):boolean{
 const e=filePath.slice(filePath.lastIndexOf('.')+1);
 const ascii=(offset:number,s:string)=>offset+s.length<=bytes.length&&
  Array.from(s).every((c,i)=>bytes[offset+i]===c.charCodeAt(0));
 if(e==='png')return bytes.length>=8&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
 if(e==='jpg'||e==='jpeg')return bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(e==='gif')return ascii(0,'GIF87a')||ascii(0,'GIF89a');
 if(e==='webp')return ascii(0,'RIFF')&&ascii(8,'WEBP');
 if(e==='wav')return ascii(0,'RIFF')&&ascii(8,'WAVE');
 if(e==='ogg')return ascii(0,'OggS');
 if(e==='mp3')return ascii(0,'ID3')||
  (bytes.length>=4&&bytes[0]===255&&(bytes[1]&224)===224&&(bytes[1]&6)!==0);
 if(e==='mp4')return bytes.length>=12&&ascii(4,'ftyp');
 if(e==='webm')return bytes.length>=4&&[26,69,223,163].every((b,i)=>bytes[i]===b);
 return false;
}
function integer(n:unknown,max:number,min=0):number{
 if(typeof n!=='number'||!Number.isSafeInteger(n)||n<min||n>max)return fail('invalid number');
 return n;
}
function manifestOf(value:unknown):PackManifest{
 const m=record(value,['schema','kind','title','creator','version','entry','files']);
 if(m.schema!==ANEVUM_PACK_SCHEMA)return fail('unknown format version');
 if(typeof m.kind!=='string'||!Object.prototype.hasOwnProperty.call(PACK_KINDS,m.kind))return fail('unknown kind');
 const kind=m.kind as PackKind;
 string(m.title);string(m.creator);
 if(typeof m.version!=='string'||!VERSION.test(m.version))return fail('bad version');
 if(m.entry!==PACK_KINDS[kind].entry)return fail('wrong entry');
 if(!Array.isArray(m.files)||m.files.length<1||m.files.length>MAX_FILES)return fail('file count');
 const seen=new Set<string>();let total=0;const files:PackFile[]=[];
 for(const raw of m.files){
  const f=record(raw,['path','mime','size','sha256']);
  const name=f.path===m.entry?path(f.path,'content/'):path(f.path);
  if(seen.has(name))return fail('duplicate file');
  seen.add(name);
  const mime=name===m.entry?'application/json':mediaType(name);
  if(f.mime!==mime)return fail('MIME mismatch');
  const size=integer(f.size,MAX_PACK_BYTES,1);
  if(typeof f.sha256!=='string'||!/^[a-f0-9]{64}$/.test(f.sha256))return fail('bad digest');
  total+=size;if(total>MAX_PACK_BYTES)return fail('oversize content');
  files.push({path:name,mime,size,sha256:f.sha256});
 }
 if(!seen.has(m.entry as string))return fail('entry missing');
 if(files.find(f=>f.path===m.entry)!.size>MAX_DOCUMENT_BYTES)return fail('oversize document');
 return {schema:ANEVUM_PACK_SCHEMA,kind,title:m.title as string,creator:m.creator as string,
  version:m.version as string,entry:m.entry as string,files};
}
function refAsset(value:unknown,files:Map<string,string>,prefix:string):void{
 const p=path(value);const mime=files.get(p);
 if(!mime||!mime.startsWith(prefix))return fail('missing or wrongly typed asset');
}
function uniqueIds(objects:Record<string,unknown>[]):void{
 const s=new Set<string>();for(const obj of objects){
  if(typeof obj.id!=='string'||!SLUG.test(obj.id)||s.has(obj.id))return fail('duplicate/invalid id');
  s.add(obj.id);
 }
}
/** Strict data schemas. Never evaluate user-provided HTML, JS, CSS, SVG or URLs. */
export function validateNativeDocument(kind:PackKind,value:unknown,manifest:PackManifest):void{
 const files=new Map(manifest.files.map(f=>[f.path,f.mime]));
 if(kind==='project'){validateStudioBlockDocument(value);return;}
 if(kind==='game'){
  const game=record(value,['schema','startScene','scenes']);
  if(game.schema!=='anevum.game.v1'||!Array.isArray(game.scenes)||
     game.scenes.length<1||game.scenes.length>64)return fail('invalid game document');
  const scenes=game.scenes.map(s=>record(s,['id','title','text','background','choices'],['id','title','text','choices']));
  uniqueIds(scenes);
  const ids=new Set(scenes.map(s=>s.id));
  if(typeof game.startScene!=='string'||!ids.has(game.startScene))return fail('invalid starting scene');
  for(const s of scenes){
   string(s.title);if(typeof s.text!=='string'||s.text.length>2500)return fail('invalid scene text');
   if(s.background!==undefined)refAsset(s.background,files,'image/');
   if(!Array.isArray(s.choices)||s.choices.length>8)return fail('invalid game choices');
   for(const raw of s.choices){
    const c=record(raw,['label','to']);string(c.label,80);
    if(typeof c.to!=='string'||!ids.has(c.to))return fail('invalid game destination');
   }
  }
  return;
 }
 if(kind==='album'){
  const d=record(value,['schema','cover','tracks'],['schema','tracks']);
  if(d.schema!=='anevum.album.v1'||!Array.isArray(d.tracks)||!d.tracks.length||d.tracks.length>32)
   return fail('invalid album');
  if(d.cover!==undefined)refAsset(d.cover,files,'image/');
  const tracks=d.tracks.map(t=>record(t,['id','title','file']));uniqueIds(tracks);
  for(const t of tracks){string(t.title);refAsset(t.file,files,'audio/');}
  return;
 }
 if(kind==='series'){
  const d=record(value,['schema','poster','episodes'],['schema','episodes']);
  if(d.schema!=='anevum.series.v1'||!Array.isArray(d.episodes)||!d.episodes.length||d.episodes.length>32)
   return fail('invalid series');
  if(d.poster!==undefined)refAsset(d.poster,files,'image/');
  const episodes=d.episodes.map(t=>record(t,['id','title','file']));uniqueIds(episodes);
  for(const ep of episodes){string(ep.title);refAsset(ep.file,files,'video/');}
  return;
 }
 if(kind==='visual'){
  const d=record(value,['schema','pages']);
  if(d.schema!=='anevum.visual.v1'||!Array.isArray(d.pages)||!d.pages.length||d.pages.length>32)
   return fail('invalid gallery');
  for(const raw of d.pages){
   const p=record(raw,['image','caption']);
   refAsset(p.image,files,'image/');
   if(typeof p.caption!=='string'||p.caption.length>500)return fail('invalid caption');
  }
 }
}
const CRC_TABLE=new Uint32Array(256);
for(let n=0;n<256;n++){
 let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);
 CRC_TABLE[n]=c>>>0;
}
function crc32(input:Uint8Array):number{
 let crc=0xffffffff;for(const b of input)crc=CRC_TABLE[(crc^b)&255]^(crc>>>8);
 return (crc^0xffffffff)>>>0;
}
function concat(chunks:Uint8Array[]):Uint8Array{
 const out=new Uint8Array(chunks.reduce((n,c)=>n+c.length,0));
 let offset=0;for(const c of chunks){out.set(c,offset);offset+=c.length;}return out;
}
function makeHeader(n:number):{bytes:Uint8Array;view:DataView}{
 const bytes=new Uint8Array(n);return {bytes,view:new DataView(bytes.buffer)};
}
function encodeZip(entries:[string,Uint8Array][]):Uint8Array{
 const chunks:Uint8Array[]=[];const central:Uint8Array[]=[];let offset=0;
 for(const [name,bytes] of entries){
  const fname=TEXT.encode(name),crc=crc32(bytes),len=bytes.byteLength;
  const l=makeHeader(30+fname.length);const v=l.view;
  v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint32(14,crc,true);
  v.setUint32(18,len,true);v.setUint32(22,len,true);v.setUint16(26,fname.length,true);
  l.bytes.set(fname,30);chunks.push(l.bytes,bytes);
  const c=makeHeader(46+fname.length),w=c.view;
  w.setUint32(0,0x02014b50,true);w.setUint16(4,20,true);w.setUint16(6,20,true);
  w.setUint32(16,crc,true);w.setUint32(20,len,true);w.setUint32(24,len,true);
  w.setUint16(28,fname.length,true);w.setUint32(42,offset,true);
  c.bytes.set(fname,46);central.push(c.bytes);
  offset+=l.bytes.length+len;
 }
 const table=concat(central),end=makeHeader(22),v=end.view;
 v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);
 v.setUint16(10,entries.length,true);v.setUint32(12,table.length,true);
 v.setUint32(16,offset,true);
 return concat([...chunks,table,end.bytes]);
}
function decodeZip(bytes:Uint8Array):Map<string,Uint8Array>{
 if(!(bytes instanceof Uint8Array)||bytes.length>MAX_PACK_BYTES||bytes.length<22)
  return fail('invalid archive size');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const r16=(n:number)=>view.getUint16(n,true),r32=(n:number)=>view.getUint32(n,true);
 const end=bytes.length-22;
 if(r32(end)!==0x06054b50||r16(end+4)!==0||r16(end+6)!==0||
    r16(end+20)!==0||r16(end+8)!==r16(end+10))return fail('unsupported ZIP directory');
 const count=r16(end+10),centralSize=r32(end+12),centralAt=r32(end+16);
 if(count<2||count>MAX_FILES+1||centralAt+centralSize!==end)return fail('invalid ZIP index');
 const files=new Map<string,Uint8Array>();let p=centralAt;
 const spans:[number,number][]=[];
 for(let i=0;i<count;i++){
  if(p+46>end||r32(p)!==0x02014b50)return fail('invalid ZIP directory entry');
  const nameLen=r16(p+28),extras=r16(p+30),comment=r16(p+32),localAt=r32(p+42);
  const size=r32(p+24),compressed=r32(p+20),crc=r32(p+16);
  if(extras||comment||nameLen<1||size!==compressed||r16(p+8)!==0||r16(p+10)!==0||
     r16(p+34)!==0||p+46+nameLen>end)return fail('unsupported ZIP feature');
  if((r16(p+4)>>8)===3&&((r32(p+38)>>>16)&0xf000)===0xa000)
   return fail('ZIP symlink');
  const name=DECODER.decode(bytes.subarray(p+46,p+46+nameLen));
  if(name!=='anevum.json')path(name,name.startsWith('content/')?'content/':'assets/');
  if(files.has(name)||size>MAX_PACK_BYTES||localAt+30+nameLen>centralAt||
     r32(localAt)!==0x04034b50||r16(localAt+6)!==0||r16(localAt+8)!==0||
     r16(localAt+26)!==nameLen||r16(localAt+28)!==0||
     r32(localAt+14)!==crc||r32(localAt+18)!==size||r32(localAt+22)!==size)
   return fail('invalid ZIP local entry');
  const localName=DECODER.decode(bytes.subarray(localAt+30,localAt+30+nameLen));
  if(localName!==name)return fail('ZIP name mismatch');
  const begin=localAt+30+nameLen,finish=begin+size;
  if(finish>centralAt)return fail('overlapping ZIP data');
  const content=bytes.subarray(begin,finish);
  if(crc32(content)!==crc)return fail('ZIP checksum mismatch');
  files.set(name,content);spans.push([localAt,finish]);p+=46+nameLen;
 }
 spans.sort((a,b)=>a[0]-b[0]);
 if(spans[0][0]!==0||spans[spans.length-1][1]!==centralAt||
    spans.some((s,i)=>i>0&&s[0]!==spans[i-1][1])||p!==end)
  return fail('noncanonical ZIP structure');
 return files;
}
async function sha256(bytes:Uint8Array):Promise<string>{
 const digest=await crypto.subtle.digest('SHA-256',bytes as Uint8Array<ArrayBuffer>);
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
/** Build a portable pack locally. No network access or publication. */
export async function createNativePack(input:NativePackInput):Promise<{filename:string;bytes:Uint8Array;manifest:PackManifest}>{
 if(!Object.prototype.hasOwnProperty.call(PACK_KINDS,input.kind))return fail('unknown kind');
 const target=PACK_KINDS[input.kind],fileEntries:[string,Uint8Array][]=[];
 const encoded=TEXT.encode(JSON.stringify(input.document));
 if(encoded.length<2||encoded.length>MAX_DOCUMENT_BYTES)return fail('document size');
 fileEntries.push([target.entry,encoded]);
 for(const [name,bytes] of Object.entries(input.assets||{})){
  path(name);mediaType(name);
  if(!(bytes instanceof Uint8Array)||!bytes.length)return fail('empty or invalid asset');
  if(!hasMediaSignature(name,bytes))return fail('asset signature mismatch');
  fileEntries.push([name,bytes]);
 }
 fileEntries.sort(([a],[b])=>a.localeCompare(b,'en'));
 const files:PackFile[]=[];
 for(const [name,bytes] of fileEntries)
  files.push({path:name,mime:name===target.entry?'application/json':mediaType(name),
   size:bytes.byteLength,sha256:await sha256(bytes)});
 const manifest=manifestOf({schema:ANEVUM_PACK_SCHEMA,kind:input.kind,title:input.title,
  creator:input.creator,version:input.version,entry:target.entry,files});
 validateNativeDocument(input.kind,input.document,manifest);
 const header=TEXT.encode(JSON.stringify(manifest));
 if(header.length>MAX_MANIFEST_BYTES)return fail('oversize manifest');
 const bytes=encodeZip([['anevum.json',header],...fileEntries]);
 if(bytes.length>MAX_PACK_BYTES)return fail('archive exceeds private pilot cap');
 const safeName=input.title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'creation';
 return {filename:safeName+'.'+target.extension,bytes,manifest};
}
/** Validate local pack and return declarative content; never execute scripts. */
export async function openNativePack(filename:string,bytes:Uint8Array):Promise<{
 manifest:PackManifest;document:unknown;assets:Map<string,Uint8Array>;
}>{
 const zip=decodeZip(bytes),header=zip.get('anevum.json');
 if(!header||header.length>MAX_MANIFEST_BYTES)return fail('missing manifest');
 let manifest:PackManifest;
 try{manifest=manifestOf(JSON.parse(DECODER.decode(header)));}catch{return fail('malformed manifest');}
 if(!filename.toLowerCase().endsWith('.'+PACK_KINDS[manifest.kind].extension))return fail('file extension mismatch');
 if(zip.size!==manifest.files.length+1)return fail('unexpected ZIP entries');
 for(const f of manifest.files){
  const data=zip.get(f.path);
  if(!data||data.byteLength!==f.size||await sha256(data)!==f.sha256)return fail('file integrity mismatch');
  if(f.path!==manifest.entry&&!hasMediaSignature(f.path,data))return fail('asset signature mismatch');
 }
 let document:unknown;
 try{document=JSON.parse(DECODER.decode(zip.get(manifest.entry)!));}catch{return fail('bad content JSON');}
 validateNativeDocument(manifest.kind,document,manifest);
 zip.delete('anevum.json');zip.delete(manifest.entry);
 return {manifest,document,assets:zip};
}
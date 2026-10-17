// ANEVUM V051: privileged OFFLINE static ZIP inspection for future game releases.
// Deliberately no network access, extraction to disk, HTML execution, R2 writes,
// malware verdict, publishing, approval, or public URL generation.
// Requires Node >=22. Uses only built-in zlib/crypto, no third-party unzipper.
import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const MiB=1048576;
export const PREFLIGHT_LIMITS=Object.freeze({
 archiveBytes:20*MiB,entries:128,entryBytes:16*MiB,totalBytes:96*MiB,
 maxDepth:10,maxRatio:200,
});
const TYPES=Object.freeze({
 html:'text/html',css:'text/css',js:'text/javascript',mjs:'text/javascript',
 json:'application/json',webmanifest:'application/manifest+json',
 png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',
 webp:'image/webp',svg:'image/svg+xml',ico:'image/x-icon',
 mp3:'audio/mpeg',ogg:'audio/ogg',wav:'audio/wav',
 mp4:'video/mp4',webm:'video/webm',woff:'font/woff',
 woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',
 wasm:'application/wasm',txt:'text/plain',md:'text/markdown',
 map:'application/json',
});
const bannedExt=new Set(['zip','jar','tar','gz','tgz','7z','rar','exe','dll','so','dylib','bat',
 'cmd','sh','ps1','php','py','rb','pl','cgi','pem','key','p12','sqlite','db','env']);
const utf8=new TextDecoder('utf-8',{fatal:true});
const u16=(a,p)=>a[p]|(a[p+1]<<8);
const u32=(a,p)=>(a[p]|(a[p+1]<<8)|(a[p+2]<<16)|(a[p+3]<<24))>>>0;
const validRange=(a,p,n)=>p>=0&&n>=0&&Number.isSafeInteger(p+n)&&p+n<=a.length;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const crcTable=Uint32Array.from({length:256},(_,n)=>{
 let c=n;for(let i=0;i<8;i++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;
 return c>>>0;
});
function crc32(bytes){
 let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);
 return (c^0xffffffff)>>>0;
}
export class PreflightError extends Error{
 constructor(code,detail=''){super(detail?code+': '+detail:code);this.name='PreflightError';this.code=code;}
}
function deny(code,detail){throw new PreflightError(code,detail);}
function filename(a,p,len,flags){
 if(!validRange(a,p,len))deny('TRUNCATED_FILENAME');
 const raw=a.subarray(p,p+len);
 if(!(flags&2048)&&raw.some(b=>b>127))deny('NON_UTF8_FILENAME');
 try{return utf8.decode(raw);}catch{deny('NON_UTF8_FILENAME');}
}
function cleanPath(name,dir,seen,limits){
 if(!name||name.length>220||/[\u0000-\u001f\u007f\\:%]/.test(name)||
    name.startsWith('/')||name.endsWith('//'))deny('UNSAFE_PATH',name.slice(0,100));
 const segments=(dir?name.slice(0,-1):name).split('/');
 if(segments.length>limits.maxDepth||segments.some(s=>!s||s==='.'||s==='..'||
    s.startsWith('.')||s.length>100))deny('UNSAFE_PATH',name.slice(0,100));
 const normalized=name.normalize('NFC').toLowerCase();
 if(seen.has(normalized))deny('DUPLICATE_PATH',name.slice(0,100));
 seen.add(normalized);
 if(dir)return null;
 const ext=segments.at(-1).split('.').at(-1).toLowerCase();
 if(bannedExt.has(ext)||!Object.hasOwn(TYPES,ext))deny('UNSUPPORTED_FILE',name.slice(0,100));
 return TYPES[ext];
}
function endRecord(a){
 // ZIP end-of-central-directory must terminate the file; no appended payload.
 for(let p=a.length-22;p>=Math.max(0,a.length-22-65535);p--){
  if(u32(a,p)!==0x06054b50)continue;
  if(!validRange(a,p,22))continue;
  const comment=u16(a,p+20);
  if(p+22+comment!==a.length)continue;
  const disk=u16(a,p+4),disk2=u16(a,p+6),
   countDisk=u16(a,p+8),count=u16(a,p+10),
   centralSize=u32(a,p+12),centralStart=u32(a,p+16);
  if(disk!==0||disk2!==0||countDisk!==count)deny('MULTI_DISK_ARCHIVE');
  if(count===65535||centralSize===0xffffffff||centralStart===0xffffffff)deny('ZIP64_UNSUPPORTED');
  return {p,count,centralSize,centralStart};
 }
 deny('MISSING_END_DIRECTORY');
}
function rejectExtra(a,pos,len){
 let n=0;
 while(n<len){
  if(n+4>len)deny('MALFORMED_EXTRA');
  const id=u16(a,pos+n),bytes=u16(a,pos+n+2);
  if(n+4+bytes>len)deny('MALFORMED_EXTRA');
  if(id===1)deny('ZIP64_UNSUPPORTED');
  n+=4+bytes;
 }
}
function checkFlags(flags){
 // Streaming data descriptors, encryption and patched data obscure immutable
 // byte boundaries; a repack with local headers is required for this pilot.
 if(flags&1)deny('ENCRYPTED_ARCHIVE');
 if(flags&8)deny('DATA_DESCRIPTOR_UNSUPPORTED');
 if(flags&~2048)deny('UNSUPPORTED_ZIP_FLAGS');
}
export function inspectCreatorZip(input,{expectedSha256,limits=PREFLIGHT_LIMITS}={}){
 if(!(input instanceof Uint8Array)||input.byteLength<22)deny('INVALID_ARCHIVE');
 if(input.byteLength>limits.archiveBytes)deny('ARCHIVE_TOO_LARGE');
 if(typeof expectedSha256!=='string'||!/^[a-f0-9]{64}$/.test(expectedSha256))
  deny('EXPECTED_SHA256_REQUIRED');
 const bytes=input,archiveHash=sha(bytes);
 if(archiveHash!==expectedSha256)deny('SUBMISSION_HASH_MISMATCH');
 const end=endRecord(bytes);
 if(!end.count||end.count>limits.entries)deny('INVALID_ENTRY_COUNT');
 if(end.centralStart+end.centralSize!==end.p||end.centralStart<4||
    !validRange(bytes,end.centralStart,end.centralSize))deny('INVALID_CENTRAL_DIRECTORY');
 const seen=new Set(),entries=[],ranges=[];let cursor=end.centralStart,total=0;
 for(let i=0;i<end.count;i++){
  if(!validRange(bytes,cursor,46)||u32(bytes,cursor)!==0x02014b50)deny('BAD_CENTRAL_ENTRY');
  const madeBy=u16(bytes,cursor+4),flags=u16(bytes,cursor+8),method=u16(bytes,cursor+10),
   crc=u32(bytes,cursor+16),compressed=u32(bytes,cursor+20),
   expanded=u32(bytes,cursor+24),nameLen=u16(bytes,cursor+28),
   extraLen=u16(bytes,cursor+30),commentLen=u16(bytes,cursor+32),
   diskStart=u16(bytes,cursor+34),extMode=u32(bytes,cursor+38),
   offset=u32(bytes,cursor+42);
  const length=46+nameLen+extraLen+commentLen;
  if(!nameLen||!validRange(bytes,cursor,length)||cursor+length>end.p)deny('BAD_CENTRAL_ENTRY');
  checkFlags(flags);
  if(method!==0&&method!==8)deny('UNSUPPORTED_COMPRESSION');
  if(diskStart!==0||offset===0xffffffff||compressed===0xffffffff||expanded===0xffffffff)
   deny('ZIP64_UNSUPPORTED');
  const name=filename(bytes,cursor+46,nameLen,flags),dir=name.endsWith('/');
  const mediaType=cleanPath(name,dir,seen,limits);
  rejectExtra(bytes,cursor+46+nameLen,extraLen);
  const unixMode=(madeBy>>8)===3?(extMode>>>16):0;
  const type=unixMode&0xf000;
  if(type&&type!==(dir?0x4000:0x8000))deny('UNSAFE_FILE_MODE',name);
  if(!dir&&expanded>limits.entryBytes)deny('ENTRY_TOO_LARGE',name);
  if(compressed>limits.archiveBytes)deny('ENTRY_TOO_LARGE',name);
  if(!dir&&expanded>2*MiB&&expanded>compressed*limits.maxRatio)deny('SUSPICIOUS_COMPRESSION',name);
  if(dir&&(expanded!==0||compressed!==0))deny('INVALID_DIRECTORY',name);
  if(!validRange(bytes,offset,30)||u32(bytes,offset)!==0x04034b50)deny('BAD_LOCAL_HEADER',name);
  const localFlags=u16(bytes,offset+6),localMethod=u16(bytes,offset+8),
   localCrc=u32(bytes,offset+14),localCompressed=u32(bytes,offset+18),
   localExpanded=u32(bytes,offset+22),localName=u16(bytes,offset+26),
   localExtra=u16(bytes,offset+28);
  if(localFlags!==flags||localMethod!==method||localCrc!==crc||
     localCompressed!==compressed||localExpanded!==expanded||localName!==nameLen)
   deny('LOCAL_HEADER_MISMATCH',name);
  const dataStart=offset+30+localName+localExtra,dataEnd=dataStart+compressed;
  if(!validRange(bytes,offset,30+localName+localExtra+compressed)||dataEnd>end.centralStart)
   deny('INVALID_ENTRY_BOUNDS',name);
  if(filename(bytes,offset+30,localName,flags)!==name)deny('LOCAL_FILENAME_MISMATCH',name);
  rejectExtra(bytes,offset+30+localName,localExtra);
  ranges.push([offset,dataEnd]);
  if(!dir){
   let plain;
   const payload=bytes.subarray(dataStart,dataEnd);
   try{plain=method===0?payload:inflateRawSync(payload,{maxOutputLength:limits.entryBytes+1});}
   catch{deny('DECOMPRESSION_FAILED',name);}
   if(plain.length!==expanded)deny('UNCOMPRESSED_SIZE_MISMATCH',name);
   if(crc32(plain)!==crc)deny('CRC_MISMATCH',name);
   total+=plain.length;
   if(total>limits.totalBytes)deny('TOTAL_UNCOMPRESSED_LIMIT');
   entries.push({name,mediaType,compressedBytes:compressed,uncompressedBytes:expanded,sha256:sha(plain)});
  }
  cursor+=length;
 }
 if(cursor!==end.centralStart+end.centralSize)deny('CENTRAL_DIRECTORY_TRAILING_DATA');
 ranges.sort((a,b)=>a[0]-b[0]);
 if(ranges[0][0]!==0)deny('PREPENDED_ARCHIVE_CONTENT');
 for(let i=1;i<ranges.length;i++)if(ranges[i][0]!==ranges[i-1][1])
  deny('OVERLAPPING_OR_UNREFERENCED_DATA');
 if(ranges.at(-1)[1]!==end.centralStart)deny('UNREFERENCED_ARCHIVE_DATA');
 if(!entries.some(e=>e.name==='index.html'))deny('MISSING_ROOT_INDEX');
 return {schema:'anevum.creator-archive-preflight.v1',stage:'structural-preflight',
  archiveSha256:archiveHash,archiveBytes:bytes.length,entryPoint:'index.html',
  entries,totalUncompressedBytes:total,
  malwareScanPassed:false,securityReviewPassed:false,approvedForPublicRelease:false,
  warning:'Structural ZIP preflight only. No malware scanning, licensing verification, code trust or permission to execute.'};
}
async function cli(){
 const [file,flag,hash]=process.argv.slice(2);
 if(!file||flag!=='--expected-sha256'||!hash)deny('USAGE','node inspect-creator-zip.mjs file.zip --expected-sha256 <64-lower-hex>');
 const bytes=await readFile(file);
 process.stdout.write(JSON.stringify(inspectCreatorZip(bytes,{expectedSha256:hash}),null,2)+'\n');
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 cli().catch(e=>{process.stderr.write((e.code||'PREFLIGHT_ERROR')+': '+e.message+'\n');process.exitCode=1;});
}

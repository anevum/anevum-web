/** Offline cinematic asset source/integrity audit. No credentials, inference or network. */
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=fileURLToPath(new URL('.',import.meta.url));
const publicRoot=resolve(here,'../web/public');
const manifest=JSON.parse(readFileSync(resolve(publicRoot,'assets/cinematic-v136/arrival/manifest.json'),'utf8'));
const source=JSON.parse(readFileSync(resolve(publicRoot,manifest.sourceManifest),'utf8'));
const assertRelative=path=>{
  assert.match(path,/^assets\/[a-z0-9/_-]+\.(?:webp|avif|json)$/);
  const full=resolve(publicRoot,path);
  assert.ok(full.startsWith(publicRoot+sep),'Asset path escapes public root');
  return full;
};
assert.equal(manifest.schema,'anevum.cinematic.arrival.v1');
assert.equal(manifest.status,'preview-only');
assert.equal(manifest.mode,'poster-pilot');
assert.equal(manifest.sequence,null,'No frame/video sequence may be claimed without verified assets');
assert.equal(source.assetType,'environment-only','Never misrepresent artwork as live catalogue');
assert.equal(source.native4k,false,'Do not claim native 4K from 1672px master');
assert.equal(manifest.handoff.sceneSector,'hero');
assert.equal(manifest.handoff.geometry,'atrium');
assert.ok(manifest.handoff.revealStart>=0&&manifest.handoff.revealEnd<=1&&manifest.handoff.revealEnd>manifest.handoff.revealStart);
const results=[];
for(const [tier,p] of Object.entries(manifest.posters)){
  assert.ok(['desktop','mobile'].includes(tier));
  const path=assertRelative(p.path),bytes=readFileSync(path);
  assert.equal(bytes.byteLength,p.bytes,'Byte mismatch '+p.path);
  assert.equal(statSync(path).size,p.bytes,'File stat mismatch '+p.path);
  const sha=createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha,p.sha256,'Digest mismatch '+p.path);
  assert.ok(p.bytes<=400_000,'Poster exceeds 400 KB '+p.path);
  assert.ok(Number.isInteger(p.width)&&p.width>0&&p.width<=2000);
  assert.ok(Number.isInteger(p.height)&&p.height>0&&p.height<=1200);
  const original=source.variants.find(variant=>variant.path===p.path.split('/').at(-1));
  assert.ok(original,'Poster missing original provenance '+p.path);
  assert.equal(original.bytes,p.bytes);
  assert.equal(original.sha256,p.sha256);
  results.push({tier,asset:p.path,width:p.width,height:p.height,bytes:p.bytes,sha256:sha});
}
assert.equal(results.length,2);
console.log(JSON.stringify({status:'CINEMATIC_POSTER_INTEGRITY_PASS',source:manifest.source,posters:results,sequence:'not-authorized',network:'none',privateContent:'none'},null,2));

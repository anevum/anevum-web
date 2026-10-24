/** Build gate for shipped GLB integrity, optimized encoding and transfer budgets. */
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='creator-v1/web/public',folder=root+'/assets/institute/v136-011';
const manifest=JSON.parse(readFileSync(folder+'/manifest.json','utf8'));
assert.ok(manifest.provenance.startsWith('Original ANEVUM'));
let total=0;
for(const [family,variants] of Object.entries(manifest.families))for(const [tier,asset] of Object.entries(variants)){
 const bytes=readFileSync(root+asset.url);total+=bytes.length;
 assert.equal(bytes.length,asset.bytes,family+' length');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,family+' digest');
 assert.equal(bytes.readUInt32LE(0),0x46546c67,'GLB magic');assert.equal(bytes.readUInt32LE(4),2,'glTF 2');assert.equal(bytes.readUInt32LE(8),bytes.length);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 assert.ok(json.extensionsRequired.includes('EXT_meshopt_compression'),'Meshopt required, never an uncompressed duplicate');
 assert.ok(json.extensionsUsed.includes('KHR_materials_emissive_strength'),'Preserve photonic material energy');
 assert.ok(json.nodes.length>200,'Architectural detail is in models');
 assert.ok(!json.images?.length,'No hidden raster concept art or outside texture dependency');
 assert.ok(!json.buffers.some(b=>b.uri),'Self-contained binary geometry');
 assert.ok(asset.triangles<(tier==='mobile'?25000:60000),'Triangle budget');
 assert.ok(bytes.length<(tier==='mobile'?250000:500000),'Device-specific asset budget');
 console.log('PASS',family,tier,bytes.length+' bytes',asset.triangles+' triangles');
}
assert.equal(readdirSync(folder).filter(p=>p.endsWith('.glb')).length,8);
assert.ok(total<1500000,'All eight variants under 1.5 MB');
console.log('PASS original asset provenance, all references, Meshopt, material fidelity and budgets:',total,'bytes');

const surfaces=JSON.parse(readFileSync(folder+'/texture-manifest.json','utf8'));
for(const [tier,variants] of Object.entries(surfaces.variants))for(const [format,asset] of Object.entries(variants)){
 const bytes=readFileSync(root+asset.url);assert.equal(bytes.length,asset.bytes);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
 assert.equal(bytes.subarray(0,12).toString('hex'),'ab4b5458203131bb0d0a1a0a','KTX container');
 assert.equal(bytes.readUInt32LE(28),asset.internalFormat);assert.equal(bytes.readUInt32LE(36),asset.width);assert.equal(bytes.readUInt32LE(40),asset.height);
 assert.equal(bytes.readUInt32LE(56),asset.mipmaps);assert.ok(asset.mipmaps>=9,'Complete mip chain');
 assert.ok(bytes.length<(tier==='mobile'?90000:350000),'Native surface transfer budget');
 console.log('PASS original mipmapped GPU normal',tier,format,bytes.length,'bytes');
}

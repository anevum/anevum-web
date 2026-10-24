import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder as optimized} from 'meshoptimizer';
import {MeshoptDecoder as reference} from 'meshoptimizer/meshopt_decoder_reference.js';
const hash=array=>createHash('sha256').update(new Uint8Array(array.buffer,array.byteOffset,array.byteLength)).digest('hex');
const io=decoder=>new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':decoder});
test('CSP-compatible JS decoder reconstructs every shipped model exactly like optimized Meshopt',async()=>{
 const manifest=JSON.parse(readFileSync('creator-v1/web/public/assets/institute/v136-011/manifest.json','utf8'));
 await optimized.ready;
 for(const [family,variants] of Object.entries(manifest.families))for(const [tier,asset] of Object.entries(variants)){
  const bytes=new Uint8Array(readFileSync('creator-v1/web/public'+asset.url));
  const [a,b]=await Promise.all([io(reference).readBinary(bytes),io(optimized).readBinary(bytes)]);
  const left=a.getRoot().listAccessors(),right=b.getRoot().listAccessors();assert.equal(left.length,right.length);
  left.forEach((accessor,i)=>assert.equal(hash(accessor.getArray()),hash(right[i].getArray()),family+'/'+tier+' decoded accessor '+i));
 }
});

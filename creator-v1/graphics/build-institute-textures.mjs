/** Original ANEVUM brushed-alloy normal maps -> Basis UASTC -> native GPU KTX.
 * Native ASTC/BC7/ETC2 avoids runtime WASM under the unchanged production CSP.
 * Rebuild on Linux x64: npm install; node creator-v1/graphics/build-institute-textures.mjs
 * Set BASISU_BIN for an equivalent official encoder on another build platform. */
import {mkdirSync,writeFileSync,readFileSync,mkdtempSync,copyFileSync,rmSync,chmodSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {deflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const output=resolve('creator-v1/web/public/assets/institute/v136-011'),temp=mkdtempSync(join(tmpdir(),'anevum-alloy-'));
mkdirSync(output,{recursive:true});
const encoder=process.env.BASISU_BIN||resolve('node_modules/basisu/bin/linux/x64/basisu');chmodSync(encoder,0o755);
const version=execFileSync(encoder,['-version'],{encoding:'utf8'}).split('\n')[0];
const crcTable=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});
const crc=bytes=>{let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0};
function chunk(type,data){const label=Buffer.from(type),size=Buffer.alloc(4),sum=Buffer.alloc(4);size.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([label,data])));return Buffer.concat([size,label,data,sum])}
function normalPNG(size){
 const pixels=Buffer.alloc((size*4+1)*size);let seed=136011;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;const grain=seed/4294967296-.5;
  const line=Math.sin(y*.9*512/size)*.35+Math.sin(y*2.71*512/size)*.2+grain*.45;
  const i=y*(size*4+1)+1+x*4;pixels[i]=128+Math.round(line*19);pixels[i+1]=128+Math.round(grain*7);pixels[i+2]=254;pixels[i+3]=255;
 }
 const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
const manifest={version:'136.011.1',surface:'Original deterministic ANEVUM brushed-alloy normal',generator:'creator-v1/graphics/build-institute-textures.mjs',encoderPackage:'basisu@1.16.3',encoderBinary:version,container:'KTX1 native GPU blocks; no client transcoder',colorSpace:'linear normal',variants:{}};
try{
 for(const [tier,size] of [['mobile',256],['desktop',512]]){
  const base=join(temp,'alloy-'+tier),png=base+'.png',basis=base+'.basis';writeFileSync(png,normalPNG(size));
  execFileSync(encoder,['-file',png,'-uastc','-uastc_level','2','-normal_map','-mipmap','-no_multithreading','-output_file',basis],{cwd:temp,stdio:'pipe'});
  execFileSync(encoder,['-unpack',basis,'-no_multithreading'],{cwd:temp,stdio:'pipe'});
  manifest.variants[tier]={};
  for(const [format,internal] of [['ASTC_RGBA',0x93b0],['BC7_RGBA',0x8e8c],['ETC2_RGBA',0x9278]]){
   const name='alloy-normal-'+tier+'-'+format.toLowerCase()+'.ktx',from=base+'_transcoded_'+format+'_0000.ktx';
   copyFileSync(from,join(output,name));const bytes=readFileSync(from);
   if(bytes.readUInt32LE(28)!==internal)throw Error('Unexpected GPU format');
   manifest.variants[tier][format]={url:'/assets/institute/v136-011/'+name,bytes:bytes.length,width:size,height:size,internalFormat:internal,mipmaps:bytes.readUInt32LE(56),sha256:createHash('sha256').update(bytes).digest('hex')};
   console.log(name,bytes.length,'bytes',manifest.variants[tier][format].mipmaps,'mip levels');
  }
 }
 writeFileSync(join(output,'texture-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
}finally{rmSync(temp,{recursive:true,force:true})}

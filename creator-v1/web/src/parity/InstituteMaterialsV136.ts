import * as T from 'three';
/** Original deterministic brushed-alloy normal surface. Generated directly in
 * GPU-ready RGBA bytes with mipmaps; no giant image download or private input.
 * This procedural detail is complementary to future authored KTX2 surfaces. */
export function instituteAlloySurface(mobile:boolean,maxAnisotropy:number){
 const size=mobile?128:512,data=new Uint8Array(size*size*4);let seed=136011;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;const grain=seed/4294967296-.5;
  const line=Math.sin(y*.9)*.35+Math.sin(y*2.71)*.2+grain*.45;
  const i=(y*size+x)*4;data[i]=128+Math.round(line*19);data[i+1]=128+Math.round(grain*7);data[i+2]=254;data[i+3]=255;
 }
 const texture=new T.DataTexture(data,size,size,T.RGBAFormat,T.UnsignedByteType);
 texture.name='ANEVUM original brushed alloy v136.011';texture.wrapS=texture.wrapT=T.RepeatWrapping;
 texture.repeat.set(4,4);texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;
 texture.magFilter=T.LinearFilter;texture.anisotropy=Math.min(4,maxAnisotropy);texture.needsUpdate=true;
 return texture;
}

import {KTXLoader} from 'three/addons/loaders/KTXLoader.js';
import surfaces from '../../public/assets/institute/v136-011/texture-manifest.json';
/** Select native GPU blocks offline-encoded through Basis. No client WASM or
 * dynamic code generation, and no download of formats this GPU cannot use. */
export async function nativeAlloySurface(gl:WebGL2RenderingContext,mobile:boolean,signal:AbortSignal,maxAnisotropy:number){
 for(const extension of ['WEBGL_compressed_texture_astc','EXT_texture_compression_bptc','WEBGL_compressed_texture_etc'])gl.getExtension(extension);
 const supported=new Set<number>(gl.getParameter(gl.COMPRESSED_TEXTURE_FORMATS));
 const variants=surfaces.variants[mobile?'mobile':'desktop'];
 const preference=mobile?['ASTC_RGBA','ETC2_RGBA','BC7_RGBA'] as const:['BC7_RGBA','ASTC_RGBA','ETC2_RGBA'] as const;
 const format=preference.find(name=>supported.has(variants[name].internalFormat));if(!format)return null;
 const asset=variants[format];const response=await fetch(asset.url,{signal,credentials:'omit',cache:'force-cache'});
 if(!response.ok)throw Error('Material surface unavailable');
 const bytes=await response.arrayBuffer();if(bytes.byteLength!==asset.bytes)throw Error('Material surface length mismatch');
 const parsed=new KTXLoader().parse(bytes,true);
 if(parsed.format!==asset.internalFormat)throw Error('Unexpected native surface format');
 const texture=new T.CompressedTexture(parsed.mipmaps,parsed.width,parsed.height,parsed.format as T.CompressedPixelFormat);
 texture.name=surfaces.surface;texture.colorSpace=T.NoColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;
 texture.repeat.set(4,4);texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;
 texture.generateMipmaps=false;texture.anisotropy=Math.min(4,maxAnisotropy);texture.needsUpdate=true;
 return {texture,format,bytes:asset.bytes};
}

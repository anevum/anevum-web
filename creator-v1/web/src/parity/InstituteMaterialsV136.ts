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

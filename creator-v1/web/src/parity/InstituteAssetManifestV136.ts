import manifest from '../../public/assets/institute/v136-011/manifest.json';
import type {SceneGeometry} from './SceneDirectorV136';
export type AssetTier='mobile'|'desktop';
export const instituteManifest=manifest;
export const instituteAsset=(family:SceneGeometry,tier:AssetTier)=>manifest.families[family][tier];
/** Keep allocation independent from physical DPR: 4K phones do not get desktop meshes. */
export function instituteBudget(width:number,dpr:number,saveData=false){
 const mobile=width<850||saveData;
 return {tier:(mobile?'mobile':'desktop') as AssetTier,
  pixelRatio:Math.min(Math.max(1,dpr||1),mobile?1.25:1.6),
  maxPixels:mobile?650000:1800000,frameMs:mobile?1000/30:1000/60,
  bloom:!mobile,maxCachedFamilies:2};
}

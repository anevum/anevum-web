import {relicRasterAssets} from "../lib/relic-raster-assets";

/** Use actual approved WebP raster files; never infer a user's earned level. */
export function RelicRaster({level,name,large=false}:{
  level:number;name:string;large?:boolean
}) {
  const art=Number.isSafeInteger(level)?relicRasterAssets[level]:undefined;
  if(!art || art.name!==name)return null;
  const path=import.meta.env.BASE_URL+"assets/artifacts/series-01/"+art.stem;
  return <img
    className={"relic-raster"+(large?" relic-raster--large":"")}
    src={path+"-384.webp"}
    srcSet={path+"-192.webp 192w, "+path+"-384.webp 384w, "+path+"-768.webp 768w"}
    sizes={large?"(max-width:650px) 176px, 256px":"(max-width:650px) 100px, 160px"}
    width={large?256:160}
    height={large?256:160}
    loading="lazy"
    decoding="async"
    alt={"Illustration of "+name}
    draggable={false}
  />;
}

export function hasApprovedRelicRaster(level:number,name:string):boolean{
  const art=Number.isSafeInteger(level)?relicRasterAssets[level]:undefined;
  return !!art&&art.name===name;
}

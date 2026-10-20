import {useEffect, useState} from "react";
import {CosmicIllustration, type CosmicScene} from "./CosmicIllustration";

/** Local, versioned ANEVUM illustration masters; never creator-submitted covers. */
const assets: Record<CosmicScene, string> = {
  hero:"hero/portal-world.webp",
  portal:"hero/skyward-city.webp",
  games:"categories/games.webp",
  tools:"categories/apps.webp",
  automation:"categories/automation.webp",
  research:"categories/research.webp",
  creative:"categories/creative.webp",
  learning:"categories/learning.webp",
  libraries:"categories/libraries.webp",
  other:"categories/other.webp"
};
// Full-frame V014 originals replace the soft concept-board crops where ready.
// Historical masters stay versioned; unavailable fields keep their own artwork.
const originals:Partial<Record<CosmicScene,string>>={
  hero:"games",games:"games",tools:"tools",creative:"creative",libraries:"libraries"
};

export function cinematicArtUrl(scene:CosmicScene):string {
  // Vite's base is / on anevum.com, /creator/ on isolated next.anevum.com.
  if(originals[scene])return import.meta.env.BASE_URL+"assets/community-portals/"+originals[scene]+"-1536.webp";
  return import.meta.env.BASE_URL + "assets/cinematic/" + assets[scene];
}

export function CosmicArtwork({scene="hero",priority=false,className="",title}: {
  scene?:CosmicScene;priority?:boolean;className?:string;title?:string;
}) {
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[scene]);
  return <span className={"cw-artwork cw-artwork--"+scene+" "+className}
    role={title?"img":undefined} aria-label={title||undefined} aria-hidden={title?undefined:true}>
    {failed ? <CosmicIllustration scene={scene} className="cw-artwork-vector"/> :
      <img className="cw-artwork-image" src={cinematicArtUrl(scene)} alt="" aria-hidden="true"
        srcSet={originals[scene]?import.meta.env.BASE_URL+"assets/community-portals/"+originals[scene]+"-768.webp 768w, "+cinematicArtUrl(scene)+" 1536w":undefined}
        sizes={scene==="hero"?"100vw":"(max-width: 700px) 100vw, 50vw"}
        width={originals[scene]?1536:undefined} height={originals[scene]?1024:undefined}
        decoding="async" loading={priority?"eager":"lazy"} fetchPriority={priority?"high":"auto"}
        draggable={false} onError={()=>setFailed(true)} />}
    <span className="cw-artwork-glaze" aria-hidden="true" />
  </span>;
}

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

export function cinematicArtUrl(scene:CosmicScene):string {
  // Vite's base is / on anevum.com, /creator/ on isolated next.anevum.com.
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
        decoding="async" loading={priority?"eager":"lazy"} fetchPriority={priority?"high":"auto"}
        draggable={false} onError={()=>setFailed(true)} />}
    <span className="cw-artwork-glaze" aria-hidden="true" />
  </span>;
}

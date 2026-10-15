import {useEffect,useState,type CSSProperties} from "react";

/** ANEVUM V010 optional presentation layers from the verified V004 individual-file
 * package. The current cinematic public art remains primary. The package contains
 * procedural decorations, NOT completed cinematic environment masters.
 *
 * Fails closed to V009 visuals whenever the separately installed, checksum-checked
 * asset set is missing. No private data, member auth, storage or XP code here.
 */
const kitRoot=import.meta.env.BASE_URL+"assets/anevum-kit/";
export type VisualRoom="home"|"discover"|"community"|"people"|"create"|"learning"|"notes";
const backgrounds:Record<VisualRoom,string>={
  home:"hero",discover:"explore",community:"community",
  people:"people",create:"create",learning:"notes",notes:"notes"
};
let availability:Promise<boolean>|null=null;

export function checkVisualKit():Promise<boolean>{
  if(availability)return availability;
  availability=(async()=>{
    try{
      const response=await fetch(kitRoot+"manifest.json",{
        method:"GET",credentials:"omit",cache:"no-cache",
        headers:{Accept:"application/json"}
      });
      if(!response.ok||!(response.headers.get("content-type")||"").includes("json"))return false;
      const manifest=await response.json() as {
        version?:string;status?:string;assets?:string[];source_sha256?:string;
      };
      if(manifest.version!=="V010"||manifest.status!=="MOUNTED"||
         !Array.isArray(manifest.assets)||
         !manifest.assets.includes("backgrounds/hero-atmosphere.webp")||
         !/^[a-f0-9]{64}$/.test(manifest.source_sha256||""))return false;
      return await new Promise<boolean>(resolve=>{
        const image=new Image();
        image.onload=()=>resolve(image.naturalWidth>=1920&&image.naturalHeight>=1080);
        image.onerror=()=>resolve(false);
        image.src=kitRoot+"backgrounds/hero-atmosphere.webp";
      });
    }catch{return false;}
  })();
  return availability;
}
function useMountedKit(){
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    let active=true;
    void checkVisualKit().then(ok=>{if(active)setReady(ok);});
    return()=>{active=false;};
  },[]);
  return ready;
}
/** Never infer a member route from public imagery or display founder/private work. */
export function publicVisualRoom(path:string):VisualRoom|null{
  if(path==="/")return "home";
  if(path==="/discover"||path.startsWith("/discover/"))return "discover";
  if(path==="/community"||path.startsWith("/community/")||path==="/boards")return "community";
  if(path==="/creators"||path.startsWith("/creators/"))return "people";
  if(path==="/start"||path==="/guide")return "learning";
  if(path==="/status")return "notes";
  return null; // account, messages, create, Atlas, Lab, staff, RHEN are never touched.
}
export function VisualKitAtmosphere({room,placement="page"}:{
  room:VisualRoom|null;placement?:"page"|"hero";
}){
  const ready=useMountedKit();
  if(!ready||!room)return null;
  const url=(name:string)=>'url("'+kitRoot+name+'")';
  const style={
    "--av10-room-scene":url("backgrounds/"+backgrounds[room]+"-atmosphere.webp"),
    "--av10-room-grain":url("textures/subtle-grain-alpha.png"),
    "--av10-room-stars":url("textures/stars-alpha.png"),
    "--av10-room-orbit":url("ornaments/hero-orbit-trails.svg"),
    "--av10-room-haze":url("effects/horizon-haze-1600x900.webp")
  } as CSSProperties;
  return <div className={"av10-atmosphere av10-atmosphere--"+placement}
    data-visual-kit="V010" data-visual-room={room} style={style} aria-hidden="true">
    <span className="av10-scene"/><span className="av10-haze"/>
    <span className="av10-orbit"/><span className="av10-grain"/>
  </div>;
}

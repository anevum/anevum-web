/**
 * ANEVUM / FAMILY FIELD — entirely fictional local simulation.
 *
 * Every name, device, coordinate sequence, and permission here is fabricated
 * for UI evaluation. No user IDs, browser geolocation, network requests,
 * analytics, persistence, historical tracking or ANEVUM API integrations.
 *
 * The points are illustrative map coordinates, NOT assessed or safe routes.
 */
export const DEFAULT_CENTER=Object.freeze([-81.2873,28.2483]);
export const RUN_LENGTH_SECONDS=180;
export const SHARE_LENGTH_SECONDS=140;

const PRIVATE_SAMPLES=Object.freeze([
  Object.freeze({
    id:"a",name:"Sample Device A",initial:"A",accuracyM:12,
    path:Object.freeze([
      [-81.2920,28.2492],[-81.2899,28.2498],
      [-81.2873,28.2488],[-81.2852,28.2475],
      [-81.2837,28.2478],[-81.2818,28.2493]
    ])
  }),
  Object.freeze({
    id:"b",name:"Sample Device B",initial:"B",accuracyM:18,
    path:Object.freeze([
      [-81.2824,28.2460],[-81.2838,28.2475],
      [-81.2854,28.2485],[-81.2871,28.2494],
      [-81.2888,28.2507],[-81.2905,28.2512]
    ])
  })
]);

export const FICTIONAL_PLACES=Object.freeze([
  Object.freeze({id:"sample-hub",label:"Sample Gathering Point",coords:[-81.2867,28.2499],kind:"Mock event waypoint"}),
  Object.freeze({id:"sample-crossing",label:"Sample Crossing Marker",coords:[-81.2846,28.2474],kind:"Unverified example only"})
]);

export const FICTIONAL_ROUTE=Object.freeze([
  [-81.2915,28.2478],[-81.2890,28.2481],
  [-81.2865,28.2475],[-81.2846,28.2474],
  [-81.2828,28.2485]
]);

const copyCoords=p=>[p[0],p[1]];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function positionAlongPath(path,progress){
  if(!Array.isArray(path)||path.length<2 ||
    !Number.isFinite(progress))return null;
  const phase=clamp(progress,0,1)*(path.length-1);
  const start=Math.min(path.length-2,Math.floor(phase));
  const fraction=phase-start;
  const a=path[start],b=path[start+1];
  if(!Array.isArray(a)||!Array.isArray(b)||
    ![a[0],a[1],b[0],b[1]].every(Number.isFinite))return null;
  return [a[0]+(b[0]-a[0])*fraction,a[1]+(b[1]-a[1])*fraction];
}
export function freshness(ageSeconds){
  if(!Number.isFinite(ageSeconds)||ageSeconds<0)return "unavailable";
  if(ageSeconds<=30)return "recent";
  if(ageSeconds<120)return "stale";
  return "unavailable";
}

const empty=()=>({active:false,expiresAt:0,lastSeenAt:null,coords:null});
/**
 * A local demonstration clock, not a substitute for server consent.
 * Markers are hidden when a grant expires, a device stops, or GPS ages out.
 * No animation runs until the user explicitly starts the fictional scenario.
 */
export function createSyntheticWorld(){
  let seconds=0,started=false,running=false,signalB=true;
  let sample={a:empty(),b:empty()};
  const update=()=>{
    for(const device of PRIVATE_SAMPLES){
      const p=sample[device.id];
      if(!p.active)continue;
      if(seconds>=p.expiresAt){
        p.active=false;p.lastSeenAt=null;p.coords=null;
        continue;
      }
      if(device.id==="b"&&!signalB)continue;
      p.coords=positionAlongPath(device.path,seconds/RUN_LENGTH_SECONDS);
      p.lastSeenAt=seconds;
    }
  };
  const snapshot=()=>({
    elapsedSeconds:seconds,started,running,signalB,
    remainingSeconds:Math.max(0,RUN_LENGTH_SECONDS-seconds),
    devices:PRIVATE_SAMPLES.map(d=>{
      const p=sample[d.id];
      const age=p.lastSeenAt===null?null:seconds-p.lastSeenAt;
      const state=p.active&&age!==null?freshness(age):"unavailable";
      return {
        id:d.id,name:d.name,initial:d.initial,accuracyM:d.accuracyM,
        state,coordinates:state==="unavailable"?null:copyCoords(p.coords),
        ageSeconds:age,sharing:p.active,
        expiresIn:p.active?Math.max(0,p.expiresAt-seconds):0,
        fictitious:true
      };
    })
  });
  const world={
    start(){
      seconds=0;started=true;running=true;signalB=true;
      sample={a:{...empty(),active:true,expiresAt:SHARE_LENGTH_SECONDS},
              b:{...empty(),active:true,expiresAt:SHARE_LENGTH_SECONDS}};
      update();return snapshot();
    },
    step(dt){
      if(!running||!started||!Number.isFinite(dt)||dt<=0)return snapshot();
      seconds=Math.min(RUN_LENGTH_SECONDS,seconds+clamp(dt,0,20));
      update();
      if(seconds>=RUN_LENGTH_SECONDS)running=false;
      return snapshot();
    },
    pause(){running=false;return snapshot();},
    resume(){if(started&&seconds<RUN_LENGTH_SECONDS)running=true;return snapshot();},
    signalB(active){signalB=active===true;return snapshot();},
    revoke(id){
      if(id!=="a"&&id!=="b")return snapshot();
      sample[id]=empty();return snapshot();
    },
    reset(){
      seconds=0;started=false;running=false;signalB=true;
      sample={a:empty(),b:empty()};return snapshot();
    },
    getSnapshot:snapshot
  };
  return world;
}

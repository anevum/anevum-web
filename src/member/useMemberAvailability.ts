import { useEffect, useState } from "react";
type Availability = "checking" | "available" | "unavailable";
const refreshEvent = "anevum-member-availability-refresh";
/** Explicitly retry after an outage; no permanent negative cache. */
export function refreshMemberAvailability() {
  if(typeof window!=="undefined")window.dispatchEvent(new Event(refreshEvent));
}
export function useMemberAvailability(): Availability {
  const [availability,setAvailability]=useState<Availability>("checking");
  useEffect(()=>{
    let active=true;
    let controller: AbortController|null=null;
    const refresh=()=>{
      controller?.abort();
      controller=new AbortController();
      const signal=controller.signal;
      if(active)setAvailability("checking");
      void fetch("/api/member/availability",{cache:"no-store",credentials:"same-origin",signal})
        .then(async response=>response.ok?response.json():null)
        .then((data:unknown)=>{
          if(!active||signal.aborted)return;
          const value=data&&typeof data==="object"&&!Array.isArray(data)?
            data as {available?:unknown;provider?:unknown}:null;
          setAvailability(value?.available===true&&value.provider==="google"?"available":"unavailable");
        })
        .catch(()=>{if(active&&!signal.aborted)setAvailability("unavailable");});
    };
    refresh();
    window.addEventListener(refreshEvent,refresh);
    return ()=>{
      active=false;
      controller?.abort();
      window.removeEventListener(refreshEvent,refresh);
    };
  },[]);
  return availability;
}

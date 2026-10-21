import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {canonicalAuthClient} from "../lib/canonical-beta";

/**
 * First-party staff shortcut. The canonical session determines *which* account
 * to query, and the independent same-origin staff grant endpoint decides whether
 * a shortcut is displayed. Never infer authorization from player cards, emblems,
 * a profile handle, email, or localStorage.
 */
type StaffRole="owner"|"reviewer";
type VerifiedStaff={memberId:string;role:StaffRole|null;designation:"founder"|null};
const endpoint="/__anevum_profile_staff_role_v001";

export function VerifiedStaffShortcut({location="profile"}:{location?:"profile"|"wayfinder"}){
  const {data:session}=canonicalAuthClient.useSession();
  const memberId=session?.user?.emailVerified===true&&typeof session.user.id==="string"?session.user.id:null;
  const [verified,setVerified]=useState<VerifiedStaff|null>(null);

  useEffect(()=>{
    if(!memberId){setVerified(null);return;}
    let active=true,controller:AbortController|null=null;
    let nonce=0;
    const load=async()=>{
      const current=++nonce;
      controller?.abort();
      controller=new AbortController();
      const request=controller;
      const timer=window.setTimeout(()=>request.abort(),10000);
      try{
        const response=await fetch(endpoint,{
          method:"GET",credentials:"same-origin",mode:"same-origin",cache:"no-store",
          redirect:"manual",headers:{accept:"application/json"},signal:request.signal
        });
        if(response.status!==200||!response.headers.get("content-type")?.includes("application/json")){
          if(active&&current===nonce)setVerified({memberId,role:null,designation:null});
          return;
        }
        const data=await response.json() as {role?:unknown;designation?:unknown};
        const role:StaffRole|null=data?.role==="owner"||data?.role==="reviewer"?data.role:null;
        if(active&&current===nonce)
          setVerified({memberId,role,designation:role==="owner"&&data.designation==="founder"?"founder":null});
      }catch{
        // Fail closed: no staff shortcut when the session service is unavailable.
        if(active&&current===nonce)setVerified({memberId,role:null,designation:null});
      }finally{window.clearTimeout(timer);}
    };
    setVerified(null);
    void load();
    const onPageShow=()=>{if(document.visibilityState==="visible")void load();};
    const onVisibility=()=>{if(document.visibilityState==="visible")void load();};
    window.addEventListener("pageshow",onPageShow);
    document.addEventListener("visibilitychange",onVisibility);
    return()=>{
      active=false;nonce++;controller?.abort();
      window.removeEventListener("pageshow",onPageShow);
      document.removeEventListener("visibilitychange",onVisibility);
    };
  },[memberId]);

  if(!memberId||verified?.memberId!==memberId||!verified.role)return null;
  const label=verified.role==="reviewer"?"MODERATOR PORTAL":
    verified.designation==="founder"?"FOUNDER CONSOLE":"OWNER CONSOLE";
  const destination=verified.role==="reviewer"?"/staff":"/staff/observatory";
  return <Link className={"av99-native-staff-link av99-native-staff-link--"+location}
    to={destination} data-native-staff-shortcut={verified.role}
    aria-label={label+" — staff operations and analytics"}>
    <span className="av99-native-staff-mark" aria-hidden="true">◇</span>
    <span className="av99-native-staff-copy"><strong>{label}</strong>
      <small>{verified.role==="owner"?"Staff operations and analytics":"Authorized review operations"}</small></span>
    <span aria-hidden="true" className="av99-native-staff-arrow">↗</span>
  </Link>;
}

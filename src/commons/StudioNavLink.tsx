import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {memberAuthClient} from "../member/auth-client";

/** Identity-aware staff navigation, kept outside the presentational Commons shell.
 * Authorization remains entirely server-enforced regardless of link visibility.
 */
export default function StudioNavLink({pathname,onClose}:{pathname:string;onClose:()=>void}){
 const {data:session}=memberAuthClient.useSession();
 const memberId=session?.user?.id;
 const [allowed,setAllowed]=useState(false);
 useEffect(()=>{
  setAllowed(false);
  if(!memberId)return;
  const controller=new AbortController();
  void fetch("/api/member/studio/status",{credentials:"same-origin",cache:"no-store",
    redirect:"manual",signal:controller.signal})
   .then(async response=>response.ok?response.json():null)
   .then(value=>{
    if(!controller.signal.aborted)setAllowed(value?.schemaVersion==="anevum.studio.v1" &&
     value?.viewerMemberId===memberId&&["owner","admin"].includes(value?.role));
   }).catch(()=>{if(!controller.signal.aborted)setAllowed(false);});
  return ()=>controller.abort();
 },[memberId]);
 if(!allowed)return null;
 return <div className="sidebar-nav-group">
   <span className="side-heading">ADMINISTRATION</span>
   <Link to="/studio" onClick={onClose} className={"side-link "+(pathname==="/studio"?"active":"")}
    aria-current={pathname==="/studio"?"page":undefined}>
    <span className="community-icon ci-blue" aria-hidden="true">S</span><span>ANEVUM Studio</span>
   </Link>
  </div>;
}

import {useEffect,useState} from "react";
import {readCreators,readProjects,readStatus,type Creator,type Project,type Status} from "../lib/api";
import {useResource} from "../lib/useResource";
import {ArrivalExperience} from "../components/ArrivalExperience";
import {CommunityHomeFeed} from "../components/CommunityHomeFeed";
import {MemberForumHighlights} from "../components/MemberForumHighlights";

/**
 * ANEVUM / first-contact experience V065.
 * Visitors enter through four working destinations before encountering any
 * verified public feed. Never lead with a zero-count dashboard or pretend
 * there are releases, conversations or creators where none exist.
 * The independent member, staff, moderator and Lab routes are unchanged.
 */
type PublicSnapshot={status:Status;projects:Project[];creators:Creator[]};

export function CinematicLandingPage(){
  const [lastVerified,setLastVerified]=useState<PublicSnapshot|null>(null);
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    const refresh=()=>{if(document.visibilityState==="visible")setRevision(v=>v+1);};
    const interval=window.setInterval(refresh,180000);
    document.addEventListener("visibilitychange",refresh);
    return()=>{window.clearInterval(interval);document.removeEventListener("visibilitychange",refresh);};
  },[]);
  const portal=useResource(async signal=>{
    const [status,projectResponse,creatorResponse]=await Promise.all([
      readStatus(signal),
      readProjects({limit:"32"},signal),
      readCreators({limit:"6"},signal)
    ]);
    return {status,projects:projectResponse.items,creators:creatorResponse.items};
  },[revision]);
  useEffect(()=>{
    if(portal.state==="ready")setLastVerified(portal.data);
  },[portal]);
  // Preserve the last verified public index while checking for newer data.
  const snapshot=portal.state==="ready"?portal.data:lastVerified;
  const hasVerifiedData=snapshot!==null;
  const projects=snapshot?.projects||[];
  const creators=snapshot?.creators||[];
  const status=snapshot?.status||null;
  const displayState=hasVerifiedData?"ready":portal.state;

  return <div className="anevum-cinema av9-home">
    <div className="cinema-content">
      <ArrivalExperience projects={projects}/>
      {portal.state==="error"&&hasVerifiedData&&<p className="av8-index-stale" role="status">The latest refresh failed. Previously verified public content remains available while the connection is restored.</p>}
      <MemberForumHighlights/>
      {(projects.length>0||creators.length>0||status?.features?.communityPosts===true)&&<CommunityHomeFeed
        projects={projects}
        creators={creators}
        state={displayState}
        communityEnabled={status?.features?.communityPosts===true}
      />}
      {hasVerifiedData&&status&&<div className="cinema-verification-note">
        {status.counts.publishedProjects} APPROVED PUBLIC PROJECTS · {status.counts.publishedCreators} PUBLIC CREATOR CHANNELS · Only genuine published activity is shown.
      </div>}
    </div>
  </div>;
}

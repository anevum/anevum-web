import {useEffect,useState} from "react";
import {readCreators,readProjects,readStatus,type Creator,type Project,type Status} from "../lib/api";
import {useResource} from "../lib/useResource";
import {CinematicSiteRail} from "../components/CinematicSiteRail";
import {LiveSignalHero} from "../components/LiveSignalHero";
import {CommunityHomeFeed} from "../components/CommunityHomeFeed";

/**
 * ANEVUM / cinematic public homepage V008.
 * The live signal index and community cards show real approved records only.
 * No fictitious statistics, paid ranking or unmoderated publication.
 * The independent member, staff, Atlas and Lab routes are unchanged.
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
  const signalState=portal.state==="error"?"error":displayState;

  return <div className="anevum-cinema">
    <CinematicSiteRail/>
    <div className="cinema-content">
      <LiveSignalHero
        state={signalState}
        status={status}
        projects={projects}
        creators={creators}
      />
      <CommunityHomeFeed
        projects={projects}
        creators={creators}
        state={displayState}
        communityEnabled={status?.features?.communityPosts===true}
      />
      {portal.state==="error"&&hasVerifiedData&&<p className="av8-index-stale" role="status">The latest refresh failed. Previously verified public content remains available while the connection is restored.</p>}
      {hasVerifiedData&&status&&<div className="cinema-verification-note">
        {status.counts.publishedProjects} APPROVED PUBLIC PROJECTS · {status.counts.publishedCreators} PUBLIC CREATOR CHANNELS · Only genuine published activity is shown.
      </div>}
    </div>
  </div>;
}

import {useEffect,useState} from "react";
import {readCreators,readProjects,readStatus} from "../lib/api";
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
export function CinematicLandingPage(){
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
  const isReady=portal.state==="ready";
  const projects=isReady?portal.data.projects:[];
  const creators=isReady?portal.data.creators:[];
  const status=isReady?portal.data.status:null;

  return <div className="anevum-cinema">
    <CinematicSiteRail/>
    <div className="cinema-content">
      <LiveSignalHero
        state={portal.state}
        status={status}
        projects={projects}
        creators={creators}
      />
      <CommunityHomeFeed
        projects={projects}
        creators={creators}
        state={portal.state}
        communityEnabled={status?.features?.communityPosts===true}
      />
      {isReady&&<div className="cinema-verification-note">
        {status.counts.publishedProjects} APPROVED PUBLIC PROJECTS · {status.counts.publishedCreators} PUBLIC CREATOR CHANNELS · Only genuine published activity is shown.
      </div>}
    </div>
  </div>;
}

import {Link,useParams} from 'react-router-dom';
import {useState} from 'react';
import {canonicalPublic,spaceRequest,FOCUS_OPTIONS,type MemberSpace,type WallEntry} from '../lib/canonical-beta';
import {useResource} from '../lib/useResource';
import {useMemberRevalidation} from '../lib/useMemberRevalidation';

import {MemberWall} from '../components/MemberWall';
import {CompactMemberIdentity} from '../components/CompactMemberIdentity';
import {SpaceProgress} from '../components/MemberSpaceDashboard';
import {CreatorPackageGallery} from '../components/CreatorPackageGallery';
import {EarnedRewardVault} from '../components/EarnedRewardVault';
import {MemberCoverMedia} from '../components/MemberPortrait';
import {packageGalleryUIEnabled} from '../components/CreatorPackageGallery';
import {safePlayerAura,safeVerifiedRole} from '../lib/player-recognition';


const HANDLE=/^[a-z][a-z0-9_]{2,29}$/;
export function Phase1PublicMemberPage(){
 const {memberHandle=''}=useParams<{memberHandle:string}>();
 return <PublicMemberWorld key={memberHandle} memberHandle={memberHandle}/>;
}
function PublicMemberWorld({memberHandle}:{memberHandle:string}){
 const handle=memberHandle.startsWith('@')?memberHandle.slice(1):'';
 const valid=HANDLE.test(handle),base='/api/v1/members/'+handle;
 const revalidation=useMemberRevalidation();
 const [profileRetry,setProfileRetry]=useState(0);
 const [wallRetry,setWallRetry]=useState(0);
 // The verified public profile and space must not disappear because the
 // independent public wall endpoint stalls or temporarily fails.
 const resource=useResource(async signal=>{
  if(!valid)return null;
  const [result,space]=await Promise.all([
   canonicalPublic(handle,signal),
   spaceRequest<MemberSpace>(base+'/space','GET',undefined,signal)
  ]);
  return {profile:result.profile,space};
 },[handle,revalidation,profileRetry]);
 const wallResource=useResource(async signal=>{
  if(!valid||resource.state!=='ready'||!resource.data)return null;
  const wall=await spaceRequest<{posts:WallEntry[]}>(base+'/wall','GET',undefined,signal);
  return wall.posts;
 },[handle,revalidation,profileRetry,wallRetry,resource.state]);
 const data=resource.state==='ready'?resource.data:null;
 const transientFailure=resource.state==='error'&&
  ![401,403,404].includes((resource.error as {status?:number}).status??0);
 if(!data)return <section className="av12-public-world">
  <h1 id="av12-world-heading">{resource.state==='loading'&&valid?'OPENING THIS WORLD…':transientFailure?'PUBLIC WORLD UNAVAILABLE.':'A PRIVATE WORLD.'}</h1>
  <p role={resource.state==='loading'||transientFailure?'status':undefined}>{resource.state==='loading'&&valid?'Finding this member’s public world…':transientFailure?'The public profile service could not be reached. No private information has been exposed.':'This profile is not published, does not exist, or cannot be viewed right now. We never reveal which of those is the reason.'}</p>
  {transientFailure&&<button className="av12-world-back" type="button" onClick={()=>setProfileRetry(value=>value+1)}>TRY AGAIN ↗</button>}
  <Link className="av12-world-back" to="/discover">EXPLORE OTHER WORLDS ↗</Link>
 </section>;
 const {profile,space}=data;
 const posts=wallResource.state==='ready'?wallResource.data:null;
 return <section className={'ms-public av18-world-'+profile.worldTheme} aria-labelledby="av12-world-heading"><header className={'ms-cover av92-presence-cover av92-presence-cover--'+safePlayerAura(space.aura)+
  ' av92-presence-role--'+(safeVerifiedRole(space.role)??'none')+
  (space.supporterAppearance?' av34-aura av34-aura-'+space.supporterAppearance.aura:'')}>{space.media.banner&&<MemberCoverMedia src={base+'/media/banner?v='+space.media.banner} alt={profile.displayName+'’s wall banner'}/>} <div className="ms-cover-shade"/><div className="ms-cover-meta"><span className="kicker">ANEVUM / MEMBER WORLD</span><span className="ms-visibility">PUBLIC WORLD</span></div><div className="ms-identity av65-public-identity"><div className="av65-public-dossier"><h1 id="av12-world-heading" className="av65-visually-hidden">{profile.displayName}</h1><CompactMemberIdentity size="featured" interactive={false} member={{handle:profile.handle,displayName:profile.displayName,avatar:Boolean(space.media.avatar),avatarVersion:space.media.avatar,level:space.stats?.level??null,featuredAwards:space.featuredAwards,earnedBadges:space.earnedBadges,badgeDisplay:space.badgeDisplay,distinctions:space.distinctions,aura:space.aura,role:space.role,reputation:space.reputation,earnedAura:space.earnedAura,constellation:space.constellation,supporterAppearance:space.supporterAppearance,progress:space.stats}}/>{profile.headline&&<p>{profile.headline}</p>}</div></div></header>
 <nav className="ms-public-index" aria-label="Explore this member's public space">
  <a href="#member-world-wall"><small>01 / COMMUNITY</small><strong>Member wall</strong><span>Public updates and activity</span></a>
  <a href="#member-world-about"><small>02 / IDENTITY</small><strong>About</strong><span>Introduction and interests</span></a>
  {packageGalleryUIEnabled&&<a href="#member-world-creations"><small>03 / CREATOR</small><strong>Creations</strong><span>Approved browser releases</span></a>}
  <a href="#member-world-recognition"><small>04 / CONTINUANCE</small><strong>Recognition</strong><span>Verified earned milestones</span></a>
 </nav>
 <div className="ms-public-body"><div id="member-world-wall" className="ms-public-wall-region">
  {wallResource.state==='error'?<div className="ms-public-wall-feedback" role="status">
    <p>The public wall is temporarily unavailable. This member's published profile remains visible.</p>
    <button type="button" onClick={()=>setWallRetry(value=>value+1)}>RETRY WALL ↗</button>
  </div>:posts!==null?<MemberWall posts={posts} owner={false} identity={{handle:profile.handle,displayName:profile.displayName,avatar:Boolean(space.media.avatar),avatarVersion:space.media.avatar,level:space.stats?.level??null,featuredAwards:space.featuredAwards,earnedBadges:space.earnedBadges,badgeDisplay:space.badgeDisplay,distinctions:space.distinctions,aura:space.aura,role:space.role,reputation:space.reputation,earnedAura:space.earnedAura,constellation:space.constellation,supporterAppearance:space.supporterAppearance}}/>:<div className="ms-public-wall-feedback" role="status">Opening public wall…</div>}
 </div><aside><section id="member-world-about" className="ms-card"><span className="kicker">ABOUT THIS MEMBER</span><h2>An introduction.</h2><p className="ms-public-bio">{profile.bio||'This member has not written an introduction yet.'}</p>{profile.focus.length>0&&<div className="av18-public-focus" aria-label="Creative interests">{profile.focus.map(id=><span key={id}>{FOCUS_OPTIONS.find(f=>f.id===id)?.label}</span>)}</div>}<small>Member since {new Date(profile.joinedAt*1000).toLocaleDateString(undefined,{month:'long',year:'numeric'})}</small></section>{space.stats&&<SpaceProgress space={space} handle={profile.handle}/>}</aside></div>{packageGalleryUIEnabled&&<div id="member-world-creations" className="ms-public-creations"><CreatorPackageGallery mode="public" handle={profile.handle}/></div>}<div id="member-world-recognition" className="ms-public-recognition"><EarnedRewardVault
 level={space.stats?.level??null}
 handle={profile.handle}
 badges={space.earnedBadges?.map(item=>item.id)??space.featuredAwards}
 distinctions={space.distinctions}
 title={profile.displayName+' · Earned discoveries'}/></div>
 <Link className="ms-public-back" to="/discover">EXPLORE OTHER WORLDS ↗</Link></section>;
}

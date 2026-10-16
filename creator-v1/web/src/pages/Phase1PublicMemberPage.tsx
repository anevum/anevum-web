import {Link,useParams} from 'react-router-dom';
import {canonicalPublic,spaceRequest,FOCUS_OPTIONS,type MemberSpace,type WallEntry} from '../lib/canonical-beta';
import {useResource} from '../lib/useResource';
import {MemberPortrait} from '../components/MemberPortrait';
import {MemberWall} from '../components/MemberWall';
import {SpaceProgress} from '../components/MemberSpaceDashboard';
import {AwardEmblem} from '../components/LevelEmblem';
import {OrbitalMark} from '../components/OrbitalMark';
const HANDLE=/^[a-z][a-z0-9_]{2,29}$/;
export function Phase1PublicMemberPage(){
 const {memberHandle=''}=useParams<{memberHandle:string}>();
 const handle=memberHandle.startsWith('@')?memberHandle.slice(1):'';
 const valid=HANDLE.test(handle),base='/api/v1/members/'+handle;
 const resource=useResource(async signal=>{
  if(!valid)return null;
  const result=await canonicalPublic(handle,signal);
  const [space,wall]=await Promise.all([spaceRequest<MemberSpace>(base+'/space','GET',undefined,signal),spaceRequest<{posts:WallEntry[]}>(base+'/wall','GET',undefined,signal)]);
  return {profile:result.profile,space,posts:wall.posts};
 },[handle]);
 const data=resource.state==='ready'?resource.data:null;
 if(!data)return <section className="av12-public-world"><h1 id="av12-world-heading">{resource.state==='loading'&&valid?'OPENING THIS WORLD…':'A PRIVATE WORLD.'}</h1><p role={resource.state==='loading'?'status':undefined}>{resource.state==='loading'&&valid?'Finding this member’s public world…':'This profile is not published, does not exist, or cannot be viewed right now. We never reveal which of those is the reason.'}</p><Link className="av12-world-back" to="/discover">EXPLORE OTHER WORLDS ↗</Link></section>;
 const {profile,space,posts}=data;
 return <section className={'ms-public av18-world-'+profile.worldTheme} aria-labelledby="av12-world-heading"><header className="ms-cover">{space.media.banner&&<img className="ms-cover-art" src={base+'/media/banner'} alt={profile.displayName+'’s wall banner'}/>}<div className="ms-cover-shade"/><div className="ms-cover-meta"><span className="kicker">ANEVUM / MEMBER WORLD</span><span className="ms-visibility">PUBLIC WORLD</span></div><div className="ms-identity"><MemberPortrait src={space.media.avatar?base+'/media/avatar':undefined} name={profile.displayName}/><div><p className="ms-handle">@{profile.handle}</p>{space.supporter&&<span className="av32-public-insignia" aria-label="Founding supporter"><OrbitalMark/><span>FOUNDING SUPPORTER</span></span>}<h1 id="av12-world-heading">{profile.displayName}</h1>{profile.headline&&<p>{profile.headline}</p>}</div></div></header><div className="ms-public-body"><div><MemberWall posts={posts} owner={false}/></div><aside><section className="ms-card"><span className="kicker">ABOUT THIS MEMBER</span><h2>An introduction.</h2><p className="ms-public-bio">{profile.bio||'This member has not written an introduction yet.'}</p>{profile.focus.length>0&&<div className="av18-public-focus" aria-label="Creative interests">{profile.focus.map(id=><span key={id}>{FOCUS_OPTIONS.find(f=>f.id===id)?.label}</span>)}</div>}<small>Member since {new Date(profile.joinedAt*1000).toLocaleDateString(undefined,{month:'long',year:'numeric'})}</small></section>{space.stats&&<SpaceProgress space={space}/>}<section className="ms-card"><span className="kicker">FEATURED AWARDS</span><h3>Marks of the journey.</h3>{space.awards.length?<div className="ms-featured">{space.awards.map(a=><div key={a.id}><span aria-hidden="true"><AwardEmblem award={a.id}/></span><div><strong>{a.name}</strong><p>{a.detail}</p></div></div>)}</div>:<p>No awards are on display yet.</p>}</section></aside></div><Link className="ms-public-back" to="/discover">EXPLORE OTHER WORLDS ↗</Link></section>;
}

import {type ReactNode,useEffect,useRef,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {canonicalAuthClient,canonicalSpace,canonicalWall,spaceRequest,type CanonicalProfile,type MemberSpace,type WallEntry} from '../lib/canonical-beta';
import {readWithDeadline} from '../../../shared/read-deadline.mjs';
import {MemberPortrait,MemberCoverMedia} from './MemberPortrait';
import {ProfileImageEditor} from './ProfileImageEditor';
import {MemberWall} from './MemberWall';
import {PlayerCardStudio} from './PlayerCardStudio';

import {LevelEmblem,AwardEmblem} from './LevelEmblem';
import {SupporterIdentity} from './SupporterSeal';
import {MemberPresenceStatus} from './MemberPresenceStatus';
import {safePlayerAura,safeVerifiedRole} from '../lib/player-recognition';
import {EarnedRewardVault} from './EarnedRewardVault';
import {useMemberRevalidation} from '../lib/useMemberRevalidation';
import {CreatorPackageGallery,packageGalleryUIEnabled} from './CreatorPackageGallery';
import {VerifiedStaffShortcut} from './VerifiedStaffShortcut';
import {MemberCollectionNav,MEMBER_COLLECTION_NAV_REVIEW} from './MemberCollectionNav';

type Tab='overview'|'profile'|'appearance'|'awards'|'wall'|'creations';
export function SpaceProgress({space,handle=null}:{space:MemberSpace;handle?:string|null}){
 const s=space.stats;if(!s)return null;
 return <section className="ms-progress" aria-label="Member level and statistics"><div className="ms-level"><LevelEmblem level={s.level} size={72} handle={handle}/><div><span className="kicker">CONTINUANCE LEVEL</span><h3>{s.level===1?'First light.':'An expanding orbit.'}</h3><small>{s.xp.toLocaleString()} XP · {s.nextLevel===null?'Level 30 / Continuance achieved':(s.nextLevel-s.xp).toLocaleString()+' to level '+(s.level+1)}</small></div></div>
 <progress value={s.nextLevel===null?1:s.xp-s.levelStart} max={s.nextLevel===null?1:s.nextLevel-s.levelStart} aria-label={s.nextLevel===null?"Final evolution level achieved":"Progress toward next level"}/>
 <dl className="ms-stat-grid"><div><dt>Wall entries</dt><dd>{s.wallPosts}</dd></div><div><dt>Milestones earned</dt><dd>{s.awards}</dd></div><div><dt>Member XP</dt><dd>{s.xp}</dd></div></dl></section>;
}
/** Account switches remount the private workspace immediately. No previous
 * member wall/space data can render for the next verified identity. */
export function MemberSpaceDashboard({profile,editor}:{profile:CanonicalProfile;editor:ReactNode}){
 return <MemberSpaceDashboardView key={profile.handle+':'+profile.revision} profile={profile} editor={editor}/>;
}
function MemberSpaceDashboardView({profile,editor}:{profile:CanonicalProfile;editor:ReactNode}){
 const [params,setParams]=useSearchParams();
 const selected=params.get('tab');
 const tab:Tab=['overview','profile','appearance','awards','wall',...(packageGalleryUIEnabled?['creations']:[])].includes(selected||'')?selected as Tab:'overview';
 function setTab(value:Tab){const next=new URLSearchParams(params);next.set('tab',value);setParams(next)}
 const [space,setSpace]=useState<MemberSpace|null>(null),[posts,setPosts]=useState<WallEntry[]>([]),[loading,setLoading]=useState(true);
 const [wallLoading,setWallLoading]=useState(true),[wallReady,setWallReady]=useState(false),[wallError,setWallError]=useState('');
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const spaceRequestVersion=useRef(0),wallRequestVersion=useRef(0);
 const moreNav=useRef<HTMLDetailsElement>(null);
 const [featured,setFeatured]=useState<string[]>([]),[showStats,setShowStats]=useState(true);
 const [recognitionAvailable,setRecognitionAvailable]=useState(false);
 const revalidation=useMemberRevalidation();
 // Space and wall are independent resources. A wall transport failure must
 // never erase verified profile, award, portrait or Founder navigation data.
 async function reloadSpace(){
  const version=++spaceRequestVersion.current;
  setLoading(true);setError('');
  try{
   const next=await readWithDeadline(signal=>canonicalSpace(signal));
   if(version!==spaceRequestVersion.current)return;
   setSpace(next);setFeatured(next.featuredAwards);setShowStats(next.showStats);
  }catch(e){
   if(version===spaceRequestVersion.current)
    setError(e instanceof Error?e.message:'Your space could not be loaded.');
  }finally{
   if(version===spaceRequestVersion.current)setLoading(false);
  }
 }
 async function reloadWall(){
  const version=++wallRequestVersion.current;
  setWallLoading(true);setWallError('');
  try{
   const next=await readWithDeadline(signal=>canonicalWall(signal));
   if(version!==wallRequestVersion.current)return;
   setPosts(next.posts);setWallReady(true);
  }catch(e){
   if(version===wallRequestVersion.current)
    setWallError(e instanceof Error?e.message:'Your wall could not be loaded.');
  }finally{
   if(version===wallRequestVersion.current)setWallLoading(false);
  }
 }
 async function refresh(){await Promise.all([reloadSpace(),reloadWall()]);}
 useEffect(()=>{document.getElementById("ms-title")?.focus({preventScroll:true})},[]);
 useEffect(()=>{
  void reloadSpace();
  void reloadWall();
  // Superseded loads may not repopulate a different session or stale view.
  return()=>{spaceRequestVersion.current++;wallRequestVersion.current++;};
 },[profile.handle,profile.revision,revalidation]);
 
 async function saveDisplay(){if(!space||busy)return;setBusy(true);setError('');setNotice('');try{const next=await spaceRequest<MemberSpace>('/api/v1/member/space','PATCH',{featuredAwards:recognitionAvailable?featured.filter(id=>space.awards.some(a=>a.id===id&&a.earnedAt)):featured,showStats,revision:space.revision});setSpace(next);setNotice(recognitionAvailable?'Stats visibility saved.':'Your award display and stats visibility were saved.')}catch(e){setError(e instanceof Error?e.message:'Could not save display.')}finally{setBusy(false)}}
 const avatar=space?.media.avatar?'/api/v1/member/media/avatar?v='+space.media.avatar:undefined;
 const banner=space?.media.banner?'/api/v1/member/media/banner?v='+space.media.banner:undefined;
 return <section className={'ms-dashboard av18-world-'+profile.worldTheme} aria-labelledby="ms-title">
  <header data-iren-anchor="identity" className={'ms-cover av92-presence-cover av92-presence-cover--'+safePlayerAura(space?.aura)+
   ' av92-presence-role--'+(safeVerifiedRole(space?.role)??'none')+
   (space?.supporterAppearance?' av34-aura av34-aura-'+space.supporterAppearance.aura:'')}>{banner&&<MemberCoverMedia src={banner} key={space?.media.banner} alt="Your wall banner"/>}<div className="ms-cover-shade"/>
   <div className="ms-cover-meta"><span className="kicker">ANEVUM / PERSONAL CONTINUANCE</span><span className="ms-visibility">{profile.visibility==='public'?'PUBLIC WORLD':'PRIVATE WORLD'}</span></div>
   <button className="ms-cover-edit" onClick={()=>setTab('appearance')}>EDIT BANNER ↗</button>
   <div className="ms-identity"><button className="ms-avatar-button" onClick={()=>setTab('appearance')} aria-label="Change profile picture"><MemberPortrait src={avatar} key={space?.media.avatar} name={profile.displayName} supporterFrame={space?.supporterAppearance?.frame}/><span>EDIT</span></button><div><p className="ms-handle">@{profile.handle}</p>{space?.supporterAppearance&&<SupporterIdentity appearance={space.supporterAppearance} compact/>}<h1 id="ms-title" tabIndex={-1}>{profile.displayName}</h1><p>{profile.headline||'Your place in the continuance.'}</p>
    {space&&<MemberPresenceStatus aura={space.aura} role={space.role} reputation={space.showStats?space.reputation:undefined}
      level={space.stats?.level} featuredAwards={space.featuredAwards}
      earnedBadges={space.earnedBadges} badgeDisplay={space.badgeDisplay}/>}</div></div>
  </header>
  <MemberCollectionNav current="space"/>
  {MEMBER_COLLECTION_NAV_REVIEW?<div className="ms-toolbar ms-toolbar-next"><nav aria-label="My space sections">{([["overview","Overview"],["wall","My wall"],...(packageGalleryUIEnabled?[["creations","Creations"]]:[]),["awards","Player card"]] as [Tab,string][]).map(([key,label])=><button type="button" key={key} data-iren-anchor={key==="awards"?"awards":undefined} aria-current={tab===key?"page":undefined} onClick={()=>{setTab(key);setNotice("")}}>{label}</button>)}</nav>
   <details className="ms-toolbar-more" ref={moreNav}><summary data-iren-anchor="studio-tools">Profile &amp; tools</summary><div className="ms-toolbar-more-content"><button type="button" aria-current={tab==="profile"?"page":undefined} onClick={()=>{setTab("profile");setNotice("");moreNav.current?.removeAttribute("open")}}>Edit profile</button><button type="button" aria-current={tab==="appearance"?"page":undefined} onClick={()=>{setTab("appearance");setNotice("");moreNav.current?.removeAttribute("open")}}>Appearance</button><Link to="/community">Community</Link><Link data-iren-anchor="studio" to="/studio">Creator Studio</Link><Link to="/support">Support ANEVUM</Link>{profile.visibility==="public"?<Link to={"/@"+profile.handle}>Public profile</Link>:<button type="button" onClick={()=>{setTab("profile");moreNav.current?.removeAttribute("open")}}>Privacy settings</button>}<VerifiedStaffShortcut location="profile"/></div></details>
  </div>:<div className="ms-toolbar"><nav aria-label="My space sections">{([['overview','Dashboard'],['wall','My wall'],...(packageGalleryUIEnabled?[['creations','Creations']]:[]),['profile','Edit profile'],['appearance','Appearance'],['awards','Awards & stats']] as [Tab,string][]).map(([key,label])=><button key={key} data-iren-anchor={key==='awards'?"awards":undefined} aria-current={tab===key?'page':undefined} onClick={()=>{setTab(key);setNotice('')}}>{label}</button>)}</nav><div className="ms-toolbar-links"><Link to="/community">COMMUNITY ↗</Link> <Link data-iren-anchor="studio" to="/studio">CREATOR STUDIO ↗</Link> <Link to="/support">SUPPORT ANEVUM ↗</Link> {profile.visibility==='public'?<Link to={'/@'+profile.handle}>VIEW PUBLIC WALL ↗</Link>:<button onClick={()=>setTab('profile')}>VISIBILITY SETTINGS</button>} <VerifiedStaffShortcut location="profile"/></div></div>}

  <div className="ms-body">
   {loading&&<p role="status">Opening your space…</p>}
   {error&&<div className="ms-error" role="alert"><p>{error}</p><button type="button" onClick={()=>void reloadSpace()}>RETRY SPACE</button> <Link to="/join">SIGN IN AGAIN</Link></div>}
   {notice&&<p role="status" className="ms-notice">{notice}</p>}
   {tab==='overview'&&<div className="ir80-member-overview">
    <div className="ir80-member-main">
      <section className="ir80-member-intro">
        <span className="kicker">YOUR SPACE / YOUR CONTINUANCE</span>
        <h2>{MEMBER_COLLECTION_NAV_REVIEW?"Your space, made simple.":"What will you make of it?"}</h2>
        <p>{MEMBER_COLLECTION_NAV_REVIEW?"See your wall and activity here. Saved work, evolution and awards are organized above.":"Your wall, player identity, work and earned recognition belong together. Start somewhere useful, or ask IREN to show you around."}</p>
        <div className="ir80-member-actions">
          <button type="button" className="ms-primary" onClick={()=>window.dispatchEvent(new Event("anevum:iren-tour"))}>TAKE THE GUIDED TOUR ↗</button>
          <button type="button" onClick={()=>window.dispatchEvent(new Event("anevum:iren-open"))}>ASK IREN ↗</button>
        </div>
      </section>
      <section className="ir80-action-grid" aria-label="Your next actions">
        <button type="button" onClick={()=>setTab("wall")}><span>01 / YOUR WALL</span><strong>Share a signal.</strong><small>{wallError?'Wall temporarily unavailable':!wallReady?'Loading your wall…':posts.length+' '+(posts.length===1?'entry':'entries')+' saved'} · Open your wall</small></button>
        <Link to="/discover"><span>02 / DISCOVER</span><strong>Find something new.</strong><small>Browse genuine games, apps and creative work</small></Link>
        <Link to="/community"><span>03 / COMMUNITY</span><strong>Meet the makers.</strong><small>Explore approved discussions and people</small></Link>
        {!MEMBER_COLLECTION_NAV_REVIEW&&<button type="button" onClick={()=>setTab("appearance")}><span>04 / PERSONALIZE</span><strong>Shape your presence.</strong><small>Portrait, banner and profile atmosphere</small></button>}
      </section>
    </div>
    <aside className="ir80-member-aside">
      <div data-iren-anchor={space?.stats?"progress":undefined}>{space&&<SpaceProgress space={space}/>}</div>
      <section data-iren-anchor="privacy" className="ms-card ir80-privacy-card">
        <span className="kicker">YOUR VISIBILITY</span>
        <h3>{profile.visibility==='public'?'Public by choice.':'Private by default.'}</h3>
        <p>{profile.visibility==='public'?'Your public wall is available to visitors. You control the details and stats that appear.':'Only you can see your personal wall until you choose to publish it.'}</p>
        <button type="button" onClick={()=>setTab("profile")}>REVIEW VISIBILITY ↗</button>
      </section>
    </aside>
   </div>}
   {tab==='creations'&&packageGalleryUIEnabled&&<CreatorPackageGallery mode="owner"/>}
   {tab==='profile'&&<div className="ms-profile-editor">{editor}</div>}
   {tab==='appearance'&&<><div className="ms-section-head"><div><span className="kicker">PROFILE STUDIO</span><h2>Frame your world.</h2><p>Crop, preview and save each image. Your wall updates after saving.</p></div><button onClick={()=>setTab('profile')}>CHANGE ATMOSPHERE ↗</button></div><div className="ms-appearance-grid"><ProfileImageEditor slot="avatar" version={space?.media.avatar} onSaved={refresh}/><ProfileImageEditor slot="banner" version={space?.media.banner} onSaved={refresh}/></div><p className="av34-support-note">Supporter frames and banner atmospheres are managed in the <Link to="/support">Supporter Studio ↗</Link>. Your original uploaded images stay yours, and your earned awards remain separate.</p></>}
   {tab==='wall'&&(wallError?<div className="ms-error" role="alert"><p>{wallError}</p><p>The wall could not be verified. Your profile, achievements and other sections remain available.</p><button type="button" onClick={()=>void reloadWall()}>RETRY WALL</button></div>:
    !wallReady?<p role="status">Loading your verified wall…</p>:
    <><MemberWall posts={posts} owner onChanged={refresh} identity={{handle:profile.handle,displayName:profile.displayName,avatar:Boolean(space?.media.avatar),avatarVersion:space?.media.avatar,level:space?.stats?.level??null,featuredAwards:space?.featuredAwards??[],earnedBadges:space?.earnedBadges,badgeDisplay:space?.badgeDisplay,distinctions:space?.distinctions,aura:space?.aura,role:space?.role,reputation:space?.showStats?space.reputation:undefined,earnedAura:space?.showStats?space.earnedAura:undefined,constellation:space?.constellation,supporterAppearance:space?.supporterAppearance}}/>
      {wallLoading&&<p role="status">Refreshing your wall…</p>}</>)}
   {tab==='awards'&&space&&(MEMBER_COLLECTION_NAV_REVIEW?
    <div className="mc-member-awards-view">
     <section className="mc-card-editor">
      <details>
       <summary>Customize your player card</summary>
       <p>Choose how verified information and earned recognition appear on your card.</p>
       <PlayerCardStudio profile={profile} space={space} onAvailabilityChange={setRecognitionAvailable} onSaved={refresh}/>
      </details>
     </section>
     <EarnedRewardVault level={space.stats?.level??null} fallbackBadges={space.awards.filter(item=>item.earnedAt!==null).map(item=>item.id)} title="Your earned rewards"/>
     <section className="ms-card mc-display-settings" aria-label="Public profile display settings">
      <span className="kicker">PROFILE VISIBILITY / YOUR CHOICE</span><h2>Public display settings</h2>
      <p>Choose whether your level and verified stats appear on your public wall. Your overall profile visibility is controlled separately.</p>
      <label className="ms-setting"><input type="checkbox" checked={showStats} disabled={busy} onChange={e=>setShowStats(e.target.checked)}/><span><strong>Show my level and stats publicly</strong><small>Your profile must also be public.</small></span></label>
      {!recognitionAvailable&&space.awards.some(award=>award.earnedAt!==null)&&<details className="mc-award-preferences"><summary>Choose founding milestone highlights</summary><div className="mc-award-selectors">
       {space.awards.filter(award=>award.earnedAt!==null).map(award=><label key={award.id}><input type="checkbox" checked={featured.includes(award.id)} disabled={busy} onChange={e=>setFeatured(v=>e.target.checked?[...v,award.id]:v.filter(id=>id!==award.id))}/><span>{award.name}</span></label>)}
      </div></details>}
      <button type="button" className="ms-primary" disabled={busy} onClick={()=>void saveDisplay()}>{busy?'SAVING…':'SAVE DISPLAY SETTINGS'}</button>
     </section>
    </div>:
<><PlayerCardStudio profile={profile} space={space} onAvailabilityChange={setRecognitionAvailable} onSaved={refresh}/><EarnedRewardVault level={space.stats?.level??null} fallbackBadges={space.awards.filter(item=>item.earnedAt!==null).map(item=>item.id)} title="Your earned discoveries"/><div className="ms-overview-grid"><section className="ms-card"><span className="kicker">YOUR ACHIEVEMENT CABINET</span><h2>Small signals. Lasting marks.</h2><p>{recognitionAvailable?'Your original founding milestones, retained in the earned archive. Select your display badges in the Player Card Studio above.':'Earn these once through your saved activity. Choose which earned awards appear on your wall.'}</p><div className="ms-award-grid">{space.awards.filter(award=>award.earnedAt!==null).map(award=><label className={'ms-award '+(award.earnedAt?'is-earned':'is-locked')} key={award.id}><span className="ms-award-symbol" aria-hidden="true"><AwardEmblem award={award.id} earned={Boolean(award.earnedAt)}/></span><strong>{award.name}</strong><p>{award.detail}</p><small>{award.earnedAt?'EARNED · +'+award.xp+' XP':'TO EARN · '+award.xp+' XP'}</small>{!recognitionAvailable&&<span><input type="checkbox" checked={featured.includes(award.id)} disabled={!award.earnedAt||busy} onChange={e=>setFeatured(v=>e.target.checked?[...v,award.id]:v.filter(id=>id!==award.id))}/> {award.earnedAt?'Feature on my wall':'Not earned yet'}</span>}</label>)}</div><label className="ms-setting"><input type="checkbox" checked={showStats} disabled={busy} onChange={e=>setShowStats(e.target.checked)}/><span><strong>Show my level and stats on my public wall</strong><small>Your profile must also be public.</small></span></label><button className="ms-primary" disabled={busy} onClick={()=>void saveDisplay()}>{busy?'SAVING…':'SAVE STATS VISIBILITY'}</button></section><aside><SpaceProgress space={space}/><section className="ms-card"><h3>Earned, once.</h3><p>These member milestones start your progress. Repeating an action never grants extra XP. Your level does not grant moderation powers.</p><p>Game achievements and Creator Studio activity will connect here as those features become available.</p></section></aside></div></>)}
   <footer className="ms-footer"><span>MEMBER SINCE {new Date(profile.createdAt*1000).toLocaleDateString(undefined,{month:'long',year:'numeric'})}</span><a href="/api/v1/member/account-export" download>DOWNLOAD MY DATA ↓</a><button onClick={async()=>{try{const result=await canonicalAuthClient.signOut();if(result.error)throw Error('Sign out unavailable');window.location.assign('/join')}catch{setError('Could not sign out. Try again.')}}}>SIGN OUT</button></footer>
  </div>
 </section>;
}

import {type ReactNode,useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {canonicalAuthClient,canonicalSpace,canonicalWall,spaceRequest,type CanonicalProfile,type MemberSpace,type WallEntry} from '../lib/canonical-beta';
import {MemberPortrait} from './MemberPortrait';
import {ProfileImageEditor} from './ProfileImageEditor';
import {MemberWall} from './MemberWall';

import {LevelEmblem,AwardEmblem} from './LevelEmblem';

type Tab='overview'|'profile'|'appearance'|'awards'|'wall';
export function SpaceProgress({space}:{space:MemberSpace}){
 const s=space.stats;if(!s)return null;
 return <section className="ms-progress" aria-label="Member level and statistics"><div className="ms-level"><LevelEmblem level={s.level} size={72}/><div><span className="kicker">CONTINUANCE LEVEL</span><h3>{s.level===1?'First light.':'An expanding orbit.'}</h3><small>{s.xp} XP · {s.nextLevel-s.xp} to level {s.level+1}</small></div></div>
 <progress value={s.xp-s.levelStart} max={s.nextLevel-s.levelStart} aria-label="Progress toward next level"/>
 <dl className="ms-stat-grid"><div><dt>Wall entries</dt><dd>{s.wallPosts}</dd></div><div><dt>Awards earned</dt><dd>{s.awards}</dd></div><div><dt>Member XP</dt><dd>{s.xp}</dd></div></dl></section>;
}
export function MemberSpaceDashboard({profile,editor,newMember=false,onSetupComplete}:{profile:CanonicalProfile;editor:ReactNode;newMember?:boolean;onSetupComplete:()=>void}){
 const [params,setParams]=useSearchParams();
 const selected=params.get('tab');
 const tab:Tab=['overview','profile','appearance','awards','wall'].includes(selected||'')?selected as Tab:newMember?'appearance':'overview';
 function setTab(value:Tab){const next=new URLSearchParams(params);next.set('tab',value);setParams(next)}
 const [space,setSpace]=useState<MemberSpace|null>(null),[posts,setPosts]=useState<WallEntry[]>([]),[loading,setLoading]=useState(true);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [featured,setFeatured]=useState<string[]>([]),[showStats,setShowStats]=useState(true);
 async function refresh(){const [next,wall]=await Promise.all([canonicalSpace(),canonicalWall()]);setSpace(next);setFeatured(next.featuredAwards);setShowStats(next.showStats);setPosts(wall.posts)}
 useEffect(()=>{document.getElementById("ms-title")?.focus({preventScroll:true})},[]);
 useEffect(()=>{let active=true;setLoading(true);Promise.all([canonicalSpace(),canonicalWall()]).then(([next,wall])=>{if(active){setSpace(next);setFeatured(next.featuredAwards);setShowStats(next.showStats);setPosts(wall.posts)}}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Your space could not be loaded.')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[profile.handle,profile.revision]);
 const complete=[true,Boolean(space?.media.avatar&&space?.media.banner),Boolean(profile.bio),posts.length>0];
 async function saveDisplay(){if(!space||busy)return;setBusy(true);setError('');setNotice('');try{const next=await spaceRequest<MemberSpace>('/api/v1/member/space','PATCH',{featuredAwards:featured,showStats,revision:space.revision});setSpace(next);setNotice('Your award display and stats visibility were saved.')}catch(e){setError(e instanceof Error?e.message:'Could not save display.')}finally{setBusy(false)}}
 const avatar=space?.media.avatar?'/api/v1/member/media/avatar':undefined;
 const banner=space?.media.banner?'/api/v1/member/media/banner':undefined;
 return <section className={'ms-dashboard av18-world-'+profile.worldTheme} aria-labelledby="ms-title">
  <header className="ms-cover">{banner&&<img className="ms-cover-art" src={banner} key={space?.media.banner} alt="Your wall banner"/>}<div className="ms-cover-shade"/>
   <div className="ms-cover-meta"><span className="kicker">ANEVUM / PERSONAL CONTINUANCE</span><span className="ms-visibility">{profile.visibility==='public'?'PUBLIC WORLD':'PRIVATE WORLD'}</span></div>
   <button className="ms-cover-edit" onClick={()=>setTab('appearance')}>EDIT BANNER ↗</button>
   <div className="ms-identity"><button className="ms-avatar-button" onClick={()=>setTab('appearance')} aria-label="Change profile picture"><MemberPortrait src={avatar} key={space?.media.avatar} name={profile.displayName}/><span>EDIT</span></button><div><p className="ms-handle">@{profile.handle}</p><h1 id="ms-title" tabIndex={-1}>{profile.displayName}</h1><p>{profile.headline||'Your place in the continuance.'}</p></div></div>
  </header>
  <div className="ms-toolbar"><nav aria-label="My space sections">{([['overview','Dashboard'],['wall','My wall'],['profile','Edit profile'],['appearance','Appearance'],['awards','Awards & stats']] as [Tab,string][]).map(([key,label])=><button key={key} aria-current={tab===key?'page':undefined} onClick={()=>{setTab(key);setNotice('')}}>{label}</button>)}</nav><div className="ms-toolbar-links"><Link to="/thebutton">XP TEST ↗</Link><Link to="/community">COMMUNITY ↗</Link> {profile.visibility==='public'?<Link to={'/@'+profile.handle}>VIEW PUBLIC WALL ↗</Link>:<button onClick={()=>setTab('profile')}>VISIBILITY SETTINGS</button>}</div></div>
  {newMember&&<section className="ms-welcome" aria-label="Finish setting up your space"><div><span className="kicker">IDENTITY SAVED / MAKE YOURSELF AT HOME</span><h2>Welcome to your own corner of ANEVUM.</h2><p>Add a portrait and a banner, then look around. You can change these anytime.</p></div><div className="ms-actions"><button className="ms-primary" onClick={()=>{onSetupComplete();setTab('wall')}}>CONTINUE TO MY WALL →</button><button onClick={()=>{onSetupComplete();setTab('overview')}}>SKIP FOR NOW</button></div></section>}
  <div className="ms-body">
   {loading&&<p role="status">Opening your space…</p>}
   {error&&<div className="ms-error" role="alert"><p>{error}</p><button onClick={()=>{setError('');void refresh().catch(e=>setError(e.message))}}>TRY AGAIN</button> <Link to="/join">SIGN IN AGAIN</Link></div>}
   {notice&&<p role="status" className="ms-notice">{notice}</p>}
   {tab==='overview'&&<div className="ms-overview-grid"><div><section className="ms-card"><div className="ms-section-head"><div><span className="kicker">YOUR NEXT CHAPTER</span><h2>Make this space yours.</h2></div><span>{complete.filter(Boolean).length}/4</span></div><ol className="ms-checklist">{[['Your identity','Your unique handle is saved.','profile'],['Picture & banner','Give your wall its own atmosphere.','appearance'],['Introduce yourself','A few words about you and what you make.','profile'],['Send your first signal','Write an entry on your wall.','wall']].map(([label,detail,key],i)=><li key={label}><span aria-label={complete[i]?'Complete':'Optional'}>{complete[i]?'✓':String(i+1).padStart(2,'0')}</span><div><strong>{label}</strong><p>{detail}</p></div><button onClick={()=>setTab(key as Tab)}>{complete[i]?'EDIT':'START'} ↗</button></li>)}</ol></section>
    <section className="ms-card ms-network"><span className="kicker">BEYOND YOUR WALL</span><h2>Find your next world.</h2><p>Discover what the community is creating and find a conversation worth joining.</p><div className="ms-actions"><Link to="/discover">EXPLORE CREATIONS ↗</Link><Link to="/community">OPEN COMMUNITY ↗</Link></div></section></div>
    <aside>{space&&<SpaceProgress space={space}/>}<section className="ms-card"><span className="kicker">YOUR PUBLIC PRESENCE</span><h3>{profile.visibility==='public'?'Your wall is open.':'A private beginning.'}</h3><p>{profile.visibility==='public'?'Your profile, selected awards, images and wall entries are visible to visitors.':'Only you can see your wall, pictures and profile. Publish it whenever you are ready.'}</p><button onClick={()=>setTab('profile')}>EDIT PROFILE & VISIBILITY ↗</button></section></aside></div>}
   {tab==='profile'&&<div className="ms-profile-editor">{editor}</div>}
   {tab==='appearance'&&<><div className="ms-section-head"><div><span className="kicker">PROFILE STUDIO</span><h2>Frame your world.</h2><p>Crop, preview and save each image. Your wall updates after saving.</p></div><button onClick={()=>setTab('profile')}>CHANGE ATMOSPHERE ↗</button></div><div className="ms-appearance-grid"><ProfileImageEditor slot="avatar" version={space?.media.avatar} onSaved={refresh}/><ProfileImageEditor slot="banner" version={space?.media.banner} onSaved={refresh}/></div></>}
   {tab==='wall'&&<MemberWall posts={posts} owner onChanged={refresh}/>}
   {tab==='awards'&&space&&<div className="ms-overview-grid"><section className="ms-card"><span className="kicker">YOUR ACHIEVEMENT CABINET</span><h2>Small signals. Lasting marks.</h2><p>Earn these once through your saved activity. Choose which earned awards appear on your wall.</p><div className="ms-award-grid">{space.awards.map(award=><label className={'ms-award '+(award.earnedAt?'is-earned':'is-locked')} key={award.id}><span className="ms-award-symbol" aria-hidden="true"><AwardEmblem award={award.id} earned={Boolean(award.earnedAt)}/></span><strong>{award.name}</strong><p>{award.detail}</p><small>{award.earnedAt?'EARNED · +'+award.xp+' XP':'TO EARN · '+award.xp+' XP'}</small><span><input type="checkbox" checked={featured.includes(award.id)} disabled={!award.earnedAt||busy} onChange={e=>setFeatured(v=>e.target.checked?[...v,award.id]:v.filter(id=>id!==award.id))}/> {award.earnedAt?'Feature on my wall':'Not earned yet'}</span></label>)}</div><label className="ms-setting"><input type="checkbox" checked={showStats} disabled={busy} onChange={e=>setShowStats(e.target.checked)}/><span><strong>Show my level and stats on my public wall</strong><small>Your profile must also be public.</small></span></label><button className="ms-primary" disabled={busy} onClick={()=>void saveDisplay()}>{busy?'SAVING…':'SAVE DISPLAY SETTINGS'}</button></section><aside><SpaceProgress space={space}/><section className="ms-card"><h3>Earned, once.</h3><p>These member milestones start your progress. Repeating an action never grants extra XP. Your level does not grant moderation powers.</p><p>Game achievements and Creator Studio activity will connect here as those features become available.</p></section></aside></div>}
   <footer className="ms-footer"><span>MEMBER SINCE {new Date(profile.createdAt*1000).toLocaleDateString(undefined,{month:'long',year:'numeric'})}</span><a href="/api/v1/member/account-export" download>DOWNLOAD MY DATA ↓</a><button onClick={async()=>{try{const result=await canonicalAuthClient.signOut();if(result.error)throw Error('Sign out unavailable');window.location.assign('/join')}catch{setError('Could not sign out. Try again.')}}}>SIGN OUT</button></footer>
  </div>
 </section>;
}

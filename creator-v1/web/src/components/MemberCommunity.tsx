import {useState,type FormEvent} from 'react';
import {Link} from 'react-router-dom';
import {canonicalAuthClient,canonicalMe,canonicalSpace,spaceRequest,FOCUS_OPTIONS} from '../lib/canonical-beta';
import {readMemberCommunity,type PublicMember,type PublicWallUpdate} from '../lib/member-community';
import {useResource} from '../lib/useResource';
import {MemberPortrait} from './MemberPortrait';
import '../member-community.css';

export function CommunityMemberCard({onPosted}:{onPosted:()=>void}){
 const {data:session,isPending}=canonicalAuthClient.useSession();
 return <CommunityMemberSession key={session?.user?.id||'guest'} id={session?.user?.id} isPending={isPending} onPosted={onPosted}/>;
}
function CommunityMemberSession({id,isPending,onPosted}:{id?:string;isPending:boolean;onPosted:()=>void}){
 const own=useResource(async signal=>{
  if(!id)return null;
  const member=await canonicalMe(signal);
  const space=member.profile?await canonicalSpace(signal):null;
  if(member.memberId!==id)throw Error('Your account changed. Open My space again.');
  return {profile:member.profile,space};
 },[id]);
 const [writing,setWriting]=useState(false),[body,setBody]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function submit(event:FormEvent){event.preventDefault();if(busy||!body.trim()||own.state!=='ready'||!own.data?.profile)return;setBusy(true);setError('');setNotice('');try{
  await spaceRequest('/api/v1/member/wall','POST',{body,expectedVisibility:own.data.profile.visibility});setBody('');setWriting(false);setNotice(own.data.profile.visibility==='public'?'Saved to your public wall.':'Saved to your private wall. Only you can see it.');onPosted();
 }catch(e){setError(e instanceof Error?e.message:'Could not save your entry.')}finally{setBusy(false)}}
 if(isPending||own.state==='loading')return <section className="mc-own" role="status">Opening your community space…</section>;
 if(!id)return <section className="mc-own mc-guest"><div><span className="kicker">FIND YOUR PEOPLE</span><h2>A place for your next idea.</h2><p>Meet members, visit their walls, and make a space of your own.</p></div><Link className="mc-button" to="/join">JOIN OR SIGN IN ↗</Link></section>;
 if(own.state==='error')return <section className="mc-own"><p>Your member space could not be loaded.</p><Link className="mc-button" to="/member">OPEN MY SPACE ↗</Link></section>;
 const data=own.state==='ready'?own.data:null,p=data?.profile;
 if(!p)return <section className="mc-own"><div><h2>Your account is ready.</h2><p>Choose your name to open your wall.</p></div><Link className="mc-button" to="/member">CREATE MY SPACE ↗</Link></section>;
 return <section className="mc-own" aria-label="Your community space"><div className="mc-own-top"><Link className="mc-member-identity" to="/member"><MemberPortrait src={data?.space?.media.avatar?'/api/v1/member/media/avatar':undefined} name={p.displayName}/><div><strong>{p.displayName}</strong><span>@{p.handle} · {p.visibility==='public'?'PUBLIC WALL':'PRIVATE WALL'}</span></div></Link><div className="mc-own-actions"><button className="mc-button" onClick={()=>{setWriting(v=>!v);setNotice('')}} aria-expanded={writing}>WRITE ON MY WALL</button><Link to="/member">MY SPACE ↗</Link></div></div>
  {writing&&<form className="mc-compose" onSubmit={event=>void submit(event)}><label htmlFor="community-wall-update">What are you making or exploring?</label><textarea id="community-wall-update" maxLength={2000} rows={4} value={body} onChange={event=>setBody(event.target.value)} disabled={busy} required placeholder="A work in progress, a question, a small discovery…"/><div><small>{p.visibility==='public'?'This entry will be public on your wall and in member activity.':'Your wall is private. This entry will be visible only to you.'} <Link to="/member?tab=profile">EDIT VISIBILITY</Link></small><button className="mc-button" disabled={busy||!body.trim()}>{busy?'SAVING…':p.visibility==='public'?'POST TO PUBLIC WALL':'SAVE TO PRIVATE WALL'}</button></div></form>}
  {error&&<p className="mc-error" role="alert">{error}</p>}{notice&&<p className="mc-notice" role="status">{notice} <Link to="/member?tab=wall">VIEW MY WALL ↗</Link></p>}
 </section>;
}

function MemberIdentity({member}:{member:PublicMember}){
 return <Link className="mc-member-identity" to={'/@'+member.handle}><MemberPortrait src={member.avatar?'/api/v1/members/'+member.handle+'/media/avatar':undefined} name={member.displayName}/><div><strong>{member.displayName}</strong><span>@{member.handle}</span></div></Link>;
}
export function PublicMemberDirectory(){
 const [input,setInput]=useState(''),[query,setQuery]=useState(''),[focus,setFocus]=useState('');
 return <section className="mc-directory" aria-labelledby="mc-directory-title"><header className="mc-section-head"><div><span className="kicker">PEOPLE / PUBLIC MEMBER WORLDS</span><h2 id="mc-directory-title">Meet the continuance.</h2><p>Find people by name, handle or shared interests.</p></div></header>
 <form className="mc-directory-tools" role="search" onSubmit={e=>{e.preventDefault();setQuery(input.trim())}}><label htmlFor="member-search">Find a member<input id="member-search" maxLength={72} value={input} onChange={e=>setInput(e.target.value)} placeholder="Name or @handle" autoComplete="off"/></label><label htmlFor="member-interest">Interest<select id="member-interest" value={focus} onChange={e=>setFocus(e.target.value)}><option value="">All interests</option>{FOCUS_OPTIONS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></label><button className="mc-button">SEARCH</button>{(query||focus)&&<button type="button" className="mc-clear" onClick={()=>{setQuery('');setInput('');setFocus('')}}>CLEAR</button>}</form>
 <MemberDirectoryResults key={query+'|'+focus} query={query} focus={focus}/></section>;
}
function MemberDirectoryResults({query,focus}:{query:string;focus:string}){
 const [version,setVersion]=useState(0),[more,setMore]=useState<PublicMember[]>([]),[cursor,setCursor]=useState<string|null|undefined>(undefined),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const result=useResource(signal=>readMemberCommunity<PublicMember>('members',{q:query,focus},signal),[query,focus,version]);
 const items=result.state==='ready'?[...result.data.items,...more]:[];
 const next=cursor===undefined&&result.state==='ready'?result.data.nextCursor:cursor;
 async function loadMore(){if(!next||busy)return;setBusy(true);setError('');try{const page=await readMemberCommunity<PublicMember>('members',{q:query,focus,after:next});setMore(v=>[...v,...page.items.filter(item=>!items.some(x=>x.handle===item.handle))]);setCursor(page.nextCursor)}catch(e){setError(e instanceof Error?e.message:'Could not load members.')}finally{setBusy(false)}}
 return <>{result.state==='loading'&&<p role="status">Finding public member worlds…</p>}{result.state==='error'&&<div role="alert" className="mc-error"><p>The member directory could not be loaded.</p><button className="mc-button" onClick={()=>setVersion(v=>v+1)}>TRY AGAIN</button></div>}
 {result.state==='ready'&&!items.length&&<div className="mc-empty"><span aria-hidden="true">◈</span><h3>{query||focus?'No public members match yet.':'The first worlds are taking shape.'}</h3><p>{query||focus?'Try another name or interest.':'Members appear here when they choose to make their profiles public.'}</p><Link to="/member?tab=profile">OPEN MY PROFILE SETTINGS ↗</Link></div>}
 <div className="mc-member-grid">{items.map(member=><article className={'mc-member-card av18-world-'+member.worldTheme} key={member.handle}><MemberIdentity member={member}/>{member.headline&&<p>{member.headline}</p>}{member.focus.length>0&&<div className="mc-tags">{member.focus.map(f=><span key={f}>{FOCUS_OPTIONS.find(x=>x.id===f)?.label}</span>)}</div>}<Link className="mc-wall-link" to={'/@'+member.handle}>VISIT WALL ↗</Link></article>)}</div>
 {error&&<p role="alert" className="mc-error">{error}</p>}{next&&<button className="mc-button mc-load" disabled={busy} onClick={()=>void loadMore()}>{busy?'LOADING…':'MORE MEMBER WORLDS'}</button>}</>;
}
export function PublicMemberActivity({revision=0}:{revision?:number}){
 const [attempt,setAttempt]=useState(0);
 const resource=useResource(signal=>readMemberCommunity<PublicWallUpdate>('activity',{},signal),[revision,attempt]);
 return <section className="mc-activity" aria-labelledby="mc-activity-title"><header className="mc-section-head"><div><span className="kicker">FROM MEMBER WALLS</span><h2 id="mc-activity-title">Signals from the community.</h2><p>Recent entries from members who have made their walls public.</p></div><Link to="/community?view=people">MEET MEMBERS ↗</Link></header>
 {resource.state==='loading'&&<p role="status">Reading public wall updates…</p>}{resource.state==='error'&&<div className="mc-error" role="alert"><p>Member activity could not be loaded.</p><button className="mc-button" onClick={()=>setAttempt(v=>v+1)}>TRY AGAIN</button></div>}
 {resource.state==='ready'&&(resource.data.items.length?<div className="mc-update-grid">{resource.data.items.map(item=><article className="mc-update" key={item.id}><MemberIdentity member={item}/><time dateTime={new Date(item.createdAt*1000).toISOString()}>{new Date(item.createdAt*1000).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</time><p>{item.excerpt}</p><Link className="mc-wall-link" to={'/@'+item.handle+'#wall-'+item.id}>READ ON THEIR WALL ↗</Link></article>)}</div>:<div className="mc-empty"><span aria-hidden="true">✦</span><h3>A quiet beginning.</h3><p>Public wall updates will appear here as members start sharing.</p></div>)}
 </section>;
}

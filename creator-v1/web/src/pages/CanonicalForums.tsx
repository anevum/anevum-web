import {useEffect,useState,type FormEvent} from 'react';
import {Link,useParams} from 'react-router-dom';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {useResource} from '../lib/useResource';
import {LevelEmblem,AwardEmblem} from '../components/LevelEmblem';
import {MemberPortrait} from '../components/MemberPortrait';
import './forums.css';
type Author={handle:string;displayName:string;avatar:boolean;level:number|null;featuredAwards:string[]};
type Thread={id:string;topic:string;title:string;body:string;publishedAt:number;author:Author;replyCount:number;reactions:number};
type Reply={id:string;body:string;publishedAt:number;author:Author};
type MyThread={id:string;topic:string;title:string;body:string;status:'pending_review'|'published'|'rejected'|'hidden';created_at:number};
const topics=[['all','ALL SIGNALS'],['games','GAMES & PLAY'],['making','SOFTWARE & MAKING'],['arts','ART, MEDIA & STORIES'],['community','COMMUNITY & COLLABORATION']] as const;
const UUID=/^[a-f0-9-]{36}$/;
async function request<T>(path:string,method='GET',body?:unknown,signal?:AbortSignal):Promise<T>{
 const privateRoute=path.startsWith('/api/v1/member/')||path.endsWith('/reaction');
 const response=await fetch(path,{method,credentials:privateRoute||method!=='GET'?'same-origin':'omit',mode:'same-origin',cache:'no-store',redirect:'error',headers:body?{Accept:'application/json','Content-Type':'application/json'}:{Accept:'application/json'},body:body?JSON.stringify(body):undefined,signal});
 const result=await response.json().catch(()=>({error:'Community service unavailable'}));
 if(!response.ok)throw Error(result.error||'Community service unavailable');return result as T;
}
function date(seconds:number){return new Date(seconds*1000).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}
function AuthorCard({author}:{author:Author}){
 return <Link className="cf-author" to={'/@'+author.handle}>
  <MemberPortrait name={author.displayName} src={author.avatar?'/api/v1/members/'+author.handle+'/media/avatar':undefined}/>
  <span className="cf-author-copy"><strong>{author.displayName}</strong><small>@{author.handle}</small><span className="cf-author-awards">{author.featuredAwards.map(id=><span key={id} title={id.replaceAll('_',' ')}><AwardEmblem award={id}/></span>)}</span></span>
  {author.level!==null&&<span className="cf-author-level"><LevelEmblem level={author.level} size={45}/><small>LVL {author.level}</small></span>}
 </Link>;
}
function MySubmissions({memberId}:{memberId:string}){
 const [revision,setRevision]=useState(0);
 const saved=useResource(signal=>request<{items:MyThread[]}>('/api/v1/member/forum-submissions','GET',undefined,signal),[memberId,revision]);
 return <section className="cf-mine" aria-labelledby="cf-my-title">
  <div className="cf-mine-head"><h3 id="cf-my-title">YOUR TRANSMISSIONS</h3><button type="button" disabled={saved.state==='loading'} onClick={()=>setRevision(v=>v+1)}>REFRESH</button></div>
  <p>Submissions are private until approved. Your account sees the review status of its own threads.</p>
  {saved.state==='loading'&&<p role="status">Checking your submissions…</p>}
  {saved.state==='error'&&<p role="status">Your private submission history could not be verified.</p>}
  {saved.state==='ready'&&<div className="cf-mine-list">{saved.data.items.length===0&&<p>No threads submitted yet.</p>}
   {saved.data.items.map(item=><article key={item.id}><span className="cf-mine-status" data-state={item.status}>{item.status==='pending_review'?'AWAITING REVIEW':item.status==='published'?'PUBLISHED':item.status==='rejected'?'NOT APPROVED':'HIDDEN'}</span>
    <h4>{item.status==='published'?<Link to={'/community/threads/'+item.id}>{item.title}</Link>:item.title}</h4>
    <small>{item.topic.toUpperCase()} / {date(item.created_at)}</small>
   </article>)}</div>}
 </section>;
}
export function CommunityForums(){
 const {data:session}=canonicalAuthClient.useSession();
 const [topic,setTopic]=useState('all'),[revision,setRevision]=useState(0),[compose,setCompose]=useState(false);
 const [title,setTitle]=useState(''),[body,setBody]=useState(''),[draftTopic,setDraftTopic]=useState('community'),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
 const threads=useResource(signal=>request<{items:Thread[]}>('/api/v1/community/threads'+(topic==='all'?'':'?topic='+topic),'GET',undefined,signal),[topic,revision]);
 const [requestId,setRequestId]=useState(()=>crypto.randomUUID());
 async function submit(e:FormEvent){e.preventDefault();if(busy)return;setBusy(true);setError('');try{
  await request('/api/v1/community/threads','POST',{topic:draftTopic,title,body,requestId});
  setTitle('');setBody('');setDraftTopic('community');setRequestId(crypto.randomUUID());setCompose(false);
  setNotice('Your thread is saved for staff review. It will appear publicly only when approved.');setRevision(x=>x+1);
 }catch(e){setError(e instanceof Error?e.message:'Nothing was saved')}finally{setBusy(false)}}
 return <section className="cf-forums" aria-labelledby="cf-title"><header className="cf-header"><div><span className="cf-kicker">CONTINUANCE INSTITUTE / PUBLIC COMMONS</span><h2 id="cf-title">The conversation <em>continues.</em></h2><p>Questions, ideas, feedback and creative work, organized by the people behind them.</p></div>
 <button type="button" className="cf-primary" disabled={threads.state!=='ready'} onClick={()=>{setCompose(x=>!x);setError('')}}>{compose?'CLOSE COMPOSER':'START A THREAD'}</button></header>
 <nav className="cf-topics" aria-label="Discussion topic filters">{topics.map(([id,label])=><button type="button" key={id} aria-pressed={topic===id} onClick={()=>setTopic(id)}>{label}</button>)}</nav>
 {compose&&(session?.user?<form className="cf-compose" onSubmit={e=>void submit(e)}><h3>TRANSMIT A NEW DISCUSSION</h3><p>Public profile required. Your submission enters a review queue before publication.</p>
 <label>CHANNEL<select value={draftTopic} onChange={e=>setDraftTopic(e.target.value)}>{topics.slice(1).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
 <label>TITLE<input minLength={8} maxLength={120} required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Give your discussion a clear title"/></label>
 <label>MESSAGE<textarea minLength={20} maxLength={5000} required rows={6} value={body} onChange={e=>setBody(e.target.value)} placeholder="Share a question, an idea, or useful feedback…"/></label>
 <button className="cf-primary" disabled={busy||title.trim().length<8||body.trim().length<20}>{busy?'SUBMITTING…':'SUBMIT FOR REVIEW'}</button></form>:
 <div className="cf-compose"><p>Join or sign in to create a thread with your own member identity.</p><Link to="/join">OPEN MEMBER ACCESS ↗</Link></div>)}
 {notice&&<p role="status" className="cf-notice">{notice}</p>}{error&&<p role="alert" className="cf-error">{error}</p>}
 {threads.state==='loading'&&<p role="status" className="cf-note">Reading approved public conversations…</p>}
 {threads.state==='error'&&<div className="cf-note" role="status"><p>The next-generation member forum is not enabled in this environment yet. Existing community spaces remain accessible below.</p><button type="button" onClick={()=>setRevision(x=>x+1)}>RECHECK AVAILABILITY</button></div>}
 {threads.state==='ready'&&<div className="cf-list">{threads.data.items.length===0&&<p className="cf-note">No approved threads in this channel yet. Be the first to start a conversation.</p>}
 {threads.data.items.map(t=><article className="cf-thread" key={t.id}><div className="cf-thread-meta"><span>{topics.find(x=>x[0]===t.topic)?.[1]}</span><time>{date(t.publishedAt)}</time></div><h3><Link to={'/community/threads/'+t.id}>{t.title}</Link></h3><p>{t.body.length>320?t.body.slice(0,317)+'…':t.body}</p><div className="cf-thread-foot"><AuthorCard author={t.author}/><Link to={'/community/threads/'+t.id} className="cf-count">{t.replyCount} REPLIES · {t.reactions} REACTIONS ↗</Link></div></article>)}</div>}
 {session?.user?.id&&threads.state==='ready'&&<MySubmissions key={session.user.id} memberId={session.user.id}/>}
 <p className="cf-disclosure">Only approved public threads and members appear here. Posting and replying do not automatically award XP.</p></section>;
}
export function CommunityThread(){
 const {id=''}=useParams(),[revision,setRevision]=useState(0),[body,setBody]=useState(''),[requestId,setRequestId]=useState(()=>crypto.randomUUID()),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[liked,setLiked]=useState(false);
 const {data:session}=canonicalAuthClient.useSession();
 const t=useResource(signal=>UUID.test(id)?request<{thread:Thread}>('/api/v1/community/threads/'+id,'GET',undefined,signal):Promise.reject(Error('Invalid thread')),[id,revision]);
 const replies=useResource(signal=>UUID.test(id)?request<{items:Reply[]}>('/api/v1/community/threads/'+id+'/replies','GET',undefined,signal):Promise.reject(Error('Invalid thread')),[id,revision]);
 async function action(method:string,path:string,body?:unknown){setBusy(true);setNotice('');try{await request(path,method,body);setRevision(x=>x+1);return true}catch(e){setNotice(e instanceof Error?e.message:'Action unavailable');return false}finally{setBusy(false)}}
 async function submit(e:FormEvent){e.preventDefault();if(await action('POST','/api/v1/community/threads/'+id+'/replies',{body,requestId})){setBody('');setRequestId(crypto.randomUUID());setNotice('Reply submitted for independent review.')}} 
 return <section className="cf-forums cf-detail"><Link to="/community">← RETURN TO COMMUNITY</Link>
 {t.state==='loading'&&<p>Opening discussion…</p>}{t.state==='error'&&<p role="alert">This thread is unavailable or not approved for public viewing.</p>}
 {t.state==='ready'&&<><header className="cf-header"><div><span className="cf-kicker">COMMUNITY / {t.data.thread.topic.toUpperCase()} / APPROVED</span><h1>{t.data.thread.title}</h1><AuthorCard author={t.data.thread.author}/></div></header>
 <article className="cf-thread"><p className="cf-fullbody">{t.data.thread.body}</p><div className="cf-thread-foot"><span>{t.data.thread.reactions} REACTIONS · {t.data.thread.replyCount} REPLIES</span>{session?.user&&<><button type="button" disabled={busy} onClick={async()=>{if(await action(liked?'DELETE':'POST','/api/v1/community/threads/'+id+'/reaction'))setLiked(!liked)}}>{liked?'REMOVE REACTION':'APPRECIATE'}</button><button type="button" disabled={busy} onClick={()=>void action('POST','/api/v1/community/reports',{targetKind:'thread',targetId:id,reason:'other'})}>REPORT</button></>}</div></article>
 <h2>RESPONSES</h2>{replies.state==='loading'&&<p>Reading reviewed replies…</p>}{replies.state==='ready'&&(replies.data.items.length?replies.data.items.map(r=><article className="cf-thread" key={r.id}><AuthorCard author={r.author}/><p className="cf-fullbody">{r.body}</p><time>{date(r.publishedAt)}</time></article>):<p className="cf-note">No approved replies yet.</p>)}
 {session?.user?<form className="cf-compose" onSubmit={e=>void submit(e)}><label>ADD YOUR PERSPECTIVE<textarea minLength={10} maxLength={2000} rows={5} required value={body} onChange={e=>setBody(e.target.value)}/></label><button className="cf-primary" disabled={busy||body.trim().length<10}>SUBMIT REPLY FOR REVIEW</button></form>:<p className="cf-note"><Link to="/join">Sign in</Link> to participate.</p>}
 {notice&&<p role="status" className="cf-notice">{notice}</p>}</>}</section>;
}

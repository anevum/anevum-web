import {useEffect,useRef,useState,type FormEvent,type ReactNode} from 'react';
import {Link} from 'react-router-dom';
import css from './catalog.css?inline';

type Project={id:string;creator:string;title:string;summary:string;description:string;category:string;sourceUrl:string|null;liveUrl:string|null;license:string;previewEnabled:boolean;revision:number;status?:string;publishedAt:number|null};
type Draft={creator:string;title:string;summary:string;description:string;category:string;sourceUrl:string;liveUrl:string;license:string;previewEnabled:boolean};
type Payload={viewerMemberId?:string;available?:boolean;publishingEnabled?:boolean;message?:string;projects?:Project[];project?:Project;nextOffset?:number|null;more?:boolean;imported?:Partial<Draft>;[key:string]:unknown};
const kinds=['APP','GAME','TOOL','EXPERIMENT'];
const titles:Record<string,string>={APP:'Applications',GAME:'Games',TOOL:'Tools',EXPERIMENT:'Experiments'};
const blank:Draft={creator:'',title:'',summary:'',description:'',category:'APP',sourceUrl:'',liveUrl:'',license:'Not specified',previewEnabled:false};
function external(value:unknown,source=false):string|null{
  if(typeof value!=='string'||value.length>1500)return null;
  try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return null;
    if(source&&!/^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(value))return null;
    return u.href;}catch{return null;}
}
function parseProject(value:unknown):Project{
  if(!value||typeof value!=='object')throw Error('Invalid project response.');
  const p=value as Record<string,unknown>;
  if(typeof p.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(p.id)||
    !['creator','title','summary','description','category','license'].every(k=>typeof p[k]==='string')||
    !kinds.includes(p.category as string)||typeof p.revision!=='number'||!Number.isSafeInteger(p.revision)||p.revision<1)throw Error('Invalid project response.');
  return {id:p.id,creator:String(p.creator),title:String(p.title),summary:String(p.summary),description:String(p.description),category:String(p.category),
    license:String(p.license),sourceUrl:external(p.sourceUrl,true),liveUrl:external(p.liveUrl),previewEnabled:p.previewEnabled===true,
    revision:p.revision,status:typeof p.status==='string'?p.status:undefined,publishedAt:typeof p.publishedAt==='number'?p.publishedAt:null};
}
async function request(path:string,user:string|null,method='GET',body?:unknown,signal?:AbortSignal):Promise<Payload>{
  const headers:Record<string,string>={Accept:'application/json'};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(user&&method!=='GET')headers['X-ANEVUM-EXPECTED-MEMBER-ID']=user;
  const r=await fetch(path,{method,headers,credentials:'same-origin',cache:'no-store',signal,...(body!==undefined?{body:JSON.stringify(body)}:{})});
  const value:unknown=await r.json();
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Unexpected server response.');
  const data=value as Payload;
  if(!r.ok)throw Error(typeof data.message==='string'?data.message.slice(0,300):'This request is unavailable.');
  if(user&&data.viewerMemberId!==user)throw Error('Your account changed. Reload this page.');
  if(data.projects!==undefined){if(!Array.isArray(data.projects)||data.projects.length>200)throw Error('Invalid project list.');data.projects=data.projects.map(parseProject);}
  if(data.project!==undefined)data.project=parseProject(data.project);
  return data;
}
function useResource(path:string|null,user:string|null=null){
  const [version,setVersion]=useState(0);
  const key=(user||'public')+':'+path+':'+version;
  const [state,setState]=useState<{key:string;data:Payload|null;error:string;loading:boolean}>({key:'',data:null,error:'',loading:true});
  useEffect(()=>{if(!path)return;const controller=new AbortController();setState({key,data:null,error:'',loading:true});
    request(path,user,'GET',undefined,controller.signal).then(data=>{if(!controller.signal.aborted)setState({key,data,error:'',loading:false});})
      .catch(e=>{if(!controller.signal.aborted)setState({key,data:null,error:e instanceof Error?e.message:'Request failed.',loading:false});});
    return()=>controller.abort();},[path,user,key]);
  return {...(state.key===key?state:{data:null,error:'',loading:!!path}),reload:()=>setVersion(x=>x+1)};
}
function useMutation(user:string){
  const [busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  const live=useRef(true),controller=useRef<AbortController|null>(null),pending=useRef(false);
  useEffect(()=>{live.current=true;return()=>{live.current=false;controller.current?.abort();};},[]);
  const run=async(path:string,method:string,body:unknown,onSuccess?:(p:Payload)=>void)=>{
    if(pending.current)return;pending.current=true;setBusy(true);setNotice('');controller.current=new AbortController();
    try{const p=await request(path,user,method,body,controller.current.signal);if(live.current&&!controller.current.signal.aborted){onSuccess?.(p);setNotice('Saved.');}}
    catch(e){if(live.current)setNotice(e instanceof Error?e.message:'Request failed.');}
    finally{pending.current=false;if(live.current)setBusy(false);}
  };
  return {busy,notice,run};
}
function Notice({children}:{children:ReactNode}){return <p className="catalog-notice" role="status">{children}</p>;}
function Launch({p}:{p:Project}){return <div className="catalog-actions">{p.liveUrl&&<a className="catalog-button" href={p.liveUrl} target="_blank" rel="noopener noreferrer nofollow ugc">Open app <span aria-hidden="true">&#8599;</span></a>}{p.sourceUrl&&<a className="catalog-button secondary" href={p.sourceUrl} target="_blank" rel="noopener noreferrer nofollow ugc">View source</a>}</div>;}
function Card({p,children}:{p:Project;children?:ReactNode}){return <article className="catalog-card" data-kind={p.category}><div className="catalog-cover" aria-hidden="true"><span>{p.category}</span><strong>{p.title.slice(0,1).toUpperCase()}</strong><i/></div><div className="catalog-card-body"><p className="catalog-byline">{p.creator}</p><h3><Link to={'/projects/'+p.id}>{p.title}</Link></h3><p>{p.summary}</p><div className="catalog-meta"><span>{titles[p.category]}</span><span>{p.liveUrl?'External app':'Source only'}</span></div>{children}</div></article>;}
function Discover(){
  const [q,setQ]=useState(''),[category,setCategory]=useState(''),[search,setSearch]=useState(''),[offset,setOffset]=useState(0);
  const params=new URLSearchParams({q:search,category,offset:String(offset)});
  const resource=useResource('/api/catalog/projects?'+params);
  return <><div className="catalog-hero"><p className="catalog-eyebrow">MADE INDEPENDENTLY. SHARED HERE.</p><h1>Find something<br/>worth opening.</h1><p>Apps, games, tools and experiments from independent creators. Try the live version, explore the source, or keep it in your library.</p><Link className="catalog-button" to="/publish">Share a project</Link></div>
    <form className="catalog-search" onSubmit={e=>{e.preventDefault();setOffset(0);setSearch(q.trim());}}><label className="catalog-grow">Search projects<input value={q} maxLength={80} onChange={e=>setQ(e.target.value)} placeholder="What would you like to find?"/></label><label>Category<select value={category} onChange={e=>{setCategory(e.target.value);setOffset(0);}}><option value="">All categories</option>{kinds.map(k=><option key={k} value={k}>{titles[k]}</option>)}</select></label><button className="catalog-button" type="submit">Search</button></form>
    {resource.loading?<Notice>Loading projects...</Notice>:resource.error?<Notice>{resource.error}</Notice>:!resource.data?.projects?.length?<div className="catalog-empty"><h2>No published projects here yet.</h2><p>Only real, reviewed submissions appear. No sample apps, invented reviews, or popularity counts.</p><Link to="/publish">Prepare the first project</Link></div>:<div className="catalog-grid">{resource.data.projects.map(p=><Card p={p} key={p.id}/>)}</div>}
    <div className="catalog-actions">{offset>0&&<button className="catalog-button secondary" onClick={()=>setOffset(Math.max(0,offset-24))}>Previous</button>}{typeof resource.data?.nextOffset==='number'&&<button className="catalog-button secondary" onClick={()=>setOffset(resource.data!.nextOffset as number)}>Next projects</button>}</div>
  </>;
}
function Detail({id,user}:{id:string;user:string|null}){
  const r=useResource('/api/catalog/projects/'+id);const [preview,setPreview]=useState(false);
  if(r.loading)return <Notice>Loading project...</Notice>;if(r.error||!r.data?.project)return <Notice>{r.error||'Project not found.'}</Notice>;
  const p=r.data.project;
  return <><Link to="/discover" className="catalog-back">&#8592; Discover</Link><div className="catalog-project"><p className="catalog-eyebrow">{titles[p.category]} / {p.creator}</p><h1>{p.title}</h1><p className="catalog-summary">{p.summary}</p><Launch p={p}/><p className="catalog-host">{p.liveUrl?'Runs on '+new URL(p.liveUrl).hostname+'. External links are not ANEVUM services.':'This project currently provides source code, not a running app.'}</p><div className="catalog-description">{p.description}</div>
    <p>License: <strong>{p.license}</strong>. Repository link supplied by the publisher; ownership is not verified by GitHub connection.</p>
    {user?<SaveButton p={p} user={user}/>:<Link to="/sign-in">Sign in to save this project</Link>}
    {p.liveUrl&&p.previewEnabled&&<section className="catalog-preview"><h2>Try the preview</h2><p>Loading contacts the creator's host, which can see your network information. Do not enter ANEVUM credentials in third-party apps.</p>{preview?<><iframe title={p.title+' external preview'} src={p.liveUrl} sandbox="allow-scripts" referrerPolicy="no-referrer" loading="lazy"/><button className="catalog-button secondary" onClick={()=>setPreview(false)}>Close preview</button><p>A blank or limited preview can mean the host blocks embedding or needs permissions this sandbox does not grant. Use Open app instead.</p></>:<button className="catalog-button" onClick={()=>setPreview(true)}>Load external preview</button>}</section>}
    {p.liveUrl&&<details className="catalog-install"><summary>Add this app to your Home Screen</summary><p>Open the app on its own website. Use your browser's Install app or Add to Home Screen option when available. Availability and offline features depend on that app and your browser; ANEVUM does not convert arbitrary websites into native apps.</p></details>}
  </div></>;
}
function SaveButton({p,user,onRemove}:{p:Project;user:string;onRemove?:()=>void}){const m=useMutation(user);return <><button disabled={m.busy} className="catalog-button secondary" onClick={()=>m.run('/api/catalog/library/'+p.id,onRemove?'DELETE':'PUT',{},onRemove)}>{onRemove?'Remove from library':'Save to library'}</button>{m.notice&&<Notice>{m.notice}</Notice>}</>;}
function Library({user}:{user:string}){const r=useResource('/api/catalog/library',user);return <><div className="catalog-heading"><p className="catalog-eyebrow">YOUR COLLECTION</p><h1>Library</h1><p>Saved projects are private to your account. Unpublished or withdrawn projects are hidden.</p></div>{r.loading?<Notice>Loading your library...</Notice>:r.error?<Notice>{r.error}</Notice>:!r.data?.projects?.length?<div className="catalog-empty"><h2>Your shelf is empty.</h2><Link to="/discover">Find a project to save</Link></div>:<div className="catalog-grid">{r.data.projects.map(p=><Card key={p.id} p={p}><Launch p={p}/><SaveButton p={p} user={user} onRemove={r.reload}/></Card>)}</div>}</>;}
function DraftCard({p,user,reload,edit}:{p:Project;user:string;reload:()=>void;edit:(p:Project)=>void}){
  const m=useMutation(user),[rights,setRights]=useState(false);const path='/api/catalog/mine/'+p.id;
  return <article className="catalog-draft"><div className="catalog-draft-head"><h3>{p.title}</h3><span className="catalog-status">{p.status}</span></div><p>{p.summary}</p><p className="catalog-muted">Revision {p.revision} / {p.category}</p>
    {['DRAFT','REJECTED','WITHDRAWN'].includes(p.status||'')&&<label className="catalog-check"><input type="checkbox" checked={rights} onChange={e=>setRights(e.target.checked)}/>I made this project or have permission to publish it, and its links and license are accurate.</label>}
    <div className="catalog-actions"><button className="catalog-button secondary" disabled={m.busy} onClick={()=>edit(p)}>Edit</button>
      {['DRAFT','REJECTED','WITHDRAWN'].includes(p.status||'')&&<button className="catalog-button" disabled={!rights||m.busy} onClick={()=>m.run(path+'/submit','POST',{expectedRevision:p.revision,rightsConfirmed:true},reload)}>Submit for review</button>}
      {['PENDING','PUBLISHED'].includes(p.status||'')&&<button className="catalog-button secondary" disabled={m.busy} onClick={()=>m.run(path+'/withdraw','POST',{expectedRevision:p.revision},reload)}>Withdraw</button>}
      <button className="catalog-button secondary" disabled={m.busy} onClick={()=>{if(window.confirm('Permanently delete this project listing and its catalog history? Your external app and repository are not deleted.'))void m.run(path,'DELETE',{expectedRevision:p.revision},reload);}}>Delete listing</button></div>{m.notice&&<Notice>{m.notice}</Notice>}</article>;
}
function Publisher({user}:{user:string}){
  const heading=useRef<HTMLHeadingElement|null>(null);
  const r=useResource('/api/catalog/mine',user),m=useMutation(user),[draft,setDraft]=useState<Draft>({...blank}),[editing,setEditing]=useState<Project|null>(null);
  const change=<K extends keyof Draft>(key:K,value:Draft[K])=>setDraft(d=>({...d,[key]:value}));
  const edit=(p:Project)=>{setEditing(p);setDraft({creator:p.creator,title:p.title,summary:p.summary,description:p.description,category:p.category,sourceUrl:p.sourceUrl||'',liveUrl:p.liveUrl||'',license:p.license,previewEnabled:p.previewEnabled});heading.current?.focus();};
  const clear=()=>{setDraft({...blank});setEditing(null);};
  const save=(e:FormEvent)=>{e.preventDefault();void m.run('/api/catalog/mine'+(editing?'/'+editing.id:''),editing?'PUT':'POST',{...draft,...(editing?{expectedRevision:editing.revision}:{})},()=>{clear();r.reload();});};
  const imported=(data:Payload)=>{const p=data.imported;if(!p)return;setDraft(d=>({...d,...Object.fromEntries(['title','summary','sourceUrl','liveUrl','license'].filter(k=>typeof p[k as keyof Draft]==='string').map(k=>[k,p[k as keyof Draft]]))}));};
  const download=()=>m.run('/api/catalog/export','GET',undefined,data=>{const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='anevum-creator-export.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);});
  return <><div className="catalog-heading"><p className="catalog-eyebrow">CREATOR DESK</p><h1>Give your project<br/>a place to be found.</h1><p>Your code stays on GitHub. Your app runs on your host. ANEVUM stores the listing, not your application files.</p></div>
    {r.error?<Notice>{r.error}</Notice>:<div className="catalog-publisher"><form className="catalog-form" onSubmit={save}><h2 ref={heading} id="catalog-form-title" tabIndex={-1}>{editing?'Edit listing':'New project'}</h2>{editing?.status==='PUBLISHED'&&<Notice>Saving edits removes the current public listing until the changes are reviewed.</Notice>}
      <label>Public GitHub repository<input type="url" maxLength={250} placeholder="https://github.com/you/project" value={draft.sourceUrl} onChange={e=>change('sourceUrl',e.target.value)}/></label><button className="catalog-button secondary" type="button" disabled={m.busy||!draft.sourceUrl} onClick={()=>m.run('/api/catalog/import','POST',{sourceUrl:draft.sourceUrl},imported)}>Import public repository details</button><p className="catalog-muted">Imports public metadata only. This does not connect your GitHub account or verify ownership. Review imported details before saving.</p>
      <div className="catalog-form-row"><label>Creator name<input required minLength={2} maxLength={60} value={draft.creator} onChange={e=>change('creator',e.target.value)} autoComplete="nickname"/></label><label>Category<select value={draft.category} onChange={e=>change('category',e.target.value)}>{kinds.map(k=><option value={k} key={k}>{titles[k]}</option>)}</select></label></div>
      <label>Project name<input required minLength={3} maxLength={100} value={draft.title} onChange={e=>change('title',e.target.value)}/></label><label>Summary<textarea required minLength={15} maxLength={300} rows={3} value={draft.summary} onChange={e=>change('summary',e.target.value)}/></label>
      <label>Live application URL<input type="url" maxLength={1500} placeholder="https://your-app.example" value={draft.liveUrl} onChange={e=>change('liveUrl',e.target.value)}/></label><p className="catalog-muted">Provide a public repository, a live app, or both. Never include access tokens, passwords or private invitation links.</p>
      <label>About this project<textarea maxLength={4000} rows={5} value={draft.description} onChange={e=>change('description',e.target.value)}/></label><label>License<input required maxLength={80} value={draft.license} onChange={e=>change('license',e.target.value)}/></label><p className="catalog-muted">Use the actual license, or Not specified. Public source is not automatically open source.</p>
      <label className="catalog-check"><input type="checkbox" checked={draft.previewEnabled} onChange={e=>change('previewEnabled',e.target.checked)}/>Allow visitors to load the external app in a restricted preview. My host permits embedding.</label>
      <div className="catalog-actions"><button className="catalog-button" disabled={m.busy||r.loading} type="submit">{m.busy?'Working...':'Save private draft'}</button>{editing&&<button className="catalog-button secondary" type="button" onClick={clear}>Cancel edit</button>}</div>{m.notice&&<Notice>{m.notice}</Notice>}
    </form><section className="catalog-drafts"><h2>Your projects</h2><p>Up to 25 listings. New submissions stay private until approved. Edits require a new review.</p>{r.loading?<Notice>Loading drafts...</Notice>:r.data?.projects?.map(p=><DraftCard key={p.id+':'+p.revision} p={p} user={user} reload={r.reload} edit={edit}/>)}{!r.loading&&!r.data?.projects?.length&&<p>No drafts yet. Start with a real project and its public links.</p>}<button className="catalog-button secondary" type="button" disabled={m.busy} onClick={()=>void download()}>Export my catalog data</button></section></div>}
  </>;
}
function ReviewCard({p,user,reload}:{p:Project;user:string;reload:()=>void}){
  const m=useMutation(user),[note,setNote]=useState('');return <article className="catalog-draft"><h2>{p.title}</h2><p>{p.creator} / {p.status} / revision {p.revision}</p><p>{p.summary}</p><p className="catalog-description">{p.description}</p><p>License: {p.license}. Repository ownership is unverified.</p><Launch p={p}/><label>Review note<textarea value={note} minLength={5} maxLength={500} onChange={e=>setNote(e.target.value)} placeholder="Record checks, decision and any concern. Do not enter credentials."/></label><div className="catalog-actions">{(p.status==='PUBLISHED'?['WITHDRAWN']:['PUBLISHED','REJECTED']).map(decision=><button key={decision} className="catalog-button secondary" disabled={m.busy||note.trim().length<5} onClick={()=>m.run('/api/member/studio/catalog/'+p.id,'POST',{expectedRevision:p.revision,decision,note},reload)}>{decision==='PUBLISHED'?'Approve listing':decision==='REJECTED'?'Reject':'Withdraw listing'}</button>)}</div>{m.notice&&<Notice>{m.notice}</Notice>}</article>;
}
function Review({user}:{user:string}){const r=useResource('/api/member/studio/catalog',user);return <><div className="catalog-heading"><p className="catalog-eyebrow">ANEVUM STUDIO</p><h1>Project review</h1><p>Check publisher rights, license, external URLs and preview behavior before approval. This is not a security certification of the app.</p></div>{r.loading?<Notice>Checking Studio permissions...</Notice>:r.error?<Notice>{r.error}</Notice>:<>{!r.data?.projects?.length&&<Notice>No pending or published listings.</Notice>}{r.data?.projects?.map(p=><ReviewCard key={p.id+':'+p.revision} p={p} user={user} reload={r.reload}/>)}{r.data?.more&&<Notice>Showing the latest 100 entries. Clear the current queue before accepting more submissions.</Notice>}</>}</>;}
export default function Catalog({pathname,memberId,sessionPending}:{pathname:string;memberId:string|null;sessionPending:boolean}){
  const status=useResource('/api/catalog/status');const privatePage=['/publish','/library','/studio/catalog'].includes(pathname);
  const content=privatePage?(sessionPending?<Notice>Checking your session...</Notice>:!memberId?<div className="catalog-empty"><h1>Sign in to continue.</h1><p>Your drafts and saved projects belong to your ANEVUM account.</p><Link className="catalog-button" to="/sign-in">Sign in</Link></div>:pathname==='/publish'?<Publisher user={memberId}/>:pathname==='/library'?<Library user={memberId}/>:<Review user={memberId}/>):pathname==='/discover'?<Discover/>:<Detail id={pathname.slice('/projects/'.length)} user={memberId}/>;
  return <section className="creator-catalog"><style>{css}</style><nav className="catalog-nav" aria-label="Creator platform"><Link to="/discover" aria-current={pathname==='/discover'?'page':undefined}>Discover</Link><Link to="/publish" aria-current={pathname==='/publish'?'page':undefined}>Publish</Link><Link to="/library" aria-current={pathname==='/library'?'page':undefined}>Library</Link><Link to="/products">ANEVUM projects</Link></nav>
    {(status.error||(!status.loading&&!status.data?.available))&&<Notice>Creator publishing is being prepared. Account access and existing ANEVUM pages are unchanged. No submissions are accepted until catalog storage is activated.</Notice>}
    {status.data?.available&&!status.data.publishingEnabled&&<Notice>Private draft testing is open. Public listing approval has not been activated.</Notice>}{content}
  </section>;
}

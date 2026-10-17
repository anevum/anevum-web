import {type FormEvent,useEffect,useRef,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {studioCreate,studioList,type StudioCategory,type StudioDraft,type StudioProject} from '../lib/canonical-studio';
import {STUDIO_STARTERS,studioStarter,ideaToDraft,starterToDraft,existingWorkToDraft} from '../lib/studio-launchpad';
import './studio-launchpad.css';

const kindLabels:Record<StudioCategory,string>={
 games:'Game or interactive work',tools:'Application or tool',creative:'Creative experiment',
 music:'Music or audio',art:'Artwork or gallery',video:'Film or animation',
 writing:'Writing',learning:'Learning project',research:'Research',other:'Something else'
};
const sampleIdeas=[
 'A mystery story where the reader follows strange signals',
 'An illustrated collection inspired by the night sky',
 'An interactive experience about exploring a forgotten station'
];
const statusLabels:Record<StudioProject['status'],string>={
 draft:'Private draft',pending_review:'In private review',
 changes_requested:'Needs revisions',rejected:'Review not accepted'
};
const toMessage=(error:unknown)=>error instanceof Error?error.message:'Creator Studio is unavailable. No work was published.';

function StarterSymbol({type}:{type:string}){
 const glyphs:Record<string,string>={
 story:'✦',gallery:'▧',audio:'♫',choices:'◇',experience:'◎',import:'↗'
 };
 return <span aria-hidden="true" className="sl-symbol">{glyphs[type]||'✦'}</span>;
}
export function StudioGuestDiscovery(){
 const [idea,setIdea]=useState('');
 const [notice,setNotice]=useState('');
 async function copyIdea(){
  if(!idea.trim())return;
  try{
   await navigator.clipboard.writeText(idea);
   setNotice('Idea copied. Paste it into Creator Studio after signing in.');
  }catch{
   setNotice('Clipboard access was unavailable. Select and copy your idea before leaving.');
  }
 }
 return <div className="sl-root sl-guest">
  <section className="sl-guest-hero">
   <span className="st-kicker">ANEVUM / CREATOR STUDIO / OPEN DISCOVERY</span>
   <h1>YOU CAN BE A CREATOR.</h1>
   <p>Explore ways to make a story, game, gallery, soundtrack, or something nobody has imagined yet. No special software or finished project required.</p>
   <div className="sl-guest-actions">
    <Link className="st-action" to="/join">SIGN IN TO SAVE YOUR CREATIONS ↗</Link>
    <Link className="st-link" to="/discover">EXPLORE THE COMMUNITY ↗</Link>
   </div>
  </section>
  <section className="sl-guest-explore" aria-label="Browse beginner creation starters">
   <span className="st-kicker">BEGIN WITH WHATEVER INSPIRES YOU</span>
   <h2>WHAT COULD YOU MAKE?</h2>
   <div className="sl-guest-starters">
    {STUDIO_STARTERS.filter(item=>item.id!=='import').map(item=><article key={item.id}>
     <StarterSymbol type={item.icon}/><span className="st-kicker">{item.eyebrow}</span>
     <h3>{item.title}</h3><p>{item.description}</p>
    </article>)}
   </div>
  </section>
  <section className="sl-guest-notes">
   <div>
    <span className="st-kicker">JUST EXPLORING?</span><h2>WRITE DOWN THE SPARK.</h2>
    <p>This idea is held only in this browser page while it stays open. It is not sent to ANEVUM, and leaving may lose it. Copy it before signing in.</p>
   </div>
   <div className="sl-guest-pad">
    <label htmlFor="sl-guest-idea">YOUR IDEA (LOCAL ONLY)</label>
    <textarea id="sl-guest-idea" rows={4} maxLength={2000} value={idea}
     placeholder="I want to make..." onChange={e=>{setIdea(e.target.value);setNotice('');}}/>
    <button type="button" className="st-action" disabled={!idea.trim()} onClick={()=>void copyIdea()}>
     COPY MY IDEA</button>
    {notice&&<p role="status">{notice}</p>}
   </div>
  </section>
 </div>;
}

export function StudioLaunchpad({uploadsReady}:{uploadsReady:boolean}){
 const navigate=useNavigate();
 const [idea,setIdea]=useState('');
 const [selected,setSelected]=useState('story');
 const [tab,setTab]=useState<'starter'|'import'>('starter');
 const [title,setTitle]=useState('');
 const [existingCategory,setExistingCategory]=useState<StudioCategory>('creative');
 const [externalUrl,setExternalUrl]=useState('');
 const [busy,setBusy]=useState('');
 const [error,setError]=useState('');
 const [libraryError,setLibraryError]=useState('');
 const [projects,setProjects]=useState<StudioProject[]>([]);
 const [loading,setLoading]=useState(true);
 const [query,setQuery]=useState('');
 const [filter,setFilter]=useState<'all'|'draft'|'pending_review'|'changes_requested'|'rejected'>('all');
 const ideaRequest=useRef(crypto.randomUUID());
 const importRequest=useRef(crypto.randomUUID());
 const starterRequests=useRef<Record<string,string>>({});
 const chosen=studioStarter(selected)??STUDIO_STARTERS[0];
 useEffect(()=>{
  const controller=new AbortController();
  studioList(controller.signal).then(({projects:items})=>{
   if(!controller.signal.aborted)setProjects(items);
  }).catch(e=>{if(!controller.signal.aborted)setLibraryError(toMessage(e));})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[]);
 const needle=query.trim().toLocaleLowerCase();
 const visible=projects.filter(p=>(filter==='all'||p.status===filter)&&
  (!needle||[p.title,p.summary,p.category,p.slug].some(t=>t.toLocaleLowerCase().includes(needle))));
 const drafts=projects.filter(p=>p.status==='draft'||p.status==='changes_requested').length;
 async function create(action:string,draft:StudioDraft,id:string){
  if(busy)return;
  setError('');setBusy(action);
  try{
   const result=await studioCreate(draft,id);
   // Return real server-owned project rather than a browser-local fake creation.
   navigate('/studio/'+result.project.id);
  }catch(e){setError(toMessage(e));}
  finally{setBusy('');}
 }
 function captureIdea(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(busy)return;
  try{
   const draft=ideaToDraft(idea,ideaRequest.current);
   void create('idea',draft,ideaRequest.current);
  }catch(e){setError(toMessage(e));}
 }
 function createStarter(){
  const id=starterRequests.current[chosen.id]??crypto.randomUUID();
  starterRequests.current[chosen.id]=id;
  try{void create('starter',starterToDraft(chosen.id,id),id);}
  catch(e){setError(toMessage(e));}
 }
 function importExisting(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(busy)return;
  try{
   void create('import',existingWorkToDraft(title,existingCategory,importRequest.current,externalUrl),importRequest.current);
  }catch(e){setError(toMessage(e));}
 }
 return <div className="sl-root">
  <section className="sl-hero" aria-labelledby="sl-title">
   <div className="sl-hero-copy">
    <span className="st-kicker">LAUNCHPAD / CREATE SOMETHING THAT CONTINUES</span>
    <h2 id="sl-title">EVERYTHING BEGINS WITH AN IDEA.</h2>
    <p>You do not need finished files, a game engine, or a perfect plan. Start small, develop it privately, and make something worth sharing.</p>
    <form onSubmit={captureIdea} className="sl-idea-form">
     <label htmlFor="sl-idea">WHAT WOULD YOU LIKE TO MAKE?</label>
     <textarea id="sl-idea" rows={3} maxLength={2000} value={idea} required
      disabled={Boolean(busy)} onChange={e=>{setIdea(e.target.value);ideaRequest.current=crypto.randomUUID();setError('');}}
      placeholder="A short interactive mystery... A soundtrack for a game... A collection of illustrations..."
      aria-describedby="sl-idea-help"/>
     <div className="sl-idea-actions">
      <small id="sl-idea-help">Only you can see your draft. You can change its title, category and details later.</small>
      <button className="st-action" type="submit" disabled={Boolean(busy)||!idea.trim()}>
       {busy==='idea'?'CREATING PRIVATE DRAFT…':'CAPTURE MY IDEA →'}
      </button>
     </div>
    </form>
    <div className="sl-prompts" aria-label="Try an idea prompt">
     <span>NEED A SPARK?</span>
     {sampleIdeas.map(prompt=><button type="button" key={prompt} disabled={Boolean(busy)}
      onClick={()=>{setIdea(prompt);ideaRequest.current=crypto.randomUUID();setError('');}}>
      {prompt}
     </button>)}
    </div>
   </div>
   <div className="sl-hero-art" aria-hidden="true">
    <span className="sl-ring sl-ring-outer"/><span className="sl-ring sl-ring-mid"/>
    <span className="sl-core">◈</span>
    <span className="sl-coordinate">ANEVUM / SEED 001</span>
    <span className="sl-coordinate sl-coordinate-bottom">YOUR CREATIVE UNIVERSE</span>
   </div>
  </section>
  {error&&<p role="alert" className="st-error sl-global-error">{error}</p>}
  <section className="sl-paths" aria-label="Choose how you want to start">
   <div className="sl-heading">
    <div><span className="st-kicker">01 / YOUR STARTING POINT</span>
     <h2>THERE IS NO WRONG WAY IN.</h2>
     <p>Build on a starter, or bring work you have already made.</p></div>
    <div className="sl-switch" role="group" aria-label="Starting path">
     <button type="button" onClick={()=>{setTab('starter');setError('');}}
      aria-pressed={tab==='starter'}>EXPLORE STARTERS</button>
     <button type="button" onClick={()=>{setTab('import');setError('');}}
      aria-pressed={tab==='import'}>BRING MY WORK</button>
    </div>
   </div>
   {tab==='starter'?<div className="sl-templates">
    <div className="sl-template-grid" aria-label="Creator starter templates">
     {STUDIO_STARTERS.filter(t=>t.id!=='import').map(t=><button type="button" key={t.id}
      className="sl-template" disabled={Boolean(busy)} aria-pressed={selected===t.id}
      onClick={()=>{setSelected(t.id);setError('');}}>
      <StarterSymbol type={t.icon}/>
      <span className="st-kicker">{t.eyebrow}</span><strong>{t.title}</strong>
      <small>{t.description}</small>
      <span className="sl-template-link">{selected===t.id?'SELECTED':'EXPLORE'} <span aria-hidden="true">↗</span></span>
     </button>)}
    </div>
    <aside className="sl-template-inspector" aria-live="polite">
     <span className="st-kicker">SELECTED STARTER / PRIVATE WORKSPACE</span>
     <StarterSymbol type={chosen.icon}/>
     <h3>{chosen.title}</h3>
     <p>{chosen.description}</p>
     <div className="sl-inspector-preview">
      <strong>YOUR STARTER INCLUDES</strong>
      <p>{chosen.outline.split('\n').filter(Boolean).slice(0,3).join('  •  ')}</p>
     </div>
     <button type="button" className="st-action" disabled={Boolean(busy)} onClick={createStarter}>
      {busy==='starter'?'CREATING PRIVATE DRAFT…':'START THIS CREATION →'}
     </button>
     <small>A private, editable outline will be created in your ANEVUM account. Interactive rendering, media hosting and publishing are not activated yet.</small>
    </aside>
   </div>:<div className="sl-bring">
    <div className="sl-bring-copy">
     <span className="st-kicker">ALREADY MADE SOMETHING?</span>
     <h3>YOUR WORK BELONGS HERE, TOO.</h3>
     <p>Have a game, song, illustration, film, document, or application? Start with a private project record. An outside link is optional.</p>
     <p className="sl-upload-state">PRIVATE FILE UPLOADS: {uploadsReady?'AVAILABLE TO YOUR APPROVED TEST ACCOUNT':'NOT YET ACTIVE'}</p>
     <small>{uploadsReady?'You can add allowed files from the project editor after creating a draft. Uploads remain quarantined.':'You can prepare the project and its credits now. File uploads will open only after dedicated storage and review safeguards are activated.'}</small>
    </div>
    <form className="sl-bring-form" onSubmit={importExisting}>
     <label className="st-field"><span>WHAT IS IT CALLED?</span><input value={title} required minLength={3}
      maxLength={100} disabled={Boolean(busy)} placeholder="Title of your creation"
      onChange={e=>{setTitle(e.target.value);importRequest.current=crypto.randomUUID();setError('');}}/></label>
     <label className="st-field"><span>WHAT KIND OF WORK?</span><select value={existingCategory}
      disabled={Boolean(busy)} onChange={e=>{setExistingCategory(e.target.value as StudioCategory);importRequest.current=crypto.randomUUID();}}>
      {(Object.entries(kindLabels) as [StudioCategory,string][]).map(([id,label])=><option key={id} value={id}>{label}</option>)}
     </select></label>
     <label className="st-field"><span>EXISTING HTTPS LINK (OPTIONAL)</span>
      <input type="url" value={externalUrl} maxLength={1500} disabled={Boolean(busy)}
       placeholder="https://example.com/my-creation"
       onChange={e=>{setExternalUrl(e.target.value);importRequest.current=crypto.randomUUID();setError('');}}/>
      <small>No link? You can add it later. This does not publish your work.</small>
     </label>
     <button className="st-action" type="submit" disabled={Boolean(busy)||title.trim().length<3}>
      {busy==='import'?'CREATING PRIVATE DRAFT…':'CREATE PRIVATE PROJECT →'}
     </button>
    </form>
   </div>}
  </section>
  <section className="sl-library" aria-label="Your saved private projects">
   <div className="sl-heading">
    <div><span className="st-kicker">02 / CONTINUE CREATING</span><h2>YOUR WORKS IN PROGRESS.</h2>
     <p>Pick up an earlier idea or manage the detailed project record.</p></div>
    <div className="sl-status">
     <span><strong>{loading?'—':projects.length}</strong> PROJECTS</span>
     <span><strong>{loading?'—':drafts}</strong> IN PROGRESS</span>
    </div>
   </div>
   {!loading&&projects.length>0&&<div className="sl-filters">
    <label>FIND A CREATION<input type="search" value={query} placeholder="Search your projects"
     onChange={e=>setQuery(e.target.value)}/></label>
    <label>WORKFLOW STATUS<select value={filter}
     onChange={e=>setFilter(e.target.value as typeof filter)}>
      <option value="all">All private projects</option><option value="draft">Private drafts</option>
      <option value="changes_requested">Changes requested</option>
      <option value="pending_review">In review</option><option value="rejected">Not accepted</option>
     </select></label>
   </div>}
   {loading&&<p role="status" className="st-muted">OPENING YOUR PRIVATE WORKS…</p>}
   {libraryError&&<p role="alert" className="st-error">{libraryError}</p>}
   {!loading&&!libraryError&&projects.length===0&&<div className="sl-empty">
    <span aria-hidden="true">✧</span><h3>YOUR FIRST CREATION IS WAITING.</h3>
    <p>Start with the idea field or choose a starter above. Your private projects will appear here.</p>
   </div>}
   {!loading&&!libraryError&&projects.length>0&&visible.length===0&&
    <p role="status" className="st-muted">No projects match those filters.</p>}
   <div className="sl-work-grid">{visible.map(p=><Link className="sl-work" to={'/studio/'+p.id} key={p.id}>
    <span className="sl-work-mark" aria-hidden="true">◈</span>
    <span className="st-kicker">{kindLabels[p.category]} / REV {p.revision}</span>
    <strong>{p.title}</strong><span>{p.summary}</span>
    <small>{statusLabels[p.status]} · UPDATED {new Date(p.updatedAt*1000).toLocaleDateString()}</small>
   </Link>)}</div>
   <div className="sl-library-footer"><Link to="/studio/new">OPEN ADVANCED PROJECT FORM ↗</Link>
    <span>Private work remains private until a separate future public release process.</span></div>
  </section>
 </div>;
}
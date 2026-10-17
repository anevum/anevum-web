import {type FormEvent,useEffect,useRef,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {studioCreate,studioList,type StudioCategory,type StudioDraft,type StudioProject} from '../lib/canonical-studio';
import {STUDIO_STARTERS,blankCanvasToDraft,ideaToDraft,starterToDraft,existingWorkToDraft} from '../lib/studio-launchpad';
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
 const scratchpad=useRef<HTMLTextAreaElement>(null);
 async function copyIdea(){
  if(!idea.trim())return;
  try{
   await navigator.clipboard.writeText(idea);
   setNotice('Idea copied. Paste it into Creator Studio after signing in.');
  }catch{
   scratchpad.current?.focus();scratchpad.current?.select();
   setNotice('Clipboard access is unavailable. Your idea is selected; copy it before leaving this page.');
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
    <textarea id="sl-guest-idea" ref={scratchpad} rows={4} maxLength={2000} value={idea}
     placeholder="I want to make..." onChange={e=>{setIdea(e.target.value);setNotice('');}}/>
    <button type="button" className="st-action" disabled={!idea.trim()} onClick={()=>void copyIdea()}>
     COPY MY IDEA</button>
    {notice&&<p role="status">{notice}</p>}
   </div>
  </section>
 </div>;
}


const CANVAS_PATHS=[
 {id:'story',tag:'WORDS & WORLDS',title:'Write a story',note:'Shape chapters, passages, and reflections.',symbol:'✦',intent:'CREATE & PREVIEW'},
 {id:'choices',tag:'INTERACTIVE FICTION',title:'Make a choice story',note:'Build scenes and pathways readers can explore.',symbol:'◇',intent:'CREATE & PREVIEW'},
 {id:'gallery',tag:'VISUAL WORLDS',title:'Curate a gallery',note:'Arrange visual concepts, captions, and credits.',symbol:'▧',intent:'CAPTIONS & PREVIEW'},
 {id:'audio',tag:'SOUND & MUSIC',title:'Plan a sound project',note:'Develop an audio concept or track notes.',symbol:'♫',intent:'NOTES ONLY FOR NOW'},
 {id:'experience',tag:'GAMES & INTERACTION',title:'Sketch a game idea',note:'Explore the mechanics and story before building.',symbol:'◎',intent:'NOTES ONLY FOR NOW'}
] as const;
const projectSorted=(a:StudioProject,b:StudioProject)=>b.updatedAt-a.updatedAt;
function ProjectArtwork({kind}:{kind:StudioCategory}){
 const accents:Partial<Record<StudioCategory,string>>={
  writing:'✦',games:'◎',creative:'◇',art:'▧',music:'♫',video:'▹',learning:'⌘',research:'◈',tools:'⊞'
 };
 return <span aria-hidden="true" className={'sl-project-visual sl-project-visual--'+kind}>
  <span className="sl-project-orbit"/><span className="sl-project-glyph">{accents[kind]||'◌'}</span>
 </span>;
}
export function StudioLaunchpad({uploadsReady}:{uploadsReady:boolean}){
 const navigate=useNavigate();
 const [projects,setProjects]=useState<StudioProject[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState('');
 const [error,setError]=useState('');
 const [libraryError,setLibraryError]=useState('');
 const [query,setQuery]=useState('');
 const [idea,setIdea]=useState('');
 const [showIdeas,setShowIdeas]=useState(false);
 const [importTitle,setImportTitle]=useState('');
 const [importKind,setImportKind]=useState<StudioCategory>('creative');
 const [importUrl,setImportUrl]=useState('');
 const [importOpen,setImportOpen]=useState(false);
 const blankRequest=useRef(crypto.randomUUID());
 const ideaRequest=useRef(crypto.randomUUID());
 const importRequest=useRef(crypto.randomUUID());
 const starterRequests=useRef<Record<string,string>>({});
 useEffect(()=>{
  const controller=new AbortController();
  studioList(controller.signal).then(({projects:records})=>{
   if(!controller.signal.aborted)setProjects(records.sort(projectSorted));
  }).catch(e=>{if(!controller.signal.aborted)setLibraryError(toMessage(e));})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[]);
 const visible=projects.filter(p=>
  [p.title,p.summary,p.category,p.slug].some(v=>
   v.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())));
 const resume=projects.find(p=>p.status==='draft'||p.status==='changes_requested')||null;
 async function create(action:string,draft:StudioDraft,id:string){
  if(busy)return;
  setError('');setBusy(action);
  try{
   const result=await studioCreate(draft,id);
   navigate('/studio/'+result.project.id);
  }catch(e){setError(toMessage(e));}
  finally{setBusy('');}
 }
 function startBlank(){const id=blankRequest.current;void create('blank',blankCanvasToDraft(id),id);}
 function startPath(path:string){
  const id=starterRequests.current[path]??crypto.randomUUID();
  starterRequests.current[path]=id;
  try{void create(path,starterToDraft(path,id),id);}
  catch(e){setError(toMessage(e));}
 }
 function startIdea(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  try{void create('idea',ideaToDraft(idea,ideaRequest.current),ideaRequest.current);}
  catch(e){setError(toMessage(e));}
 }
 function bringWork(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  try{
   const id=importRequest.current;
   void create('import',existingWorkToDraft(importTitle,importKind,id,importUrl),id);
  }catch(e){setError(toMessage(e));}
 }
 return <div className="sl-root sl-space">
  {resume&&<section className="sl-return" aria-label="Resume creating">
   <div className="sl-return-copy">
    <span className="st-kicker">YOUR WORK IS STILL HERE</span>
    <p>Pick up where you left off.</p>
    <strong>{resume.title}</strong>
   </div>
   <Link className="sl-return-action" to={'/studio/'+resume.id}>CONTINUE CREATING <span aria-hidden="true">↗</span></Link>
  </section>}
  <section className="sl-landing-hero" aria-labelledby="sl-title">
   <div className="sl-landing-copy">
    <span className="st-kicker">ANEVUM / THE CREATIVE EXPANSE</span>
    <h2 id="sl-title">MAKE<br/><em>SOMETHING.</em></h2>
    <p>Give an idea a place to exist. Start with an empty surface, follow a spark, or pick up work already underway.</p>
    <div className="sl-landing-actions">
     <button type="button" className="sl-primary" onClick={startBlank} disabled={Boolean(busy)}>
      <span className="sl-primary-symbol" aria-hidden="true">+</span>
      {busy==='blank'?'OPENING YOUR CANVAS…':'OPEN A BLANK CANVAS'} <span aria-hidden="true">↗</span>
     </button>
     <a className="sl-secondary" href="#sl-starters">EXPLORE STARTING POINTS ↓</a>
    </div>
    <small>Only you can see your draft. A blank canvas is saved as a private project when it opens.</small>
   </div>
   <div className="sl-landing-art" aria-hidden="true">
    <span className="sl-void-halo"/>
    <span className="sl-void-ring sl-void-ring-one"/>
    <span className="sl-void-ring sl-void-ring-two"/>
    <span className="sl-void-core">◈</span>
    <span className="sl-void-coordinate">CREATION IS A FORM OF CONTINUANCE</span>
   </div>
  </section>
  {error&&<p role="alert" className="st-error sl-global-error">{error}</p>}
  <section id="sl-starters" className="sl-start-points" aria-labelledby="sl-start-title">
   <div className="sl-minor-heading">
    <div><span className="st-kicker">CHOOSE YOUR FIRST MOVE</span>
     <h2 id="sl-start-title">Or begin with a spark.</h2></div>
    <span className="sl-heading-note">ONE TOUCH OPENS A PRIVATE WORKSPACE</span>
   </div>
   <div className="sl-path-grid">
    {CANVAS_PATHS.map(path=><button type="button" className={'sl-path-card sl-path-'+path.id}
     key={path.id} disabled={Boolean(busy)} onClick={()=>startPath(path.id)}>
     <span className="sl-path-top"><span className="sl-path-symbol" aria-hidden="true">{path.symbol}</span>
      <span className="sl-path-arrow" aria-hidden="true">↗</span></span>
     <span className="sl-path-tag">{path.tag}</span>
     <strong>{path.title}</strong>
     <span className="sl-path-note">{path.note}</span>
     <span className="sl-path-bottom">{busy===path.id?'OPENING…':path.intent}</span>
    </button>)}
   </div>
   <div className="sl-spark-drawer">
    <button type="button" aria-expanded={showIdeas} onClick={()=>setShowIdeas(v=>!v)}>
     <span aria-hidden="true">✧</span> ALREADY HAVE AN IDEA IN YOUR HEAD?
     <span aria-hidden="true">{showIdeas?'−':'+'}</span>
    </button>
    {showIdeas&&<form className="sl-spark-form" onSubmit={startIdea}>
     <label htmlFor="sl-idea">PUT IT INTO WORDS. YOU CAN CHANGE EVERYTHING LATER.</label>
     <textarea id="sl-idea" rows={3} maxLength={2000} value={idea}
      required disabled={Boolean(busy)} placeholder="A strange place. An impossible game. A story only you can tell…"
      onChange={e=>{setIdea(e.target.value);ideaRequest.current=crypto.randomUUID();setError('');}}/>
     <button className="sl-primary" type="submit" disabled={Boolean(busy)||!idea.trim()}>
      {busy==='idea'?'OPENING…':'MAKE THIS IDEA REAL ↗'}</button>
    </form>}
   </div>
  </section>
  <section className="sl-project-library" aria-labelledby="sl-library-title">
   <div className="sl-minor-heading">
    <div><span className="st-kicker">YOUR PRIVATE CONSTELLATION</span>
     <h2 id="sl-library-title">Works in progress.</h2></div>
    {!loading&&<span className="sl-heading-note">{projects.length} {projects.length===1?'CREATION':'CREATIONS'} IN YOUR SPACE</span>}
   </div>
   {loading&&<p role="status" className="st-muted">OPENING YOUR WORKS…</p>}
   {libraryError&&<p role="alert" className="st-error">{libraryError}</p>}
   {!loading&&!libraryError&&projects.length===0&&<p role="status" className="sl-library-empty">
    Your first creation will appear here. No need to plan it all in advance.</p>}
   {!loading&&!libraryError&&projects.length>5&&<label className="sl-library-search">
    <span>FIND A CREATION</span><input type="search" value={query} placeholder="Search your work"
     onChange={e=>setQuery(e.target.value)}/></label>}
   {!loading&&!libraryError&&projects.length>0&&visible.length===0&&<p role="status" className="st-muted">No creations match that search.</p>}
   <div className="sl-project-grid" aria-live="polite">
    {visible.map(p=><Link to={'/studio/'+p.id} className="sl-project-card" key={p.id}>
     <ProjectArtwork kind={p.category}/>
     <span className="sl-project-data"><span className="sl-project-type">{kindLabels[p.category]}</span>
      <strong>{p.title}</strong>
      <span className="sl-project-summary">{p.summary}</span>
      <span className="sl-project-bottom"><span>{statusLabels[p.status]}</span>
       <span>{new Date(p.updatedAt*1000).toLocaleDateString()}</span></span>
     </span><span className="sl-project-arrow" aria-hidden="true">↗</span>
    </Link>)}
   </div>
  </section>
  <section className="sl-import-zone">
   <details id="sl-bring" className="sl-import-panel" open={importOpen}
    onToggle={e=>setImportOpen(e.currentTarget.open)}>
    <summary><span className="sl-import-mark" aria-hidden="true">↗</span>
     <span><small>HAVE SOMETHING ALREADY?</small><strong>Bring your own work into ANEVUM.</strong>
      <span>Record a finished game, track, artwork, film, app, or project without starting over.</span></span>
     <span className="sl-import-indicator" aria-hidden="true">{importOpen?'−':'+'}</span>
    </summary>
    <div className="sl-import-content">
     <p>Bring its title and optional link into your private space. NOT YET ACTIVE: direct file uploads and public playback. No files are transferred by this form.</p>
     <form onSubmit={bringWork} className="sl-import-form">
      <label><span>TITLE</span><input value={importTitle} minLength={3} maxLength={100} required
       disabled={Boolean(busy)} placeholder="What did you make?"
       onChange={e=>{setImportTitle(e.target.value);importRequest.current=crypto.randomUUID();}}/></label>
      <label><span>TYPE</span><select value={importKind} disabled={Boolean(busy)}
       onChange={e=>{setImportKind(e.target.value as StudioCategory);importRequest.current=crypto.randomUUID();}}>
       {(Object.entries(kindLabels) as [StudioCategory,string][]).map(([kind,name])=><option key={kind} value={kind}>{name}</option>)}
      </select></label>
      <label className="sl-import-url"><span>EXISTING HTTPS LINK / OPTIONAL</span>
       <input type="url" value={importUrl} maxLength={1500} disabled={Boolean(busy)}
        placeholder="https://…" onChange={e=>{setImportUrl(e.target.value);importRequest.current=crypto.randomUUID();}}/></label>
      <button className="sl-primary" disabled={Boolean(busy)||importTitle.trim().length<3} type="submit">
       {busy==='import'?'SAVING…':'ADD TO MY PRIVATE SPACE ↗'}</button>
     </form>
     <span className="sl-upload-note">{uploadsReady?'Your account may have private pilot upload access from its editor.':'Private media upload is currently disabled.'} No creation is published here.</span>
    </div>
   </details>
  </section>
  <footer className="sl-space-footer">
   <span>ANEVUM / CONTINUANCE INSTITUTE</span>
   <Link to="/studio/new">NEED THE ADVANCED PROJECT EDITOR? ↗</Link>
  </footer>
 </div>;
}

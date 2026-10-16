import {useEffect,useRef,useState} from 'react';
import {LEVEL_ARTIFACTS,LevelEmblem,SERIES_ONE_ILLUSTRATIONS_ENABLED} from './LevelEmblem';
import {useMemberProgression} from './AnevumNotifications';

const unlockedAt=(level:number)=>25*(level-1)**2;
export function LevelCollection(){
 const [chapter,setChapter]=useState(0);
 const [selectedLevel,setSelectedLevel]=useState<number|null>(null);
 const opener=useRef<HTMLButtonElement|null>(null);
 const closeButton=useRef<HTMLButtonElement|null>(null);
 const {progression:p}=useMemberProgression();
 const chosen=selectedLevel===null?null:LEVEL_ARTIFACTS[selectedLevel-1];
 const previewOpen=selectedLevel!==null;
 useEffect(()=>{
  if(!previewOpen)return;
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  closeButton.current?.focus();
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();setSelectedLevel(null)}
   if(event.key==='ArrowLeft'){event.preventDefault();setSelectedLevel(n=>n===null?n:Math.max(1,n-1))}
   if(event.key==='ArrowRight'){event.preventDefault();setSelectedLevel(n=>n===null?n:Math.min(60,n+1))}
   if(event.key==='Tab'){
    const dialog=document.querySelector('.an-artwork-dialog');
    const focused=dialog?.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
    if(!focused?.length)return;
    const first=focused[0],last=focused[focused.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
   }
  };
  window.addEventListener('keydown',onKey);
  return()=>{document.body.style.overflow=previousOverflow;window.removeEventListener('keydown',onKey);opener.current?.focus()};
 },[previewOpen]);
 const shown=LEVEL_ARTIFACTS.filter(a=>!chapter||Math.ceil(a.level/10)===chapter);
 const select=(level:number,button:HTMLButtonElement)=>{opener.current=button;setSelectedLevel(level)};
 return <>
 <section className={'an-series'+(SERIES_ONE_ILLUSTRATIONS_ENABLED?' is-illustrated':'')} aria-labelledby="an-series-heading">
  <header><div><span className="kicker">CONTINUANCE INSTITUTE / ARTIFACT REGISTRY / SERIES 01</span><h2 id="an-series-heading">The first sixty signals.</h2><p>Sixty individually named artifacts, from Foundry Spark to The First Light. Each unlocks at its level. The journey continues beyond the first collection.</p></div></header>
  <div className="an-series-filters" role="group" aria-label="Level icon collection">
   <button aria-pressed={chapter===0} onClick={()=>setChapter(0)}>ALL 60</button>
   {[1,2,3,4,5,6].map(n=><button key={n} aria-pressed={chapter===n} onClick={()=>setChapter(n)}>{String(n*10-9).padStart(2,'0')}–{n*10}</button>)}
  </div>
  <div className="an-series-grid">{shown.map(a=>{
   const earned=Boolean(p&&p.level>=a.level);
   return <article key={a.level} className={'an-artifact-card'+(earned?' is-earned':'')}>
    <small>LEVEL {String(a.level).padStart(2,'0')}</small>
    {SERIES_ONE_ILLUSTRATIONS_ENABLED
      ?<button type="button" className="an-artwork-view" aria-label={'View '+a.name+' illustrated artifact'} onClick={event=>select(a.level,event.currentTarget)}><LevelEmblem level={a.level} size={180}/><span className="an-artwork-zoom" aria-hidden="true">VIEW ARTIFACT ↗</span></button>
      :<LevelEmblem level={a.level} size={128}/>}
    <h3>{a.name}</h3><p>{unlockedAt(a.level).toLocaleString()} XP</p>
    <span>{p?earned?'UNLOCKED':'TO BE DISCOVERED':'SERIES 01 / LEVEL EMBLEM'}</span>
   </article>
  })}</div>
 </section>
 {SERIES_ONE_ILLUSTRATIONS_ENABLED&&chosen&&<div className="an-artwork-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setSelectedLevel(null)}}>
  <section className="an-artwork-dialog" role="dialog" aria-modal="true" aria-labelledby="an-artwork-name" aria-describedby="an-artwork-description">
   <button type="button" className="an-artwork-close" ref={closeButton} onClick={()=>setSelectedLevel(null)} aria-label="Close artifact illustration">CLOSE ×</button>
   <div className="an-artwork-detail-visual"><LevelEmblem level={chosen.level} size={440} priority/></div>
   <div className="an-artwork-copy">
    <span className="kicker">CONTINUANCE INSTITUTE / SERIES 01</span>
    <small>LEVEL {String(chosen.level).padStart(2,'0')}</small>
    <h2 id="an-artwork-name">{chosen.name}</h2>
    <p id="an-artwork-description">Illustrated Series One artifact. Its unlock state is determined by your saved member progression, not this preview.</p>
    <dl><dt>REQUIRED XP</dt><dd>{unlockedAt(chosen.level).toLocaleString()}</dd><dt>YOUR STATUS</dt><dd>{p?p.level>=chosen.level?'UNLOCKED':'LOCKED':'SIGN IN TO VIEW'}</dd></dl>
    <div className="an-artwork-detail-nav"><button type="button" disabled={chosen.level<=1} onClick={()=>setSelectedLevel(n=>n===null?n:Math.max(1,n-1))}>← PREVIOUS</button><button type="button" disabled={chosen.level>=60} onClick={()=>setSelectedLevel(n=>n===null?n:Math.min(60,n+1))}>NEXT →</button></div>
   </div>
  </section>
 </div>}
 </>;
}

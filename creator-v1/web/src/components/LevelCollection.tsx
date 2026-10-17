import {useState} from 'react';
import {LEVEL_ARTIFACTS,LevelEmblem} from './LevelEmblem';
import {useMemberProgression} from './AnevumNotifications';
const CHAPTERS=[
 {name:'Before Form',description:'From Pre-Grain through the opening of expansion.'},
 {name:'First Matter',description:'Charge, binding, nuclei, atoms and the oldest radiation.'},
 {name:'Stellar Dawn',description:'Hydrogen clouds collapse and the first stellar furnaces ignite.'},
 {name:'Cosmic Architecture',description:'Elements, galaxies, filaments and planetary systems emerge.'},
 {name:'Worlds & Life',description:'Ocean worlds, molecules, replication and living ecosystems.'},
 {name:'Continuance',description:'Awareness becomes communication, civilization, the Institute and ANEVUM.'}
] as const;
export function LevelCollection(){
 const [chapter,setChapter]=useState(0);
 const {progression:p}=useMemberProgression();
 const shown=LEVEL_ARTIFACTS.filter(a=>!chapter||a.chapter===chapter);
 return <section className="an-series an-series-v034 an-series-v060" aria-labelledby="an-series-heading">
  <header className="an-series-intro"><div><span className="kicker">CONTINUANCE INSTITUTE / EVOLUTION OF EVERYTHING</span><h2 id="an-series-heading">An archive of becoming.</h2><p>Thirty permanent levels. Six chapters. Each living specimen marks a new threshold in the evolution of existence, from Pre-Grain to ANEVUM.</p><a className="an-specimen-open" href="/evolution/">ENTER THE LIVING 3D ARCHIVE ↗</a></div><div className="an-series-count" aria-label="30 specimens across six chapters"><strong>30</strong><span>SPECIMENS<br/>06 CHAPTERS</span></div></header>
  <nav className="an-series-filters" aria-label="Explore evolutionary chapters"><button type="button" aria-pressed={chapter===0} onClick={()=>setChapter(0)}>ALL 30</button>{CHAPTERS.map((c,i)=><button type="button" key={c.name} aria-pressed={chapter===i+1} onClick={()=>setChapter(i+1)} title={c.name}><span>{String(i*5+1).padStart(2,'0')}–{String((i+1)*5).padStart(2,'0')}</span><span className="an-chapter-filter-name">{c.name}</span></button>)}</nav>
  {chapter>0&&<div className="an-chapter-description"><small>CHAPTER {String(chapter).padStart(2,'0')} / 06</small><h3>{CHAPTERS[chapter-1].name}</h3><p>{CHAPTERS[chapter-1].description}</p></div>}
  <div className="an-series-grid">{shown.map(a=>{const earned=!!p&&p.level>=a.level;return <article key={a.level} className={'an-artifact-card an-artifact-card-v034'+(earned?' is-earned':'')} style={{'--artifact-arc':String(a.chapter)} as React.CSSProperties}><div className="an-artifact-card-head"><small>NO. {String(a.level).padStart(2,'0')}</small><small>{CHAPTERS[a.chapter-1].name}</small></div><div className="an-artifact-visual"><LevelEmblem level={a.level} size={128}/></div><h3>{a.name}</h3><p>{a.xp.toLocaleString()} XP</p><span className="an-artifact-state">{p?(earned?'UNLOCKED':'LOCKED'):'LEVEL '+a.level+' SPECIMEN'}</span><a className="an-specimen-link" href={'/evolution/?level='+a.level} aria-label={'Inspect '+a.name+' as animated native 3D artwork'}>INSPECT LIVE 3D ↗</a></article>})}</div>
  <footer className="an-series-outro">EVOLUTION OF EVERYTHING / PERMANENT COLLECTION <span>LEVEL 30 · ANEVUM · 63,075 XP</span></footer>
 </section>;
}

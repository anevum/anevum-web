import {useState} from 'react';
import {LEVEL_ARTIFACTS,LevelEmblem} from './LevelEmblem';
import {useMemberProgression} from './AnevumNotifications';

const CHAPTERS=[["The First Signals","Ignition","Small discoveries. Distinct materials, recognizable instruments, and the first evidence of something greater."],["Awakening Mechanisms","Calibration","Tuning, movement, and crafted objects beginning to respond."],["The Cartographers","Orientation","Instruments for measuring, mapping, and navigating the unknown."],["Correspondence","Connection","Different systems begin to communicate and influence one another."],["The Great Structures","Construction","More ambitious assemblies, architectures, and self-contained environments."],["The First Continuance","Continuance","A culmination of scale, precision, and light. The beginning of what comes next."]] as const;
export function LevelCollection(){
 const [chapter,setChapter]=useState(0);
 const {progression:p}=useMemberProgression();
 const shown=LEVEL_ARTIFACTS.filter(a=>!chapter||Math.ceil(a.level/10)===chapter);
 return <section className="an-series an-series-v034" aria-labelledby="an-series-heading">
  <header className="an-series-intro"><div><span className="kicker">ANEVUM / SERIES ONE / ARTIFACT COLLECTION</span><h2 id="an-series-heading">The First Continuance.</h2><p>Sixty discoveries. Six chapters. Every artifact has its own identity, and every level is earned. This is the first collection, not the end of progression.</p></div><div className="an-series-count" aria-label="60 artifacts in six chapters"><strong>60</strong><span>ARTIFACTS<br/>06 CHAPTERS</span></div></header>
  <nav className="an-series-filters" aria-label="Explore Series One chapters"><button aria-pressed={chapter===0} onClick={()=>setChapter(0)}>ALL 60</button>{CHAPTERS.map((c,i)=><button key={i} aria-pressed={chapter===i+1} onClick={()=>setChapter(i+1)} title={c[0]}><span>{String(i*10+1).padStart(2,'0')}–{String((i+1)*10).padStart(2,'0')}</span><span className="an-chapter-filter-name">{c[1]}</span></button>)}</nav>
  {chapter>0&&<div className="an-chapter-description"><small>CHAPTER {String(chapter).padStart(2,'0')} / 06</small><h3>{CHAPTERS[chapter-1][0]}</h3><p>{CHAPTERS[chapter-1][2]}</p></div>}
  <div className="an-series-grid">{shown.map(a=>{const earned=!!p&&p.level>=a.level;const arc=Math.ceil(a.level/10);return <article key={a.level} className={'an-artifact-card an-artifact-card-v034'+(earned?' is-earned':'')} style={{'--artifact-arc':String(arc)} as React.CSSProperties}><div className="an-artifact-card-head"><small>NO. {String(a.level).padStart(2,'0')}</small><small>{CHAPTERS[arc-1][1]}</small></div><div className="an-artifact-visual"><LevelEmblem level={a.level} size={128}/></div><h3>{a.name}</h3><p>{(25*(a.level-1)**2).toLocaleString()} XP</p><span className="an-artifact-state">{p?(earned?'UNLOCKED':'LOCKED'):'LEVEL '+a.level+' ARTIFACT'}</span></article>})}</div>
  <footer className="an-series-outro">SERIES 01 / THE FIRST CONTINUANCE <span>MORE DISCOVERIES AWAIT BEYOND LEVEL 60</span></footer>
 </section>;
}

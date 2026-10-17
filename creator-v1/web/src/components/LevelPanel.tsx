import {Link} from 'react-router-dom';
import {useMemberProgression} from './AnevumNotifications';
import {LevelEmblem} from './LevelEmblem';
export function LevelPanel({compact=false}:{compact?:boolean}){
 const {progression:p}=useMemberProgression();
 const progress=p?(p.nextLevel===null?100:Math.min(100,Math.round(100*(p.xp-p.levelStart)/(p.nextLevel-p.levelStart)))):0;
 return <section className={'portal-level-box'+(compact?' portal-level-compact':'')} aria-label="ANEVUM levels and earned progression"><header className="portal-level-top"><span className="kicker">YOUR PLACE IN ORBIT</span><span className="portal-level-kicker">XP / EVOLUTION / RECOGNITION</span></header><div className="portal-level-main"><LevelEmblem level={p?.level||1} size={64}/><div className="portal-level-copy"><span className="portal-level-overline">{p?'YOUR EVOLUTION LEVEL':'CONTINUANCE INSTITUTE'}</span><strong>{p?'LEVEL '+p.level:'30 PERMANENT LEVELS'}</strong><small>{p?.artifact||'From Pre-Grain to ANEVUM.'}</small></div></div>{p?<><progress className="an-level-progress" value={progress} max={100} aria-label={p.nextLevel===null?'Final level achieved':'Progress to next level'}/><div className="portal-level-meta"><span>{p.xp.toLocaleString()} XP</span><span>{p.nextLevel===null?'FINAL LEVEL · ANEVUM':'NEXT: '+p.nextLevel.toLocaleString()+' XP'}</span></div></>:<p className="portal-level-info">Sign in and create your member space to see your earned XP, evolution level and medals.</p>}<Link to="/levels" className="portal-level-link">EXPLORE EVOLUTION OF EVERYTHING ↗</Link></section>;
}

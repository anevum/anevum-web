import {useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {progressionRequest,type MemberProgression} from '../lib/progression-api';
import {alertAccount,memberChanged,notify} from '../lib/ui-events';
import {previewNotification,useMemberProgression} from '../components/AnevumNotifications';
import {LevelEmblem} from '../components/LevelEmblem';
import {OrbitalMark} from '../components/OrbitalMark';
export function TheButtonPage(){
 const {data:session,isPending}=canonicalAuthClient.useSession();
 const {progression:p,testEnabled,refresh}=useMemberProgression();
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[receipt,setReceipt]=useState('');
 const pending=useRef<string|null>(null);
 async function press(){if(busy)return;setBusy(true);setError('');const owner=alertAccount();pending.current??=crypto.randomUUID();
  try{const r=await progressionRequest<{awarded:number;replayed:boolean;progression:MemberProgression}>('xp-test',{requestId:pending.current});pending.current=null;setReceipt(r.awarded?'+5 XP saved. '+r.progression.xp+' XP total.':'That press was already saved. '+r.progression.xp+' XP total.');if(r.awarded)notify({kind:'xp',xp:r.awarded,title:'+5 XP received',detail:'Signal registered · staging test'},owner);memberChanged(owner);await refresh()}
  catch(e){const message=e instanceof Error?e.message:'The press could not be confirmed.';setError(message);notify({kind:'error',title:'Signal not confirmed',detail:message},owner)}finally{setBusy(false)}
 }
 return <section className="an-button-page"><header><span className="kicker">CONTINUANCE INSTITUTE / SIGNAL CALIBRATION</span><h1>One small signal.<br/><em>A growing orbit.</em></h1><p>A temporary staging instrument for testing XP, levels and recognition.</p></header>
 {p&&<div className="an-button-progress"><LevelEmblem level={p.level} size={96}/><div><small>YOUR CONTINUANCE</small><h2>Level {p.level} · {p.artifact||'Beyond the first light'}</h2><p>{p.xp.toLocaleString()} XP · {p.nextLevel-p.xp} to level {p.level+1}</p><progress value={p.xp-p.levelStart} max={p.nextLevel-p.levelStart} aria-label="Progress to next level"/></div></div>}
 <div className="an-instrument"><div className="an-instrument-ring"><button className="an-xp-button" onClick={()=>void press()} disabled={busy||!p||!testEnabled} aria-label="Press the button to earn 5 XP"><OrbitalMark/><strong>{busy?'REGISTERING…':error&&pending.current?'RETRY SAME PRESS':'+5 XP'}</strong><span>TRANSMIT SIGNAL</span></button></div><p>{isPending?'Opening your account…':!session?.user?<Link to="/join">SIGN IN TO TEST YOUR XP ↗</Link>:!p?<Link to="/member">OPEN OR CREATE YOUR MEMBER SPACE ↗</Link>:testEnabled?'Each confirmed press saves 5 XP to your staging profile.':'This temporary test instrument is switched off.'}</p>{receipt&&<p className="an-receipt" role="status">{receipt}</p>}{error&&<p className="ms-error" role="alert">{error}</p>}</div>
 <section className="an-preview-controls" aria-label="Notification animation previews"><div><h2>Test the arrival.</h2><p>Replay the visual treatments. These previews do not award XP, medals or levels.</p></div><div><button onClick={()=>previewNotification('level')}>PREVIEW LEVEL UP</button><button onClick={()=>previewNotification('award')}>PREVIEW MEDAL</button><button onClick={()=>previewNotification('info')}>PREVIEW UPDATE</button></div></section><footer><Link to="/member?tab=awards">MY AWARDS & STATS ↗</Link><Link to="/levels">EXPLORE ALL 60 LEVEL ICONS ↗</Link><p>Staging test XP is recorded separately from contribution XP. Levels grant recognition, without changing permissions or voting power.</p></footer></section>;
}

import {Link} from 'react-router-dom';
import {AURA_CATALOG} from '../lib/player-recognition';
import './aura-codex-v091.css';

/** Public descriptions only. No earned artwork, group membership, or access grants. */
export function AuraCodexPage(){
 return <main className="av91-codex" aria-labelledby="av91-codex-title">
  <header className="av91-codex-intro">
   <span className="av91-codex-kicker">CONTINUANCE INSTITUTE / IDENTITY ATLAS</span>
   <h1 id="av91-codex-title">The Aura Codex.</h1>
   <p className="av91-codex-lead">An aura is your chosen atmosphere: a small visual expression of what draws you toward discovery and creation. It is not a rank, a faction, a credential, or an earned reward.</p>
   <div className="av91-codex-actions"><Link to="/member?tab=awards">PERSONALIZE MY PLAYER CARD ↗</Link><Link to="/recognition">MY EARNED RECOGNITION ↗</Link></div>
  </header>
  <section className="av91-codex-grid" aria-label="Personal aura affinities">
   {AURA_CATALOG.map(aura=><article key={aura.id} className={'av91-codex-entry av91-codex-entry--'+aura.id}>
    <div className="av91-codex-stage" aria-hidden="true">
     <span className="av91-codex-orbit"/><span className="av91-codex-core"/><span className="av91-codex-axis"/>
    </div>
    <div className="av91-codex-entry-copy">
     <span className="av91-codex-discipline">{aura.discipline}</span>
     <h2>{aura.name}</h2><p className="av91-codex-motto">{aura.motto}</p>
     <p>{aura.meaning}</p><small>{aura.appearance}</small>
    </div>
   </article>)}
  </section>
  <aside className="av91-codex-note"><h2>Identity without hierarchy.</h2>
   <p>All six choices are equally available. Auras do not grant XP, moderation access or membership in an Institute group. Verified founder, administrator, moderator and curator insignias use a separate audited system. Signal, Orbit, Nova and Zenith are earned from verified community contributions, not from an aura selection.</p>
  </aside>
 </main>;
}

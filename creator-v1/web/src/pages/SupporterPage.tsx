import {useState} from 'react';
import {Link} from 'react-router-dom';
import {OrbitalMark} from '../components/OrbitalMark';

type Interval='month'|'year';
/** Stripe payments retired. Pricing is informational until a new provider is approved. */
export function SupporterPage(){
 const [interval,setInterval]=useState<Interval>('year');
 return <div className="av32-support av45-support">
  <section className="av45-hero" aria-labelledby="av45-title">
   <div className="av45-hero-copy">
    <span className="av32-index">ANEVUM / THE CONTINUANCE FUND</span>
    <h1 id="av45-title">Keep the <em>signal</em> alive.</h1>
    <p>Help build a home for games, art, apps and independent makers. ANEVUM stays free to explore, create and belong to.</p>
    <div className="av45-promise"><span>NO INTRUSIVE ADS</span><span>FREE TO JOIN</span><span>CREATORS FIRST</span></div>
   </div>
   <div className="av45-symbol" aria-hidden="true">
    <span className="av45-ring"/><span className="av45-ring av45-ring-alt"/>
    <span className="av45-ring av45-ring-core"/><OrbitalMark/>
   </div>
  </section>

  <section className="av45-offer" aria-label="Founding supporter membership">
   <div className="av45-offer-copy">
    <span className="av32-index">01 / BECOME A FOUNDING SUPPORTER</span>
    <h2>Help something good grow.</h2>
    <p>Support ANEVUM's independence and collect a few beautiful ways to show you were here from the beginning. Participation, recognition through XP, and publishing remain free.</p>
    <ul className="av45-benefits">
     <li><strong>Collector seals</strong><small>Milestone marks that evolve over time</small></li>
     <li><strong>Profile frames</strong><small>Distinctive orbit-inspired borders</small></li>
     <li><strong>Wall auras</strong><small>Animated cosmic atmospheres</small></li>
    </ul>
    <Link className="av45-link" to="/support/collection">Explore the supporter collection →</Link>
   </div>
   <aside className="av45-buy" aria-label="Membership pricing">
    <div className="av45-buy-head"><strong>FOUNDING SUPPORTER</strong><span>PRE-LAUNCH</span></div>
    <div className="av45-switch" role="group" aria-label="Proposed billing interval">
     <button type="button" aria-pressed={interval==='year'} onClick={()=>setInterval('year')}>Yearly · save 40%</button>
     <button type="button" aria-pressed={interval==='month'} onClick={()=>setInterval('month')}>Monthly</button>
    </div>
    <div className="av45-price"><strong>{interval==='year'?'$36':'$5'}</strong><span>/ {interval==='year'?'year':'month'}</span></div>
    <p className="av45-frequency">{interval==='year'?'Equivalent to $3 a month. Billed once yearly.':'Proposed recurring monthly option.'}</p>
    <p className="av45-status" role="status">PAYMENTS PAUSED · PROVIDER TRANSITION</p>
    <p className="av45-frequency">Paid memberships and checkout are currently unavailable. The proposed plans are shown for reference only. No payment will be collected.</p>
    <Link className="av45-primary" to="/join">Join ANEVUM for free →</Link>
    <div className="av45-action-row">
     <Link to="/support/collection">Preview the collection →</Link>
    </div>
    <p className="av45-legal">ANEVUM is changing payment providers. Live membership prices, terms and benefits will be reviewed before enrollment returns.</p>
   </aside>
  </section>

  <section className="av45-impact" aria-label="Where support goes">
   <div className="av45-impact-copy"><span className="av32-index">02 / YOUR IMPACT</span><strong>What support helps build.</strong></div>
   <div className="av45-impact-items">
    <span>Keep ANEVUM online</span>
    <span>Improve creator tools</span>
    <span>Support safer community spaces</span>
   </div>
   <Link className="av45-link" to="/support/transparency">Open transparency report →</Link>
  </section>
  <p className="av45-principle">Supporting is always optional. It never buys XP, medals, better ranking, moderator power or extra visibility.</p>
 </div>;
}

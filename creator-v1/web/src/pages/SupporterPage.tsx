import {Link} from 'react-router-dom';
import {OrbitalMark} from '../components/OrbitalMark';

/** ANEVUM's community support surface contains no checkout, billing or redirect. */
export function SupporterPage(){
 return <div className="av32-support av45-support">
  <section className="av45-hero" aria-labelledby="av45-title">
   <div className="av45-hero-copy">
    <span className="av32-index">ANEVUM / THE CONTINUANCE FUND</span>
    <h1 id="av45-title">Keep the <em>signal</em> alive.</h1>
    <p>Help build a home for games, art, apps and independent makers. ANEVUM remains free to explore, create and belong to.</p>
    <div className="av45-promise"><span>FREE TO JOIN</span><span>CREATORS FIRST</span><span>COMMUNITY BUILT</span></div>
   </div>
   <div className="av45-symbol" aria-hidden="true">
    <span className="av45-ring"/><span className="av45-ring av45-ring-alt"/>
    <span className="av45-ring av45-ring-core"/><OrbitalMark/>
   </div>
  </section>
  <section className="av45-offer" aria-label="Founding community participation">
   <div className="av45-offer-copy">
    <span className="av32-index">01 / FOUNDING COMMUNITY</span>
    <h2>Build the next chapter with us.</h2>
    <p>Participation, thoughtful feedback and sharing authentic work are the ways to support ANEVUM today. No purchase is required, and no paid membership enrollment is available.</p>
    <ul className="av45-benefits">
     <li><strong>Explore and test</strong><small>Try real work and share specific feedback</small></li>
     <li><strong>Share what you make</strong><small>Follow invited creator testing as availability is confirmed</small></li>
     <li><strong>Recognize contributors</strong><small>Preview cosmetic ideas without paid entitlements</small></li>
    </ul>
    <Link className="av45-link" to="/support/collection">Preview community recognition concepts →</Link>
   </div>
   <aside className="av45-buy" aria-label="Enrollment availability">
    <div className="av45-buy-head"><strong>FOUNDING COMMUNITY</strong><span>FREE PARTICIPATION</span></div>
    <p className="av45-status" role="status">Payment enrollment is closed</p>
    <p className="av45-frequency">ANEVUM does not currently accept paid supporter enrollments. No checkout, recurring plan or payment link is active here. Any future payment option requires separate legal, operational and owner approval.</p>
    <Link className="av45-primary" to="/join">Join ANEVUM for free →</Link>
    <p className="av45-legal">Creator publishing and private testing remain subject to their actual release gates. Joining does not guarantee immediate upload access.</p>
   </aside>
  </section>
  <section className="av45-impact" aria-label="Where participation helps">
   <div className="av45-impact-copy"><span className="av32-index">02 / YOUR IMPACT</span><strong>What your participation helps build.</strong></div>
   <div className="av45-impact-items">
    <span>Improve creator tools</span><span>Identify usability problems</span><span>Shape safer community spaces</span>
   </div>
   <Link className="av45-link" to="/support/transparency">Open transparency report →</Link>
  </section>
  <p className="av45-principle">Participation never buys XP, medals, better ranking, moderator power or additional visibility.</p>
 </div>;
}

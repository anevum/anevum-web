import {Link} from 'react-router-dom';
import {OrbitalMark} from '../components/OrbitalMark';

/**
 * ANEVUM V142: owner-directed retirement of obsolete public subscription,
 * payment and pricing entries. This is a public presentation-only component.
 * Historical supporter records, private cosmetics and internal finance
 * evidence remain unchanged in their separately authorized systems.
 *
 * ANEVUM is a family creative studio; do not offer Stripe, trial checkout,
 * paid membership or recurring enrollment by implication.
 */
export function SupporterPage(){
 return <div className="av32-support av45-support" data-support-enrollment="inactive">
  <section className="av45-hero" aria-labelledby="av45-title">
   <div className="av45-hero-copy">
    <span className="av32-index">ANEVUM / FAMILY CREATIVE STUDIO</span>
    <h1 id="av45-title">Keep the <em>signal</em> alive.</h1>
    <p>ANEVUM is an independent family-led creative workshop. We're building TRANSCOSMIC: SEVERANCE and keeping the original tools, communities and public work available as they're verified.</p>
    <div className="av45-promise"><span>NO INTRUSIVE ADS</span><span>IN DEVELOPMENT</span><span>ORIGINAL WORK FIRST</span></div>
   </div>
   <div className="av45-symbol" aria-hidden="true"><span className="av45-ring"/><span className="av45-ring av45-ring-alt"/><span className="av45-ring av45-ring-core"/><OrbitalMark/></div>
  </section>
  <section className="av45-offer" aria-label="Current support availability">
   <div className="av45-offer-copy">
    <span className="av32-index">01 / CURRENT STATUS</span>
    <h2>Build first. Fund later.</h2>
    <p>Public supporter subscriptions, checkout, recurring payments and new paid membership tiers are not offered. There's no payment link or enrollment flow on ANEVUM.</p>
    <p>The useful way to follow the work today is to explore SEVERANCE, read verified development updates and share the work if you choose.</p>
    <Link className="av45-link" to="/severance">Explore TRANSCOSMIC: SEVERANCE →</Link>
   </div>
   <aside className="av45-buy" aria-label="Support availability">
    <div className="av45-buy-head"><strong>ANEVUM / CONTINUANCE</strong><span>DEVELOPMENT</span></div>
    <div className="av45-price"><strong>FREE</strong></div>
    <p className="av45-frequency">Exploring the public site and current game development requires no purchase.</p>
    <p className="av45-status" role="status">PAID ENROLLMENT NOT OPEN</p>
    <Link className="av45-primary" to="/status">VIEW VERIFIED STATUS ↗</Link>
    <p className="av45-legal">No checkout, donation collection or supporter payment service is active here. Previous supporter records and privacy settings are preserved separately.</p>
   </aside>
  </section>
  <section className="av45-impact" aria-label="What ANEVUM is building">
   <div className="av45-impact-copy"><span className="av32-index">02 / ACTIVE WORK</span><strong>The game comes first.</strong></div>
   <div className="av45-impact-items"><span>TRANSCOSMIC: SEVERANCE</span><span>Responsible game testing</span><span>Open-source creative tools</span></div>
   <Link className="av45-link" to="/status">See what's actually live →</Link>
  </section>
  <p className="av45-principle">No payment grants XP, medals, moderator permissions or special access. Earned recognition and verified public work stay independent of funding.</p>
 </div>;
}

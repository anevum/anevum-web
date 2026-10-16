import {Link} from 'react-router-dom';

const questions=[
 {
  title:'Is ANEVUM free if I do not subscribe?',
  answer:'Yes. The plan is to keep normal accounts, community participation, earned XP, levels and medals, discovery, and core creator publishing free. Supporter recognition is optional and cannot buy influence, earned achievements or ranking.'
 },
 {
  title:'What do monthly and annual founding supporters receive?',
  answer:'The proposed plans share the same cosmetic rewards: a supporter insignia, selectable portrait frames, wall atmospheres, and seals that unlock as verified membership time accrues. The reward studio can preview the designs, but no real-money subscriptions are available yet.'
 },
 {
  title:'Does paying yearly unlock the one-year badge immediately?',
  answer:'No. The proposed $36 annual and $5 monthly options have the same reward schedule: day 0, day 90, day 180, and day 365 of a verified qualifying subscription. Upfront payment does not accelerate milestones.'
 },
 {
  title:'Can I keep my supporter cosmetics after canceling?',
  answer:'Paid cosmetic display depends on a current qualifying subscription. Cancellation at the end of a paid period is planned, subject to verified billing settings; paid cosmetics become inactive when membership ends. Earned level artifacts and achievements remain yours.'
 },
 {
  title:'How will I manage renewal, cancellation and refunds?',
  answer:'ANEVUM plans to use Stripe-hosted subscription checkout and a billing-management portal. Recurring payment details, taxes, cancellation timing, refund terms, and support contact must be approved, tested, and disclosed before any real-money enrollment. The portal is not currently open for live billing.'
 },
 {
  title:'What will supporter payments actually fund?',
  answer:'The priority is keeping independent infrastructure reliable: verified hosting and storage expenses, security, backups, content delivery and creator tools. Proposed expansion goals are shown separately; ANEVUM will not claim a goal is funded or a feature guaranteed until its costs and allocation have been approved.'
 },
 {
  title:'Why are some infrastructure and funding meters blank?',
  answer:'There is not yet a reconciled public invoice and Stripe settlement ledger or an approved funding goal. An unknown expense is not zero. Small staging communities also have their member and image activity withheld for privacy; other measurements are historical provider snapshots, not live capacity.'
 },
 {
  title:'Will ANEVUM sell advertising or supporter visibility?',
  answer:'The design deliberately avoids intrusive advertising and purchased XP, medal awards, creator ranking, feed reach and moderation privileges. Optional cosmetic identity is separate from earned reputation.'
 },
 {
  title:'Is this a donation, investment or virtual currency?',
  answer:'No. The proposed Founding Supporter is a commercial subscription for optional cosmetic benefits. It is not a charitable donation, bank deposit, investment, financial return, ANEVUM currency purchase or entitlement to company ownership.'
 },
 {
  title:'Will my membership or payment information be public?',
  answer:'Public supporter recognition will be off by default. Members can opt into showing their active supporter seal and profile treatment. Raw invoices, card details, Stripe customer identifiers and individual payment records do not belong in public profile or financial transparency data.'
 }
] as const;

/** Static, copy-reviewed answers only: never infer a paid service is live. */
export function SupporterQuestions(){
 return <section className="av41-faq" id="supporter-questions" aria-labelledby="av41-faq-title">
  <div className="av41-faq-head">
   <div><span className="av32-index">ANEVUM / TERMS OF BELONGING / 005</span>
    <h2 id="av41-faq-title">Questions before <em>commitment.</em></h2>
    <p>Supporting an independent platform should never require guessing what you are paying for, what you can keep, or how the money will be used.</p>
   </div>
   <div className="av41-faq-mark" aria-hidden="true"><span>?</span><small>OPEN DOCUMENTATION</small></div>
  </div>
  <div className="av41-faq-list">
   {questions.map((q,index)=><details key={q.title} className="av41-faq-item">
    <summary>
     <span className="av41-faq-number">{String(index+1).padStart(2,'0')}</span>
     <strong>{q.title}</strong>
     <span className="av41-faq-toggle" aria-hidden="true">+</span>
    </summary>
    <div className="av41-faq-answer"><p>{q.answer}</p></div>
   </details>)}
  </div>
  <div className="av41-faq-footer">
   <p>Founding Supporter is a pre-launch proposal. Real prices, renewals, tax and refund terms must be finalized before enrollment opens. Supporters will never be required to purchase XP or earned awards.</p>
   <Link to="/join">JOIN ANEVUM WITHOUT A SUBSCRIPTION <span aria-hidden="true">↗</span></Link>
  </div>
 </section>;
}

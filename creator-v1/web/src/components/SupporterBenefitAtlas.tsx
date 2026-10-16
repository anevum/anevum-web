import {useState} from 'react';
import type {SupporterAppearance} from '../lib/canonical-beta';
import {OrbitalMark} from './OrbitalMark';
import {SupporterSeal} from './SupporterSeal';

type Seal=SupporterAppearance['seal'];
type Stage={seal:Seal;label:string;day:number;designation:string;description:string;material:string};
const STAGES:readonly Stage[]=[
 {seal:'signal',label:'First Signal',day:0,designation:'THE INITIAL ORBIT',
  description:'The starting insignia: a visible thank-you that recognizes support, not earned achievement.',
  material:'Roseglass / polished alloy'},
 {seal:'orbit',label:'Established Orbit',day:90,designation:'THE CONTINUING SIGNAL',
  description:'A second collectible mark reflecting ninety completed days of a verified subscription.',
  material:'Iridescent violet / silver'},
 {seal:'constellation',label:'Constellation',day:180,designation:'THE WIDENING FIELD',
  description:'A third seal reflecting one hundred eighty completed days of continued support.',
  material:'Luminous blue / cold alloy'},
 {seal:'continuance',label:'Continuance',day:365,designation:'THE ENDURING MARK',
  description:'An additional cosmetic designation after a full year in a qualifying current subscription.',
  material:'Pale gold / ivory glass'}
] as const;

const SERVICES=[
 {number:'01',count:'04',title:'Milestone seals',detail:'An evolving supporter insignia, separate from XP, level artifacts and medals.',foot:'0 / 90 / 180 / 365 DAYS'},
 {number:'02',count:'05',title:'Portrait materials',detail:'Profile picture frames with distinct lighting, contours and orbital details.',foot:'THREE BASE / TWO MILESTONES'},
 {number:'03',count:'05',title:'Wall atmospheres',detail:'Decorative banner treatments for your personal wall, with reduced-motion support.',foot:'THREE BASE / TWO MILESTONES'}
] as const;

/**
 * Public design preview only. This component NEVER fetches a payment state,
 * writes an entitlement or claims the displayed seal is owned by the visitor.
 * Member selections are stored separately through SupporterRewardsStudio.
 */
export function SupporterBenefitAtlas(){
 const [selected,setSelected]=useState<Seal>('signal');
 const item=STAGES.find(stage=>stage.seal===selected)??STAGES[0];
 return <section className="av41-benefits" id="supporter-benefits" aria-labelledby="av41-benefit-title">
  <div className="av41-benefit-heading">
   <div><span className="av32-index">ANEVUM / SUPPORTER DESIGN SYSTEM / 003</span>
    <h2 id="av41-benefit-title">A sign of <em>belonging.</em><br/>Not a bought achievement.</h2>
    <p>Explore the planned founding collection. These visual treatments are proposed membership benefits for the supporter program—not XP rewards, purchasable medals, creator rankings or voting power.</p>
   </div>
   <div className="av41-orbit-stamp" aria-hidden="true"><OrbitalMark/><span>EST. 2027</span></div>
  </div>
  <div className="av41-benefit-display">
   <div className={'av41-specimen av41-specimen-'+selected}>
    <div className="av41-specimen-orbit" aria-hidden="true"><div/><div/><div/></div>
    <span className="av41-specimen-index">ANEVUM / COLLECTIBLE #{String(STAGES.findIndex(x=>x.seal===selected)+1).padStart(2,'0')}</span>
    <div className="av41-specimen-seal"><SupporterSeal seal={selected}/></div>
    <span className="av41-specimen-watermark" aria-hidden="true">{String(item.day).padStart(3,'0')}</span>
    <div className="av41-specimen-footer"><span>{item.designation}</span><span>ILLUSTRATIVE COSMETIC</span></div>
   </div>
   <div className="av41-specimen-notes">
    <div className="av41-specimen-eyebrow"><span className="av32-index">THE SUPPORTER ATLAS</span><strong>DESIGN PREVIEW / NOT EQUIPPED</strong></div>
    <h3>{item.label}<span> / {item.day===0?'AT ENROLLMENT':'DAY '+item.day}</span></h3>
    <p>{item.description}</p>
    <div className="av41-specimen-metadata"><span>DESIGN FINISH</span><strong>{item.material}</strong></div>
    <div className="av41-specimen-metadata"><span>UNLOCK RULE</span><strong>{item.day===0?'Verified eligible membership':'Verified membership age of '+item.day+' days'}</strong></div>
    <div className="av41-tier-label">EXAMINE ANOTHER MILESTONE</div>
    <div className="av41-tier-switch" role="group" aria-label="Preview supporter seal milestones">
     {STAGES.map(stage=><button type="button" key={stage.seal}
       aria-pressed={selected===stage.seal} onClick={()=>setSelected(stage.seal)}>
       <span>DAY {String(stage.day).padStart(3,'0')}</span><strong>{stage.label}</strong>
      </button>)}
    </div>
    <p className="av41-tier-note">Previewing a seal does not unlock or purchase it. The source design is complete; public enrollment and payment activation remain closed.</p>
   </div>
  </div>
  <div className="av41-benefit-list" aria-label="Designed supporter cosmetic families">
   {SERVICES.map(feature=><article className="av41-benefit-asset" key={feature.number}>
    <div className="av41-benefit-asset-top"><span>{feature.number} / COSMETIC FAMILY</span><strong>{feature.count}</strong></div>
    <h3>{feature.title}</h3><p>{feature.detail}</p><small>{feature.foot}</small>
   </article>)}
  </div>
  <div className="av41-benefit-principles">
   <div><strong>Same rewards for both plans</strong><span>Annual and monthly memberships follow the same elapsed-time schedule. Paying annually does not skip milestones.</span></div>
   <div><strong>Your earned identity stays yours</strong><span>Earned levels, artifacts, medals and free community access are independent of supporter status.</span></div>
   <a href="#supporter-studio" className="av41-benefit-action">EXPLORE THE COSMETIC STUDIO <span aria-hidden="true">↗</span></a>
  </div>
 </section>;
}

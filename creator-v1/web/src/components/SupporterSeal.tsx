import type {SupporterAppearance} from '../lib/canonical-beta';
import {OrbitalMark} from './OrbitalMark';

export const SUPPORTER_SEAL_NAMES:Record<SupporterAppearance['seal'],string>={
  signal:'First Signal',orbit:'Established Orbit',constellation:'Constellation',continuance:'Continuance'
};
export const SUPPORTER_FRAME_NAMES:Record<SupporterAppearance['frame'],string>={
  orbital:'Orbital Alloy',rose:'Roseglass',lumen:'Lumen',stellar:'Stellar Crown',continuance:'Continuance Halo'
};
export const SUPPORTER_AURA_NAMES:Record<SupporterAppearance['aura'],string>={
  aurora:'Aurora',eclipse:'Eclipse',ember:'Ember',nebula:'Nebula',transcosmic:'Transcosmic'
};
export function SupporterSeal({seal='signal',compact=false}:{
  seal?:SupporterAppearance['seal'];compact?:boolean
}){
  return <span className={'av34-seal av34-seal-'+seal+(compact?' av34-seal-compact':'')} role="img"
    aria-label={'Supporter seal: '+SUPPORTER_SEAL_NAMES[seal]}>
    <span className="av34-seal-ring" aria-hidden="true"/>
    <OrbitalMark/>
    <span className="av34-seal-star" aria-hidden="true">✧</span>
  </span>;
}
export function SupporterIdentity({appearance,compact=false}:{
  appearance:SupporterAppearance;compact?:boolean
}){
  return <span className={'av34-identity'+(compact?' av34-identity-compact':'')}>
    <SupporterSeal seal={appearance.seal} compact={compact}/>
    <span><strong>{SUPPORTER_SEAL_NAMES[appearance.seal]}</strong><small>ANEVUM SUPPORTER</small></span>
  </span>;
}

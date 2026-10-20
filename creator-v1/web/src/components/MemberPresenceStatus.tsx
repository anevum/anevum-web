import {RoleInsignia} from './RoleInsignia';
import {
 describePlayerAura,REPUTATION_LABELS,ROLE_LABELS,
 safePlayerAura,safePublicReputation,safeVerifiedRole,
 type PlayerAura,type VerifiedRole,type PublicReputation
} from '../lib/player-recognition';
import '../member-presence-v092.css';

/** Profile presentation only: server-verified roles and reputation,
 * independently chosen cosmetic atmosphere. Never an authorization control.
 */
export function MemberPresenceStatus({
 aura,role,reputation
}:{aura?:PlayerAura;role?:VerifiedRole;reputation?:PublicReputation}){
 const affinity=describePlayerAura(safePlayerAura(aura));
 const verified=safeVerifiedRole(role);
 const earned=safePublicReputation(reputation);
 return <div className="av92-presence-status" aria-label="Member identity and recognition">
  <span className="av92-presence-rank"
   title={verified?'Verified ANEVUM '+ROLE_LABELS[verified]+' role':'Continuance member; no verified staff role shown'}>
   {verified?<RoleInsignia role={verified}/>:<span className="av92-presence-rank-dot" aria-hidden="true"/>}
   {verified?ROLE_LABELS[verified]:'Member'}
  </span>
  {affinity.id!=='none'&&<span className="av92-presence-aura"
   title={affinity.meaning} aria-label={'Personal aura: '+affinity.name}>
   {affinity.name} aura
  </span>}
  {earned&&<span className="av92-presence-reputation"
   title={'Contribution-earned '+REPUTATION_LABELS[earned.tier]+' reputation tier'}>
   <strong>{earned.score.toLocaleString()}</strong> REP · {REPUTATION_LABELS[earned.tier]}
  </span>}
 </div>;
}

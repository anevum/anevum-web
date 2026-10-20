import {RoleInsignia} from './RoleInsignia';
import {LevelEmblem} from './LevelEmblem';
import {BadgeInsignia} from './BadgeInsignia';
import {
 describePlayerAura,REPUTATION_LABELS,ROLE_LABELS,BADGE_CATALOG,selectFeaturedBadges,
 safePlayerAura,safePublicReputation,safeVerifiedRole,
 type PlayerAura,type VerifiedRole,type PublicReputation,type EarnedBadge,type BadgeDisplay
} from '../lib/player-recognition';
import '../member-presence-v092.css';

/** Profile presentation only: server-verified roles and reputation,
 * independently chosen cosmetic atmosphere. Never an authorization control.
 */
export function MemberPresenceStatus({
 aura,role,reputation,level,featuredAwards,earnedBadges,badgeDisplay
}:{aura?:PlayerAura;role?:VerifiedRole;reputation?:PublicReputation;
  level?:number|null;featuredAwards?:string[];earnedBadges?:EarnedBadge[];badgeDisplay?:BadgeDisplay}){
 const affinity=describePlayerAura(safePlayerAura(aura));
 const verified=safeVerifiedRole(role);
 const earned=safePublicReputation(reputation);
 const safeLevel=typeof level==='number'&&Number.isSafeInteger(level)&&level>=1&&level<=30?level:null;
 const badges=selectFeaturedBadges(featuredAwards||[],earnedBadges,badgeDisplay);
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
  {safeLevel!==null&&<span className="av92-presence-level" title={'Earned Evolution level '+safeLevel}>
   <LevelEmblem level={safeLevel} size={25} artwork="card"/>
   LVL {String(safeLevel).padStart(2,'0')}
  </span>}
  {badges.length>0&&<span className="av92-presence-marks" aria-label="Featured earned badges">
   {badges.map(id=><span key={id} title={BADGE_CATALOG[id]?.name||id}>
    <BadgeInsignia badge={id} size="tiny" state="earned"/>
   </span>)}
  </span>}
  {earned&&<span className="av92-presence-reputation"
   title={'Contribution-earned '+REPUTATION_LABELS[earned.tier]+' reputation tier'}>
   <strong>{earned.score.toLocaleString()}</strong> REP · {REPUTATION_LABELS[earned.tier]}
  </span>}
 </div>;
}

import {Link} from 'react-router-dom';
import {LevelEmblem} from './LevelEmblem';
import {BadgeInsignia} from './BadgeInsignia';
import {HonorInsignia} from './HonorInsignia';
import {MemberPortrait} from './MemberPortrait';
import {RoleInsignia} from './RoleInsignia';
import {SupporterIdentity} from './SupporterSeal';
import type {SupporterAppearance,SpaceStats} from '../lib/canonical-beta';
import {
 BADGE_CATALOG,selectFeaturedBadges,selectedDistinctions,safePlayerAura,safeConstellation,
 safePublicReputation,safeVerifiedRole,ROLE_LABELS,REPUTATION_LABELS,creditedContributionCount,
 type EarnedBadge,type BadgeDisplay,type PublicDistinctions,type PlayerAura,type ConstellationIdentity,
 type VerifiedRole,type PublicReputation,type ReputationTier
} from '../lib/player-recognition';
import './member-identity-v061.css';
import './player-card-v065.css';
import './player-card-premium-v078.css';
import './player-card-v081.css';

/**
 * Universal player identity, v065.
 * Use in forums, threads, replies, creator/project credits, directory and walls.
 * No award, level, aura, flag or medal is inferred from public writing or account
 * age. Members receive only the verified/visible records passed by the API.
 * The shared LevelEmblem requests private, front-facing Evolution card plates;
 * the moving miniature WebGL overlay is retired from every player card.
 */
export type PublicIdentity={
 handle:string;
 displayName:string;
 avatar:boolean;
 level:number|null;
 featuredAwards:string[];
 source?:'canonical-member'|'creator-channel';
 // New public API fields; optional so existing V061 responses remain compatible.
 earnedBadges?:EarnedBadge[];
 badgeDisplay?:BadgeDisplay;
 distinctions?:PublicDistinctions;
 aura?:PlayerAura;
 constellation?:ConstellationIdentity;
 supporterAppearance?:SupporterAppearance;
 /** Strictly server-derived. Independent of preferred cosmetic aura and XP. */
 role?:VerifiedRole;
 reputation?:PublicReputation;
 earnedAura?:ReputationTier;
 /** The canonical server may supply a current, visible earned level label and XP. */
 progress?:Pick<SpaceStats,'level'|'xp'|'levelStart'|'nextLevel'|'artifact'>;
};
export type PlayerCardSize='inline'|'compact'|'standard'|'featured';
const cleanName=(id:string)=>id.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
export function CompactMemberIdentity({member,href,className='',size='standard',interactive=true}:{
 member:PublicIdentity;href?:string;className?:string;size?:PlayerCardSize;interactive?:boolean
}){
 const channel=member.source==='creator-channel';
 const level=!channel&&typeof member.level==='number'&&Number.isSafeInteger(member.level)&&member.level>=1&&member.level<=30?member.level:null;
 const specimen=level!==null;
 const badges=channel?[]:selectFeaturedBadges(member.featuredAwards||[],member.earnedBadges,member.badgeDisplay);
 const {medal,ribbons}=selectedDistinctions(channel?undefined:member.distinctions);
 const aura=safePlayerAura(channel?'none':member.aura);
 const constellation=safeConstellation(channel?undefined:member.constellation);
 const role=channel?null:safeVerifiedRole(member.role);
 const reputation=channel?null:safePublicReputation(member.reputation);
 // Effective earned treatment is derived from the verified score, never from
 // a user-submitted appearance choice or an unverified creator channel.
 const earnedAura:ReputationTier=reputation?.tier??'none';
 const url=href||'/@'+encodeURIComponent(member.handle);
 const label=[
  member.displayName+' @'+member.handle+(channel?' · Creator channel, not linked to a canonical member identity':''),
  level!==null?'Evolution level '+level:'',
  badges.length?badges.length+' earned badges: '+badges.map(id=>BADGE_CATALOG[id]?.name||cleanName(id)).join(', '):'',
  medal?'Medal: '+medal.name:'',
  ribbons.length?'Ribbons: '+ribbons.map(r=>r.name).join(', '):'',
  constellation?'Constellation: '+constellation.name:'',
  role?'Verified role: '+ROLE_LABELS[role]:'',
  reputation?'Reputation: '+reputation.score+', '+REPUTATION_LABELS[earnedAura]+' tier':''
 ].filter(Boolean).join(' · ');
 // A featured card can show real progress only when the caller explicitly
 // provides the visibility-approved canonical member stats. No sample XP.
 const progress=specimen&&size==='featured'&&member.progress&&
  member.progress.level===level&&
  Number.isSafeInteger(member.progress.xp)&&member.progress.xp>=0&&
  Number.isSafeInteger(member.progress.levelStart)&&member.progress.levelStart>=0&&
  member.progress.xp>=member.progress.levelStart&&
  ((level===30&&member.progress.nextLevel===null)||
   (level!==30&&typeof member.progress.nextLevel==='number'&&
    Number.isSafeInteger(member.progress.nextLevel)&&member.progress.nextLevel>member.progress.xp))?
  member.progress:null;
 const maximum=progress?.nextLevel===null?1:progress?progress.nextLevel!-progress.levelStart:1;
 const amount=progress?.nextLevel===null?1:progress?Math.max(0,Math.min(maximum,progress.xp-progress.levelStart)):0;
 const levelTitle=progress&&typeof progress.artifact==='string'&&progress.artifact.length<=96&&progress.artifact.trim()?progress.artifact:null;
 const artworkHandle=href==='/member'?null:member.handle;
 const classNames='av61-identity av61-identity--'+size+' av65-player-card av65-player-card--'+size+
 ' av78-player-card av81-player-card av65-aura--'+aura+
 ' av81-role--'+(role??'none')+' av81-earned--'+earnedAura+
 (channel?' av65-player-card--channel':'')+(className?' '+className:'');
 const face=<>
  {aura!=='none'&&<span className="av65-aura-field" aria-hidden="true"/>}
  {(role||earnedAura!=='none')&&<span className="av81-corona" aria-hidden="true"/>}
  {size==='featured'&&specimen&&<span className="av78-featured-art" aria-hidden="true">
   <LevelEmblem level={level!} artwork="card" size={184} handle={artworkHandle}/>
  </span>}
  <span className="av61-portrait-zone">
   <span className="av61-photo"><MemberPortrait name={member.displayName}
    src={!channel&&member.avatar?(href==='/member'?'/api/v1/member/media/avatar':'/api/v1/members/'+encodeURIComponent(member.handle)+'/media/avatar'):undefined}
    supporterFrame={member.supporterAppearance?.frame}/></span>
   {specimen&&<span className="av61-specimen" title={'Earned Evolution Level '+level}>
    <LevelEmblem level={level!} artwork="card" size={size==='inline'?30:size==='compact'?38:size==='featured'?60:44} handle={artworkHandle}/>
   </span>}
  </span>
  <span className="av61-member-copy">
   {size==='featured'&&<span className="av78-member-kicker">{channel?'CREATOR CHANNEL':'CONTINUANCE INSTITUTE / PLAYER IDENTITY'}</span>}
   <span className="av65-name-line"><strong className="av61-member-name">{member.displayName}</strong>
    {constellation&&<span className="av65-constellation-flag" title={'Constellation · '+constellation.name} aria-label={'Constellation · '+constellation.name}>
      <svg viewBox="0 0 26 26" aria-hidden="true" focusable="false">
       <path d="M5 3h16v16l-8 5-8-5Z" fill="#242037" stroke="#bdaccd" strokeWidth="1.5"/>
       <path d="m13 5 2.3 5.7L21 13l-5.7 2.3L13 21l-2.3-5.7L5 13l5.7-2.3Z" fill="#f0bdd0"/>
       <circle cx="13" cy="13" r="2" fill="#faf0da"/>
      </svg>
    </span>}
   </span>
   <small className="av61-member-handle">@{member.handle}</small>
   {(role||reputation)&&<span className="av81-standing" aria-label="Verified status">
    {role&&<span className="av81-role-token" title={'Verified ANEVUM '+ROLE_LABELS[role]+' role'}><RoleInsignia role={role}/>{ROLE_LABELS[role]}</span>}
    {reputation&&<span className="av81-reputation-token" title={'Reputation is based on approved community activity · '+REPUTATION_LABELS[earnedAura]}>
     <span aria-hidden="true">✦</span> {reputation.score.toLocaleString()} REP
    </span>}
    {reputation&&earnedAura!=='none'&&<span className="av81-earned-token" title="Activity-earned aura">
      {REPUTATION_LABELS[earnedAura]} aura</span>}
   </span>}
   {reputation&&size==='featured'&&<span className="av81-reputation-dossier" aria-label={'Verified reputation '+reputation.score}>
    <span className="av81-reputation-line"><strong>CONTRIBUTION SIGNAL</strong>
     <small>{reputation.nextAt===null?'HIGHEST AURA EARNED':(reputation.nextAt-reputation.score).toLocaleString()+' TO '+
      (reputation.nextAt===40?'SIGNAL':reputation.nextAt===160?'ORBIT':reputation.nextAt===420?'NOVA':'ZENITH')}</small></span>
    <progress value={reputation.nextAt===null?1:reputation.score} max={reputation.nextAt??1}
     aria-label="Reputation progress to next earned aura"/>
    <span className="av81-contribution-stats">
     <span><b>{creditedContributionCount(reputation.stats.discussions,'discussions')}</b> THREADS</span>
     <span><b>{creditedContributionCount(reputation.stats.replies,'replies')}</b> REPLIES</span>
     <span><b>{creditedContributionCount(reputation.stats.appreciations,'appreciations')}</b> PEERS</span>
     <span><b>{creditedContributionCount(reputation.stats.badges,'badges')}</b> MARKS</span>
    </span>
   </span>}
   {progress&&<span className="av78-player-progress">
    <span className="av78-progress-caption"><strong>{progress.xp.toLocaleString()} XP</strong>
     <small>{progress.nextLevel===null?'MAX LEVEL REACHED':Math.max(0,progress.nextLevel-progress.xp).toLocaleString()+' XP TO NEXT LEVEL'}</small></span>
    <progress value={amount} max={maximum} aria-label="Verified XP toward next earned Evolution level"/>
   </span>}
   <span className="av61-member-rewards">
    {channel&&<span className="av65-channel-label">CREATOR CHANNEL</span>}
    {specimen&&<span className="av61-level-label" title={'Earned evolution level '+level}>LVL {String(level).padStart(2,'0')} <span className="av61-specimen-name">{levelTitle?' · '+levelTitle:' · EARNED'}</span></span>}
    {badges.length>0&&<span className="av61-award-list av65-badge-rack" aria-label="Three selected or latest earned badges">
     {badges.map(id=>{
      const entry=BADGE_CATALOG[id];
      return <span key={id} title={entry?entry.name+' — '+entry.description:cleanName(id)}
       className={'av61-award av65-badge av65-badge--'+(entry?.family||'origin')}>
        <BadgeInsignia badge={id} size="tiny" state="earned" title={entry?.name||cleanName(id)}/>
       </span>;
     })}
    </span>}
    {medal&&<span className="av65-medal-slot" aria-label="Prestige medal"><HonorInsignia distinction={medal} compact={size==='compact'||size==='inline'}/></span>}
    {ribbons.length>0&&<span className="av65-ribbon-rack" aria-label="Earned distinctions: service ribbons">
      {ribbons.map(r=><HonorInsignia key={r.id} distinction={r} compact={size==='compact'||size==='inline'}/>)}
    </span>}
    {member.supporterAppearance&&<span className="av61-supporter" aria-label="Supporter appearance"><SupporterIdentity appearance={member.supporterAppearance} compact/></span>}
   </span>
  </span>
 </>;
 return interactive?<Link to={url} className={classNames} data-player-card="v078" aria-label={label}>{face}</Link>:
  <span className={classNames} data-player-card="v078" role="group" aria-label={label}>{face}</span>;
}
export const PlayerCard=CompactMemberIdentity;

import {Link} from 'react-router-dom';
import type {ForumAuthor} from '../lib/member-forums';
import {
 BADGE_CATALOG, ROLE_LABELS, REPUTATION_LABELS,
 creditedContributionCount, safePublicReputation, safeVerifiedRole,
 selectFeaturedBadges, selectedDistinctions, safeConstellation
} from '../lib/player-recognition';
import {CompactMemberIdentity} from './CompactMemberIdentity';
import './forum-author-dossier.css';

export type ForumAuthorVariant='stream'|'detail'|'reply'|'highlight';

/** Read only the author's already visibility-approved public forum projection.
 * This card performs no public/private profile fetch and grants no XP/roles.
 * A missing show-stats field must not become a fabricated level or score.
 */
export function ForumAuthorCard({author,variant='stream'}:{
 author:ForumAuthor;variant?:ForumAuthorVariant;
}){
 const handle=typeof author.handle==='string'&&/^[a-z][a-z0-9_]{2,29}$/.test(author.handle)?author.handle:null;
 const role=safeVerifiedRole(author.role);
 const reputation=safePublicReputation(author.reputation);
 const level=Number.isSafeInteger(author.level)&&author.level!==null&&author.level>=1&&author.level<=30?author.level:null;
 const badges=selectFeaturedBadges(author.featuredAwards||[],author.earnedBadges,author.badgeDisplay)
  .filter(id=>Object.hasOwn(BADGE_CATALOG,id)).slice(0,2);
 const earned=selectedDistinctions(author.distinctions);
 const constellation=safeConstellation(author.constellation);
 const showRecognition=badges.length>0||Boolean(earned.medal)||earned.ribbons.length>0;
 const publicWall=handle?'/@'+encodeURIComponent(handle):null;
 const displayName=typeof author.displayName==='string'&&author.displayName.trim()?author.displayName:'Community member';
 return <section className={'cf-author-dossier cf-author-dossier--'+variant} aria-label={'Public profile of '+displayName} data-forum-author-card="next">
  <div className="cf-author-dossier-top">
   <div className="cf-author-dossier-person">
    <span className="cf-author-dossier-kicker">{role?'VERIFIED '+ROLE_LABELS[role].toUpperCase():'ANEVUM / PUBLIC MEMBER'}</span>
    <CompactMemberIdentity member={author} className="cf-author" size="compact" interactive={false}/>
   </div>
   {publicWall&&<Link to={publicWall} className="cf-author-dossier-visit" aria-label={'View public member wall of '+displayName}>
    VIEW WALL <span aria-hidden="true">↗</span>
   </Link>}
  </div>
  {(level!==null||reputation||constellation||showRecognition)&&<div className="cf-author-dossier-signals" aria-label="Public member profile details">
   {level!==null&&<span className="cf-author-dossier-signal"><small>EVOLUTION</small><strong>LVL {String(level).padStart(2,'0')}</strong></span>}
   {reputation&&<span className="cf-author-dossier-signal cf-author-dossier-reputation">
    <small>EARNED REPUTATION</small><strong>{reputation.score.toLocaleString()} REP · {REPUTATION_LABELS[reputation.tier]}</strong>
   </span>}
   {constellation&&<span className="cf-author-dossier-signal cf-author-dossier-constellation">
    <small>PUBLIC CONSTELLATION</small><strong>{constellation.name}</strong>
   </span>}
   {showRecognition&&<div className="cf-author-dossier-awards" aria-label="Earned publicly visible recognition">
    {earned.medal&&<span className="cf-author-dossier-award" title={earned.medal.description}>{earned.medal.name}</span>}
    {badges.map(id=><span key={id} className="cf-author-dossier-award"
      title={BADGE_CATALOG[id].description}>{BADGE_CATALOG[id].name}</span>)}
    {earned.ribbons.slice(0,1).map(r=><span key={r.id} className="cf-author-dossier-award"
      title={r.description}>{r.name}</span>)}
   </div>}
  </div>}
  {reputation&&<details className="cf-author-dossier-details">
   <summary>CONTRIBUTION RECORD <span aria-hidden="true">⌄</span></summary>
   <div className="cf-author-dossier-activity" aria-label="Verified, capped community contribution counts">
    <span><strong>{creditedContributionCount(reputation.stats.discussions,'discussions')}</strong><small>THREADS</small></span>
    <span><strong>{creditedContributionCount(reputation.stats.replies,'replies')}</strong><small>REPLIES</small></span>
    <span><strong>{creditedContributionCount(reputation.stats.appreciations,'appreciations')}</strong><small>PEER SIGNALS</small></span>
    <span><strong>{creditedContributionCount(reputation.stats.badges,'badges')}</strong><small>EARNED MARKS</small></span>
   </div>
   <p>Verified from approved activity. Capped totals may display a +, not an exact lifetime count.</p>
  </details>}
 </section>;
}

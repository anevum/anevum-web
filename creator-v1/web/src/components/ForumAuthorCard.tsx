import {Link} from 'react-router-dom';
import type {ForumAuthor} from '../lib/member-forums';
import {
 BADGE_CATALOG, ROLE_LABELS, REPUTATION_LABELS,
 creditedContributionCount, safePublicReputation, safeVerifiedRole, safePlayerAura,
 selectFeaturedBadges, selectedDistinctions, safeConstellation, describePlayerAura
} from '../lib/player-recognition';
import {CompactMemberIdentity} from './CompactMemberIdentity';
import './forum-author-dossier.css';

export type ForumAuthorVariant='stream'|'detail'|'reply'|'highlight';

/** One compact identity strip, retaining the universal player's actual chosen
 * aura, avatar, earned specimen, badges, distinctions and public design. Data
 * arrives exclusively from the visibility-approved forum author projection:
 * no extra member reads, invented counters, cosmetic authority or XP grants. */
export function ForumAuthorCard({author,variant='stream'}:{
 author:ForumAuthor;variant?:ForumAuthorVariant;
}){
 const handle=typeof author.handle==='string'&&/^[a-z][a-z0-9_]{2,29}$/.test(author.handle)?author.handle:null;
 const role=safeVerifiedRole(author.role);
 const reputation=safePublicReputation(author.reputation);
 const level=Number.isSafeInteger(author.level)&&author.level!==null&&author.level>=1&&author.level<=30?author.level:null;
 const aura=safePlayerAura(author.aura);
 const badges=selectFeaturedBadges(author.featuredAwards||[],author.earnedBadges,author.badgeDisplay)
  .filter(id=>Object.hasOwn(BADGE_CATALOG,id)).slice(0,3);
 const earned=selectedDistinctions(author.distinctions);
 const constellation=safeConstellation(author.constellation);
 const showRecognition=badges.length>0||Boolean(earned.medal)||earned.ribbons.length>0;
 const hasDetails=level!==null||Boolean(reputation)||Boolean(role)||aura!=='none'||Boolean(constellation)||showRecognition;
 const publicWall=handle?'/@'+encodeURIComponent(handle):null;
 const displayName=typeof author.displayName==='string'&&author.displayName.trim()?author.displayName:'Community member';
 return <section className={'cf-author-dossier cf-author-dossier--'+variant+
  (hasDetails?'':' cf-author-dossier--no-details')+(publicWall?'':' cf-author-dossier--no-wall')}
  data-aura={aura} aria-label={'Public profile of '+displayName} data-forum-author-card="next">
  <CompactMemberIdentity member={author} className="cf-author" size="compact" interactive={false}/>
  {publicWall&&<Link to={publicWall} className="cf-author-dossier-visit"
    title={'View the public member wall of '+displayName}
    aria-label={'View public member wall of '+displayName}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12h14m-6-6 6 6-6 6"/>
    </svg>
  </Link>}
  {hasDetails&&<details className="cf-author-dossier-details">
    <summary aria-label={'Public profile details for '+displayName}
      title="Public profile details">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
       <circle cx="5" cy="12" r="1.25"/><circle cx="12" cy="12" r="1.25"/><circle cx="19" cy="12" r="1.25"/>
      </svg>
    </summary>
    <div className="cf-author-dossier-expanded">
      <span className="cf-author-dossier-heading">PUBLIC IDENTITY <span aria-hidden="true">/</span> VERIFIED DETAILS</span>
      <div className="cf-author-dossier-facts">
        {level!==null&&<span><small>EVOLUTION</small><strong>Level {String(level).padStart(2,'0')}</strong></span>}
        {reputation&&<span><small>REPUTATION</small><strong>{reputation.score.toLocaleString()} · {REPUTATION_LABELS[reputation.tier]}</strong></span>}
        {role&&<span><small>VERIFIED ROLE</small><strong>{ROLE_LABELS[role]}</strong></span>}
        {aura!=='none'&&<span><small>CHOSEN AURA</small><strong>{describePlayerAura(aura).name}</strong></span>}
        {constellation&&<span><small>CONSTELLATION</small><strong>{constellation.name}</strong></span>}
      </div>
      {showRecognition&&<div className="cf-author-dossier-awards" aria-label="Earned publicly visible recognition">
        {earned.medal&&<span className="cf-author-dossier-award" title={earned.medal.description}>{earned.medal.name}</span>}
        {badges.map(id=><span key={id} className="cf-author-dossier-award"
          title={BADGE_CATALOG[id].description}>{BADGE_CATALOG[id].name}</span>)}
        {earned.ribbons.map(r=><span key={r.id} className="cf-author-dossier-award"
          title={r.description}>{r.name}</span>)}
      </div>}
      {reputation&&<>
        <div className="cf-author-dossier-activity" aria-label="Verified, capped community contribution counts">
          <span><strong>{creditedContributionCount(reputation.stats.discussions,'discussions')}</strong><small>THREADS</small></span>
          <span><strong>{creditedContributionCount(reputation.stats.replies,'replies')}</strong><small>REPLIES</small></span>
          <span><strong>{creditedContributionCount(reputation.stats.appreciations,'appreciations')}</strong><small>PEERS</small></span>
          <span><strong>{creditedContributionCount(reputation.stats.badges,'badges')}</strong><small>MARKS</small></span>
        </div>
        <small className="cf-author-dossier-caption">Approved contributions only. Capped counts display +; not lifetime totals.</small>
      </>}
    </div>
  </details>}
 </section>;
}

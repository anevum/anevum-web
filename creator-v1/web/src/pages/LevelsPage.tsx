import {Link} from 'react-router-dom';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {useMemberProgression} from '../components/AnevumNotifications';
import {EarnedRewardVault} from '../components/EarnedRewardVault';
import {LevelEmblem} from '../components/LevelEmblem';
import {MemberCollectionNav,MEMBER_COLLECTION_NAV_REVIEW} from '../components/MemberCollectionNav';

/** No public specimen gallery, previews or unearned names. Your own
 * authenticated progression determines every visible image and model. */
export function LevelsPage(){
 const {data:session}=canonicalAuthClient.useSession();
 const {progression:p}=useMemberProgression();
 const signedIn=Boolean(session?.user?.id&&session.user.emailVerified);
 const level=signedIn?p?.level??null:null;
 const earnedFounding=p?.awards.filter(a=>a.earnedAt!==null).map(a=>a.id)??[];
 const pct=p?(p.nextLevel===null?100:
  Math.min(100,Math.max(0,Math.round(100*(p.xp-p.levelStart)/(p.nextLevel-p.levelStart))))):0;
 return <section className={"av75-levels-page"+(MEMBER_COLLECTION_NAV_REVIEW?" mc-collection-page":"")} aria-labelledby="av75-levels-heading">
  {signedIn&&<MemberCollectionNav current="levels"/>}
  <header className="av75-page-heading">
   <span>CONTINUANCE INSTITUTE / EVOLUTION</span>
   <h1 id="av75-levels-heading">Your evolution.</h1>
   <p>{MEMBER_COLLECTION_NAV_REVIEW?"View your verified level and the specimens you have earned. Future discoveries stay hidden.":"The universe unfolds through what you earn. Future specimens remain unknown until your progress reaches them. There is no public gallery or shortcut to the unreached forms."}</p>
   <div className="av75-page-actions"><Link to="/member?tab=awards">{MEMBER_COLLECTION_NAV_REVIEW?"Player card ↗":"My awards & player card ↗"}</Link>{!MEMBER_COLLECTION_NAV_REVIEW&&<Link to="/recognition">Earned recognition ↗</Link>}</div>
  </header>
  {!signedIn?<section className="av75-vault-empty">
   <strong>Your progression is private until you sign in.</strong>
   <p>Earn levels and authentic recognition through your own participation. There are no sample models or unearned rewards to browse.</p>
   <Link to="/join">Join or sign in ↗</Link>
  </section>:!p?<p role="status" className="av75-vault-empty">Verifying your earned progress. No locked artwork is shown.</p>:
  <section className="av75-current-level" aria-label="Your verified current evolution level">
   <LevelEmblem level={p.level} size={98}/>
   <div><span>CURRENT EVOLUTION / VERIFIED</span><h2>Level {p.level}</h2>
    <p>{p.artifact}</p>
    <progress max={100} value={pct} aria-label={p.nextLevel===null?'Final level achieved':'XP progress toward next level'}/>
    <small>{p.xp.toLocaleString()} XP · {p.nextLevel===null?'Final level reached':(p.nextLevel-p.xp).toLocaleString()+' XP until the next undisclosed discovery'}</small>
   </div>
  </section>}
  {signedIn&&p&&<EarnedRewardVault key={session?.user?.id} level={level} fallbackBadges={earnedFounding} title="Your earned discoveries" showHonors={!MEMBER_COLLECTION_NAV_REVIEW}/>}
  <footer className="av75-vault-principles">All levels and badges are earned, never purchased. XP and recognition come from verified server records. Levels do not grant moderation authority.</footer>
 </section>;
}

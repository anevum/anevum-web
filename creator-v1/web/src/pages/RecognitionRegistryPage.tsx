import {Link} from 'react-router-dom';
import {canonicalAuthClient} from '../lib/canonical-beta';
import {useMemberProgression} from '../components/AnevumNotifications';
import {EarnedRewardVault} from '../components/EarnedRewardVault';
import {MemberCollectionNav,MEMBER_COLLECTION_NAV_REVIEW} from '../components/MemberCollectionNav';

/** A private verified inventory, not an open catalogue of surprise artwork.
 * Public profiles use their own server-curated featured recognition instead. */
export function RecognitionRegistryPage(){
 const {data:session}=canonicalAuthClient.useSession();
 const {progression:p}=useMemberProgression();
 const signedIn=Boolean(session?.user?.id&&session.user.emailVerified);
 const earnedFounding=p?.awards.filter(award=>award.earnedAt!==null).map(award=>award.id)??[];
 return <section className={"av75-levels-page av75-recognition-page"+(MEMBER_COLLECTION_NAV_REVIEW?" mc-collection-page":"")} aria-labelledby="av75-recognition-heading">
  {signedIn&&<MemberCollectionNav current="awards"/>}
  <header className="av75-page-heading">
   <span>CONTINUANCE INSTITUTE / RECOGNITION</span>
   <h1 id="av75-recognition-heading">Marks of your journey.</h1>
   <p>{MEMBER_COLLECTION_NAV_REVIEW?"Your verified badges, ribbons and medals, in one earned-only collection.":"Badges, service ribbons and prestige medals become visible when they are earned and verified. Unreached designs and their descriptions are not published in a public cabinet."}</p>
   <div className="av75-page-actions"><Link to="/levels">My evolution ↗</Link><Link to="/member?tab=awards">Edit my player card ↗</Link></div>
  </header>
  {!signedIn?<section className="av75-vault-empty">
    <strong>Your earned record is available after sign-in.</strong>
    <p>There are no sample medals or unlocked achievements here to spoil upcoming discoveries.</p>
    <Link to="/join">Join or sign in ↗</Link>
   </section>:
   <EarnedRewardVault key={session?.user?.id} level={null} showLevels={false} fallbackBadges={earnedFounding} title="Your awarded insignia"/>}
  <footer className="av75-vault-principles">A displayed mark must come from an earned record. Prestige honors require independent review; neither recognition nor level grants staff authority.</footer>
 </section>;
}

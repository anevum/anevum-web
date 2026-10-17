import { Link } from 'react-router-dom';
import { canonicalAuthClient } from '../lib/canonical-beta';
import { SupporterRewardsStudio } from '../components/SupporterRewardsStudio';

/** Existing private cosmetic selectors are still available without crowding /support. */
export default function SupporterCollectionPage() {
  const { data: session } = canonicalAuthClient.useSession();
  const memberId = session?.user?.emailVerified === true ? session.user.id : null;
  return <main className="av32-support av45-details" aria-label="Supporter collectibles">
    <nav className="av45-detail-nav" aria-label="Back to supporter membership">
      <Link to="/support">← Back to support</Link>
    </nav>
    <SupporterRewardsStudio memberId={memberId}/>
    {!memberId && <p className="av45-collection-note">
      Collectibles are cosmetic previews. Verified supporters will be able to choose unlocked items when the membership program opens.
    </p>}
  </main>;
}

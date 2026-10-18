import { Link } from 'react-router-dom';
import { SupporterRewardsStudio } from '../components/SupporterRewardsStudio';

/** Existing private cosmetic selectors are still available without crowding /support. */
export default function SupporterCollectionPage() {
  return <div className="av32-support av45-details" aria-label="Supporter collectibles">
    <nav className="av45-detail-nav" aria-label="Back to supporter membership">
      <Link to="/support">← Back to support</Link>
    </nav>
    <SupporterRewardsStudio memberId={null}/>
    <p className="av45-collection-note" role="status">
      Paid supporter enrollment and collectible unlocks are paused while ANEVUM transitions payment providers. These previews do not affect earned XP, levels, medals or badges.
    </p>
  </div>;
}

import { Link } from 'react-router-dom';
import { SupporterTransparency } from '../components/SupporterTransparency';

/** In-depth evidence lives separately from the short public membership offer. */
export default function SupporterTransparencyPage() {
  return <main className="av32-support av45-details" aria-label="Supporter transparency">
    <nav className="av45-detail-nav" aria-label="Back to supporter membership">
      <Link to="/support">← Back to support</Link>
    </nav>
    <SupporterTransparency/>
  </main>;
}

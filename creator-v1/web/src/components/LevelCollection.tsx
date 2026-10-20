import {EarnedRewardVault} from './EarnedRewardVault';
import {useMemberProgression} from './AnevumNotifications';

/** Thirty existing earned levels, but no unlocked public gallery.
 * All names and emblems are returned by the entitlement-checked inventory.
 */
export function LevelCollection(){
 const {progression}=useMemberProgression();
 return <section className="an-series an-series-v081" aria-labelledby="an-series-heading">
  <header className="an-series-intro">
   <div><span className="kicker">CONTINUANCE INSTITUTE / EVOLUTION OF EVERYTHING</span>
    <h2 id="an-series-heading">Thirty levels. Your earned emblems.</h2>
    <p>Every earned stage receives a distinct high-definition insignia. The next design stays sealed until it is earned.</p></div>
   <div className="an-series-count" aria-label="Thirty levels across six chapters"><strong>30</strong><span>EVOLUTION<br/>STAGES</span></div>
  </header>
  <EarnedRewardVault level={progression?.level??null} title="Your earned evolution archive"/>
 </section>;
}

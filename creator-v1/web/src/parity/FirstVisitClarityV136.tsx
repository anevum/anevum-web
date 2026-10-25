import {Link} from "react-router-dom";
import {Icon} from "../components/Icons";
import "./first-visit-clarity-v136.css";

/**
 * A plain-language, optional introduction below the real V136 arrival.
 * This is not a second Wayfinder, an auth gate, a signup funnel, or a second
 * IREN tour. All destinations already exist. The Status page owns the actual
 * capability checks; this module makes no assertion about an individual's
 * uploader or publishing permissions.
 */
export function FirstVisitClarityV136({signedIn}:{signedIn:boolean}){
  return <section className="p136-first-visit" aria-labelledby="p136-first-visit-title" data-first-visit-guide="v136">
    <div className="p136-first-visit-copy">
      <p className="p136-first-visit-eyebrow">FIRST CONTACT / THE NETWORK IN PLAIN TERMS</p>
      <h2 id="p136-first-visit-title">What can you actually do here?</h2>
      <p>Discover approved games, apps and creative projects. Meet their makers and explore public conversations. Make a member space when you want one. Creator Studio is growing, but uploading and publication have separate access and review requirements.</p>
      <div className="p136-first-visit-actions">
        <Link to="/start">Choose a starting path <Icon name="arrow" size={16}/></Link>
        <Link to="/status">Check what works now <Icon name="status" size={16}/></Link>
      </div>
    </div>
    <div className="p136-first-visit-answers" aria-label="First visit questions">
      <p className="p136-first-visit-eyebrow">QUICK ANSWERS / OPEN ONLY WHAT YOU NEED</p>
      <details>
        <summary>Do I need to sign up to explore?</summary>
        <p>No. Public Discover, creator channels and approved work are open to browse. An account is for your own identity and eligible member activities.</p>
        <Link to="/discover">Browse public work</Link>
        <Link to={signedIn?"/member":"/join"}>{signedIn?"Open my space":"Check member access"}</Link>
      </details>
      <details>
        <summary>Can I publish a game or app immediately?</summary>
        <p>Not automatically. Private project tools, pilot uploads and reviewed public releases are different stages. Signing up does not grant upload or publication permissions.</p>
        <Link to="/status">See current Studio availability</Link>
      </details>
      <details>
        <summary>Where can I suggest a feature or report an issue?</summary>
        <p>Verified members with discussion access can propose ideas through the moderated community. Not every account can post, and a dedicated public feedback inbox and feature voting are not live yet.</p>
        <Link to="/community">Explore community participation</Link>
      </details>
    </div>
  </section>;
}

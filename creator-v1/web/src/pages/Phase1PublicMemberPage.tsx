import {Link,useParams} from "react-router-dom";
import {canonicalPublic,type CanonicalPublicResponse} from "../lib/canonical-beta";
import {useResource} from "../lib/useResource";
import {OrbitalMark} from "../components/OrbitalMark";

const HANDLE=/^[a-z][a-z0-9_]{2,29}$/;
export function Phase1PublicMemberPage(){
 const {handle=""}=useParams<{handle:string}>();
 const valid=HANDLE.test(handle);
 const profile=useResource(async signal=>valid?canonicalPublic(handle,signal):Promise.resolve(null),[handle]);
 const data:CanonicalPublicResponse["profile"]|null=
   valid&&profile.state==="ready"?profile.data?.profile||null:null;
 return <section className="av12-public-world" aria-labelledby="av12-world-heading">
   <div className="av12-public-atmosphere" aria-hidden="true"/>
   <span className="kicker">ANEVUM / MEMBER WORLD</span>
   {profile.state==="loading"&&valid?<p role="status">Finding this member’s public world…</p>:
    data?<>
      <div className="av12-world-crest" aria-hidden="true"><OrbitalMark/></div>
      <p className="av12-world-eyebrow">THIS WORLD WAS OPENED BY</p>
      <h1 id="av12-world-heading">{data.displayName}</h1>
      <p className="av12-world-handle">@{data.handle}</p>
      <p className="av12-world-bio">{data.bio||"This member has not written an introduction yet."}</p>
      <div className="av12-world-sections">
        <section><span className="kicker">CURRENT EXHIBIT / 01</span><h2>THE BEGINNING.</h2>
          <p>This is this member’s verified, voluntarily public introduction.
            Projects, collaborations and earned collectibles will appear only when
            their separate publishing and privacy checks are ready.</p></section>
        <section><span className="kicker">NETWORK / VERIFIED</span><h2>ANEVUM MEMBER</h2>
          <p>A personal space shaped by its owner. Membership does not imply staff status, an award, or endorsement.</p></section>
      </div>
    </>:<>
      <h1 id="av12-world-heading">A PRIVATE WORLD.</h1>
      <p>This profile is not published, does not exist, or cannot be viewed right now.
        We never reveal which of those is the reason.</p>
    </>}
   <Link className="av12-world-back" to="/discover">EXPLORE OTHER WORLDS ↗</Link>
 </section>;
}

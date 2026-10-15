import {Link} from "react-router-dom";
import {PortalHeading} from "../components/PortalHeading";
import {LevelPanel} from "../components/LevelPanel";
import {CosmicArtwork} from "../components/CosmicArtwork";
import {HotCommunityPosts} from "./HotCommunityPosts";
import "./community-network.css";

/** The community route is a truthful, forum-first public hub, not a second
 * catalogue and not a rendered list of fictional discussion rooms.
 * Existing public threads, moderated submission route, creator pages and
 * independent staff approval remain the only content sources.
 */
export function CommunityPage(){
  return <div className="portal-community-page">
    <PortalHeading
      eyebrow="ANEVUM / COMMUNITY FORUM"
      title="MAKE THINGS"
      accent="TOGETHER."
      description="Discuss independent games, software, stories and art. Offer constructive feedback, find people building things, and connect conversations to genuine creator projects."
      index="COMMUNITY / 003"
      action={{to:"/community/write",label:"START A DISCUSSION"}}
    />
    <div className="portal-community-notice" role="status">
      <span className="portal-community-notice-mark" aria-hidden="true">!</span>
      <div><strong>COMMUNITY CONVERSATIONS ARE UNDER PRIVATE REVIEW.</strong>
        <p>Posting is currently limited to invited members and staff moderation. Only actual approved posts appear publicly. If the forum is empty, no sample conversations are substituted.</p>
      </div>
      <Link to="/community/write">SUBMIT FOR REVIEW ↗</Link>
    </div>
    <div className="portal-layout">
      <section className="portal-main" aria-label="Public community conversations">
        <HotCommunityPosts/>
        <section className="portal-box cnb-home-bridge" aria-labelledby="community-public-boards">
          <header className="portal-box-header">
            <div><span className="kicker">REAL PROJECTS / APPROVED PUBLIC RECORDS</span><h2 id="community-public-boards">FIND SOMETHING TO TALK ABOUT.</h2></div>
            <Link to="/boards">OPEN BOARDS ↗</Link>
          </header>
          <p>Discover genuine releases, new creators and project discussions. Boards use published data—not invented ratings, activity or featured members.</p>
          <div className="cnb-home-links">
            <Link to="/boards">LATEST RELEASES ↗</Link>
            <Link to="/boards?view=firstLooks">FIRST LOOKS ↗</Link>
            <Link to="/creators">CREATOR DIRECTORY ↗</Link>
            <Link to="/discover">BROWSE CREATIONS ↗</Link>
          </div>
        </section>
        <section className="portal-box" aria-labelledby="community-contribute-heading">
          <header className="portal-box-header">
            <div><span className="kicker">THE WEBSITE IS A COMMUNITY PROJECT</span><h2 id="community-contribute-heading">HELP SHAPE ANEVUM.</h2></div>
          </header>
          <p>Share a practical feature proposal, report a problem, offer tested feedback or contribute a project. Public ideas are discussions, not edits to the live website. Code, artwork and releases require a separate rights, security and staff review before adoption.</p>
          <div className="cnb-home-links">
            <Link to="/community/write">PROPOSE A DISCUSSION ↗</Link>
            <Link to="/status">CURRENT RELEASE STATUS ↗</Link>
            <Link to="/guide">COMMUNITY GUIDELINES ↗</Link>
          </div>
        </section>
      </section>
      <aside className="portal-sidebar">
        <LevelPanel compact/>
        <section className="portal-sidebox"><span className="kicker">THE RULES / COMMUNITY CULTURE</span><h2>HELP EACH OTHER MAKE BETTER THINGS.</h2>
          <div className="portal-community-values">
            <p><strong>BE SPECIFIC.</strong> Useful feedback beats empty scores.</p>
            <p><strong>CREDIT THE WORK.</strong> Disclose AI assistance and respect licenses.</p>
            <p><strong>STAY ACCESSIBLE.</strong> Free, phone-friendly participation matters.</p>
            <p><strong>EARN RESPECT.</strong> XP never purchases authority or stronger votes.</p>
          </div>
        </section>
        <section className="portal-sidebox"><div className="cw-room-world" aria-hidden="true"><CosmicArtwork scene="creative"/></div><span className="kicker">PRIVATE COLLABORATION / FUTURE</span>
          <h2>BUILD WITH OTHER CREATORS.</h2>
          <p>Invite-only project rooms, private messages and shared files require separate security, consent, moderation and storage acceptance. They are not publicly available yet.</p>
          <Link to="/status" className="portal-sidebox-link">WHAT IS READY →</Link>
        </section>
      </aside>
    </div>
  </div>;
}

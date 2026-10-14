import { Link, Navigate, useParams } from "react-router-dom";
import { readCreator, readProjects } from "../lib/api";
import { memberCreatorProfile, memberPublicWorld, memberMe, memberWorldAppearance } from "../lib/member-api";
import { useResource } from "../lib/useResource";
import { readForumMemberActivity } from "../lib/forum-api";
import { CosmicArtwork } from "../components/CosmicArtwork";
import { CelestialEmblem } from "../components/CelestialEmblem";
import {RelicRaster,hasApprovedRelicRaster} from "../components/RelicRaster";
import { CreatorFollowPanel } from "../components/CreatorFollowPanel";
import { achievementMotif, seriesOneMotif, seriesOneStudies } from "../lib/artifact-art";
import { ErrorState, LoadingState } from "../components/States";

const HANDLE = /^[a-z][a-z0-9_]{2,29}$/;

/**
 * The canonical future member URL is /@handle, independent of whether the
 * person has published a project. Identity, XP and achievement states come
 * ONLY from the real same-origin member API. The public catalogue is an
 * optional fallback for already-published creator channels.
 *
 * This is read-only UI source, not production account enablement.
 */
export function MemberWorldPage() {
  const { vanity = "" } = useParams();
  const handle = vanity.startsWith("@") ? vanity.slice(1) : "";
  const valid = vanity === "@" + handle && HANDLE.test(handle);

  const data = useResource(async signal => {
    if (!valid) return null;
    const [world, catalogue, projects, activity] = await Promise.all([
      memberPublicWorld(handle, signal).catch(() => null),
      readCreator(handle, signal).catch(() => null),
      readProjects({ creator: handle, limit: "12" }, signal).catch(() => null),
      readForumMemberActivity(handle, signal).catch(() => null)
    ]);
    // A private owner preview is authorized by the existing same-origin
    // session AND must match the URL handle. Guests cannot request it.
    let privatePreview = false;
    let view = world;
    if (!view) {
      const [self, privateSettings] = await Promise.all([
        memberMe(signal).catch(() => null),
        memberWorldAppearance(signal).catch(() => null)
      ]);
      if (self?.member.handle === handle && privateSettings) {
        view = {profile: {
          handle,displayName:self.member.displayName || handle,bio:self.member.bio || ""
        },appearance:privateSettings.appearance};
        privatePreview = true;
      }
    }
    // Never expose a nonpublisher to a guest without public opt-in.
    if (!view && !catalogue) return null;
    const member = view ? await memberCreatorProfile(handle, signal).catch(() => null) : null;
    return { world:view, privatePreview, member, catalogue, projects, activity };
  }, [handle, valid]);

  if (!valid) return <Navigate to="/creators" replace />;
  if (data.state === "loading") return <LoadingState label="Opening a member world" />;
  if (data.state === "error") return <ErrorState title="MEMBER WORLD UNAVAILABLE" detail="The real public profile service cannot be reached. No demonstration identities are shown." />;
  if (!data.data) return <div className="member-world-empty">
    <span className="kicker">ANEVUM / PERSONAL PROFILE</span>
    <h1>THIS WORLD IS NOT PUBLIC.</h1>
    <p>No active public member profile was found at this address. Member enrollment and publishing remain controlled while identity and privacy tests continue.</p>
    <Link className="button secondary" to="/creators">BROWSE PUBLIC CREATORS</Link>
  </div>;

  const { world, privatePreview, member, catalogue, projects, activity } = data.data;
  const publicProfile = world?.profile || catalogue?.creator;
  const sectionOrder = world?.appearance.sections || ["work", "cabinet", "community"];
  if (!publicProfile) return <ErrorState title="PROFILE UNAVAILABLE" detail="No public creator information is available." />;
  const name = publicProfile.displayName;
  const level = member?.progression;
  const earned = member?.achievements.filter(achievement => achievement.earned) || [];
  const illustrated = !!level && seriesOneStudies.some(study => study.level === level.level && study.name === level.artifact);
  const raster = !!level?.artifact && hasApprovedRelicRaster(level.level,level.artifact);
  const publicProjects = projects?.items || [];
  const reportedProjects = member?.contributions.publishedProjects ?? catalogue?.creator.publishedProjects ?? null;

  return <div className={"member-world member-world--" + (world?.appearance.theme || "astral")}>
    <div className="member-world-breadcrumb"><Link to="/creators">PEOPLE</Link><span aria-hidden="true">/</span><span>@{handle}</span></div>
    <section className="member-world-hero" aria-label={name + " member profile"}>
      <div className="member-world-sky" aria-hidden="true"><CosmicArtwork scene={world?.appearance.scene || "portal"} /></div>
      <div className="member-world-identity">
        <div className="member-world-portrait" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</div>
        <div className="member-world-name">
          <span className="kicker">ANEVUM / MEMBER WORLD</span>
          <h1>{name}</h1>
          <p className="member-world-handle">@{handle}</p>
          <p className="member-world-bio">{world?.profile.bio || "This member has not added a public introduction."}</p>
          <span className="member-world-permalink">PERSONAL LINK · ANEVUM.COM/@{handle.toUpperCase()}</span>
        </div>
      </div>
      <div className="member-world-hero-bottom">
        <span>{privatePreview?"PRIVATE OWNER PREVIEW / NOT PUBLIC":"PERSONAL SPACE / NOT A PROJECT SUBMISSION"}</span>
        <span>ALL PUBLIC DETAILS COME FROM VERIFIED SERVICES</span>
      </div>
    </section>

    <div className="member-world-layout">
      <div className="member-world-main">
        <section className="member-world-panel" id="member-work" style={{order:sectionOrder.indexOf("work")}}>
          <div className="member-world-panel-heading"><div><span className="kicker">01 / ORIGINAL WORK</span><h2>CREATIONS</h2></div><span>{reportedProjects === null ? "COUNT UNAVAILABLE" : reportedProjects + " PUBLISHED"}</span></div>
          {projects === null ? <p className="member-world-status">Published projects could not be loaded. This does not imply the member has none.</p> :
            publicProjects.length === 0 ? <p className="member-world-status">No approved public projects appear here yet. Private drafts are never listed.</p> :
              <div className="member-world-projects">{publicProjects.map(project => <article key={project.id}>
                <span className="kicker">{project.category.toUpperCase()}</span><h3>{project.title}</h3>
                <p>{project.summary}</p><Link to={"/projects/" + encodeURIComponent(project.id)}>VIEW RELEASE →</Link>
              </article>)}</div>}
          {publicProjects.length > 0 && <Link to={"/creators/" + encodeURIComponent(handle)} className="member-world-all-work">ALL PUBLIC RELEASES →</Link>}
        </section>
        <section className="member-world-panel" id="member-achievements" style={{order:sectionOrder.indexOf("cabinet")}}>
          <div className="member-world-panel-heading"><div><span className="kicker">02 / VERIFIED MILESTONES</span><h2>THE COLLECTION</h2></div><Link to="/levels">LEVEL SYSTEM →</Link></div>
          {!member ? <p className="member-world-status">Earned achievements are shown only when the verified member service is available.</p> :
            earned.length === 0 ? <p className="member-world-status">No public achievements have been earned yet.</p> :
              <div className="member-world-achievements">{earned.map(achievement => <article key={achievement.key}>
                <CelestialEmblem motif={achievementMotif(achievement.key) || "orbital"} size="small" state="earned"/>
                <div><strong>{achievement.name}</strong><small>{achievement.description}</small></div>
              </article>)}</div>}
        </section>
        <section className="member-world-panel member-world-community" style={{order:sectionOrder.indexOf("community")}}>
          <div className="member-world-panel-heading"><div><span className="kicker">03 / COMMUNITY</span><h2>PART OF THE UNIVERSE</h2></div><Link to="/community">COMMUNITY →</Link></div>
          {activity === null ? <p>Verified discussion activity is currently unavailable. The moderated forum service has not been enabled on this host. No posts are being simulated.</p> :
            activity.items.length === 0 ? <p>No approved public discussion posts from this member yet.</p> :
              <div className="member-world-activity">
                {activity.items.map(post=><Link key={post.id} to={"/community/thread/"+post.threadId} className="member-world-activity-item">
                  <span className="kicker">{post.room.toUpperCase()} / APPROVED POST</span>
                  <strong>{post.threadTitle}</strong>
                  <p>{post.excerpt}</p>
                  <small>{new Date(post.createdAt*1000).toLocaleDateString()} · VIEW DISCUSSION →</small>
                </Link>)}
              </div>}
        </section>
      </div>
      <aside className="member-world-aside">
        {!privatePreview&&member&&typeof member.followers==="number"&&typeof member.viewerFollows==="boolean"&&
          <CreatorFollowPanel key={handle} handle={handle} followers={member.followers} viewerFollows={member.viewerFollows}/>}
        <section className="member-world-panel member-world-progress">
          <span className="kicker">EARNED PROGRESSION / NOT PURCHASED</span>
          {level ? <>
            <div className="member-world-level-emblem">
              {raster ? <RelicRaster level={level.level} name={level.artifact||""} large/> : illustrated
                ? <CelestialEmblem motif={seriesOneMotif(level.level, level.artifact)} size="large" state="earned" />
                : <span aria-label={"Level " + level.level} className="member-world-level-number">{level.level}</span>}
            </div>
            <h2>LEVEL {level.level}</h2>
            <strong>{level.artifact || "FUTURE SERIES"}</strong>
            <p>{level.xp.toLocaleString()} VERIFIED XP</p>
            <div className="member-world-progress-track" role="progressbar" aria-label="Verified level progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level.progressWithinLevel * 100)}>
              <span style={{ width: Math.max(0, Math.min(100, level.progressWithinLevel * 100)) + "%" }} />
            </div>
            <small>Only the four reviewed milestone studies have distinct artwork so far. Other levels show their number until individual illustrated relics are ready.</small>
          </> : <p>Progression is not available from the public catalogue. No level or XP has been assumed.</p>}
        </section>
        <section className="member-world-panel member-world-stats">
          <span className="kicker">REAL PARTICIPATION</span>
          {member ? <>
            <div><strong>{member.contributions.ratings}</strong><span>VERIFIED RATINGS</span></div>
            <div><strong>{member.contributions.releases}</strong><span>PUBLISHED UPDATES</span></div>
            <div><strong>{earned.length}</strong><span>EARNED ACHIEVEMENTS</span></div>
          </> : <p>Participation totals are hidden until the member service is available.</p>}
          <small>Follower counts, messages and reputation cannot be inferred from XP.</small>
        </section>
      </aside>
    </div>
  </div>;
}

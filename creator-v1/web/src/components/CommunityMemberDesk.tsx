import { Link } from "react-router-dom";
import { useState } from "react";
import {
  memberHealth, memberMe, MemberApiError,
  type MemberIdentity
} from "../lib/member-api";
import { useResource } from "../lib/useResource";
import { Icon } from "./Icons";
import "./community-member-desk-v008.css";

type Access =
  | { kind: "closed" }
  | { kind: "guest"; invitationEnabled: boolean }
  | { kind: "member"; identity: MemberIdentity };

const STAGING_MEMBER_SERVICE = "anevum-v1-member-staging";

/**
 * An invited member's entry into the existing moderated Creator V1 features.
 *
 * The public site never creates a new identity, guesses a session from client
 * storage, or enables anonymous posting. Both reads are bound to the existing
 * same-origin member Worker. Missing, unhealthy or unfamiliar services fail
 * closed. This does not replace the separately reviewed canonical identity
 * consolidation: no cross-system session linking is performed here.
 */
export function CommunityMemberDesk() {
  const [revision, setRevision] = useState(0);
  const access = useResource<Access>(async signal => {
    let health;
    try {
      health = await memberHealth(signal);
    } catch {
      return { kind: "closed" };
    }
    if (health.service !== STAGING_MEMBER_SERVICE || health.status !== "ok")
      return { kind: "closed" };
    try {
      const { member } = await memberMe(signal);
      if (!member || !member.id) return { kind: "closed" };
      return { kind: "member", identity: member };
    } catch (error) {
      if (error instanceof MemberApiError && error.status === 401)
        return { kind: "guest", invitationEnabled: health.signupEnabled === true };
      return { kind: "closed" };
    }
  }, [revision]);
  const visitor = access.state === "ready" && access.data.kind === "guest";
  const member = access.state === "ready" && access.data.kind === "member" ? access.data.identity : null;
  const signedInWithHandle = Boolean(member?.handle);
  const closed = access.state === "error" || (access.state === "ready" && access.data.kind === "closed");

  return <section className="ch8-member-desk" aria-labelledby="ch8-desk-heading">
    <div className="ch8-member-orbit" aria-hidden="true"><Icon name="people" size={20}/></div>
    <div className="ch8-member-content">
      <span className="ch7-kicker">ANEVUM / YOUR SPACE IN THE COMMONS</span>
      <h2 id="ch8-desk-heading">{member ? "Your next contribution." : "There's room for you here."}</h2>
      {access.state === "loading" && <p role="status">Checking invited member access. Public browsing stays available.</p>}
      {closed && <p>Explore freely. Member contributions remain in controlled testing until the identity and moderation services are accepted.</p>}
      {visitor && <p>Browse for free. Members with an approved invitation can sign in on this staging service to submit work for staff review.</p>}
      {member && !member.handle && <p>Your verified session is active. Complete your member profile and unique handle before submitting discussions.</p>}
      {member && signedInWithHandle && <p>Signed in as <strong>{member.displayName || "@" + member.handle}</strong>. Share a question, offer useful feedback or prepare work for review. Posts are never automatically published.</p>}
    </div>
    <div className="ch8-member-actions">
      {member && signedInWithHandle && <>
        <Link className="ch8-action ch8-action-primary" to="/community/write">START A DISCUSSION <Icon name="arrow" size={14}/></Link>
        <Link className="ch8-action" to="/create">MY PROJECTS <Icon name="arrow" size={14}/></Link>
        <Link className="ch8-action-quiet" to="/account">MY SPACE</Link>
      </>}
      {member && !member.handle && <Link className="ch8-action ch8-action-primary" to="/account/edit">COMPLETE MY PROFILE <Icon name="arrow" size={14}/></Link>}
      {visitor && access.data.invitationEnabled && <a className="ch8-action ch8-action-primary" href="/api/v1/member/join">INVITED SIGN-IN <Icon name="arrow" size={14}/></a>}
      {visitor && !access.data.invitationEnabled && <span className="ch8-closed-note">INVITATIONS NOT ENABLED HERE</span>}
      {closed && <Link className="ch8-action" to="/start">LEARN HOW ANEVUM WORKS <Icon name="arrow" size={14}/></Link>}
      {access.state === "error" && <button type="button" className="ch8-action-quiet" onClick={() => setRevision(current => current + 1)}>RECHECK ACCESS</button>}
    </div>
  </section>;
}

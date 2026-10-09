export default function Privacy() {
  return (
    <article className="studio-page member-legal">
      <p className="workshop-kicker">ANEVUM / Privacy</p>
      <h1>Privacy</h1>
      <p>ANEVUM is an independently operated software workshop. Its public projects, updates, and Field Notes can be read without an account. A member account is optional.</p>

      <h2>Information used for a member account</h2>
      <p>Signing in with Google supplies your name, email address, a Google account identifier, and potentially a profile image. ANEVUM stores an internal user identifier, linked sign-in account information, encrypted OAuth provider tokens where supplied, secure sessions, and security records such as IP address, device or browser details, and rate-limit data. Your member account may also store the display name, theme preference, saved programs, followed projects, access entitlements, and any optional RHEN draft name and planned position or exposure limits you choose to save. A draft is not connected to a brokerage or trading runtime.</p>

      <h2>Commons research and participation</h2>
      <p>Commons is an invitation-only research area. If admitted, ANEVUM stores your invitation status, participation role, questions, research notes, replies, timestamps and any moderation actions. Your chosen account display name appears beside contributions to other admitted Commons members. Contributions are not public website posts by default, but other admitted members can read them. Do not submit passwords, brokerage credentials, bank details, non-public trading positions, or other confidential information.</p>
      <p>Research content associated with your account is included in account export when Commons storage is available. Deleting your member identity is designed to remove your Commons membership and authored contributions from the active member database; replies from other members to your deleted topics are also removed. Moderation events and service-provider backups may be subject to separate security and retention practices. Publication outside Commons requires a separate choice and appropriate review.</p>

      <h2>Why this information is processed</h2>
      <p>We use it to authenticate you, keep your member profile and preferences separate from other accounts, protect against misuse, operate account recovery and deletion, and show available project features. A member login is not a brokerage connection and does not authorize access to private RHEN trading tools, another member's data, or financial accounts.</p>

      <h2>Services that process data</h2>
      <p>Google handles sign-in. Cloudflare runs the website, member database, and related infrastructure. These providers may process operational and security logs under their own policies. The member account feature does not use information for consumer-targeted advertising or sell member information.</p>

      <h2>Retention, export, and deletion</h2>
      <p>Account and preference records remain in the active member database while your account exists. You can change your display name, download a JSON export of member-account information, sign out, or delete the account in <a href="/me/settings">Command account settings</a>. Account deletion is designed to remove the member identity, linked sign-in information, active sessions, saved programs, follows, optional RHEN configuration drafts, and corresponding member records from the active database. Infrastructure backups, provider audit logs, and security records may have separate retention practices and may not disappear at the same time. ANEVUM does not yet publish a fixed provider-log or backup deletion period.</p>

      <h2>Your choices</h2>
      <p>You can continue reading the public website without Google sign-in. Authentication uses session cookies; blocking them may prevent member features from working. For questions about data access, provider retention, or deletion, contact <a href="mailto:devon@anevum.com">devon@anevum.com</a>.</p>

      <p className="member-legal-date">Commons revisions proposed October 9, 2026; publication subject to owner review.</p>
    </article>
  );
}

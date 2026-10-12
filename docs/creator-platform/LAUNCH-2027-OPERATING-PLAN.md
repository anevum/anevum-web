# ANEVUM 1.0 — January 1, 2027 launch program

Session: `ANEVUM.ANEVUM.PLAN.2026-10-11.001.NEW-YEAR-LAUNCH-OVERHAUL`
Decision date: 2026-10-11. Target public opening: 2027-01-01.
Status: Implementation program. The launch target is locked; unbuilt feature estimates are not promises.

## The one core promise

A newcomer can discover and try a real community project without paying or creating an account. An authenticated creator can publish software they maintain, and other members can review, save, follow, and contribute. **Experience, levels, earned achievements and genuinely valuable recognition are a foundational member identity and company growth engine**: public participants, testers and creators can all earn meaningful progress without spending money or following punitive streaks. See [XP, Progression and Recognition Charter](XP-PROGRESSION-AND-RECOGNITION-CHARTER.md).

ANEVUM is the creator community, not a RHEN trading product with social features. The approved cinematic identity is retained. Old V5/RHEN material stays in secured read-only archives and is never exposed to public member APIs.

## Milestone gates (planning targets, not automatic deployments)

| Date | Milestone | Acceptance |
|---|---|---|
| Oct 18 | Isolated environments and owner Studio | Separate staging D1, protected staff publishing UI, safe migrations, signed Access assertions, versioned deployment and rollback rehearsal |
| Nov 1 | Identity and profiles | Production-ready email sign-in/recovery and GitHub/Google OAuth as approved, account export/deletion, abuse throttles, separate staff roles, end-to-end account isolation tests |
| Nov 15 | Project publishing | Creator-managed drafts, validated external demo/source links, submission review queue, approved publications, version/changelog, ability to take down reports |
| Nov 29 | Voting, progression and recognition | One active vote per eligible member/project, edit replaces prior vote, no self-votes, auditable XP ledger, balanced multi-source earning, prominently visible member level and milestone achievements, reversals, no XP purchasing, abuse detection and moderation appeals |
| Dec 13 | Community and discovery | Follow/save collections, reviews/discussion with reports, searches and category rails, first challenge or jam, first-party real listings |
| Dec 20 | Release candidate and freeze | Real cross-device journeys, accessibility/security checks, privacy/terms/reporting, uptime/backup/restore, analytics and incident alerts, no unreviewed dependencies |
| Dec 26 | Dress rehearsal | Fresh-member simulation, recovery drill, moderation simulation, mobile onboarding, webhook/email delivery tests, staff signoff |
| Jan 1 | Public opening | Main domain stable; creators can sign up, publish through review, and get genuine community interaction; clear feature states and support paths |

## Product priorities

P0: guest discovery, authenticated accounts, profiles, honest project pages, **prominent persistent XP/levels and meaningful first-party rewards/recognition**, auditable multi-event progression with moderation reversals, fair achievement visualizations and member milestone celebrations, submissions, moderation, one-vote-per-user, reviews, follows/saves, accessible mobile navigation, prelaunch signup, secure staff tooling, terms/privacy, backup/restore, alerts.

P1 (only if P0 passes): curated collections, expanded creator spotlights, first community jam, **all 60 level-artifact illustrations and personalized profile shelves**, verified creative challenge awards, GitHub public repository import with verified ownership, comment notifications, selected browser installability metadata.

P2 (deferred): **budgeted tangible rewards such as merchandise, sponsored credits and grants subject to published rules and fulfillment**, paid marketplace/payouts, commissions, full Discord sync, cloud app hosting, autonomous AI coding agents, runtime sandboxes, rich social messaging, public plugin marketplace, custom subdomains. These may be researched now but must not take capacity away from P0.

## Ideas worth preserving for future development

- **First Launch Arcade:** new creators get a finite first-looks queue, actionable feedback and human review instead of destructive popularity removal.
- **Project Passport:** every project displays creator, release dates, versions, AI disclosure, public source, platform compatibility, external costs and changelog.
- **Playable Lab:** feature-detected external demos with trustworthy labels; eventually isolate embedded demos on separate origins with quotas and audits.
- **Build Journals:** short creator release notes and transparent progress following a project over time.
- **Contribution Credits:** versioned credit for testers, accessibility improvements, artwork and code; earned badges are separate from moderation permissions.
- **Phone-first Discover:** track which software is genuinely usable from mobile, with a meaningful free participation path.
- **Community Jams:** events with explicit deadlines, fair judging, visible submissions and small meaningful awards.
- **Verified GitHub Link:** creator selects public repositories; a least-privilege app verifies ownership and releases, never clones/executables with broad OAuth scopes.
- **Artifact Levels:** each significant level earns an original collectible object with a distinct silhouette and accessible fallback, never purchased XP or punitive streaks.
- **Creator Co-op:** verified collaborators accept roles and credits without becoming administrators of anyone else's account.

## Quality and operational acceptance

- No fictional users, fabricated activity, purchased voting weight, or fake scarcity.
- No public code execution on the ANEVUM origin, and no private RHEN credentials in creator services.
- At least one verified independent account can discover, publish, save and review real work on a phone.
- Privacy-safe analytics for landing -> project try -> signup -> publish -> review activation; owner only monitors aggregated signals.
- Account recovery and deletion work with repeatable backup/restore, rate-limited auth, verified email, signed callbacks, CSRF and session isolation.
- Moderation available before open publishing, including project flags, changes requested, appeals and blocked spam.
- Accessibility check: keyboard, focus, semantic landmarks, contrast, reduced motion and 320px mobile viewport.
- No unbounded hosting of member source code, video or binary releases; external author-hosted content first.
- Explicit launch rollback owner, release commit and emergency contact workflow.

## Weekly governance

Monday: choose the one shippable objective and decide what *will not* be developed that week.
Wednesday: run independent acceptance tests on staging and capture blockers.
Friday: triage moderation/security and verify fixes.
Weekend: reviewed production release if it clears the gate, plus a brief public Field Note.

If a deadline slips, reduce scope without breaking the core create -> publish -> review loop. Never use a rushed domain cutover, an unprotected project-upload endpoint or an untested broker/archive restoration as a shortcut.
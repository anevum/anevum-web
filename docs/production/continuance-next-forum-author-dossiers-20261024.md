# ANEVUM NEXT — Public forum author dossiers

**Session:** `ANEVUM.WEB.BUILD.2026-10-24.014.FORUM-AUTHOR-DOSSIERS`

**Scope:** A new *draft* PR layered on top of #679 at `0809374c87b64f2837efdd1bd1a5ff489d3a45ad`. No merge, deployment, migration, Cloudflare operation or V131 release change. The parent NEXT default-off preview remains untouched.

## Purpose

Make real community participants recognizable in moderated forum posts, detailed threads, replies, and optional forum highlights rather than reducing an author to a picture/name. Apply one reusable author-card component for an intelligible compact summary, a distinct public wall link, and optional, keyboard-accessible deeper record.

## Authoritative data and safety

- Existing `ForumAuthor` public server projection, not a private member request. Public visibility is checked server side before it is delivered; `showStats=0` suppresses reputation and level projection.
- Preserve the actual canonical `CompactMemberIdentity` avatar, publicly earned level art, selected badges, aura, verified role, and supporter frame without issuing any *new* data fetches in the dossier.
- Sanitize visible level to an integer 1–30, validate reputation with `safePublicReputation`, verified roles with `safeVerifiedRole`, constellation identity with `safeConstellation`, and badge selections with `selectFeaturedBadges` and `BADGE_CATALOG`.
- Conditionally show progression level, verified reputation tier/score, public constellation identity and up to two visible badge labels (plus confirmed medal and at most one ribbon). No synthetic followers, inferred personal biography, guessed occupations or prestige.
- Native HTML `details/summary` expands four capped server-authoritative contribution counters: approved threads, replies, peer appreciations and earned marks. These are *credited* totals and cap at the verified thresholds, not lifetime totals.
- Public member wall link only for canonical valid handles; otherwise suppress external or malformed navigation. Avoid nested interactive targets by rendering the shared compact identity noninteractive and the profile action as a separate link.
- The component has no writes, no auth reads, no socket/storage, no client-side rewards, and no special badges or level grants.

## QA and review gates

A separate exact-head CI workflow enforces a narrow, eight-file scope against #679; runs the new source contracts plus canonical forum privacy tests, strict TypeScript check, a default-off compiled build, and the existing real Chromium browser forum fixture with expanded desktop/mobile captures. The fixture uses temporary test-only identities and only staff-approved synthetic posts/replies, with a hidden account to verify opt-out. Screenshots are labelled test data.

Owner review must still check readability, chosen visual direction, 1440/390/320px layouts, keyboard focus, contrast, screen-reader labels, real Safari and signed-in privacy. The PR cannot be merged until the existing #676–#679 stack and OV03 guard are reconciled without weakening protection. V131 production is left live and unchanged.

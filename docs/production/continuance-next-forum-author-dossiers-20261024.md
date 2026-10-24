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


## Continuation 015 — compact personalized identity strip (owner-directed)

Owner feedback rejected the tall nested dossier with full-width View Wall button, repeated text statistics and an oversized contribution grid. The real `ForumAuthorCard` now presents a compact, single-row identity strip built on `CompactMemberIdentity`, with a responsive 44px profile action and 44px native disclosure action. It retains the author's actual avatar, level specimen, chosen aura glow, constellation insignia, display-selected earned badge/medal/ribbon art, independently verified role, and any public supporter styling passed by the existing shared identity. No new profile fetch, write, reward or private read is introduced.

The optional expanded panel provides legible public level/role/reputation/aura/constellation, chosen earned titles and four credited/capped contribution counters without occupying feed space by default. The person's selected cosmetic aura subtly tints the card edge and focus treatment; users without an aura retain the standard neutral style. No fabricated followers, personal biography, prestige, or earned marks.

Synthetic browser QA now installs recognition/verified-role migrations **only inside its temporary in-memory SQLite fixture**, seeds independently reviewed *test-only* earned marks and a selected Nebula aura for the approved public author, then checks their actual browser-rendered insignia and accent at 1440/1024/390/320px, mobile collapsed height, one profile link, disclosure expansion, read-only privacy constraints, and preserved hidden private member behavior. Live migrations, production configuration, and user accounts remain untouched.

Protected PR scope stays the same eight files; dedicated exact-head CI and owner acceptance still gate release.


## Continuation 016 — public privacy choices, long names and keyboard disclosure

Source-only continuation of #700 on the existing default-off NEXT stack, without touching release or authorization. A public reply participant was seeded in the synthetic browser fixture with **a genuinely issued but explicitly hidden earned badge**, `show_stats=0` and a long yet valid public display name. Both the server response and actual compiled reply card must omit progression numbers, reputation, earned badge artwork and an empty extra details panel while retaining the member's correct public wall link and full accessible name. This tests a real opt-out scenario, not an absent author record. The visible name is clamped to two lines in a scoped rule so 320/390 layouts remain compact; the full accessible name and profile link are preserved.

The summary control's accessible name is now state-neutral ("Public profile details for ..."), so native Enter/Space open and close states never misleadingly announce "Show" while open. The browser fixture exercises the details with a real Chromium keyboard event and confirms the expanded selected-aura and independently earned labels. No new fetches, D1 tables, account mutations, role or reward issuance, consent changes, global styles or V131 release effects. The strict eight-file guard remains in force.

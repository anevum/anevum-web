# ANEVUM — Universal Player Cards and Earned Recognition V065
Session: `ANEVUM.WEB.BUILD.2026-10-17.013.PLAYER-CARD-RECOGNITION-SYSTEM`
Date: 2026-10-17
Source branch: `build/player-card-recognition-v065-20261017-013`
Review base: `build/evolution-miniature-native-webgl-v062-20261017-011`
Status: **SOURCE-ONLY, NOT DEPLOYED, NOT MIGRATED, NOT AWARD-ENABLED**

## Locked identity hierarchy

1. **Portrait**: user-chosen, safely server-stored JPEG, canonical member handle.
2. **Evolution**: existing 30 native V059/V062/V064 specimens; permanent XP threshold
   `75*(level-1)^2` capped at Level 30 (63,075 XP). Never purchase XP or give a level authority.
3. **Achievement badges**: collectible verified milestones. Up to 3 publicly displayed:
   newest earned by default for new members; curated/hidden when chosen. Old members'
   selection or no-display preference is preserved by migration.
4. **Distinctions**: separate **ribbons** for exceptional sustained service and **medals**
   for exceptional creative/communal accomplishments. Independent reviewer required
   in the new grants schema. At most 2 ribbons + 1 medal on compact cards.
5. **Aura**: one optional, pure-cosmetic card atmosphere, independent from separately
   sold supporter cosmetics. Presets: none, aurora, eclipse, ember, nebula, transcosmic.
6. **Constellation**: reserved for future authoritative group memberships, emblems,
   flags, banners and group identity. No self-assigned or spoofable group claims.

## Shared interface and member journey

The original `CompactMemberIdentity` is retained as the one universal identity
renderer, now also exported as `PlayerCard`. Size variants are inline, compact,
standard and featured. It uses the existing `LevelEmblem` V062 shared WebGL
renderer; *never* allocate a separate WebGL canvas for every reply or post.
Non-visible/lower-power and reduced-motion devices show current detailed posters.
HonorInsignia supplies distinct native SVG medal devices and woven service ribbons.

The canonical `/member?tab=awards` page gains an owner-only `PlayerCardStudio`.
It shows a true server-backed card preview, latest/curated/hidden badge settings,
selection of only earned medals/ribbons, and a cosmetic aura selector. When the
new service flag is off, the existing V061 award cabinet remains functional.
No example/preview grants are ever mixed with real profile identity.

Existing public forum thread/reply and community/directory/wall data use the
canonical public-member-card service; V065 extends their verified identity only
when the new schema is present. The legacy Creator V1 `PublicAuthorShowcase` and
project/creator credit systems have different trust domains and remain an explicit
future unified-identity migration. Do not infer that a legacy project handle is
the same as a verified canonical member without a signed, server-verifiable link.

## Badge and distinction catalog

Initial catalog: 26 defined badge types in eight families (origin, community,
creation, discovery, collaboration, craft, stewardship, continuance). **Only
`first_signal` and `world_shaper` are active/in the existing earned ledger.**
New criteria are planned, not activated by the catalog. Manual award issuance
is not implemented. Existing milestone grants and XP events are unchanged.

Prestige catalog: six ribbon types (Steadfast Signal, Maker's Service, Open Hand,
Bridge of Worlds, Steward's Watch, Living Archive) and six rare medal types
(First Light, Constellation Laureate, Continuance Medal, Atlas of the Commons,
Worldbuilder, Lightkeeper). All are definitions; **none is claimed issued**.
Distinct medal geometry and ribbon material families do not imply member status.

Do not award for repeated clicks, self-replies, spam, paid subscription,
follower brigades or number of shallow uploads. Criteria must verify substantive
work. Personal badges can be automated after anti-abuse rules and event provenance
are implemented. Prestigious medals require documented evidence, at least one
independent reviewer and auditable revocation and appeal paths.

## Canonical persistence and security

Migration `0010_player_recognition.sql` is additive to `MEMBER_DB`:
- `member_recognition_grants`: server-only award evidence, independent review
  requirement for ribbons/medals, and revocation state, FK cascade on closure.
- `member_recognition_preferences`: mode, curated slots, selected honors,
  aura and optimistic revision lock.
- Existing opted-in members' selections are retained; old unselected members
  start hidden so the migration does not retroactively publish inventories.

`recognition.mjs` reads only non-revoked grants and the original two verified
milestones. It never grants XP or issues honors. Public projections expose only
selected earned IDs and dates, never account IDs, raw XP, evidentiary records,
reviewers, emails or extra hidden awards. The flag
`CANONICAL_RECOGNITION_ENABLED=true` is necessary before owner
`GET/PATCH /api/v1/member/recognition` is routable; authenticated sessions,
verified email, exact same-origin mutation checks, schema readiness, strict
field allowlists, rate limit and optimistic revision checks are retained.

## Validation, rollout and follow-up

V065 is a review branch against the native V062/V064 release lineage.
GitHub source-only CI: TypeScript strict check, V065 security/default selection
tests and prior V061 identity regression. This change has **not** run a D1
migration, issued badges, changed XP, altered production/Cloudflare traffic,
or checked actual iPhone Safari.

The active production V064 Worker recorded version is
`80c6f0d1-c35b-4524-b97d-7cffdd4063d5` (pre-change).
**Never use `wrangler deploy --keep-vars`** against
`anevum-apex-prelaunch-gateway`: a prior incident removed 4 secrets.
When ready: resolve overlapping V063 styling, inspect migration and backfill
in an isolated D1 copy, back up production, verify foreign keys, preserve
the existing 23 Worker bindings (including opaque secrets and both D1 IDs),
upload an unrouted candidate version, run browser/accessibility/real iPhone
device checks, then promote only through separately guarded Cloudflare
Workers Versions API with exact rollback preserved.

Next implementation before claiming a site-wide release:
- Canonicalize project/creator credits after verifying identity links.
- Add an authoritative award event worker for each planned badge, tests for
  retries/revocations, and a documented recognition moderation/appeals console.
- Replace older two-item "medals" terminology everywhere with "badges",
  and add separate distinction notification kinds after issuance exists.
- Add true Constellation membership/flag authorization and moderation.
- Browser-test 320px, 390px and desktop, 20+ cards in motion/reduced motion,
  tab order, VoiceOver and Safari GPU/thermal behavior; keep poster fallback.

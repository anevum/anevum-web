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
The public `/recognition` archive now browses all 26 badge definitions, six
ribbons and six medals with exact 'planned' versus 'available' language,
responsive filtering and member-earned state when authenticated.
It shows a true server-backed card preview, latest/curated/hidden badge settings,
selection of only earned medals/ribbons, and a cosmetic aura selector. When the
new service flag is off, the existing V061 award cabinet remains functional.
No example/preview grants are ever mixed with real profile identity.

Existing public forum thread/reply and community/directory/wall data use the
canonical public-member-card service; V065 extends their verified identity only
when the new schema AND explicit release feature flag are present. The legacy Creator V1 `PublicAuthorShowcase` and creator directory now share
the card's visual shell, explicitly labeled CREATOR CHANNEL and without an
invented canonical member level/portrait. Project/creator credit identity
linkage remains an explicit future data migration. Do not infer that a legacy project handle is
the same as a verified canonical member without a signed, server-verifiable link.

## Badge and distinction catalog

Initial catalog: 26 defined badge types in eight families (origin, community,
creation, discovery, collaboration, craft, stewardship, continuance). **Only
`first_signal` and `world_shaper` are active/in the existing earned ledger.**
The catalog remains a non-authoritative definition list. Server-side issuance
now includes First Orbit (public canonical profile), First Transmission
(independently approved forum thread), First Response (approved reply) and
Open Channel (ten substantial approved discussions on distinct UTC days).
All new issuance is guarded by CANONICAL_RECOGNITION_ENABLED and an installed
D1 schema. Other criteria remain future work. Prestige issuance is not enabled. Existing milestone grants and XP events are unchanged.

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
When ready: reconcile concurrent V062/V064 branch divergence and overlapping V063
styling before considering promotion; inspect migration and backfill
in an isolated D1 copy, back up production, verify foreign keys, preserve
the existing 23 Worker bindings (including opaque secrets and both D1 IDs),
upload an unrouted candidate version, run browser/accessibility/real iPhone
device checks, then promote only through separately guarded Cloudflare
Workers Versions API with exact rollback preserved.

Next implementation before claiming a site-wide release:
- Canonicalize project/creator credits after verifying identity links.
- Expand issuance to other badges after proof and anti-abuse rules. Write
  reconciliation/revocation and prestige independent-review/appeals controls.
  The V066 first-profile/forum issuance is already idempotent, with SQL
  conditions preventing unapproved or self-reviewed badges.
- Add ordinary XP from approved sources only after designing its bounded,
  server-authoritative ledger and cross-surface level calculations.
- Finalize distinction-specific notification kinds only after prestige issuance
  and moderation review workflows exist. Founding XP popups are now badges.
- Add true Constellation membership/flag authorization and moderation.
- Browser-test 320px, 390px and desktop, 20+ cards in motion/reduced motion,
  tab order, VoiceOver and Safari GPU/thermal behavior; keep poster fallback.

## October 17 implementation continuation checkpoint

Source branch includes an independent reviewed-forum and public-profile badge
issuer at `canonical-auth/recognition-issuer.mjs`, integrated in canonical
profile PATCH and moderator decision batched update. The new public archive is
`/recognition`; both legacy creator channel directory and canonical member
surfaces use related identity components without fabricating account bridges.
`player-recognition-issuance-v066.test.mjs` uses actual in-memory SQLite,
executes `0010_player_recognition.sql`, and verifies once-only issuance,
moderator independence, no unapproved grants and sustained-conversation
recognition. After a test-count correction the focused PR CI succeeded at
https://github.com/anevum/anevum-web/actions/runs/39074494993.

The production Worker remains V064 at the time of this checkpoint. Recognition
is NOT active on production. The V062 base branch received concurrent new
first-contact homepage commits; V064 optical work is divergent. Do not blindly
merge, upload or activate the V065 branch over current production.

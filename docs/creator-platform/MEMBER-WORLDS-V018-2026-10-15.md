# ANEVUM Web / V018 Member Worlds
Session: `ANEVUM.WEB.BUILD.2026-10-15.002.MEMBER-PROFILE-PERSONALIZATION`

Status: **source implementation on draft PR #412**. No merge, deployment, Cloudflare route/secret change, migration application, or user enrollment is authorized by this work.

## Surface
Retain the approved V013 cinematic community shell, account editor and separate canonical Better Auth identity. A verified invited member can, after privately claiming one unique handle, choose a first-party visual atmosphere (Continuance, Nocturne, Evergrove), edit a 120-character headline, and choose up to four allowed creative focus tags. The editor previews these choices and saves them with the owner’s existing profile revision. First-time handle creation remains PRIVATE by default and intentionally requires a later separate save to publish.

Anonymous `/@handle` displays a profile’s name, biography, headline, safe atmosphere and tags **only** when the profile was deliberately made public by its verified owner. Inactive/unlisted/unverified profiles do not disclose existence. No email, opaque member ID, session, staff role, drafts, XP, achievement awards or legacy Creator account record is projected.

## Persistence
- `creator-v1/canonical-auth/migrations/0003_member_world_personalization.sql` extends **only** the separate canonical `MEMBER_DB`, `anevum-canonical-member-staging` (D1 ID `e1d29049-c83b-4534-8355-dc1fa36ba6d8`), already planned in prior source reviews.
- It adds checked headline, enumerated theme, JSON-array interest keys with safe defaults and no new roles or remote-asset permissions.
- The backend refuses account registration if the required schema columns are absent, even if environment feature flags are enabled. Older four-field PATCH clients keep existing personalization settings.
- Canonical profile writes remain authenticated, same-origin, rate limited, revision checked and keyed solely by the server session. No automatic V5/Creator OTP email or handle linking.
- No arbitrary upload, URL, custom HTML, executable markup or user-owned CSS is introduced.

## Verification
Require exact-head TypeScript, frontend and Worker CI, real in-memory SQLite migrations (0001 to 0003) and independent A/B ownership/privacy tests, route-denial regression and desktop/mobile browser snapshots. Ensure 320/390/1440px responsiveness, reduced-motion and keyboard focus.

## Outstanding release gates
1. Existing V017/#412 gates remain: protected-owner address denylist; two independently approved invited pilot identities; approved legal/age/privacy/account deletion and export behavior; secure Better Auth signing and scoped Resend secret provisioning.
2. Before migration, inspect the real isolated D1 migration ledger and verify backup **and restore**. Apply only to the dedicated canonical staging D1 after explicit release authorization. Do not confuse source tests with a hosted pilot.
3. Deploy only to the staged `a.anevum.com` review/activation route by separate owner-approved change. The currently deployed Worker remains read-only until then; `anevum.com` must continue to serve the January 1, 2027 countdown.
4. Verify genuine email delivery; login/logout; uninvited denial; expired/wrong OTP; handle conflict; A/B session isolation; private/public/refusal of other profiles; preference updates; revoked identity; and emergency rollback.
5. Keep Creator Studio uploads, playable embeds, player telemetry, awards, and XP disabled until separate canonical-to-Creator authorization and content moderation/storage/player security acceptance. Do not show invented statistics or achievements.

## Next build
After real account acceptance, integrate independent `creator-profile` personal-world projection with server-authorized creator publications, earned artifacts and moderation. Then move to the existing private uploader/embedded player drafts; treat application and game submission as a separate trusted content boundary.

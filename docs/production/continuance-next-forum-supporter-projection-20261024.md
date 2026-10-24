# ANEVUM NEXT — Privacy-safe public forum supporter appearances

**Session:** `ANEVUM.WEB.BUILD.2026-10-24.017.COMPACT-PROFILE-CARDS`
**Parent:** draft PR #700 at fixed head `d67d577968b202375e2316e115dd32339dbe7718`
**Status:** Draft child integration; no release or merge authorization.

## Scope

The existing `CompactMemberIdentity` already renders an earned member's avatar and evolution art, selected aura, badges, medals, ribbons, verified role, and a supporter seal/frame when a public API response supplies an authorized appearance. This continuation projects that optional **supporter appearance** through the public forum author payload, including moderated thread indexes, thread detail, and approved replies. Existing public-wall navigation and native contribution disclosure are unchanged.

No new endpoint, schema migration, checkout, provider write, XP grant, role grant, paid distinction, client-side private API call, or live production update. The parent #700's eight-file source guard is left unchanged; this child has its own independent nine-path exact-base CI, including a narrowly scoped forum-only supporter crest layout correction. V131 stays untouched.

## Data authority and permission boundaries

The public author projection already selects only verified accounts with `member_creator_profiles.visibility='public'`, and never serializes account IDs. `publicForumSupporterAppearanceMap` considers a maximum of 25 distinct verified profile identities per page. It first filters for the explicit `supporter_visibility.public_insignia=1` choice, public profile visibility, and `emailVerified=1`. For matching members only, it calls the existing canonical `readSupporterRewards(env,id,now,true)`, at most four concurrent lookups. That existing routine remains the entitlement authority: test-mode-only feature configuration, active subscription, fresh reconciliation, no refund/dispute hold, explicit public insignia consent, and actually unlocked visual choices.

The response contains only `supporterAppearance:{seal,frame,aura}` for eligible consented members. It does **not** expose customer IDs, source database identities, billing/status history, supporter tenure or stored preferences from an ineligible account. Missing schema, denied consent, stale status, unsafe provider configuration, privacy revocation, or failed lookups omit the field. No cache of member-private data or permission grants.

The supporter appearance preference is independently opt-in. Choosing `show_stats=0` still hides the earned level/reputation while an explicitly approved supporter frame may remain visible; withdrawing `public_insignia` removes the supporter art. Public badges, medals, verified roles and earned aura remain independently governed and cannot be minted or spoofed by this data path.

## Deliberate distinction: supporter seal versus constellation identity

The time-unlocked supporter seal named **Constellation** is not the same thing as a member choosing a public constellation affiliation. The forum still has no verified persisted public member-constellation preference source. Its optional UI type is deliberately unpopulated; no fictitious affiliation is presented as an earned recognition or selected identity.

## Verification and acceptance

The child workflow verifies the exact parent, all eight changed paths, no credential-bearing deployment route, dedicated consent/privacy/freshness/hold/disabled-source tests, existing canonical forum and supporter suites, strict React TypeScript, unchanged default-off production build, and real compiled Chromium browser screenshots at 1440, 1024, 390, and 320 px.

The browser fixture creates a clearly **synthetic** consented test-mode subscriber at a verified 120-day eligibility point with a Stellar Crown frame, plus an opted-out public reply. It requires the actual shared member portrait to carry `.av34-frame-stellar` and the public supporter seal to appear only on the opted-in author; its 28px icon treatment must not expand the collapsed forum card beyond the prior compact-height limit. The full supporter nameplate remains available outside the forum strip. Captures must not be represented as real member accounts or live ANEVUM rewards.

**Outstanding:** exact-head CI completion, source-bound screenshots and owner visual approval (#335), physical Safari/VoiceOver, real signed-in privacy/role A/B, cumulative OV03 branch guard reconciliation, protected integration strategy, and explicit production release authorization. No Cloudflare change, merge or V131 modification is permitted by this draft.

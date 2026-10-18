# ANEVUM V067: Canonical signup and community entry integration

Session: `ANEVUM.WEB.PATCH.2026-10-17.002.CANONICAL-ENTRY-COMMUNITY-INTEGRATION`
Engineering owner: [#325](https://github.com/anevum/anevum-web/issues/325)
Functional acceptance: [#480](https://github.com/anevum/anevum-web/issues/480)

## Scope

This is **SOURCE ONLY** on a pinned V062/V064/V065 3D-and-first-contact baseline. Do not deploy automatically. It integrates the existing V052 high-resolution OTP signup reconstruction from [#484](https://github.com/anevum/anevum-web/pull/484) with the existing V066 legacy community composer repair from [#481](https://github.com/anevum/anevum-web/pull/481).

### Preserved

- Four-door Play/Discover/Connect/Create homepage and responsive source artwork.
- All 30 native Evolution WebGL stages, optical/reduced-motion fallback and XP contracts.
- Existing canonical Better Auth email OTP, member profiles, staff review, private Studio and cloud database separation.
- Existing narrow, feature-gated forum authoring and independent approval; no public forum enablement performed.

### Changes

1. Replace the legacy `/community/write` member gate with a same-origin redirect to the moderated `/community?compose=1` discussion form.
2. Present an explicit, non-successful "forum disabled" notice if the authoritative backend is not activated. It never fabricates submission or publication.
3. Restore SVG-dimensional high-resolution `/join` appearance from V052 without modifying OTP/auth APIs.
4. Combine both sets of regression tests into `npm run test:release-v067`, include in full `npm test`, and retain canonical signup-specific checks.
5. Correct the V041 disabled-forum browser fixture: with feature OFF, visitors should see a truthful notice and no composer, rather than expect the entire forum section to disappear.

## Known CI blockers from independent PRs

- #481 focused V066 review passed, while full CI browser fixture timed out after it expected the obsolete hidden-forum layout at V041 capture line 177. The V067 fixture now checks the intended noninteractive disabled state.
- #484 full CI failed a read-only live signup canary (`LIVE_PROBE_FAILED`) from the Actions runner. This may reflect network/WAF or a real endpoint problem; **it is not waived** by a source-only test. Inspect the HTTP response through an approved independent channel and retain a red gate until verified.

## Release gates — not satisfied by this PR

1. Exact-head full CI, React typecheck, V065 homepage captures and V064 WebGL opt-out/mobile tests.
2. Separate authenticated owner/member/reviewer tests for OTP, profile persistence, new thread/reply, moderation, guest browsing and follow-up notification.
3. Reconcile Cloudflare 24 existing production bindings (including 4 opaque secrets, 2 D1 bindings) and preserve rollback version; do not use a deploy path that resets opaque secrets.
4. No `CANONICAL_FORUM_ENABLED` / staff / OAuth / upload / billing flag changes until real member and independent reviewer security acceptance.
5. Physical iPhone Safari 320/390 accessibility and reduced-motion checks; no public Reddit promotion before authentic completed member/community loop.

The first approved public project and rights review remain separate work in #329/#331. This review creates no accounts, no D1 writes, no charges and no public publishing.

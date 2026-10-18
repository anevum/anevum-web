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

## Functional audit continuation — canonical account route recovery

Session: `ANEVUM.WEB.AUDIT.2026-10-17.001.FUNCTIONAL-COMPLETION`. Read-only browser audit on October 17 (EDT) verified that `https://anevum.com/library` still displayed the retired invitation-only member gate while `https://anevum.com/saved` displayed the real, capability-gated canonical Saved Works state. The active main site uses `anevum.com`, and `a.anevum.com` is assigned to a retirement Worker.

A bounded V067 follow-up retires the old `/library` frontend route and redirects to `/saved`. The unused `MemberGate`/legacy library imports are removed from the public router. This **does not** enable currently disabled saves or move/merge member data; the canonical Saved Works page continues to check the authenticated Better Auth account, feature capability and server authorization before any read/write.

The profile editor previously told members receiving a same-origin 403 to open **a.anevum.com**, which is no longer the public origin. It now correctly instructs them to visit **anevum.com**, reload and sign in again. The actual same-origin credential mode, redirect denial and CSRF policy are unchanged. Historical staging policy tests retain the old stage URL solely as a negative/source test, not as user-facing product guidance.

Verification added to focused V067 source review:
- Legacy `/library` redirects to `/saved`, never to obsolete `MemberGate`.
- Current `/saved` remains protected by actual canonical session and capability.
- Origin recovery copy points only to the public origin and does not weaken header checks.
- Existing V041 forum and OTP identity tests continue unchanged.

**Deployment boundary:** still source-only. The Cloudflare gateway remains a separately governed production release; do not flip the forum flag, grant moderator roles, enable uploads, or promote arbitrary stacked branches. Preserve all opaque secrets, D1 bindings and rollback state.

**Live readiness snapshot:** apex gateway settings show open email registration and disabled creator uploads; new IREN staff routes are present but anonymous `/staff` remains sealed and the forum review API rejects anonymous callers. Canonical D1 read-only counts remain two verified accounts, one claimed public profile, one pending forum thread, zero published threads. A separately authorized non-author reviewer is still required before the pending thread can be approved.

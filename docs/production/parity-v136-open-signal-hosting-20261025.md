# ANEVUM / PARITY V136.019 — Open Signal Hosting Bridge

Session: \`ANEVUM.WEB.BUILD.2026-10-25.001.OPEN-SIGNAL-HOSTING-BRIDGE\`

**Status: draft, source only. No storage provider, Worker route, bucket, migrations, secrets, release toggles or production traffic changed.**

## Unified V136.025 integration checkpoint — October 25, 2026

- The authoritative V136 overhaul development branch is PR #735 at its owner-reviewed V136.025 merge. This is a **source-level development reconciliation** only, not a production merge, public-feature release or change to an immutable V136.024 canary artifact.
- PR #736 Open Signal sharing is **already present in the V136.025 parent by identical file content**, though its historical PR remains a draft. Do not create a second share panel, duplicate a release registry or re-introduce an old ProjectCard component.
- Source from this hosting bridge is grafted onto the V136.025 parent **without replacing** newer real React UI, first-party type-default thumbnails, preserved creator-uploaded covers, improved mobile navigation, concept-led Studio/Discover/Commons styling, or the one existing WebGL renderer. No generated stock illustration/filler artwork is allowed back into public listings.
- V136.026 Discover grid/list and URL-state work is pending in PR #748; it remains authoritative for that exact route. This hosting integration does not change DiscoverPage, ProjectCard, ParityDiscoverV136, query state or browser history and can coexist with its later accepted changes.
- Release operations (PR #742), Stripe retirement (PR #739) and IREN-onboarding corrections (PR #747) remain independent. This hosting PR does not change provider commerce, member privileges, support-agent behavior, or deployment flags.
- Merge this hosting PR **only after exact-head CI and Studio mobile/keyboard/real-member review** and through the parent V136 development sequence. Keep #325 the sole technical queue, #331 the discovery owner, #335 the visual-acceptance authority and #333 the production go/no-go authority. `Open Signal` is an internal feature family, not a parallel platform or top navigation destination.

 This change stacks after Open Signal sharing PR #736 and its existing V136 visual/release lineage. Do not merge the stacked diff independently.

## Truthful baseline: three existing lanes, different authority

1. **Creator-hosted URLs:** canonical member Studio accepts an HTTPS demo and/or repository link for a private project record. Actual public discovery requires staff-approved publication. The existing public project catalogue and passports remain the only public directory.
2. **Canonical private R2 asset vault:** \`creator-v1/canonical-auth/studio-assets.mjs\` already implements an isolated \`CREATOR_ASSETS\` binding, allowlisted upload flag, per-account **100 MiB**, max **20 files/project**, global **512 MiB** pilot budget, file format/signature validation, bounded R2 writes, reserved/quarantined states, private-download headers, owner removal and cleanup. **This is not public hosting.**
3. **Native browser-built projects:** \`creator-v1/web/src/lib/native-creator-v095.ts\` and \`NativeCreatorStudio.tsx\` expose separate pilot permissions, immutable build revision review, isolated runtime, and suspension/restore. HTML or ZIP uploads are capped; ZIP is 20 MiB and standalone HTML 5 MiB on the native upload UI, with max 180 expanded files / 48 MiB and 12 MiB per asset. No uploaded arbitrary server scripts on the main member origin. Feature toggles, exact backend readiness and production deployment must be verified separately.

The staged systems serve complementary purposes and **must not be concatenated into one unsafe public R2 read**. Existing owner/staff/user segregation, public project approval, account deletion/retention and provider release constraints remain authoritative. The product decision in #344 keeps creator-hosted-first.

## Added in V136.019

- \`creator-v1/shared/hosting-contract-v136019.mjs\`: pure, inactive manifest validator for **future** portable browser/static releases. Restricts relative paths, known static MIME types, 180 files/48 MiB expanded/12 MiB per asset, exact root \`index.html\`, duplicate path collisions, SHA-256 metadata. This does not establish that a source ZIP is safe; an isolated ZIP extractor, measured decompression cap, HTML/CSP auditing, malware screening and a verified source digest are still required.
- Immutable object key construction for **staged** vs **released** lifecycle, including owner, project, release and content hash. **A key is not an authorization:** the independent moderator's server-owned approval and copy+verification must be checked again before public delivery. Staged objects must be unreachable from public routes.
- Quota headroom and provider-rate-based *advisory* R2 storage/operations budget calculation. The canonical D1 transaction remains the only authority for actual reservations. Explicitly excludes compute, caches, email, abuse, scanning and moderation costs.
- \`creator-v1/web/src/lib/studio-hosting-v136019.ts\` classifies actual hosting paths (HTTPS link, private vault, gated native builds, proposed managed hosting). Future hosting is always labeled **planned**.
- An additive, responsive readout in the *existing canonical asset vault*. It reuses actual vault health and upload permission and doesn't add top-level navigation, another account or API endpoint. Native route affordance stays blocked until independent authorization can be retrieved; no privilege is inferred from a client flag.
- Node contracts and UI source boundary tests in \`creator-v1/test/hosting-bridge-v136019.test.mjs\`.

## Design of the full later system (individually gated, NOT implemented)

One project identity, one Creator Studio, multiple delivery providers:
- **External:** maker-maintained HTTPS links and static web apps; allowlisted protocols and human-owned public address validation. Never fetch arbitrary URLs from a privileged Worker without SSRF/network protection.
- **ANEVUM isolated static hosting:** after independent staff approval, release manifest/digest locked; isolated public runtime origin with separate cookies/CSP and no API, member auth or arbitrary backend execution; immutable version and stable link via server-controlled indirection. R2 is storage, not inherently an application sandbox or execution service.
- **Bring-your-own-storage:** start with manual URL configuration and verification of domain/project ownership. Do not take raw creator provider keys in web forms or log credentials. Later use delegated scoped credentials/OAuth or signed uploads, separate connectors, revocation, health, billing ownership and emergency failover.
- **External media/compute:** creator-managed streaming and servers for large video, multiplayer, GPU/AI; no promised free unlimited GPU/storage/bandwidth, no cross-origin trusted script embedding.
- **Future distributed storage:** evaluate content-addressing and multi-region replication only after demand, rights/takedown and cost evidence justify it. IPFS is not free data retention.

### Approved publishing lifecycle

\`private draft -> validated private asset/build -> immutable review submission -> independent authorized staff approval -> signed/staged release -> digest-checked isolated public replication -> live approved passport -> versioned update/rollback/suspension/takedown\`.

Never make a direct link to staged/quarantine objects public. CDN must purge revoked content under an explicit documented SLA. A creator should retain the project/profile/discussion identity when changing hosting location, with explicit disclosure of outages/fees.

### Quotas and sustainability

- Free project *records and core discovery* may be unbounded in product count, subject to spam/fair-use limits; don't promise unlimited always-on compute, uploads or storage.
- Existing pilot budgets stay exactly as configured. Increasing quotas requires usage metrics, D1 concurrency/lease policy, R2 pricing readback, capacity calculations, abuse and denial-of-wallet controls, refunds/account deletion and migration plan.
- Cost planner is intentionally provider-neutral, with user-provided validated rates; it must not be interpreted as a bill, estimate of user traffic, unlimited allowance, or permission to incur new provider expenses.
- Meter storage, retrieval/cache misses, upload bandwidth, image transformations, DB writes, scanned/approved bytes and delivery logs with opt-in privacy minimization. Do not rely on a frontend quota readout for enforcement.
- Make type-specific placeholder covers first-party neutral defaults when creator media is unavailable. No sitewide generated artwork requirements or visual redesign.

## Forward integration gates

1. CI + browser check for V136.019; verify 320/390/desktop, narrow vault layout, keyboard and assistive controls, account switch/in-flight cancellation. Existing visual-parity and Studio gates remain.
2. Independently inspect current native browser-build backend, release manifests, CDN delivery, R2 policy and exact migration ownership. Build **one read-only** server-side hosting capability endpoint only if it adds data not already provided by the current verified API.
3. One real, rights-cleared creator upload -> staff approved hosted build -> anonymous play -> suspension/rollback; prove private draft is inaccessible to guests and creator B.
4. Only then consider a second hosted provider or managed R2 release pipeline, with isolated origin, tested signatures, max-size parsing, quota reservation and purge policy, and owner-approved deployment.
5. Keep Open Signal launch/discovery/analytics/trends owned by existing #325/#331/#344 decisions; prioritize completion of P0 Creator V1 before speculative hosting expansion.

No files in this PR directly import the shared static hosting contract into a production Worker. It is deliberately an inert prerequisite for safe incremental development.

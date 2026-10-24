# ANEVUM NEXT — First Contact 133: discover → value → member

Session: ANEVUM.WEB.BUILD.2026-10-24.001.FIRST-CONTACT-CONVERSION
Status: SOURCE INTEGRATED IN NEXT; **review required; not production deployed.**
Lineage: V131 accepted (#655) → NEXT foundation (#676) → Community/profile (#677) → Living Commons concept (#678) → compiled Commons (#679) → V133 first-contact conversion PR.
Canonical board: #325. Owner visual approval: #335. Release acceptance: #655 / #333.
Base SHA at branch creation: 0809374c87b64f2837efdd1bd1a5ff489d3a45ad (#679).

## Why this slice exists

Live anonymous Cloudflare Browser Rendering on 2026-10-24 exposed a communication gap: the hero was "A universe in the making," with "Enter ANEVUM" and "Create your member space," while only one approved public release was indicated below. The visitor was asked to commit without an obvious benefit. This is a qualitative conversion hypothesis, **not** measured abandonment. At inspection the production canonical member database had 6 verified account records, with the newest dated Oct 20; Observatory V107 marked browser RUM and acquisition attribution unconnected (#683). No visitor or conversion numbers are invented.

## Product direction and reader promise

**Find something worth trying.**

Discover independent games, useful apps and creative experiments. Explore real projects for free, then join when something catches your eye.

Preserve the existing cinematic direction and identity: asymmetric celestial/orbital mark, warm cream/copper, ink-black/blue-violet world, delicate signal geometry, deep layered illumination, one IREN companion. Clarity is layered into existing React, not a second site, stripped redesign or generic SaaS landing.

## Implemented React surfaces

### Homepage — existing CinematicLandingPage

1. First screen identifies games, apps and creative experiments. New H1 "Find something worth trying"; primary "Explore real projects" routes to /discover; secondary "Join the early community" to the canonical /join or /member for a verified user.
2. Guest access, no-cost membership, creator-publishing limitations shown beneath the two actions.
3. A public **First Look** is placed immediately below the hero, before Wayfinder: first project from the existing approved public readProjects API, with source category, title, summary, author and safe internal project detail link. Legitimate public games are no longer excluded simply because they are games. This is a preview of a public project page, not a claim that ANEVUM hosts its executable.
4. Up to three **different** projects from that same genuine feed remain in the public index. Unavailable, loading and no-data states have honest copy and paths to Discover. No fabricated projects, social proof, counts or ratings.
5. Original IREN orientation, four Wayfinder paths, member identity, editorial charter, authenticated routes and privacy stay intact.

The First Look's CSS orbital artwork is explicitly decorative and **does not claim to be a screenshot of the featured project**. The actual project page remains authoritative for preview/demo availability, access terms, rights and disclosures.

### Signup — existing Phase1JoinPage

1. Join story now explains independent games, apps and creative experiments and that joining is free.
2. The email-first panel states the immediate free-member value in its headline/lead, with a compact supporting explanation of private identity, saved discoveries and *eligible* recognition after the email action. The supporting section stays below the primary mobile action and is hidden once an OTP is sent or special email verification is required, preserving short mobile viewports.
3. Canonical Better Auth, email OTP, resend and limits, social provider status, errors, private defaults, existing optional IREN orientation and join buttons remain unchanged.

## Visual implementation

Additive continuance-first-contact-v133.css imported **after** V125 visual foundation. Existing route and class contracts remain. Not another category icon grid or made-up thumbnail.

At 1440px, cinematic arrival leads to a two-column First Look with editorial copy at roughly one-third and genuine release card at two-thirds; layered dark gradient surfaces, warm copper-peach highlights, violet/silver rings and carefully chosen cyan/green metadata. <=760px stacks first-look intro and card; <=650px reduces spacing and type without reducing touch targets; <=380px the card stacks art above data, preventing clipping. Preserve safe long-title wrapping, clear keyboard focus, reduced-motion, forced-colors and honest loading/empty/error states. Main actions must be at least 44px.

The existing V125 motion control is retained rather than changed as part of this targeted conversion slice. There are no additional animations, external images, fonts, backend calls, WebGL or tracking.

## Data, privacy and release boundaries

- Read-only existing approved public catalogue API. No staff/private data.
- No new data collection, cookies, beacons, UTM attribution, experiments, Worker writes, migration, auth/provider mutation, XP, email blasts, creator publishing, permission widening or account changes.
- Acquisition conversion is still unmeasured: Observatory V107 registration aggregates do not constitute visitor counts, nor do Cloudflare requests count as unique people. Add consent-aware measurement only in its separately reviewed #683 lane.
- V131 accepted production (#655), any ongoing V132 canary, Creator Studio #658, Public Surfaces #667, NEXT #679 and frozen migration0014 remain separate.
- Proposed eventual success metrics: approved project opens, Discover engagement, verified account creation and meaningful return, with bot/test filtering and privacy controls; no unsupported numbers.

## Acceptance plan and evidence

First-contact-conversion-v133.test.mjs checks the real React route, public-data derivation, no game exclusion, CTAs, truthful join copy, OTP safety, CSS/accessibility and no new analytics. Legacy V111/V114/V123/V124/V125 expectations updated to the current copy, preserving original functional guards. The existing compiled homepage capture runner additionally verifies the authentic First Look and screenshots 1440/390/320 widths. Existing compiled signup runner verifies form and OTP states at all three widths.

The exact-head read-only workflow continuance-first-contact-v133-qa.yml runs source assertions, typecheck, default/staging builds and compiled Chromium acceptance. It has blank provider credentials and **no deploy step**. CI and retained screenshots must be checked rather than presumed green.

Owner review (#335) is required for the real 1440 design first and matching 390/320 mobile. Also confirm signed-in and guest actions, actual approved project, no false playable claims, independent account OTP behavior and empty/error states. Physical iPhone Safari and production release permission remain separate gates under #325/#333.

This PR is a successor review artifact, **not a deployment of V133**.

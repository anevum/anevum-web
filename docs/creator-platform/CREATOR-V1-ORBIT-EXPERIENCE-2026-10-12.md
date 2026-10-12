# ANEVUM Creator V1 — Orbit-led public experience implementation

**Session:** \`ANEVUM.WEB.BUILD.2026-10-12.003.ORBIT-CREATOR-EXPERIENCE\`  
**Design authority:** [01 ORBIT selection](ORBIT-MARK-ADOPTION-2026-10-12.md), [V1 development #325](https://github.com/anevum/anevum-web/issues/325), [launch #308](https://github.com/anevum/anevum-web/issues/308).  
**Scope:** Build a coherent, accessible and real-data public shell on top of the existing V1 backend. Preserve the auth, publishing, staff and member security foundations. Not a blank-repository restart.

## Implementation slice — source only
- New permanent \`creator-v1/site/shell.html\` and \`shell.css\` take over from the embedded 2026-10-11 fictional design-preview markup. Keep the original \`community-preview/worker.js\` only as a source of approved illustrative WebP artwork and historical reference.
- Canonical shared \`BRAND_MARK\`, \`BRAND_CSS\`, and \`BRAND_FAVICON\` are injected from \`creator-v1/shared/brand.mjs\`; do not fork local logos or gradients. Copper/orange, cream, dark charcoal and controlled violet belong to the **Orbit** mark; the rest of the site is content-first.
- Rebuilt route client with real hash-free URLs, History API, popstate and reload support: \`/\`, \`/discover\` with query/category/cursor, \`/projects/:id\` public details, \`/status\` real read-only feature status, \`/about\`, and honest informational \`/create\`, \`/community\`, \`/library\`, \`/account\` until accepted member gates open.
- Public API unchanged: \`/api/v1/status\`, \`/api/v1/categories\`, \`/api/v1/projects\`, \`/api/v1/projects/:id\`. Project links are server-validated HTTPS and are independently escaped client-side; no third-party code executes on ANEVUM.
- Responsive compact desktop rail, search (keyboard \`/\` shortcut), mobile five-item navigation with visible labels, skip-to-content link, reduced motion, focus management, busy state, service-error vs genuine empty state, no mocked counts or fake reviews.
- Existing concept art is explicitly distinguished from live published community projects. The first real project must be owner-authorized, genuinely submitted and moderated—never invented to fill the homepage.

## Required next vertical slice (NOT delivered by the public shell)
1. Security-reviewed member identity and two-member/staff isolation acceptance at the actual staging origins.
2. Real creator draft/edit/submit → separately authenticated staff review/publish → anonymous public detail visibility → independent reviewer/saver/XP → moderation reversal.
3. Unified public/member navigation and real persistent member features only after the security and permission gates pass.
4. Device screenshots and real browser acceptance at 320, 390, 1024, 1440; test keyboard, reduced motion, contrast, loading, no-content, errors and overflow. A source CI pass is not visual acceptance.
5. Versioned production D1 backup/restore/rollback and final launch authority. Do not route isolated staging DB or member credentials into production.

## Existing boundaries preserved
- Public \`anevum.com\` remains read-only Creator V1 0.1.0 until an exact reviewed release is separately approved.
- Existing member/staff staging has implementations but is not public acceptance. No staging credentials, new signup, secret changes, brokerage, payouts, commissions, arbitrary app hosting, Discord migration or new service spend here.
- Origin/source, privacy, anti-abuse and moderation decisions tracked in #328/#329/#330/#331/#332/#337 remain necessary.
- January 1, 2027 is the opening target, **not** a reason to present unaccepted source work as production-ready.

**Acceptance of this slice:** V1 build, backend fixtures, public shell tests, brand regression and exact-head GitHub CI must pass before browser review.
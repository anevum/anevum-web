# ANEVUM.WEB.AUDIT.2026-10-27.001.SITEWIDE-VISUAL-LINKS

**Date:** 2026-10-27 EDT / 2026-10-28 UTC
**Scope:** ANEVUM live V69 read-only visual and link review, followed by a production-flagged V142 candidate using the existing V141 original-orbit branding source.

## First-pass evidence

- Live read-only screenshot job: [40630437774](https://github.com/anevum/anevum-web/actions/runs/40630437774).
- 41 real static, gated and legacy-redirect paths visited in Chromium at 1440 and 390 CSS-pixel viewport widths (82 page screenshots plus two opened navigation drawers).
- 1,516 visible anchor observations, 178 distinct link-text/destination combinations, 72 distinct destination URLs.
- **0 observed invalid, obsolete-alias, unknown-internal, missing-fragment, broken-image, HTTP-error, JavaScript-exception or horizontal-overflow issues** in the first-pass collection.
- Legacy aliases /atlas/orbit, /workspace, /account, /account/edit, /account/studio, /create, /create/new, /sign-in, /member/setup and /thebutton redirect rather than becoming promoted public navigation links. Keep redirects for historical bookmarks.
- The initial screenshot collector is intentionally read-only and quick; asynchronous pages such as Status, member Studio and Recognition were sometimes captured during loading or permission checks. Those screenshots do not establish full authenticated feature acceptance. A separate production-flags compiled-browser screenshot suite verifies the changed public pages and guards.

## Visual / semantic issues discovered after reviewing screenshots and actual source

1. Public top-header button said **DEV LOG** but linked to the current real **Status** page, not a distinct development log. Label corrected to BUILD STATUS, same verified path.
2. Console Home rail card was described as **Studio**, even though the existing homepage is the SEVERANCE presentation. Corrected subtitle to Entrance.
3. Discover's **How publishing works** went to the general Field Guide rather than the verified current publishing/service-status report. Corrected text and target to Publishing status → /status.
4. The quick switchboard prioritized legacy broad platform categories without the current original SEVERANCE project. Added /severance as a real public entry; retained searchable categories and their actual published catalogue filters; status remains default visible.
5. The public Support page still showed outdated subscription prices, test membership/Stripe checkout destinations and a link promoting the old paid supporter collection. Replaced with explicit **no paid enrollment, no checkout** messaging and current-game/status links. Removed generic Support ANEVUM promotion and the stale Supporter Studio destination in the member dashboard. Historical private profile/cosmetic data, legal/account records and deep links remain untouched.
6. Remaining platforms (Discover, Creator Studio, Commons, Boards, Field Guide, recognition, private member/library and IREN) remain valid and routed; remove no working functionality merely because it predates the current game-first branding.

## Implementation boundaries

- Frontend-only changed navigation/copy. No new API, role, authentication, billing action, Stripe transaction, Cloudflare Worker gateway, D1/R2 schema, Creator Studio write path or permission modification.
- Existing original V139 cinematic assets and V141 orbital icon/share branding are reused. Do not restart branding or overwrite published immutable asset URLs.
- Existing historic deep links, protected creator routes, public project records, member/account export and read-only financial/history surfaces remain available.
- Source tests prohibit any new public supporter checkout and verify current game links. The compiled-browser suite checks responsive screenshots, current routes, open switchboard and current-stage game status.
- Do not publish until the exact PR head passes source, browser and desktop/mobile checks. The current live release was **V69 at 100%** when this audit was recorded; V141 icon/share versions V70/V71 were uploaded **inactive**. A Git merge is not a Cloudflare deployment.

## Next-gate checklist

1. Review actual compiled V142 screenshot and link-acceptance results at 1440 and 390 CSS pixels.
2. Ensure that no paid enrollment CTA or obsolete destination survives public/current member navigation.
3. Merge this reviewed V142 audit branch into the existing V141 workstream, preserving source history.
4. For any subsequent production release, use a separate exact-source frontend/asset-superset release. Retain the V69 and V141 rollback candidates, 26 bindings, 45 routes, and the controller Worker, and verify traffic plus static media after cutover.

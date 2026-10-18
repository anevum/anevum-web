# ANEVUM Porchlight V002 - Event Desk visual / UX reconstruction

Session: ANEVUM.ANEVUM.DESIGN.2026-10-18.001.PORCHLIGHT-DEMO-RECONSTRUCTION

Status: PRIVATE FOUNDER DESIGN REVIEW ONLY. NOT CUSTOMER READY OR DEPLOYED.

## What changed from V001

- An actual fictional event is visible immediately instead of a large generic orbit hero.
- The first view shows event details, a detailed illustrative neighborhood field map, and sample operations data.
- A visitor can search and filter voluntary stops, inspect fictional pinned locations, and save a session-only plan.
- A schedule and public event bulletin demonstrate what visitors would return for.
- A simulated organizer desk demonstrates household approval, event updates, volunteer assignment, and emergency closure.
- Permission, privacy, and no-tracking remain visible without dominating the first screen.
- Animated, dimensional, full-resolution vector map presentation; responsive down to 320px with reduced-motion support.

## Build and review

The user-reviewable file is `porchlight_v002_review.html` at the top of the ZIP. It has its CSS/JS embedded and uses no network, browser storage, paid tiles or personal data. `index.html`, `styles.css`, and `app.js` are editable sources.

The fictional map is NOT geographically accurate, routable, or an approved street basemap. This prototype does not connect to Cloudflare, the V001 D1 database, an actual event, any resident or emergency services. All record counts, dates, pinned locations and operator actions are simulated.

Use the local demo in a browser to inspect:
1. Event overview and illustrated map above the fold.
2. Filter/search fictional participating stops and add some to My Evening Plan.
3. Review the event schedule and organizer notices.
4. Approve one area-only test request; ensure it appears in the list without a new exact-location pin.
5. Publish a fictional notice; verify it appears in the public bulletin.
6. Simulate a volunteer assignment and emergency closure; all public demo stops must disappear.

## Acceptance before showing any prospective customer

- [ ] Founder accepts first-view hierarchy, typography, navigation, motion, content, and map presentation on actual mobile.
- [ ] Product promise narrows to operating a real event for a coordinator, not building a generic social or guardian-tracking platform.
- [ ] Real licensed geographic/map integration or a legitimately useful event-location alternative replaces the fictional illustration; no fake navigation.
- [ ] Organizer onboarding, event creation, staff roles, private host approvals, updates, and emergency closure are integrated with the V001 server-side privacy and moderation controls.
- [ ] Clearly usable event guide works on physical iPhone and Android devices, slow connections, reduced-motion/keyboard/screen-reader paths, and low bandwidth.
- [ ] Organizer can use the finished workflow to create, publish, update and close one real approved event without developer intervention.
- [ ] Liability/privacy/consent terms, location disclosure, participant removal, backup/restore, support coverage and hosting costs have been verified.
- [ ] One independent adult organizer completes a full test and identifies an actual problem solved. Founder explicitly signs off before outreach.

V002 is a direction worth reviewing, not evidence that any criteria above passed. Do not merge V002 review code into the live ANEVUM site, enable new Cloudflare routes, purchase hosting or contact customers on the strength of this demo.
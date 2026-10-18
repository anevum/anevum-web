# ANEVUM Porchlight - Pilot Foundation V001

Session: `ANEVUM.ANEVUM.BUILD.2026-10-17.001.PORCHLIGHT-PILOT-FOUNDATION`
Master program: https://github.com/anevum/anevum-web/issues/489
Status: **isolated, demonstration-only source**. Not live, not verified home participation, and not a safety service.

## Current working deliverable

Open `index.html` in a browser (download the file or use a static web host). A downloadable handoff bundle also includes an equivalent `standalone.html`. It is fully self-contained and does not request network resources, device location, or personal information. Six **fictional** house labels live on a synthetic diagram with nongeographic coordinates and fictional street names. No real households, invitations, routes, safety reports, or emergency contact requests are recorded.

Implemented in the prototype:

- Responsive Continuance Institute / ANEVUM visual shell with a schematic dimensional neighborhood, 2D/3D view switch, and zoom controls.
- Keyboard-selectable diagram markers and an accessible parallel listing; filters for treats, non-food options, decorations, and self-reported step-free entry.
- Click-to-plan illustrated eight-stop route with add/remove/clear controls, in page memory only, no persistence or navigation.
- Plain-language safety guidance and prominent repeated warnings that the data are synthetic, no property is certified safe, and the app is not an emergency responder.
- No location permission prompt, child profile, payment, personal data collection, registration, public crime watch, third-party data request, cookies or tracking scripts.

The existing independent MapLibre 3D engine prototype at `prototypes/family-safety-3d-map/index.html` in branch `build/family-safety-3d-map-v001-20261017` is **not** included or deployed by this bundle. Its consenting-private-family prototype controls must never be conflated with public event house pins. Real 3D map integration is a separately accepted milestone after provider licensing, privacy and mobility testing.

## Implementation boundaries before real users

1. Obtain an appropriate adult host's explicit, versioned, event-specific opt-in, including public display fields and a genuine, verified withdrawal mechanism. A submitted pin is never automatically published.
2. Verify the applicant may list the property; require an authorized organizer with individual authenticated access, server-enforced permissions and an auditable approve/unpublish action. No shared password, client-only admin mode, or unprotected public submissions.
3. Publish only consented, currently approved event pins during event hours. Keep private contact/address details inaccessible to public endpoints, analytics, creator accounts, and unrelated staff.
4. Provide an immediate report/unpublish path, moderation coverage during the event, abuse-rate controls, event expiry and an emergency kill switch. Practice them before publication.
5. No public family position sharing, child accounts, biometric tools, citizen crime accusations, stranger messaging, camera aggregation, safety certification, or emergency dispatch.
6. Verify city/county permit applicability, terms/privacy, mapping license, business/insurance/legal boundaries, production backup and rollback before any public live-event service or paid event.
7. Test as anonymous, host A, unrelated host B, organizer, and revoked organizer. Test unauthorized modification, stale cache/pins, false property submissions, XSS, revocation, screen readers, 320/390px mobile and failed third-party map layers.

## Proposed live pilot workflow (not implemented yet)

Adult host submission -> pending organizer review -> identity/permission confirmation -> consent recorded -> published only during authorized event window -> self-service opt-out or organizer unpublish -> automatic expiry -> retention/deletion.

Do not put real household contact details or addresses into a public GitHub repository. Start with one neighborhood and 10-20 willing hosts only after privacy and operations gates pass. If any gate fails by October 31, provide a safety-information-only page instead of public house pins.

## Validation evidence for V001

- Local Node 22 `domain.test.mjs`: five passing tests (fictional fixture bounds, filters, sample route toggling, route limit, zoom).
- Headless Chromium (Playwright) synthetic-browser desktop 1440px and mobile 390px: six initial cards, filter to three non-food cards, toggle a sample route stop, 2D/3D toggle, zoom, zero page errors and no horizontal overflow.
- Browser checks used a fully inlined equivalent of the script bundle because local network requests were blocked by this test environment; the delivered `standalone.html` is already fully inlined.
- No staging or live deployment, security approval, real-user E2E, map-provider test or accessibility certification has been performed.

## Near-term owner decisions

- Name an actual volunteer event organizer and test-home outreach method.
- Agree whether participants may consent to exact pin placement or only a public-facing block marker, and how verified withdrawals will work.
- Confirm a maximum zero/new-spend cap for this pilot, unless a necessary legal/insurance expense is separately approved.

Keep Creator V1 issue #325 / launch #308 unchanged. Next engineering deliverable: isolated, authenticated organizer + consent + revocation service with independent permission tests. Never connect the current fictional demo directly to a production D1 table without that acceptance.
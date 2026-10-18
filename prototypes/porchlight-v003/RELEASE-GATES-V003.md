# Porchlight V003 - Release gates and open liabilities

Status: ALL REAL-WORLD ACTIVATION GATES OPEN. Local tests and draft pull requests do NOT authorize real residents to submit household addresses.

| Gate | Evidence required before inviting real households | Current state |
| --- | --- | --- |
| Approved product/event scope | Named neighborhood, volunteer coordinator, event ownership, legal/permit check | Open |
| Verified identity | Server-side session issuer, age eligibility review, recovery, MFA for staff and revoked-session tests | Open; fixture-only |
| Household control | Independent organizer verification with clearly documented method, appeals and incident support | Manual declarations only |
| Consent | Legally reviewed event-specific notice, visible precise/general-area choice, public preview and revocation | Proposed V002/V003 code only |
| Host removal | Immediate next-read redaction plus remote cache invalidation, open-page refresh and record purge | Partial; API scrub tested, browser refresh tested, no purge |
| Reports and abuse | Abuse-report intake, moderation response schedule, emergency removal, throttling, false-publication escalation | Open |
| Staging | Separate approved Cloudflare Worker+D1+secrets; real same-origin auth; verified isolated migration/restore | Not provisioned |
| Personal data lifecycle | Time-bound deletion of rejected/withdrawn/expired accounts, audit privacy review, backup expiry, export and recovery | Open; address scrub only |
| Accessibility | Real iPhone Safari/VoiceOver and Android TalkBack, 320/390px, reduced motion, low bandwidth | Desktop Chromium visual fixtures only |
| Costs | Provider billing and capped hosting/tile usage reviewed; no unauthorised spend | No new spend |
| Independent acceptance | True separate real adult host A, host B, event organizer, guest, revocation and tampering across deployed network | Not performed |
| Authorisation | Founder go/no-go for exact source, public route, legal copy, data handling and emergency operator | Not granted |

## Tested to date
- Node 22 V002 regression plus V003 route and scrub tests, static UI checks.
- Actual Chromium DOM/interaction checks at 1440 and 390 widths, through localhost test fixture API bridge. Because browser navigation was policy-blocked in this environment, Chromium ran the inlined source DOM and explicitly injected a test-only `fetch` bridge; this is not the same as network browser testing of a hosted Worker.
- No real accounts, real houses or external API requests were used. No final security or accessibility signoff.

## Next contained action
Complete real identity-adapter requirements with the security owner. If that cannot be accepted before Halloween, show only public safety guidance and fictional preview, **not** real home pins. Do not bypass due dates, operating costs, or demand for a visual launch.

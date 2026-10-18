# ANEVUM Porchlight — Halloween 2026 Pilot Operating Packet

**Status:** Draft for founder and organizer review; not public enrollment, consent collection, a city event permit, a security service, or a signed legal agreement.

**Session:** `ANEVUM.ANEVUM.BUILD.2026-10-17.001.PORCHLIGHT-NEIGHBORHOOD-PILOT`
**Source:** [Safety plan #489](https://github.com/anevum/anevum-web/issues/489) · [Isolated source PR #493](https://github.com/anevum/anevum-web/pull/493)
**Intended window:** October 17–31, 2026; optional evaluation November 1–7.

## Objective and boundaries

Use one neighborhood and one consenting adult organizer to test whether a voluntary holiday/event listing is genuinely useful to local households. This is a **directory**, not a government-sanctioned event, patrol, child tracker, safe-route certification or 911 alternative. No one is required to join, provide a precise location, or create an account.

For the pilot, require all of:
- At least one named, reachable adult organizer who accepts private-submission handling responsibility.
- Consent from each household's authorized adult before adding any home.
- A tested on-demand listing takedown, an event-wide unpublish switch and seven-day-after-event retention expiry.
- Clearly distinguish organizer verification of **permission to list** from verification of **physical safety**.
- An actual cost, source and rollback review before any new Cloudflare resource, public route or credential is enabled.
- Two independent adult testers on physical mobile devices. Browser simulator tests do not substitute.
- **No child profiles, guardian location tracking, public family routes, crime allegations, cameras, private chat, or monitoring claim**.

If any privacy, cost, permission, reliability or operational gate fails, run an information-only event guide instead and do not publish home pins.

## Consent and guardian information

**Publicly visible only after review:** event name/general neighborhood/time; for area-only households, the generic name "Participating household", event neighborhood and opt-in options; for exact-location households, the approved host name, approved public location label, exact coordinates and opt-in options. A host must explicitly consent to exact public location.

**Private to authorized organizer:** submitted adult display name, address, email, selected visibility and note, pending/rejected status, verification method and report text. The private report queue must not be forwarded to a community group. Do not collect child names, ages, school schedules, precise family routes or live presence.

**Withdrawal:** Keep the long removal receipt securely. Submitting the ID and receipt through the removal form immediately unpublishes a live listing and scrubs private address/contact and related free-text reports in one database transaction. The code is not emailed or stored in browser persistence. If lost, ask the event organizer to use the authenticated withdrawal function.

**Retention:** Automatically expire public pins when the event closes or reaches end time. The isolated scheduled cleanup deletes event and linked host/report/audit data seven days after its end. Source tests check the cleanup, but the live scheduled handler must be verified in a nonproduction environment before enrollment. Backups must also have limited access and defined expiration.

**No guarantees:** Listings may be inaccurate and are not certified safe. For immediate danger or emergencies, call 911; ordinary issues go to an appropriate non-emergency public agency or the organizer. The organizer is not continuously on call unless genuinely staffed.

## Actual pilot acceptance checklist

- [ ] Identify one neighborhood and check with residents whether the scope is wanted.
- [ ] Secure written organizer approval, contact method, and an escalation plan for unwanted or incorrect pins.
- [ ] Check St. Cloud / Osceola County special-event rules if doing anything more than publishing a voluntary directory; do not imply an official partnership.
- [ ] Confirm a no-extra-cost—or expressly approved capped cost—deployment plan, isolated database ID, traffic ceiling, and provider terms.
- [ ] Review participant notices and the event-specific privacy/consent copy with a qualified reviewer as appropriate.
- [ ] Confirm **all** test domains/Workers have no routes into Creator V1 or RHEN identities, databases, secrets or payments.
- [ ] Verify three independent roles: anonymous visitor (public approved fields only), host (submit and withdraw only), authorized adult organizer (private review/close).
- [ ] Verify duplicate submissions and rate limits, unauthorized event edits, an incorrect organizer token, malicious host text, bad origins and overlong bodies.
- [ ] Test actual staff revocation, on-screen notice, mobile Safari at 320/390 px, keyboard navigation and reduced-motion rendering.
- [ ] Confirm event close immediately hides every pin, rejected hosts do not retain identifying details, and state/audit changes roll back together on simulated errors.
- [ ] Rehearse D1 export/restore on the **separate** Porchlight instance, not the public member databases.
- [ ] Verify removal path before any promotion. No customer trial without a host withdrawal escape hatch.
- [ ] Publish only after all gates and founder signoff, never by merely changing a feature flag.
- [ ] Run the event with a named reachable organizer; log anonymous aggregate page visits, voluntary feedback and actual complaints (no location tracking).
- [ ] Within seven days, verify expiration and delete unneeded private data. Record operating costs, host experiences and whether organizers want this again.

## Proposed role assignments

**Founder:** source and budget approval, privacy/security and final production release/rollback authority; no implied police or emergency role.

**Local adult organizer:** verifies homes via direct authorized contact, approves or rejects submissions, handles removal/escalation and keeps contact records private. The initial standalone bearer-token mechanism is a **pilot limitation**; it must not become a general-purpose staff account.

**Participating host:** selects visibility, confirms authority, maintains consent and can withdraw. No home is automatically added just because its address appears in a public map.

**Visitor:** views a list of approved participants without login and understands the absence of physical safety certification.

## Suggested adult outreach (do not broadcast without organizer permission)

> We're testing a free, voluntary neighborhood Halloween directory for families. It will list only households that choose to participate, and the homeowner/authorized adult controls whether their exact address appears. No children's locations or private routes are tracked. Would you be willing to look at the prototype and tell us what would make it useful or uncomfortable? We're not asking you to list your home yet.

Use only established contacts or opt-in conversations. Never scrape a public resident directory or mass-message homeowners.

## Organizer interview — five questions

1. How do you coordinate households and visitors for seasonal events today?
2. What information would you allow in a public directory? What must remain private?
3. What would you require before approving a resident's home?
4. How would residents contact you to remove unwanted or inaccurate information?
5. Would you organize another event with these tools? What would an organizer budget reasonably support, if anything?

## Product/financial go-no-go

**Pilot hypotheses, not claims:** 10–20 consenting host households; 25 or more real visiting households; most feedback says information was easy to understand; all unwanted pins removed promptly; 1–2 organizers willing to discuss paid organizational tools.

Do not infer that low accident counts prove the app prevented harm. Do not charge participants for safety, emergency responses or access to guardian information. Discuss an organizer service only after meaningful use, clear costs and business/legal readiness.

## Current actual state (source review)

V001 ships source only on a draft GitHub PR; isolated Worker example is deliberately non-deployable until a private new D1 binding is supplied, and all opening flags are OFF. The list, map schematic, consent form, organizer review, takedown and retention have synthetic unit/browser tests. No current live organizer, consented household, physical iPhone acceptance, official permission, public traffic or paid revenue is verified.

**Next release decision:** founder reviews privacy and actual provider costs. Only then create a separate preview D1 and private organizer access; a full public rollout remains a later decision.

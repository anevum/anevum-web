# ANEVUM / SITES — Service operating plan
Session: ANEVUM.WEB.BUILD.2026-10-19.001.CLIENT-SITES-STUDIO
Status: Pilot in active development (not an agency incorporation or full public service launch)
Date: 2026-10-19
Owner: Devon Akins · devon@anevum.com
Brand: ANEVUM Sites, part of ANEVUM

## Purpose and boundaries

Build a small, family-compatible web-design service with visible work rather than sales promises. Bring useful, clearly labeled website concepts to local businesses. Use common technical foundations and a disciplined scope to charge dramatically less than conventional agency projects.

Sites is a service line under ANEVUM, not a replacement for the community/creator platform, RHEN, or family priorities. Avoid buying another domain until the service has paid clients and an independent brand is demonstrably useful.

**Public showroom:** https://web.anevum.com  
**Owner-only workbench:** https://sites.anevum.com  
**First pitch concept:** https://web.anevum.com/preview/tobacco-vapor-time  
**Business contact:** devon@anevum.com  
**Source branch:** build/anevum-sites-pilot-20261019-001  
**Cloudflare Workers:** anevum-sites-public-v001, anevum-sites-workshop-v001  
**D1:** anevum-commission-sites-workshop

The public showroom is read-only. It must not expose internal prospect notes, private quotes, account identities, database credentials, employee details, source secrets, or card numbers. Public drafts default to noindex. The workbench must remain owner-only, with Cloudflare Access JWT verification at the Worker and no workers.dev bypass. The existing lab is independent and stays intact.

## The commercial offer

These are starting **prices for fixed scopes**, not universal quotes. Check actual time spent for the first three paid jobs before changing pricing. Never advertise a package that includes an unspecified amount of custom work.

| Package | Pilot price | Exact inclusion | Revision limit | Internal time target |
| --- | ---: | --- | --- | --- |
| Founding Site | $49, first **three customers only** | One responsive landing page, up to 4 simple sections, client-supplied brand/copy, call/maps/contact links | One consolidated round | 60–90 min |
| Starter Site | $99 one-time | One responsive page, up to 6 sections, basic metadata/SEO, accessibility and device checks | Two consolidated rounds | 2–3 h |
| Business Site | $199 one-time | Up to 3 pages, lightweight consistent design system, on-page metadata, responsive testing | Two consolidated rounds | 4–6 h |
| Custom build | Quote only | PWA, interactive features, booking/integration, ecommerce, backends, databases, custom illustration, extensive content work | Written statement of work | Estimate first |

"One revision round" means the client delivers one consolidated list of requested changes. It does not mean unlimited iterations. The stated price covers only client-provided content and authorized/licensed assets. Site costs, hosting, premium fonts/assets, third-party integrations, paid software, professional copywriting, photography, search ranking services, and domain renewals are outside the included price. Do not claim guaranteed SEO rankings or app-store distribution.

A basic mobile-friendly website need not be a PWA. App-like installation and offline behavior require a separate technical and maintenance quote; do not use "PWA" as a blanket marketing promise. If legal, regulated, age-gated, health, financial, accessibility-specific, or payment requirements apply, quote only after reviewing those obligations.

**Care plan (optional):** From $15/month for up to one small text, address or opening-hours update monthly during business hours; larger updates and code changes separately quoted. Do not imply unlimited support or indefinite hosting from the $49 one-time price.

**Control of ownership:** The client should register and control their own domain and DNS whenever feasible. State clearly in writing which code, copy, artwork and third-party licenses they will own or receive after final payment, plus which services remain under ANEVUM hosting. Offer handoff to client-controlled infrastructure or a separate, transparent hosting plan. No lock-in or surprise renewal.

**Pricing stop rule:** Calculate gross hourly sales revenue:
\`gross_hourly = collected_project_fee / actual_hours\`
A $49 project at 1.5 h is $32.67/h before taxes, expense and customer acquisition. At 5 h it is only $9.80/h. If projects routinely exceed time target, simplify scope or raise rates. Review every three deliveries.

## Sales and service pipeline

1. **Identify:** Select a real local business with a weak or absent website. Use only publicly available business details, not employee/private information. Budget 5–10 minutes of research.
2. **Concept:** Make a focused, mobile-first draft using a template and existing building blocks (target 20–45 minutes for a one-page proof). Do not use unlicensed logo/photos or imply business endorsement.
3. **Visit:** Open the preview on a phone, show the one obvious benefit (hours, directions, calls, menu/services). Ask if they want it personalized. Keep the pitch under 5 minutes if busy.
4. **Pitch recorded:** Change workbench stage from \`concept\` to \`pitched\`. Record the next follow-up in internal notes; no automated outreach or unsolicited mass messages.
5. **Agreement:** Before billable work, agree on deliverables, business-provided assets, exact price, number of revisions, expected turnaround, who controls domain/hosting, ownership, legal notices and how changes are approved. Record a confirmed contact and permission to publish.
6. **Build & QA:** Verify real copy, hours, contacts and links with management; test desktop and 320–430px mobile widths, tap targets, responsive overflow, labels, keyboard navigation, reduced motion, 404 behavior, loading and basic security headers.
7. **Approve:** Obtain explicit written signoff for business representation and final preview. Move to \`approved\`. An internal stage change is NOT permission to publish any unapproved assets.
8. **Payment & handoff:** Invoice the agreed amount, reconcile actual receipt, transfer agreed deliverables and then publish or move to client-owned Cloudflare infrastructure as arranged. Cloudflare routing does not itself process payments.
9. **Live & follow-up:** Mark \`live\` only when the customer domain is operational and verified. Offer voluntary maintenance, document support terms and request feedback. Archive rejected/inactive work rather than treating drafts as official sites.

The existing private UI currently supports concept creation, editable presentation details, status changes, quote categories and private notes. It is not an accounting package, contract e-signature system, CRM automation, complete multi-tenant website builder or payout platform. Quoting, consent and invoices need separate documented steps during the pilot.

## Proposed lightweight communication script

"Hi, I stopped in earlier and mentioned that I build small-business websites here in Central Florida. I made a quick, unofficial design concept to show what your business could look like online. It has the location, hours, and a way for customers to contact you. If you like it, I can customize it properly for a small fixed price. Can I show you the phone preview?"

Do not say the site is commissioned, endorsed, connected to business ownership or published for the business when it is only a concept.

## First local study — Tobacco Vapor Time

Pilot concept, not a client agreement.

A public directory lists: **3368 Canoe Creek Rd, St. Cloud, FL 34772; (407) 593-6515; Monday–Saturday 9:00 AM–9:00 PM, Sunday 10:00 AM–7:00 PM.** Public listings can be stale; get management confirmation before official publication.

The design is a clean information page only. Avoid selling or promoting restricted tobacco/vape goods, age-verification workarounds, online orders, age-targeted marketing, unlicensed photos, and regulated product claims. Retain an explicit unofficial disclaimer and age notice where appropriate. The business should consent before branding it as their official site.

Action: Test the preview on an iPhone, verify tap targets for maps/phone, verify details in person, then pitch the 4-section founding package. Do not give the impression that the code or brand was authorized by the shop.

## Weekly workload and outcome measurements

Pilot cadence should fit parenting and writing priorities. Target **3–5 thoughtfully selected business visits per week**, not a daily campaign of building speculative sites.

Track: number of conversations, concepts shown, quotes accepted, projects paid, actual hours, expenses, support requests and referrals. One paid job is stronger validation than dozens of unused demos. Never invest more than about 45 minutes on an unsolicited preview without a specific reason.

First 30 days:
- Week 1: One polished pitch concept, test public and private experience, create one printed card sample and walk into the first business.
- Week 2: Record feedback, improve the presentation and contact information workflow, reach out to 2–4 additional independent businesses.
- Week 3: Complete the first paid project if there is demand; measure time and customer satisfaction.
- Week 4: Review prices and delivery times; choose whether to offer maintenance and expand templates.

The decision gate for further engineering is **one paying client and a repeatable delivery**, not another round of visual concept work.

## Template and preview specification

Each concept record has a stable slug and stage. Public preview path:
\`https://web.anevum.com/preview/<slug>\`

Private editor path:
\`https://sites.anevum.com/\`

Public page may use only sanitized fields: name, eyebrow, headline, description, about, address, phone, email, hours, kind and permitted accent. It must NEVER render internal notes, package prices, invoices, revisions, private contact records, credential tokens or other internal metadata. HTML-escape all untrusted text before interpolation; links must be validated and safely encoded. Archived concepts return 404; unauthenticated writes must return 401/403. Public pages are deliberately \`noindex\` until approved and published for a real client, and must not use an unofficial design as an official business page.

Database: existing D1 \`sites\` and \`site_revisions\`. Changes produce revision records. Deletion and restoration should be controlled, logged owner-only operations to add after paid use begins. Do not modify ANEVUM member authentication, IREN permissions, production creator roles, RHEN or unrelated databases in this Sites iteration.

## Next engineering increments

**V001 (current):** isolated studio showcase; private Access-protected workbench; D1-backed concepts; staged preview links; one uncommissioned local study.

**V002 (only after smoke testing):** owner-side phone preview modes, simple QR/card preview, public contact form with spam protection and consent text, project checklists and next-follow-up reminders.

**V003 (after first client):** written estimate PDF, client review and approval link, revision comparison, client-owned domain attach guidance and structured invoicing. Do not implement payment-card storage or become a payment processor.

**V004 (on real demand):** a reusable multi-client delivery template system, per-client deployment repository and portable handoff ZIP. Design templating must preserve uniqueness so sites do not all look identical.

## Release checklist

Before inviting potential clients to use the new public link:
- [ ] Cloudflare custom-domain and DNS records exist.
- [ ] Unauthenticated browsers can reach public showroom and no other business pages leak private data.
- [ ] Owner-only workbench is denied without a verified Access session, and cannot be opened from workers.dev.
- [ ] Create, edit, archive and read-only preview have been exercised against a disposable test concept.
- [ ] The Tobacco Vapor Time preview is clearly uncommissioned and shop details have been rechecked.
- [ ] Mobile and desktop browser visual inspection completed.
- [ ] Private notes stay out of rendered page source and browser network responses.
- [ ] No paid subscriptions, new domain purchases or mass outreach initiated without approval.
- [ ] Legal identity, invoices, quote acceptance and taxes are documented before collecting real payments.

**Release posture:** Worker API deployment and domain attachment were confirmed on 2026-10-19. Independent browser smoke testing and authenticated end-to-end editor QA remain outstanding. Do not state that those checks passed until they actually do.

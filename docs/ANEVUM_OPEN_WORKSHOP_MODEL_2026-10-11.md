# ANEVUM — Open Workshop Operating Model & V5 Free Participation Contract

**Decision date:** 2026-10-11  
**Session:** ANEVUM.ANEVUM.UPDATE.2026-10-11.001.OPEN-WORKSHOP-ADOPTION  
**Decision status:** ADOPTED strategic/product direction; implementation and release remain separately gated  
**Parent program:** [ANEVUM V5 Foundation board #259](https://github.com/anevum/anevum-web/issues/259)  
**Target public opening:** 2027-01-01, subject to the existing evidence and owner-release gates

## 1. Adopted operating model

ANEVUM is a founder-led, independent software workshop that builds useful applications and maintains an expanding public body of software, documentation, education, and reproducible research. People should be able to learn, participate, experiment safely, and improve shared work without paying for the privilege.

**Public promise:** Learn freely. Experiment safely. Build together.

The participation loop is: **discover and learn → use something genuinely useful → suggest or contribute → maintainer review and verification → publish credited improvements → better shared resources**. Contributions can be documentation, bug reports, reproducible experiments, accessibility improvements, tutorials, or source code; expertise in GitHub or programming is not a prerequisite for participating in the community.

ANEVUM may remain a commercial business that earns sustainable revenue from hosted convenience, additional metered resources, organizational services, support, and future approved offerings. Paid participation does **not** buy technical authority, moderation authority, research conclusions, or favorable rankings. No nonprofit conversion, foundation, public fundraising campaign, pricing launch, or new corporate structure is adopted by this decision.

This model is intended to apply to future independent ANEVUM products beyond RHEN. Product listings must reflect real, reviewed products, not create separate businesses or fictional launches for RHEN internal responsibilities such as IREN, GRAEN, VELUM, and NOSTRA.

## 2. Non-negotiable V5 product requirement: meaningful free participation

**V5-FREE-001 — A person with no payment method, no funded brokerage account, and no meaningful disposable income must be able to obtain useful value from ANEVUM and complete a genuine free member action on a phone.** This must not be a time-limited sales trial, a mock dashboard, or a brokerage onboarding funnel.

At the minimum viable V5 public member launch, verify all of the following:

| ID | Acceptance criterion | Verifiable evidence |
| --- | --- | --- |
| F-01 | Anonymous visitors can read a real public-safe educational/project resource without signup, payment, or broker connection. | Production public-route walkthrough of a substantive resource; actual content, not placeholder copy. |
| F-02 | Eligible visitors can create a **free** member account without card details, a paid plan, or Alpaca/broker OAuth; signup failure and disabled registration are described truthfully. | Real Google/member signup flow with registration-availability checks; no payment or brokerage prerequisite. |
| F-03 | The free member can do at least one useful **persistent**, identity-bound action (for example, save relevant material, edit a permitted profile field, or save a non-executing RHEN research draft) and resume it in a later authenticated session. | Real browser two-session verification with restored persisted state; account isolation and no founder/private-data exposure. |
| F-04 | From the public project/member experience, a non-paying person can find and use at least one genuine, public-safe suggestion/contribution route with understandable guidance. It may lead to a maintained GitHub issue/contribution entrypoint; an unrestricted in-app posting system is **not** required if it is not approved. | Live link and reviewed submission path tested from a mobile device; documented maintainer triage. |
| F-05 | The free value journey works at 320px and 390px widths and by keyboard, with responsive navigation and accessible labels/status feedback. Expensive research compute is not required for the basic journey. | Browser/functional accessibility checks and real-device or representative mobile acceptance; no critical overflow or blocking. |
| F-06 | Every feature accurately labels availability and evidence: public, preview, staged, paper, simulation, disabled, or production. Do not promise usable simulation, social posting, payment, brokerage linking, or live trading when unavailable. | Copy/route review, negative-path checks, and feature-flag behavior. |
| F-07 | Real founder-vs-independent-member privacy and authority boundaries hold throughout signup, profile, saves, workspace, and sign-out/account-switch flows. | Two distinct real member identities, protected owner acceptance, denial tests, and privacy checks. |
| F-08 | The meaningful free journey requires **zero dollars** in signup fees, recurring fees, account funding, or purchase commitments. A separately enabled paid convenience tier must not remove the core free capability. | End-to-end no-card/no-broker test; reviewed entitlement/availability matrix. |

A social feed, full collaboratively editable wiki, complex gamification, live brokerage integrations, and large on-demand simulation capacity **are not** hard dependencies for V5-FREE-001. Do not represent them as ready unless independently implemented and accepted.

If F-01 through F-08 are not evidenced, do not claim that the public member experience satisfies this adopted requirement. A narrower informative website may still be released under its existing separate authorization, with the limitation described honestly.

## 3. Product roles and boundaries

- **Commons:** eventual moderated community participation, discussions, profiles, learning, recognition, and visible improvement proposals. Its social writes, moderator permissions, reporting, and data policies remain behind existing approval and migration gates.
- **Public knowledge:** Field Notes, project documentation, tutorials, and verified research, curated first. A collaboratively edited knowledge base is a future capability, not a prerequisite or a replacement for Field Notes.
- **Open workbench:** future bounded and safe experiments, examples, sample datasets, or simulations, subject to real build/verification and cost budgets; never equate paper/simulated outcomes with profitability.
- **Projects and GitHub:** reviewed links to source, issues, releases, contribution guidance, and reproducible evidence. GitHub remains source of truth for technical code review; Commons does not grant repository, CI, deployment, moderation, financial, or execution privileges.
- **RHEN:** a public-safe learning/research surface, plus independent private member workspaces when authorized. The founder/operator's brokerage state, RHEN terminal, strategies, credentials, and administrative authority remain isolated from all other members. Public sharing cannot cause mirroring or automatic execution. Broker connections and live trading remain separately gated by provider, legal, identity, risk, and owner approvals.

## 4. Open source, attribution, and trust

Openness is project-by-project and evidence-based. The website repository currently includes Apache-2.0; its trademarks and private user data are not thereby licensed. The RHEN repository is publicly visible but has **no confirmed root open-source license** at this decision checkpoint; do not advertise all of RHEN as open-source software, accept implied commercial-reuse grants, or silently apply a license. New public licenses, source disclosures, and contributor agreements require explicit owner review.

Credit accepted work in release notes, public attribution where consented, and accurate commit/issue history. Do not promise cash, employment, royalties, or elevated access in exchange for volunteer contributions. Provide private security reporting. Screen for secrets, personal/broker data, license provenance, copyrighted third-party materials, financial promotion, abuse, and unsafe code before acceptance. No community contribution bypasses testing, manual promotion, or production release gates.

## 5. Sustainable access

Keep the **core** learning and participation experience free on an ongoing basis. Charge, if and when approved, primarily for operationally expensive hosted convenience, higher compute/storage quotas, team needs, or service/support. Meter and cap costly workloads, avoid indefinite free compute, and keep a graceful low-resource fallback. A person should not have to risk money in a brokerage account to use ANEVUM.

Possible future supporter memberships are optional and do not confer governing privileges. No prices, Stripe changes, subscriptions, public fundraising, or unlimited compute commitments are authorized here.

Track: completion of the no-card/no-broker journey, mobile usability, saved-action persistence, contributor discovery and accepted useful contributions, free-member operating cost, review latency, and paid-hosting unit economics. Distinguish measurable results from proposed targets.

## 6. Delivery sequencing and governance

**During V5:** preserve the existing [master release board #259](https://github.com/anevum/anevum-web/issues/259), current stacked draft candidates, actual Cloudflare D1 restore and two-member acceptance gates, privacy/moderation review, and provider separation. Add V5-FREE-001 to the release acceptance checklist, expose only working contribution paths, and use existing public content before authoring an extensive new learning system.

**For the January 1, 2027 opening:** prioritize trustworthy access, member identity, one genuine persistent free action, useful public educational material, discoverable reviewed contributions, mobile access, and transparent capability labels. Broker OAuth approval and advanced RHEN execution cannot be required to receive the free value.

**After launch:** consider the broader collaboratively edited knowledge base, expanded simulation/research workbench, contribution reputation/badges, developer extension interfaces, governed maintainer roles, and sustainable paid resources. Add them through distinct verified feature and release work; do not divert the critical V5 delivery program to create them prematurely.

ANEVUM remains founder-led for product, budget, legal, and release authority. External contributors may improve shared work but do not gain privileged access or control through membership, badges, sponsorship, or open-source status.

## 7. Traceability and release safety

- **Strategic decision:** adopted here; not a claim that every feature is deployed.
- **V5 requirement:** V5-FREE-001 is mandatory for a public **member** launch and requires F-01–F-08 evidence.
- **Tracking:** maintain concrete acceptance tasks/evidence under [#259](https://github.com/anevum/anevum-web/issues/259) and its linked feature issue; do not create a competing V5 program.
- **Existing public collaboration drafts:** [WEB #279](https://github.com/anevum/anevum-web/pull/279) and [RHEN #489](https://github.com/anevum/rhen/pull/489) are separate, currently draft guidance; review their privacy, license, and overlap before merge.
- **No release permission:** this documentation decision does not merge V5 candidates, apply migrations, turn on Commons writes, deploy Cloudflare, repin Alpaca reviewer staging, enable OAuth, change broker permissions, provision credentials, change live execution, or authorize financial activity.

Any material change to ownership, RHEN licensing, production brokerage privileges, public-money collection, or commercial pricing needs a distinct owner decision.

# ANEVUM V5 — GitHub ↔ Commons integration design

**Session:** ANEVUM.ANEVUM.UPDATE.2026-10-10.002.PUBLIC-COLLABORATION  
**Parent program:** [ANEVUM V5 unified release board](https://github.com/anevum/anevum-web/issues/259)  
**Status:** Implementation proposal only. No website route, API, repository permissions, or production release changes in this document.

## Objective

Use the public GitHub repositories to make ANEVUM software discoverable, verifiable, and approachable to contributors, while Commons remains a separately authenticated learning/community product and each member's Command remains private. Do not turn the ANEVUM homepage into a raw GitHub activity mirror.

## Source-of-truth model

The ANEVUM product registry, not the number of GitHub repositories, decides which software products exist and appear in website navigation. A named RHEN internal responsibility (IREN, GRAEN, VELUM, NOSTRA) gets a methodology or architecture anchor under RHEN, not a fabricated standalone product listing. A private/future product has no public GitHub link until specifically approved.

An approved product may eventually declare optional publication metadata:

```ts
type PublicProjectLinks = {
  // Repository URL explicitly reviewed as safe for public linking.
  repository?: string;
  // True only when a valid, reviewed open-source license covers this source.
  openSource: boolean;
  // Optional public-safe documentation, issues and release destinations.
  documentation?: string;
  issues?: string;
  releases?: string;
  contributionGuide?: string;
  // Whether GitHub feeds may be included after event review.
  publicFeed: "off" | "curated-releases";
};
```

This is a proposed type, **not** an implemented schema or permission grant. The existing registry must be read before adding any fields. Validate that URLs are allowlisted GitHub destinations controlled by ANEVUM and do not accept arbitrary user-submitted links or preview/development branches.

## Initial public mapping

| Product or capability | Homepage/project treatment | Source relationship | Status |
| --- | --- | --- | --- |
| ANEVUM studio / Commons website | Studio home + Commons if released | [anevum-web](https://github.com/anevum/anevum-web), Apache-2.0 | Public source today; V5 Commons release independently gated |
| RHEN | Canonical product page, architecture, research and evidence | [rhen](https://github.com/anevum/rhen), public repository with no root license confirmed | Public source, **not** claimed to be licensed open source |
| GRAEN / VELUM / NOSTRA / IREN | RHEN internal architecture sections | RHEN repository where appropriate | Do not advertise as separately launched products |
| Member Command, RHEN Cloud, Alpaca integration | Protected member experience, public-safe architectural explanation only | Public code does not make account/private runtime public | Not automatically released by V5 docs |
| Cloudflare / Railway / D1 / R2 and CI | Trust and operations explanations as appropriate | Deployment infrastructure is not a public software product | No external access/repository invitation |
| Future independent software | Product registry only after actual project approval | Public, private, or source-available on a case-by-case basis | No speculative listings |

## Public UX proposal after the website release candidate is stable

### Product detail pages

Show an understated "View source" link when the approved source URL is explicitly registered; show "Contribute" only when contribution guidance exists, and "Open source" only if license review supports it. Users should not confuse code visibility with permission to reuse. Keep verified product status, real use/onboarding, releases, Field Notes, and public-safe evidence primary.

### Studio/public feed

Ingest only explicitly curated and approved releases or documentation updates at first. Never mirror every commit, developer branch, pull request title, issue body, CI log, or security finding into the public feed. A green CI badge alone is not proof of deployment or research success. Show timestamps and source version; label preview, draft, staged, production and paper-only status accurately.

### Commons learning and developer collaboration

Once Commons moderation and member-auth acceptance are complete, allow a stable public GitHub link on eligible product pages and a community learning/discussion link from technical docs. Community membership does not grant repository write, Cloudflare, Railway, GitHub Actions, broker, or operator privileges. Do not use copied OAuth grants or GitHub credentials as proof of member identity unless a distinct, approved integration is built.

### Trust and project safety

Use the existing RHEN public evidence contract for trading data. Public project pages must not expose per-member account objects, live orders, broker tokens, exact protected strategy parameters, private research artifacts, security incident details, or personal data. Never fetch public repository metadata via a browser with an admin token. If a future server-side GitHub API integration is needed, use least privilege, explicit repository allowlists, bounded polling/caching, rate limits, safe failure states, and provenance labels; avoid an always-on worker solely for GitHub badges.

## Release sequence and ownership

1. **Separate documentation review:** approve contributor entrypoints, service classification, and private security reporting; decide the RHEN licensing posture separately.
2. **V5 integration review:** web #275 and RHEN #488 continue their existing guarded workflows. No cherry-picking or merge of community docs into the active release candidate without source conflict review.
3. **Site integration when stable:** add optional project metadata, tested link rendering and verified release provenance in a new PR. Never render "open source" from `visibility === public`.
4. **Commons acceptance:** only after staged authentication, isolation, moderation, reporting, privacy and owner gates pass, offer contextual links between Commons discussions and GitHub technical collaboration.
5. **Sustainability:** measure whether contributors can find documentation and submit useful issues before adding complex reward mechanics or additional infrastructure.

No automatic license assignment, repository publication, production release, account linkage, migration, brokerage access, or payment changes are authorized by this plan.

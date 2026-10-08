# ANEVUM.WEB.DESIGN.2026-10-08.002.PUBLIC-PRODUCT-PLATFORM

Status: DESIGN LOCK / IMPLEMENTATION NOT STARTED  
Date: 2026-10-08  
Scope: Public ANEVUM website + product hosting model + public feed + RHEN public surfaces + protected Command redesign

## 1. Purpose

ANEVUM should stop presenting itself like a conventional SaaS company and become the real public surface for an independently run software workshop.

The website has four jobs:

1. Let people use and understand real ANEVUM products.
2. Show real operation, evidence, releases, and progress without inventing data.
3. Publish updates and Field Notes in a durable public feed.
4. Give people a straightforward way to support useful independent software when an actual support/payment mechanism exists.

The public site is not a founder vanity page, an enterprise-company simulation, or a RHEN marketing funnel.

## 2. Non-negotiable truth rules

### Never fabricate public state

Every numerical metric, chart, status, timestamp, release, activity item, research result, and product capability must come from an identified source.

If the source is absent, stale, or incomplete, the UI shows that condition explicitly or omits the module. It must never invent a plausible replacement.

### Current RHEN public evidence contract

The existing public boundary may expose:

- sanitized runtime state
- active public version/release identity
- aggregate activity
- normalized percentage performance
- percentage drawdown
- aggregate closed-trade statistics
- research state
- strategy history
- public methodology and limitations
- release history
- architecture

It must not expose:

- account equity, cash, buying power, deposits, or withdrawals
- open positions or orders
- symbols, prices, quantities, or fills
- individual trades or dollar P/L
- exact entry/exit rules
- quality scores, thresholds, risk limits, or reproducible strategy parameters
- credentials, tokens, or private database records

The current public feed already contains the data model needed for real percentage-performance curves, aggregate trade counts, win rate, drawdown, activity counts, research state, strategy history, system state, and public telemetry.

### Current RHEN scope shown publicly

Until the source of truth changes, public copy must remain consistent with the release registry:

- RHEN 4.3.2 MERIDIAN is the current registered release.
- Live broker authority is long U.S. equities and ETFs.
- Regular and extended-equity operation are supported within the current authority boundary.
- Options are research-only.
- Short equities are disabled.
- Research/replay/forecast/control cannot silently promote themselves into live authority.
- Promotion remains explicit/manual.
- Profitability is not claimed as established merely because the system operates.

## 3. Brand position

### Public identity

ANEVUM = independent software workshop/studio.

The homepage should communicate the character of the work, not repeatedly identify the founder.

Preferred public language:

- Independent software.
- Built in public.
- Real data.
- Real tools.
- Open evidence.
- Useful software should earn its place.

Avoid:

- repeated founder name/portrait placement
- startup-growth language
- enterprise-team language
- invented customer language
- "industry-leading", "revolutionary", "AI-powered" filler
- giant pricing/sign-up funnels
- fake market dashboards
- fictional product roadmaps presented as real

Founder identity belongs primarily on About, résumé, legal/support contexts, and authored Field Notes.

## 4. Public information architecture

### Primary navigation

- Products
- Feed
- Field Notes
- About

Secondary / utility actions:

- Support
- Command (private, visually quiet)

The ANEVUM logo returns to Home.

### Canonical routes

- `/` — live studio home
- `/products` — real product registry
- `/products/:slug` — product public home
- `/products/:slug/app/*` — optional future interactive product application
- `/feed` — unified public activity feed
- `/field-notes` — editorial/research/build journal
- `/field-notes/:slug` — note detail
- `/support` — independent support page when a real payment mechanism exists
- `/about` — compact studio/founder page
- `/resume` — résumé
- `/command/*` — protected ANEVUM operations

RHEN subroutes:

- `/products/rhen` — RHEN product hub
- `/products/rhen/evidence` — current public-safe live evidence
- `/products/rhen/releases` — release history
- `/products/rhen/releases/:slug` — immutable release record
- `/products/rhen/architecture` — architecture and authority boundaries
- `/products/rhen/research` — current public research/evidence state if useful

Existing public URLs such as `/live`, `/research`, `/releases`, and `/architecture` should remain valid through redirects or compatibility routes so current links do not break.

## 5. Home page design

The homepage is an active window into ANEVUM, not a marketing essay.

### Header

Thin, quiet, durable.

Left:
- ANEVUM mark + wordmark

Center:
- Products
- Feed
- Field Notes
- About

Right:
- Support icon/link only once support is real
- small Command status/entrance

No founder name in the header.

### Hero

The hero uses minimal copy.

Recommended structure:

Eyebrow:
`INDEPENDENT SOFTWARE / BUILT IN PUBLIC`

Headline:
`Useful software, built against real problems.`

Alternative short line:
`Independent software. Real data. Open work.`

Supporting line:
One or two sentences maximum explaining that ANEVUM builds practical tools and publishes enough evidence to show what they actually do.

Actions:
- Browse products
- See what changed

The visual center of gravity is a real data surface, not the text.

### Real RHEN evidence module

Use the existing public RHEN feed only.

Potential modules:
- current registered release
- live/stale state
- normalized public performance curve
- account return %
- realized return %
- max drawdown %
- closed trades
- wins/losses
- win rate %
- recorded trading sessions
- feed freshness
- aggregate scan/reconciliation/error activity

No raw dollar account values. No positions. No symbols. No fake market tickers.

If public performance is not valid or lacks enough samples, render an honest collecting/awaiting state.

### What is happening now

Compact event strip assembled from real sources:

- releases
- Field Notes
- public-safe runtime events
- public research decisions
- product updates
- experiment status changes

Every item needs:
- timestamp
- source/product
- event type
- short factual label
- canonical link
- source provenance internally

No fictional "user activity", trades, symbols, or fabricated timestamps.

### Product shelf

Render only registered products.

Initial live state:
- RHEN

Do not invent additional named products merely to fill a grid.

Future products appear automatically after being added to the product registry.

A separate Labs/Experiments area may show only real registered experiments whose public visibility is enabled.

### Recent Field Notes

Three to five real entries with:
- type
- date
- title
- short summary
- optional real chart/image/artifact thumbnail

### Support module

Quiet, not sales-oriented.

Before payments are connected:
- do not claim community support
- explain that support is planned or omit the module

After a real mechanism exists:
- `Keep independent software going.`
- one-time support
- recurring support
- transparent note about what support pays for
- no guilt language
- no fake supporter counts
- no artificial countdowns

## 6. Products platform

### Product registry

Add one canonical data registry that drives public product navigation, cards, routes, icons, status, and capabilities.

Proposed model:

```ts
type ProductDefinition = {
  slug: string;
  name: string;
  mark: string;
  visibility: "public" | "unlisted" | "private";
  lifecycle: "experiment" | "development" | "active" | "maintenance" | "archived";
  category: string;
  oneLine: string;
  currentRelease?: string;
  publicDataAdapter?: string;
  hasApp: boolean;
  appAuth?: "public" | "account" | "paid" | "private";
  supportModel?: "free" | "supporter" | "paid" | "mixed";
  routes: {
    home: string;
    app?: string;
    evidence?: string;
    releases?: string;
    notes?: string;
  };
}
```

The public UI should never depend on hardcoded RHEN-specific assumptions for global product cards.

### Product page pattern

Every product can opt into these blocks:

1. identity + status
2. real live/current visualization
3. what it does
4. current version
5. public feed for that product
6. documentation/evidence
7. releases
8. notes
9. use/open app
10. support/payment if that product actually has it

Empty modules do not render.

## 7. RHEN product hub

RHEN should look like a real operating system/project, not a marketing page.

### Top

- RHEN mark
- concise label: trading + research system
- current release
- current authority/scope
- public feed freshness

### Performance/evidence

Real chart from `LiveTradingFeed.performance.curve`.

Cards:
- normalized account return
- realized return
- max drawdown
- closed trades
- wins / losses
- win rate
- trading sessions
- sample/evidence state

### Operations

Aggregate only:
- events 60m
- scans 10m
- reconciliations 2h
- errors 2h
- latest scan/session state
- system freshness

### Research

Real:
- current focus
- current status
- next recorded direction
- completed public research decisions
- active public research questions
- forward-evidence coverage
- limitations

### Release/history

Use release registry and strategy history. No made-up release cards.

### Architecture

Keep the real authority boundary visible:
RHEN execution + internal IREN/GRAEN/VELUM/NOSTRA responsibilities.

These internal names remain architecture, not top-level ANEVUM products.

## 8. Feed

The Feed becomes a first-class public surface.

### Unified feed item schema

```ts
type PublicFeedItem = {
  id: string;
  at: string;
  product?: string;
  type: "release" | "note" | "research" | "runtime" | "experiment" | "product";
  title: string;
  summary?: string;
  status?: string;
  href?: string;
  source: string;
  freshness?: string;
}
```

### Sources

- release registry
- Field Notes registry
- RHEN public telemetry events
- RHEN public research decisions
- registered product changes
- registered experiment status changes

Initial aggregation can happen at the Cloudflare Worker without adding another long-running service.

Feed filtering:
- All
- Releases
- Notes
- Research
- Runtime
- by product

No comments, likes, social counters, or engagement mechanics in the first version.

## 9. Field Notes

Keep them authored and durable, not a corporate blog.

Landing page:
- latest note
- chronological list
- filters by product/system/type
- small real visual artifact when available

Detail:
- question/problem
- what changed
- evidence
- result
- limitations
- reproduce/challenge section

Author identity can appear on the note itself, not all over the general homepage.

## 10. About

About is where founder identity belongs.

Keep:
- founder photo
- name
- short explanation of ANEVUM
- résumé link
- background

Reduce:
- long autobiographical marketing
- repeated "one person" messaging

A concise statement is enough:
`ANEVUM is independently built and operated. Here is the person responsible for the work.`

## 11. Support

Support is separate from product pricing.

### Voluntary support

For free/open/public work:
- one-time contribution
- optional recurring contribution
- no feature hostage-taking
- no dark patterns

### Paid products

When an actual user-facing product exists:
- its price belongs on that product
- paid access is tied to explicit product value/cost
- support contributions do not pretend to be product purchases

No checkout UI is shown until a real payment backend exists.

## 12. Visual system

### Overall character

- dark ANEVUM visual identity stays
- less enormous marketing typography
- more dense-but-readable evidence surfaces
- more diagrams, timelines, plots, state indicators, and artifact thumbnails
- fewer generic three-card sections
- less empty black space when real content exists
- more visual distinction between live data, recorded evidence, editorial notes, and product UI

### Existing real assets to reuse

- ANEVUM mark
- RHEN/module glyphs
- founder headshot on About only
- real release records/PDF artifacts
- real public performance/evidence charts
- actual Command/public screenshots only when they represent real current UI
- actual Field Note diagrams/images when present

Decorative imagery may be atmospheric, but it must never look like a real chart, account value, product screenshot, market state, or metric unless it is sourced from real data.

### Icon language

Use the existing line/glyph family for:
- product identity
- feed item types
- note types
- system state
- releases
- support
- app capabilities

Avoid random emoji and generic stock SaaS icon packs.

## 13. Product application hosting

ANEVUM.com must be able to become the actual place users use future software.

Pattern:

- product public page: `/products/:slug`
- product app: `/products/:slug/app/*`

The public shell and product app shell are separate layouts.

A product declares its access mode:
- public
- account
- paid
- private

Do not add a visible consumer account system until the first real product requires one.

Command authentication remains separate from future customer authentication.

## 14. Command redesign

Command should become ANEVUM-wide instead of visually feeling like the company is RHEN.

### Command top level

- Overview
- Products
- Public
- System

### RHEN workspace

Preserve the current useful operating model:
- Operate
- Discover
- Review
- System/diagnostics as appropriate

Suggested canonical paths:

- `/command` — ANEVUM overview
- `/command/products/rhen/operate`
- `/command/products/rhen/discover`
- `/command/products/rhen/review`
- `/command/public`
- `/command/system`

Compatibility redirects can preserve existing `/command/operate`, `/command/discover`, etc.

### Public workspace

Add a read-first `Public` workspace showing exactly what the public website receives:

- public feed freshness
- current registered products
- current release
- current public performance/evidence projection
- current Field Note
- public API health
- stale/missing truth warnings
- privacy-contract status
- links to public pages

This becomes the anti-fabrication control: if the public site says something, Command can show the source behind it.

Do not build a full CMS/editor in the first pass. Publishing can continue through version-controlled repository data until editing in Command clearly saves enough work to justify its complexity.

## 15. Technical structure

### Keep

- React + TypeScript
- Vite
- Cloudflare Worker/static assets
- Cloudflare Access for Command
- Railway RHEN runtime
- GitHub Actions verification

### Add/refactor

- canonical product registry
- canonical public feed schema
- shared public data adapters
- reusable visualization primitives
- page-level loading/stale/empty/error states
- global public-source provenance helper
- public projection panel inside Command
- route migration/compatibility map

### Avoid for now

- new database solely for website content
- separate CMS
- separate Railway web service
- user account system without a user-facing product requiring it
- fake realtime WebSocket behavior when polling is sufficient
- hardcoded performance snapshots
- duplicated public/private performance calculations

## 16. Data ownership

| Surface | Source of truth |
| --- | --- |
| RHEN live public evidence | `/api/public/trading/live` |
| RHEN research readiness | `/api/public/research/readiness` |
| RHEN theory/research program where retained | `/api/public/theory` |
| RHEN private operations | authenticated Command endpoints |
| Release history | release registry |
| Field Notes | Field Notes registry/content |
| Product identity/status | product registry |
| Global feed | aggregation of canonical sources above |
| Support/payment state | future real payment provider only |

No frontend module owns canonical business truth.

## 17. Mobile behavior

Mobile should not become a stripped desktop dashboard.

Rules:
- hero text stays short
- one primary real visualization at a time
- horizontal metric strips become compact 2-column or scrollable groups
- feeds become timeline rows
- charts retain readable labels
- Command mobile retains operations-first density
- no horizontal page overflow
- touch targets >= 44px where practical

## 18. Accessibility and performance

- semantic landmarks
- keyboard navigation
- reduced-motion support
- contrast-safe status colors
- status never encoded by color alone
- responsive SVG/canvas charts
- no large decorative media blocking first render
- lazy-load below-the-fold images
- real-time modules degrade to cached/stale state rather than blanking the page

## 19. Implementation sequence

### Phase 1 — Truth and platform primitives

- lock product registry
- lock feed schema
- create shared data-state components
- create visualization primitives
- migrate route architecture/compatibility
- update CI privacy contract

### Phase 2 — Public shell + Home

- new public header/footer
- real-data homepage
- product shelf from registry
- real updates/feed strip
- latest Field Notes
- optional support placeholder only if truthful

### Phase 3 — Products + RHEN

- registry-driven Products
- RHEN hub
- RHEN evidence visualizations
- nested release/architecture/research routes

### Phase 4 — Feed + Field Notes

- unified feed endpoint/adapter
- feed page
- notes landing/detail polish
- filters

### Phase 5 — Support

Only after a real provider/mechanism is connected.

### Phase 6 — Command

- ANEVUM-wide shell
- RHEN nested workspace
- Public projection/truth audit
- existing private operations preserved

### Phase 7 — QA + publication

- TypeScript/build
- public/private privacy probes
- route/SEO tests
- real-data/stale-data tests
- desktop/mobile browser QA
- visual capture review
- no fabricated-value scan
- Cloudflare preview
- merge/deploy
- production smoke test

## 20. Publication acceptance criteria

The redesign is publishable only when:

- no hardcoded fake metric appears as live data
- home uses actual public RHEN values or explicit unavailable states
- no public page exposes protected RHEN fields
- no future product is represented as current unless registered
- no founder name/portrait is used as homepage advertising
- product registry can add another product without rearchitecting the site
- Feed works from canonical sources
- Command shows public projection/source health
- all existing RHEN operations still work
- mobile and desktop visual QA pass
- all legacy important URLs resolve safely
- Cloudflare production smoke tests pass

## 21. Decision

The current draft PR remains useful as structural groundwork, but its public visual/content layer is not the final design.

The next implementation pass should preserve the good structural decisions while replacing the text-heavy studio landing-page pattern with a real, data-driven independent software platform.

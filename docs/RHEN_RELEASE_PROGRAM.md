# RHEN Release Program

The RHEN Release Program gives significant system generations a durable human identity in addition to source code and strategy IDs.

## Identity layers

Keep these identifiers separate:

- **System release**: semantic version for the RHEN software generation, e.g. `RHEN 0.8.2`.
- **Codename**: memorable name for a meaningful release boundary, e.g. `AURORA`.
- **Lifecycle**: maturity state, e.g. `Operational Beta I`.
- **Production strategy**: exact live strategy identity, e.g. `LIVE-2026-09-25-003 / rolling_momentum_vwap`.
- **Research subsystem**: separately versioned capabilities such as `Research Agent v1` or `Pre-Open State v1`.
- **Experiment**: immutable research identity with its own manifest, hash, stage state, and authorization history.
- **Predictive model**: separately named/versioned only after a fitted model artifact actually exists.

A system release must never imply that a research experiment, predictive model, or strategy version has been promoted when it has not.


## Single-source synchronization contract

The canonical release registry is `src/data/releases.json`.

It contains two different kinds of data:

- `currentSlug` is the mutable pointer to the release that should be presented as current.
- `releases[]` contains immutable historical release snapshots. Once a release has been published, its version, codename, lifecycle, source commit, deployments, strategy-at-freeze, changelog, limitations, and packet identity must not be rewritten.

All release-aware surfaces derive from this registry:

- current release card and archive ordering;
- release detail routes and browser titles;
- server-side canonical/Open Graph/Twitter metadata for release routes;
- generated PDF packet identity and manifest;
- generated sitemap release URLs;
- generated public release-registry metadata;
- release email subject, body, attachment filename, and tag resolution;
- CI route/PDF/metadata assertions.

Current operating state is intentionally separate. Home, Operations, Performance, System, Research, Record strategy history, and Command use live public/private telemetry for active strategy, runtime, provenance, reporting, and evidence. A historical release snapshot must never override a newer live runtime state.

CI enforces the boundary. It fails if a published snapshot is mutated or removed, a release is missing required identity fields, a release route/PDF/sitemap entry is missing, a publication tag has no registered version, or a frozen release identity literal is duplicated outside the registry.

## Version policy

### Patch: `x.y.Z`

Operational hardening, bug fixes, telemetry corrections, documentation, and other changes that do not create a new capability boundary. Patch releases normally retain the current codename.

### Minor: `x.Y.0`

A meaningful capability or operating-model boundary. Minor releases receive full release notes and normally receive a new codename.

### Major: `X.0.0`

A generational architecture milestone. Major releases require a complete release packet, immutable manifest, evidence summary, limitations, and a new codename.

## Codename policy

- One short proper noun.
- Distinct and never reused.
- Evocative rather than descriptive.
- Prefer astronomical, atmospheric, physical, or abstract-science language consistent with ANEVUM/RHEN.
- Assign a new codename only when the capability boundary justifies it.

## Required release artifacts

Every named release should produce:

1. a public-safe website release record;
2. a polished archival PDF packet;
3. a release manifest containing version, codename, lifecycle, date, source commit, strategy identity, and verification state;
4. a selected changelog linking the release to merged implementation work;
5. an explicit known-limitations section;
6. a statement of the next capability boundary;
7. automatic email delivery of the PDF packet to the configured recipient.

## Public vs private information

The public release record may describe architecture, system states, research decisions, strategy identity, test state, and limitations. It must not publish credentials, account identifiers, live capital values, detailed execution thresholds, private trade history, or other data intentionally kept in Command/private telemetry.

## Release workflow

1. Freeze the intended release source commit.
2. Confirm the active production strategy and service health.
3. Confirm unresolved operational incidents are understood.
4. Write the release record from verified evidence.
5. Generate and visually verify the PDF packet from the canonical release record.
6. Add the website release entry and verified PDF to `public/releases/`.
7. Merge the release commit.
8. The normal website workflow deploys the release record and packet.
9. Create the formal publication tag `rhen-v<version>` when the named release is approved.
10. The release-email workflow resolves the packet registered for that version and emails the exact published PDF.
11. Preserve the release as historical record. Later corrections should be explicit patch releases or errata, not silent rewrites of material release claims.

## Email automation

Workflow: `.github/workflows/email-release-packet.yml`

Required GitHub Actions secret:

- `RESEND_API_KEY`

Optional repository variables:

- `RELEASE_EMAIL_TO` - defaults to `devon@anevum.com` when omitted by the script.
- `RELEASE_EMAIL_FROM` - defaults to `RHEN Releases <onboarding@resend.dev>`; use a verified `anevum.com` sender after domain verification.

The workflow contains no email or API credentials in source control. It runs on an explicit `rhen-v*` publication tag or by manual dispatch. Ordinary website edits do not resend a packet.

## Release 001

- System: RHEN
- Version: 0.8.2
- Codename: AURORA
- Lifecycle: Operational Beta I
- Release class: First Live Evidence Release
- Date: 2026-09-27
- Canonical RHEN source: `a5ef17a101430c1a179850f32223313bc9df8bb6`

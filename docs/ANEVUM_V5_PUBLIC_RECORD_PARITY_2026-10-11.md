# ANEVUM V5 public record parity

Session: ANEVUM.WEB.PATCH.2026-10-11.001.PUBLIC-RECORD-PARITY
Program: ANEVUM.V5.FOUNDATION.2026-10-09.001
Continuing: ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL
Master: WEB #259; website reconstruction: WEB #265
Source parent: draft WEB #292 at bdbb123a46f2d9c0c16ab9482d56d97081cadb2c
Main inspected: 56e2b5d7b783903aaa885543adb7b44bf6bca503

## Implemented replacement parity

The V5 release detail previously retained only the overview, verification labels
and bodies, and limitations. It dropped the PDF download, source identity,
publication lifecycle and class, badges, capabilities, architecture,
verification values, changelog, and boundary/strategy at freeze.

CommonsReleases now renders all these fields from the immutable release registry.
Deployment identifiers, lifecycle, capabilities, execution references and strategy
remain explicitly historical. The page links to the current rebuild status rather
than inferring active trading authority from the moving historical release pointer.
Unknown records retain the V5 not-found behavior. Historical registry bytes and
PDF paths remain unchanged.

The generated public registry keeps its existing releaseRoutes alias array and
adds canonicalReleaseRoutes. Sitemap release entries now use the V5
/products/rhen/releases/:slug URLs. Old /releases/:slug links continue through
the existing redirect. Help, Privacy and Terms join the canonical sitemap,
consistent with their existing public client and Worker metadata.

## Active checks and remaining retention

Release validation now checks active Commons/status sources instead of reading
six unused public page modules. Historical rendering is isolated in
CommonsReleases; current public status does not import the frozen registry.
Private member RHEN retains its explicitly labeled historical release identity.
Routing metadata continues to use the registry solely for publication metadata.

Retirement, transport, crypto-retirement and visual tests now check the V5 public
sources. Retained owner terminal and stopped legacy transport assertions remain.
The old assertion that the active public site must advertise V4.3 trading is
replaced with suspension assertions; the original frozen release identity is
still tested separately as a historical record.

The retention audit now reports 39 page modules: 12 runtime-reachable and 27
manual-review pages, with zero import-unreached pages blocked by literal source
reads. This removes the ten literal-reference blockers identified in the pinned
parent review. It does not prove complete replacement parity across all pages,
production usage, or permission to delete. All old page sources remain for
main/rollback review and further parity work.

## Validation

- Foundation suite, including a new isolated validator/artifact regression fixture.
  The fixture contains no retired public pages and proves canonical route output,
  preserved aliases, rejection of redirect URLs in the sitemap, and rejection of
  frozen snapshot imports into each guarded current-state source.
- Migrated legacy-retirement, public-feed, Command and visual tests.
- Release packet rendering, registry validation, TypeScript and production build.
- CI browser QA visits every registered release at desktop/mobile widths, checks
  every published content field, accessible PDF/source/changelog links, historical
  disclosure, canonical metadata and content overflow, and downloads each real
  PDF to verify its content type and PDF signature. It also navigates the old
  release alias and requires hydration at the canonical V5 route.
- Required desktop/mobile screenshots and rendered HTML for the release detail
  are captured in the existing preview evidence artifact.

Passing CI run links and exact source head belong in this draft's PR description.
Local checks do not substitute for rendered browser evidence.

## Release boundary and next work

This is a stacked draft development change, not a complete V5 release. No legacy
page deletion, production deployment, production D1 migration, social pilot
activation, reviewer staging repin, broker connection or RHEN runtime activation
is included. The Alpaca incident and release constraints remain in force.

Next: finish the remaining replacement/parity review across public and member
routes before removal; complete real member/owner isolation acceptance and actual
D1 backup restoration proof; validate the gated moderation pilot; then handle
Alpaca reviewer acceptance and RHEN data/replay evidence under their separate gates.

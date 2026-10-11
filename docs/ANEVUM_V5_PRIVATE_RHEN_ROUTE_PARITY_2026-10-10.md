# V5.2 private RHEN route parity

Session: `ANEVUM.ANEVUM.UPDATE.2026-10-10.001.V5-UNIFIED-OVERHAUL`  
Program: `ANEVUM.V5.FOUNDATION.2026-10-09.001`  
Master board: #259 · Website reconstruction: #265

## Candidate

Stacked on reviewer flow #270 at `1c4a6cd74aca3d9702c8902c1b50e8efc1b613a5`. Draft development only. Do not merge into main or deploy production under this change.

The existing member RHEN route now shares the real Commons V5 shell, palette, responsive navigation and scoped draft form styling. Six sections remain: overview, brokerage, setup draft, public evidence, research and updates. The separately gated `/command/rhen/*` owner terminal and legacy operator aliases retain their existing routing and server boundaries.

The workspace tree is keyed to the authenticated member ID. Account changes discard prior workspace, broker and operator display state; pending reads cannot update a newly mounted identity's tree. Every workspace payload still passes the original owner-bound schema validator. Brokerage display rejects unexpected trading/funding permissions and connected accounts without paper environment and a masked four-character suffix. These checks govern display; the existing server remains the authorization authority.

The evidence section shows the explicit suspended-runtime state and historical publications. It no longer polls a retired live-performance feed or displays an awaiting curve as though a running engine were collecting observations. Workspace allocation does not assert that a separate paper-review connection is absent; the member's brokerage page supplies that status independently.

## Validation

Existing member, foundation, navigation and migration/deploy boundary suites run unchanged except the presentation-route assertion and focused regression coverage. `scripts/private-rhen-browser-qa.mjs` adds fixture-only browser acceptance across all six sections at 320/390/768/1024/1440 pixels, with active route, no overflow, no nested main, no owner link for ordinary members, draft save/delete, and negative access/authority checks. Fixture requests remain confined to the CI browser and are not real provider/member acceptance. The shared Verify workflow runs the browser script and requires all 30 route/width screenshots.

Exact-head CI and screenshots must be reviewed before claiming this candidate passes. A green preview does not deploy the authenticated staging Worker or migrate D1.

## Remaining gates

- Exact-head CI, visual/keyboard acceptance and real two-member staging acceptance of this candidate.
- Separately reviewed preview D1 0004 lineage repair and isolated reviewer 0005 migration, with backup and tenant-count/FK proof.
- Staging Alpaca callback registration, secure staging secrets and explicit read-only paper-review activation.
- Genuine non-Loom recording of disclosure acknowledgement, provider authorization and the member's masked connected account. No fabricated or fixture video.
- Owner-approved DDQ and supporting documents, Alpaca's determination that the proposed paper demo satisfies its request, and separate production/release authorization.

Commons publishing/moderation and audited legacy cleanup remain separate queue items. Billing, broker execution, Railway and production configuration are not changed.

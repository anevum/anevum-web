# ANEVUM Achievement Bridge SDK · V115 (source-only candidate)

**NOT PUBLISHED, NOT DEPLOYED, no live ANEVUM achievements API yet.**

The public browser adapter is intentionally NON-AUTHORITATIVE. It connects an existing ANEVUM member to a creator's game and asks **the creator's own authenticated game server** to report a milestone. The creator's server must independently check the event; a forged client click must not grant a real gameplay claim. Browser-only games cannot obtain independently verified marks or global ANEVUM XP.

## Installation after official publication

\`\`\`sh
npm install @anevum/achievements
\`\`\`

Until a reviewed release, import from checked-in local source. Public CDN and npm hosting are NOT active.

## Browser example

\`\`\`js
import {createAnevumAchievements} from '@anevum/achievements/browser';
const anevum=createAnevumAchievements({projectId:'<approved ANEVUM project UUID>'});

// Offer this on a real user click, not automatically on load:
connectAnevumButton.onclick=()=>anevum.connect();

// In your registered callback route, after exchanging via your own backend:
await anevum.finishConnection();

// Your gameplay code sends an UNTRUSTED event request to your backend.
// A backend must confirm the conditions; this call alone is not an earned mark:
await anevum.achievements.unlock('hidden_observatory');
\`\`\`

The browser adapter writes a short-lived random state to tab-scoped session storage; ANEVUM displays explicit consent, returns a single-use connection code to an EXACT registered HTTPS callback, and the adapter relays that code to the creator's own backend. The backend calls \`publisher.exchange(code)\` and stores the returned opaque \`linkId\` in its own authenticated user mapping. Never send issuer credentials, opaque link IDs, or ANEVUM member IDs to game JavaScript.

## Server example (Node / Workers)

\`\`\`js
import {createAnevumPublisher} from '@anevum/achievements/server';

const publisher=createAnevumPublisher({
 projectId:process.env.ANEVUM_PROJECT_ID,
 keyId:process.env.ANEVUM_PUBLISHER_KEY_ID,
 secret:process.env.ANEVUM_PUBLISHER_SECRET // 256-bit random; SERVER ONLY
});

// Your callback handler must bind code to authenticated in-game account.
const {linkId}=await publisher.exchange(code);
await saveLinkedAccount(gameAccountId,linkId);

// Your backend independently verifies the milestone and owns idempotent
// event IDs; DO NOT accept a gameplay "proof" from browser code as trusted.
await verifyMilestoneFromGameServer(gameAccountId,'hidden_observatory');
await publisher.award({
 linkId:await getLinkedAccount(gameAccountId),
 stableKey:'hidden_observatory',
 eventId:await stableUniqueMilestoneEventId(gameAccountId,'hidden_observatory'),
 evidenceDigest:await sha256OfNonPersonalServerProof(gameAccountId)
});
\`\`\`

## Trust & security

- Project approval, immutable reviewed award definitions, HTTPS redirect URI and publisher credentials must be provisioned by staff after an independent public-release review. Studio draft status alone cannot authorize a publisher.
- Provider exchanges use a one-time 256-bit code (SHA-256 hash at rest, TTL 120s). Credentials are 256-bit server secrets, SHA-256 hashed in canonical D1, time-limited and revocable.
- Every event has a project-unique UUID and digest, which are idempotent; cumulative thresholds count accepted discrete events, not client-provided totals.
- The ANEVUM service checks approved release, signed-in consent, active player link, current publisher and definition, capped event frequency and grant uniqueness. It persists a publisher-attested mark, **not** independently verified gameplay, institutional honors or platform XP.
- Only a verified profile owner can curate marks for public display, with explicit default hidden; no sensitive account identifiers or evidence are exposed on public projections.
- User-initiated disconnection blocks future awards but preserves already earned history unless moderated. Existing staff takedown requires a separate audited process.
- Recommended production: registered exact callbacks, no query tokens in logs/referrers, strict Origin/CSRF on browser-facing endpoints, backend secret rotation, explicit revoke/appeal, delete/export integration, staging restore drill and audited publication gates.

## Routes (proposed; compiled only behind default-off flags)

ANEVUM browser:
- \`GET /api/v1/public/marks/projects/:projectId\`: approved publisher preview
- \`POST /api/v1/member/marks/connect\`: consent + code for current verified member
- \`GET /api/v1/member/marks\`: private inventory + active links
- \`POST /api/v1/member/marks/disconnect\`: revoke connection
- \`PATCH /api/v1/member/marks/display\`: opt-in pinned marks (max 6)
- \`GET /api/v1/members/:handle/marks\`: public curated projection only

Creator server:
- \`POST /api/v1/marks/publisher/exchange\`: one-time code -> opaque link ID
- \`POST /api/v1/marks/publisher/events\`: one accepted event -> bounded progress/one-time mark

Bridge flags: \`CANONICAL_CREATOR_STUDIO_ENABLED\`, \`CANONICAL_CREATOR_ACHIEVEMENTS_V114\`, \`CANONICAL_PROJECT_MARK_BRIDGE_V115\`; frontend \`VITE_PROJECT_MARK_BRIDGE_V115\`. All must be default-OFF. Schema \`0016\` is source-only and unapplied.

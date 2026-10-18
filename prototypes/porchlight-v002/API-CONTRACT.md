# Porchlight V002 — API contract and public-data invariants

This contract is for **isolated review** and the planned adult host/organizer application. No production route is configured. All real endpoints are blocked by default.

## Trust model

The server accepts a `principal` only from an externally supplied trusted `resolveActor(request, env)` implementation that has *verified* a signed session/token (issuer, audience, validity, revocation, and account binding). **Never** construct the principal from arbitrary browser headers, form fields, unsigned JWT content, query strings, or public profile names. Organizer rights come from `porchlight_organizer_grants` with event scoping, an explicit role, and no `revoked_at` value; creator XP and platform badges confer zero authorization.

Every mutating request requires the configured HTTPS origin to match both the actual request origin and `Origin` header. For host submissions, the separate `authorizeWriteQuota` rate-limiter adapter must affirmatively permit the operation. In production it must use durable server/edge throttling, not browser memory. JSON request bodies have a 4 KiB maximum. API errors do not expose SQL or personal records. All responses have `Cache-Control: private, no-store`.

## Event setup and controlled blocks

Events and organizer grants **cannot** be created from these public routes. They are provisioned through a separately authorized management workflow not implemented here. Event states are `draft`, `open`, `paused`, `closed`. Public visibility additionally requires `public_from <= now < ends_at`. Only an organizer manager can issue `/pause`; there is intentionally **no** public resume route. The event-local block list is set by an organizer. Hosts select its code; they cannot invent an arbitrary publicly visible block label.

## Host submission

`POST /v1/events/halloween-2026/submissions` with a verified actor and Origin:

```json
{
  "label": "Lantern House",
  "privateAddress": "123 Example Street, Test City, FL 00000",
  "blockCode": "lantern-walk",
  "displayMode": "block",
  "tags": ["candy", "decor"],
  "consentVersion": "porchlight-host-consent-v1",
  "consentConfirmed": true,
  "adultAttested": true,
  "authorizedResidentAttested": true
}
```

`displayMode: "block"` stores the private property address **only for organizer verification**, while public output uses a preapproved event-level general-area label, with `coords: null`. The public label must not be an actual person's name, home number, or contact address. Organizers review that content.

**Exact opt-in:** `displayMode:"exact"` additionally requires valid `lat` and `lng`, `exactLocationConsent:true` **and** `exactAddressConsent:true`. That authorizes displaying **the supplied address and coordinates to anyone, starting at `public_from` and ending at event expiration, unless the host withdraws or a manager pauses the event**. This is not the default choice. A checkbox or terms link alone must not silently switch a block-only host into exact sharing.

201 returns a pending receipt, never automatic approval:

```json
{
  "submission": {"id":"generated-record-id", "status":"pending", "revision":1},
  "notice":"Not published. An authorized organizer must verify the property and approve."
}
```

The host can view **only their own** submission status with `GET /v1/host/submissions`, and revoke by `POST /v1/host/submissions/:id/withdraw`. Subsequent public API reads omit withdrawn rows immediately. Repeated withdrawals return `status:"withdrawn"`. A host cannot edit an approved row without re-review; after rejection or withdrawal, a new application can be submitted.

## Organizer review

`GET /v1/organizer/events/:slug/submissions` is private to authorized event reviewers/managers. It includes property address for human checking, public consent terms version, displayed tags and revision. Never replicate this payload into public analytics or browser logs. It does **not** attest that the home is safe.

`POST /v1/organizer/submissions/:id/approve`:

```json
{
  "expectedRevision": 1,
  "reason": "I confirmed this household may participate by speaking with the resident",
  "verifiedPropertyAuthority": true,
  "verificationMethod": "direct-confirmation"
}
```

Alternative verification method is `in-person`. The checkbox is an organizer declaration, **not automated proof of identity or property authority**. Its practical verification procedure needs written approval. No reviewer can approve their own listing. Revision mismatch, withdrawn host, revoked reviewer, paused event, or expired event prevents approval. `reject` and `remove` require `expectedRevision` and a private reason. Approved entries appear only when the event is visible; removed/rejected records do not.

`POST /v1/organizer/events/:slug/pause` accepts `{"reason":"A verified report requires urgent temporary unpublishing"}`. Only a manager can pause, and the event immediately becomes inactive for subsequent public queries. This is not a substitute for an emergency operator or 911.

## Public response

`GET /v1/events/halloween-2026/pins` returns:

```json
{
  "status": "active",
  "event": {"title":"Halloween Trail", "startsAt":"2026-10-31T16:00:00.000Z", "endsAt":"2026-11-01T02:00:00.000Z"},
  "pins": [
    {"id":"opaque-record-id", "label":"Lantern House", "mode":"block", "place":"Fictional Lantern Walk", "coords":null, "offerings":["candy","decor"]}
  ]
}
```

The service returns `{"status":"inactive", "pins":[]}` for inactive, paused, expired and unknown events. The public record never includes private property address for `block` mode, host account ID, contact information, organizer notes, review rationale, audit history, or precise family location. For `exact`, `place` is the **separately consented** exact address and `coords` are the host-submitted exact coordinates, pending human review. Do not call a participating home "verified safe".

## Known incomplete coverage

No verified live sign-in, invitation delivery, operator shift assignment, abuse-report queue, verified emergency support, D1 migration, production edge rate limiting, account export/deletion, expired private-data purge, backup/restore, mapping-provider integration, real-time status, or public web UI is provided by this code. These are release blockers, not presumed implemented features.

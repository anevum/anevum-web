# ANEVUM Native Packs V002 — guarded private quarantine intake

Session: **ANEVUM.WEB.BUILD.2026-10-17.001.NATIVE-CREATION-FORMATS**

Branch: `build/native-pack-quarantine-v002-20261017`

Parent: native creation format / player V001, draft PR #486. This change is **SOURCE ONLY / REVIEW / NOT MERGED / NOT DEPLOYED**.

## Purpose

Connect native creative files to the existing canonical Better Auth **private Studio attachment** and **private staff review receipt** workflow without creating a public upload, executable runtime, streaming server, new R2 storage project, or new publication privileges.

Five extensions are recognized only for the corresponding category:

| Extension | Kind | Studio category | Required declared type |
|---|---|---|---|
| `.anvg` | Declarative game | `games` | `application/vnd.anevum.pack+zip` |
| `.anva` | Album | `music` | same |
| `.anvs` | Episode series | `video` | same |
| `.anvw` | Image gallery | `art` | same |
| `.anvp` | Workbench project | `writing` | same |

Other existing categories and general-purpose ZIP support retain their established rules. A `.zip` is **not** retroactively treated as a native playable ANEVUM file, and no new game engine is introduced.

## Independent safety switches

Native package reservation and PUT require *all* of the existing gates:

1. `CANONICAL_CREATOR_STUDIO_ENABLED=true`, supported schema and a verified Better Auth member with a creator profile.
2. `CANONICAL_CREATOR_UPLOADS_ENABLED=true` with the existing dedicated **private** `CREATOR_ASSETS` R2 binding.
3. The canonical member ID must be on the nonempty `CANONICAL_CREATOR_UPLOAD_PILOT_MEMBER_IDS` allowlist.
4. **New: `CANONICAL_CREATOR_NATIVE_PACK_UPLOADS_ENABLED=true`.** This flag defaults absent/OFF and is never set by this branch.
5. The project must be owned by that member and editable as `draft` or `changes_requested`. New requests still obey file count, account/global byte quotas, rate limits, exact byte size and same-origin authorization.

The authenticated owner-side asset list returns `nativePacksReady` as a capability flag; the Studio file picker includes the five extensions only when enabled. Turning the flag off denies further reservations and PUTs, but does not delete existing private quarantined objects or stop permitted owner download/erasure.

## On-device preflight and server-side inspection

Before requesting a reservation, the Studio upload client:
- Enforces the selected project category ↔ native extension mapping.
- Opens the bounded native pack in memory using the existing V001 strict reader to check manifest/document and asset integrity.
- Uses existing same-origin session and CSRF-safe upload methods. No private asset bytes go into URL query strings or localStorage.

Before writing bytes to R2, the canonical Worker independently:
- Validates the declared extension, the dedicated MIME string, size and category.
- Reads the bounded stream, checks actual byte count and ZIP magic.
- Fully opens the data-only `anevum.pack.v1` archive and checks structured fields, entries, allowed extensions, CRC32, SHA256, media magic bytes, references and manifest kind.
- Rejects **any unreferenced media asset** to avoid hidden executable payloads inside a validated native package.
- Only if validation passes, writes to the existing `private-quarantine/studio/{projectId}/{assetId}` private R2 prefix.
- Retains owner-bound metadata, SHA256, quarantine status and owner-only forced attachment download.

These structural checks **do not constitute malware scanning, safe media transcoding, provenance verification, licensing approval or script isolation.** Native packages remain non-executable and unpublishable from quarantine.

## Review integration

Valid native packages can meet the existing private submission evidence requirement for their exact category. This is implemented in both the owner-side readiness check and the atomic D1 snapshot mutation; the underlying `member_studio_submissions` and `member_studio_submission_assets` tables are reused without a new migration.

An explicit submit continues to create a **pending private review receipt**, not approval. Staff cannot approve an executable build via these review actions. Reviewers see attachment metadata (kind/size/hash/name), not R2 locators, binary bytes or runnable code. Owners can withdraw or remove quarantined files; asset withdrawal invalidates the active pending review.

## Testing

New synthetic, data-isolated acceptance suite:
`node --experimental-strip-types --test creator-v1/test/native-pack-quarantine-v002.test.mjs`

Checks disabled-by-default behavior, independence of the original allowlist/flags, all five types, ownership and anonymous boundaries, category mismatch, unsupported/hidden asset rejection, protection against category changes after reservation, receipt freezing and no automatic publication. The existing canonical Studio and V001 native format suites must also pass. Dedicated workflow: `.github/workflows/native-pack-quarantine-v002-verify.yml`.

## Explicit deployment and publication blockers

- Do not enable the flag until private R2 security, cost caps, backup/restore and independently authenticated owner/member/reviewer checks are accepted.
- Real staging two-account + independent reviewer acceptance, including Safari/iPhone, quota, concurrent revision and rollback, remains outstanding.
- Browser-level format validation and magic checks are insufficient for public distribution. Add content scanning, malware detection, media transcoding, immutable release hashes, rights/age/moderation and takedown handling and guest/CDN separation before public hosting.
- HTML5/JS/WASM game execution belongs to a separate audited registrable-origin sandbox, never the canonical member origin.
- Do not merge, deploy or create billable storage without authorized release review. No public catalogue entry, XP award, user account, DNS route, Cloudflare flag or secret is created here.

Primary ownership: #329 creator publishing, #480 functional acceptance, #325 V1 engineering board. Keep PR #486 (V001) as the audited parent; V002 is a separate draft child.

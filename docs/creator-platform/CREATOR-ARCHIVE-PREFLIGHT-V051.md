# ANEVUM Creator Studio V051 — Archive preflight and release trust boundary

**Status:** Development-only, not deployed. This adds a privileged offline static ZIP inspector and test suite to draft PR #454. It **does not** approve, install, publish or run any user-supplied code. Existing ANEVUM staging and apex domains must remain unchanged.

## Purpose

We need independent structural analysis of HTML5 projects after private upload, prior to any malware scan, reviewer download, content moderation or deployment to the separated game runtime. The existing intake only compares a ZIP signature and SHA-256; that is sufficient for **quarantine**, not executable release.

The inspector at `creator-v1/creator-studio/inspect-creator-zip.mjs` uses Node.js built-ins only, does not create extracted files and does not interpret HTML, CSS, JS, SVG, WASM or media. It is intended to run on a dedicated trusted machine or isolated job with constrained resources. It must **not** run inline in a public request handler or at the ANEVUM origin.

## Privileged offline command

```sh
cd creator-v1
node creator-studio/inspect-creator-zip.mjs /path/to/untrusted.zip --expected-sha256 <64-character-lowercase-hex-digest>
npm run test:studio
```

Never trust the expected digest from the ZIP's own metadata or its creator alone. Obtain it from the server's canonical frozen submission, then independently recompute SHA-256 over the exact private object bytes. Do not send internal R2 keys or user authentication cookies to the job output.

## Accepted structural boundaries

| Check | Pilot limit or behavior |
|---|---|
| Compressed archive | Maximum 20 MiB |
| Entry count | Maximum 128, directory entries included |
| Single uncompressed entry | Maximum 16 MiB |
| All uncompressed entries | Maximum 96 MiB combined |
| File path nesting | Maximum 10 path segments |
| Compression ratio | Reject extreme ratio for entries exceeding 2 MiB |
| Entrypoint | Root `index.html` required |
| Compression | ZIP stored and DEFLATE only |
| Filename | UTF-8, no traversal, leading dot segments, absolute paths, backslashes, NUL/control characters, percent encoding, or ambiguous duplicates |
| Executable/special files | Reject symlinks, Unix special files, nested archives, executable shell/server files, credentials and unsupported extensions |
| ZIP format | Reject encrypted ZIP, multi-disk, ZIP64, streaming descriptors, extra unreferenced payload, central/local mismatches and CRC failures |
| Integrity | Require exact SHA-256 of the original compressed bytes; produce per-entry SHA-256 and size manifest |

The CLI output intentionally includes `malwareScanPassed:false`, `securityReviewPassed:false` and `approvedForPublicRelease:false`. Structural integrity **does not** establish malware safety. In addition, the inspector is not a safe JavaScript runtime, parser sandbox, legal-rights verifier or secure media transcoder.

## SIGNAl 001 dry-run package

Our standalone original SIGNAL 001 demonstration is a **local reference**, not a deployed ANEVUM game.

- File: `SIGNAL-001-HTML5-PWA-BUILD.zip`
- Locally verified archive SHA-256: `5f10dc59b165886c8134e3e11c98b2a6139acac70868fa93cb569ce64b9c1c47`
- Compressed ZIP: ~131 KiB; 10 entries, `index.html` at root.
- `unzip -t` independently reports no errors.
- This real ZIP has **not** yet been run through a deployed preflight job, antivirus scanner or browser release sandbox. Its source packaging is not a public publishing approval.

## Proposed first safe release path (not implemented)

1. An authenticated creator uploads to the **isolated private** `CREATOR_ASSETS` bucket, subject to per-file, per-project, per-member, and global pilot quotas.
2. Submit project metadata and exact file hashes into the frozen private review receipt introduced in migration `0009`. Live staging still has neither `0008` nor `0009` applied.
3. An authorized trusted scanner job reads **only** the frozen content-addressed object; verifies the bytes match the receipt; runs this structural preflight in a resource-constrained worker and an independent malware/ZIP-bomb scanner; records a signed immutable machine-verdict including signature/version/timestamp.
4. Independent staff confirms rights/disclosures and content appropriateness; scanned extracted assets are transformed into **new immutable, public-release-only objects**, never exposing the private originals. No automatic approval based solely on a clean scan.
5. A deliberate release transaction ties staff approval to the exact reviewed project revision and final object digest. Replacements create new versions, not mutable changes to an approved version.
6. Static creator games, once supported, run on a **separate registrable domain** that cannot receive the main ANEVUM session cookies. A strict `iframe` sandbox, restrictive CSP, no credential access, no top-navigation, no direct privileged APIs, origin-checked `postMessage` handshake and short-lived scope-limited player tokens are mandatory. Disallow external arbitrary script hosts and remote asset leaks until an explicit threat review.
7. The ANEVUM player consumes a non-secret **approved release manifest** from the catalogue and can revoke a bad release immediately. No uploaded content may award XP or money directly. Engagement signals, if introduced, need server-side validation and fraud controls.

For mobile games, PWA service workers and installation are disabled in embedded play; they require a separate secure architecture for optional installation. Client-supplied manifest fields such as `anevum-release.json` are hints, never trusted security credentials or a publishing decision.

## Release gates

- Exact-head CI green on draft PR #454 with the negative ZIP corpus.
- Test the inspector on real SIGNAL 001 bytes against the frozen canonical digest; validate real-run outputs, system resource ceilings and cancellation.
- Cloudflare staging MEMBER_DB backup and disposable restore; audit `0006` / `0007` / `0008` / `0009` migration lineage. No existing member data overwrite.
- Provision a dedicated private Creator Studio R2 bucket under an approved capped budget; do not reuse profile media or RHEN buckets. Turn on pilot flags only for explicitly allowed canonical member IDs.
- Independent reviewer and real-account browser verification; privacy export and deletion rights; incident rollback.
- Separate staff release authorization, malware scanning, public isolation and player contract before exposing any uploaded code.

**Not supplied by V051:** background jobs, R2 scanner access, actual malware scanning, staff inspector permissions, trusted release certification, game serving, media playback, CDN, iframe runtime, public directory listing or member rewards.

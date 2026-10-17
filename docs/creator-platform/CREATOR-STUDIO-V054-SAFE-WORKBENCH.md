# ANEVUM Creator Studio V054 — Safe Visual Workbench

**Implementation status:** GitHub development branch; **not yet deployed**.  
**Baseline:** V053.1 Launchpad staging release, no change to canonical Better Auth, D1 schema, Cloudflare routes, R2, upload flags, forum moderation or public publishing.

## Purpose and delivery

The first-time creator can progress from **idea → private project → editable composition → playable *text-only* preview** without learning file formats, writing JavaScript, producing artwork, or uploading assets.

This is a lightweight, accessible **safe block editor**, not a substitute for a game engine, a user-code runtime, media host or public publishing approval. It builds on V053.1's actual signed-in project saves.

### Functional scope

- **Eight block kinds:** heading, paragraph, quotation, section divider, story scene, reader choice, art caption, contributor credits.
- **Direct editing:** add, change block type, write text, select scene destination, move up/down with keyboard-accessible buttons, remove blocks.
- **Private preview:** allowlisted React nodes with text interpolation; choice buttons change the locally displayed scene without navigation to external sites.
- **Real persistence:** use the existing verified member's owner-bound V050 Studio project `description` field (8,000 characters), saved through existing `studioUpdate` revision checks.
- **Starter integration:** Launchpad story, gallery and branching narrative now create genuine movable structures. The music and interactive-game template remain honest private *text outlines* until appropriate rendering/hosting exists.
- **Legacy recovery:** V053 plain text notes remain editable; optionally convert them to a one-block document. Reject overly long conversions without modifying originals. Invalid versioned documents enter a **read-only recovery state** rather than overwriting data.
- **Limitations:** maximum 28 blocks, 2,500 characters per block, 8,000 canonical Studio description characters. A larger project requires future structured document storage.
- **Mobile:** compact Workbench editor masthead, single-column editing at phone widths, visible focus states, reduced-motion controls, layout QA at 1440, 390 and 320 pixels.

### Data model and invariants

```text
ANEVUM_BLOCKS_V1\n{"schema":"anevum.blocks.v1","blocks":[...]}
```

The prefix and exact compact JSON are stored in the private description. Each block has only `id` (UUIDv4), `type` (allowlisted), `text` (bounded, control-character restricted), and `target` (null or UUID of an existing scene for choice blocks). Duplicate IDs, unknown fields/types, malformed JSON, cross-scene references and invalid sizes are rejected, not repaired silently.

Encoded text has a deterministic order and a strict round-trip check before entering the editable Workbench. When a scene is removed, its inbound choices become unset; a choice cannot navigate to an unknown scene or external URL.

No new Worker endpoint or D1 migration is introduced. Old projects retain all metadata, review receipts and privacy controls.

## Safety boundary

**User content is inert text.** The preview uses React JSX text nodes—not HTML injection, Markdown raw HTML, SVG user markup, iframes, `eval`, `new Function`, loaded creator scripts or external network fetches.

All operations require the same canonical owner identity. No project can become public merely by being previewed or saved. Current staff review process is unchanged: a submission requires its existing rights, license, AI/human contribution and external URL/file eligibility checks; V054 itself cannot approve or publish a release.

**Do not activate private uploads yet:** `CANONICAL_CREATOR_UPLOADS_ENABLED=false`, no `CREATOR_ASSETS` R2 binding, no integrated malware scanner, no isolated HTML5 runtime, no public release signing. No script-origin cookies, payment changes, award minting or direct XP creation.

New renderers should remain declarative until the separate-origin game runtime and security certification have been implemented.

## Engineering paths

| File | Role |
|---|---|
| `creator-v1/web/src/lib/studio-blocks.ts` | Versioned typed block schema; validation, encode/decode, choices and starter templates |
| `creator-v1/web/src/pages/StudioWorkbench.tsx` | Accessible visual block editor, legacy note conversion and text-only preview |
| `creator-v1/web/src/pages/studio-workbench.css` | Scoped responsive cinematic workspace and focus states |
| `creator-v1/web/src/pages/CanonicalStudioPage.tsx` | Plugs new editor into existing private `description` field |
| `creator-v1/web/src/lib/studio-launchpad.ts` | Creates three real structured starter drafts |
| `creator-v1/test/studio-workbench-v054.test.mjs` | Unit/regression tests for validation, injection, limits, scenes and persistence boundaries |
| `creator-v1/test/capture-studio-launchpad-v053.mjs` | Synthetic Chromium end-to-end tests extended for Workbench on desktop/phone |
| `.github/workflows/studio-v054-verify.yml` | Source-only CI with no deployment permissions |

## Mandatory review gates

1. Exact-commit TypeScript compile and Vite production/staging builds.
2. All Studio, moderator, member/privacy and app contract tests pass.
3. Node V054 block tests: roundtrip, strict schema, malformed recovery, capacity, scene deletion, XSS-like strings, no arbitrary scripts.
4. Synthetic Chromium V054: create story starter, display block editor, preview as literal text, reject user markup as DOM, save revision, create branching starter, traverse scene choice. Inspect meaningful screenshot views at 1440 / 390 / 320, check no horizontal overflow.
5. Existing project resume, review history, external HTTPS metadata and signup have no regressions.
6. Real-account staged check: two verified users with handles must not view/edit each other's drafts; save/reload and complex Unicode texts correctly; changes-requested project edit, revision collision, export, account deletion and low-bandwidth mobile return paths.
7. Guarded staging deployment only after source review, exact-head CI, baseline Worker drift check, preserved D1/secret/routes and automatic rollback on hosted failure.
8. Upload/publish flags remain OFF after release; `anevum.com` apex construction site unchanged.

## Next architecture milestones

- **V054.1:** clean block/document export; bounded undo/redo; canvas and preview usability improvements, scene navigation accessibility.
- **V055:** upload/storage, actual malware scanning, reviewer inspection and private pilot allowlist on dedicated isolated R2.
- **V056:** immutable signed approved release manifests, public project media handling, release revocation/reporting and credits.
- **V057:** isolated creator HTML5 app execution at a **different registrable domain** with restrictive CSP/iframe sandbox, token-scoped host communication, no ANEVUM credentials or user-code XP authority.
- **V058:** consent-based collaboration, licensed remixes and credit lineage integrated with community discussions.

**Operational note:** This V054 candidate is a meaningful first no-code authoring surface *within the limits of text and declarative content*. It does not yet produce playable binary HTML5 games, install offline applications or make uploaded media public.

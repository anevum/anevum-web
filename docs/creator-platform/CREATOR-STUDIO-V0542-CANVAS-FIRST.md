# ANEVUM Creator Studio V054.2 — Canvas-first redesign

Session: `ANEVUM.WEB.DESIGN.2026-10-17.001.CANVAS-FIRST-CREATOR-STUDIO`

Status: **review-only implementation**, forked from the V054 staging source. This document is a design and engineering handoff, not a production release authorization.

## Product correction

The old user journey began with a CMS-like form: project title, category, summary, starter selection, a separate template inspector, multiple labelled block fields, then a release-readiness checklist. The controls displaced the work. We are changing the default from **describe a project** to **make something now**.

### Studio home

1. **Continue creating:** unfinished private work resurfaces in a compact resume strip.
2. **Open a blank canvas:** one click creates an actual owner-bound, versioned, empty block document in the existing canonical Studio backend. A generated unique slug and reversible default title avoid upfront setup.
3. **Start with a spark:** direct-start cards for story, branching narrative, gallery, audio notes and game-concept notes. Only story, choices and gallery currently have a visual text-preview surface; sound and game ideas are explicitly *notes only*, not playable projects.
4. **Capture an idea:** optional disclosure panel accepts a short creative thought and uses the existing private-draft path; no multistep questionnaire.
5. **My works:** compact, searchable private cards with category, revision status and direct continuation; decorative orbital art does not misrepresent actual uploaded media.
6. **Bring existing work:** behind a small disclosure panel. An optional HTTPS link creates a private record; it does not upload or publish anything.

### Creation surface

- **Canvas in the center:** the first visible controls are editable title, accurate save state, save action, tool belt and composition. No category or licensing fields are shown by default.
- **Inline building:** writing, headings, scenes, choices, quotations, captions, credits and dividers remain from the reviewed allowlist. They are editable in-place. More advanced block-type choices are contextual.
- **Preview beside work on desktop:** text-only, declarative, inert React rendering. On phones the same control switches from Make to Experience without crowding the canvas.
- **No fake autosave:** the interface shows UNSAVED CHANGES and asks users to save to the existing revisioned API. Browser navigation protection stays active.
- **Settings tucked away:** project category, summary, identifier, licensing, AI contribution, source/demo links and collaborator credits are in a closed Project details drawer.
- **Distribution is a different mode:** existing staff review, quarantined file metadata, receipts, upload capability and submission readiness are in the closed Prepare to share drawer, preserving review permission rules and honest availability.
- **Continuance aesthetic:** deep midnight-blue void, muted plum/rose and cyan, orbit-inspired decoration, restrained motion, readable contrast, local focus indications, no perpetual distracting animation inside the editor.

## Hard boundaries retained

- Canonical Better Auth identities, ownership, D1 schema, optimistic revision checks, submission receipts, moderation and staff permissions unchanged.
- `CANONICAL_CREATOR_UPLOADS_ENABLED=false`; no R2 bucket is created, and the authoring surface does not execute ZIP, HTML, JS, SVG or external code.
- No XP awards, public publishing, billing activation, production deployment, apex route change or externally sourced graphics.
- Existing raw notes can continue unmodified or convert via explicit user action; malformed stored block data remains read-only.
- Existing source limits remain: 28 validated blocks, 2,500 characters per block, 8,000 characters in the canonical description field.

## Acceptance criteria before staging promotion

- Typecheck and both Vite builds pass.
- Studio, auth, forum moderation, ownership, saved-revision and security suites pass.
- Synthetic Chromium journey at 1440/390/320: guest discovery, one-tap blank creation, writing into the canvas, saving and resuming, optional idea capture, story preview, scene-choice navigation, no unsafe DOM execution, review metadata disclosure, no horizontal overflow.
- Human inspect captured screenshots for legibility, spacing, above-fold entry action, visual hierarchy and mobile touch targets. Investigate and address any issues rather than promoting a broken layout.
- Real verified-member staging QA of revision save, reload, account A/B privacy, unsaved-navigation guard, creation from starters, error recovery, and staff review isolation.
- Distinct, guarded staging promotion only after these checks and preserving rollback. Do not automatically deploy to `a.anevum.com` or alter `anevum.com`.

## Deliberately out of scope

A real multimedia canvas, user-code runner, executable mini-game engine, full sound/video editor, public catalogue and collaborative live editor are *not* faked by this redesign. These depend on the separate R2 security, scanning, runtime isolation and release milestones. The current goal is to make the already working private text-and-choice authoring genuinely usable and inviting.

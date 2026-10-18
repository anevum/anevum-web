# ANEVUM — Creator-First Player and Community Experience

**Design & implementation blueprint** · 2026-10-18  
**Project:** ANEVUM.WEB.DESIGN.2026-10-18.005.CREATOR-FIRST-IMMERSIVE-PLAYER  
**Goal:** A creator's game, app, animation, audio, interactive project or other uploaded work feels like a complete first-class product—not like a document in a publishing dashboard. ANEVUM remains present as a trusted platform, but out of the way while people are using the creation.

## 1. Product north star

**The creation owns the experience. ANEVUM owns discovery, identity, safety, publishing and relationships.**

A visitor can find an interesting creation, instantly try it, expand into immersion without losing state, exit at any moment, vote or save it, participate in a moderated conversation, inspect the creator's earned player card if public, and move on to the next work. At no point does the project become a disconnected, differently themed website.

Creator Studio is optional and is *not a prerequisite* for releasing imported projects. A self-contained HTML file works today; a ZIP bundle containing a full app is the required next runtime milestone.

## 2. Information architecture

| Destination | Purpose | Owned by |
|---|---|---|
| \`/discover\` | Discover genuine community releases, filter and search | ANEVUM |
| \`/projects/alpha_<public id>\` | Canonical public creation page, embedded project player, author, reviews, discussions | ANEVUM shell around creator content |
| In-page player | Live runnable work with context-specific controls | Creator content |
| Immersive mode | Creator's work fills available viewport; tiny exit/options overlay only | Creator content, safe ANEVUM escape |
| \`/upload\` | Create draft, attach file, validate, preview, submit | ANEVUM |
| \`/staff/projects\` | Staff content acceptance/rejection | ANEVUM |
| \`/staff/projects/community\` | Staff comment and report moderation | ANEVUM |
| User's profile / saved creations | Private collection, public creator identity if published | ANEVUM (planned fuller integration) |

**Canonical principle:** public \`/play/<uuid>\` routes redirect to the normal project page. Raw files are fetched inside sandboxed media endpoints, never used as the public destination. Private preview routes remain restricted.

## 3. Visual and interaction hierarchy

### Discover card

Use a screenshot, working preview, audio cover, or authentic creator asset. No generic cosmic art templates as project thumbnails.

- Real creation thumbnail or intentional placeholder *clearly labelled as missing*
- Creation title and category, compact one-sentence description
- Creator's actual public player card if available; neutral non-clickable member identity if private
- Real rating and vote count; if no votes, show "Not rated yet" instead of fabricated social proof
- Save affordance for members
- Single obvious action: **Play / Open**

Mobile: cards scale to screen, show fewer layers and clearer tap targets. Desktop: medium-density responsive grid.

### Public creation page

**Mobile priority order:**
1. Small project/category context with back navigation
2. Real playable app/game/media (large as possible)
3. Compact title and creator identity, plus creator-authored description
4. Community voting and Save / Discussion actions
5. Discussion, details, version and technical notes
6. More genuine releases

**Desktop:** the runnable project dominates 65–80% of the usable width; compact optional project information sits alongside or immediately below it. The player owns available display space and maintains its chosen aspect ratio.

**Remove:** repeated ANEVUM hero illustrations, giant descriptions above media, "PLAY ON CREATOR SITE", redundant "play here" CTAs, bogus \`/creators/null\` links, meaningless reward badges, and unfinished community widgets.

### Immersive mode

**Default state:** hide global header, breadcrumbs, massive ANEVUM branding, project copy, ratings and comments. Render creator content at its intended aspect ratio, letterboxed only where needed.

**Controls:** an always discoverable Exit button in a safe-area-aware corner; a minimal Options action on the opposite edge. All other controls (Restart, Share, Save, Vote, Comments) remain in the optional tray. The tray never opens automatically over gameplay. Hidden browser chrome is not guaranteed in Safari; the mode should use true browser fullscreen where supported and a fixed visual-viewport takeover elsewhere.

**State invariants:** opening and closing does not reload the game, lose score, move scroll position, break focus or trap users behind site UI. Browser Back exits immersive mode first. Escape exits on desktop. On iOS, safe-area insets and visual viewport changes are accounted for.

**Runtime layout:** uploaded game canvas/DOM gets the full player region. ANEVUM does not inject intrusive UI into the game's own document. Uploaded game scripts remain in a restricted sandboxed iframe, not same-origin privileged code.

**Session controls:** Restart explicitly reloads the game's sandboxed document. Expand/Exit only resizes or reparents the existing frame so the session remains alive.

## 4. Voting and community

### Real 1–5 voting

- One current vote per verified member per public project
- Creator cannot vote on their own project
- Member can change or remove their own vote, with a short anti-spam cooldown
- Show calculated average and count, no fake scores or bought-looking engagement
- Show a meaningful empty state when no votes exist
- Require sign-in to vote; never pretend a guest's vote was saved
- Longer term: evidence-based abuse controls, account reputation weighting, and protections against coordinated vote brigading, with transparent treatment of small samples

### Saving projects

- Real per-member collection of saves, idempotent toggle
- Guest gets clear sign-in prompt
- Creator's collections interface and saved-project feed are a next step; the underlying save is already persistent

### Comments

- Verified members can write short, plain-text feedback
- New comments enter staff moderation before publication
- Approved comments display on the creation's page; private user profiles do not leak a public handle
- Creator replies and threading are a next milestone, not fabricated until real
- Limit post frequency and require staff review so the community does not immediately become a spam or harassment surface

### Reporting

- Clear discreet Report option below content, never obstructing gameplay
- Structured reason (safety, abuse, spam, copyright, other) and explanation
- Staff receives a moderated queue with project context
- Emergency removal/unpublish powers and escalation rules must be added before broad public scale; marking a report resolved alone is not a takedown system

### Where ANEVUM interaction lives

- **In-page:** score, Save, Discussion, Share, Report, creator identity
- **Immersive:** Exit + Options. Options reveals Vote, Save, Restart, Share, and a button to exit and jump to discussion
- **Never:** social overlays automatically interrupting a creator's gameplay

## 5. Creator publishing UX

Target experience: Newgrounds simplicity adapted for modern browser apps.

### Step 1 — Upload

Drag-and-drop a file or select a ZIP. Detect content type, warn on unsupported entries, and display real progress. Accept self-contained HTML, images, audio, video, PDFs and *next* ZIP-packaged HTML/CSS/JS apps and games.

### Step 2 — Private working preview

Run the exact staged files in the same isolated runtime used publicly. Responsive phone/desktop views; safe-area and aspect checks. Detect failures, unsupported network requests and missing assets and present actionable errors. Never discard a saved draft when preview is opened.

### Step 3 — Creation identity

Title, short description, detailed instructions, category, screenshots/cover, tags, content notices, age appropriateness, author rights/licence, version, release notes, optional source code. Creator selects a published public identity or uses neutral member credit; never force a private profile public.

### Step 4 — Submit

Explain what staff will check. Draft remains available. Show **Pending / Changes requested / Approved / Rejected**, reviewer notes and dates. The creator may update draft metadata, but changing a pending or published binary needs a new moderated version.

### Step 5 — Public release

Approved creation appears automatically on real Discover cards, creator channel if public, search and category pages. Visitors can play, rate, save, discuss, share and report. Release details and changelog remain tied to that same canonical page.

### Next runtime requirement: ZIP bundles

ZIP unpacking must be hardened for path traversal, zip bombs, symlinks, huge entry counts, unexpected MIME/file types and script injection. Files should be versioned and stored by immutable content hashes in R2, with validated \`index.html\` entry and an optional human-readable \`anevum.json\` manifest describing title, type, entry point, canvas fit/aspect, screen orientation preferences and required permissions. Do not require a proprietary binary format to start creating.

Longer term the runnable package should execute from a dedicated isolated content origin rather than gaining permissions on the site's account origin. The current alpha already uses an opaque sandboxed frame plus restrictive CSP. Never grant \`allow-same-origin\` to untrusted user HTML as a shortcut.

## 6. Public creator cards and achievements

The player card appears in releases, comments, votes (if voter identities are made public by choice), forums, mentions and profiles. Card elements:

- Chosen public avatar, verified display name and handle
- Earned level icon (static high-quality representation)
- Up to three selected or most recent badges
- Special prestige awards, distinct from ordinary badges
- Public creator activity and genuine releases

This is a shared component, not an image generated separately for every card. A private creator profile is never exposed merely because an associated project has been published.

Never present unearned collectible models, reveal locked awards in an unrestricted gallery, or substitute spinning 3D assets for stable readable UI. Detailed 3D earned models remain inspectable as a separate reward viewer.

## 7. Engineering architecture

### Immediate working alpha

- Uploaded file metadata and binary storage: existing member D1 + R2
- Authentication: canonical Better Auth member session
- Project approval: canonical owner/reviewer grants, \`/staff/projects\`
- Public catalogue: existing creator-v1 frontend + approved alpha release adapter
- Player execution: restricted iframe with explicit parent \`frame-src 'self'\`; child remains CSP sandboxed
- Creator engagement: project-specific rating, save, comment and report tables (real persisted data)
- Staff community moderation: restricted \`/staff/projects/community\`

### Correct long-term consolidation

Migrate temporary route-and-asset Workers into a single canonical React frontend, a single creator publishing domain model, a dedicated isolated player service, an internal project engagement service and consistent staff moderation permissions. Use design tokens shared between public, creator and staff surfaces. Remove duplicate compatibility Workers only after equivalence tests; do not discard existing projects or release IDs.

### Production events and errors

Useful low-intrusion events: load requested/loaded/failed, player expanded/exited, first launch, rating saved, save toggled, comment moderated. Capture no private game contents or keys and avoid invasive device fingerprinting.

If a game cannot run, show a fault state: **Unable to launch this experience / Retry / View details / Report a problem**. Do not leave a perpetual white rectangle or endless "Loading experience" overlay.

## 8. Component states and copy

| Element | States | Examples |
|---|---|---|
| Player | Loading, Ready, Playing, Failed, Expanding, Immersive, Exiting | "Loading creation…" → creation appears → "Retry" on failure |
| Vote | Not rated, Selected 1–5, Busy, Error, Sign-in required, Creator-owned | "Not yet rated"; "Your 4/5 vote was saved" |
| Save | Saved / Not saved / Guest / Busy | "Save" → "Saved" |
| Discussion | Collapsed, Loading, Empty, Published, Pending own submission | "Comment submitted for staff review" |
| Moderation | Pending, Approved, Rejected, Hidden, Report open/resolved | Clear status and reviewer context |
| Release | Draft, Previewed, Submitted, Changes requested, Published, Rejected | Always visible in creator account |

## 9. Accessibility and mobile

- All actions have visible focus and minimum 40–44px touch targets
- Fullscreen Exit always reachable, including with the onscreen keyboard and phone safe areas
- Screen-reader labels for Vote 1–5, Save, Exit, Options, report reason
- Text contrast preserved and motion reduced when requested
- Portrait-first layout, orientation-safe immersive mode, no forced landscape without user permission
- iOS Safari browser chrome limitation explained accurately; installed standalone home-screen PWA can offer a more app-like launch later
- Pauses/resumes and OS app switches must not strand the iframe in a fixed detached state

## 10. Acceptance tests and release gates

| Gate | Acceptance |
|---|---|
| One creation page | Public play URL resolves to canonical ANEVUM page, same theme and genuine author content |
| Real gameplay | Single Drift starts and accepts touch input inside the project page |
| True immersive | On supported browsers native fullscreen works; fallback covers visual viewport |
| Exit | 20 open/exit cycles, Safari iPhone + Android Chrome + desktop, without trapping navigation or losing session |
| Browser Back / Escape | Exits first, restores scroll and focus |
| Vote | Verified viewer records exactly one 1–5 score; edit/revoke persists; self-vote rejected |
| Save | Persists across sessions; never falsely reports success |
| Comments | Submitted → pending queue → staff approves → appears publicly; rejected content stays hidden |
| Reporting | Verified user sends issue; staff sees report, records a decision |
| Guest security | No authenticated mutations, no private project/media access |
| Creator identity | Public profile maps to true player card; private profile remains neutral |
| Upload flow | Saved draft, preview, staff submission, approval and Discover propagation |
| ZIP V2 gate | Multi-file uploads boot with CSS/JS/media assets and no escapes from sandbox |
| Responsive | No white frame, no clipped exit button, no horizontal overflow |
| Reliability | Cold-start load and errors are measurable; no known permanent "Loading" states |

**Do not label the alpha feature-complete until the authenticated on-device and staff decision loops have been exercised end to end.**

## 11. What is live as of this document

- Approved Single Drift game is on canonical \`/discover\` and a single normal project page.
- Isolated creator game is playable in-page; parent CSP permits same-origin sandboxed iframe.
- New immersive implementation prefers native fullscreen, uses a body-level visual-viewport portal fallback and restores player, focus, scroll and browser history on exit. Both routes passed mobile-sized browser-emulation expansion/exit checks. A real iPhone Safari acceptance run remains.
- Real engagement service is deployed at \`/api/v1/alpha/social/<project UUID>\`; public count and guest authorization protections passed checks. Live project page now exposes rating/save/comment/share/report controls and an optional immersive options drawer.
- Staff community moderation page is deployed under \`/staff/projects/community\`, with canonical staff grants and Access login checks.
- Public creator handles are attached to releases only when the creator profile is public.
- No votes, saves or approved comments existed for Single Drift at first deployment; the UI displays an accurate empty state.

## 12. Remaining items — not yet claimed complete

1. Test real authenticated voting, saving, posting and staff comment decisions with separate eligible member and reviewer accounts.
2. Confirm immersive on actual Safari iPhone, including browser back, rotation, scroll and repeated exits.
3. Build and harden ZIP/multi-file package runtime, versioning and staged preview.
4. Capture genuine screenshots and render project-specific media in Discover cards.
5. Link saved items to an explicit member collection/profile view; add follow and creator replies only when backed by real state.
6. Add staff takedown/escalation actions for urgent safety reports.
7. Consolidate all compatibility Workers and social UI patches into the canonical creator-v1 React source and shared design system.
8. Finish accessible usability testing, performance monitoring and malicious upload penetration testing.

## 13. Rollback references

All implementation snapshots are in \`anevum/anevum-web\`, branch \`alpha/player-uploader-20261018\`:
- \`site/alpha/anevum-native-project-player-v006-immersive.mjs\`
- \`site/alpha/anevum-native-project-community-v002.mjs\`
- \`site/alpha/anevum-project-engagement-api-v001.mjs\`
- \`site/alpha/anevum-staff-community-review-v001.mjs\`
- \`site/alpha/anevum-staff-project-review-v003.mjs\`
- \`site/alpha/anevum-alpha-main-discovery-v003.mjs\`

Before rollback, inspect current Cloudflare zone route ownership and update only exact expected script targets:
- Frontend index assets can revert from \`anevum-native-project-community-v002\` to \`anevum-native-project-player-v006-immersive\` to remove interaction UI while preserving fullscreen.
- The new \`anevum.com/api/v1/alpha/social*\` route can be disabled independently; this does not touch uploader or games. Preserve interaction data unless the user expressly requests deletion.
- Staff \`/staff/projects/community*\` route is independent of \`/staff/projects*\`; never weaken Access.
- Canonical D1 rows, R2 binary uploads, member accounts, published project status and review history are retained through any UI rollback.

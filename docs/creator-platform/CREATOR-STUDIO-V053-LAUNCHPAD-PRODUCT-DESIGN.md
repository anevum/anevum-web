# ANEVUM Creator Studio — V053 Launchpad / Workbench / Release Room
**Design proposal. Not deployed.** Source baseline: V052 staging deployment, Creator Studio drafts ON, uploads OFF, canonical Better Auth member identity retained.

## Product thesis

ANEVUM is a community-created universe, not a software IDE, AI-only creation service, or game-engine clone. Anyone can participate as a creator without arriving with finished files or technical expertise. The Studio is an extension of the community and personal spaces, not a replacement for the ANEVUM homepage.

**North star:** *From “I have an idea” to “I made something” without knowing which software or file format to use.* A beginner can capture a private seed in less than a minute, build from a safe visual template, and understand how to prepare an eventual community submission. Experienced developers can import HTML5 projects and preserve advanced project metadata without being forced through elementary screens.

### What is live at V052

- Canonical verified-account private projects and draft editor at `/studio`; categories: games, tools, creative, music, art, video, writing, learning, research, other.
- Project list/search/status, detailed project metadata, external HTTPS links, licensing/AI/human contribution declarations, private review history, independent reviewer role.
- Six canonical staging Studio tables (0008 + 0009); immutable historical private review receipts, audit hashes.
- New binary uploads disabled; no dedicated R2 Creator Assets bucket; no public content rendering; no game playback; no creator XP events.
- Staging has open public signup. Do not roll that back or modify the existing moderation console, supporter system, progression, profile experience, or apex landing page.

**Gap:** The first interaction assumes the member already knows how to complete a project record. Starting requires multiple details, category terminology, and provenance fields. The Studio currently manages creations but does not yet *help a person become a creator.*

## The experience model: three environments, one creation

1. **Launchpad — begin:** Idea, starter, existing creation, optional collaboration, rights-enabled remix. This is a friendly decision point, not a five-step enrollment form.
2. **Workbench — build:** A responsive structured block composer or metadata/file project workspace, guided only when useful. WYSIWYG preview for safe blocks, undo, autosave, asset panel, attribution and collaborator threads.
3. **Release Room — share responsibly:** An approachable release checklist, audience/visibility settings, actual private preview, attribution confirmation, independent moderation, revisioned submissions and release state. Never imply that submitting means publishing.

The navigation stays: ANEVUM community homepage → personal dashboard → Creator Studio. Do not add competing global page shells. `/studio` becomes Launchpad; `/studio/:id` remains a route but progressively becomes Workbench; `/studio/:id/release` later becomes Release Room. Stable deep links and old project records must survive.

## Entry flows

### A. “I have an idea” (primary low-friction path)

Prompt: **“What would you like to make?”** Single optional freeform response, e.g. “A short mystery where readers choose which signal to follow.” On **Capture idea**, show a compact Seed card with a working title the user can change, and a choice of an optional template. No licensing or AI questions, slug, upload, category or collaboration decision before first capture.

Authenticated: save a private Seed using an additive D1 schema when approved; for early staging, map to an existing draft with transparently generated slug and valid minimal summary without falsely claiming a new Seed API. Anonymous: a local-only ephemeral idea with explicit persistence/disclosure and **claim on sign-in** consent; never upload a guest's notes to ANEVUM without permission. Never auto-publish.

### B. “Give me a starting point” (template path)

Outcome-driven starter cards rather than file extensions:
- One-page story / digital zine — title, text, media, chapters
- Art gallery / collection — arranged images and captions
- Audio drop — artwork, audio and credits, future waveform player
- Choose-your-path story — safe declarative scene+choice schema
- Interactive mini experience — declarative scene, prompt, click/tap action and result (no custom JS)
- Game/app submission page — finished HTML5 ZIP or external link, private review only until isolated runtime is live

Templates are created from versioned, locally bundled JSON blueprints with explicit block schemas. Free starter resources. Every template has a real preview screenshot or sandbox *only after* its renderer exists; no inert CTA claiming to create a running game.

### C. “I already made something” (advanced onramp)

Start with a project kind, then attach file/link once safe intake exists. Support beginner explanations and advanced details without making them mandatory in the first 60 seconds. The upload dropzone must clearly say **disabled** until CREATOR_ASSETS binding, pilot allowlist, scan/review and moderation pipeline are ready. A link and basic metadata can still become a private draft.

### D. “Make it together” (community → creation)

A discussion or private collaboration invitation may create a Seed with a reference to the originating thread and explicit consent from participants. Creator opt-in, scoped roles and private files are mandatory. Simple asynchronous invitation/comments first; real-time cursors and multiuser editing last. Attribution is affirmative: no auto-tagged collaborator receives credit without consent.

### E. “Remix a permitted creation”

A work can declare a specific, revocable for-future-use remix license. Create a derivative Seed with a stable pointer to its parent release and immutable lineage metadata. The original never becomes modifiable, and a creator cannot clone unlicensed work through the Remix UI. Credit persists for derivatives already lawfully released, according to applicable licenses. Link back to parent and contributors.

## Studio navigation / screen anatomy

### Launchpad `/studio`

- Header: **“MAKE SOMETHING.”** one-line supporting text, a fast idea field, a single primary action.
- Three obvious cards: **Start with an idea**, **Try a template**, **Bring my work**. Secondary actions for collaboration and permitted remix.
- “Pick up where you left off” shows own recent Seeds and projects, with readable progress phrases: Started → In progress → Preparing → In review → Published (future). Do not invent a published state in V053.
- Below, rotating human-curated community challenge prompts, not an infinite AI suggestion feed.
- Large personal stats are optional and secondary; empty state teaches by showing an example. Avoid a database-looking table as the dominant viewport.
- Signed-out people can explore starter paths without a login wall; sign-in only when needed to save to an ANEVUM account. If guest local storage is disabled, offer copyable plain-text export rather than silently losing ideas.

### Workbench `/studio/:id`

- Desktop: left **Structure** (pages/scenes/sections); center **Canvas** (direct-edit safe content); right **Preview / Details**.
- Phone: full-width canvas and accessible tabs **Build / Assets / Preview / Details**; reachable save/continue button; no three-column miniature.
- Modes: **Simple** (the default) displays one task at a time and progressive prompts; **Advanced** exposes slug, content type, URLs, file manifests, developer options, technical settings. One underlying project: switching modes never changes or deletes content.
- Structured blocks: heading, paragraph, image, gallery, caption, audio reference, quote, scene, choice, separator, credits, and CTA link. No arbitrary JavaScript, iframe, SVG, Markdown HTML, user CSS, or remote embeds on the main ANEVUM origin.
- Undo / redo, keyboard accessible moves, small-screen edit, autosave indicator, clear error recovery and optional per-project completion checklist. Multiple devices require server revision checks and conflict copy, never silent last-write-wins.
- Live previews for allowlisted declarative blocks only. HTML5 ZIP preview must wait for isolated hosting and scan gates; current review PDFs/ZIPs remain forced attachments.

### Release Room `/studio/:id/release`

- One glance shows **“What happens next?”** and every readiness item with plain language: project identity, content preview, credits/rights, accessibility basics, cover thumbnail, file safety state, review status.
- Rights questions are context-specific and occur at release, not at idea capture. AI disclosure is neutral and clear: “Did you use AI tools? How?” alongside “What did people contribute?”
- A private preview may be shared with opted-in testers once a scoped preview token and isolated renderer exist; NO unpublished source or R2 object keys in tokens or URLs.
- Submission creates an immutable receipt (existing V050 infrastructure); reviewer can request changes or reject. A separate future staff approval + signed release manifest is required for actual publication.
- Successful release displays a collectible creator milestone and context-specific distribution actions. It must never award client-authoritative XP, currency or arbitrary medals.

## The inventive element: a *creative graph*

A creation is more than a file. ANEVUM connects:

`Community spark → Seed → Work → Contribution(s) → Frozen submission → Approved release → Community experience → Licensed remix(es)`.

All edges are typed, consent-based, and permission-checked. The graph makes it possible to browse stories behind creations, find collaborators who helped, and discover music that became part of a game. This connects art/music/games/stories/tools without making the website exclusively a game platform. It is NOT a blockchain, tradable token, automated copyright license or generic follower leaderboard.

**Concrete example:** A musician posts a loop → another creator, with license and consent, uses it in a branching-story template → illustrator joins to supply images → release credits all participants → community discusses the release → another creator uses a licensed starter blueprint. ANEVUM makes the lineage visible. The first phases use links and explicit credits; do not attempt automated ownership inference.

## Creator identity / incentives

- Creator pages present released works, in-progress projects if the owner opts in, community contributions, agreed collaborator credits, curated collections and recognition.
- A beginner's first Seed, first completed work, first accepted release and first credited collaboration can produce meaningful noncompetitive milestones, only after a verified server-side transition and anti-abuse checks. No reward for mass-producing empty drafts.
- Supporters can sponsor platform hosting and curation as already designed; creator payouts/tipping require separate Stripe Connect identity, compliance and accounting. No promise of money for publishing.
- Publishing standards should not lock out newcomers: private drafts and peer feedback are widely available, while public releases are gated for safety/quality.
- Invite constructive feedback anchored to scenes/sections. Moderation, blocking/reporting and content-rating controls apply to all public surfaces.

## Accessibility, mobile, trust and privacy

- WCAG 2.2 AA as a target: contrast, focus rings, keyboard drag alternatives, reduced motion, semantic announcements for autosave/errors, readable text, meaningful labels and mobile layouts at 320px.
- Do not make orbital/cinematic animation necessary to navigate. Use subtle ambient brand motion with reduced-motion fallbacks and avoid making the main canvas unreadable.
- Avoid dark-pattern “publish” confirmations, fake progress bars, gamified pressure, forced AI, publicly exposing unfinished private works or pressure to provide private identity.
- Account deletion/export must include Seeds, safe blocks, saved collaboration permissions, receipts, release records, and full erasure path for private assets when storage exists.
- Age-appropriate safeguards, privacy-by-default workspaces, abuse rate limits, permissioned messaging, protection against grooming/spam and per-content rating/moderation are mandatory before broad minor participation.

## Safety and deployment boundary

- Retain single canonical Better Auth member ID; never accept legacy user sessions for creator uploads.
- V052 Studio drafts are live; canonical migration `0008` and `0009` exist; uploads remain OFF. No change to the public signup status, existing Community DB or apex countdown.
- Before private uploads: dedicated CREATOR_ASSETS R2 bucket, explicit member-ID pilot allowlist, bounded file type/quota, malware scanning, account export/erasure, actual member A/B test. Existing V051 archive structural preflight alone does not clear malware.
- Safe block data are allowlisted, validated in a trusted server renderer and sanitized. Arbitrary creator HTML/CSS/JS runs *only* on a separate registrable domain with CSP and isolation, immutable approved release manifests and no ANEVUM cookies.
- Keep game XP server-mediated; untrusted creator code cannot mint XP, medals or Quanto. Payments never flow through creator assets.
- Never let a project file execute on `a.anevum.com` or as a same-site credentialed child origin.

## Iterative delivery plan

| Stage | Scope | What “done” means |
| --- | --- | --- |
| V053 | Accessible Launchpad, idea capture, usable starter chooser, empty-state tutorial; preserve old editor in Advanced | A signed-in novice creates private draft in ≤60 seconds without knowing files/slug/license; guest preview safely local-only; no extra server deployment without CI |
| V054 | Schema-driven safe page/zine/gallery/choose-your-path Workbench, autosave and preview | At least 3 sample templates editable on desktop/phone; no arbitrary scripts; keyboard/screen-reader flow; no new hosting origin required |
| V055 | Private upload pilot via isolated R2 + real malware scanner/inspection + reviewer moderation | Actual cross-account tests; strict global budget; no public user content; ZIP hashes bound to review receipts |
| V056 | Moderated public static releases with safe image/audio/text processing, immutable release records | Public project pages, creator wall links, report/takedown/revoke, correct rights/credit |
| V057 | Separate-domain approved HTML5/game runtime, player integration, scoped events | SIGNAL 001 independently playable after actual scan/review; CSP/origin tests; no cookies or privileged JS on ANEVUM origin |
| V058 | Contribution and remix lineage, opt-in crews, feedback, curated creator challenges | Explicit permissions and contributor credits; remixes follow licenses; abuse moderation and version history |
| Later | Advanced AI assistant, SDK achievements, resource marketplace, richer no-code tools | Opt-in and cost-capped; distinct approvals and security/finance protections |

Do not ship V056 ahead of V055, or arbitrary game execution ahead of V057. Independent safe-block project previews can develop earlier but not masquerade as approved public releases.

## Acceptance and product metrics

**Functional acceptance**
- New member with no software can complete: choose entry → enter an idea → see a useful Seed card → save draft → reopen on phone.
- Existing creator: bring a work → private metadata draft; clearly sees the upload feature's real availability.
- Returning creator: locate a project, resume it, and distinguish saved revision, review receipt, and future public release.
- Moderator: cannot view creator drafts unless explicitly assigned to a submission workflow; still cannot execute uploaded bytes.
- User understands whether work is **private**, **in review**, or **public** at every stage.

**Targets, not current measurements**
- First private idea capture <60 seconds; first template-based creation <5 minutes.
- More than half of novice entrants should complete a draft in usability testing before shipping widely; iterate based on observed abandonment rather than assumed conversion.
- Zero misleading activation claims; zero cross-account draft/asset disclosure; all keyboard-only and reduced-motion acceptance scenarios pass.
- Independent staging CI and visual checks at desktop 1440px, tablet 1024px, mobile 390px and 320px.

## References and differentiation

Newgrounds' project system demonstrates contributor credits, team tools and creator preview; itch.io supports creator-controlled pages and HTML5 ZIP uploads; GDevelop shows that a browser-based no-code editor can provide approachable templates. ANEVUM's differentiator should be the *continuity between a community conversation, a tiny Seed, a collaborative work, and the finished release*, not reproducing each platform's entire engine. External reading: https://www.newgrounds.com/wiki/help-information/content-submission/project-system , https://itch.io/docs/creators/getting-started , https://gdevelop.io/game-makers .

**Decision:** Implement V053's beginner-first Launchpad as a reversible design experiment on its own branch. Preserve V052 staging until usability and security acceptance are met.

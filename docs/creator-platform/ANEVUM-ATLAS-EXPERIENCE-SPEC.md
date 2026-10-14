# ANEVUM ATLAS — Spatial Universe, Living Decks, Shared Spaces

**Design status:** founder-directed research prototype; visual acceptance pending.
**Source prototype:** Draft PR #380, route /atlas, branched from canonical production/creator-v1.
**Product owners:** #325 canonical Creator V1; #335 visual; #331 discovery/community; #337 XP; #328 identity; #332 security; #333 release.
**Important:** A creative direction and an opt-in browser prototype do not authorize public messaging, signup, code execution, or production promotion.

## 1. The signature experience

ANEVUM is not a scrolling link directory pretending to be a universe.
The **Atlas** is a manipulable spatial diagram of real project and community worlds. A node represents a useful destination and an honest capability state; it is never a fabricated online avatar, fake traffic count or dead UI shortcut.

The interface has three persistent layers:

1. **Atlas:** responsive constellation / spatial map. Drag empty space to orbit, scroll/pinch-style controls to change scale, keyboard and dedicated controls as equivalent alternatives. Shaded portrait worlds use first-party cinematic images. Real project queries and known static routes are the only data; future nodes may be generated only from approved public records.
2. **Deck:** opens a focus-managed, full-viewport-like modal within Atlas. The hero explains the selected world, the authentic action works, and browse decks show real public catalogue records or genuine empty/error states. A long content item scrolls **inside the deck**, never through a broken page shell.
3. **Space (future):** a persistent project-associated collaboration location behind authenticated permission checks: project discussion, shared assets, feedback tasks and presence. When a person enters a Space, the scene transitions from constellation to a single focused room; they can always return to Atlas without losing context.

On small phones, Atlas must remain touch-usable with sufficiently large controls. A one-viewport interaction does not justify clipping long messages, projects or accessibility text. Route-based equivalent navigation and focus management are required.

## 2. Ten current Atlas worlds

| World | Current path | Reality |
| --- | --- | --- |
| Discover | /discover | Public approved catalogue and search |
| Play | /discover?category=games | Real game catalogue; ANEVUM-native HTML5 hosting not live |
| Tools | /discover?category=tools | Real applications and creator demo/source references |
| Create | /discover?category=creative | Real creative experiments |
| Studio | /create | Existing invited member project workspace |
| Commons | /community | Community roadmap and permitted project participation |
| Collaborate | /workspace | Future team rooms; no live shared editing |
| Signals | /community | Future messages/notifications; no live inbox |
| Artifacts | /levels | True progression doctrine; member XP only from server |
| Identity | /account | Invited private account; no public signup claims |

Every world keeps a readable label, state, focus ring, keyboard and direct-link alternative. A project can later have a dedicated orbiting instance (only for approved project records). Nodes are not generated randomly.

## 3. AAA interaction quality gates

- **Visual authorship:** coherent original silhouettes, sculpted rings, subtle material/grain treatments, distinct nearby/far-depth cues, light/shadow continuity, tasteful bloom, strong legible typography, camera easing, image composition and microinteractions. Existing cinematic art and logo are preserved until an explicit owner visual review decides otherwise.
- **Motion language:** 180–450ms short transitions, 450–650ms major deck entry, subtle idle movement; meaningful camera refocusing on selection; no motion that hides controls or creates cursor lag. Reduced-motion mode removes all ambient cycles and uses instant spatial changes.
- **Input parity:** pointer drag, touch drag, mouse wheel/zoom buttons, keyboard Tab/Enter/Escape/arrows/Home, usable dock links, screen reader labels, clear device feedback and focus return. The core feature cannot require WebGL, hover, hardware acceleration or high-end desktop hardware.
- **Performance:** code-split Atlas from the normal public website. Set performance budgets using measured mid-range mobile Web Vitals and frame timelines before promotion. Pause animations when hidden; limit compositing layers, CSS blur area, image decode cost, GPU memory, network use and battery consumption. A CSS-3D base with optional WebGL visual enhancement is preferable to shipping an inaccessible heavy WebGL-only interface.
- **Sound/haptics:** optional, off by default, gesture-activated, independently mutable; no surprise autoplay. A later sound pack should be owned/licensed and include accessibility controls.
- **Quality review:** the compiled actual browser route at 1440×900 then 390×844 and 320×720, with both the Atlas map and an opened Deck. Capture input and empty/error states. Do not claim visual sign-off from passing automated build tests.

## 4. The real collaboration backend we would build

### Data objects (proposed, not created)

- Space: stable ID, owner project, visibility (private/invited/public-read-only), title, linked approved release, permissions, timestamps.
- Membership: space ID, member ID, role (owner/editor/contributor/viewer), invitation issuer, accepted/revoked time; prevent XP or purchases from granting roles.
- Thread and message: durable IDs, per-thread membership visibility, text/attachment references, edit/delete history, timestamps, moderation and block/report statuses.
- Work item: scoped task with status, assignee, links to project/file/version, approvals and audit event.
- Session/presence: per-space ephemeral session with TTL, throttled cursors/co-view state, no fabricated concurrent user count.
- Notification: durable idempotent actor/action/recipient/source event, checked permission at read time, delivery state, user preferences, mute/block rules and audit retention.
- Collaboration credit: credited member, specific approved contribution source, revocation/appeal flow, separately verified by an authorized reviewer.

### Technical candidate

Existing member Worker and staged D1 retain authenticated identity/authorization and durable project references. R2 stores authorized project assets in private buckets. Cloudflare Durable Objects/WebSocket connections are an optional **presence and live-sync channel**, never the source of account privilege or authoritative XP. D1/Queues can support durable invitations, updates and notification fanout with idempotency. A CRDT document implementation (such as Yjs) is a later scoped option after text/document requirements and adversarial reconciliation tests; live shared source-code execution is explicitly out of scope.

All reads and writes recheck project membership and source visibility. Access is server-authorized, not a client-side role badge. Realtime events must be schema validated, bounded, rate-limited, auditable and revocable. Private author projects and RHEN/owner Lab never appear in public Space search or cross-tenant presence.

### Messaging trust controls before rollout

Block/mute/report, spam throttles, invites with expiration, privacy defaults, opt-in notification preferences, age and youth-safety policy, content moderation and abuse escalation, sender/deletion/account export controls. No promise of end-to-end encryption until actually designed and independently audited. Private DMs should begin within known project collaboration/approved relationships, rather than opening cold unsolicited spam to every member.

## 5. Earned feedback and meaningful engagement

- Verifiable XP is issued **only on the server** after a real qualifying contribution and its anti-abuse checks.
- A *confirmed difference in server-reported member level* triggers the local animated level-up panel, only for the same authenticated member. No client-originated XP grants, no milestone popup on every navigation or first render.
- Artifacts are a first sixty-piece named collectible series in an unlimited-level system; beyond sixty, no fictitious earned art is shown.
- Project collaboration milestones can later be recognized after verified accepted work, not merely opening a workspace or sending many messages.
- Notifications surface relevant invitations, substantive feedback, project releases and mentions; no aggressive reminder loops, fake urgency, purchased XP, view-time farming or punitive streak loss.

## 6. Rollout and ownership gates

**Prototype A (PR #380):** functional optional Atlas route, current public category exploration, focus Deck, verified XP signal, mobile and keyboard parity, no new backend. Owner to review actual desktop/phone before accepting appearance.

**Pilot B:** private invited collaboration Space with owner/editor/viewer identities and a moderated comment/task flow. Security acceptance for member A versus unrelated B, staff and guest, block/report, account deletion/export, R2 attachment boundaries, realtime disconnect/recovery, and budget. No DM needed yet.

**Pilot C:** curated private messaging and notification inbox for invited and independently authenticated testers; secure event pipeline, consent, mute/block/report, retention policy, delivery/connection replay. No public announcement until actual end-to-end delivery succeeds.

**Expansion D:** simultaneous coediting, versions/conflict resolution, rich room scene, team profile customization, authentic ambient presence, tasteful user-triggered notifications and sound.

Canonical public creator launch acceptance remains #325/#333 and does NOT depend on Pilots B–D. Private hosted games have distinct upload/isolated-origin review under #329/#332/#375. These systems must not share confidential owner Lab/RHEN data or invent users or published content.

## 7. Owner review questions (after actual build captures)

- Does the camera and node arrangement feel like an explorable place, or merely a 3D menu? Should opening a Deck reposition the camera first, or open immediately?
- Does the terminal treatment feel distinctively underground/transcosmic or too familiar?
- On the phone, does the 10-node layout remain enjoyable without cramming essential information?
- Should the default homepage eventually become Atlas, or should Atlas remain a premium alternative entrance? **Do not change production default until there is explicit visual approval.**

All visual implementation work must be compared to the currently deployed main site; no silent redesign is authorized.

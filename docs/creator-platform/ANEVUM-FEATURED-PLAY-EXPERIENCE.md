# ANEVUM Featured Project — Discover → Enter → Play

Status: implemented interactive design slice under review, October 14, 2026.
Owner: ANEVUM Creator V1 product, canonical #325, publishing #329, security #332.
Source parent: design/atlas-spatial-navigation-20261013 (Morph V4).
This specification describes real components in the review branch, not authorization to publish arbitrary uploaded games.

## North-star interaction

The featured project becomes **a place visitors can enter**, not a promo banner or carousel of links. The existing single ANEVUM top header remains visible. The content beneath it transforms into a focused world, and exiting returns the user to the homepage's previous place and selected feature.

### Three connected states

| State | Primary action | Truthful data |
| --- | --- | --- |
| DISCOVER, route /atlas | ENTER FEATURED PROJECT | Real approved project title, creator, date and category illustration from the existing public catalogue |
| FOCUS, route /atlas/experience/:id | PLAY or TRY ON CREATOR SITE, or OPEN PROJECT PASSPORT | Real project read, cinematic identity, trusted external host/source, rights/license, costs and disclosed AI |
| EXPERIENCE, route /atlas/lab/orbit-align | START EXPERIENCE | A genuinely playable original first-party Orbit Align puzzle, explicitly separate from uploaded creator content |

If no public projects have been approved, the featured position offers the clearly labeled first-party player prototype instead of fictional submissions. External creator demos stay external unless a future reviewed, isolated player contract specifically supports them. The demo is linked from the focus screen but expressly not attributed to that creator.

## Transition choreography

1. **Homepage to focus (450–650ms):** selecting the featured project changes the content underneath the persistent ANEVUM header. Visual art subtly scales toward the viewer, context and metadata become prominent, and the project takes over the full page. Browser Back is supported.
2. **Focus to player (400–900ms):** an explicit ANEVUM Player Lab link enters the separate first-party stage. Illustration yields to a crisp vector-and-DOM game field. A pre-play overlay explains the rules and waits for a user gesture.
3. **Playing:** three distinct selectable orbital rings. Tap buttons or use keyboard keys 1, 2, and 3 to rotate outer/middle/inner. P pauses. Actual local moves, aligned-ring count and timer are displayed. Victory occurs only when all three ring markers align with north.
4. **Pause / resume / reset:** pause freezes the clock and blocks rotations while retaining the puzzle. Reset returns to deterministic initial positions and clears moves and elapsed time.
5. **Exit:** Exit or Back to Project returns to ANEVUM's homepage. The selected featured item, public catalogue and homepage scroll position persist in the Morph shell.

Reduced-motion mode removes ambient or camera motion. The content remains fully intelligible through static positioning.

## Routes and trust

- /atlas — real featured release, or a visibly labeled first-party demo when the catalogue is empty
- /atlas/experience/:id — one approved public project, with real loading, error and withdrawal states
- /atlas/lab/orbit-align — independent first-party playable lab, not a published creator game
- /atlas/projects/:id — existing public passport and authenticated, authorized engagement
- /atlas/creators/:handle — real creator profile

External demo and source URLs use the existing safeExternal validator. They open in a new tab with noopener and noreferrer. No untrusted creator HTML, scripts, iframes, credentials, or user account information enters the first-party game stage.

Future uploads intended for play **inside ANEVUM** require rights checks, archive scanning, private drafts, staff approval, separate hosted game origin isolated from anevum.com, restrictive browser CSP/sandbox and cross-project isolation. No current prototype represents that release gate as passed.

## Accessibility and quality checks

- Feature/action controls have meaningful labels, focus indicators, touch targets and keyboard equivalents.
- No horizontal overflow at 1440x900, 390x844, or 320x720. Scene scrolls within the full-viewport page region where necessary.
- Play has optional local session state only. No account XP, badge, score upload or invented social activity.
- React Router maintains real browser history rather than simulated page buttons.
- Synthetic fixtures appear only in local Chromium review evidence and are never deployed as real public submissions.
- Pure orbit-align-logic reducer tests prove 10-move completion from the starter state, pause/resume, invalid-action rejection, reset, and replay.
- Browser evidence must check feature -> approved focus -> player start -> pause -> resume -> victory -> replay -> exit across desktop and phone widths.

Next design stages may support actual licensed project thumbnails, voluntary creator credits, bookmarks/last played, creator discussions, and gated IREN curation. Hosted creator JavaScript is a separate reviewed security deliverable.

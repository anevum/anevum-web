# ANEVUM transmission breach

Session: `ANEVUM.WEB.UPDATE.2026-10-15.001.LAUNCH-COUNTDOWN-TRANSMISSION`

Self-contained public landing screen for `anevum.com`, designed to replace the existing isolated Cloudflare Worker markup without promoting `a.anevum.com` staging.

- January 1, 2027, 00:00 EST countdown (client clock, same target as previous Worker).
- Inline resolution-independent ANEVUM mark derived from the existing public favicon geometry.
- Transcosmic/Continuance editorial serif plus monospaced archival typography, ivory, oxidized copper, indigo, violet, silver-blue.
- Breaches display synthetic fragments inspired by the future website, never live staging content, iframes, or external requests.
- Reduced-motion users receive the static experience; motion stops when the tab is hidden. Screen overlays are pointer-inert and aria-hidden.
- External fonts, scripts, images, and API calls are not required.

Files: `index.html` standalone preview, `worker.mjs` Cloudflare Worker implementation. Rendering checked at 1440x900, 390x844 and 360x720; JavaScript browser errors zero. Public deployment requires explicit version promotion if staged as a Worker version.
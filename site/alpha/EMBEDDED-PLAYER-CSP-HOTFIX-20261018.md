# ANEVUM — Embedded Player White-Screen Repair

Date: 2026-10-18
Session: ANEVUM.WEB.HOTFIX.2026-10-18.004.PROJECT-IFRAME-CSP
Status: Deployed; browser-emulation DOM/JS checks passed; on-device Safari confirmation pending.

## User-reported regression

On iPhone, the normal published ANEVUM Single Drift project page showed a blank white rectangle where the embedded game should be, under the Restart / Expand / Share toolbar. The uploaded game worked when opened directly. The project page and native player controls rendered.

## Root cause confirmed

The canonical apex HTML document's Content-Security-Policy was:

```
default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:; connect-src 'self'; font-src 'self';
base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'
```

No `frame-src` directive existed. With `default-src 'none'`, iframe navigation was disallowed by fallback. The child game URL `/api/v1/alpha/projects/<id>/file` was publicly reachable, with status 200 and HTML content, but the parent document did not permit the same-origin frame.

## Production repair

- Created GitHub source: `site/alpha/anevum-native-frame-policy-v001.mjs` on branch `alpha/player-uploader-20261018` of `anevum/anevum-web`.
- Created Cloudflare Worker: `anevum-native-frame-policy-v001`, `UPSTREAM` service binding `anevum-apex-prelaunch-gateway`.
- Production `anevum.com/*` zone route now points to `anevum-native-frame-policy-v001` instead of directly to `anevum-apex-prelaunch-gateway`. Exact route ID: `2659b522a96a435db4aadac49dbea8fa`.
- New Worker passes all requests to canonical apex and changes ONLY HTML responses with an existing CSP and no `frame-src` directive, appending `frame-src 'self'`.
- All original directives are retained, including `default-src 'none'`, `script-src 'self'` and `frame-ancestors 'none'`.
- Existing narrower Cloudflare routes for alpha upload and files, staff, creator assets and public project APIs remain untouched.
- Child's defense-in-depth is unchanged: sandboxed iframe `sandbox='allow-scripts'` WITHOUT `allow-same-origin`, and the returned HTML game's CSP also has `sandbox allow-scripts`, `default-src 'none'`, `connect-src 'none'` etc.

## Verification performed

- Isolated preflight Worker response showed original policy and patched policy, with `frame-src 'self'` present and other directives unchanged.
- A temporary read-only diagnostic route fetched the live frame-policy Worker and confirmed actual deployed response header `x-anevum-frame-policy: v001` and `frame-src 'self'`.
- Direct game file responded HTTP 200 and rendered the Signal Drift start screen in browser rendering.
- Browser-level mobile emulation fetched the game file within the native project page (HTTP 200, correct HTML and child CSP); iframe `load` event fired.
- A temporary proxied copy of that SAME HTML file, with diagnostic postMessage only, reported from inside a sandboxed iframe: document readyState `complete`; dark body background `rgb(7,12,22)`; visible start cover `display:flex`; 'Signal Drift' text present; canvas sized 348×506 by game code, proving scripts and styles executed in the embedded frame on a mobile-size viewport.
- The browser rendering screenshot recognition still sometimes reported a blank white iframe even as embedded document DOM, styles, canvas sizing and load event were verified. This visual recognition conflict is not a pass on real-device screenshot appearance.
- Temporary public diagnostic Worker routes `anevum.com/alpha/iframe-debug*` and `anevum.com/__anevum_frame_policy_preview*` were removed after testing.

## Final iPhone acceptance step

Open the project page in a fresh Safari tab after the header change, or fully reload it so the document receives the new CSP. Verify:
1. The inner game start screen is visible rather than a white blank.
2. Tap `Begin test`, confirm the timer counts down, and steer on touch.
3. Try `Restart` and `Expand` with the player controls.
4. Confirm the rest of ANEVUM remains visually consistent.

If a real iPhone still shows white after fresh reload, treat the issue as unresolved and gather a new screenshot before changing sandbox restrictions. Do not remove `allow-scripts`/opaque-origin safety boundaries or loosen the main page's CSP without direct evidence.

## Rollback

Read current Cloudflare route ownership first. If `anevum.com/*` still points to `anevum-native-frame-policy-v001` and a regression is confirmed, repoint that exact route to `anevum-apex-prelaunch-gateway`. Do NOT touch narrower routes, D1, R2, published game records, staff grants, or review history.

The long-term fix belongs in the canonical apex CSP configuration rather than an extra pass-through Worker. Preserve an explicit `frame-src 'self'` with ANEVUM's isolated player model when consolidating.

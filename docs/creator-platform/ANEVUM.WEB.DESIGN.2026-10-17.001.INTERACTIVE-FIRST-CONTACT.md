# ANEVUM.WEB.DESIGN.2026-10-17.001.INTERACTIVE-FIRST-CONTACT

## Why this rebuild exists

The former live mobile opening devoted most of the first viewport to a large announcement hero, two generic CTA buttons, a faux transmission wave, technical source labels and the empty line "AWAITING FIRST APPROVED RELEASE." That arrangement communicates a placeholder rather than a community a newcomer can join.

The new first contact must **offer an action before explaining the platform**. The purpose is to make visitors curious and give them an immediate route into something real, even when the approved catalogue is just beginning.

## V065 locked experience

An immersive full-frame ANEVUM painting is the active **arrival stage**. Directly underneath are four image-backed entry cards, designed as distinct navigable doors rather than abstract site chapters.

| Entrance | Destination | Intent |
| --- | --- | --- |
| PLAY | `/discover?category=games` | Explore interactive creations and games |
| DISCOVER | `/discover` | Browse the full approved catalogue |
| CONNECT | `/community` | Meet the people and join discussions |
| CREATE | `/studio` | Visit the canonical studio (its existing authentication requirements still apply) |

Visible label: **Find your way in.** Preheading: THE DOORS ARE OPEN.

The active stage changes via its two real preview controls; hovering or keyboard-focusing a door previews that world, and horizontal touch swipe navigates the four previews without overriding normal vertical page scrolling. Tapping a card always opens its real destination. No fake community counts, sample posts, release ticker or synthetic activity.

The initial stage uses the independently exported **1536px and 768px raster assets** already carried by the Creator V1 repository, with local `CosmicIllustration` fallbacks if an asset is unavailable. Native image resolution, object-fit, keyboard focus, semantic link labels, reduced-motion/transparency, forced-colors, lazy loading and mobile-sized navigation touch targets are explicit. The old V008 modules and V014 world-grid remain in source for historical comparison, not mounted in the opening screen.

Approved, verified public records may follow the arrival as real member forums and project/creator feeds. These are always from the existing public APIs. The only optional stage project highlight links to an actual approved result. No changes to account credentials, D1, R2, moderation, upload capabilities, Stripe, level awards or private member state.

## Release status

**Source candidate:** `design/interactive-first-contact-v065-20261017-001` -> `build/evolution-miniature-native-webgl-v062-20261017-011`, PR #482. It does **not** auto-publish to `anevum.com`.

**Production as of implementation:** the existing apex gateway and separate V064 CSS overlay still serve the old compiled React bundle. The updated first-contact frontend requires a separately guarded, pinned-asset publication after the browser verification gate passes. Do not claim the page is live merely because PR #482 merges.

## Acceptance gate

- TypeScript/React build and the `test:visual-v065` source regression suite
- V007 synthetic offline browser QA verifies the four destinations, rendered identity badges, preview cycling, and mobile-first door visibility
- V012 synthetic offline QA verifies all prior public/member routes at 1440, 1024, 390 and 320px, and tests the new HD portal image resolutions, first-viewport nav, route titles and links
- V041 canonical forums browser checks, privacy boundaries and the read-only live signup canary
- On eventual production publication, independently verify `anevum.com/` first paint, working links, viewport overflow and 390px interactions, exact asset hashes, authentication and profile preservation, and rollback to last known good asset bundle

Keep the responsive visual acceptance distinct from live user signup, payments or publication permission testing.

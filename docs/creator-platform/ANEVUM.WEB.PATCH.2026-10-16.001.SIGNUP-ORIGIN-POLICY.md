# ANEVUM.WEB.PATCH.2026-10-16.001.SIGNUP-ORIGIN-POLICY

Continuation of V028 member onboarding and walls. Source baseline `df5b16fc47315f6ee07cdbc917c9abfbd49bca5d`; staging Worker baseline `965c0aa9-9d40-47aa-84f5-1bd15b55cf12`.

## Standards-based cause under verification

The HTML response uses `Referrer-Policy: no-referrer`. Both canonical profile and space clients explicitly use Fetch `mode: "same-origin"`. Under the Fetch Standard's append-Origin algorithm, a non-GET request in a non-CORS mode inherits no-referrer and serializes its Origin as the literal `null`. The canonical API then correctly returns 403 because it requires the exact staging Origin. Better Auth's default CORS-mode requests are not affected, explaining why email sign-in could succeed while claiming a profile failed.

Source: https://fetch.spec.whatwg.org/#append-a-request-origin-header . This is an implementation-policy conflict, not grounds to allow null Origin or remove CSRF checks.

## Fix

Set `referrerPolicy: "same-origin"` on both canonical fetch clients. Relative route allowlists, same-origin mode, cookie scope, redirect rejection and server exact-Origin defenses remain intact. The page retains no-referrer for external navigation.

Allow `blob:` only in the document's `img-src`, so locally selected images can load into the crop canvas. Script/connect restrictions remain unchanged. Clarify the First Signal description: saving a private wall entry does not publish it.

## Verification

Regression tests keep null/missing/foreign Origin rejected and require corrected options in both fetch paths. CI runs an isolated loopback HTTPS browser regression against the actual compiled application, real Better Auth engine and in-memory SQLite. It records Chrome's old-policy behavior, requires WebKit's old null Origin and both engines' corrected real Origin, then drives OTP verification, unique profile claim, two cropped raster uploads, biography save and first wall entry. Screenshots/overflow/decoded-image checks cover 1440, 390 and 320 CSS-pixel widths.

All test identities and OTP delivery are synthetic and local to CI. No real emails are sent, member cookies accessed, account records edited or handles claimed by verification. Staging release retains the existing signup/provider configuration and live account sessions; no migration or apex deployment is needed.

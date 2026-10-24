# Living Commons continuation 008: Quick Navigator

Session: `ANEVUM.WEB.BUILD.2026-10-23.008.LIVING-COMMONS-QUICK-NAVIGATOR`.
Baseline: PR #679, `6fd78935d7392f0a1ccffff102d452f2d7137402`.
Status: SOURCE REVIEW ONLY. Default-off, unmerged, not deployed. Prior #655 V131 approval does not authorize NEXT publication.

## Implemented

The existing review now includes a searchable, native-modal Quick Navigator. Its 13 fixed destinations comprise the three existing Commons views, eight canonical disciplines and the public Discover/creator directories. These are navigation targets, not invented members, projects, social activity or privileges. Search is local and uses the existing bounded normalization. Existing project and creator filters survive directory navigation.

Ctrl/Cmd+K and the visible button open the panel. Arrow keys, Home/End, Tab and Enter navigate; Escape or Close cancels. Cancellation returns focus to the invoker, while selection lets the existing page and Shell focus the destination. IME composition, repeated shortcut keys, contenteditable/textarea surfaces and other active modals are protected from shortcut interception. A clear-search action recovers from no matches. The existing OrbitalMark is reused. No additional IREN is mounted.

The modal uses scoped responsive styling, at-least-44px controls, a 16px search field, small-screen and short-height rules, reduced-motion and forced-colors support. Optional entrance animation follows the page's pause/visibility/OS state. Public result sections now expose `aria-busy` while loading. Existing API authorization, privacy, moderation, account ownership and earned-recognition sources are unchanged.

## Verification requirements

The read-only review workflow checks the exact PR head, all prior 24 model/source checks plus five new navigator source contracts, React TypeScript and both default/flagged builds. The default build must contain neither the Commons nor navigator markers. The flagged build must contain both.

The prior 37-check compiled React browser suite is preserved unchanged. A new independent loopback-only navigator suite runs in Chromium and WebKit with synthetic public responses, rejecting unknown/private APIs, external requests and mutation methods. It covers 1440x1000, 390x844, 320x720 and 390x460 layouts at 2x pixel density; modal geometry, touch targets, keyboard/focus recovery, filtering, IME, history, real public route destinations, competing modals and reduced motion. Captures identify synthetic data and are not production screenshots. Actual pass counts and artifacts must be read from the new CI run, not inferred from this document or the previous commit.

WebKit automation is not a physical iPhone Safari or screen-reader acceptance test. Those checks and owner visual review remain open under #335. Keep the existing OV03 frozen foundation guard unchanged; its cumulative-stack failure is not waived by the Commons-scoped checks. Creator Studio #658, public surfaces #667, migration 0014, XP changes and production configuration remain excluded.

## Design references

Native dialog behavior follows W3C H102 and the WAI-ARIA modal pattern. References verified October 23, 2026:
- https://www.w3.org/WAI/WCAG22/Techniques/html/H102
- https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal

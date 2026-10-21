# ANEVUM IREN — Spatial Companion and Non-Modal Onboarding

**Session:** ANEVUM.IREN.DESIGN.2026-10-20.001.SPATIAL-GUIDE-ONBOARDING
**Decision:** APPROVED DESIGN DIRECTION (user selected the combined product specification and implementation plan on 2026-10-20).
**Engineering status:** SPECIFICATION ONLY. No application changes, build artifacts, production flag changes, account permissions, deployment, or acceptance claims.
**Repository baseline reviewed:** release/v084-continuance-approved-20261019, after merged V095/V096 source and release-evidence checkpoint.
**Related:** V080 guided tour, V087 compact scout, V088/V089 articulated living rig and contextual gestures, V092 first-contact, V095/V096 frozen production candidate, standalone IREN Signals.
**Implementation plan:** companion document ANEVUM.IREN.PLAN.2026-10-20.001.SPATIAL-GUIDE-IMPLEMENTATION.md.

## 1. Product decision and problem

IREN is one persistent, animated Continuance Institute field companion, not a traditional onboarding modal with a robot decoration.

Real iPhone Safari feedback on an ordinary-member onboarding tour showed a large bottom-aligned tutorial card blocking the page the guide describes. The live component's mobile rule for the guide card reserves up to 57dvh; mobile unconditionally embeds the 3D rig in the card header. The guide layer uses click-intercepting shade quadrants and role=dialog / aria-modal=true, with a focus trap. These were intentional early presentation choices, but they now contradict the required spatial-companion behavior.

Replace the tour **presentation** while preserving tested underlying mechanisms: the existing seven member lessons, three visitor lessons, authoritative member privacy and recognition statements, exact real-page data-iren-anchor selectors, stored tour progress, notification Signals, one companion, animated V088/V089 WebGL rig and SVG fallback, reduced-motion controls, manual drag/reset, and first-contact deference while visitors are typing.

### Product principles

1. **Show, do not conceal.** The actual target must remain in view and usable; never cover it with IREN or a tutorial panel. Do not blanket-dim or disable the page.
2. **IREN moves, looks and gestures.** The character is the presenter; the text is a small attached speech bubble, not a freestanding guide screen.
3. **One thought at a time.** Two short lines of teaching copy by default. Expanded explanation requires a deliberate tap.
4. **User agency.** No forced walkthrough. Clear Start, Next, Back, Skip, Pause/Resume, and Hide. Normal page use remains possible.
5. **One real guide.** Reuse canonical IrenGuidedContinuance and IrenLivingCanvas/IrenLivingRig; no second dock, separate account state, reward engine, assistant API, or impersonated model.
6. **Deliberate animation with quiet idle.** Motion communicates destination, explanation, curiosity, and confirmation. No perpetual intrusive flight, sound, attention traps, or fake celebrations.
7. **First-rate phone ergonomics.** iOS safe areas, Safari's dynamic bars, on-screen keyboard, portrait/landscape, reduced motion, VoiceOver, and narrow screens are first-class.

## 2. Interaction model

### A. Ambient companion

- Default: compact 48–60px visual affordance near a safe screen edge, using existing V088 rig with V087 SVG fallback. Existing drag/restore preference remains honored.
- Quiet breathing, gaze, blink, tiny thruster and observatory-ring activity; low-power rest after inactivity. No speech bubble unless contextual guidance is appropriate and permitted.
- Tap opens existing Guidance / Signals. The large help utility may remain as an explicitly opened reference panel, but never masquerades as an onboarding bubble.
- Notifications use existing server-authoritative unread Signals; the guide never grants XP or reads private content in a guest session.

### B. First-contact invitation

- On eligible first visit, after the existing visibility/editing/dialog checks, IREN turns toward the visible page, drifts into a non-obscuring safe position, waves, and displays: "I'm IREN. Want a quick look around?"
- Inline actions: **Show me**, **Not now**, and **More choices**. More choices reveals existing Explore creations, Make something, Meet the community, and full guided tour pathways. No autofocus or autoplay audio.
- Not now remembers the dismissal as an existing first-contact preference and leaves the tiny helper available; do not re-prompt each visit.
- Registration onboarding can offer the same guide through the existing anevum:member-created event, without resetting guest progress or auto-overwriting forms.
- Auto-invitations do not navigate routes or reposition focused inputs.

### C. Guided tour

- Starting the tour is explicit. Keep the **existing seven-member** and **three-visitor** lesson IDs, routes, selectors and semantics in the first patch to avoid functional regression.
- At each step, reveal or scroll the actual anchor into a safe content band, outline it with a subtle cobalt/amber spotlight, and position IREN near it. IREN turns gaze toward and points at the target.
- A compact speech bubble is visually tethered to IREN. Default wording uses a short label and one plain-language explanation, plus Next/Back/Skip and an optional **More** disclosure.
- The target stays clickable and keyboard-accessible. If clicked, pause the tour without stealing the action. Non-target page interactions stay available; guide can pause while users explore.
- Route transitions happen **only after an intentional tour navigation action**. During transitions, show the small travel pose while route loading and anchor measurement settle. No auto-routing from a mere first-contact greeting.
- If the anchor is absent, outside the rendered flow, hidden by a different permission, or blocked by page loading, display a compact, truthful fallback ("I can't highlight this part yet") and offer Next/Skip. Never invent a target or expose hidden content.

### D. Context help

- The current deterministic station mapping from irenStationForPath stays authoritative. On page entry, IREN may unobtrusively offer a one-time relevant tip near the feature, bounded by existing greeting/motion/dismissal preferences.
- No interruption during typing, dialogs, uploads, gameplay, payment, media playback, or critical staff/review decisions.
- No semantic claim of a live LLM. "Ask IREN" expands deterministic help content and known site routes only until a separately authorized assistant integration exists.

### E. Emotional language and motion

- **Idle:** suspended rest, blink, occasional gaze.
- **Greet:** turn to viewer, small wave, attentive expression.
- **Travel:** smooth arc or short glide toward the next visible anchor; do not cross or occlude controls.
- **Guide:** settle beside the target, point with an arm and look at the highlighted control.
- **Curious:** lean/look when user opens Help or focuses a control.
- **Think:** short pause and subtle orbit, not a loading promise for a network service.
- **Notify:** quiet signal reaction, existing unread badge; no fake XP.
- **Celebrate:** only on authenticated new server-verified achievement events.
- **Rest:** low-motion presence after inactivity.
- Stagger actions: arrive → gaze → point → speech bubble. Avoid simultaneous bobbing and rapid position changes that make text hard to read. Never move a bubble while its text is being tapped/read.

## 3. Mobile spatial layout contract

Screen coordinates must be based on visualViewport (including offsetTop/offsetLeft where supported), safe-area insets, the measured bubble, the measured IREN sprite, header/navigation exclusion zones and the real target rectangle. Recalculate on scroll, resize, orientation change, zoom, keyboard resize, route/anchor changes and ResizeObserver activity. Bound requestAnimationFrame scheduling to avoid thrash.

Preferred placement:
1. Put IREN immediately beside a target when free space permits; speech bubble on the side facing away from the target.
2. For a full-width target, place IREN just above or below, with the bubble offset into a free content band.
3. For narrow or small screens, allow IREN to shrink to a compact guide pose at a safe edge, connected to target by a short beam/arrow; **do not embed the character in a giant bottom modal**.
4. If no placement leaves the highlighted target and two controls readable, collapse the bubble to a one-line tip chip near IREN with an explicit Expand action. Do not force a giant panel.

Nominal **design targets** (validate rather than assert achieved):
- 320/390px viewport: body/face 64–88px while active; 48–60px idle.
- Bubble default width 220–280px within side margins and 24–32px clearance from UI edges. Bubble aims to occupy no more than roughly 24–30% of the **visual** viewport height; preferred default 140–175px, overflow only on user-expanded More.
- Text: concise sentence(s), readable at approximately 13–14px with at least 1.45 line-height; adequate contrast against midnight/navy translucent glass.
- Interactive tap targets at least 44×44 CSS pixels when an accessible touch target needs that footprint.
- Spotlight padding roughly 6–10px. Light, translucent surround only; ordinary content must stay sufficiently visible.
- Do not cover the highlighted control, Safari bars, Wayfinder, keyboard, upload buttons, dialog buttons or navigation.
- In motion reduction or low GPU mode, use an instantaneous/short fade and static SVG pointing beacon instead of forced travel animation.

The visual is premium Continuance Institute: near-black/steel materials, luminous cobalt optics, restrained warm accent for focus, clean microtypography, soft local glow, and physically legible directional gesture. High-detail presentation is welcome, but motion clarity and mobile responsiveness take priority over shader spectacle.

## 4. Recommended first-person copy

| Existing step | Compact IREN line | Optional More detail |
| --- | --- | --- |
| Identity | "This is your space. Your profile and introduction begin here." | Explain the player card, handle and editable member space. |
| Progress | "Your XP and awards come from real activity." | Explain verified recognition and unrevealed locked Evolution of Everything specimens. Never preview locked artwork. |
| Privacy | "Your wall begins private. You choose what others see." | Explain publication and profile visibility controls. |
| Studio | "This is Creator Studio. Make privately; publishing needs review." | Explain build/preview/review boundaries and guest alpha limitations. |
| Discover | "Find games, apps, art and other approved projects here." | Explain categories and approved public project playback. |
| Community | "Meet the makers and explore real conversations." | Explain moderated posts and public creator spaces. |
| Navigation | "The Wayfinder takes you around ANEVUM. I'm here if needed." | Explain Search, player card and the compact IREN reopening affordance. |

Do not rewrite actual permission or published-project truths to be more attractive. Empty listings remain real, never synthetic examples.

## 5. Keyboard, assistive technology and safety

- The tour bubble is **not modal**: no aria-modal=true, no tab trap, no blanket pointer interception. Use a named complementary/region/group container with concise step and progress label, buttons accessible by keyboard and screen reader.
- A user-initiated Tour may focus its first action, but unsolicited greeting must never steal focus. Restore focus to the initiator/dock on explicit Close, if still mounted. Don't forcibly focus Next on each auto-advance.
- Keyboard Back/Next and Escape may preserve existing shortcuts if they do not conflict with forms; Tab must traverse normal page controls. Announce new step text once via restrained aria-live, not character motion.
- Respect prefers-reduced-motion, explicit Pause animation, forced-colors, high-contrast, reduced-transparency and WebGL context loss. SVG fallback retains pointing/target indication and all functions.
- Keep actual reward, moderation, privacy, staff and publishing authority server-derived. No new session, schema, D1/R2 writes, account grants, LLM API, analytics identity joins, cross-origin executable content or user-upload permissions.
- Avoid unsolicited motion on games, active uploads, input focus and critical review forms. Tour shouldn't mask keyboard/VoiceOver interaction.
- Honor legacy storage keys for tour progress, hidden helper, motion pause, drag position and V092 first-contact state. If a future migration is required, upgrade without re-triggering already-dismissed onboarding.

## 6. User story

A visitor sees ANEVUM, then a small 3D IREN glides into an unoccupied corner and quietly asks whether to show the site. Selecting **Show me** highlights the actual Search/Wayfinder or first tour feature. IREN moves toward the highlighted UI, turns, points, and says one short sentence. The user can tap the real interface element, move to another step, ask for more, or dismiss IREN. On returning, the guide remains quietly available at its last safe dock location. It never becomes a giant overlaid onboarding card.

## 7. Definition of done

1. Actual iPhone Safari shows most of the page during each tour step; no full-width bottom card or click-catching shade. The highlighted target remains visibly uncovered and usable.
2. IREN physically moves between at least three distinct actual anchors on mobile, changes gaze and points, with WebGL where available and a working static-vector fallback.
3. Speech bubbles remain attached to the character, stay inside visual viewport safe bounds, fit short text, and provide Next/Back/Skip.
4. Member and visitor lessons, first-contact behavior, dismissal/resume, Signals, storage preferences, authenticated privacy and reward boundaries are preserved.
5. Keyboard/VoiceOver, 320/390/768/1440 responsive, zoom, landscape, reduced motion, motion pause, Safari toolbar changes and GPU context loss pass review.
6. No source from this new design is slipped into the frozen V095/V096 0%-traffic candidate; a later isolated candidate receives its own source lock, CI, real-account testing, iPhone Safari acceptance and explicit release authorization.

**Document status:** Adopted product/UX direction, not a claim of completed engineering or deployed behavior.

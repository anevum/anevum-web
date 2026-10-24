# ANEVUM CONTINUANCE NEXT — Motion-rich Community and Profile System

Session: `ANEVUM.WEB.DESIGN.2026-10-23.004.MOTION-ATELIER`
Status: **VISUAL CONCEPT + ISOLATED FRONTEND SOURCE; NO MERGE, NO RELEASE, NO ACCOUNT INTEGRATION.**
Authority: GitHub issue #325 (engineering); #335 (owner design acceptance); #655 (V131 protected release). Existing NEXT foundation #676 and Community concept #677. Original Community/public member routes remain in force.

## Creative decision now presented for owner review

Build ANEVUM's own collectible-but-not-pay-to-win *profile atmosphere system*: identity should feel expressive and animated, like entering a small personal world. The reference is the customizability and delight of modern community platforms, especially Discord's avatar decorations, profile effects, banners, themes, and live preview—not its literal UI, assets, icons, naming, monetization or layout. See [Discord Custom Profiles](https://support.discord.com/hc/en-us/articles/4403147417623-Custom-Profiles) (updated March 2026) and [Discord profile design article](https://discord.com/blog/how-to-customize-your-discord-profile) (February 2026).

Preserve Orbital Underground's asymmetrical orbital mark/core, near-black, warm bone, restrained copper/violet, creator-culture spirit and existing earned-artwork program. The prototype is a **material visual proposal**. Approval is needed before it replaces real Community/profile pages. First review at 1440px desktop, then 390px mobile, per #335.

## New interaction experience

1. **Community entrance**: hero orbital environment, human-centered promise, explicit paths to join a moderated discussion or explore published work; animated spatial rings and gentle light. Any feed is real, approved content only. No invented member counts, typing indicators, presence or social proof.
2. **Signal board**: approved project release and discussion cards have distinct labels, gentle hover elevation, accessible focus; project artwork and source/host credentials remain trusted from canonical APIs. Filtering and search preserve actual query state. Avoid animating every card on scroll when it harms reading.
3. **Identity mini cards**: click a real public author to show a compact version of their selected theme and avatar decoration, then an explicit link to their authorized public world or creator channel. Focus trap/close/return tested locally. No private account enumeration.
4. **Public member world**: a deep, artistic cover, avatar decoration, nameplate, owner-selected appearance, copy-first introduction, public wall, released work and *verified* earned artwork. Public/private boundaries remain server-authoritative; wall failures remain separate from profile visibility.
5. **Creator channel**: same composition grammar with work-first hierarchy. Release provenance, updates, source/play destination and collaborator credits must remain accurate. A creator channel is not silently treated as the same object as a canonical member profile.
6. **Private Profile Atelier**: identity writing, five atmospheres, four generative covers, four avatar frame styles, four nameplates, custom accent, three entrance effects and real motion controls. All choices update an immediate preview. A visitor-preview switch never publishes; a real backend adapter will require deliberate separate owner authorization.

## Motion choreography matrix

| Surface | Trigger | Primary animation | Practical envelope | Accessibility fallback |
|---|---|---|---|---|
| Community arrival | First visit, navigation | Orbital atmospheric float / diffuse light | Slowly looping, 11–45 seconds | Static layered composition |
| Community cards | Hover/focus, filter | Small elevation and surface highlight | ~220–500ms; no vertical feed jumps | Strong static focus/border |
| Mini identity card | Click author | Modal opacity and 20px translate/scale | ~500ms max, no audio | Immediate dialog/focus |
| Profile cover | First entrance | Orbital zoom/reveal / starfall / aurora wake | 0.7–1.4s one-shot | Instant complete content |
| Profile atmosphere | Visible, motion Full only | Low-frequency transform + opacity loops | 10–45s; pause when document hidden | Static gradient + orbital silhouette |
| Avatar decoration | Card/profile visible | Tiny sparkle/breathing satellite | ~3–5s, nonessential | Static metallic frame |
| Nameplate | Theme selection | Material/tone swap | <300ms optional | Immediate outline/colors |
| Profile tabs | User selection | Content fade + short 8–24px movement | 180–350ms | Instant panel with clear ARIA-selected |
| Composer and receipts | Explicit action | Sheet/dialog enter and typed status | <500ms; focus restored | Immediate dialog/status |
| Studio/editor controls | User selection | Immediate live preview; one-shot replay button | No unexpected intro retrigger on typing | Instant preview |

Avoid autoplay sound, continuous text movement, scrolljacking, compulsory animation, infinite loops of large filters, cursor gimmicks over forms, GPU-only content, visual-only status, and hidden release states. Users can choose Full, Gentle or Off. `prefers-reduced-motion: reduce` wins even if Full was selected. Pause effects on `visibilitychange`; consider battery/data saving and `prefers-reduced-data` where available.

## Appearance vocabulary (finite; no arbitrary CSS from users)

- Atmospheres: **Origin** (lilac/copper), **Cinder** (ember), **Halo** (pink/lilac), **Glacier** (cyan), **Verdant** (jade).
- Cover compositions: **Nebula**, **Horizon**, **Aurora**, **Signal grid**.
- Avatar frame: **Orbital**, **Comet**, **Radiant**, **Minimal**.
- Nameplates: **Iridescent**, **Copper**, **Signal**, **Plain**.
- Entrances: **Orbit reveal**, **Starfall**, **Aurora wake**, **None**.
- Intensity: **Full**, **Gentle**, **Off**.
- Custom accent: six-digit hex only; never overwrite reading copy/contrast defaults.

The prototype's visual surfaces use CSS custom properties, gradients, SVG geometry, `transform`, opacity and finite `@keyframes`; no external requests, build-time fonts, WebGL, Rive runtime, copyrighted artwork, or third-party image services. This is not a claim that every effect is GPU-cheap: device profiling, layer count, offscreen pause and thermal checks are release gates. Keep production ambient DOM count lower than the 52 illustrative prototype stars (prefer ~16–24 or a sprite texture only if evidence requires it).

## Technical approach for the actual React app

Keep the existing React 19, Motion 13.x, Router and Vite stack. Reuse `motion/react` for route/shared-element layout transitions, bounded `AnimatePresence`, entrance choreography and `useReducedMotion`. Prefer CSS/WAAPI for ambient transforms. This is compatible with Motion's documented layout animation through `layout`/`layoutId`: <https://motion.dev/docs/react-layout-animations>. Do not add GSAP, Rive, Three.js, WebGPU or a new shader engine just to advertise technology. Consider additional libraries only if a measured outcome cannot be achieved with the existing stack.

This package includes `engineering/profile-appearance.ts` (finite typed contract, revision and value validation), `engineering/ProfileAtmosphereReview.tsx` (unmounted React+Motion review component), and `ProfileAtmosphereReview.css` (strictly prefixed selectors). Keep these isolated and review-only. Do not import global prototype CSS into `App.tsx` or `main.tsx`, and do not mount a second IREN. The React component is syntax-checked, **not full repo typechecked** because React/Motion dependencies are not installed in the local container.

### Data and privacy integration boundaries

- `/community`: `CommunityPage.tsx`; use `readCommunityPosts`, `readProjects`, `readCreators` and explicit feature availability. Cards must show only moderated public records.
- `/community/posts/:id`: `CommunityPostPage.tsx`; read approved post/replies, use existing authenticated/member mutation APIs for review requests and revision-checked reactions. Never claim simulated submission persisted.
- `/creators/:handle`: existing `CreatorPage`, `resolveCreatorRoute`; only approved work and optional verified public creator recognition.
- `/@handle`: `Phase1PublicMemberPage`, `canonicalPublic`, public member space/wall; server decides identity exposure. Do not expose account state, drafts, pending replies or hidden roles.
- `/member`: existing private editor (`Phase1MemberPage`), Better Auth, `canonicalMe`, `canonicalClaim`, `canonicalEdit`; claim private-first and verify against authoritative revision before any public change.
- Proposed optional appearance payload is a separately versioned preference object and **not** part of canonical API yet. It needs approved schema, server validation, owner check, revision conflict handling, privacy/legal review and safe migration/rollback. Do not activate migration 0014 as part of profile appearance.
- Any uploaded banner/avatar should use approved image-only formats, byte/pixel/size limits, orientation normalization, isolated image resizing, explicit moderation and image CDN; reject embedded scripts/SVG/HTML. Animated uploads require transcoding, a static fallback and user motion preference respect. No arbitrary CSS/JS injection.
- Decorations awarded through verified achievements must be authenticated as entitlements by the server; generic visual choices must never counterfeit awards, staff verification, privileges, paid benefit or ranking.

## Owner review checkpoint

The recommended direction is **expressive but functional**: profile backgrounds and mini-cards have cohesive animation; navigation, discussions and editing stay readable. Review `evidence/atelier-1440.png`, `community-1440.png`, `member-390.png`, and animated walkthrough first. The main creative decision is whether the larger planetary cover and decorative nameplates strike the desired balance of original/immersive versus too game-like. If approved, carry the chosen visual parameters into bounded React integration; independent CI/privacy/API/production gates stay open.

## Verification status

- 91/91 local standalone Chromium checks: 24 layout tests (four views × six widths), interactions, accessibility controls, no uncaught runtime exceptions or network requests.
- 11/11 pure typed appearance model tests under Node after strict TypeScript compile.
- React review component TypeScript/TSX syntax transpilation passed; this is **not** pinned dependency typechecking or a production React build.
- Eight actual 1440/390 full-page captures, 2x DPR. 9.76-second WebM/MP4 animated walkthrough recorded from local Chromium.
- Not verified: physical iPhone Safari, screen-reader acceptance, reduced-data support on all devices, production CWV/battery profiling, real moderation/accounts/publication, React CI, feature-flagged integration or release.

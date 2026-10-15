# ANEVUM V009 — unified cinematic creator and community website
Session: ANEVUM.WEB.BUILD.2026-10-14.001.UNIFIED-CINEMATIC-EXPERIENCE
Date: 2026-10-14
Authority: owner request to fully redesign the website; locked October 14 five-view cinematic reference; #325 and #335.
State: source implementation for visual review. NOT owner visually accepted, merged, deployed, or production authorized.

## Scope
- Keep the current React Creator V1 public API, sign-in gates, project and creator routes, staff review, earned XP, and real activity semantics.
- Consolidate competing public navigation planes into one sticky top header, native full-screen-but-bounded Menu dialog, search/quick switch, and responsive directory.
- Keep one consistent wide canvas on all public/member pages; no fixed mobile dock, enormous dropdown, personal portfolio, or public RHEN promotion.
- Make the homepage a live, truthful public index wrapped in high-resolution cosmic scene artwork. Provide four genuine illustrated portal gateways, each linking to a real filtered catalogue.
- Connect community posts to creator identity cards, improve full-width phone reading order, and unify project, discovery, creator, achievements, community, and account surfaces.
- Continuance Institute/Transcosmic influences are typographic/editorial only, not presented as a public ANEVUM sub-brand. Shared serif/sans/mono hierarchy.
- Controls: rounded layered glass, physical press states, 44px-or-larger touch targets, readable labels, focus states, reduced-motion and forced-color options.
- Keep published data sourced from public APIs; no invented projects, followers, levels, votes or comments.

## Source + review order
Source branch is stacked on review-only V008 Live Signal; it is not directly mergeable to production without reconciling #388, #392, #394 and the independent identity line (#397, #403).
1. Run Creator V1 npm verification / TypeScript / both Vite builds on exact head.
2. Capture actual compiled Home, Discover, Community, Project, Creator, Levels and Member pages at 1440, 1024, 390, 320px. For routes needing content use labeled *isolated synthetic QA fixtures*, never deployed as public content.
3. Inspect 200% zoom, keyboard navigation and Escape/focus return for native Menu; motion-reduction, slow art loads and broken/public-empty states.
4. Owner visual review of Home + community/profile cards first, then page family. Record accepted / requested changes against the exact screenshot and SHA.
5. Only after owner acceptance and existing release gates, independently authorize **staging** integration. \`a.anevum.com\` remains the existing V006 read-only staging site until then.
6. Keep \`anevum.com\` the January 1, 2027 launch/maintenance page; no public signup, D1 migration, OAuth activation, RHEN exposure or production promotion.

## Limits
This changes the visible React interface only. The user-selected equipped-artifact / chosen earned-award backend proposals (#397/#398) remain separate, unmerged review branches and must be reconciled before those badges can be shown as genuine member-selected records. Category illustrations are platform artwork, not creator-submitted project thumbnails.

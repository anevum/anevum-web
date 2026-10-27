# ANEVUM website — active V136 guidance

> **V137 current-stage public presentation (October 27, 2026):** On branch
> `build/stage-focused-severance-site-20261027-001`, also read
> `docs/production/ANEVUM.WEB.UPDATE.2026-10-27.001.STAGE-FOCUSED-SEVERANCE-SITE.md`.
> The public front door now prioritizes the independent studio and
> TRANSCOSMIC: SEVERANCE design/prototype, while retaining all existing
> account, Creator Studio, community, moderation and staff routes. This is
> a review-only candidate and does not supersede the sealed V136 production
> release authority, immutable asset checks or feature-permission boundaries.
>
Before implementing website, Community, Discovery, Creator Studio, public
profiles, member spaces, visual assets or WebGL interface changes, read
`docs/production/ACTIVE-V136-WEB-OVERHAUL.md` from the repository root.
That document and `docs/production/ANEVUM-MASTER-CONTINUITY.md` identify the
current baseline and draft integration; inspect exact ancestry before editing. Work from the existing current source tree and approved
reference boards; do not restart prior work or infer release acceptance.

- Prioritize **working UI/UX parity** with the approved October 24 V136 concepts
  over speculative 3D material changes, extra backgrounds or filler artwork.
- Never add ANEVUM-owned generated decorative artwork to public screens.
  A genuinely uploaded creator image, real project cover, or actual member
  media is **not** filler and must be preserved.
- Use `ProjectThumbnail` for work media. Verified uploaded browser-package
  cover first, first-party SVG default for the actual category if missing or
  invalid. The older public Project DTO has no approved cover API yet.
- Preserve member privacy, author permissions, moderation, upload and
  public visibility contracts. Preserve the avatar/banner image fallbacks and
  server-sourced earned rewards/levels. Never invent public creator records.
- Maintain real Studio file operations, editor focus, live preview, WebGL,
  Wayfinder navigation, reduced-motion and accessible keyboard controls.
- Test real compiled DOM and screenshot flows at desktop and phone widths.
  Do not weaken exact-head assertions because historic tests mention art
  that has intentionally been retired; replace stale expectations with
  equivalent real UI verification.
- Owner authorized merging and controlled deployment on October 25 in the
  unified session. #738 is merged into the existing website development branch.
  Release through the existing frontend-only package/preflight process; preserve
  exact backend bytes, bindings, private publication gates and rollback versions.
  Private QA geometry/video flags remain forbidden in release. Newly reviewed
  UI paths require their exact pinned blobs; do not grant directory-wide access.
- Open Signal #736 is explicitly included only in the unified integration draft;
  its original sibling branch and all release/publication gates remain unchanged.

At each substantial increment, update the active handoff and main PR #735
with what was implemented, tested, remaining, and the exact commit SHA.

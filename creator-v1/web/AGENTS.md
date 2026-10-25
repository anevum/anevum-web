# ANEVUM website — active V136 guidance

Before implementing website, Community, Discovery, Creator Studio, public
profiles, member spaces, visual assets or WebGL interface changes, read
`docs/production/ACTIVE-V136-WEB-OVERHAUL.md` from the repository root.
That document is the versioned current handoff for the consolidated draft
overhaul in PR #735. Work from the existing current source tree and approved
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
- This is still a **draft**: no main/production merge, traffic change,
  new release capability or relaxation of QA-only WebGL flags/allowlists.
- The sibling Open Signal PR #736 is not silently merged into this work.

At each substantial increment, update the active handoff and main PR #735
with what was implemented, tested, remaining, and the exact commit SHA.
